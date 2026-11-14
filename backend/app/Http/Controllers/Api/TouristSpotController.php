<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TouristSpot;
use App\Services\ImageCompressor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TouristSpotController extends Controller
{
    /**
     * Display a listing of tourist spots with optional search, category, and spatial sorting.
     */
    public function index(Request $request)
    {
        $query = TouristSpot::query()->withGeoJson();

        // Filter Kategori
        if ($request->filled('category') && $request->category !== 'Semua') {
            $query->where('category', $request->category);
        }

        // Pencarian Nama / Deskripsi / Alamat
        if ($request->filled('q')) {
            $searchTerm = '%' . strtolower($request->q) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(name) LIKE ?', [$searchTerm])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$searchTerm])
                  ->orWhereRaw('LOWER(address) LIKE ?', [$searchTerm]);
            });
        }

        // Filter Populer
        if ($request->has('popular')) {
            $query->where('is_popular', filter_var($request->popular, FILTER_VALIDATE_BOOLEAN));
        }

        // Optional: Urutkan berdasarkan jarak spasial jika latitude & longitude user dikirim
        if ($request->filled('lat') && $request->filled('lon')) {
            $userLat = (float) $request->lat;
            $userLon = (float) $request->lon;

            if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
                $query->selectRaw(
                    'ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as distance_meters',
                    [$userLon, $userLat]
                )->orderBy('distance_meters', 'asc');
            } else {
                // Haversine formula dalam meter (kompatibel MySQL / MariaDB)
                $query->selectRaw(
                    '(6371000 * acos(LEAST(1, GREATEST(-1, cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))))) as distance_meters',
                    [$userLat, $userLon, $userLat]
                )->orderBy('distance_meters', 'asc');
            }
        } else {
            $query->orderBy('id', 'asc');
        }

        $spots = $query->get();

        // Format respon GeoJSON jika format=geojson
        if ($request->query('format') === 'geojson') {
            $features = $spots->map(function ($spot) {
                return [
                    'type' => 'Feature',
                    'properties' => [
                        'id' => $spot->id,
                        'slug' => $spot->slug,
                        'name' => $spot->name,
                        'category' => $spot->category,
                        'description' => $spot->description,
                        'detailed_description' => $spot->detailed_description,
                        'address' => $spot->address,
                        'rating' => (float) $spot->rating,
                        'operational_hours' => $spot->operational_hours,
                        'ticket_price' => $spot->ticket_price,
                        'image' => $spot->image,
                        'gallery' => $spot->gallery,
                        'latitude' => (float) $spot->latitude,
                        'longitude' => (float) $spot->longitude,
                        'is_popular' => (bool) $spot->is_popular,
                        'created_at' => $spot->created_at,
                        'updated_at' => $spot->updated_at,
                    ],
                    'geometry' => json_decode($spot->geojson, true) ?? [
                        'type' => 'Point',
                        'coordinates' => [(float) $spot->longitude, (float) $spot->latitude],
                    ],
                ];
            });

            return response()->json([
                'type' => 'FeatureCollection',
                'name' => 'tourist_spots',
                'crs' => [
                    'type' => 'name',
                    'properties' => ['name' => 'urn:ogc:def:crs:OGC:1.3:CRS84']
                ],
                'features' => $features,
            ]);
        }

        // Formatkan respon kompatibel penuh dengan frontend & leaflet
        $data = $spots->map(fn (TouristSpot $spot) => $this->formatSpot($spot));

        return response()->json([
            'status' => 'success',
            'count' => $data->count(),
            'data' => $data,
        ]);
    }

    /**
     * Display a specific tourist spot by slug or ID.
     */
    public function show(string $slugOrId)
    {
        $spot = TouristSpot::withGeoJson()
            ->where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? (int) $slugOrId : -1)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $this->formatSpot($spot),
        ]);
    }

    /**
     * Store a newly created tourist spot via admin API.
     */
    public function store(Request $request)
    {
        $validated = $this->validateSpotPayload($request);

        $baseSlug = Str::slug($validated['name']) ?: 'lokasi-wisata';
        $slug = $baseSlug;
        $counter = 1;
        while (TouristSpot::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        [$primaryImage, $gallery] = $this->resolvePhotoGallery($request);

        $description = trim((string) ($validated['description'] ?? ''));
        $detailedDescription = trim((string) ($validated['detailed_description'] ?? ''));

        $spot = TouristSpot::create([
            'slug' => $slug,
            'name' => trim($validated['name']),
            'category' => trim($validated['category']),
            'latitude' => (float) $validated['latitude'],
            'longitude' => (float) $validated['longitude'],
            'address' => $validated['address'] ?? null,
            'description' => $description !== '' ? $description : null,
            'detailed_description' => $detailedDescription !== '' ? $detailedDescription : ($description !== '' ? $description : null),
            'operational_hours' => $validated['operational_hours'] ?? '08:00 - 17:00',
            'ticket_price' => $validated['ticket_price'] ?? 'Gratis',
            'rating' => $validated['rating'] ?? 4.5,
            'is_popular' => $request->boolean('is_popular'),
            'image' => $primaryImage,
            'gallery' => $gallery,
        ]);

        $this->updateSpatialPoint($spot->id, (float) $validated['longitude'], (float) $validated['latitude']);

        $freshSpot = TouristSpot::withGeoJson()->findOrFail($spot->id);

        return response()->json([
            'status' => 'success',
            'message' => "Tempat wisata '{$freshSpot->name}' berhasil ditambahkan.",
            'data' => $this->formatSpot($freshSpot),
        ], 201);
    }

    /**
     * Update an existing tourist spot via admin API.
     */
    public function update(Request $request, string $id)
    {
        $spot = TouristSpot::query()
            ->where('id', is_numeric($id) ? (int) $id : -1)
            ->orWhere('slug', $id)
            ->firstOrFail();

        $validated = $this->validateSpotPayload($request);

        [$primaryImage, $gallery] = $this->resolvePhotoGallery($request, $spot);

        $description = trim((string) ($validated['description'] ?? ''));
        $hasDetailedInput = $request->has('detailed_description');
        $detailedDescription = $hasDetailedInput
            ? trim((string) ($validated['detailed_description'] ?? ''))
            : ($spot->detailed_description ?: ($description !== '' ? $description : null));

        $spot->update([
            'name' => trim($validated['name']),
            'category' => trim($validated['category']),
            'latitude' => (float) $validated['latitude'],
            'longitude' => (float) $validated['longitude'],
            'address' => array_key_exists('address', $validated) ? $validated['address'] : $spot->address,
            'description' => $description !== '' ? $description : null,
            'detailed_description' => $detailedDescription !== '' ? $detailedDescription : null,
            'operational_hours' => $validated['operational_hours'] ?? $spot->operational_hours,
            'ticket_price' => array_key_exists('ticket_price', $validated)
                ? ($validated['ticket_price'] ?: 'Gratis')
                : $spot->ticket_price,
            'rating' => $validated['rating'] ?? $spot->rating,
            'is_popular' => $request->has('is_popular') ? $request->boolean('is_popular') : $spot->is_popular,
            'image' => $primaryImage,
            'gallery' => $gallery,
        ]);

        $this->updateSpatialPoint($spot->id, (float) $validated['longitude'], (float) $validated['latitude']);

        $freshSpot = TouristSpot::withGeoJson()->findOrFail($spot->id);

        return response()->json([
            'status' => 'success',
            'message' => "Tempat wisata '{$freshSpot->name}' berhasil diperbarui.",
            'data' => $this->formatSpot($freshSpot),
        ]);
    }

    /**
     * Delete a tourist spot via admin API.
     */
    public function destroy(string $id)
    {
        $spot = TouristSpot::query()
            ->where('id', is_numeric($id) ? (int) $id : -1)
            ->orWhere('slug', $id)
            ->firstOrFail();

        $name = $spot->name;
        $spot->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Tempat wisata '{$name}' berhasil dihapus.",
        ]);
    }

    /**
     * Return Kota Bogor administrative boundary GeoJSON (WBS 1.2.7).
     */
    public function boundary()
    {
        $path = database_path('data/bogor_boundary.geojson');
        if (!file_exists($path)) {
            return response()->json(['status' => 'error', 'message' => 'Boundary file not found'], 404);
        }

        $geojson = json_decode(file_get_contents($path), true);
        return response()->json($geojson);
    }

    /**
     * Format single TouristSpot record consistently for frontend & Leaflet.
     */
    private function formatSpot(TouristSpot $spot): array
    {
        return [
            'id' => $spot->id,
            'slug' => $spot->slug,
            'name' => $spot->name,
            'category' => $spot->category,
            'description' => $spot->description,
            'detailedDescription' => $spot->detailed_description,
            'detailed_description' => $spot->detailed_description,
            'address' => $spot->address,
            'rating' => (float) $spot->rating,
            'operationalHours' => $spot->operational_hours,
            'operational_hours' => $spot->operational_hours,
            'ticketPrice' => $spot->ticket_price,
            'ticket_price' => $spot->ticket_price,
            'image' => $spot->image,
            'gallery' => $spot->gallery ?? [],
            'latitude' => (float) $spot->latitude,
            'longitude' => (float) $spot->longitude,
            'isPopular' => (bool) $spot->is_popular,
            'is_popular' => (bool) $spot->is_popular,
            'coordinates' => [
                'lat' => (float) $spot->latitude,
                'lng' => (float) $spot->longitude,
            ],
            'geometry' => json_decode($spot->geojson ?? '', true) ?? [
                'type' => 'Point',
                'coordinates' => [(float) $spot->longitude, (float) $spot->latitude],
            ],
        ];
    }

    /**
     * Validate store/update request payload.
     */
    private function validateSpotPayload(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'detailed_description' => 'nullable|string',
            'operational_hours' => 'nullable|string|max:255',
            'ticket_price' => 'nullable|string|max:255',
            'rating' => 'nullable|numeric|between:0,5',
            'is_popular' => 'nullable',
            'photos' => 'nullable|array',
            'photos.*' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:10240',
            'photo_order' => 'nullable|string',
        ]);
    }

    /**
     * Upload and compress new spot images and reconcile ordering with retained gallery paths.
     */
    private function resolvePhotoGallery(Request $request, ?TouristSpot $existingSpot = null): array
    {
        $uploadedMap = [];
        if ($request->hasFile('photos')) {
            $spotsDir = public_path('images/spots');
            if (!file_exists($spotsDir)) {
                mkdir($spotsDir, 0755, true);
            }

            foreach ($request->file('photos') as $idx => $photoFile) {
                $ext = $photoFile->getClientOriginalExtension() ?: 'jpg';
                $cleanName = Str::slug(pathinfo($photoFile->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'spot';
                $fileName = time() . '_' . uniqid() . '_' . $cleanName . '.' . $ext;
                ImageCompressor::compressAndSave($photoFile, $spotsDir, $fileName, 1280, 1280, 82);
                $uploadedMap['new_' . $idx] = '/images/spots/' . $fileName;
            }
        }

        if (!$request->has('photo_order') && empty($uploadedMap)) {
            $fallbackGallery = $existingSpot && is_array($existingSpot->gallery) ? $existingSpot->gallery : [];
            $primary = $existingSpot?->image ?? ($fallbackGallery[0] ?? null);
            return [$primary, array_values(array_unique(array_filter($fallbackGallery)))];
        }

        $orderedGallery = [];
        $orderList = json_decode($request->input('photo_order', '[]'), true);
        if (is_array($orderList)) {
            foreach ($orderList as $item) {
                $src = trim((string) ($item['src'] ?? ''));
                $fileId = $item['fileId'] ?? null;

                if ($fileId && isset($uploadedMap[$fileId])) {
                    $orderedGallery[] = $uploadedMap[$fileId];
                } elseif ($src !== '' && !str_starts_with($src, 'blob:') && !str_starts_with($src, 'data:')) {
                    // Normalize absolute same-site localhost URL back into clean relative /images/... path
                    $normalized = preg_replace('#^https?://[^/]+(/images/.*)$#i', '$1', $src);
                    if (str_starts_with($normalized, '/images/') || str_starts_with($normalized, 'http://') || str_starts_with($normalized, 'https://')) {
                        $orderedGallery[] = $normalized;
                    }
                }
            }
        }

        if (empty($orderedGallery) && !empty($uploadedMap)) {
            $orderedGallery = array_values($uploadedMap);
        }

        $orderedGallery = array_values(array_unique(array_filter($orderedGallery)));
        $primaryImage = $orderedGallery[0] ?? null;

        return [$primaryImage, $orderedGallery];
    }

    /**
     * Sync spatial geometry point column on PostGIS or MySQL.
     */
    private function updateSpatialPoint(int $spotId, float $lon, float $lat): void
    {
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
            // Abaikan bila driver SQLite tidak memakai kolom geom terpisah
        }
    }
}
