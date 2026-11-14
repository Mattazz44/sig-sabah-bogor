<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TouristSpotController;
use App\Http\Controllers\Api\ForYouController;
use App\Http\Controllers\Api\SavedActivityController;
use App\Http\Controllers\Api\ActivityPostController;
use App\Http\Controllers\Api\AuthController;

// 1. Auth & Users API
Route::get('/auth/current-user', [AuthController::class, 'currentUser']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/update-avatar', [AuthController::class, 'updateAvatar']);
Route::get('/users/{usernameOrId}', [AuthController::class, 'userProfile']);
Route::post('/users/{usernameOrId}/follow', [AuthController::class, 'toggleFollow']);

// 2. API Wisata Bogor (Explore & Detail & Batas Wilayah)
Route::get('/tourists', [TouristSpotController::class, 'index']);
Route::get('/tourists/{slugOrId}', [TouristSpotController::class, 'show']);
Route::get('/boundary', [TouristSpotController::class, 'boundary']);

// Endpoint Media Gambar dengan CORS penuh (pencarian di folder spots, avatars, dan root images)
Route::get('/media/{filename}', function (string $filename) {
    $safeName = basename($filename);
    $candidates = [
        public_path('images/spots/' . $safeName),
        public_path('images/avatars/' . $safeName),
        public_path('images/activities/' . $safeName),
        public_path('images/' . $filename),
        public_path('images/' . $safeName),
    ];

    $targetPath = null;
    foreach ($candidates as $candidate) {
        if (file_exists($candidate)) {
            $targetPath = $candidate;
            break;
        }
    }

    if (!$targetPath) {
        abort(404);
    }

    return response()->file($targetPath, [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Headers' => '*',
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('filename', '.*');

// 3. API Halaman 'Untuk Anda'
Route::get('/for-you', [ForYouController::class, 'index']);

// 4. API Halaman 'Tersimpan' & Rute Custom
Route::get('/saved-activities', [SavedActivityController::class, 'index']);
Route::post('/saved-activities', [SavedActivityController::class, 'storeActivity']);
Route::post('/custom-routes', [SavedActivityController::class, 'storeCustomRoute']);

// 5. API Halaman 'Aktivitas' (Kamu & Komunitas)
Route::get('/activities', [ActivityPostController::class, 'index']);
Route::post('/activities', [ActivityPostController::class, 'store']);
Route::delete('/activities/{id}', [ActivityPostController::class, 'destroy']);
