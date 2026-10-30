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
        // 1. SEED DATA USERS (Termasuk akun Ambalingham yang dipakai di frontend)
        $ambalingham = User::updateOrCreate(
            ['email' => 'ambalingham@gmail.com'],
            [
                'name' => 'Ambalingham',
                'username' => 'ambalingham',
                'avatar' => '/images/avatar-ambalingham.jpg',
                'bio' => 'Penjelajah alam dan pecinta curug di Bogor.',
                'password' => Hash::make('password123'),
            ]
        );

        $kirk = User::updateOrCreate(
            ['email' => 'kirk@gmail.com'],
            [
                'name' => 'Kirk hasibuan',
                'username' => 'kirkhasibuan',
                'avatar' => '/images/avatar-kirk.jpg',
                'bio' => 'Penggemar wisata budaya, sejarah, dan spot edukasi Bogor.',
                'password' => Hash::make('password123'),
            ]
        );

        $sarah = User::updateOrCreate(
            ['email' => 'sarah@gmail.com'],
            [
                'name' => 'Sarah Melati',
                'username' => 'sarahmelati',
                'avatar' => '/images/avatar-ambalingham.jpg',
                'bio' => 'Pecinta trekking dan petualangan jernihnya Curug Sentul.',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. SEED DATA TERSIMPAN: Aktivitas Perjalanan (Milik User Ambalingham)
        SavedActivity::truncate();
        SavedActivity::create([
            'user_id' => $ambalingham->id,
            'name' => 'Bersepeda Santai Akhir Pekan',
            'location' => 'Taman Peranginan',
            'date_label' => '2 hari lalu',
        ]);

        // 3. SEED DATA TERSIMPAN: Rute Custom (Milik User Ambalingham)
        CustomRoute::truncate();

        $museumZoologi = TouristSpot::where('slug', 'museum-zoologi-bogor')->first();
        $museumPeta = TouristSpot::where('slug', 'museum-peta')->first();
        $lawangSurya = TouristSpot::where('slug', 'lawang-surya-kencana')->first();

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

        // 4. SEED DATA AKTIVITAS: Postingan Pengguna & Komunitas
        ActivityPost::truncate();

        // Aktivitas "Kamu" (Ambalingham)
        ActivityPost::create([
            'user_id' => $ambalingham->id,
            'user_name' => $ambalingham->name,
            'user_avatar' => $ambalingham->avatar,
            'date' => '1 sep',
            'image' => '/images/curug-cikuluwung.jpg',
            'title' => 'Perjalanan alam ke curug cikuluwung',
            'location' => 'Curug cikuluwung - Bogor selatan',
            'is_community' => false,
            'is_other_user' => false,
        ]);

        ActivityPost::create([
            'user_id' => $ambalingham->id,
            'user_name' => $ambalingham->name,
            'user_avatar' => $ambalingham->avatar,
            'date' => '1 sep',
            'image' => '/images/curug-cikuluwung.jpg',
            'title' => 'Perjalanan alam ke curug cikuluwung',
            'location' => 'Curug cikuluwung - Bogor selatan',
            'is_community' => false,
            'is_other_user' => false,
        ]);

        // Aktivitas "Komunitas" (Kirk, Ambalingham, Sarah)
        ActivityPost::create([
            'user_id' => $kirk->id,
            'user_name' => $kirk->name,
            'user_avatar' => $kirk->avatar,
            'date' => '1 sep',
            'image' => '/images/curug-cikuluwung.jpg',
            'title' => 'Perjalanan alam ke curug cikuluwung',
            'location' => 'Curug cikuluwung - Bogor selatan',
            'is_community' => true,
            'is_other_user' => true,
        ]);

        ActivityPost::create([
            'user_id' => $ambalingham->id,
            'user_name' => $ambalingham->name,
            'user_avatar' => $ambalingham->avatar,
            'date' => '1 sep',
            'image' => '/images/curug-cikuluwung.jpg',
            'title' => 'Perjalanan alam ke curug cikuluwung',
            'location' => 'Curug cikuluwung - Bogor selatan',
            'is_community' => true,
            'is_other_user' => false,
        ]);

        ActivityPost::create([
            'user_id' => $sarah->id,
            'user_name' => $sarah->name,
            'user_avatar' => $sarah->avatar,
            'date' => '28 agt',
            'image' => '/images/curug-leuwi-hejo.jpg',
            'title' => 'Eksplorasi jernihnya Curug Leuwi Hejo',
            'location' => 'Curug Leuwi Hejo - Babakan Madang, Bogor',
            'is_community' => true,
            'is_other_user' => true,
        ]);
    }
}
