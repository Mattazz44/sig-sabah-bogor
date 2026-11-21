<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    /**
     * Tampilkan form login admin
     */
    public function showLoginForm()
    {
        if (Auth::guard('web')->check() && Auth::guard('web')->user()?->isAdmin()) {
            return redirect()->route('admin.spots.index');
        }

        return view('admin.auth.login');
    }

    /**
     * Proses autentikasi login admin
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $login = $credentials['login'];
        $password = $credentials['password'];
        $remember = $request->has('remember');

        // Dukungan login menggunakan Email atau Username
        $fieldType = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $webGuard = Auth::guard('web');

        if ($webGuard->attempt([$fieldType => $login, 'password' => $password], $remember)) {
            $user = $webGuard->user();

            if (!$user || !$user->isAdmin()) {
                $webGuard->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return back()->withErrors([
                    'login' => 'Akun Anda tidak memiliki hak akses Administrator.',
                ])->onlyInput('login');
            }

            $request->session()->regenerate();

            return redirect()->intended(route('admin.spots.index'))
                ->with('success', 'Selamat datang kembali, ' . $user->name . '!');
        }

        return back()->withErrors([
            'login' => 'Email/Username atau kata sandi yang Anda masukkan salah.',
        ])->onlyInput('login');
    }

    /**
     * Logout admin dan bersihkan session
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Anda telah berhasil keluar (logout).');
    }
}
