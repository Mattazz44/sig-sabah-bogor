<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/SABAH.png">
    <link rel="apple-touch-icon" href="/SABAH.png">
    <title>@yield('title', 'Admin') - Sabah Bogor</title>
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        canopy: {
                            950: '#0d120d',
                            900: '#111711',
                            850: '#161d15',
                            800: '#1c241c',
                        },
                        bone: '#F2ECE1',
                        paper: '#F5F2EB',
                        ambervintage: '#DFAA63',
                    },
                    fontFamily: {
                        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
                    }
                }
            }
        }
    </script>
    <!-- Leaflet CSS & JS for Interactive Map Picker -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <!-- SortableJS for Drag and Drop Reordering -->
    <script defer src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
    <style>
        a[href],
        button:not(:disabled),
        summary,
        select:not(:disabled),
        label[for],
        [role="button"]:not([aria-disabled="true"]),
        input[type="checkbox"]:not(:disabled),
        input[type="submit"]:not(:disabled),
        input[type="button"]:not(:disabled) {
            cursor: pointer;
        }

        :disabled,
        [aria-disabled="true"] {
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
                0 18px 36px -14px rgba(0, 0, 0, 0.48);
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

        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.24);
            border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(244, 239, 230, 0.22);
            border-radius: 9999px;
        }

        .sortable-ghost {
            opacity: 0.38;
            transform: scale(0.97);
            border: 1px dashed rgba(223, 170, 99, 0.85) !important;
        }
        .sortable-chosen {
            box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.55);
        }

        .leaflet-container {
            background: #111711;
            font-family: inherit;
        }

        .leaflet-tile-pane {
            filter: brightness(0.86) contrast(1.06) saturate(0.88);
        }

        /* Animasi looping halus (4s infinite) Maskot Rusa Tutul Role Admin */
        @keyframes adminMascotHeadReview {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
            }
            32% {
                transform: translateY(1.6px) rotate(-2.8deg);
            }
            68% {
                transform: translateY(-0.4px) rotate(1.8deg);
            }
        }

        @keyframes adminMascotPenCheck {
            0%, 100% {
                transform: translate(0px, 0px) rotate(0deg);
            }
            25% {
                transform: translate(-2px, -3.5px) rotate(-6deg);
            }
            48% {
                transform: translate(0.8px, 1.5px) rotate(3deg);
            }
            72% {
                transform: translate(-1.5px, -2.2px) rotate(-4.5deg);
            }
        }

        @keyframes adminMascotCheckGlint {
            0%, 100% {
                opacity: 0.45;
                transform: scale(0.9);
            }
            42%, 58% {
                opacity: 1;
                transform: scale(1.1);
            }
        }

        .admin-mascot-head-nod {
            transform-origin: 60px 74px;
            animation: adminMascotHeadReview 4s ease-in-out infinite;
            will-change: transform;
        }

        .admin-mascot-pen-hand {
            transform-origin: 74px 96px;
            animation: adminMascotPenCheck 4s ease-in-out infinite;
            will-change: transform;
        }

        .admin-mascot-check-glint {
            transform-box: fill-box;
            transform-origin: center;
            animation: adminMascotCheckGlint 4s ease-in-out infinite;
            will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
            }
            .admin-mascot-head-nod,
            .admin-mascot-pen-hand,
            .admin-mascot-check-glint {
                animation: none !important;
            }
        }
    </style>
    @stack('styles')
</head>
<body class="apple-canopy-bg min-h-screen w-full text-[#F5F2EB] antialiased">
    @php
        $navTotalSpots = $totalSpots ?? \App\Models\TouristSpot::count();
        $isCreateOrEdit = request()->routeIs('admin.spots.create') || request()->routeIs('admin.spots.edit');
        $isIndex = request()->routeIs('admin.spots.index') || request()->routeIs('admin.index') || request()->routeIs('admin.home');
    @endphp

    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">
        <!-- Header Admin -->
        <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3.5 min-w-0">
                <div
                    id="admin-header-mascot-wrap"
                    class="apple-retro-bevel flex h-[60px] w-[60px] sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(244,239,230,0.2)] bg-[#1E2B20] p-0 shadow-[0_10px_24px_-6px_rgba(0,0,0,0.5)]"
                >
                    <!-- Maskot Rusa Tutul Bogor Role Admin Full-Bleed memenuhi bingkai + Animasi Looping 4s -->
                    <svg
                        id="admin-header-mascot"
                        viewBox="14 8 92 104"
                        preserveAspectRatio="xMidYMid slice"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        role="img"
                        aria-label="Maskot Rusa Tutul Admin Sabah Bogor"
                        class="block h-full w-full object-cover scale-[1.06]"
                    >
                        <!-- Latar penuh olive gelap tanpa margin kosong di tepi bingkai -->
                        <rect x="0" y="0" width="120" height="120" fill="#1E2B20" />
                        <path d="M 8 84 Q 36 72 62 80 T 114 74" stroke="#76937A" stroke-opacity="0.22" stroke-width="1.4" stroke-linecap="round" />
                        <path d="M 8 96 Q 40 86 68 94 T 114 88" stroke="#76937A" stroke-opacity="0.16" stroke-width="1.4" stroke-linecap="round" />

                        <!-- Bahu, kerah rompi admin sage, & lencana emas -->
                        <g>
                            <path d="M 28 118 C 30 95 40 82 51 78 H 69 C 80 82 90 95 92 118 Z" fill="#F2EFE9" />
                            <path d="M 32 118 C 34 96 42 84 52 80 L 60 88 L 68 80 C 78 84 86 96 88 118 Z" fill="#76937A" fill-opacity="0.9" />
                            <!-- Lencana Admin kecil di dada kanan -->
                            <rect x="69" y="88" width="12" height="7.5" rx="2.2" fill="#C5A868" stroke="#1E2B20" stroke-width="1.1" />
                            <line x1="72" y1="91.8" x2="78" y2="91.8" stroke="#1E2B20" stroke-width="1.3" stroke-linecap="round" />
                        </g>

                        <!-- Kepala Rusa Tutul Admin (mengangguk pelan meninjau data) -->
                        <g class="admin-mascot-head-nod">
                            <!-- Tanduk bercabang minimalis emas redup -->
                            <g stroke="#C5A868" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M 48 37 C 42 28 37 20 41 11.5" />
                                <path d="M 41.5 23.5 C 45.5 21.5 48.5 18 50 14" />
                                <path d="M 72 37 C 78 28 83 20 79 11.5" />
                                <path d="M 78.5 23.5 C 74.5 21.5 71.5 18 70 14" />
                            </g>

                            <!-- Telinga geometris duotone -->
                            <path d="M 44 41 C 33 36 25 39 25 46 C 25 51 34 53 43 50 Z" fill="#F2EFE9" stroke="#1E2B20" stroke-width="1.5" stroke-linejoin="round" />
                            <path d="M 41 43.5 C 34.5 41 29.5 42.5 29.5 46 C 29.5 48.5 34.5 49.5 40.5 47.5 Z" fill="#76937A" />
                            <path d="M 76 41 C 87 36 95 39 95 46 C 95 51 86 53 77 50 Z" fill="#F2EFE9" stroke="#1E2B20" stroke-width="1.5" stroke-linejoin="round" />
                            <path d="M 79 43.5 C 85.5 41 90.5 42.5 90.5 46 C 90.5 48.5 85.5 49.5 79.5 47.5 Z" fill="#76937A" />

                            <!-- Wajah utama Rusa Tutul -->
                            <path d="M 41 45 C 41 33 79 33 79 45 C 79 60 71.5 74 60 77 C 48.5 74 41 60 41 45 Z" fill="#F2EFE9" stroke="#1E2B20" stroke-width="1.7" />
                            <path d="M 60 34 C 48 34 41 38 41 45 C 41 60 48.5 74 60 77 C 54 69 52 57 53 45 C 53.5 39 56 35.5 60 34 Z" fill="#76937A" fill-opacity="0.16" />

                            <!-- Bintik tutul halus di dahi -->
                            <circle cx="60" cy="41.5" r="1.6" fill="#C5A868" />
                            <circle cx="54.2" cy="43.5" r="1.25" fill="#76937A" fill-opacity="0.78" />
                            <circle cx="65.8" cy="43.5" r="1.25" fill="#76937A" fill-opacity="0.78" />

                            <!-- Mata tenang di balik kacamata -->
                            <circle cx="50.5" cy="54" r="2.4" fill="#1E2B20" />
                            <circle cx="51.4" cy="53.1" r="0.8" fill="#F2EFE9" />
                            <circle cx="69.5" cy="54" r="2.4" fill="#1E2B20" />
                            <circle cx="70.4" cy="53.1" r="0.8" fill="#F2EFE9" />

                            <!-- Kacamata bulat tipis editorial Role Admin -->
                            <circle cx="50.5" cy="54" r="6.8" fill="#76937A" fill-opacity="0.15" stroke="#1E2B20" stroke-width="2" />
                            <circle cx="69.5" cy="54" r="6.8" fill="#76937A" fill-opacity="0.15" stroke="#1E2B20" stroke-width="2" />
                            <line x1="57.3" y1="53.8" x2="62.7" y2="53.8" stroke="#C5A868" stroke-width="2" stroke-linecap="round" />
                            <line x1="41.5" y1="52.5" x2="43.7" y2="53.2" stroke="#1E2B20" stroke-width="1.7" stroke-linecap="round" />
                            <line x1="76.3" y1="53.2" x2="78.5" y2="52.5" stroke="#1E2B20" stroke-width="1.7" stroke-linecap="round" />

                            <!-- Hidung & senyum tenang -->
                            <path d="M 56.5 63.2 C 56.5 61.8 63.5 61.8 63.5 63.2 C 63.5 64.8 61.5 66.2 60 66.2 C 58.5 66.2 56.5 64.8 56.5 63.2 Z" fill="#1E2B20" />
                            <path d="M 56.4 69.2 Q 60 71.5 63.6 69.2" stroke="#1E2B20" stroke-width="1.6" stroke-linecap="round" fill="none" />
                        </g>

                        <!-- Papan jalan (Clipboard daftar wisata) -->
                        <g>
                            <rect x="24" y="75" width="38" height="36" rx="5" fill="#76937A" stroke="#1E2B20" stroke-width="1.6" />
                            <rect x="28" y="80" width="30" height="27" rx="2.5" fill="#F2EFE9" />
                            <!-- Penjepit papan emas -->
                            <rect x="37" y="72" width="12" height="6" rx="2.2" fill="#C5A868" stroke="#1E2B20" stroke-width="1.3" />
                            <!-- Baris daftar lokasi wisata -->
                            <circle cx="33.5" cy="87" r="1.6" fill="#C5A868" />
                            <line x1="38" y1="87" x2="53" y2="87" stroke="#1E2B20" stroke-opacity="0.7" stroke-width="1.8" stroke-linecap="round" />
                            <circle cx="33.5" cy="94" r="1.6" fill="#C5A868" />
                            <line x1="38" y1="94" x2="51" y2="94" stroke="#1E2B20" stroke-opacity="0.65" stroke-width="1.8" stroke-linecap="round" />
                            <circle cx="33.5" cy="101" r="1.6" fill="#76937A" />
                            <line x1="38" y1="101" x2="49" y2="101" stroke="#1E2B20" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round" />
                        </g>

                        <!-- Tangan memegang pena bergerak naik-turun mencentang clipboard -->
                        <g class="admin-mascot-pen-hand">
                            <!-- Pena emas & ujung olive -->
                            <path d="M 51 96 L 75 76 L 79.5 80.5 L 55.5 100.5 Z" fill="#C5A868" stroke="#1E2B20" stroke-width="1.4" stroke-linejoin="round" />
                            <path d="M 51 96 L 47.5 102 L 55.5 100.5 Z" fill="#1E2B20" />
                            <!-- Tangan rusa memegang batang pena -->
                            <ellipse cx="70" cy="90" rx="5.2" ry="6.2" transform="rotate(-24 70 90)" fill="#F2EFE9" stroke="#1E2B20" stroke-width="1.5" />
                        </g>

                        <!-- Kilau / lencana centang emas kecil berkedip halus di pojok clipboard -->
                        <g class="admin-mascot-check-glint">
                            <circle cx="63" cy="76" r="8" fill="#C5A868" stroke="#1E2B20" stroke-width="1.4" />
                            <path d="M 59.5 76.2 L 62 78.8 L 66.8 73.6" stroke="#1E2B20" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                            <path d="M 73 65 L 74.1 67.9 L 77 69 L 74.1 70.1 L 73 73 L 71.9 70.1 L 69 69 L 71.9 67.9 Z" fill="#F2EFE9" />
                        </g>
                    </svg>
                </div>
                <div class="min-w-0">
                    <h1 class="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#F5F2EB]">
                        Admin Wisata Bogor
                    </h1>
                    <p class="text-[12.5px] leading-snug text-[#F5F2EB]/65">
                        Panel pengelolaan data destinasi, jam operasional, dan titik GIS Kota Bogor
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
                <span class="apple-retro-bevel inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[rgba(244,239,230,0.14)] bg-[rgba(28,36,28,0.65)] px-3.5 text-[12px] font-medium text-[#F5F2EB]/75">
                    <span class="font-mono font-semibold tabular-nums text-[#DFAA63]">{{ $navTotalSpots }}</span>
                    <span>lokasi di database</span>
                </span>

                <a href="{{ route('pwa.home') }}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="apple-retro-bevel inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[rgba(244,239,230,0.16)] bg-white/[0.06] px-3.5 py-2 text-[12.5px] font-semibold text-[#F5F2EB] transition-colors hover:border-[rgba(244,239,230,0.28)] hover:bg-white/[0.11] active:scale-[0.98]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                        <line x1="9" y1="3" x2="9" y2="18"></line>
                        <line x1="15" y1="6" x2="15" y2="21"></line>
                    </svg>
                    <span>Peta Utama</span>
                </a>

                @auth
                    <form action="{{ route('admin.logout') }}" method="POST">
                        @csrf
                        <button type="submit"
                                title="Keluar dari akun ({{ auth()->user()->name }})"
                                class="apple-retro-bevel inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-rose-300/25 bg-[#3A1B22]/85 px-3.5 py-2 text-[12.5px] font-semibold text-rose-100 transition-colors hover:bg-[#49222B] active:scale-[0.98]">
                            <span>Keluar</span>
                        </button>
                    </form>
                @endauth
            </div>
        </header>

        <!-- Top Tab Switcher -->
        <nav aria-label="Navigasi admin" class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div class="apple-glass-card relative grid w-full max-w-sm grid-cols-2 rounded-2xl p-1">
                <a href="{{ route('admin.spots.create') }}"
                   class="relative z-10 flex min-h-[44px] items-center justify-center rounded-xl px-4 text-[13px] transition-colors duration-150 {{ $isCreateOrEdit ? 'apple-retro-bevel font-semibold text-[#F5F2EB] bg-white/[0.13] border border-[rgba(244,239,230,0.22)]' : 'font-medium text-[#F5F2EB]/65 hover:text-[#F5F2EB]' }}">
                    <span>{{ request()->routeIs('admin.spots.edit') ? 'Edit Lokasi' : 'Tambah Lokasi' }}</span>
                </a>

                <a href="{{ route('admin.spots.index') }}"
                   class="relative z-10 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] transition-colors duration-150 {{ $isIndex ? 'apple-retro-bevel font-semibold text-[#F5F2EB] bg-white/[0.13] border border-[rgba(244,239,230,0.22)]' : 'font-medium text-[#F5F2EB]/65 hover:text-[#F5F2EB]' }}">
                    <span>Daftar Wisata</span>
                    <span class="font-mono text-[12px] tabular-nums {{ $isIndex ? 'text-[#DFAA63]' : 'text-[#F5F2EB]/60' }}">({{ $navTotalSpots }})</span>
                </a>
            </div>

            @if(request()->routeIs('admin.spots.edit'))
                <a href="{{ route('admin.spots.index') }}"
                   class="apple-retro-bevel inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[rgba(244,239,230,0.14)] bg-[rgba(28,36,28,0.65)] px-4 py-2 text-[12.5px] font-medium text-[#F5F2EB]/75 transition-colors hover:border-[rgba(244,239,230,0.28)] hover:text-[#F5F2EB]">
                    <span aria-hidden="true">←</span>
                    <span>Kembali ke daftar</span>
                </a>
            @endif
        </nav>

        <!-- Flash Notification Feedback -->
        @if(session('success'))
            <div role="status" class="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/30 bg-[#182B1D]/90 px-4 py-2.5 text-[13px] text-emerald-100 shadow-sm">
                <div class="flex items-center gap-2.5">
                    <svg class="h-4 w-4 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{{ session('success') }}</span>
                </div>
                <button type="button" onclick="this.parentElement.remove()" aria-label="Tutup notifikasi" class="flex h-11 w-11 -mr-2 shrink-0 items-center justify-center rounded-xl text-emerald-200/70 transition-colors hover:bg-white/[0.08] hover:text-emerald-100 text-sm font-bold">
                    <span aria-hidden="true">✕</span>
                </button>
            </div>
        @endif

        @if($errors->any())
            <div role="alert" class="mt-5 rounded-2xl border border-rose-400/35 bg-[#2B1418]/90 px-4 py-3.5 text-[13px] text-rose-100 shadow-sm">
                <p class="font-semibold text-rose-200 mb-1">Terjadi kesalahan pada formulir:</p>
                <ul class="list-disc list-inside space-y-0.5 text-[12.5px] text-rose-100/90">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <!-- Main Content -->
        <main class="mt-6 flex-1">
            @yield('content')
        </main>

        <footer class="mt-12 border-t border-[rgba(244,239,230,0.08)] pt-5 text-center text-[11.5px] text-[#F5F2EB]/45">
            Sabah Bogor GIS · Panel Administrasi Destinasi Kota Bogor
        </footer>
    </div>

    @stack('scripts')
</body>
</html>
