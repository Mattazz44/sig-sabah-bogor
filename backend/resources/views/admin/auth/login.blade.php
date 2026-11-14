<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masuk Admin - Sabah Bogor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            background-color: #2c3b26;
            background-image:
                radial-gradient(circle at 18% 18%, rgba(79, 95, 59, 0.42) 0%, transparent 48%),
                radial-gradient(circle at 82% 84%, rgba(22, 30, 22, 0.65) 0%, transparent 52%);
        }

        .liquid-glass-card {
            background: rgba(20, 28, 20, 0.55);
            -webkit-backdrop-filter: blur(26px) saturate(180%);
            backdrop-filter: blur(26px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow:
                inset 0 1px 1px 0 rgba(255, 255, 255, 0.22),
                0 24px 48px -12px rgba(0, 0, 0, 0.45);
        }

        .liquid-glass-input {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .liquid-glass-input:focus {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(235, 240, 235, 0.48);
            outline: 2px solid rgba(235, 240, 235, 0.22);
            outline-offset: 0px;
        }
    </style>
</head>
<body class="min-h-screen w-full text-[#EBF0EB] flex flex-col items-center justify-center px-4 py-8 sm:px-6 antialiased">
    <main class="w-full max-w-md">
        <div class="liquid-glass-card rounded-3xl p-6 sm:p-8">
            <!-- Brand Header -->
            <header class="text-center">
                <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-[rgba(20,28,20,0.5)] text-[#E2D7B5] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.14" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.28" />
                    </svg>
                </div>

                <h1 class="text-[22px] font-bold tracking-tight text-[#EBF0EB]">
                    Masuk Admin
                </h1>
                <p class="mt-1.5 text-[13px] leading-relaxed text-[#C8D3C8]">
                    Kelola lokasi wisata Kota Bogor pada sistem Sabah Bogor
                </p>
            </header>

            @if(session('success'))
                <div role="status" class="mt-5 rounded-xl border border-emerald-300/35 bg-[#1B3322]/85 px-4 py-3 text-[12.5px] leading-snug text-emerald-100">
                    {{ session('success') }}
                </div>
            @endif

            @if($errors->any())
                <div role="alert" class="mt-5 rounded-xl border border-rose-400/35 bg-[#2a1216]/85 px-4 py-3 text-[12.5px] leading-snug text-rose-100">
                    {{ $errors->first() }}
                </div>
            @endif

            <form action="{{ route('admin.login.submit') }}" method="POST" class="mt-6 space-y-4">
                @csrf

                <div>
                    <label for="login" class="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
                        Username atau Email
                    </label>
                    <input
                        type="text"
                        id="login"
                        name="login"
                        value="{{ old('login') }}"
                        required
                        autofocus
                        autocomplete="username"
                        placeholder="admin"
                        class="liquid-glass-input min-h-[46px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] text-[#EBF0EB] placeholder:text-[#9AA89A] transition-colors duration-150"
                    />
                </div>

                <div>
                    <div class="mb-1.5 flex items-center justify-between gap-2">
                        <label for="password" class="text-[12px] font-medium text-[#EBF0EB]">
                            Kata Sandi
                        </label>
                        <button
                            type="button"
                            id="btn-toggle-password"
                            onclick="togglePasswordVisibility()"
                            aria-controls="password"
                            aria-pressed="false"
                            class="inline-flex min-h-[28px] items-center rounded-lg px-2 text-[12px] font-medium text-[#C8D3C8] transition-colors hover:text-[#EBF0EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#EBF0EB]"
                        >
                            <span id="eye-text">Tampilkan</span>
                        </button>
                    </div>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        autocomplete="current-password"
                        placeholder="Masukkan kata sandi"
                        class="liquid-glass-input min-h-[46px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] text-[#EBF0EB] placeholder:text-[#9AA89A] transition-colors duration-150"
                    />
                </div>

                <div class="pt-0.5">
                    <label for="remember" class="inline-flex min-h-[44px] cursor-pointer items-center gap-3 select-none">
                        <span class="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                                {{ old('remember') ? 'checked' : '' }}
                                class="peer sr-only"
                            />
                            <span class="h-5 w-5 rounded-md border border-white/25 bg-white/[0.06] transition-colors duration-150 peer-checked:border-[#EBF0EB] peer-checked:bg-[#EBF0EB] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#EBF0EB]"></span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#161E16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute h-3.5 w-3.5 opacity-0 transition-opacity duration-150 peer-checked:opacity-100" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                        <span class="text-[13px] font-medium text-[#C8D3C8]">
                            Ingat saya di perangkat ini
                        </span>
                    </label>
                </div>

                <div class="pt-2">
                    <button
                        type="submit"
                        id="btn-admin-login-submit"
                        class="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#EBF0EB] px-6 py-3 text-[14px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EBF0EB]"
                    >
                        Masuk
                    </button>
                </div>
            </form>
        </div>

        <div class="mt-5 flex justify-center">
            <a
                href="{{ route('pwa.home') }}"
                class="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium text-[#C8D3C8] transition-colors duration-150 hover:text-[#EBF0EB]"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Kembali ke Peta Wisata</span>
            </a>
        </div>
    </main>

    <script>
        function togglePasswordVisibility() {
            const passInput = document.getElementById('password');
            const eyeText = document.getElementById('eye-text');
            const toggleBtn = document.getElementById('btn-toggle-password');
            if (!passInput || !eyeText) return;

            const isHidden = passInput.type === 'password';
            passInput.type = isHidden ? 'text' : 'password';
            eyeText.textContent = isHidden ? 'Sembunyikan' : 'Tampilkan';
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
            }
        }
    </script>
</body>
</html>
