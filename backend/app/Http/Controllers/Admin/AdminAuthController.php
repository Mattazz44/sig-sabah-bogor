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
        if (Auth::check()) {
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

        if (Auth::attempt([$fieldType => $login, 'password' => $password], $remember)) {
            $request->session()->regenerate();

            return redirect()->intended(route('admin.spots.index'))
                ->with('success', 'Selamat datang kembali, ' . Auth::user()->name . '!');
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
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Anda telah berhasil keluar (logout).');
    }
}

