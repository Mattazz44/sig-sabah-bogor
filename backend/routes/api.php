<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TouristSpotController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// API Wisata Bogor (PostGIS GeoJSON & JSON)
Route::get('/tourists', [TouristSpotController::class, 'index']);
Route::get('/tourists/{slugOrId}', [TouristSpotController::class, 'show']);
