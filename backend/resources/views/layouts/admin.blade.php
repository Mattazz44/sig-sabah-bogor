<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Admin') - Wisata Bogor</title>
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
                            900: '#2c3b26',
                            800: '#384931',
                            700: '#4f5f3b',
                        },
                        accent: {
                            DEFAULT: '#8c785c',
                            hover: '#9b8669',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
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
            font-family: 'Inter', sans-serif;
            background-color: #2c3b26;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
            height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 9999px;
        }
        .sortable-ghost {
            opacity: 0.4;
            transform: scale(0.97);
            border: 1px dashed rgba(255, 255, 255, 0.5) !important;
        }
        .sortable-chosen {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.45);
        }
        .leaflet-container {
            background: #253520;
        }
    </style>
    @stack('styles')
</head>
<body class="min-h-screen w-full bg-[#2c3b26] text-white antialiased">
    @php
        $navTotalSpots = $totalSpots ?? \App\Models\TouristSpot::count();
        $isCreateOrEdit = request()->routeIs('admin.spots.create') || request()->routeIs('admin.spots.edit');
        $isIndex = request()->routeIs('admin.spots.index') || request()->routeIs('admin.index') || request()->routeIs('admin.home');
    @endphp

    <div class="mx-auto w-full max-w-md px-6 pt-8 pb-16">
        <!-- Header Admin (Sesuai AdminPage.jsx) -->
        <header class="flex items-start justify-between">
            <div>
                <p class="text-[11px] font-medium text-white/55">Admin</p>
                <h1 class="mt-0.5 text-[20px] font-bold tracking-tight text-white">
                    Wisata Bogor
                </h1>
            </div>

            <div class="flex items-center gap-2">
                @auth
                    <form action="{{ route('admin.logout') }}" method="POST">
                        @csrf
                        <button type="submit"
                                title="Keluar ({{ auth()->user()->name }})"
                                class="rounded-full bg-white/10 hover:bg-white/15 px-3 py-1 text-[11px] font-medium text-white/80 transition cursor-pointer">
                            Keluar
                        </button>
                    </form>
                @endauth
            </div>
        </header>

        <!-- Top Tab Navigation (Sesuai AdminPage.jsx) -->
        <nav aria-label="Navigasi Admin" class="mt-6 flex items-center gap-6 border-b border-white/15">
            <a href="{{ route('admin.spots.create') }}"
               class="relative pb-2.5 text-[13px] transition {{ $isCreateOrEdit ? 'font-semibold text-white' : 'font-normal text-white/50 hover:text-white/80' }}">
                <span>{{ request()->routeIs('admin.spots.edit') ? 'Edit lokasi' : 'Tambah lokasi' }}</span>
                @if($isCreateOrEdit)
                    <span class="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white rounded-full"></span>
                @endif
            </a>

            <a href="{{ route('admin.spots.index') }}"
               class="relative pb-2.5 text-[13px] transition {{ $isIndex ? 'font-semibold text-white' : 'font-normal text-white/50 hover:text-white/80' }}">
                <span>Daftar ({{ $navTotalSpots }})</span>
                @if($isIndex)
                    <span class="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white rounded-full"></span>
                @endif
            </a>
        </nav>

        <!-- Flash Notification -->
        @if(session('success'))
            <div class="mt-5 flex items-center justify-between gap-2 rounded-lg bg-[#384931] border border-emerald-400/35 px-3.5 py-2.5 text-[12px] text-emerald-200">
                <span>{{ session('success') }}</span>
                <button type="button" onclick="this.parentElement.remove()" class="text-white/50 hover:text-white text-xs font-bold cursor-pointer">✕</button>
            </div>
        @endif

        @if($errors->any())
            <div role="alert" class="mt-5 rounded-lg bg-rose-500/20 border border-rose-400/40 px-3.5 py-2.5 text-[12px] text-rose-200">
                <ul class="list-disc list-inside space-y-0.5">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <!-- Main Content -->
        <main>
            @yield('content')
        </main>
    </div>

    @stack('scripts')
</body>
</html>
