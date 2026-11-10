<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masuk Admin - SIG Wisata Bogor</title>
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        forest: {
                            900: '#2c3b26', // Panel utama figma frontend
                            800: '#384931',
                            700: '#4f5f3b', // Card / navigasi figma frontend
                            600: '#63774a',
                            500: '#79925a',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #1e281a;
        }
    </style>
</head>
<body class="min-h-screen text-white bg-[#1e281a] flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-emerald-500 selection:text-white">

    <!-- Background Atmospheric Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-forest-700/20 blur-3xl"></div>
    </div>

    <!-- Login Card Container -->
    <div class="relative z-10 w-full max-w-md">

        <!-- Logo & Brand Header -->
        <div class="text-center mb-6">
            <div class="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-600/80 border border-emerald-400/30 text-white shadow-xl shadow-emerald-950/60 font-bold text-2xl mb-3">
                🌲
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-white">SIG Wisata Bogor</h1>
            <p class="text-xs text-white/60 mt-1">Masuk ke Panel Administrator untuk mengelola data objek wisata</p>
        </div>

        <!-- Notification Toast -->
        @if(session('success'))
            <div class="mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-3.5 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg backdrop-blur-md">
                <span class="text-base">✅</span>
                <span>{{ session('success') }}</span>
            </div>
        @endif

        @if($errors->any())
            <div class="mb-4 rounded-2xl bg-rose-500/20 border border-rose-400/40 p-3.5 text-rose-200 text-xs flex items-center gap-2.5 shadow-lg backdrop-blur-md">
                <span class="text-base">⚠️</span>
                <span>{{ $errors->first() }}</span>
            </div>
        @endif

        <!-- Card Form -->
        <div class="rounded-3xl bg-forest-900/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <form action="{{ route('admin.login.submit') }}" method="POST" class="space-y-4">
                @csrf

                <!-- Input Username atau Email -->
                <div>
                    <label for="login" class="block text-xs font-semibold text-white/80 mb-1.5">
                        Username atau Email
                    </label>
                    <div class="relative">
                        <input type="text" id="login" name="login" value="{{ old('login', 'admin') }}" required autofocus
                               placeholder="admin"
                               class="w-full rounded-xl bg-forest-700/80 border border-white/20 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
                        <div class="absolute left-3.5 top-2.5 text-white/40 pointer-events-none">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                    </div>
                </div>

                <!-- Input Password -->
                <div>
                    <div class="flex items-center justify-between mb-1.5">
                        <label for="password" class="block text-xs font-semibold text-white/80">
                            Kata Sandi (Password)
                        </label>
                    </div>
                    <div class="relative">
                        <input type="password" id="password" name="password" required
                               placeholder="••••••••"
                               class="w-full rounded-xl bg-forest-700/80 border border-white/20 pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
                        <div class="absolute left-3.5 top-2.5 text-white/40 pointer-events-none">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <button type="button" onclick="togglePasswordVisibility()" class="absolute right-3 top-2.5 text-white/40 hover:text-white transition cursor-pointer">
                            <span id="eye-icon">👁️</span>
                        </button>
                    </div>
                </div>

                <!-- Remember Me Checkbox -->
                <div class="flex items-center justify-between pt-1">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="remember" class="rounded bg-forest-700 border-white/30 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer">
                        <span class="text-xs text-white/70">Ingat Saya</span>
                    </label>
                </div>

                <!-- Tombol Submit -->
                <button type="submit" class="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition cursor-pointer flex items-center justify-center gap-2">
                    <span>Masuk ke Panel Admin</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </form>

            <!-- Akun Bawaan / Hints untuk Kemudahan Pengujian -->
            <div class="mt-6 pt-5 border-t border-white/10 text-center">
                <p class="text-[11px] text-white/50 mb-2">Akun administrator terdaftar:</p>
                <div class="rounded-xl bg-black/20 p-2.5 text-[11px] font-mono text-emerald-300/90 border border-white/5">
                    Username: <span class="text-white">admin</span><br>
                    Password: <span class="text-white">admin123</span>
                </div>
            </div>
        </div>

        <!-- Back to Frontend Link -->
        <div class="text-center mt-5">
            <a href="http://localhost:5173" target="_blank" class="text-xs text-white/50 hover:text-emerald-300 transition flex items-center justify-center gap-1.5">
                <span>← Kembali ke Aplikasi SIG Wisata (Frontend)</span>
            </a>
        </div>
    </div>

    <script>
        function togglePasswordVisibility() {
            const passInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eye-icon');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                eyeIcon.textContent = '🙈';
            } else {
                passInput.type = 'password';
                eyeIcon.textContent = '👁️';
            }
        }
    </script>
</body>
</html>

