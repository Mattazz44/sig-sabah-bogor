<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedActivity;
use App\Models\CustomRoute;
use App\Models\TouristSpot;
use Illuminate\Http\Request;

class SavedActivityController extends Controller
{
    /**
     * Mengambil daftar aktivitas perjalanan tersimpan & rute custom.
     */
    public function index()
    {
        $activities = SavedActivity::orderBy('created_at', 'desc')->get();
        $customRoutes = CustomRoute::orderBy('is_primary', 'desc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'activities' => $activities,
                'custom_routes' => $customRoutes,
            ],
        ]);
    }

    /**
     * Menyimpan aktivitas perjalanan baru buatan user.
     */
    public function storeActivity(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $activity = SavedActivity::create([
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
     * Menyimpan rute custom baru buatan user.
     */
    public function storeCustomRoute(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'place_ids' => 'required|array|min:1',
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
                    'coordinates' => ['lat' => (float)$p->latitude, 'lng' => (float)$p->longitude],
                    'image' => $p->image,
                ],
            ];
            $idx++;
        }

        $customRoute = CustomRoute::create([
            'slug' => 'cr-' . time(),
            'title' => $validated['title'],
            'desc' => 'Rute baru dibuat oleh Anda',
            'is_primary' => false,
            'stops' => $stops,
            'total_distance' => number_format($count * 2.8, 1) . ' KM',
            'total_duration' => ($count * 8) . ' Menit',
            'place_ids' => $validated['place_ids'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Rute custom berhasil disimpan',
            'data' => $customRoute,
        ], 201);
    }
}

