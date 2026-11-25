<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Daftar origin frontend yang diizinkan (whitelist dari FRONTEND_URL dan APP_URL).
     *
     * @return array<int, string>
     */
    private function allowedFrontendOrigins(): array
    {
        $configuredOrigins = config('cors.allowed_origins', []);
        $rawList = array_merge(
            is_array($configuredOrigins) ? $configuredOrigins : [],
            [
                (string) env('FRONTEND_URL', ''),
                (string) config('app.url', 'http://127.0.0.1:8001'),
            ]
        );

        $origins = [];
        foreach (array_filter($rawList) as $rawEntry) {
            foreach (explode(',', (string) $rawEntry) as $item) {
                $normalized = $this->normalizeOrigin($item);
                if ($normalized !== null) {
                    $origins[] = $normalized;
                }
            }
        }

        $origins = array_values(array_unique($origins));
        if (empty($origins)) {
            return ['http://127.0.0.1:8001'];
        }

        return $origins;
    }

    private function normalizeOrigin(?string $url): ?string
    {
        if (!is_string($url) || trim($url) === '') {
            return null;
        }

        $parsed = parse_url(trim($url));
        if (!isset($parsed['scheme'], $parsed['host'])) {
            return null;
        }

        $scheme = strtolower($parsed['scheme']);
        if (!in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        $host = strtolower($parsed['host']);
        $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';

        return $scheme . '://' . $host . $port;
    }

    private function resolveAllowedOrigin(?string $candidate): string
    {
        $allowed = $this->allowedFrontendOrigins();
        $normalized = $this->normalizeOrigin($candidate);

        if ($normalized !== null && in_array($normalized, $allowed, true)) {
            return $normalized;
        }

        return $allowed[0];
    }

    /**
     * Redirect pengguna ke halaman login Google dengan state terenkripsi & tervalidasi whitelist.
     */
    public function redirect(Request $request)
    {
        $candidateOrigin = $request->input('origin')
            ?: $request->header('origin')
            ?: $request->header('referer');

        $safeOrigin = $this->resolveAllowedOrigin($candidateOrigin);

        $encryptedState = Crypt::encryptString(json_encode([
            'origin' => $safeOrigin,
            'nonce' => Str::random(16),
        ]));

        return Socialite::driver('google')
            ->stateless()
            ->with(['state' => $encryptedState])
            ->redirect();
    }

    /**
     * Menangani callback Google OAuth, memvalidasi origin state, dan menerbitkan one-time code aman.
     */
    public function callback(Request $request)
    {
        $frontendBaseUrl = $this->resolveAllowedOrigin(null);
        $stateParam = $request->input('state');

        if (is_string($stateParam) && $stateParam !== '') {
            try {
                $decrypted = Crypt::decryptString($stateParam);
                $decoded = json_decode($decrypted, true);
                if (is_array($decoded) && !empty($decoded['origin'])) {
                    $frontendBaseUrl = $this->resolveAllowedOrigin($decoded['origin']);
                }
            } catch (\Throwable) {
                // State tidak valid atau dimanipulasi: tetap fallback ke origin default yang aman
            }
        }

        try {
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = Socialite::driver('google')->stateless()->user();

            $email = strtolower(trim((string) $googleUser->getEmail()));
            $googleId = (string) $googleUser->getId();
            $name = $googleUser->getName() ?: 'Pengguna Google';
            $avatar = $googleUser->getAvatar();

            $user = User::where('google_id', $googleId)
                ->orWhere('email', $email)
                ->first();

            if ($user) {
                $shouldSave = false;
                if (!$user->google_id) {
                    $user->google_id = $googleId;
                    $shouldSave = true;
                }
                if (!$user->avatar && $avatar) {
                    $user->avatar = $avatar;
                    $shouldSave = true;
                }
                if ($shouldSave) {
                    $user->save();
                }
            } else {
                $baseUsername = Str::slug($name, '');
                if (empty($baseUsername)) {
                    $baseUsername = 'user';
                }
                $uniqueUsername = $baseUsername . rand(100, 9999);
                while (User::where('username', $uniqueUsername)->exists()) {
                    $uniqueUsername = $baseUsername . rand(100, 9999);
                }

                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'username' => $uniqueUsername,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'bio' => 'Menjelajahi keindahan Kota Bogor bersama Sabah.',
                    'password' => null,
                ]);
            }

            // Simpan kode pertukaran sekali pakai yang di-hash di cache (berlaku 2 menit), tanpa membawa PII di URL
            $exchangeCode = Str::random(64);
            Cache::put(
                'google_oauth_code:' . hash('sha256', $exchangeCode),
                $user->id,
                now()->addMinutes(2)
            );

            return redirect($frontendBaseUrl . '/?auth_provider=google&oauth_code=' . urlencode($exchangeCode));
        } catch (\Throwable $e) {
            Log::error('Google Login Error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            $errorMsg = urlencode('Gagal masuk dengan Google. Pastikan kredensial Google Client ID & Secret sudah benar.');
            return redirect($frontendBaseUrl . '/?auth_provider=google&auth_error=' . $errorMsg);
        }
    }

    /**
     * Menukarkan one-time oauth_code menjadi token Sanctum terverifikasi.
     */
    public function exchange(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|min:16|max:256',
        ]);

        $cacheKey = 'google_oauth_code:' . hash('sha256', $validated['code']);
        $userId = Cache::pull($cacheKey);

        if (!$userId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kode autentikasi Google tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        $user = User::find($userId);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun pengguna tidak ditemukan.',
            ], 404);
        }

        $token = $user->createToken('google_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login Google berhasil',
            'token' => $token,
            'token_type' => 'Bearer',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'avatar' => $user->avatar,
                'bio' => $user->bio,
                'token' => $token,
            ],
        ]);
    }
}
