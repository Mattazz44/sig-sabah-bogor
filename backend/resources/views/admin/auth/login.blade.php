<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/SABAH.png">
    <link rel="apple-touch-icon" href="/SABAH.png">
    <title>Masuk Admin - Sabah Bogor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        a[href],
        button:not(:disabled),
        label[for],
        input[type="checkbox"]:not(:disabled),
        input[type="submit"]:not(:disabled) {
            cursor: pointer;
        }

        :disabled {
            cursor: not-allowed;
        }

        :focus-visible {
            outline: 2px solid #F2ECE1;
            outline-offset: 2px;
        }

        .apple-canopy-bg {
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            background-color: #111711;
            background-image:
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E"),
                radial-gradient(120% 65% at 50% 0%, rgba(44, 62, 42, 0.3) 0%, transparent 64%),
                linear-gradient(180deg, #161d15 0%, #111711 55%, #0d120d 100%);
            background-attachment: fixed;
        }

        .apple-glass-card {
            background: rgba(28, 36, 28, 0.65);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(244, 239, 230, 0.14);
            box-shadow:
                inset 0 1px 0 0 rgba(244, 239, 230, 0.18),
                inset 0 -1px 0 0 rgba(0, 0, 0, 0.32),
                0 24px 48px -12px rgba(0, 0, 0, 0.52);
        }

        .apple-retro-bevel {
            box-shadow:
                inset 0 1px 0 0 rgba(244, 239, 230, 0.18),
                inset 0 -1px 0 0 rgba(0, 0, 0, 0.32);
        }

        .apple-retro-cta {
            background-color: #F2ECE1;
            color: #141A14;
            border: 1px solid rgba(255, 255, 255, 0.42);
            box-shadow:
                inset 0 1px 0 0 rgba(255, 255, 255, 0.72),
                inset 0 -1.5px 0 0 rgba(0, 0, 0, 0.22),
                0 4px 12px -2px rgba(0, 0, 0, 0.35);
            transition: background-color 150ms ease-out, transform 150ms ease-out, box-shadow 150ms ease-out;
        }

        .apple-retro-cta:hover:not(:disabled) {
            background-color: #E7DFD1;
        }

        .apple-retro-cta:active:not(:disabled) {
            background-color: #DDD4C3;
            transform: scale(0.985);
            box-shadow:
                inset 0 1px 2px 0 rgba(0, 0, 0, 0.25),
                0 1px 4px rgba(0, 0, 0, 0.28);
        }

        .liquid-glass-input {
            background: rgba(244, 239, 230, 0.06);
            border: 1px solid rgba(244, 239, 230, 0.15);
            color: #F5F2EB;
            box-shadow: inset 0 1px 2px 0 rgba(0, 0, 0, 0.22);
            transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
        }

        .liquid-glass-input:focus {
            background: rgba(244, 239, 230, 0.09);
            border-color: rgba(244, 239, 230, 0.38);
            outline: none;
        }

        .liquid-glass-input:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px rgba(242, 236, 225, 0.58);
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
            }
        }
    </style>
</head>
<body class="apple-canopy-bg min-h-screen w-full text-[#F5F2EB] flex flex-col items-center justify-center px-4 py-8 sm:px-6 antialiased">
    <main class="w-full max-w-md">
        <div class="apple-glass-card rounded-3xl p-6 sm:p-8">
            <!-- Brand Header -->
            <header class="text-center">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.18] bg-[#161D15] p-1.5 shadow-[0_14px_30px_-8px_rgba(78,138,54,0.42),0_4px_12px_rgba(0,0,0,0.45)]">
                    <img src="/SABAH.png" alt="Logo Sabah Bogor" class="h-full w-full rounded-xl object-contain" />
                </div>

                <h1 class="text-[22px] font-bold tracking-tight text-[#F5F2EB]">
                    Masuk Admin
                </h1>
                <p class="mt-1.5 text-[13px] leading-relaxed text-[#F5F2EB]/65">
                    Kelola lokasi wisata Kota Bogor pada sistem Sabah Bogor
                </p>
            </header>

            @if(session('success'))
                <div role="status" class="mt-5 rounded-xl border border-emerald-300/30 bg-[#182B1D]/90 px-4 py-3 text-[12.5px] leading-snug text-emerald-100">
                    {{ session('success') }}
                </div>
            @endif

            @if($errors->any())
                <div role="alert" class="mt-5 rounded-xl border border-rose-400/35 bg-[#2B1418]/90 px-4 py-3 text-[12.5px] leading-snug text-rose-100">
                    {{ $errors->first() }}
                </div>
            @endif

            <form id="admin-login-form" action="{{ route('admin.login.submit') }}" method="POST" class="mt-6 space-y-4">
                @csrf

                <div>
                    <label for="login" class="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]/80">
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
                        class="liquid-glass-input min-h-[46px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] placeholder:text-[#F5F2EB]/45"
                    />
                </div>

                <div>
                    <label for="password" class="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]/80">
                        Kata Sandi
                    </label>
                    <div class="relative">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            autocomplete="current-password"
                            placeholder="Masukkan kata sandi"
                            class="liquid-glass-input min-h-[46px] w-full rounded-xl pl-3.5 pr-28 py-2.5 text-[13.5px] placeholder:text-[#F5F2EB]/45"
                        />
                        <button
                            type="button"
                            id="btn-toggle-password"
                            onclick="togglePasswordVisibility()"
                            aria-controls="password"
                            aria-pressed="false"
                            class="absolute right-1 top-1/2 flex min-h-[44px] -translate-y-1/2 items-center rounded-lg px-3 text-[12px] font-medium text-[#F5F2EB]/70 transition-colors hover:text-[#F5F2EB]"
                        >
                            <span id="eye-text">Tampilkan</span>
                        </button>
                    </div>
                </div>

                <div class="pt-0.5">
                    <label for="remember" class="inline-flex min-h-[44px] items-center gap-3 select-none">
                        <span class="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                                {{ old('remember') ? 'checked' : '' }}
                                class="peer sr-only"
                            />
                            <span class="h-5 w-5 rounded-md border border-[rgba(244,239,230,0.28)] bg-white/[0.06] transition-colors duration-150 peer-checked:border-[#F2ECE1] peer-checked:bg-[#F2ECE1] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#F2ECE1]"></span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#141A14" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute h-3.5 w-3.5 opacity-0 transition-opacity duration-150 peer-checked:opacity-100" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                        <span class="text-[13px] font-medium text-[#F5F2EB]/75">
                            Ingat saya di perangkat ini
                        </span>
                    </label>
                </div>

                <div class="pt-2">
                    <button
                        type="submit"
                        id="btn-admin-login-submit"
                        class="apple-retro-cta flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 py-3 text-[14px] font-semibold"
                    >
                        Masuk
                    </button>
                </div>
            </form>
        </div>

        <footer class="mt-5 flex justify-center">
            <a
                href="{{ route('pwa.home') }}"
                class="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium text-[#F5F2EB]/65 transition-colors duration-150 hover:text-[#F5F2EB]"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Kembali ke Peta Wisata</span>
            </a>
        </footer>
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

        const loginForm = document.getElementById('admin-login-form');
        const submitBtn = document.getElementById('btn-admin-login-submit');
        if (loginForm && submitBtn) {
            loginForm.addEventListener('submit', function () {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Memproses...';
                submitBtn.classList.add('opacity-75');
            });

            window.addEventListener('pageshow', function () {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Masuk';
                submitBtn.classList.remove('opacity-75');
            });
        }
    </script>
</body>
</html>
