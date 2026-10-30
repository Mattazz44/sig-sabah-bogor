<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TouristSpot;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class TouristSpotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data/tourist_spots.geojson');

        if (!File::exists($jsonPath)) {
            $this->command->error("GeoJSON file not found at: {$jsonPath}");
            return;
        }

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
                    'detailed_description' => $props['detailed_description'] ?? null,
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

            // Update PostGIS geometry kolom geom: ST_SetSRID(ST_MakePoint(lon, lat), 4326)
            if ($lon !== null && $lat !== null) {
                DB::statement(
                    'UPDATE tourist_spots SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?',
                    [$lon, $lat, $spot->id]
                );
            }
        }

        $this->command->info(count($features) . " tourist spots seeded successfully with PostGIS geometry!");
    }
}
