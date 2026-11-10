@extends('layouts.admin')

@section('title', 'Daftar Tempat Wisata')

@section('content')
<div class="space-y-6">

    <!-- Hero / Metrics Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-2xl bg-forest-900/80 border border-white/10 p-5 shadow-sm">
            <div class="flex items-center justify-between text-white/60 mb-2">
                <span class="text-xs font-medium uppercase tracking-wider">Total Destinasi</span>
                <span class="text-lg">📍</span>
            </div>
            <div class="text-2xl font-bold text-white">{{ $totalSpots }} <span class="text-xs font-normal text-white/50">titik wisata</span></div>
            <p class="text-[11px] text-emerald-400 mt-1">Tersimpan di PostgreSQL + PostGIS</p>
        </div>

        <div class="rounded-2xl bg-forest-900/80 border border-white/10 p-5 shadow-sm">
            <div class="flex items-center justify-between text-white/60 mb-2">
                <span class="text-xs font-medium uppercase tracking-wider">Alam & Curug</span>
                <span class="w-3 h-3 rounded-full bg-[#1f8a5b]"></span>
            </div>
            <div class="text-2xl font-bold text-white">{{ $categoriesCount['Alam & Curug'] ?? 0 }}</div>
            <p class="text-[11px] text-white/50 mt-1">Wisata alam pegunungan & air terjun</p>
        </div>

        <div class="rounded-2xl bg-forest-900/80 border border-white/10 p-5 shadow-sm">
            <div class="flex items-center justify-between text-white/60 mb-2">
                <span class="text-xs font-medium uppercase tracking-wider">Kuliner</span>
                <span class="w-3 h-3 rounded-full bg-[#ef8a22]"></span>
            </div>
            <div class="text-2xl font-bold text-white">{{ $categoriesCount['Kuliner'] ?? 0 }}</div>
            <p class="text-[11px] text-white/50 mt-1">Sentra kuliner & cafe khas Bogor</p>
        </div>

        <div class="rounded-2xl bg-forest-900/80 border border-white/10 p-5 shadow-sm">
            <div class="flex items-center justify-between text-white/60 mb-2">
                <span class="text-xs font-medium uppercase tracking-wider">Edukasi & Budaya</span>
                <span class="w-3 h-3 rounded-full bg-[#e2489a]"></span>
            </div>
            <div class="text-2xl font-bold text-white">{{ $categoriesCount['Edukasi & Budaya'] ?? 0 }}</div>
            <p class="text-[11px] text-white/50 mt-1">Museum, sejarah, & cagar budaya</p>
        </div>
    </div>

    <!-- Filter Pills & Search Bar (Sesuai Gaya Frontend) -->
    <div class="rounded-2xl bg-forest-900/90 border border-white/10 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <!-- Category Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
            @php
                $pillCategories = ['Semua', 'Alam & Curug', 'Kuliner', 'Edukasi & Budaya'];
            @endphp
            @foreach($pillCategories as $cat)
                <a href="{{ route('admin.spots.index', ['category' => $cat, 'q' => request('q')]) }}"
                   class="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer {{ $category === $cat ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10' }}">
                    {{ $cat }}
                    @if($cat !== 'Semua')
                        <span class="ml-1 opacity-75">({{ $categoriesCount[$cat] ?? 0 }})</span>
                    @endif
                </a>
            @endforeach
        </div>

        <!-- Search Input -->
        <form action="{{ route('admin.spots.index') }}" method="GET" class="relative w-full md:w-80">
            <input type="hidden" name="category" value="{{ $category }}">
            <input type="text" name="q" value="{{ $search }}"
                   placeholder="Cari nama, alamat wisata..."
                   class="w-full rounded-xl bg-forest-700/70 border border-white/20 pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
            <svg class="absolute left-3 top-2.5 text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            @if($search)
                <a href="{{ route('admin.spots.index', ['category' => $category]) }}" class="absolute right-3 top-2.5 text-white/40 hover:text-white text-xs">✕</a>
            @endif
        </form>
    </div>

    <!-- Table of Tourist Spots -->
    <div class="rounded-2xl bg-forest-900/90 border border-white/10 shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
                <thead class="bg-forest-800/80 border-b border-white/10 text-white/70 uppercase tracking-wider text-[10px]">
                    <tr>
                        <th class="px-5 py-3.5">Tempat Wisata</th>
                        <th class="px-4 py-3.5">Kategori</th>
                        <th class="px-4 py-3.5">Koordinat (Lat, Lng)</th>
                        <th class="px-4 py-3.5">Harga & Jam</th>
                        <th class="px-4 py-3.5">Rating</th>
                        <th class="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-white/80">
                    @forelse($spots as $spot)
                        <tr class="hover:bg-white/5 transition">
                            <td class="px-5 py-3.5">
                                <div class="flex items-center gap-3">
                                    <div class="h-12 w-12 rounded-xl overflow-hidden bg-forest-700/80 border border-white/10 shrink-0">
                                        <img src="{{ $spot->image }}" alt="{{ $spot->name }}" class="h-full w-full object-cover" onerror="this.src='/images/taman-peranginan.jpg'">
                                    </div>
                                    <div class="min-w-0">
                                        <div class="font-bold text-white text-[13px] flex items-center gap-1.5">
                                            <span>{{ $spot->name }}</span>
                                            @if($spot->is_popular)
                                                <span class="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-400/30">Populer</span>
                                            @endif
                                        </div>
                                        <p class="text-[11px] text-white/50 truncate max-w-xs mt-0.5">{{ $spot->address ?: 'Bogor, Jawa Barat' }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3.5">
                                @php
                                    $badgeStyle = match($spot->category) {
                                        'Alam & Curug' => 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
                                        'Kuliner' => 'bg-amber-500/20 text-amber-300 border-amber-400/30',
                                        default => 'bg-pink-500/20 text-pink-300 border-pink-400/30'
                                    };
                                @endphp
                                <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border {{ $badgeStyle }}">
                                    {{ $spot->category }}
                                </span>
                            </td>
                            <td class="px-4 py-3.5 font-mono text-[11px] text-emerald-300/90">
                                {{ number_format($spot->latitude, 5) }}, {{ number_format($spot->longitude, 5) }}
                            </td>
                            <td class="px-4 py-3.5">
                                <div class="font-medium text-white">{{ $spot->ticket_price ?: 'Gratis' }}</div>
                                <div class="text-[10px] text-white/40 mt-0.5">{{ $spot->operational_hours ?: '08.00-17.00' }}</div>
                            </td>
                            <td class="px-4 py-3.5">
                                <span class="flex items-center gap-1 font-bold text-amber-300">
                                    ★ {{ number_format($spot->rating, 1) }}
                                </span>
                            </td>
                            <td class="px-5 py-3.5 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <a href="{{ route('admin.spots.edit', $spot->id) }}" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95" title="Edit Data">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </a>
                                    <form action="{{ route('admin.spots.destroy', $spot->id) }}" method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus destinasi wisata \'{{ $spot->name }}\'?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 hover:text-white transition active:scale-95 cursor-pointer" title="Hapus">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-5 py-12 text-center text-white/50">
                                <span class="text-3xl block mb-2">🔍</span>
                                <p class="text-sm font-semibold">Tidak ada tempat wisata yang ditemukan.</p>
                                <p class="text-xs text-white/40 mt-1">Coba gunakan kata kunci pencarian atau kategori lain.</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        @if($spots->hasPages())
            <div class="p-4 border-t border-white/10 bg-forest-800/40 flex justify-between items-center text-xs">
                {{ $spots->links() }}
            </div>
        @endif
    </div>

</div>
@endsection

