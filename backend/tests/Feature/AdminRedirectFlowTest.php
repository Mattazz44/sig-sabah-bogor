<?php

namespace Tests\Feature;

use App\Models\TouristSpot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRedirectFlowTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        return $admin;
    }

    /**
     * @return array<int, TouristSpot>
     */
    private function seedSpots(int $count, string $category = 'Alam & Curug'): array
    {
        $spots = [];
        for ($i = 1; $i <= $count; $i++) {
            $spots[] = TouristSpot::create([
                'slug' => "spot-redirect-{$i}",
                'name' => "Destinasi Uji {$i}",
                'category' => $category,
                'latitude' => -6.5976,
                'longitude' => 106.7996,
                'address' => "Jl. Bogor No. {$i}",
            ]);
        }

        return $spots;
    }

    public function test_update_redirects_back_to_same_spots_page_and_filters_instead_of_page_one(): void
    {
        $admin = $this->createAdmin();
        $spots = $this->seedSpots(25, 'Alam & Curug');
        $target = $spots[0];

        $response = $this->actingAs($admin, 'web')->put(route('admin.spots.update', $target->id), [
            'name' => 'Destinasi Uji 1 Diperbarui',
            'category' => 'Alam & Curug',
            'latitude' => -6.5976,
            'longitude' => 106.7996,
            'return_category' => 'Alam & Curug',
            'return_q' => 'Destinasi',
            'return_page' => '3',
        ]);

        $response->assertRedirect(route('admin.spots.index', [
            'category' => 'Alam & Curug',
            'q' => 'Destinasi',
            'page' => 3,
        ]));
        $response->assertSessionHas('admin_feedback_type', 'save-success');
    }

    public function test_destroy_redirects_back_to_same_page_when_items_remain(): void
    {
        $admin = $this->createAdmin();
        $spots = $this->seedSpots(25, 'Kuliner');
        $target = $spots[0];

        $response = $this->actingAs($admin, 'web')->delete(route('admin.spots.destroy', $target->id), [
            'return_category' => 'Kuliner',
            'return_page' => '2',
        ]);

        $response->assertRedirect(route('admin.spots.index', [
            'category' => 'Kuliner',
            'page' => 2,
        ]));
        $response->assertSessionHas('admin_feedback_type', 'delete-success');
        $this->assertDatabaseMissing('tourist_spots', ['id' => $target->id]);
    }

    public function test_destroy_last_item_on_last_page_clamps_to_previous_valid_page(): void
    {
        $admin = $this->createAdmin();
        // 11 item = 2 halaman (halaman 1 berisi 10, halaman 2 berisi 1)
        $spots = $this->seedSpots(11, 'Edukasi & Budaya');
        $target = $spots[0];

        // Menghapus 1 item terakhir di halaman 2 menyisakan 10 item (maks halaman 1)
        $response = $this->actingAs($admin, 'web')->delete(route('admin.spots.destroy', $target->id), [
            'return_category' => 'Edukasi & Budaya',
            'return_page' => '2',
        ]);

        $response->assertRedirect(route('admin.spots.index', [
            'category' => 'Edukasi & Budaya',
        ]));
        $response->assertSessionHas('admin_feedback_type', 'delete-success');
    }

    public function test_edit_view_preserves_return_query_in_form_and_cancel_link(): void
    {
        $admin = $this->createAdmin();
        $spots = $this->seedSpots(25, 'Alam & Curug');
        $target = $spots[0];

        $response = $this->actingAs($admin, 'web')->get(route('admin.spots.edit', [
            'id' => $target->id,
            'category' => 'Alam & Curug',
            'q' => 'Bogor',
            'page' => 3,
        ]));

        $response->assertOk();
        $response->assertSee('name="return_category" value="Alam &amp; Curug"', false);
        $response->assertSee('name="return_q" value="Bogor"', false);
        $response->assertSee('name="return_page" value="3"', false);
    }

    public function test_malicious_or_invalid_return_params_are_sanitized(): void
    {
        $admin = $this->createAdmin();
        $spots = $this->seedSpots(5, 'Kuliner');
        $target = $spots[0];

        $response = $this->actingAs($admin, 'web')->put(route('admin.spots.update', $target->id), [
            'name' => 'Destinasi Aman',
            'category' => 'Kuliner',
            'latitude' => -6.5976,
            'longitude' => 106.7996,
            'return_category' => 'https://evil.example/phish',
            'return_page' => '-99',
        ]);

        $response->assertRedirect(route('admin.spots.index'));
    }
}
