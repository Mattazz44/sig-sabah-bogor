<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masuk Admin - Wisata Bogor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #2c3b26;
        }
    </style>
</head>
<body class="min-h-screen w-full bg-[#2c3b26] text-white flex flex-col justify-center antialiased">
    <div class="mx-auto w-full max-w-md px-6 py-10">
        <!-- Header -->
        <header class="mb-8">
            <p class="text-[11px] font-medium text-white/55">Admin</p>
            <h1 class="mt-0.5 text-[22px] font-bold tracking-tight text-white">
                Wisata Bogor
            </h1>
            <p class="mt-1 text-[12px] text-white/55">
                Masuk untuk mengelola lokasi wisata Kota Bogor
            </p>
        </header>

        @if(session('success'))
            <div class="mb-5 rounded-lg bg-[#384931] border border-emerald-400/35 px-3.5 py-2.5 text-[12px] text-emerald-200">
                {{ session('success') }}
            </div>
        @endif

        @if($errors->any())
            <div role="alert" class="mb-5 rounded-lg bg-rose-500/20 border border-rose-400/40 px-3.5 py-2.5 text-[12px] text-rose-200">
                {{ $errors->first() }}
            </div>
        @endif

        <form action="{{ route('admin.login.submit') }}" method="POST" class="space-y-4">
            @csrf

            <div>
                <label for="login" class="block text-[11px] font-medium text-white/60 mb-1.5">
                    Username atau Email
                </label>
                <input
                    type="text"
                    id="login"
                    name="login"
                    value="{{ old('login', 'admin') }}"
                    required
                    autofocus
                    placeholder="admin"
                    class="w-full rounded-lg bg-[#384931] border border-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition"
                />
            </div>

            <div>
                <label for="password" class="block text-[11px] font-medium text-white/60 mb-1.5">
                    Kata Sandi
                </label>
                <div class="relative">
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        class="w-full rounded-lg bg-[#384931] border border-white/10 pl-3.5 pr-10 py-2.5 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition"
                    />
                    <button
                        type="button"
                        onclick="togglePasswordVisibility()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/50 hover:text-white transition cursor-pointer"
                    >
                        <span id="eye-text">Lihat</span>
                    </button>
                </div>
            </div>

            <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="remember" class="rounded bg-[#384931] border-white/20 text-[#8c785c] focus:ring-0 w-4 h-4 cursor-pointer">
                    <span class="text-[12px] text-white/65">Ingat saya</span>
                </label>
            </div>

            <div class="pt-3 flex justify-center">
                <button
                    type="submit"
                    class="rounded-full bg-[#8c785c] hover:bg-[#9b8669] active:scale-95 px-9 py-2.5 text-[12px] font-semibold text-white shadow-md transition cursor-pointer"
                >
                    Masuk
                </button>
            </div>
        </form>
    </div>

    <script>
        function togglePasswordVisibility() {
            const passInput = document.getElementById('password');
            const eyeText = document.getElementById('eye-text');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                eyeText.textContent = 'Tutup';
            } else {
                passInput.type = 'password';
                eyeText.textContent = 'Lihat';
            }
        }
    </script>
</body>
</html>
