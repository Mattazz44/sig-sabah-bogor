<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Console\Commands\DeduplicateTouristSpots;
use App\Models\TouristSpot;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TouristSpotSeeder extends Seeder
{
    private const SPATIAL_DEDUPE_RADIUS_METERS = 15.0;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $boundaryPolygons = $this->loadBoundaryPolygons();

        // 1. Seed Base Spots dari file GeoJSON jika ada
        $jsonPath = database_path('data/tourist_spots.geojson');

        if (File::exists($jsonPath)) {
            $geoJson = json_decode(File::get($jsonPath), true);
            $features = $geoJson['features'] ?? [];
            $seededGeo = 0;
            $skippedGeoDupes = 0;

            foreach ($features as $feature) {
                $props = $feature['properties'] ?? [];
                $coords = $feature['geometry']['coordinates'] ?? null; // [longitude, latitude]

                $lon = $coords ? (float) $coords[0] : (isset($props['longitude']) ? (float) $props['longitude'] : null);
                $lat = $coords ? (float) $coords[1] : (isset($props['latitude']) ? (float) $props['latitude'] : null);
                $name = trim((string) ($props['name'] ?? ''));

                if ($name === '' || $lon === null || $lat === null || !$this->isInsideBogorBoundary($lon, $lat, $boundaryPolygons)) {
                    continue;
                }

                $slug = trim((string) ($props['slug'] ?? '')) ?: Str::slug($name);
                $address = $props['address'] ?? null;

                $existingMatch = $this->findExistingSpot($slug, $name, $address, $lat, $lon);
                if ($existingMatch && $existingMatch->slug !== $slug) {
                    $skippedGeoDupes++;
                    continue;
                }

                $spot = TouristSpot::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $name,
                        'category' => $props['category'],
                        'description' => $props['description'] ?? null,
                        'detailed_description' => $props['detailed_description'] ?? 'kosong',
                        'address' => $address,
                        'rating' => $props['rating'] ?? 0,
                        'operational_hours' => $props['operational_hours'] ?? null,
                        'ticket_price' => $props['ticket_price'] ?? null,
                        'image' => $props['image'] ?? null,
                        'gallery' => $props['gallery'] ?? [],
                        'latitude' => $lat,
                        'longitude' => $lon,
                        'is_popular' => $props['is_popular'] ?? false,
                    ]
                );

                $this->updateGeometry($spot->id, $lon, $lat);
                $seededGeo++;
            }

            $this->command?->info("{$seededGeo} tourist spots inside Kota Bogor seeded from GeoJSON ({$skippedGeoDupes} duplicates skipped).");
        }

        // 2. Seed Data Tambahan dari file CSV (tourist_spots_additional.csv)
        $csvPath = database_path('data/tourist_spots_additional.csv');

        if (File::exists($csvPath)) {
            $handle = fopen($csvPath, 'r');
            // Lewati baris header
            fgetcsv($handle, 0, ',', '"', '\\');

            $addedCount = 0;
            $skippedCount = 0;
            $skippedDupes = 0;

            while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
                if (count($row) < 10) continue;

                $name = trim($row[0] ?? '');
                if (empty($name)) continue;

                $rawLat = trim($row[8] ?? '');
                $rawLon = trim($row[9] ?? '');

                // Parse koordinat (lat/long kosong atau '-' diabaikan)
                $lat = $this->parseCoordinate($rawLat, true);
                $lon = $this->parseCoordinate($rawLon, false);

                if ($lat === null || $lon === null || !$this->isInsideBogorBoundary($lon, $lat, $boundaryPolygons)) {
                    $skippedCount++;
                    continue;
                }

                $slug = Str::slug($name);

                // Alamat Lengkap
                $address = trim($row[3] ?? '');
                if (empty($address)) {
                    $kel = trim($row[4] ?? '');
                    $kec = trim($row[5] ?? '');
                    $address = trim(($kel ? $kel . ', ' : '') . ($kec ? $kec . ', ' : '') . 'Kota Bogor');
                }

                // Cek apakah spot sudah ada di database berdasarkan slug, nama kanonik, atau tumpang tindih koordinat
                $existingSpot = $this->findExistingSpot($slug, $name, $address, $lat, $lon);
                if ($existingSpot && $existingSpot->slug !== $slug) {
                    $skippedDupes++;
                    continue;
                }

                // Format Jam Buka & Tutup
                $jamBuka = trim($row[13] ?? '');
                $jamTutup = trim($row[14] ?? '');
                $operationalHours = null;
                if (!empty($jamBuka) && !empty($jamTutup)) {
                    $operationalHours = "{$jamBuka} - {$jamTutup}";
                } elseif (!empty($jamBuka)) {
                    $operationalHours = $jamBuka;
                } elseif (!empty($jamTutup)) {
                    $operationalHours = "Tutup: {$jamTutup}";
                }

                // HTM Lokal
                $ticketPrice = !empty(trim($row[11] ?? '')) ? trim($row[11]) : null;

                // Deskripsi Ringkas
                $shortDesc = trim($row[22] ?? '');
                if (empty($shortDesc)) {
                    $catName = trim($row[1] ?? 'Wisata');
                    $shortDesc = "Destinasi wisata {$catName} di kawasan Kota Bogor.";
                }

                // Deskripsi panjang diisi 'kosong' jika belum ada data sebelumnya
                $detailedDesc = ($existingSpot && $existingSpot->detailed_description && $existingSpot->detailed_description !== 'kosong')
                    ? $existingSpot->detailed_description
                    : 'kosong';

                // Image dikosongkan (null) jika tempat baru
                $image = $existingSpot?->image ?? null;

                // Harmonisasi kategori ke 3 kategori utama aplikasi (Alam & Curug, Kuliner, Edukasi & Budaya)
                $category = $this->mapCategory($row[1] ?? '', $row[2] ?? '', $name);

                $spot = TouristSpot::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $existingSpot?->name ?: $name,
                        'category' => $existingSpot?->category ?: $category,
                        'description' => ($existingSpot && !empty($existingSpot->description)) ? $existingSpot->description : $shortDesc,
                        'detailed_description' => $detailedDesc,
                        'address' => ($existingSpot && !empty($existingSpot->address)) ? $existingSpot->address : $address,
                        'rating' => $existingSpot?->rating ?: 4.5,
                        'operational_hours' => ($existingSpot && !empty($existingSpot->operational_hours)) ? $existingSpot->operational_hours : $operationalHours,
                        'ticket_price' => ($existingSpot && !empty($existingSpot->ticket_price)) ? $existingSpot->ticket_price : $ticketPrice,
                        'image' => $image,
                        'gallery' => $existingSpot?->gallery ?: [],
                        'latitude' => $existingSpot?->latitude ?? $lat,
                        'longitude' => $existingSpot?->longitude ?? $lon,
                        'is_popular' => $existingSpot?->is_popular ?? false,
                    ]
                );

                $this->updateGeometry($spot->id, (float) $spot->longitude, (float) $spot->latitude);
                $addedCount++;
            }

            fclose($handle);
            $this->command?->info("{$addedCount} spots from CSV processed ({$skippedCount} skipped due to empty/outside coords, {$skippedDupes} duplicates skipped).");
        }
    }

    /**
     * Cari record existing berdasarkan slug, nama kanonik serupa, atau koordinat spasial bertumpuk (<= 15m).
     */
    private function findExistingSpot(string $slug, string $name, ?string $address, float $lat, float $lon): ?TouristSpot
    {
        $bySlug = TouristSpot::where('slug', $slug)->first();
        if ($bySlug) {
            return $bySlug;
        }

        $targetNameKey = DeduplicateTouristSpots::canonicalNameKey($name);
        $targetStreetKey = DeduplicateTouristSpots::streetKey($address);

        $candidates = TouristSpot::query()
            ->select(['id', 'slug', 'name', 'address', 'category', 'description', 'detailed_description', 'rating', 'operational_hours', 'ticket_price', 'image', 'gallery', 'latitude', 'longitude', 'is_popular'])
            ->get();

        foreach ($candidates as $candidate) {
            $candNameKey = DeduplicateTouristSpots::canonicalNameKey((string) $candidate->name);
            if ($targetNameKey !== '' && $targetNameKey === $candNameKey) {
                return $candidate;
            }

            $distM = $this->haversineMeters($lat, $lon, (float) $candidate->latitude, (float) $candidate->longitude);
            if ($distM <= self::SPATIAL_DEDUPE_RADIUS_METERS) {
                return $candidate;
            }

            if (
                $distM <= 100.0 &&
                $targetStreetKey !== '' &&
                $targetStreetKey === DeduplicateTouristSpots::streetKey($candidate->address) &&
                strlen($targetNameKey) >= 10 &&
                strlen($candNameKey) >= 10 &&
                (str_contains($targetNameKey, $candNameKey) || str_contains($candNameKey, $targetNameKey))
            ) {
                return $candidate;
            }
        }

        return null;
    }

    private function haversineMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2.0 * $earthRadius * asin(min(1.0, sqrt($a)));
    }

    /**
     * Memetakan kategori dataset mentah ke 3 kategori utama SIG Sabah:
     * - 'Alam & Curug'
     * - 'Kuliner'
     * - 'Edukasi & Budaya'
     */
    private function mapCategory(string $rawCategory, string $subCategory = '', string $name = ''): string
    {
        $cat = mb_strtolower(trim($rawCategory));
        $sub = mb_strtolower(trim($subCategory));
        $nm  = mb_strtolower(trim($name));

        if (str_contains($cat, 'kuliner') || str_contains($cat, 'belanja') || 
            str_contains($sub, 'kuliner') || str_contains($sub, 'pasar') || 
            str_contains($nm, 'pasar') || str_contains($nm, 'kuliner') || str_contains($nm, 'mall')) {
            return 'Kuliner';
        }

        if (str_contains($cat, 'sejarah') || str_contains($cat, 'budaya') || 
            str_contains($cat, 'edukasi') || str_contains($cat, 'landmark') || 
            str_contains($cat, 'kampung') || str_contains($sub, 'heritage') || 
            str_contains($sub, 'monumen') || str_contains($sub, 'museum') || 
            str_contains($nm, 'museum') || str_contains($nm, 'prasasti') || 
            str_contains($nm, 'tugu') || str_contains($nm, 'istana') || str_contains($nm, 'makam')) {
            return 'Edukasi & Budaya';
        }

        // Default untuk wisata alam, ruang publik, taman kota, curug, agrowisata, rekreasi keluarga/air
        return 'Alam & Curug';
    }

    /**
     * Update spatial geometry kolom geom: ST_SetSRID(ST_MakePoint(lon, lat), 4326) / Point(lon, lat)
     */
    private function updateGeometry(int $spotId, ?float $lon, ?float $lat): void
    {
        if ($lon === null || $lat === null) {
            return;
        }

        try {
            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement(
                    'UPDATE tourist_spots SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?',
                    [$lon, $lat, $spotId]
                );
            } elseif ($driver === 'mysql') {
                DB::statement(
                    'UPDATE tourist_spots SET geom = POINT(?, ?) WHERE id = ?',
                    [$lon, $lat, $spotId]
                );
            }
        } catch (\Throwable $e) {
            // Abaikan jika kolom geom belum ditambahkan atau tipe spatial tidak aktif
        }
    }

    /**
     * Normalisasi dan validasi koordinat latitude dan longitude.
     */
    private function parseCoordinate($str, bool $isLat = true): ?float
    {
        $s = trim((string)$str);
        if ($s === '' || $s === '-' || $s === 'null') {
            return null;
        }

        // Format angka desimal standar: misal -6.599722 atau 106.8
        if (preg_match('/^-?\d+\.\d+$/', $s)) {
            return (float)$s;
        }

        // Format dengan tanda koma tunggal: misal -6,55225
        if (substr_count($s, ',') === 1 && !str_contains($s, '.')) {
            $candidate = (float)str_replace(',', '.', $s);
            if ($isLat && $candidate >= -7.5 && $candidate <= -6.0) return $candidate;
            if (!$isLat && $candidate >= 106.0 && $candidate <= 108.0) return $candidate;
        }

        // Hapus pemisah ribuan atau format integer hasil konversi format Excel
        $clean = preg_replace('/[^\d]/', '', $s);
        if ($clean === '') {
            return null;
        }

        $num = (float)$clean;
        if ($isLat) {
            while ($num > 7.5) {
                $num /= 10.0;
            }
            $val = -$num;
            if ($val >= -7.5 && $val <= -6.0) {
                return round($val, 7);
            }
        } else {
            while ($num > 108.0) {
                $num /= 10.0;
            }
            if ($num >= 106.0 && $num <= 108.0) {
                return round($num, 7);
            }
        }

        return null;
    }

    /**
     * Muat polygon batas administratif Kota Bogor untuk memfilter destinasi agar tidak keluar wilayah.
     */
    private function loadBoundaryPolygons(): array
    {
        $boundaryPath = database_path('data/bogor_boundary.geojson');
        if (!File::exists($boundaryPath)) {
            return [];
        }

        $fc = json_decode(File::get($boundaryPath), true);
        $polygons = [];

        foreach (($fc['features'] ?? []) as $feat) {
            $geom = $feat['geometry'] ?? null;
            if (!$geom) {
                continue;
            }
            if (($geom['type'] ?? '') === 'Polygon') {
                $polygons[] = $geom['coordinates'];
            } elseif (($geom['type'] ?? '') === 'MultiPolygon') {
                foreach (($geom['coordinates'] ?? []) as $poly) {
                    $polygons[] = $poly;
                }
            }
        }

        return $polygons;
    }

    private function isInsideBogorBoundary(float $lon, float $lat, array $polygons): bool
    {
        if (empty($polygons)) {
            return true;
        }

        foreach ($polygons as $rings) {
            if (empty($rings) || !$this->pointInRing($lon, $lat, $rings[0])) {
                continue;
            }
            $inHole = false;
            $ringCount = count($rings);
            for ($i = 1; $i < $ringCount; $i++) {
                if ($this->pointInRing($lon, $lat, $rings[$i])) {
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

    private function pointInRing(float $lon, float $lat, array $ring): bool
    {
        $inside = false;
        $count = count($ring);
        if ($count < 3) {
            return false;
        }

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = (float) $ring[$i][0];
            $yi = (float) $ring[$i][1];
            $xj = (float) $ring[$j][0];
            $yj = (float) $ring[$j][1];

            $intersect = (($yi > $lat) !== ($yj > $lat))
                && ($lon < ($xj - $xi) * ($lat - $yi) / (($yj - $yi) ?: 1e-18) + $xi);
            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }
}
