<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_profile_name_and_bio(): void
    {
        $user = User::factory()->create([
            'name' => 'Penjelajah Awal',
            'bio' => 'Bio lama',
        ]);
        $token = $user->createToken('profile-test')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/auth/profile', [
            'name' => 'Raka Pratama',
            'bio' => 'Menjelajahi curug dan museum bersejarah di Kota Bogor.',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Raka Pratama')
            ->assertJsonPath('data.bio', 'Menjelajahi curug dan museum bersejarah di Kota Bogor.');

        $user->refresh();
        $this->assertSame('Raka Pratama', $user->name);
        $this->assertSame('Menjelajahi curug dan museum bersejarah di Kota Bogor.', $user->bio);
    }

    public function test_authenticated_user_can_change_password_and_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldsecret123'),
        ]);
        $token = $user->createToken('pw-test')->plainTextToken;

        $badRes = $this->withToken($token)->putJson('/api/auth/password', [
            'current_password' => 'salah123',
            'new_password' => 'newsecret456',
            'new_password_confirmation' => 'newsecret456',
        ]);
        $badRes->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $okRes = $this->withToken($token)->putJson('/api/auth/password', [
            'current_password' => 'oldsecret123',
            'new_password' => 'newsecret456',
            'new_password_confirmation' => 'newsecret456',
        ]);
        $okRes->assertOk()
            ->assertJsonPath('status', 'success');

        $user->refresh();
        $this->assertTrue(Hash::check('newsecret456', $user->password));
    }
}
