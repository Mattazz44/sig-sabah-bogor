@extends('layouts.admin')

@section('title', 'Daftar Lokasi')

@section('content')
<section class="mt-6 space-y-4">
    <!-- Filter & Search (Ringkas sesuai tema AdminPage) -->
    <form action="{{ route('admin.spots.index') }}" method="GET" class="space-y-3">
        <div class="relative">
            <input type="hidden" name="category" value="{{ $category }}">
            <input type="text" name="q" value="{{ $search }}"
                   placeholder="Cari nama atau alamat wisata..."
                   class="w-full rounded-lg bg-[#384931] border border-white/10 pl-9 pr-8 py-2.5 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition">
            <svg class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            @if($search)
                <a href="{{ route('admin.spots.index', ['category' => $category]) }}"
                   class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/45 hover:text-white">✕</a>
            @endif
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            @php
                $pillCategories = [
                    'Semua' => 'Semua',
                    'Alam & Curug' => 'Alam',
                    'Kuliner' => 'Kuliner',
                    'Edukasi & Budaya' => 'Edukasi & Budaya',
                ];
            @endphp
            @foreach($pillCategories as $catValue => $catLabel)
                <a href="{{ route('admin.spots.index', ['category' => $catValue, 'q' => request('q')]) }}"
                   class="rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition {{ $category === $catValue ? 'bg-[#8c785c] text-white shadow-sm' : 'bg-[#384931] border border-white/10 text-white/65 hover:text-white' }}">
                    {{ $catLabel }} ({{ $categoriesCount[$catValue] ?? 0 }})
                </a>
            @endforeach
        </div>
    </form>

    @if($spots->isEmpty())
        <div class="flex flex-col items-center justify-center py-12 text-center">
            <p class="text-[12px] text-white/55">Belum ada lokasi</p>
            <a href="{{ route('admin.spots.create') }}"
               class="mt-5 rounded-full bg-[#8c785c] hover:bg-[#9b8669] px-6 py-2 text-[12px] font-semibold text-white transition">
                Tambah lokasi
            </a>
        </div>
    @else
        <div class="flex items-center justify-between">
            <p class="text-[12px] text-white/60">
                {{ $spots->total() }} lokasi tersimpan
            </p>
            <a href="{{ route('admin.spots.create') }}"
               class="text-[11px] font-medium text-white/75 underline underline-offset-4 hover:text-white transition">
                + Tambah baru
            </a>
        </div>

        <!-- Daftar Kartu Lokasi (Sesuai AdminPage.jsx) -->
        <div class="space-y-3">
            @foreach($spots as $spot)
                <article class="flex items-center justify-between gap-3 rounded-xl bg-[#384931] border border-white/10 p-3.5">
                    <div class="flex items-center gap-3 min-w-0">
                        <img
                            src="{{ $spot->image ?: '/images/taman-peranginan.jpg' }}"
                            alt="{{ $spot->name }}"
                            onerror="this.src='/images/taman-peranginan.jpg'"
                            class="h-12 w-12 shrink-0 rounded-lg object-cover bg-black/20"
                        />
                        <div class="min-w-0">
                            <h3 class="truncate text-[13px] font-semibold text-white">
                                {{ $spot->name }}
                            </h3>
                            <p class="truncate text-[11px] text-white/60">
                                {{ $spot->category }} · {{ $spot->ticket_price ?: 'Gratis' }}
                            </p>
                            <p class="text-[10px] text-white/45 font-mono mt-0.5">
                                {{ number_format($spot->latitude, 4) }}, {{ number_format($spot->longitude, 4) }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                        <a href="{{ route('admin.spots.edit', $spot->id) }}"
                           class="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-[11px] font-medium text-white/85 transition">
                            Edit
                        </a>
                        <form action="{{ route('admin.spots.destroy', $spot->id) }}" method="POST"
                              onsubmit="return confirm('Hapus lokasi \'{{ addslashes($spot->name) }}\'?');">
                            @csrf
                            @method('DELETE')
                            <button type="submit"
                                    class="rounded-lg bg-rose-500/15 hover:bg-rose-500/30 px-2.5 py-1.5 text-[11px] font-medium text-rose-200 transition cursor-pointer">
                                Hapus
                            </button>
                        </form>
                    </div>
                </article>
            @endforeach
        </div>

        @if($spots->hasPages())
            <div class="pt-3 flex items-center justify-between text-[11px] text-white/65">
                @if($spots->onFirstPage())
                    <span class="px-3 py-1.5 rounded-lg bg-[#384931]/50 text-white/30">← Sebelumnya</span>
                @else
                    <a href="{{ $spots->previousPageUrl() }}" class="px-3 py-1.5 rounded-lg bg-[#384931] border border-white/10 hover:bg-white/10 text-white transition">← Sebelumnya</a>
                @endif

                <span>Hal {{ $spots->currentPage() }} / {{ $spots->lastPage() }}</span>

                @if($spots->hasMorePages())
                    <a href="{{ $spots->nextPageUrl() }}" class="px-3 py-1.5 rounded-lg bg-[#384931] border border-white/10 hover:bg-white/10 text-white transition">Berikutnya →</a>
                @else
                    <span class="px-3 py-1.5 rounded-lg bg-[#384931]/50 text-white/30">Berikutnya →</span>
                @endif
            </div>
        @endif
    @endif
</section>
@endsection
