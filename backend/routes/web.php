<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminTouristSpotController;

// Rute Autentikasi Admin (Login & Logout)
Route::get('/login', [AdminAuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AdminAuthController::class, 'login'])->name('admin.login.submit');
Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');

// Rute Admin yang Diproteksi Autentikasi (auth middleware)
Route::middleware('auth')->group(function () {
    // Halaman utama mengarah langsung ke Dashboard Tempat Wisata
    Route::get('/', [AdminTouristSpotController::class, 'index'])->name('admin.home');

    // CRUD Tempat Wisata
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminTouristSpotController::class, 'index'])->name('index');
        Route::get('/spots', [AdminTouristSpotController::class, 'index'])->name('spots.index');
        Route::get('/spots/create', [AdminTouristSpotController::class, 'create'])->name('spots.create');
        Route::post('/spots', [AdminTouristSpotController::class, 'store'])->name('spots.store');
        Route::get('/spots/{id}/edit', [AdminTouristSpotController::class, 'edit'])->name('spots.edit');
        Route::put('/spots/{id}', [AdminTouristSpotController::class, 'update'])->name('spots.update');
        Route::delete('/spots/{id}', [AdminTouristSpotController::class, 'destroy'])->name('spots.destroy');
    });
});
