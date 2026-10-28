<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Pastikan ekstensi PostGIS aktif
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');

        Schema::create('tourist_spots', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->text('detailed_description')->nullable();
            $table->string('address')->nullable();
            $table->decimal('rating', 3, 1)->default(0.0);
            $table->string('operational_hours')->nullable();
            $table->string('ticket_price')->nullable();
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->boolean('is_popular')->default(false);
            $table->timestamps();
        });

        // Kolom spasial PostGIS: geometry(Point, 4326)
        DB::statement('ALTER TABLE tourist_spots ADD COLUMN geom geometry(Point, 4326)');
        DB::statement('CREATE INDEX idx_tourist_spots_geom ON tourist_spots USING GIST (geom)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tourist_spots');
    }
};
