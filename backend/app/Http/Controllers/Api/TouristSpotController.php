<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TouristSpot;
use Illuminate\Http\Request;

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
            $query->selectRaw(
                'ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as distance_meters',
                [$userLon, $userLat]
            )->orderBy('distance_meters', 'asc');
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
        $data = $spots->map(function ($spot) {
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
                // Format spesifikasi Leaflet frontend: coordinates: { lat, lng }
                'coordinates' => [
                    'lat' => (float) $spot->latitude,
                    'lng' => (float) $spot->longitude,
                ],
                'geometry' => json_decode($spot->geojson, true) ?? [
                    'type' => 'Point',
                    'coordinates' => [(float) $spot->longitude, (float) $spot->latitude],
                ],
            ];
        });

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
            ->orWhere('id', is_numeric($slugOrId) ? (int)$slugOrId : -1)
            ->firstOrFail();

        $data = [
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
            'geometry' => json_decode($spot->geojson, true) ?? [
                'type' => 'Point',
                'coordinates' => [(float) $spot->longitude, (float) $spot->latitude],
            ],
        ];

        return response()->json([
            'status' => 'success',
            'data' => $data,
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
}
