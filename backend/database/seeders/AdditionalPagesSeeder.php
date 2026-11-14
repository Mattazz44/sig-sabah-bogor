<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SavedActivity;
use App\Models\CustomRoute;
use App\Models\ActivityPost;
use App\Models\TouristSpot;
use Illuminate\Support\Facades\Hash;

class AdditionalPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. SEED DATA USERS
        // Akun Administrator Khusus Panel Admin Backend
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator',
                'email' => 'admin@gmail.com',
                'avatar' => '/images/avatars/avatar-ambalingham.jpg',
                'bio' => 'Administrator Pengelola SIG Pariwisata Kota Bogor.',
                'password' => Hash::make('admin123'),
            ]
        );

        // Akun User Ambalingham yang dipakai/terlogin pada frontend
        $ambalingham = User::updateOrCreate(
            ['email' => 'ambalingham@gmail.com'],
            [
                'name' => 'Ambalingham',
                'username' => 'ambalingham',
                'avatar' => '/images/avatars/avatar-ambalingham.jpg',
                'bio' => 'Penjelajah alam dan pecinta curug di Bogor.',
                'password' => Hash::make('password123'),
            ]
        );

        $kirk = User::updateOrCreate(
            ['email' => 'kirk@gmail.com'],
            [
                'name' => 'Kirk hasibuan',
                'username' => 'kirkhasibuan',
                'avatar' => '/images/avatars/avatar-kirk.jpg',
                'bio' => 'Penggemar wisata budaya, sejarah, dan spot edukasi Bogor.',
                'password' => Hash::make('password123'),
            ]
        );

        $sarah = User::updateOrCreate(
            ['email' => 'sarah@gmail.com'],
            [
                'name' => 'Sarah Melati',
                'username' => 'sarahmelati',
                'avatar' => '/images/avatars/avatar-ambalingham.jpg',
                'bio' => 'Pecinta trekking dan petualangan jernihnya Curug Sentul.',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. SEED DATA TERSIMPAN: Tempat Wisata yang Disimpan / Disukai (Milik User Ambalingham)
        SavedActivity::truncate();

        $museumZoologi = TouristSpot::where('slug', 'museum-zoologi-bogor')->first();
        $museumPeta = TouristSpot::where('slug', 'museum-peta')->first();
        $lawangSurya = TouristSpot::where('slug', 'lawang-surya-kencana')->first();
        $tuguKujang = TouristSpot::where('slug', 'tugu-kujang')->first();

        if ($museumZoologi) {
            SavedActivity::create([
                'user_id' => $ambalingham->id,
                'tourist_spot_id' => $museumZoologi->id,
                'spot_slug' => $museumZoologi->slug,
                'name' => $museumZoologi->name,
                'location' => 'Bogor Tengah',
                'date_label' => '3 hari lalu',
            ]);
        }

        if ($museumPeta) {
            SavedActivity::create([
                'user_id' => $ambalingham->id,
                'tourist_spot_id' => $museumPeta->id,
                'spot_slug' => $museumPeta->slug,
                'name' => $museumPeta->name,
                'location' => 'Bogor Kota',
                'date_label' => '1 minggu lalu',
            ]);
        }

        if ($lawangSurya) {
            SavedActivity::create([
                'user_id' => $ambalingham->id,
                'tourist_spot_id' => $lawangSurya->id,
                'spot_slug' => $lawangSurya->slug,
                'name' => $lawangSurya->name,
                'location' => 'Suryakencana, Bogor',
                'date_label' => '2 minggu lalu',
            ]);
        }

        if ($tuguKujang) {
            SavedActivity::create([
                'user_id' => $ambalingham->id,
                'tourist_spot_id' => $tuguKujang->id,
                'spot_slug' => $tuguKujang->slug,
                'name' => $tuguKujang->name,
                'location' => 'Tegallega, Bogor',
                'date_label' => '1 bulan lalu',
            ]);
        }

        // 3. SEED DATA TERSIMPAN: Rute Custom (Milik User Ambalingham)
        CustomRoute::truncate();

        CustomRoute::create([
            'user_id' => $ambalingham->id,
            'slug' => 'cr-museum',
            'title' => 'Tur Edukasi: Museum of Zoology ➔ Museum PETA',
            'desc' => 'Rute Favorit Edukasi & Sejarah Bogor',
            'is_primary' => true,
            'total_distance' => '5.4 KM',
            'total_duration' => '15 Menit',
            'place_ids' => array_filter([$museumZoologi?->id ?? 10, $museumPeta?->id ?? 4]),
            'stops' => [
                [
                    'name' => 'Museum of zoology - Bogor Tengah',
                    'type' => 'Transit Pertama',
                    'distance' => '2.5 KM',
                    'place' => $museumZoologi ? [
                        'id' => $museumZoologi->id,
                        'slug' => $museumZoologi->slug,
                        'name' => $museumZoologi->name,
                        'coordinates' => ['lat' => (float)$museumZoologi->latitude, 'lng' => (float)$museumZoologi->longitude],
                        'image' => $museumZoologi->image,
                    ] : null,
                ],
                [
                    'name' => 'Museum PETA - Bogor Kota',
                    'type' => 'Destinasi Akhir',
                    'distance' => '3.0 KM',
                    'place' => $museumPeta ? [
                        'id' => $museumPeta->id,
                        'slug' => $museumPeta->slug,
                        'name' => $museumPeta->name,
                        'coordinates' => ['lat' => (float)$museumPeta->latitude, 'lng' => (float)$museumPeta->longitude],
                        'image' => $museumPeta->image,
                    ] : null,
                ],
            ],
        ]);

        CustomRoute::create([
            'user_id' => $ambalingham->id,
            'slug' => 'cr-kuliner',
            'title' => 'Kuliner Legendaris Suryakencana',
            'desc' => 'Dibuat 1 minggu lalu',
            'is_primary' => false,
            'total_distance' => '3.0 KM',
            'total_duration' => '10 Menit',
            'place_ids' => array_filter([$lawangSurya?->id ?? 2]),
            'stops' => [
                [
                    'name' => 'Lawang Surya Kencana',
                    'type' => 'Titik Kunjungan',
                    'distance' => '3.0 KM',
                    'place' => $lawangSurya ? [
                        'id' => $lawangSurya->id,
                        'slug' => $lawangSurya->slug,
                        'name' => $lawangSurya->name,
                        'coordinates' => ['lat' => (float)$lawangSurya->latitude, 'lng' => (float)$lawangSurya->longitude],
                        'image' => $lawangSurya->image,
                    ] : null,
                ],
            ],
        ]);

        // 4. TABEL AKTIVITAS: Tidak di-seed sesuai instruksi pengguna (dimulai dalam keadaan kosong)
        ActivityPost::truncate();
    }
}
