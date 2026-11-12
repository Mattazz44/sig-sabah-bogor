<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminTouristSpotController;

// 1. Rute Autentikasi Admin (Login & Logout)
Route::get('/login', [AdminAuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AdminAuthController::class, 'login'])->name('admin.login.submit');
Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');

// 2. Rute Admin yang Diproteksi Autentikasi (auth middleware)
Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminTouristSpotController::class, 'index'])->name('index');
    Route::get('/spots', [AdminTouristSpotController::class, 'index'])->name('spots.index');
    Route::get('/spots/create', [AdminTouristSpotController::class, 'create'])->name('spots.create');
    Route::post('/spots', [AdminTouristSpotController::class, 'store'])->name('spots.store');
    Route::get('/spots/{id}/edit', [AdminTouristSpotController::class, 'edit'])->name('spots.edit');
    Route::put('/spots/{id}', [AdminTouristSpotController::class, 'update'])->name('spots.update');
    Route::delete('/spots/{id}', [AdminTouristSpotController::class, 'destroy'])->name('spots.destroy');
});

// 3. Halaman Pengguna Umum (React PWA SPA)
$servePwaApp = function () {
    $indexPath = public_path('index.html');
    if (!file_exists($indexPath)) {
        abort(404, 'Frontend PWA build (public/index.html) belum tersedia.');
    }

    return response(file_get_contents($indexPath), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
    ]);
};

Route::get('/', $servePwaApp)->name('pwa.home');

// Fallback untuk route SPA React (misal /place/slug-wisata, /for-you, /saved, /activities)
Route::get('/{any}', $servePwaApp)
    ->where('any', '^(?!api|admin|login|logout|images|assets).*$');
