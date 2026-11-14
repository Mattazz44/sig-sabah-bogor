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
            // Harmonisasi kategori ke 'Alam & Curug'
            DB::statement("UPDATE tourist_spots SET category = 'Alam & Curug' WHERE category IN ('Wisata Alam', 'Ruang Publik', 'Rekreasi Keluarga', 'Agrowisata', 'Alam')");

            // Harmonisasi kategori ke 'Kuliner'
            DB::statement("UPDATE tourist_spots SET category = 'Kuliner' WHERE category IN ('Belanja', 'Sentra Kuliner')");

            // Harmonisasi kategori ke 'Edukasi & Budaya'
            DB::statement("UPDATE tourist_spots SET category = 'Edukasi & Budaya' WHERE category IN ('Sejarah & Budaya', 'Edukasi', 'Landmark', 'Kampung Wisata', 'Budaya')");
        } catch (\Throwable $e) {
            // Abaikan jika tabel belum siap
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};

