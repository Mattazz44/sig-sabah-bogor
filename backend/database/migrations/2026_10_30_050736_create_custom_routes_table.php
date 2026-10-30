<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('custom_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('slug')->unique()->nullable();
            $table->string('title');
            $table->string('desc')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->json('stops')->nullable();
            $table->string('total_distance')->nullable();
            $table->string('total_duration')->nullable();
            $table->json('place_ids')->nullable(); // ID objek wisata yang dilewati
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_routes');
    }
};
