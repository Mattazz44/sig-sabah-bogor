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

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
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
                <div class="apple-retro-bevel flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(244,239,230,0.16)] bg-[rgba(28,36,28,0.72)] text-[#DFAA63]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.14" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.28" />
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
