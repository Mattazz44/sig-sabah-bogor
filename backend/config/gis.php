<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Kota Bogor Administrative Boundary GeoJSON
    |--------------------------------------------------------------------------
    |
    | Lokasi utama file GeoJSON batas wilayah administratif Kota Bogor (WGS84 / EPSG:4326).
    | Jika file utama tidak ditemukan, loader otomatis memeriksa lokasi fallback di
    | backend/storage/app/gis/bogor_boundary.geojson, lalu beralih ke bounding box darurat.
    |
    */
    'bogor_boundary_path' => env('BOGOR_BOUNDARY_GEOJSON', database_path('data/bogor_boundary.geojson')),

    'bogor_boundary_fallback_path' => storage_path('app/gis/bogor_boundary.geojson'),

    'srid' => 4326,

    /*
    |--------------------------------------------------------------------------
    | Emergency Fallback Bounding Box (Kota Bogor)
    |--------------------------------------------------------------------------
    |
    | Digunakan hanya bila file GeoJSON utama maupun fallback belum tersedia di disk,
    | sehingga aplikasi tidak crash dan tetap memfilter titik ekstrem di luar Kota Bogor.
    |
    */
    'fallback_bbox' => [
        'min_lat' => -6.6850,
        'max_lat' => -6.5050,
        'min_lng' => 106.7300,
        'max_lng' => 106.8550,
    ],
];
