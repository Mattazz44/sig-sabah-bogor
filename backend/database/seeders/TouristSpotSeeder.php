<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TouristSpot;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TouristSpotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Base Spots dari file GeoJSON jika ada
        $jsonPath = database_path('data/tourist_spots.geojson');

        if (File::exists($jsonPath)) {
            $geoJson = json_decode(File::get($jsonPath), true);
            $features = $geoJson['features'] ?? [];

            foreach ($features as $feature) {
                $props = $feature['properties'] ?? [];
                $coords = $feature['geometry']['coordinates'] ?? null; // [longitude, latitude]

                $lon = $coords ? $coords[0] : ($props['longitude'] ?? null);
                $lat = $coords ? $coords[1] : ($props['latitude'] ?? null);

                $spot = TouristSpot::updateOrCreate(
                    ['slug' => $props['slug']],
                    [
                        'name' => $props['name'],
                        'category' => $props['category'],
                        'description' => $props['description'] ?? null,
                        'detailed_description' => $props['detailed_description'] ?? 'kosong',
                        'address' => $props['address'] ?? null,
                        'rating' => $props['rating'] ?? 0,
                        'operational_hours' => $props['operational_hours'] ?? null,
                        'ticket_price' => $props['ticket_price'] ?? null,
                        'image' => $props['image'] ?? null,
                        'gallery' => $props['gallery'] ?? [],
                        'latitude' => $lat,
                        'longitude' => $lon,
                        'is_popular' => $props['is_popular'] ?? false,
                    ]
                );

                $this->updateGeometry($spot->id, $lon, $lat);
            }

            $this->command->info(count($features) . " tourist spots seeded from GeoJSON.");
        }

        // 2. Seed Data Tambahan dari file CSV (tourist_spots_additional.csv)
        $csvPath = database_path('data/tourist_spots_additional.csv');

        if (File::exists($csvPath)) {
            $handle = fopen($csvPath, 'r');
            // Lewati baris header
            fgetcsv($handle, 0, ',', '"', '\\');

            $addedCount = 0;
            $skippedCount = 0;

            while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
                if (count($row) < 10) continue;

                $name = trim($row[0] ?? '');
                if (empty($name)) continue;

                $rawLat = trim($row[8] ?? '');
                $rawLon = trim($row[9] ?? '');

                // Parse koordinat (lat/long kosong atau '-' diabaikan)
                $lat = $this->parseCoordinate($rawLat, true);
                $lon = $this->parseCoordinate($rawLon, false);

                if ($lat === null || $lon === null) {
                    $skippedCount++;
                    continue;
                }

                $slug = Str::slug($name);

                // Cek apakah spot sudah ada di database
                $existingSpot = TouristSpot::where('slug', $slug)->first();

                // Format Jam Buka & Tutup
                $jamBuka = trim($row[13] ?? '');
                $jamTutup = trim($row[14] ?? '');
                $operationalHours = null;
                if (!empty($jamBuka) && !empty($jamTutup)) {
                    $operationalHours = "{$jamBuka} - {$jamTutup}";
                } elseif (!empty($jamBuka)) {
                    $operationalHours = $jamBuka;
                } elseif (!empty($jamTutup)) {
                    $operationalHours = "Tutup: {$jamTutup}";
                }

                // HTM Lokal
                $ticketPrice = !empty(trim($row[11] ?? '')) ? trim($row[11]) : null;

                // Alamat Lengkap
                $address = trim($row[3] ?? '');
                if (empty($address)) {
                    $kel = trim($row[4] ?? '');
                    $kec = trim($row[5] ?? '');
                    $address = trim(($kel ? $kel . ', ' : '') . ($kec ? $kec . ', ' : '') . 'Kota Bogor');
                }

                // Deskripsi Ringkas
                $shortDesc = trim($row[22] ?? '');
                if (empty($shortDesc)) {
                    $catName = trim($row[1] ?? 'Wisata');
                    $shortDesc = "Destinasi wisata {$catName} di kawasan Kota Bogor.";
                }

                // Deskripsi panjang diisi 'kosong' jika belum ada data sebelumnya
                $detailedDesc = ($existingSpot && $existingSpot->detailed_description && $existingSpot->detailed_description !== 'kosong')
                    ? $existingSpot->detailed_description
                    : 'kosong';

                // Image dikosongkan (null) jika tempat baru
                $image = $existingSpot?->image ?? null;

                // Harmonisasi kategori ke 3 kategori utama aplikasi (Alam & Curug, Kuliner, Edukasi & Budaya)
                $category = $this->mapCategory($row[1] ?? '', $row[2] ?? '', $name);

                $spot = TouristSpot::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $name,
                        'category' => $category,
                        'description' => $shortDesc,
                        'detailed_description' => $detailedDesc,
                        'address' => $address,
                        'rating' => $existingSpot?->rating ?: 4.5,
                        'operational_hours' => $operationalHours,
                        'ticket_price' => $ticketPrice,
                        'image' => $image,
                        'gallery' => $existingSpot?->gallery ?: [],
                        'latitude' => $lat,
                        'longitude' => $lon,
                        'is_popular' => $existingSpot?->is_popular ?? false,
                    ]
                );

                $this->updateGeometry($spot->id, $lon, $lat);
                $addedCount++;
            }

            fclose($handle);
            $this->command->info("{$addedCount} spots from CSV processed ({$skippedCount} skipped due to empty coords).");
        }
    }

    /**
     * Memetakan kategori dataset mentah ke 3 kategori utama SIG Sabah:
     * - 'Alam & Curug'
     * - 'Kuliner'
     * - 'Edukasi & Budaya'
     */
    private function mapCategory(string $rawCategory, string $subCategory = '', string $name = ''): string
    {
        $cat = mb_strtolower(trim($rawCategory));
        $sub = mb_strtolower(trim($subCategory));
        $nm  = mb_strtolower(trim($name));

        if (str_contains($cat, 'kuliner') || str_contains($cat, 'belanja') || 
            str_contains($sub, 'kuliner') || str_contains($sub, 'pasar') || 
            str_contains($nm, 'pasar') || str_contains($nm, 'kuliner') || str_contains($nm, 'mall')) {
            return 'Kuliner';
        }

        if (str_contains($cat, 'sejarah') || str_contains($cat, 'budaya') || 
            str_contains($cat, 'edukasi') || str_contains($cat, 'landmark') || 
            str_contains($cat, 'kampung') || str_contains($sub, 'heritage') || 
            str_contains($sub, 'monumen') || str_contains($sub, 'museum') || 
            str_contains($nm, 'museum') || str_contains($nm, 'prasasti') || 
            str_contains($nm, 'tugu') || str_contains($nm, 'istana') || str_contains($nm, 'makam')) {
            return 'Edukasi & Budaya';
        }

        // Default untuk wisata alam, ruang publik, taman kota, curug, agrowisata, rekreasi keluarga/air
        return 'Alam & Curug';
    }

    /**
     * Update spatial geometry kolom geom: ST_SetSRID(ST_MakePoint(lon, lat), 4326) / Point(lon, lat)
     */
    private function updateGeometry(int $spotId, ?float $lon, ?float $lat): void
    {
        if ($lon === null || $lat === null) {
            return;
        }

        try {
            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement(
                    'UPDATE tourist_spots SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?',
                    [$lon, $lat, $spotId]
                );
            } elseif ($driver === 'mysql') {
                DB::statement(
                    'UPDATE tourist_spots SET geom = POINT(?, ?) WHERE id = ?',
                    [$lon, $lat, $spotId]
                );
            }
        } catch (\Throwable $e) {
            // Abaikan jika kolom geom belum ditambahkan atau tipe spatial tidak aktif
        }
    }

    /**
     * Normalisasi dan validasi koordinat latitude dan longitude.
     */
    private function parseCoordinate($str, bool $isLat = true): ?float
    {
        $s = trim((string)$str);
        if ($s === '' || $s === '-' || $s === 'null') {
            return null;
        }

        // Format angka desimal standar: misal -6.599722 atau 106.8
        if (preg_match('/^-?\d+\.\d+$/', $s)) {
            return (float)$s;
        }

        // Format dengan tanda koma tunggal: misal -6,55225
        if (substr_count($s, ',') === 1 && !str_contains($s, '.')) {
            $candidate = (float)str_replace(',', '.', $s);
            if ($isLat && $candidate >= -7.5 && $candidate <= -6.0) return $candidate;
            if (!$isLat && $candidate >= 106.0 && $candidate <= 108.0) return $candidate;
        }

        // Hapus pemisah ribuan atau format integer hasil konversi format Excel
        $clean = preg_replace('/[^\d]/', '', $s);
        if ($clean === '') {
            return null;
        }

        $num = (float)$clean;
        if ($isLat) {
            while ($num > 7.5) {
                $num /= 10.0;
            }
            $val = -$num;
            if ($val >= -7.5 && $val <= -6.0) {
                return round($val, 7);
            }
        } else {
            while ($num > 108.0) {
                $num /= 10.0;
            }
            if ($num >= 106.0 && $num <= 108.0) {
                return round($num, 7);
            }
        }

        return null;
    }
}
