<?php

namespace Tests\Feature;

use App\Models\SpatialQuarantine;
use App\Models\TouristSpot;
use App\Models\User;
use App\Services\SpatialBoundaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SilentSpatialValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        SpatialBoundaryService::clearCache();
    }

    private function createAdminUser(): User
    {
        $admin = User::factory()->create([
            'name' => 'Admin GIS',
            'username' => 'admingis',
            'email' => 'admingis@example.com',
            'password' => Hash::make('adminpass123'),
        ]);
        $admin->forceFill(['role' => 'admin'])->save();

        return $admin;
    }

    public function test_api_store_inside_kota_bogor_persists_to_main_table(): void
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('admin-api')->plainTextToken;

        // Koordinat Kebun Raya Bogor (Bogor Tengah, di dalam poligon Kota Bogor)
        $response = $this->withToken($token)->postJson('/api/tourists', [
            'name' => 'Taman Koleksi Kota Bogor',
            'category' => 'Alam & Curug',
            'latitude' => -6.5976,
            'longitude' => 106.7996,
            'address' => 'Paledang, Bogor Tengah, Kota Bogor',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', "Tempat wisata 'Taman Koleksi Kota Bogor' berhasil ditambahkan.")
            ->assertJsonPath('data.name', 'Taman Koleksi Kota Bogor');

        $this->assertDatabaseHas('tourist_spots', [
            'name' => 'Taman Koleksi Kota Bogor',
        ]);
        $this->assertSame(0, SpatialQuarantine::count());
    }

    public function test_api_store_outside_kota_bogor_returns_fake_201_and_quarantines_silently(): void
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('admin-api')->plainTextToken;

        // Koordinat Puncak / Cisarua, Kabupaten Bogor (di luar poligon Kota Bogor)
        $response = $this->withToken($token)->postJson('/api/tourists', [
            'name' => 'Wisata Puncak Luar Batas',
            'category' => 'Alam & Curug',
            'latitude' => -6.7024,
            'longitude' => 106.9950,
            'address' => 'Cisarua, Kabupaten Bogor',
            'ticket_price' => 'Rp 25.000',
            'rating' => 4.7,
        ]);

        // Fake Success Response: tetap 201 Created dengan format identik standar
        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', "Tempat wisata 'Wisata Puncak Luar Batas' berhasil ditambahkan.")
            ->assertJsonPath('data.name', 'Wisata Puncak Luar Batas')
            ->assertJsonPath('data.coordinates.lat', -6.7024)
            ->assertJsonPath('data.coordinates.lng', 106.995)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'slug',
                    'name',
                    'category',
                    'latitude',
                    'longitude',
                    'coordinates' => ['lat', 'lng'],
                    'geometry' => ['type', 'coordinates'],
                ],
            ]);

        // Auto-Kill: TIDAK masuk ke tabel utama tourist_spots
        $this->assertDatabaseMissing('tourist_spots', [
            'name' => 'Wisata Puncak Luar Batas',
        ]);

        // Quarantine: tercatat lengkap di spatial_quarantines beserta user_id & geometri
        $this->assertSame(1, SpatialQuarantine::count());
        $quarantined = SpatialQuarantine::firstOrFail();
        $this->assertSame($admin->id, $quarantined->user_id);
        $this->assertSame('create', $quarantined->action);
        $this->assertSame('api', $quarantined->source_channel);
        $this->assertSame('OUTSIDE_KOTA_BOGOR_BOUNDARY', $quarantined->reason);
        $this->assertSame('Point', $quarantined->rejected_geometry['type'] ?? null);
        $this->assertSame([106.995, -6.7024], $quarantined->rejected_geometry['coordinates'] ?? null);
    }

    public function test_api_update_to_outside_coordinates_returns_fake_200_without_mutating_spot(): void
    {
        $admin = $this->createAdminUser();
        $token = $admin->createToken('admin-api')->plainTextToken;

        $spot = TouristSpot::create([
            'slug' => 'taman-sempur-test',
            'name' => 'Taman Sempur Test',
            'category' => 'Alam & Curug',
            'latitude' => -6.5917,
            'longitude' => 106.8008,
            'address' => 'Sempur, Bogor Tengah, Kota Bogor',
        ]);

        // Admin mencoba menggeser koordinat ke Sentul / Babakan Madang (Kabupaten Bogor)
        $response = $this->withToken($token)->putJson("/api/tourists/{$spot->id}", [
            'name' => 'Taman Sempur Geser Sentul',
            'category' => 'Alam & Curug',
            'latitude' => -6.5790,
            'longitude' => 106.9270,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', "Tempat wisata 'Taman Sempur Geser Sentul' berhasil diperbarui.")
            ->assertJsonPath('data.id', $spot->id);

        // Data asli di tabel utama tetap utuh pada nama & koordinat Kota Bogor semula
        $spot->refresh();
        $this->assertSame('Taman Sempur Test', $spot->name);
        $this->assertEqualsWithDelta(-6.5917, $spot->latitude, 0.0001);
        $this->assertEqualsWithDelta(106.8008, $spot->longitude, 0.0001);

        $quarantined = SpatialQuarantine::firstOrFail();
        $this->assertSame('update', $quarantined->action);
        $this->assertSame($spot->id, $quarantined->target_spot_id);
        $this->assertSame($admin->id, $quarantined->user_id);
    }

    public function test_web_admin_store_and_update_outside_kota_bogor_redirect_with_fake_success(): void
    {
        $admin = $this->createAdminUser();

        // 1. Web Admin Store di luar Kota Bogor (Tamansari, Kab. Bogor)
        $storeRes = $this->actingAs($admin, 'web')->post(route('admin.spots.store'), [
            'name' => 'Curug Luar Kota Web',
            'category' => 'Alam & Curug',
            'latitude' => -6.6664,
            'longitude' => 106.7247,
            'address' => 'Tamansari, Kabupaten Bogor',
        ]);

        $storeRes->assertRedirect(route('admin.spots.index'))
            ->assertSessionHas('success', "Tempat wisata 'Curug Luar Kota Web' berhasil ditambahkan ke database!");

        $this->assertDatabaseMissing('tourist_spots', ['name' => 'Curug Luar Kota Web']);
        $this->assertDatabaseHas('spatial_quarantines', [
            'user_id' => $admin->id,
            'spot_name' => 'Curug Luar Kota Web',
            'action' => 'create',
            'source_channel' => 'web_admin',
        ]);

        // 2. Web Admin Update di luar Kota Bogor
        $existing = TouristSpot::create([
            'slug' => 'tugu-kujang-test',
            'name' => 'Tugu Kujang Test',
            'category' => 'Edukasi & Budaya',
            'latitude' => -6.6017,
            'longitude' => 106.8048,
        ]);

        $updateRes = $this->actingAs($admin, 'web')->put(route('admin.spots.update', $existing->id), [
            'name' => 'Tugu Pindah Jakarta',
            'category' => 'Edukasi & Budaya',
            'latitude' => -6.2000,
            'longitude' => 106.8166,
        ]);

        $updateRes->assertRedirect(route('admin.spots.index'))
            ->assertSessionHas('success', "Tempat wisata 'Tugu Pindah Jakarta' berhasil diperbarui!");

        $existing->refresh();
        $this->assertSame('Tugu Kujang Test', $existing->name);
        $this->assertSame(2, SpatialQuarantine::count());
    }

    public function test_boundary_fallback_handles_missing_geojson_gracefully(): void
    {
        SpatialBoundaryService::clearCache();
        Config::set('gis.bogor_boundary_path', storage_path('app/gis/does_not_exist_1.geojson'));
        Config::set('gis.bogor_boundary_fallback_path', storage_path('app/gis/does_not_exist_2.geojson'));

        $service = app(SpatialBoundaryService::class);
        $this->assertNull($service->resolveBoundaryFilePath());

        // Titik pusat Kota Bogor tetap lolos via fallback_bbox
        $this->assertTrue($service->isWithinKotaBogor(-6.5976, 106.7996));
        // Titik jauh di luar (Jakarta / Puncak Timur) tetap ditolak tanpa error 500
        $this->assertFalse($service->isWithinKotaBogor(-6.2000, 106.8166));
        $this->assertFalse($service->isWithinKotaBogor(-6.7100, 106.9950));
    }
}
