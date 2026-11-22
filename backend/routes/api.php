<?php

use App\Http\Controllers\Api\ActivityPostController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ForYouController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\SavedActivityController;
use App\Http\Controllers\Api\TouristSpotController;
use Illuminate\Support\Facades\Route;

// 1. Auth & Users API
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1,login');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1,register');
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
Route::post('/auth/google/exchange', [GoogleAuthController::class, 'exchange'])->middleware('throttle:10,1')->name('auth.google.exchange');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/current-user', [AuthController::class, 'currentUser']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/update-avatar', [AuthController::class, 'updateAvatar']);
    Route::post('/users/{usernameOrId}/follow', [AuthController::class, 'toggleFollow']);

    // Halaman 'Tersimpan' & Rute Custom (khusus akun terautentikasi)
    Route::get('/saved-activities', [SavedActivityController::class, 'index']);
    Route::post('/saved-activities', [SavedActivityController::class, 'storeActivity']);
    Route::delete('/saved-activities/{id}', [SavedActivityController::class, 'destroyActivity']);
    Route::post('/custom-routes', [SavedActivityController::class, 'storeCustomRoute']);
    Route::delete('/custom-routes/{slugOrId}', [SavedActivityController::class, 'destroyCustomRoute']);

    // Mutasi Aktivitas
    Route::post('/activities', [ActivityPostController::class, 'store']);
    Route::delete('/activities/{id}', [ActivityPostController::class, 'destroy']);
});

Route::get('/users/{usernameOrId}', [AuthController::class, 'userProfile']);

// 2. API Wisata Bogor (Publik Read & Admin-Only Write)
Route::get('/tourists', [TouristSpotController::class, 'index']);
Route::get('/tourists/{slugOrId}', [TouristSpotController::class, 'show']);
Route::get('/boundary', [TouristSpotController::class, 'boundary']);

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/tourists', [TouristSpotController::class, 'store']);
    Route::match(['put', 'patch', 'post'], '/tourists/{id}', [TouristSpotController::class, 'update']);
    Route::delete('/tourists/{id}', [TouristSpotController::class, 'destroy']);
});

// Endpoint Media Gambar dengan sanitasi path ketat & validasi realpath di dalam public/images
Route::get('/media/{filename}', function (string $filename) {
    $normalized = str_replace('\\', '/', $filename);
    if ($normalized === '' || str_contains($normalized, "\0") || str_contains($normalized, '..')) {
        abort(404);
    }

    $safeName = basename($normalized);
    if ($safeName === '' || $safeName === '.' || $safeName === '..') {
        abort(404);
    }

    $imagesRoot = realpath(public_path('images'));
    if ($imagesRoot === false) {
        abort(404);
    }

    $imagesRootPrefix = rtrim($imagesRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    $candidates = [
        public_path('images/spots/' . $safeName),
        public_path('images/avatars/' . $safeName),
        public_path('images/activities/' . $safeName),
        public_path('images/' . $safeName),
    ];

    $targetPath = null;
    foreach ($candidates as $candidate) {
        $resolved = realpath($candidate);
        if ($resolved !== false && is_file($resolved) && str_starts_with($resolved, $imagesRootPrefix)) {
            $targetPath = $resolved;
            break;
        }
    }

    if (!$targetPath) {
        abort(404);
    }

    return response()->file($targetPath, [
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('filename', '.*');

// 3. API Halaman 'Untuk Anda'
Route::get('/for-you', [ForYouController::class, 'index']);

// 4. API Halaman 'Aktivitas' (Feed publik)
Route::get('/activities', [ActivityPostController::class, 'index']);
