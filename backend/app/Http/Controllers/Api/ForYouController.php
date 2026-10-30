<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TouristSpot;
use Illuminate\Http\Request;

class ForYouController extends Controller
{
    /**
     * Mengambil rekomendasi wisata "Untuk Anda" dari database.
     */
    public function index()
    {
        // Tempat-tempat rekomendasi: Tugu Kujang, Museum Zoologi, Museum PETA, atau tempat dengan rating tertinggi
        $recommendedSlugs = ['tugu-kujang', 'museum-zoologi-bogor', 'museum-peta'];
        
        $recommended = TouristSpot::whereIn('slug', $recommendedSlugs)->get()->map(function ($spot) {
            return [
                'id' => $spot->slug,
                'slug' => $spot->slug,
                'name' => $spot->name,
                'location' => $spot->address ? 'Bogor, jawa barat' : 'Bogor, jawa barat',
                'rating' => number_format((float)$spot->rating, 1),
                'image' => $spot->image,
            ];
        });

        // Item "Lanjutkan Aktivitas Anda"
        $continueSpot = TouristSpot::where('slug', 'museum-peta')->first();
        $continueItem = $continueSpot ? [
            'id' => 'continue-' . $continueSpot->slug,
            'slug' => $continueSpot->slug,
            'name' => $continueSpot->name,
            'location' => 'Bogor, jawa barat',
            'rating' => number_format((float)$continueSpot->rating, 1),
            'image' => $continueSpot->image,
        ] : null;

        return response()->json([
            'status' => 'success',
            'data' => [
                'recommended' => $recommended,
                'continue_item' => $continueItem,
            ],
        ]);
    }
}

