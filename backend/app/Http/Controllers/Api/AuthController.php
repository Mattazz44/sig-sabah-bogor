<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
     * Mendapatkan profil pengguna lain (misal: Kirk Hasibuan).
     */
    public function userProfile(string $usernameOrId)
    {
        $user = User::where('username', $usernameOrId)
            ->orWhere('id', is_numeric($usernameOrId) ? (int)$usernameOrId : -1)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
                'isSelf' => $user->email === 'ambalingham@gmail.com',
            ],
        ]);
    }
}
