<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect pengguna ke halaman login Google.
     */
    public function redirect(Request $request)
    {
        // Simpan origin frontend (misal http://localhost:5173 atau http://localhost:8000)
        $origin = $request->header('referer') ?: $request->input('origin');
        $statePayload = [];
        if ($origin) {
            $parsed = parse_url($origin);
            if (isset($parsed['scheme'], $parsed['host'])) {
                $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
                $statePayload['origin'] = $parsed['scheme'] . '://' . $parsed['host'] . $port;
            }
        }

        $driver = Socialite::driver('google')->stateless();
        if (!empty($statePayload)) {
            $driver->with(['state' => base64_encode(json_encode($statePayload))]);
        }

        return $driver->redirect();
    }

    /**
     * Menangani callback setelah pengguna menyetujui login di Google.
     */
    public function callback(Request $request)
    {
        // Tentukan base URL frontend tujuan redirect
        $frontendBaseUrl = rtrim(config('app.url', 'http://localhost:8000'), '/');
        $stateParam = $request->input('state');
        if ($stateParam) {
            try {
                $decoded = json_decode(base64_decode($stateParam), true);
                if (!empty($decoded['origin'])) {
                    $frontendBaseUrl = rtrim($decoded['origin'], '/');
                }
            } catch (\Throwable) {
                // Gunakan default app.url jika decode gagal
            }
        }

        try {
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = Socialite::driver('google')->stateless()->user();

            $email = $googleUser->getEmail();
            $googleId = (string) $googleUser->getId();
            $name = $googleUser->getName() ?: 'Pengguna Google';
            $avatar = $googleUser->getAvatar();

            // 1. Cari user yang sudah ada berdasarkan google_id atau email
            $user = User::where('google_id', $googleId)
                ->orWhere('email', $email)
                ->first();

            if ($user) {
                // Tautkan google_id jika sebelumnya user terdaftar via email lokal
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
                // Buat username unik berdasarkan nama
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

            // Susun data user untuk frontend
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
            ];

            $encodedData = urlencode(base64_encode(json_encode($userData)));

            return redirect($frontendBaseUrl . '/?auth_provider=google&auth_data=' . $encodedData);
        } catch (\Throwable $e) {
            Log::error('Google Login Error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            $errorMsg = urlencode('Gagal masuk dengan Google. Pastikan kredensial Google Client ID & Secret sudah benar.');
            return redirect($frontendBaseUrl . '/?auth_provider=google&auth_error=' . $errorMsg);
        }
    }
}
