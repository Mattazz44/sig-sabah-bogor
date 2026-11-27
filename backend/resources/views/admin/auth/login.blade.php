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

        @keyframes logoIntroGlow {
            0% {
                opacity: 0.72;
                transform: scale(0.94);
                border-color: rgba(142, 201, 102, 0.12);
                box-shadow:
                    0 8px 20px -8px rgba(78, 138, 54, 0.12),
                    0 0 8px 0 rgba(126, 188, 102, 0.06),
                    0 4px 12px rgba(0, 0, 0, 0.38);
            }
            45% {
                opacity: 1;
                transform: scale(0.98);
                border-color: rgba(142, 201, 102, 0.34);
                box-shadow:
                    0 12px 28px -8px rgba(96, 168, 72, 0.32),
                    0 0 20px 1px rgba(142, 201, 102, 0.22),
                    0 4px 14px rgba(0, 0, 0, 0.42);
            }
            82% {
                opacity: 1;
                transform: scale(1.015);
                border-color: rgba(167, 214, 146, 0.38);
                box-shadow:
                    0 16px 34px -6px rgba(96, 168, 72, 0.46),
                    0 0 28px 2px rgba(142, 201, 102, 0.30),
                    0 6px 16px rgba(0, 0, 0, 0.46);
            }
            100% {
                opacity: 1;
                transform: scale(1);
                border-color: rgba(244, 239, 230, 0.18);
                box-shadow:
                    0 14px 28px -8px rgba(78, 138, 54, 0.34),
                    0 0 18px 0 rgba(126, 188, 102, 0.18),
                    0 4px 12px rgba(0, 0, 0, 0.42);
            }
        }

        @keyframes logoIdleBreath {
            0%, 100% {
                transform: translateY(0px);
                box-shadow:
                    0 14px 28px -8px rgba(78, 138, 54, 0.32),
                    0 0 16px 0 rgba(126, 188, 102, 0.16),
                    0 4px 12px rgba(0, 0, 0, 0.42);
            }
            50% {
                transform: translateY(-4px);
                box-shadow:
                    0 18px 36px -6px rgba(96, 168, 72, 0.48),
                    0 0 26px 2px rgba(140, 206, 114, 0.26),
                    0 8px 18px rgba(0, 0, 0, 0.48);
            }
        }

        /* Fase 1 (0% - 45% / ~0s - 2.9s): Menggambar kotak rounded & garis jalur berkelok secara perlahan */
        @keyframes sabahDrawFrame {
            0% {
                stroke-dashoffset: 320;
                stroke-opacity: 0.18;
            }
            10% {
                stroke-opacity: 0.95;
            }
            44% {
                stroke-dashoffset: 0;
                stroke-opacity: 0.95;
            }
            74% {
                stroke-dashoffset: 0;
                stroke-opacity: 0.62;
            }
            94%, 100% {
                stroke-dashoffset: 0;
                stroke-opacity: 0;
            }
        }

        @keyframes sabahDrawRoad {
            0%, 8% {
                stroke-dashoffset: 150;
                stroke-opacity: 0;
            }
            15% {
                stroke-opacity: 1;
            }
            46% {
                stroke-dashoffset: 0;
                stroke-opacity: 1;
            }
            74% {
                stroke-dashoffset: 0;
                stroke-opacity: 0.68;
            }
            91%, 100% {
                stroke-dashoffset: 0;
                stroke-opacity: 0;
            }
        }

        @keyframes sabahDrawLeaves {
            0%, 24% {
                stroke-dashoffset: 60;
                stroke-opacity: 0;
            }
            31% {
                stroke-opacity: 0.9;
            }
            50% {
                stroke-dashoffset: 0;
                stroke-opacity: 0.9;
            }
            76% {
                stroke-dashoffset: 0;
                stroke-opacity: 0.45;
            }
            92%, 100% {
                stroke-dashoffset: 0;
                stroke-opacity: 0;
            }
        }

        /* Fase 2 (45% - 82% / ~2.9s - 5.3s): Pin lokasi muncul perlahan (scale 0 -> 1) & fill mengalir tenang */
        @keyframes sabahPinReveal {
            0%, 44% {
                opacity: 0;
                transform: scale(0);
            }
            58% {
                opacity: 1;
                transform: scale(1.06);
            }
            68% {
                opacity: 1;
                transform: scale(1);
            }
            78% {
                opacity: 0.85;
                transform: scale(1);
            }
            92%, 100% {
                opacity: 0;
                transform: scale(1);
            }
        }

        @keyframes sabahPinPulse {
            0%, 48% {
                opacity: 0;
                transform: scale(0.4);
            }
            60% {
                opacity: 0.78;
            }
            78%, 100% {
                opacity: 0;
                transform: scale(1.75);
            }
        }

        @keyframes sabahFillMorph {
            0%, 46% {
                fill-opacity: 0;
                opacity: 0;
            }
            79% {
                fill-opacity: 1;
                opacity: 1;
            }
            90%, 100% {
                fill-opacity: 1;
                opacity: 1;
            }
        }

        @keyframes sabahDetailReveal {
            0%, 58% {
                opacity: 0;
            }
            88%, 100% {
                opacity: 1;
            }
        }

        /* Fase 3 (80% - 100% / ~5.2s - 6.5s): Sapuan cahaya diagonal tenang saat logo menyatu utuh */
        @keyframes sabahSheenSweep {
            0%, 78% {
                opacity: 0;
                transform: translateX(-140%) skewX(-20deg);
            }
            86% {
                opacity: 0.75;
            }
            100% {
                opacity: 0;
                transform: translateX(160%) skewX(-20deg);
            }
        }

        .admin-logo-stage {
            display: inline-flex;
            transition: transform 0.4s ease;
            will-change: transform;
        }

        .admin-logo-stage:hover {
            transform: scale(1.05);
        }

        .admin-logo-float {
            animation:
                logoIntroGlow 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                logoIdleBreath 5.5s ease-in-out 6.5s infinite;
            transition: border-color 0.4s ease;
            will-change: transform, box-shadow;
        }

        .admin-logo-stage:hover .admin-logo-float {
            border-color: rgba(167, 214, 146, 0.42);
        }

        .sabah-frame-stroke {
            stroke-dasharray: 320;
            stroke-dashoffset: 320;
            animation: sabahDrawFrame 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .sabah-road-stroke {
            stroke-dasharray: 150;
            stroke-dashoffset: 150;
            animation: sabahDrawRoad 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .sabah-leaf-stroke {
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
            animation: sabahDrawLeaves 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .sabah-pin-group {
            transform-box: fill-box;
            transform-origin: center;
            opacity: 0;
            animation: sabahPinReveal 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .sabah-pin-ripple {
            transform-box: fill-box;
            transform-origin: center;
            opacity: 0;
            animation: sabahPinPulse 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .sabah-fill-body {
            fill-opacity: 0;
            opacity: 0;
            animation: sabahFillMorph 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .sabah-artwork-detail {
            opacity: 0;
            animation: sabahDetailReveal 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .sabah-sheen-bar {
            opacity: 0;
            animation: sabahSheenSweep 6.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                animation-delay: 0s !important;
            }
            .sabah-frame-stroke,
            .sabah-road-stroke,
            .sabah-leaf-stroke,
            .sabah-pin-group,
            .sabah-pin-ripple,
            .sabah-sheen-bar {
                opacity: 0 !important;
            }
            .sabah-fill-body,
            .sabah-artwork-detail {
                opacity: 1 !important;
                fill-opacity: 1 !important;
            }
        }
    </style>
</head>
<body class="apple-canopy-bg min-h-screen w-full text-[#F5F2EB] flex flex-col items-center justify-center px-4 py-8 sm:px-6 antialiased">
    <main class="w-full max-w-md">
        <div class="apple-glass-card rounded-3xl p-6 sm:p-8">
            <!-- Brand Header -->
            <header class="text-center">
                <div class="mb-4 flex justify-center">
                    <div class="admin-logo-stage">
                        <div
                            id="admin-brand-logo-wrap"
                            class="admin-logo-float relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.18] bg-[#161D15] p-1.5"
                        >
                            <!-- Inline SVG Logo Sabah Bogor: Path Drawing & Morphing (6.5s) -->
                            <svg
                                id="admin-sabah-svg"
                                viewBox="0 0 100 100"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                role="img"
                                aria-label="Logo Sabah Bogor"
                                class="relative z-10 h-full w-full"
                            >
                                <defs>
                                    <linearGradient id="sabahCanopyGrad" x1="20%" y1="12%" x2="82%" y2="88%">
                                        <stop offset="0%" stop-color="#528530" />
                                        <stop offset="55%" stop-color="#7EA246" />
                                        <stop offset="100%" stop-color="#A7BE5E" />
                                    </linearGradient>

                                    <filter id="sabahSageGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="1.6" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>

                                    <!-- Masker presisi sesuai bentuk asli SABAH.png (kotak B, jalur S, daun B, & pin) -->
                                    <mask id="sabahEmblemMask">
                                        <path
                                            d="M 16.5 12 H 88 V 27 C 88 37.5 82 47.2 73 52.5 C 82 58 88 68.5 88 79.5 V 87 H 13 V 15.5 C 13 13.5 14.5 12 16.5 12 Z"
                                            fill="#FFFFFF"
                                        />
                                        <!-- Potongan jalur S berkelok -->
                                        <path
                                            d="M 10 85.5 C 27 77.5 46 69.5 49 56.5 C 51.2 47 43.2 39.8 46 30 C 48.8 20.5 64 14.8 90 7.5"
                                            stroke="#000000"
                                            stroke-width="11.5"
                                            stroke-linecap="round"
                                            fill="none"
                                        />
                                        <!-- Potongan pin lokasi kiri atas -->
                                        <path
                                            d="M 25.8 16.8 C 21.1 16.8 17.6 20.3 17.6 24.8 C 17.6 29.8 23.5 35.8 25.2 37.8 C 25.5 38.2 26.1 38.2 26.4 37.8 C 28.1 35.8 34 29.8 34 24.8 C 34 20.3 30.5 16.8 25.8 16.8 Z"
                                            fill="#000000"
                                        />
                                        <circle cx="25.8" cy="24.6" r="3.4" fill="#FFFFFF" />
                                        <!-- Potongan dua daun huruf B di kanan -->
                                        <path
                                            d="M 64.5 52 C 63.8 45 65.2 39.5 71 38.5 C 72 44.5 70.5 51 64.5 52 Z"
                                            fill="#000000"
                                        />
                                        <path
                                            d="M 64.5 53.5 C 70.8 54.5 72.8 60 72 67 C 66 66.5 64 60.5 64.5 53.5 Z"
                                            fill="#000000"
                                        />
                                    </mask>
                                </defs>

                                <!-- Fase 2 (45%-80%): Siluet vektor logo terisi bertahap (fill-opacity 0 -> 1) -->
                                <g class="sabah-fill-body" mask="url(#sabahEmblemMask)">
                                    <rect x="12" y="11" width="77" height="77" fill="url(#sabahCanopyGrad)" />
                                    <rect x="12" y="81.5" width="77" height="6.5" fill="#6F8056" />
                                </g>

                                <!-- Detail siluet rusa Bogor & pepohonan menyatu presisi dari SABAH.png -->
                                <image
                                    href="/SABAH.png"
                                    x="0"
                                    y="0"
                                    width="100"
                                    height="100"
                                    preserveAspectRatio="xMidYMid meet"
                                    class="sabah-artwork-detail"
                                />

                                <!-- Fase 1 (0%-45%): Garis tepi kotak rounded & kontur B menggambar diri -->
                                <path
                                    d="M 16.5 12 H 88 V 27 C 88 37.5 82 47.2 73 52.5 C 82 58 88 68.5 88 79.5 V 87 H 13 V 15.5 C 13 13.5 14.5 12 16.5 12 Z"
                                    stroke="#8EC966"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    filter="url(#sabahSageGlow)"
                                    class="sabah-frame-stroke"
                                />

                                <!-- Fase 1 (0%-45%): Garis jalur berkelok S menggambar jalurnya sendiri -->
                                <path
                                    d="M 11 85 C 27.5 77 46 69.2 49 56.5 C 51.2 47 43.2 39.8 46 30 C 48.8 20.5 64 14.8 89 8"
                                    stroke="#DDF0C8"
                                    stroke-width="3.2"
                                    stroke-linecap="round"
                                    filter="url(#sabahSageGlow)"
                                    class="sabah-road-stroke"
                                />

                                <!-- Fase 1: Garis kontur daun B kanan -->
                                <path
                                    d="M 64.5 52 C 63.8 45 65.2 39.5 71 38.5 C 72 44.5 70.5 51 64.5 52 Z M 64.5 53.5 C 70.8 54.5 72.8 60 72 67 C 66 66.5 64 60.5 64.5 53.5 Z"
                                    stroke="#A7D682"
                                    stroke-width="1.6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="sabah-leaf-stroke"
                                />

                                <!-- Fase 2 (45%-80%): Pin lokasi membesar scale(0 -> 1) + cincin radar tipis -->
                                <circle
                                    cx="25.8"
                                    cy="24.8"
                                    r="7.5"
                                    stroke="#8EC966"
                                    stroke-width="1.4"
                                    class="sabah-pin-ripple"
                                />
                                <g class="sabah-pin-group" filter="url(#sabahSageGlow)">
                                    <path
                                        d="M 25.8 16.8 C 21.1 16.8 17.6 20.3 17.6 24.8 C 17.6 29.8 23.5 35.8 25.2 37.8 C 25.5 38.2 26.1 38.2 26.4 37.8 C 28.1 35.8 34 29.8 34 24.8 C 34 20.3 30.5 16.8 25.8 16.8 Z"
                                        fill="#DFAA63"
                                    />
                                    <circle cx="25.8" cy="24.6" r="3.4" fill="#161D15" />
                                </g>
                            </svg>

                            <!-- Fase 3 (80%-100%): Sapuan cahaya diagonal lembut -->
                            <span
                                aria-hidden="true"
                                class="sabah-sheen-bar pointer-events-none absolute inset-y-0 -left-6 z-20 w-10 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                            ></span>
                        </div>
                    </div>
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
