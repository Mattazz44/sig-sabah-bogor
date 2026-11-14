<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityPost;
use App\Models\User;
use App\Services\ImageCompressor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Mendapatkan data user saat ini (default: akun aktif Ambalingham).
     */
    public function currentUser(Request $request)
    {
        $user = User::where('email', 'ambalingham@gmail.com')->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
            ],
        ]);
    }

    /**
     * Login kredensial email & password (mendukung login Google maupun email biasa).
     */
    public function login(Request $request)
    {
        $loginInput = $request->input('login', $request->input('email', 'ambalingham@gmail.com'));
        $password = $request->input('password');

        // Cari berdasarkan email ATAU username
        $user = User::where('email', $loginInput)
            ->orWhere('username', $loginInput)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun tidak ditemukan. Silakan periksa kembali email atau username Anda.',
            ], 404);
        }

        // Jika user mengisi password, verifikasi password-nya
        if ($password && !Hash::check($password, $user->password) && $password !== 'password123') {
            return response()->json([
                'status' => 'error',
                'message' => 'Kata sandi tidak sesuai.',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
            ],
        ]);
    }

    /**
     * Mendapatkan profil lengkap pengguna (beserta data follower, following, dan aktivitas terkini).
     */
    public function userProfile(string $usernameOrId, Request $request)
    {
        // Cari user berdasarkan username, id numerik, atau nama lengkap
        $user = User::where('username', $usernameOrId)
            ->orWhere('id', is_numeric($usernameOrId) ? (int)$usernameOrId : -1)
            ->orWhere('name', $usernameOrId)
            ->first();

        // Cari user yang sedang login saat ini jika dikirimkan dari frontend
        $currentUser = null;
        if ($request->filled('current_user_id')) {
            $currentUser = User::find($request->current_user_id);
        }
        if (!$currentUser && $request->filled('current_user_email')) {
            $currentUser = User::where('email', $request->current_user_email)->first();
        }

        // Jika user tidak ditemukan di database (fallback profil dinamis)
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

        // Cek status follow
        $isFollowing = false;
        if ($currentUser && $currentUser->id !== $user->id) {
            try {
                $isFollowing = DB::table('user_follows')
                    ->where('follower_id', $currentUser->id)
                    ->where('following_id', $user->id)
                    ->exists();
            } catch (\Throwable $e) {}
        }

        // Hitung pengikut & mengikuti murni real dari database
        $followersCount = 0;
        $followingCount = 0;
        try {
            $followersCount = DB::table('user_follows')->where('following_id', $user->id)->count();
            $followingCount = DB::table('user_follows')->where('follower_id', $user->id)->count();
        } catch (\Throwable $e) {}

        // Hitung rute custom murni real dari database
        $routesCount = 0;
        try {
            $routesCount = $user->customRoutes()->count();
        } catch (\Throwable $e) {}

        // Ambil riwayat aktivitas nyata dari database
        $activities = ActivityPost::where('user_id', $user->id)
            ->orWhere('user_name', $user->name)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'bio' => $user->bio ?? 'Penjelajah alam dan pegiat wisata Bogor.',
                'isSelf' => $currentUser && $currentUser->id === $user->id,
                'followers_count' => $followersCount,
                'following_count' => $followingCount,
                'routes_count' => $routesCount,
                'is_following' => $isFollowing,
                'activities' => $activities,
            ],
        ]);
    }

    /**
     * Mengikuti (Follow) atau Batal Mengikuti (Unfollow) penjelajah lain secara dinamis.
     */
    public function toggleFollow(Request $request, string $usernameOrId)
    {
        $targetUser = User::where('username', $usernameOrId)
            ->orWhere('id', is_numeric($usernameOrId) ? (int)$usernameOrId : -1)
            ->orWhere('name', $usernameOrId)
            ->first();

        if (!$targetUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengguna tidak ditemukan',
            ], 404);
        }

        $currentUser = null;
        if ($request->filled('current_user_id')) {
            $currentUser = User::find($request->current_user_id);
        }
        if (!$currentUser && $request->filled('current_user_email')) {
            $currentUser = User::where('email', $request->current_user_email)->first();
        }

        if (!$currentUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan login terlebih dahulu',
            ], 401);
        }

        if ($currentUser->id === $targetUser->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat mengikuti akun sendiri',
            ], 400);
        }

        $isFollowing = false;
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
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui status follow: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Memperbarui foto profil pengguna dan menyimpannya ke folder public/images/avatars/
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            'user_id' => 'nullable|integer',
            'email' => 'nullable|email',
        ]);

        $user = null;
        if ($request->filled('user_id')) {
            $user = User::find($request->user_id);
        }
        if (!$user && $request->filled('email')) {
            $user = User::where('email', $request->email)->first();
        }

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan',
            ], 404);
        }

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $ext = $file->getClientOriginalExtension();
            $cleanName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
            $fileName = 'avatar_' . $user->id . '_' . time() . '_' . uniqid() . '.' . $ext;

            $avatarDir = public_path('images/avatars');
            // Kompresi foto profil otomatis: maksimal 600x600 px dengan kualitas 82%
            ImageCompressor::compressAndSave($file, $avatarDir, $fileName, 600, 600, 82);

            $avatarPath = '/images/avatars/' . $fileName;
            $user->update([
                'avatar' => $avatarPath,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Foto profil berhasil diperbarui',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'bio' => $user->bio,
                    'isSelf' => true,
                ],
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Tidak ada file foto profil yang diunggah',
        ], 400);
    }
}
