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
        try {
            // Update postingan yang masih mengarah ke /images/ root
            DB::statement("UPDATE activity_posts SET image = REPLACE(image, '/images/', '/images/activities/') WHERE image NOT LIKE '/images/activities/%' AND image NOT LIKE '/images/spots/%' AND image NOT LIKE '/images/avatars/%' AND image LIKE '/images/%'");

            // Perbaiki record khusus curug-cikuluwung dan curug-leuwi-hejo
            DB::statement("UPDATE activity_posts SET image = '/images/activities/curug-cikuluwung.jpg' WHERE image = '/images/curug-cikuluwung.jpg' OR image = '/images/spots/curug-cikuluwung.jpg' OR image LIKE 'blob:%'");
            DB::statement("UPDATE activity_posts SET image = '/images/activities/curug-leuwi-hejo.jpg' WHERE image = '/images/curug-leuwi-hejo.jpg' OR image = '/images/spots/curug-leuwi-hejo.jpg'");
        } catch (\Throwable $e) {
            // Abaikan jika tabel atau kolom belum siap
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            DB::statement("UPDATE activity_posts SET image = REPLACE(image, '/images/activities/', '/images/') WHERE image LIKE '/images/activities/%'");
        } catch (\Throwable $e) {
            // Abaikan
        }
    }
};

