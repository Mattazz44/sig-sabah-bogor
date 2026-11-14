<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Pisahkan path gambar wisata ke /images/spots/
        try {
            DB::statement("UPDATE tourist_spots SET image = REPLACE(image, '/images/', '/images/spots/'), gallery = REPLACE(gallery, '/images/', '/images/spots/') WHERE image NOT LIKE '/images/spots/%' AND image LIKE '/images/%'");
        } catch (\Throwable $e) {
            // Ignore if columns differ
        }

        // Pisahkan path avatar pengguna ke /images/avatars/
        try {
            DB::statement("UPDATE users SET avatar = REPLACE(avatar, '/images/', '/images/avatars/') WHERE avatar NOT LIKE '/images/avatars/%' AND avatar LIKE '/images/%'");
        } catch (\Throwable $e) {
            // Ignore if columns differ
        }

        // Bersihkan data gambar postingan aktivitas yang tersimpan sebagai blob: atau direktori lama
        try {
            DB::statement("UPDATE activity_posts SET image = '/images/activities/curug-cikuluwung.jpg' WHERE image LIKE 'blob:%' OR image = '/images/spots/curug-cikuluwung.jpg' OR image = '/images/curug-cikuluwung.jpg'");
            DB::statement("UPDATE activity_posts SET image = '/images/activities/curug-leuwi-hejo.jpg' WHERE image = '/images/curug-leuwi-hejo.jpg'");
        } catch (\Throwable $e) {
            // Ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            DB::statement("UPDATE tourist_spots SET image = REPLACE(image, '/images/spots/', '/images/'), gallery = REPLACE(gallery, '/images/spots/', '/images/') WHERE image LIKE '/images/spots/%'");
            DB::statement("UPDATE users SET avatar = REPLACE(avatar, '/images/avatars/', '/images/') WHERE avatar LIKE '/images/avatars/%'");
        } catch (\Throwable $e) {
            // Ignore
        }
    }
};

