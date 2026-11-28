<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityPost;
use App\Models\User;
use App\Services\ImageCompressor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private function formatUserPayload(User $user, bool $includePrivate = true): array
    {
        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'role' => $user->role ?? 'user',
            'avatar' => $user->avatar,
            'bio' => $user->bio,
        ];

        if ($includePrivate) {
            $payload['email'] = $user->email;
        }

        return $payload;
    }

    /**
     * Mendapatkan data user yang sedang terautentikasi via Sanctum.
     */
    public function currentUser(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'data' => $this->formatUserPayload($user, true),
        ]);
    }

    /**
     * Login kredensial email/username & password dan menerbitkan token Sanctum terverifikasi.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required_without:email|string',
            'email' => 'required_without:login|string',
            'password' => 'required|string',
        ], [
            'login.required_without' => 'Email atau username wajib diisi.',
            'email.required_without' => 'Alamat email wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginInput = trim((string) ($request->input('login') ?? $request->input('email')));
        $password = (string) $request->input('password');

        $user = User::where('email', strtolower($loginInput))
            ->orWhere('username', $loginInput)
            ->first();

        if (!$user || empty($user->password) || !Hash::check($password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email/username atau kata sandi tidak sesuai.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil',
            'token' => $token,
            'token_type' => 'Bearer',
            'data' => array_merge($this->formatUserPayload($user, true), [
                'token' => $token,
            ]),
        ]);
    }

    /**
     * Pendaftaran akun pengguna baru dengan role default 'user' dan penerbitan token Sanctum.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.min' => 'Nama lengkap minimal 2 karakter.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar. Silakan masuk ke akun Anda.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $name = trim((string) $request->input('name'));
        $email = strtolower(trim((string) $request->input('email')));

        $baseUsername = Str::slug($name) ?: 'penjelajah';
        $username = $baseUsername;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . '-' . $counter;
            $counter++;
        }

        $user = User::create([
            'name' => $name,
            'username' => $username,
            'email' => $email,
            'password' => Hash::make((string) $request->input('password')),
            'bio' => 'Penjelajah wisata alam dan kuliner Bogor.',
            'avatar' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Akun berhasil dibuat',
            'token' => $token,
            'token_type' => 'Bearer',
            'data' => array_merge($this->formatUserPayload($user, true), [
                'token' => $token,
            ]),
        ], 201);
    }

    /**
     * Menghapus token Sanctum saat logout.
     */
    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil keluar.',
        ]);
    }

    /**
     * Mendapatkan profil lengkap pengguna (email disembunyikan jika dilihat oleh user lain).
     */
    public function userProfile(string $usernameOrId, Request $request)
    {
        $user = User::where('username', $usernameOrId)
            ->orWhere('id', is_numeric($usernameOrId) ? (int) $usernameOrId : -1)
            ->orWhere('name', $usernameOrId)
            ->first();

        $currentUser = $request->user('sanctum');

        if (!$user) {
            $activities = ActivityPost::where('user_name', $usernameOrId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => null,
                    'name' => $usernameOrId,
                    'username' => Str::slug($usernameOrId),
                    'avatar' => $activities->first()?->user_avatar ?? '/images/avatars/avatar-kirk.jpg',
                    'bio' => 'Penjelajah alam dan pegiat wisata Bogor.',
                    'isSelf' => false,
                    'followers_count' => 0,
                    'following_count' => 0,
                    'routes_count' => 0,
                    'is_following' => false,
                    'activities' => $activities,
                ],
            ]);
        }

        $isSelf = $currentUser && (int) $currentUser->id === (int) $user->id;

        $isFollowing = false;
        if ($currentUser && !$isSelf) {
            try {
                $isFollowing = DB::table('user_follows')
                    ->where('follower_id', $currentUser->id)
                    ->where('following_id', $user->id)
                    ->exists();
            } catch (\Throwable $e) {
                Log::warning('Gagal mengecek status follow', ['error' => $e->getMessage()]);
            }
        }

        $followersCount = 0;
        $followingCount = 0;
        $routesCount = 0;
        try {
            $followersCount = DB::table('user_follows')->where('following_id', $user->id)->count();
            $followingCount = DB::table('user_follows')->where('follower_id', $user->id)->count();
            $routesCount = $user->customRoutes()->count();
        } catch (\Throwable $e) {
            Log::warning('Gagal menghitung statistik profil', ['error' => $e->getMessage()]);
        }

        $activities = ActivityPost::where('user_id', $user->id)
            ->orWhere('user_name', $user->name)
            ->orderBy('created_at', 'desc')
            ->get();

        $profileData = array_merge($this->formatUserPayload($user, $isSelf), [
            'bio' => $user->bio ?? 'Penjelajah alam dan pegiat wisata Bogor.',
            'isSelf' => $isSelf,
            'followers_count' => $followersCount,
            'following_count' => $followingCount,
            'routes_count' => $routesCount,
            'is_following' => $isFollowing,
            'activities' => $activities,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $profileData,
        ]);
    }

    /**
     * Mengikuti (Follow) atau Batal Mengikuti (Unfollow) penjelajah lain memakai user terautentikasi.
     */
    public function toggleFollow(Request $request, string $usernameOrId)
    {
        $currentUser = $request->user();
        if (!$currentUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan login terlebih dahulu',
            ], 401);
        }

        $targetUser = User::where('username', $usernameOrId)
            ->orWhere('id', is_numeric($usernameOrId) ? (int) $usernameOrId : -1)
            ->orWhere('name', $usernameOrId)
            ->first();

        if (!$targetUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengguna tidak ditemukan',
            ], 404);
        }

        if ((int) $currentUser->id === (int) $targetUser->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat mengikuti akun sendiri',
            ], 400);
        }

        try {
            $existing = DB::table('user_follows')
                ->where('follower_id', $currentUser->id)
                ->where('following_id', $targetUser->id)
                ->first();

            if ($existing) {
                DB::table('user_follows')
                    ->where('follower_id', $currentUser->id)
                    ->where('following_id', $targetUser->id)
                    ->delete();
                $isFollowing = false;
            } else {
                DB::table('user_follows')->insert([
                    'follower_id' => $currentUser->id,
                    'following_id' => $targetUser->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $isFollowing = true;
            }

            $totalFollowers = DB::table('user_follows')->where('following_id', $targetUser->id)->count();

            return response()->json([
                'status' => 'success',
                'message' => $isFollowing ? "Berhasil mengikuti {$targetUser->name}" : "Batal mengikuti {$targetUser->name}",
                'is_following' => $isFollowing,
                'followers_count' => $totalFollowers,
            ]);
        } catch (\Throwable $e) {
            Log::error('Gagal memperbarui status follow', [
                'follower_id' => $currentUser->id,
                'target_id' => $targetUser->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui status follow.',
            ], 500);
        }
    }

    /**
     * Memperbarui foto profil milik user terautentikasi.
     */
    public function updateAvatar(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $guessedExt = strtolower((string) ($file->guessExtension() ?: $file->getClientOriginalExtension() ?: 'jpg'));
            $safeExt = in_array($guessedExt, ['jpg', 'jpeg', 'png', 'webp'], true) ? $guessedExt : 'jpg';
            $fileName = 'avatar_' . $user->id . '_' . time() . '_' . uniqid() . '.' . $safeExt;

            $avatarDir = public_path('images/avatars');

            try {
                ImageCompressor::compressAndSave($file, $avatarDir, $fileName, 600, 600, 82);
            } catch (\Throwable $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File foto profil tidak valid atau gagal diproses.',
                ], 422);
            }

            $avatarPath = '/images/avatars/' . $fileName;
            $user->update([
                'avatar' => $avatarPath,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Foto profil berhasil diperbarui',
                'data' => array_merge($this->formatUserPayload($user, true), [
                    'isSelf' => true,
                ]),
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Tidak ada file foto profil yang diunggah',
        ], 400);
    }

    /**
     * Memperbarui nama dan bio milik user terautentikasi.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:100',
            'bio' => 'nullable|string|max:240',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.min' => 'Nama lengkap minimal 2 karakter.',
            'name.max' => 'Nama lengkap maksimal 100 karakter.',
            'bio.max' => 'Bio singkat maksimal 240 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $cleanName = trim((string) $request->input('name'));
        $cleanBio = trim((string) $request->input('bio', ''));

        $user->update([
            'name' => $cleanName,
            'bio' => $cleanBio !== '' ? $cleanBio : null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data' => array_merge($this->formatUserPayload($user->fresh(), true), [
                'isSelf' => true,
            ]),
        ]);
    }

    /**
     * Mengubah kata sandi milik user terautentikasi.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        $hasExistingPassword = !empty($user->password);

        $rules = [
            'new_password' => 'required|string|min:6|max:100|confirmed',
        ];
        if ($hasExistingPassword) {
            $rules['current_password'] = 'required|string';
        }

        $validator = Validator::make($request->all(), $rules, [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'new_password.required' => 'Kata sandi baru wajib diisi.',
            'new_password.min' => 'Kata sandi baru minimal 6 karakter.',
            'new_password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($hasExistingPassword && !Hash::check((string) $request->input('current_password'), (string) $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kata sandi saat ini tidak sesuai.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make((string) $request->input('new_password')),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }
}
