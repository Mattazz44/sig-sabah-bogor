<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
        }

        Schema::create('spatial_quarantines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 32)->default('create'); // create | update
            $table->string('source_channel', 32)->default('api'); // api | web_admin
            $table->unsignedBigInteger('target_spot_id')->nullable()->index();
            $table->string('spot_name');
            $table->string('category', 100)->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->json('rejected_geometry');
            $table->json('payload_snapshot')->nullable();
            $table->string('reason', 100)->default('OUTSIDE_KOTA_BOGOR_BOUNDARY');
            $table->timestamps();

            $table->index(['created_at', 'reason']);
        });

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE spatial_quarantines ADD COLUMN geom geometry(Point, 4326)');
            DB::statement('CREATE INDEX idx_spatial_quarantines_geom ON spatial_quarantines USING GIST (geom)');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE spatial_quarantines ADD COLUMN geom POINT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spatial_quarantines');
    }
};
