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
     * Menyimpan rute custom baru milik user terautentikasi secara atomik.
     */
    public function storeCustomRoute(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'place_ids' => 'required|array|min:1',
            'place_ids.*' => 'integer|exists:tourist_spots,id',
        ]);

        $spots = TouristSpot::whereIn('id', $validated['place_ids'])->get();
        $count = $spots->count();

        $stops = [];
        $idx = 0;
        foreach ($spots as $p) {
            $type = $idx === 0 ? 'Titik Awal' : ($idx === $count - 1 ? 'Destinasi Akhir' : "Transit {$idx}");
            $stops[] = [
                'name' => $p->name,
                'type' => $type,
                'distance' => '2.5 KM',
                'place' => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name' => $p->name,
                    'coordinates' => ['lat' => (float) $p->latitude, 'lng' => (float) $p->longitude],
                    'image' => $p->image,
                ],
            ];
            $idx++;
        }

        $userId = $request->user()->id;

        $customRoute = DB::transaction(function () use ($userId, $validated, $stops, $count) {
            return CustomRoute::create([
                'user_id' => $userId,
                'slug' => 'cr-' . time() . '-' . Str::lower(Str::random(4)),
                'title' => $validated['title'],
                'desc' => 'Rute baru dibuat oleh Anda',
                'is_primary' => false,
                'stops' => $stops,
                'total_distance' => number_format($count * 2.8, 1) . ' KM',
                'total_duration' => ($count * 8) . ' Menit',
                'place_ids' => $validated['place_ids'],
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Rute custom berhasil disimpan',
            'data' => $customRoute,
        ], 201);
    }
}
