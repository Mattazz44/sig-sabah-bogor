<?php

namespace App\Services;

use App\Models\SpatialQuarantine;
use App\Models\TouristSpot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SpatialBoundaryService
{
    private const EPSILON = 1e-11;

    /**
     * Cache data batas poligon di memori per path file agar validasi berulang berjalan <0.1ms.
     *
     * @var array<string, array{polygons: array, bbox: array, geojson_2d: string}>
     */
    private static array $boundaryCache = [];

    private static bool $loggedMissingWarning = false;

    /**
     * Reset in-memory cache (berguna pada unit/feature test saat mengganti config path).
     */
    public static function clearCache(): void
    {
        self::$boundaryCache = [];
        self::$loggedMissingWarning = false;
    }

    /**
     * Daftar lokasi file GeoJSON batas wilayah yang diperiksa secara berurutan.
     *
     * @return array<int, string>
     */
    public function getCandidateBoundaryPaths(): array
    {
        return array_values(array_filter([
            config('gis.bogor_boundary_path', database_path('data/bogor_boundary.geojson')),
            config('gis.bogor_boundary_fallback_path', storage_path('app/gis/bogor_boundary.geojson')),
        ]));
    }

    /**
     * Mengembalikan path file GeoJSON batas Kota Bogor yang aktif digunakan (jika ditemukan).
     */
    public function resolveBoundaryFilePath(): ?string
    {
        foreach ($this->getCandidateBoundaryPaths() as $candidate) {
            if (is_string($candidate) && $candidate !== '' && is_file($candidate) && (int) @filesize($candidate) > 0) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * Mengecek apakah titik (latitude, longitude) dalam WGS84 (EPSG:4326) berada di dalam batas Kota Bogor.
     * Menggunakan PostGIS/MySQL ST_Within bila tersedia, dengan fallback deterministik Ray-Casting + Boundary Segment Check.
     */
    public function isWithinKotaBogor(float $latitude, float $longitude): bool
    {
        if (!is_finite($latitude) || !is_finite($longitude) || $latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            return false;
        }

        $boundary = $this->loadBoundaryGeometry();

        // Fallback darurat bila file GeoJSON batas Kota Bogor belum tersedia di disk
        if ($boundary === null) {
            $bbox = config('gis.fallback_bbox', [
                'min_lat' => -6.6850,
                'max_lat' => -6.5050,
                'min_lng' => 106.7300,
                'max_lng' => 106.8550,
            ]);

            return $latitude >= (float) $bbox['min_lat']
                && $latitude <= (float) $bbox['max_lat']
                && $longitude >= (float) $bbox['min_lng']
                && $longitude <= (float) $bbox['max_lng'];
        }

        // Fast O(1) Bounding-Box rejection sebelum kalkulasi geometri penuh
        $bbox = $boundary['bbox'];
        if (
            $longitude < ($bbox['min_lng'] - 1e-7) ||
            $longitude > ($bbox['max_lng'] + 1e-7) ||
            $latitude < ($bbox['min_lat'] - 1e-7) ||
            $latitude > ($bbox['max_lat'] + 1e-7)
        ) {
            return false;
        }

        $driver = DB::getDriverName();

        // 1. PostgreSQL + PostGIS: gunakan fungsi spasial native ST_Within / ST_Covers (SRID 4326)
        if ($driver === 'pgsql' && $boundary['geojson_2d'] !== '') {
            try {
                $row = DB::selectOne(
                    'SELECT ST_Covers(
                        ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(?)), 4326),
                        ST_SetSRID(ST_MakePoint(?, ?), 4326)
                    ) AS is_within',
                    [$boundary['geojson_2d'], $longitude, $latitude]
                );

                if ($row !== null && isset($row->is_within)) {
                    return (bool) $row->is_within;
                }
            } catch (\Throwable) {
                // Fallback ke algoritma geometri PHP bila ekstensi PostGIS belum aktif di server
            }
        }

        // 2. MySQL / MariaDB Spatial: gunakan ST_Within dengan fallback ke engine PHP
        if ($driver === 'mysql' && $boundary['geojson_2d'] !== '') {
            try {
                $row = DB::selectOne(
                    'SELECT ST_Within(
                        ST_SRID(POINT(?, ?), 4326),
                        ST_SRID(ST_GeomFromGeoJSON(?), 4326)
                    ) AS is_within',
                    [$longitude, $latitude, $boundary['geojson_2d']]
                );

                if ($row !== null && isset($row->is_within)) {
                    return (bool) $row->is_within;
                }
            } catch (\Throwable) {
                // Fallback ke algoritma geometri PHP bila versi MySQL/MariaDB berbeda signature SRID
            }
        }

        // 3. Engine Spasial Deterministik PHP (SQLite & Fallback Universal): Point-in-Polygon + Edge Check
        return $this->pointInMultiPolygon($longitude, $latitude, $boundary['polygons']);
    }

    /**
     * Simpan input spasial yang ditolak ke tabel karantina tersembunyi beserta metadata lengkap.
     */
    public function quarantine(
        Request $request,
        array $validated,
        string $action = 'create',
        string $sourceChannel = 'api',
        ?TouristSpot $targetSpot = null
    ): SpatialQuarantine {
        $lat = (float) $validated['latitude'];
        $lon = (float) $validated['longitude'];
        $userId = $request->user()?->id ?? Auth::id();
        $spotName = trim((string) ($validated['name'] ?? 'Unknown'));
        $category = isset($validated['category']) ? trim((string) $validated['category']) : null;

        $rejectedGeometry = [
            'type' => 'Point',
            'srid' => (int) config('gis.srid', 4326),
            'coordinates' => [$lon, $lat],
            'ewkt' => sprintf('SRID=4326;POINT(%.7F %.7F)', $lon, $lat),
        ];

        $uploadedFileNames = [];
        if ($request->hasFile('photos')) {
            foreach ((array) $request->file('photos') as $file) {
                if ($file && method_exists($file, 'getClientOriginalName')) {
                    $uploadedFileNames[] = $file->getClientOriginalName();
                }
            }
        }

        $payloadSnapshot = [
            'address' => $validated['address'] ?? null,
            'description' => $validated['description'] ?? null,
            'detailed_description' => $validated['detailed_description'] ?? null,
            'operational_hours' => $validated['operational_hours'] ?? null,
            'ticket_price' => $validated['ticket_price'] ?? null,
            'rating' => isset($validated['rating']) ? (float) $validated['rating'] : null,
            'is_popular' => $request->boolean('is_popular') || $request->has('is_popular'),
            'uploaded_filenames' => $uploadedFileNames,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
        ];

        $quarantine = DB::transaction(function () use (
            $userId,
            $action,
            $sourceChannel,
            $targetSpot,
            $spotName,
            $category,
            $lat,
            $lon,
            $rejectedGeometry,
            $payloadSnapshot
        ) {
            $record = SpatialQuarantine::create([
                'user_id' => $userId,
                'action' => $action,
                'source_channel' => $sourceChannel,
                'target_spot_id' => $targetSpot?->id,
                'spot_name' => $spotName,
                'category' => $category,
                'latitude' => $lat,
                'longitude' => $lon,
                'rejected_geometry' => $rejectedGeometry,
                'payload_snapshot' => $payloadSnapshot,
                'reason' => 'OUTSIDE_KOTA_BOGOR_BOUNDARY',
            ]);

            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement(
                    'UPDATE spatial_quarantines SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?',
                    [$lon, $lat, $record->id]
                );
            } elseif ($driver === 'mysql') {
                DB::statement(
                    'UPDATE spatial_quarantines SET geom = POINT(?, ?) WHERE id = ?',
                    [$lon, $lat, $record->id]
                );
            }

            return $record;
        });

        Log::info('[SilentSpatialValidation] Out-of-bounds spatial input quarantined.', [
            'quarantine_id' => $quarantine->id,
            'user_id' => $userId,
            'action' => $action,
            'channel' => $sourceChannel,
            'target_spot_id' => $targetSpot?->id,
            'spot_name' => $spotName,
            'latitude' => $lat,
            'longitude' => $lon,
        ]);

        return $quarantine;
    }

    /**
     * Bangun payload JSON sintetis yang identik 100% dengan TouristSpotController::formatSpot()
     * agar frontend tidak mendeteksi perbedaan struktur saat input luar Kota Bogor dikarantina.
     */
    public function buildSyntheticSpotPayload(
        array $validated,
        Request $request,
        ?TouristSpot $existingSpot = null
    ): array {
        $name = trim((string) $validated['name']);
        $category = trim((string) $validated['category']);
        $lat = (float) $validated['latitude'];
        $lon = (float) $validated['longitude'];

        $syntheticId = $existingSpot
            ? $existingSpot->id
            : ((int) (TouristSpot::max('id') ?? 80) + 1);

        $slug = $existingSpot
            ? $existingSpot->slug
            : (Str::slug($name) ?: 'lokasi-wisata');

        $description = trim((string) ($validated['description'] ?? ''));
        $resolvedDesc = $description !== '' ? $description : ($existingSpot?->description ?? null);

        $hasDetailed = array_key_exists('detailed_description', $validated);
        $rawDetailed = trim((string) ($validated['detailed_description'] ?? ''));
        $resolvedDetailed = $hasDetailed
            ? ($rawDetailed !== '' ? $rawDetailed : $resolvedDesc)
            : ($existingSpot?->detailed_description ?: $resolvedDesc);

        $address = array_key_exists('address', $validated)
            ? $validated['address']
            : ($existingSpot?->address ?? null);

        $operationalHours = $validated['operational_hours']
            ?? $existingSpot?->operational_hours
            ?? '08:00 - 17:00';

        $ticketPrice = array_key_exists('ticket_price', $validated)
            ? ($validated['ticket_price'] ?: 'Gratis')
            : ($existingSpot?->ticket_price ?? 'Gratis');

        $rating = isset($validated['rating'])
            ? (float) $validated['rating']
            : (float) ($existingSpot?->rating ?? 4.5);

        $isPopular = $request->has('is_popular')
            ? $request->boolean('is_popular')
            : (bool) ($existingSpot?->is_popular ?? false);

        $existingGallery = $existingSpot && is_array($existingSpot->gallery) ? $existingSpot->gallery : [];
        $primaryImage = $existingSpot?->image ?? ($existingGallery[0] ?? '/images/spots/taman-peranginan.jpg');
        $gallery = !empty($existingGallery) ? array_values($existingGallery) : [$primaryImage];

        return [
            'id' => $syntheticId,
            'slug' => $slug,
            'name' => $name,
            'category' => $category,
            'description' => $resolvedDesc,
            'detailedDescription' => $resolvedDetailed,
            'detailed_description' => $resolvedDetailed,
            'address' => $address,
            'rating' => $rating,
            'operationalHours' => $operationalHours,
            'operational_hours' => $operationalHours,
            'ticketPrice' => $ticketPrice,
            'ticket_price' => $ticketPrice,
            'image' => $primaryImage,
            'gallery' => $gallery,
            'latitude' => $lat,
            'longitude' => $lon,
            'isPopular' => $isPopular,
            'is_popular' => $isPopular,
            'coordinates' => [
                'lat' => $lat,
                'lng' => $lon,
            ],
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [$lon, $lat],
            ],
        ];
    }

    /**
     * Muat dan normalisasi geometri batas Kota Bogor dari file GeoJSON (2D coordinates + BBox).
     *
     * @return array{polygons: array, bbox: array{min_lng: float, max_lng: float, min_lat: float, max_lat: float}, geojson_2d: string}|null
     */
    private function loadBoundaryGeometry(): ?array
    {
        $resolvedPath = $this->resolveBoundaryFilePath();

        if ($resolvedPath === null) {
            if (!self::$loggedMissingWarning) {
                self::$loggedMissingWarning = true;
                Log::warning(
                    '[SilentSpatialValidation] File GeoJSON batas Kota Bogor tidak ditemukan. ' .
                    'Letakkan file poligon di salah satu lokasi berikut: ' .
                    implode(' atau ', $this->getCandidateBoundaryPaths())
                );
            }

            return null;
        }

        $mtime = @filemtime($resolvedPath) ?: 0;
        $cacheKey = $resolvedPath . ':' . $mtime;
        if (isset(self::$boundaryCache[$cacheKey])) {
            return self::$boundaryCache[$cacheKey];
        }

        $raw = @file_get_contents($resolvedPath);
        if ($raw === false || trim($raw) === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return null;
        }

        $polygons = [];
        $minLng = INF;
        $maxLng = -INF;
        $minLat = INF;
        $maxLat = -INF;

        $extractRings = function (array $rings) use (&$minLng, &$maxLng, &$minLat, &$maxLat): ?array {
            $cleanRings = [];
            foreach ($rings as $ring) {
                if (!is_array($ring) || count($ring) < 3) {
                    continue;
                }
                $cleanRing = [];
                foreach ($ring as $pt) {
                    if (!is_array($pt) || count($pt) < 2) {
                        continue;
                    }
                    $lon = (float) $pt[0];
                    $lat = (float) $pt[1];
                    $cleanRing[] = [$lon, $lat];
                    if ($lon < $minLng) {
                        $minLng = $lon;
                    }
                    if ($lon > $maxLng) {
                        $maxLng = $lon;
                    }
                    if ($lat < $minLat) {
                        $minLat = $lat;
                    }
                    if ($lat > $maxLat) {
                        $maxLat = $lat;
                    }
                }
                if (count($cleanRing) >= 3) {
                    $cleanRings[] = $cleanRing;
                }
            }

            return !empty($cleanRings) ? $cleanRings : null;
        };

        $features = ($decoded['type'] ?? '') === 'FeatureCollection'
            ? ($decoded['features'] ?? [])
            : ((($decoded['type'] ?? '') === 'Feature') ? [$decoded] : [['geometry' => $decoded]]);

        foreach ($features as $feature) {
            $geom = $feature['geometry'] ?? null;
            if (!is_array($geom)) {
                continue;
            }
            $type = $geom['type'] ?? '';
            $coords = $geom['coordinates'] ?? [];

            if ($type === 'Polygon' && is_array($coords)) {
                $clean = $extractRings($coords);
                if ($clean !== null) {
                    $polygons[] = $clean;
                }
            } elseif ($type === 'MultiPolygon' && is_array($coords)) {
                foreach ($coords as $polyCoords) {
                    if (is_array($polyCoords)) {
                        $clean = $extractRings($polyCoords);
                        if ($clean !== null) {
                            $polygons[] = $clean;
                        }
                    }
                }
            }
        }

        if (empty($polygons)) {
            return null;
        }

        $multiPolygonGeoJson = json_encode([
            'type' => count($polygons) === 1 ? 'Polygon' : 'MultiPolygon',
            'coordinates' => count($polygons) === 1 ? $polygons[0] : $polygons,
        ]);

        return self::$boundaryCache[$cacheKey] = [
            'polygons' => $polygons,
            'bbox' => [
                'min_lng' => $minLng,
                'max_lng' => $maxLng,
                'min_lat' => $minLat,
                'max_lat' => $maxLat,
            ],
            'geojson_2d' => $multiPolygonGeoJson ?: '',
        ];
    }

    /**
     * Evaluasi apakah titik berada di dalam (atau tepat pada garis batas) salah satu poligon Kota Bogor.
     */
    private function pointInMultiPolygon(float $lon, float $lat, array $polygons): bool
    {
        foreach ($polygons as $rings) {
            if (empty($rings)) {
                continue;
            }

            if (!$this->pointInOrOnRing($lon, $lat, $rings[0])) {
                continue;
            }

            $inHole = false;
            $ringCount = count($rings);
            for ($i = 1; $i < $ringCount; $i++) {
                // Titik di dalam interior hole bukan bagian wilayah, kecuali tepat di garis batas hole
                if ($this->pointStrictlyInRing($lon, $lat, $rings[$i])) {
                    $inHole = true;
                    break;
                }
            }

            if (!$inHole) {
                return true;
            }
        }

        return false;
    }

    private function pointInOrOnRing(float $lon, float $lat, array $ring): bool
    {
        if ($this->isPointOnRingBoundary($lon, $lat, $ring)) {
            return true;
        }

        return $this->rayCastRing($lon, $lat, $ring);
    }

    private function pointStrictlyInRing(float $lon, float $lat, array $ring): bool
    {
        if ($this->isPointOnRingBoundary($lon, $lat, $ring)) {
            return false;
        }

        return $this->rayCastRing($lon, $lat, $ring);
    }

    private function isPointOnRingBoundary(float $lon, float $lat, array $ring): bool
    {
        $count = count($ring);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $x1 = $ring[$j][0];
            $y1 = $ring[$j][1];
            $x2 = $ring[$i][0];
            $y2 = $ring[$i][1];

            if ($this->isPointOnSegment($lon, $lat, $x1, $y1, $x2, $y2)) {
                return true;
            }
        }

        return false;
    }

    private function isPointOnSegment(float $px, float $py, float $x1, float $y1, float $x2, float $y2): bool
    {
        $minX = min($x1, $x2) - self::EPSILON;
        $maxX = max($x1, $x2) + self::EPSILON;
        $minY = min($y1, $y2) - self::EPSILON;
        $maxY = max($y1, $y2) + self::EPSILON;

        if ($px < $minX || $px > $maxX || $py < $minY || $py > $maxY) {
            return false;
        }

        $cross = ($px - $x1) * ($y2 - $y1) - ($py - $y1) * ($x2 - $x1);

        return abs($cross) <= self::EPSILON;
    }

    private function rayCastRing(float $lon, float $lat, array $ring): bool
    {
        $inside = false;
        $count = count($ring);

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = $ring[$i][0];
            $yi = $ring[$i][1];
            $xj = $ring[$j][0];
            $yj = $ring[$j][1];

            $intersects = (($yi > $lat) !== ($yj > $lat))
                && ($lon < ($xj - $xi) * ($lat - $yi) / (($yj - $yi) ?: 1e-18) + $xi);

            if ($intersects) {
                $inside = !$inside;
            }
        }

        return $inside;
    }
}
