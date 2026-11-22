<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomRoute;
use App\Models\SavedActivity;
use App\Models\TouristSpot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SavedActivityController extends Controller
{
    /**
     * Mengambil daftar aktivitas perjalanan tersimpan & rute custom milik user terautentikasi.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $activities = SavedActivity::with('touristSpot')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $customRoutes = CustomRoute::where('user_id', $userId)
            ->orderBy('is_primary', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'activities' => $activities,
                'custom_routes' => $customRoutes,
            ],
        ]);
    }

    /**
     * Menyimpan aktivitas / tempat wisata tersimpan baru milik user terautentikasi.
     */
    public function storeActivity(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'tourist_spot_id' => 'nullable|integer|exists:tourist_spots,id',
            'spot_slug' => 'nullable|string|max:255',
        ]);

        $activity = SavedActivity::create([
            'user_id' => $request->user()->id,
            'tourist_spot_id' => $validated['tourist_spot_id'] ?? null,
            'spot_slug' => $validated['spot_slug'] ?? null,
            'name' => $validated['name'],
            'location' => $validated['location'],
            'date_label' => 'Baru saja',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Aktivitas berhasil disimpan',
            'data' => $activity,
        ], 201);
    }

    /**
     * Menghitung jarak geodesic (rumus Haversine) dalam kilometer.
     */
    private function calculateDistanceKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadiusKm = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusKm * $c;
    }

    /**
     * Menghapus aktivitas tersimpan milik user terautentikasi.
     */
    public function destroyActivity(Request $request, int $id)
    {
        $activity = SavedActivity::find($id);
        if (!$activity) {
            return response()->json([
                'status' => 'error',
                'message' => 'Aktivitas tersimpan tidak ditemukan.',
            ], 404);
        }

        if ((int) $activity->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki izin menghapus aktivitas ini.',
            ], 403);
        }

        $activity->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Aktivitas berhasil dihapus.',
        ]);
    }

    /**
     * Menyimpan rute custom baru milik user terautentikasi secara atomik.
     */
    public function storeCustomRoute(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'place_ids' => 'required|array|min:1',
            'place_ids.*' => 'integer|exists:tourist_spots,id',
        ]);

        $spotsById = TouristSpot::whereIn('id', $validated['place_ids'])->get()->keyBy('id');
        $orderedSpots = collect($validated['place_ids'])
            ->map(fn ($id) => $spotsById->get((int) $id))
            ->filter()
            ->values();

        $count = $orderedSpots->count();
        if ($count === 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pilih minimal satu destinasi wisata.',
            ], 422);
        }

        $bogorCenterLat = -6.598;
        $bogorCenterLng = 106.805;
        $stops = [];
        $totalRoadKm = 0.0;

        foreach ($orderedSpots as $idx => $p) {
            $type = $idx === 0 ? 'Titik Awal' : ($idx === $count - 1 ? 'Destinasi Akhir' : "Transit {$idx}");
            $lat = (float) $p->latitude;
            $lng = (float) $p->longitude;

            if ($idx === 0) {
                $legKm = $this->calculateDistanceKm($bogorCenterLat, $bogorCenterLng, $lat, $lng) * 1.35;
                $legLabel = $count > 1 ? 'Titik awal' : number_format(max(0.2, $legKm), 1) . ' KM';
                if ($count === 1) {
                    $totalRoadKm += max(0.2, $legKm);
                }
            } else {
                $prev = $orderedSpots[$idx - 1];
                $legKm = $this->calculateDistanceKm((float) $prev->latitude, (float) $prev->longitude, $lat, $lng) * 1.35;
                $legKm = max(0.2, $legKm);
                $totalRoadKm += $legKm;
                $legLabel = number_format($legKm, 1) . ' KM';
            }

            $stops[] = [
                'name' => $p->name,
                'type' => $type,
                'distance' => $legLabel,
                'place' => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name' => $p->name,
                    'category' => $p->category,
                    'rating' => $p->rating !== null ? (float) $p->rating : null,
                    'address' => $p->address,
                    'coordinates' => ['lat' => $lat, 'lng' => $lng],
                    'image' => $p->image,
                ],
            ];
        }

        $totalMinutes = max(3, (int) round(($totalRoadKm / 25) * 60) + 2);
        $userId = $request->user()->id;

        $customRoute = DB::transaction(function () use ($userId, $validated, $stops, $totalRoadKm, $totalMinutes) {
            return CustomRoute::create([
                'user_id' => $userId,
                'slug' => 'cr-' . time() . '-' . Str::lower(Str::random(4)),
                'title' => $validated['title'],
                'desc' => 'Rute baru dibuat oleh Anda',
                'is_primary' => false,
                'stops' => $stops,
                'total_distance' => number_format($totalRoadKm, 1) . ' KM',
                'total_duration' => $totalMinutes . ' Menit',
                'place_ids' => $validated['place_ids'],
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Rute custom berhasil disimpan',
            'data' => $customRoute,
        ], 201);
    }

    /**
     * Menghapus rute custom milik user terautentikasi.
     */
    public function destroyCustomRoute(Request $request, string $slugOrId)
    {
        $route = CustomRoute::where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? (int) $slugOrId : -1)
            ->first();

        if (!$route) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rute custom tidak ditemukan.',
            ], 404);
        }

        if ((int) $route->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki izin menghapus rute ini.',
            ], 403);
        }

        $route->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Rute custom berhasil dihapus.',
        ]);
    }
}
