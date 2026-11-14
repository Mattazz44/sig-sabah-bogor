<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                        forest: {
                            900: '#2c3b26',
                            800: '#253320',
                            700: '#384931',
                        },
                        sand: '#e2d7b5',
                        ivory: '#ebf0eb',
                    },
                    fontFamily: {
                        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <!-- Leaflet CSS & JS for Interactive Map Picker -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <!-- SortableJS for Drag and Drop Reordering -->
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
    <style>
        body {
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            background-color: #2c3b26;
            background-image:
                radial-gradient(circle at 12% 10%, rgba(79, 95, 59, 0.36) 0%, transparent 45%),
                radial-gradient(circle at 88% 85%, rgba(20, 28, 20, 0.6) 0%, transparent 50%);
            background-attachment: fixed;
        }

        .liquid-glass-card {
            background: rgba(20, 28, 20, 0.55);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow:
                inset 0 1px 1px 0 rgba(255, 255, 255, 0.18),
                0 20px 40px -12px rgba(0, 0, 0, 0.4);
        }

        .liquid-glass-input {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #ebf0eb;
            transition: all 150ms ease;
        }

        .liquid-glass-input:focus {
            background: rgba(255, 255, 255, 0.09);
            border-color: rgba(235, 240, 235, 0.48);
            outline: none;
        }

        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.22);
            border-radius: 9999px;
        }

        .sortable-ghost {
            opacity: 0.38;
            transform: scale(0.97);
            border: 1px dashed rgba(226, 215, 181, 0.8) !important;
        }
        .sortable-chosen {
            box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.55);
        }

        .leaflet-container {
            background: #1B261B;
            font-family: inherit;
        }
    </style>
    @stack('styles')
</head>
<body class="min-h-screen w-full text-[#EBF0EB] antialiased">
    @php
        $navTotalSpots = $totalSpots ?? \App\Models\TouristSpot::count();
        $isCreateOrEdit = request()->routeIs('admin.spots.create') || request()->routeIs('admin.spots.edit');
        $isIndex = request()->routeIs('admin.spots.index') || request()->routeIs('admin.index') || request()->routeIs('admin.home');
    @endphp

    <div class="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8 lg:px-8">
        <!-- Header Admin -->
        <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3.5">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-[#141C14]/65 text-[#E2D7B5] backdrop-blur-xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.14" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.28" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#EBF0EB]">
                        Admin Wisata Bogor
                    </h1>
                    <p class="text-[12.5px] text-[#C8D3C8]">
                        Panel pengelolaan data destinasi, jam operasional, dan titik GIS Kota Bogor
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
                <span class="inline-flex min-h-[40px] items-center rounded-xl border border-white/15 bg-[#141C14]/55 px-3.5 text-[12px] font-medium tabular-nums text-[#C8D3C8] backdrop-blur-md">
                    {{ $navTotalSpots }} lokasi di database
                </span>

                <a href="{{ route('pwa.home') }}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/18 bg-[#141C14]/65 px-3.5 py-2 text-[12.5px] font-semibold text-[#EBF0EB] backdrop-blur-md transition-colors hover:border-white/30 hover:bg-[#1E2B1E] active:scale-[0.98]">
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
                                class="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-300/25 bg-[#3B1D24]/80 px-3.5 py-2 text-[12.5px] font-semibold text-rose-100 backdrop-blur-md transition-colors hover:bg-[#49242D] active:scale-[0.98] cursor-pointer">
                            <span>Keluar</span>
                        </button>
                    </form>
                @endauth
            </div>
        </header>

        <!-- Top Tab Switcher Liquid Glass -->
        <nav aria-label="Navigasi admin" class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div class="relative grid w-full max-w-sm grid-cols-2 rounded-2xl border border-white/15 bg-[#141C14]/55 p-1 backdrop-blur-xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.16)]">
                <a href="{{ route('admin.spots.create') }}"
                   class="relative z-10 flex min-h-[42px] items-center justify-center rounded-xl px-4 text-[13px] transition-colors duration-150 {{ $isCreateOrEdit ? 'font-semibold text-[#EBF0EB] bg-white/[0.14] border border-white/25 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.28)]' : 'font-medium text-[#C8D3C8] hover:text-[#EBF0EB]' }}">
                    <span>{{ request()->routeIs('admin.spots.edit') ? 'Edit Lokasi' : 'Tambah Lokasi' }}</span>
                </a>

                <a href="{{ route('admin.spots.index') }}"
                   class="relative z-10 flex min-h-[42px] items-center justify-center rounded-xl px-4 text-[13px] tabular-nums transition-colors duration-150 {{ $isIndex ? 'font-semibold text-[#EBF0EB] bg-white/[0.14] border border-white/25 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.28)]' : 'font-medium text-[#C8D3C8] hover:text-[#EBF0EB]' }}">
                    <span>Daftar Wisata ({{ $navTotalSpots }})</span>
                </a>
            </div>

            @if(request()->routeIs('admin.spots.edit'))
                <a href="{{ route('admin.spots.index') }}"
                   class="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#141C14]/65 px-3.5 py-1.5 text-[12px] font-medium text-[#C8D3C8] backdrop-blur-md transition-colors hover:text-[#EBF0EB]">
                    ← Kembali ke daftar
                </a>
            @endif
        </nav>

        <!-- Flash Notification Feedback -->
        @if(session('success'))
            <div role="status" class="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/35 bg-[#1B3322]/85 px-4 py-3 text-[13px] text-emerald-100 backdrop-blur-xl shadow-sm">
                <div class="flex items-center gap-2.5">
                    <svg class="h-4 w-4 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{{ session('success') }}</span>
                </div>
                <button type="button" onclick="this.parentElement.remove()" class="text-emerald-200/60 hover:text-emerald-100 text-sm font-bold cursor-pointer">✕</button>
            </div>
        @endif

        @if($errors->any())
            <div role="alert" class="mt-5 rounded-2xl border border-rose-400/35 bg-[#2a1216]/90 px-4 py-3 text-[13px] text-rose-100 backdrop-blur-xl shadow-sm">
                <p class="font-semibold text-rose-200 mb-1">Terjadi kesalahan pada formulir:</p>
                <ul class="list-disc list-inside space-y-0.5 text-[12.5px] text-rose-100/90">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <!-- Main Content -->
        <main class="mt-6">
            @yield('content')
        </main>
    </div>

    @stack('scripts')
</body>
</html>
