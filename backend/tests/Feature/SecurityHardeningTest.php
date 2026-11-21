<?php

namespace Tests\Feature;

use App\Models\ActivityPost;
use App\Models\CustomRoute;
use App\Models\SavedActivity;
use App\Models\TouristSpot;
use App\Models\User;
use App\Services\ImageCompressor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function withSanctumToken(?string $token): self
    {
        $this->app['auth']->forgetGuards();

        return $token ? $this->withToken($token) : $this->flushHeaders();
    }

    public function test_login_requires_password_and_rejects_backdoors(): void
    {
        User::factory()->create([
            'name' => 'Ambalingham',
            'username' => 'ambalingham',
            'email' => 'ambalingham@gmail.com',
            'password' => Hash::make('RealSecret999!'),
        ]);

        // 1. Kosongkan payload -> tidak boleh fallback ke ambalingham@gmail.com
        $this->postJson('/api/auth/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // 2. Email valid tanpa password -> wajib ditolak 422
        $this->postJson('/api/auth/login', [
            'email' => 'ambalingham@gmail.com',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // 3. Hardcoded master password lama 'password123' -> wajib ditolak 401
        $this->postJson('/api/auth/login', [
            'email' => 'ambalingham@gmail.com',
            'password' => 'password123',
        ])->assertStatus(401);

        // 4. Kredensial benar -> menerbitkan token Sanctum terverifikasi
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'ambalingham@gmail.com',
            'password' => 'RealSecret999!',
        ])->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('token_type', 'Bearer');

        $token = $loginRes->json('token');
        $this->assertNotEmpty($token);

        // current-user tanpa token -> 401
        $this->getJson('/api/auth/current-user')->assertStatus(401);

        // current-user dengan token valid -> mengembalikan user terautentikasi
        $this->withToken($token)
            ->getJson('/api/auth/current-user')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'ambalingham@gmail.com')
            ->assertJsonPath('data.role', 'user');
    }

    public function test_register_assigns_user_role_ignores_mass_assigned_role_and_issues_token(): void
    {
        $res = $this->postJson('/api/auth/register', [
            'name' => 'Penjelajah Baru',
            'email' => 'penjelajah@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'admin',
        ])->assertStatus(201);

        $token = $res->json('token');
        $this->assertNotEmpty($token);

        $user = User::where('email', 'penjelajah@example.com')->firstOrFail();
        $this->assertSame('user', $user->role);
        $this->assertFalse($user->isAdmin());
    }

    public function test_login_and_register_are_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'missing@example.com',
                'password' => 'wrong',
            ])->assertStatus(401);
        }

        $this->postJson('/api/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong',
        ])->assertStatus(429);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/register', [])->assertStatus(422);
        }

        $this->postJson('/api/auth/register', [])->assertStatus(429);
    }

    public function test_rbac_protects_tourist_api_mutations_and_web_admin_panel(): void
    {
        $regularUser = User::factory()->create([
            'username' => 'regularuser',
            'password' => Hash::make('secret123'),
        ]);
        $adminUser = User::factory()->create([
            'username' => 'admin',
            'password' => Hash::make('adminpass123'),
        ]);
        $adminUser->forceFill(['role' => 'admin'])->save();

        $spotPayload = [
            'name' => 'Curug Test',
            'category' => 'Alam & Curug',
            'latitude' => -6.6,
            'longitude' => 106.8,
        ];

        // API mutasi tanpa login -> 401
        $this->postJson('/api/tourists', $spotPayload)->assertStatus(401);

        // API mutasi dengan role 'user' -> 403
        $userToken = $regularUser->createToken('test')->plainTextToken;
        $this->withSanctumToken($userToken)
            ->postJson('/api/tourists', $spotPayload)
            ->assertStatus(403);

        // API mutasi dengan role 'admin' -> 201
        $adminToken = $adminUser->createToken('test')->plainTextToken;
        $created = $this->withSanctumToken($adminToken)
            ->postJson('/api/tourists', $spotPayload)
            ->assertStatus(201);
        $spotId = $created->json('data.id');

        $this->withSanctumToken($userToken)->deleteJson("/api/tourists/{$spotId}")->assertStatus(403);
        $this->withSanctumToken($adminToken)->deleteJson("/api/tourists/{$spotId}")->assertStatus(200);

        // Web panel /admin dengan role 'user' -> 403, dan login form /login menolak user non-admin
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web');
        $this->actingAs($regularUser, 'web')->get('/admin')->assertStatus(403);

        $this->app['auth']->forgetGuards();
        $this->app['session']->flush();
        $this->post('/login', ['login' => 'regularuser', 'password' => 'secret123'])
            ->assertSessionHasErrors('login');
        $this->assertGuest('web');

        // Login form /login dengan akun admin -> berhasil redirect ke admin panel
        $this->app['auth']->forgetGuards();
        $this->app['session']->flush();
        $this->post('/login', ['login' => 'admin', 'password' => 'adminpass123'])
            ->assertRedirect(route('admin.spots.index'));
        $this->assertAuthenticatedAs($adminUser, 'web');
        $this->get('/admin')->assertStatus(200);
    }

    public function test_idor_protections_on_saved_activities_custom_routes_posts_and_profiles(): void
    {
        $alice = User::factory()->create([
            'name' => 'Alice',
            'username' => 'alice',
            'email' => 'alice@example.com',
        ]);
        $bob = User::factory()->create([
            'name' => 'Bob',
            'username' => 'bob',
            'email' => 'bob@example.com',
        ]);
        $admin = User::factory()->create([
            'name' => 'Admin',
            'username' => 'adminuser',
        ]);
        $admin->forceFill(['role' => 'admin'])->save();

        $spot = TouristSpot::create([
            'slug' => 'kebun-raya-test',
            'name' => 'Kebun Raya Test',
            'category' => 'Alam & Curug',
            'latitude' => -6.597,
            'longitude' => 106.799,
        ]);

        SavedActivity::create([
            'user_id' => $alice->id,
            'tourist_spot_id' => $spot->id,
            'spot_slug' => $spot->slug,
            'name' => 'Alice Private Save',
            'location' => 'Bogor',
            'date_label' => 'Hari ini',
        ]);

        // Unauthenticated -> 401
        $this->getJson('/api/saved-activities')->assertStatus(401);
        $this->postJson('/api/saved-activities', ['name' => 'X', 'location' => 'Y'])->assertStatus(401);
        $this->postJson('/api/custom-routes', ['title' => 'R', 'place_ids' => [$spot->id]])->assertStatus(401);
        $this->postJson('/api/activities', ['title' => 'P', 'location' => 'Bogor'])->assertStatus(401);

        $bobToken = $bob->createToken('bob')->plainTextToken;
        $aliceToken = $alice->createToken('alice')->plainTextToken;
        $adminToken = $admin->createToken('admin')->plainTextToken;

        // Bob tidak bisa melihat saved activities milik Alice walau mengirim ?user_id=alice
        $this->withSanctumToken($bobToken)
            ->getJson('/api/saved-activities?user_id=' . $alice->id)
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.activities');

        // Bob membuat saved activity & custom route sambil mencoba memalsukan user_id Alice -> tetap tersimpan sebagai Bob
        $this->withSanctumToken($bobToken)->postJson('/api/saved-activities', [
            'user_id' => $alice->id,
            'name' => 'Bob Save',
            'location' => 'Bogor',
        ])->assertStatus(201)
            ->assertJsonPath('data.user_id', $bob->id);

        $this->withSanctumToken($bobToken)->postJson('/api/custom-routes', [
            'user_id' => $alice->id,
            'title' => 'Bob Route',
            'place_ids' => [$spot->id],
        ])->assertStatus(201)
            ->assertJsonPath('data.user_id', $bob->id);

        // Profil Alice dilihat publik / Bob tidak boleh membocorkan email Alice
        $guestProfile = $this->withSanctumToken(null)->getJson('/api/users/alice')->assertStatus(200);
        $this->assertArrayNotHasKey('email', $guestProfile->json('data'));

        $bobViewingAlice = $this->withSanctumToken($bobToken)
            ->getJson('/api/users/alice?current_user_id=' . $alice->id)
            ->assertStatus(200)
            ->assertJsonPath('data.isSelf', false);
        $this->assertArrayNotHasKey('email', $bobViewingAlice->json('data'));

        // Alice melihat profilnya sendiri -> email tampil
        $this->withSanctumToken($aliceToken)
            ->getJson('/api/users/alice')
            ->assertStatus(200)
            ->assertJsonPath('data.isSelf', true)
            ->assertJsonPath('data.email', 'alice@example.com');

        // Follow & Avatar mutasi wajib Sanctum dan memakai $request->user()->id (bukan request body)
        $this->withSanctumToken(null)->postJson("/api/users/{$alice->id}/follow")->assertStatus(401);
        $this->withSanctumToken($bobToken)->postJson("/api/users/{$alice->id}/follow", [
            'current_user_id' => $alice->id,
        ])->assertStatus(200)
            ->assertJsonPath('is_following', true);

        $this->withSanctumToken(null)->postJson('/api/auth/update-avatar', [])->assertStatus(401);

        // ActivityPost IDOR & ownership checks
        $postRes = $this->withSanctumToken($aliceToken)->postJson('/api/activities', [
            'user_id' => $bob->id,
            'user_name' => 'Fake Bob',
            'title' => 'Pagi di Kebun Raya',
            'location' => 'Bogor',
        ])->assertStatus(201)
            ->assertJsonPath('data.user_id', $alice->id)
            ->assertJsonPath('data.user_name', 'Alice');

        $postId = $postRes->json('data.id');

        // Bob mencoba hapus postingan Alice (termasuk tanpa mengirim payload identitas) -> 403
        $this->withSanctumToken($bobToken)->deleteJson("/api/activities/{$postId}")->assertStatus(403);
        $this->withSanctumToken($bobToken)->deleteJson("/api/activities/{$postId}", ['user_id' => $alice->id])->assertStatus(403);

        // Postingan tanpa user_id (null) pun tidak boleh dihapus oleh non-admin
        $legacyPost = ActivityPost::create([
            'user_id' => null,
            'user_name' => 'Legacy',
            'date' => '1 Januari 2026',
            'title' => 'Legacy Spot',
            'location' => 'Bogor',
        ]);
        $this->withSanctumToken($bobToken)->deleteJson("/api/activities/{$legacyPost->id}")->assertStatus(403);
        $this->withSanctumToken($adminToken)->deleteJson("/api/activities/{$legacyPost->id}")->assertStatus(200);

        // Alice (pemilik) dapat menghapus postingannya sendiri
        $this->withSanctumToken($aliceToken)->deleteJson("/api/activities/{$postId}")->assertStatus(200);
    }

    public function test_upload_validation_rejects_php_polyglot_and_image_compressor_throws(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        // Upload file non-gambar (.php) -> ditolak 422 oleh validasi controller
        $phpShell = UploadedFile::fake()->createWithContent('shell.php', '<?php echo "owned"; ?>');
        $this->withToken($token)->post('/api/activities', [
            'title' => 'Exploit',
            'location' => 'Bogor',
            'image' => $phpShell,
        ], ['Accept' => 'application/json'])->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // Upload string teks pada field image -> ditolak 422 (harus file gambar valid)
        $this->withToken($token)->postJson('/api/activities', [
            'title' => 'String Image',
            'location' => 'Bogor',
            'image' => 'javascript:alert(1)',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // ImageCompressor langsung pada file berekstensi .jpg berisi teks PHP -> wajib melempar exception
        $fakeImagePath = tempnam(sys_get_temp_dir(), 'badimg_');
        file_put_contents($fakeImagePath, '<?php phpinfo(); ?>');

        try {
            $this->expectException(InvalidArgumentException::class);
            ImageCompressor::compressAndSave(
                $fakeImagePath,
                sys_get_temp_dir(),
                'should_not_exist_' . uniqid() . '.jpg'
            );
        } finally {
            @unlink($fakeImagePath);
        }
    }

    public function test_media_endpoint_blocks_path_traversal(): void
    {
        $this->get('/api/media/..%2F..%2F.env')->assertStatus(404);
        $this->get('/api/media/../composer.json')->assertStatus(404);
    }

    public function test_google_oauth_whitelists_origin_and_exchanges_one_time_code_securely(): void
    {
        Config::set('cors.allowed_origins', ['http://localhost:5173', 'http://localhost:8000']);
        Config::set('services.google', [
            'client_id' => 'test-google-client-id',
            'client_secret' => 'test-google-client-secret',
            'redirect' => 'http://localhost:8000/api/auth/google/callback',
        ]);

        // Redirect dengan origin jahat tidak masuk ke state (fallback ke whitelist default)
        $redirectRes = $this->get('/api/auth/google/redirect?origin=https://evil-attacker.test');
        $redirectRes->assertStatus(302);
        $location = (string) $redirectRes->headers->get('Location', '');
        $this->assertStringNotContainsString('evil-attacker.test', $location);
        parse_str((string) parse_url($location, PHP_URL_QUERY), $googleRedirectQuery);
        $decryptedState = json_decode(Crypt::decryptString($googleRedirectQuery['state'] ?? ''), true);
        $this->assertSame('http://localhost:5173', $decryptedState['origin'] ?? null);

        // Mock Socialite stateless user & test callback dengan state terenkripsi origin tak diizinkan
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getEmail')->andReturn('oauthuser@example.com');
        $socialiteUser->shouldReceive('getId')->andReturn('google-12345');
        $socialiteUser->shouldReceive('getName')->andReturn('OAuth User');
        $socialiteUser->shouldReceive('getAvatar')->andReturn(null);

        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($socialiteUser);
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);

        $maliciousState = Crypt::encryptString(json_encode([
            'origin' => 'https://evil.example.com',
            'nonce' => 'abc',
        ]));

        $callbackRes = $this->get('/api/auth/google/callback?state=' . urlencode($maliciousState));
        $callbackRes->assertStatus(302);

        $redirectLocation = (string) $callbackRes->headers->get('Location');
        $this->assertStringStartsWith('http://localhost:5173/?auth_provider=google&oauth_code=', $redirectLocation);
        $this->assertStringNotContainsString('auth_data', $redirectLocation);
        $this->assertStringNotContainsString('evil.example.com', $redirectLocation);

        parse_str((string) parse_url($redirectLocation, PHP_URL_QUERY), $query);
        $oauthCode = $query['oauth_code'] ?? '';
        $this->assertNotEmpty($oauthCode);

        // Tukar one-time oauth_code menjadi token Sanctum
        $exchangeRes = $this->postJson('/api/auth/google/exchange', [
            'code' => $oauthCode,
        ])->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.email', 'oauthuser@example.com')
            ->assertJsonPath('data.role', 'user');

        $token = $exchangeRes->json('token');
        $this->assertNotEmpty($token);

        // Replay kode yang sama -> wajib gagal 401
        $this->postJson('/api/auth/google/exchange', [
            'code' => $oauthCode,
        ])->assertStatus(401);

        // Token valid untuk mengakses endpoint terproteksi
        $this->withToken($token)
            ->getJson('/api/auth/current-user')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'oauthuser@example.com');
    }
}
