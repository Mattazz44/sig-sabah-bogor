<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TouristSpot;
use Illuminate\Http\Request;

class ForYouController extends Controller
{
    /**
     * Mengambil rekomendasi wisata "Untuk Anda" dari database secara dinamis.
     */
    public function index(Request $request)
    {
        // 1. Ambil slug favorit & recently viewed dari query params jika dikirim oleh frontend
        $favoriteSlugs = array_filter(explode(',', $request->query('favorites', '')));
        $recentSlugs = array_filter(explode(',', $request->query('recent', '')));

        // 2. Tentukan item "Lanjutkan Perjalanan / Terakhir Dilihat"
        $continueSpot = null;
        if (!empty($recentSlugs)) {
            $lastSeenSlug = $recentSlugs[0];
            $continueSpot = TouristSpot::where('slug', $lastSeenSlug)->first();
        }

        // Fallback jika belum pernah melihat destinasi apa pun
        if (!$continueSpot) {
            $continueSpot = TouristSpot::where('is_popular', true)->orderBy('rating', 'desc')->first()
                ?? TouristSpot::orderBy('rating', 'desc')->first();
        }

        $continueItem = $continueSpot ? [
            'id' => 'continue-' . $continueSpot->slug,
            'slug' => $continueSpot->slug,
            'name' => $continueSpot->name,
            'location' => $continueSpot->address ?: 'Bogor, Jawa Barat',
            'rating' => number_format((float)$continueSpot->rating, 1),
            'image' => $continueSpot->image,
            'category' => $continueSpot->category,
        ] : null;

        // 3. Tentukan rekomendasi berdasarkan kategori aktivitas terakhir / favorit
        // Ambil kategori dari tempat yang terakhir dilihat atau disukai
        $preferredCategories = [];
        if ($continueSpot) {
            $preferredCategories[] = $continueSpot->category;
        }

        if (!empty($favoriteSlugs)) {
            $favCategories = TouristSpot::whereIn('slug', $favoriteSlugs)->pluck('category')->toArray();
            $preferredCategories = array_unique(array_merge($preferredCategories, $favCategories));
        }

        // Query rekomendasi dari database
        $query = TouristSpot::query();

        // Jangan masukkan kembali tempat yang sedang ada di "Lanjutkan Perjalanan"
        if ($continueSpot) {
            $query->where('id', '!=', $continueSpot->id);
        }

        // Prioritaskan kategori yang diminati jika ada
        if (!empty($preferredCategories)) {
            $recommendedSpots = (clone $query)->whereIn('category', $preferredCategories)
                ->orderBy('rating', 'desc')
                ->limit(6)
                ->get();

            // Jika kurang dari 3, lengkapi dengan spot rating tertinggi lainnya
            if ($recommendedSpots->count() < 3) {
                $existingIds = $recommendedSpots->pluck('id')->toArray();
                if ($continueSpot) $existingIds[] = $continueSpot->id;

                $moreSpots = TouristSpot::whereNotIn('id', $existingIds)
                    ->orderBy('is_popular', 'desc')
                    ->orderBy('rating', 'desc')
                    ->limit(6 - $recommendedSpots->count())
                    ->get();

                $recommendedSpots = $recommendedSpots->concat($moreSpots);
            }
        } else {
            // Jika belum ada preferensi, ambil tempat populer & rating tertinggi
            $recommendedSpots = $query->orderBy('is_popular', 'desc')
                ->orderBy('rating', 'desc')
                ->limit(6)
                ->get();
        }

        $recommended = $recommendedSpots->map(function ($spot) {
            return [
                'id' => $spot->slug,
                'slug' => $spot->slug,
                'name' => $spot->name,
                'location' => $spot->address ?: 'Bogor, Jawa Barat',
                'rating' => number_format((float)$spot->rating, 1),
                'image' => $spot->image,
                'category' => $spot->category,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'recommended' => $recommended,
                'continue_item' => $continueItem,
            ],
        ]);
    }
}
