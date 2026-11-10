<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Admin Panel') - SIG Wisata Bogor</title>
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
                        },
                        pin: {
                            alam: '#1f8a5b',
                            kuliner: '#ef8a22',
                            edukasi: '#e2489a',
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
            background-color: #1e281a;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.35);
        }
        .sortable-ghost {
            opacity: 0.4;
            transform: scale(0.96);
            border: 2px dashed #10b981 !important;
        }
        .sortable-chosen {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
    </style>
    @stack('styles')
</head>
<body class="min-h-screen text-white bg-[#1e281a] flex flex-col antialiased">

    <!-- Top Navigation Header -->
    <header class="sticky top-0 z-50 bg-forest-900/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 shadow-lg">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/80 border border-emerald-400/30 text-white shadow-md shadow-emerald-950/40 font-bold text-lg">
                    🌲
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-[17px] font-bold text-white tracking-tight">SIG Wisata Bogor</span>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Backend Admin
                        </span>
                    </div>
                    <p class="text-[11px] text-white/60">Kelola & Input Data Objek Wisata (PostgreSQL / PostGIS)</p>
                </div>
            </div>

            <!-- Links, User Badge & Action -->
            <div class="flex items-center gap-3">
                <a href="{{ route('admin.spots.index') }}" class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold {{ request()->routeIs('admin.spots.index') ? 'bg-white/15 text-white border border-white/20' : 'text-white/70 hover:text-white hover:bg-white/10' }} transition">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Daftar Wisata
                </a>
                <a href="{{ route('admin.spots.create') }}" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30 transition">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Tambah Tempat Wisata
                </a>
                <a href="http://localhost:5173" target="_blank" class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition border border-white/10">
                    <span>Lihat Frontend (5173)</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>

                <!-- User Profile & Logout Dropdown -->
                @auth
                    <div class="flex items-center gap-2.5 pl-2 border-l border-white/15">
                        <div class="flex items-center gap-2">
                            <div class="h-8 w-8 rounded-full overflow-hidden bg-forest-700 border border-white/30">
                                <img src="{{ auth()->user()->avatar ?: '/images/avatar-ambalingham.jpg' }}" alt="{{ auth()->user()->name }}" class="h-full w-full object-cover" onerror="this.src='/images/avatar-ambalingham.jpg'">
                            </div>
                            <div class="hidden sm:block text-left">
                                <p class="text-xs font-bold text-white leading-tight">{{ auth()->user()->name }}</p>
                                <p class="text-[10px] text-emerald-300/80 leading-tight">Administrator</p>
                            </div>
                        </div>

                        <form action="{{ route('admin.logout') }}" method="POST">
                            @csrf
                            <button type="submit" title="Keluar dari Akun (Logout)" class="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 hover:text-white transition cursor-pointer border border-rose-500/30">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </button>
                        </form>
                    </div>
                @endauth
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <!-- Toast / Flash Notification -->
        @if(session('success'))
            <div class="mb-6 flex items-center justify-between rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-4 text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in duration-300">
                <div class="flex items-center gap-3">
                    <span class="text-xl">✅</span>
                    <p class="text-xs sm:text-sm font-medium">{{ session('success') }}</p>
                </div>
                <button type="button" onclick="this.parentElement.remove()" class="text-emerald-300 hover:text-white text-lg font-bold p-1 cursor-pointer">✕</button>
            </div>
        @endif

        @if($errors->any())
            <div class="mb-6 rounded-2xl bg-rose-500/20 border border-rose-400/40 p-4 text-rose-200 shadow-xl backdrop-blur-md">
                <div class="flex items-center gap-2 font-bold text-xs sm:text-sm mb-2 text-rose-100">
                    <span>⚠️</span> Terdapat beberapa kesalahan:
                </div>
                <ul class="list-disc list-inside text-xs space-y-1 text-rose-200/90">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-white/10 bg-forest-900/60 py-4 px-6 text-center text-xs text-white/40">
        Sistem Informasi Geografis (SIG) Pariwisata Kota Bogor &copy; {{ date('Y') }} &bull; Backend Laravel with PostGIS
    </footer>

    @stack('scripts')
</body>
</html>
