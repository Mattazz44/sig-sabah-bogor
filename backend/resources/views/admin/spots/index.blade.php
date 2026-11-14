@extends('layouts.admin')

@section('title', 'Daftar Lokasi Wisata')

@section('content')
<section class="space-y-6">
    <!-- Toolbar Pencarian & Filter Kategori Liquid Glass -->
    <div class="liquid-glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <form action="{{ route('admin.spots.index') }}" method="GET" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input type="hidden" name="category" value="{{ $category }}">

            <div class="relative flex-1">
                <input
                    type="search"
                    name="q"
                    value="{{ $search }}"
                    placeholder="Cari nama wisata, kategori, atau alamat..."
                    class="liquid-glass-input min-h-[44px] w-full rounded-xl pl-10 pr-9 text-[13.5px] placeholder:text-[#98A698]"
                />
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#C8D3C8]"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>

                @if($search)
                    <a href="{{ route('admin.spots.index', ['category' => $category]) }}"
                       aria-label="Hapus kata kunci pencarian"
                       class="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#C8D3C8] hover:bg-white/10 hover:text-[#EBF0EB]">
                        ✕
                    </a>
                @endif
            </div>

            <div class="flex items-center gap-2">
                <button
                    type="submit"
                    class="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/18 bg-white/[0.08] px-4 text-[13px] font-medium text-[#EBF0EB] transition-colors hover:bg-white/[0.14] active:scale-[0.98] cursor-pointer"
                >
                    Cari
                </button>

                <a
                    href="{{ route('admin.spots.create') }}"
                    class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#EBF0EB] px-4 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors hover:bg-[#DCE4DC] active:scale-[0.98]"
                >
                    <span>+ Tambah Baru</span>
                </a>
            </div>
        </form>

        <!-- Kategori Filter Pills -->
        <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
            @php
                $pillCategories = [
                    'Semua' => 'Semua',
                    'Alam & Curug' => 'Alam & Curug',
                    'Kuliner' => 'Kuliner',
                    'Edukasi & Budaya' => 'Edukasi & Budaya',
                ];
            @endphp
            @foreach($pillCategories as $catValue => $catLabel)
                @php
                    $isActive = ($category === $catValue) || (empty($category) && $catValue === 'Semua');
                    $count = $categoriesCount[$catValue] ?? 0;
                @endphp
                <a
                    href="{{ route('admin.spots.index', ['category' => $catValue, 'q' => request('q')]) }}"
                    class="min-h-[36px] inline-flex items-center rounded-xl border px-3.5 text-[12px] font-semibold tabular-nums transition-colors {{ $isActive ? 'border-[#EBF0EB] bg-[#EBF0EB] text-[#161E16] shadow-sm' : 'border-white/15 bg-white/[0.05] text-[#C8D3C8] hover:border-white/30 hover:text-[#EBF0EB]' }}"
                >
                    {{ $catLabel }} ({{ $count }})
                </a>
            @endforeach
        </div>
    </div>

    <!-- Konten Grid Tempat Wisata -->
    @if($spots->isEmpty())
        <div class="liquid-glass-card rounded-2xl flex flex-col items-center justify-center py-14 px-6 text-center">
            <svg class="h-10 w-10 text-[#C8D3C8]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p class="mt-3.5 text-[15px] font-semibold text-[#EBF0EB]">
                {{ $totalSpots === 0 ? 'Belum ada tempat wisata di database' : 'Tidak ada tempat wisata yang sesuai' }}
            </p>
            <p class="mt-1 max-w-sm text-[12.5px] text-[#C8D3C8]">
                {{ $totalSpots === 0 ? 'Mulai menambahkan destinasi pertama dengan menekan tombol di bawah.' : 'Coba gunakan kata kunci pencarian yang lain atau pilih kategori Semua.' }}
            </p>
            <div class="mt-6">
                @if($totalSpots === 0)
                    <a href="{{ route('admin.spots.create') }}"
                       class="inline-flex min-h-[44px] items-center rounded-xl bg-[#EBF0EB] px-6 text-[13px] font-semibold text-[#161E16] hover:bg-[#DCE4DC] transition-colors">
                        + Tambah Lokasi Pertama
                    </a>
                @else
                    <a href="{{ route('admin.spots.index') }}"
                       class="inline-flex min-h-[44px] items-center rounded-xl bg-[#EBF0EB] px-6 text-[13px] font-semibold text-[#161E16] hover:bg-[#DCE4DC] transition-colors">
                        Reset Filter
                    </a>
                @endif
            </div>
        </div>
    @else
        <div class="flex items-center justify-between">
            <p class="text-[12.5px] font-medium text-[#C8D3C8] tabular-nums">
                Menampilkan {{ $spots->firstItem() }}–{{ $spots->lastItem() }} dari {{ $spots->total() }} destinasi wisata
            </p>
            <a href="{{ route('admin.spots.create') }}" class="text-[12px] font-semibold text-[#E2D7B5] hover:text-[#EBF0EB] transition-colors">
                + Tambah Lokasi
            </a>
        </div>

        <!-- Grid Kartu Wisata Responsif 3 Kolom -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            @foreach($spots as $spot)
                <article class="liquid-glass-card rounded-2xl overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-white/25">
                    <div>
                        <!-- Thumbnail Header -->
                        <div class="relative aspect-[16/10] w-full overflow-hidden bg-[#1B261B]">
                            <img
                                src="{{ $spot->image ?: '/images/spots/taman-peranginan.jpg' }}"
                                alt="{{ $spot->name }}"
                                onerror="this.onerror=null;this.src='/images/spots/taman-peranginan.jpg';"
                                class="h-full w-full object-cover"
                                loading="lazy"
                            />
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>

                            <span class="absolute top-2.5 left-2.5 rounded-lg border border-white/20 bg-[#141C14]/80 px-2.5 py-1 text-[11px] font-semibold text-[#EBF0EB] backdrop-blur-md">
                                {{ $spot->category }}
                            </span>

                            @if($spot->is_popular)
                                <span class="absolute top-2.5 right-2.5 rounded-lg border border-[#E2D7B5]/40 bg-[#141C14]/80 px-2 py-0.5 text-[10.5px] font-semibold text-[#E2D7B5] backdrop-blur-md">
                                    Populer
                                </span>
                            @endif
                        </div>

                        <!-- Info Body -->
                        <div class="p-4 space-y-2">
                            <div class="flex items-start justify-between gap-2">
                                <h2 class="line-clamp-1 text-[14.5px] font-bold tracking-tight text-[#EBF0EB]" title="{{ $spot->name }}">
                                    {{ $spot->name }}
                                </h2>
                                <span class="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold tabular-nums text-[#EBF0EB]">
                                    <svg class="h-3.5 w-3.5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {{ number_format((float)$spot->rating, 1) }}
                                </span>
                            </div>

                            <p class="text-[12.5px] font-medium text-[#E2D7B5]">
                                {{ $spot->ticket_price ?: 'Gratis' }}
                            </p>

                            <p class="line-clamp-2 min-h-[34px] text-[12px] leading-relaxed text-[#C8D3C8]">
                                {{ $spot->address ?: 'Alamat belum tercatat' }}
                            </p>

                            <p class="font-mono text-[11px] tabular-nums text-[#9AA89A]">
                                {{ number_format((float)$spot->latitude, 5) }}, {{ number_format((float)$spot->longitude, 5) }}
                            </p>
                        </div>
                    </div>

                    <!-- Tombol Aksi -->
                    <div class="grid grid-cols-2 gap-2.5 border-t border-white/10 p-4 pt-3">
                        <a
                            href="{{ route('admin.spots.edit', $spot->id) }}"
                            class="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/18 bg-white/[0.07] px-3 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors hover:bg-white/[0.15] active:scale-[0.98]"
                        >
                            Edit
                        </a>

                        <form
                            action="{{ route('admin.spots.destroy', $spot->id) }}"
                            method="POST"
                            onsubmit="return confirm('Hapus tempat wisata \'{{ addslashes($spot->name) }}\' dari database?');"
                        >
                            @csrf
                            @method('DELETE')
                            <button
                                type="submit"
                                class="w-full min-h-[42px] rounded-xl border border-rose-300/25 bg-[#3B1D24]/80 px-3 text-[12.5px] font-semibold text-rose-100 transition-colors hover:bg-[#49242D] active:scale-[0.98] cursor-pointer"
                            >
                                Hapus
                            </button>
                        </form>
                    </div>
                </article>
            @endforeach
        </div>

        <!-- Pagination Liquid Glass -->
        @if($spots->hasPages())
            <div class="liquid-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#C8D3C8]">
                <div class="flex items-center gap-2">
                    @if($spots->onFirstPage())
                        <span class="inline-flex min-h-[38px] items-center px-4 rounded-xl border border-white/10 bg-white/[0.03] text-white/35">
                            ← Sebelumnya
                        </span>
                    @else
                        <a href="{{ $spots->previousPageUrl() }}" class="inline-flex min-h-[38px] items-center px-4 rounded-xl border border-white/18 bg-white/[0.08] text-[#EBF0EB] hover:bg-white/[0.15] transition-colors">
                            ← Sebelumnya
                        </a>
                    @endif

                    @if($spots->hasMorePages())
                        <a href="{{ $spots->nextPageUrl() }}" class="inline-flex min-h-[38px] items-center px-4 rounded-xl border border-white/18 bg-white/[0.08] text-[#EBF0EB] hover:bg-white/[0.15] transition-colors">
                            Berikutnya →
                        </a>
                    @else
                        <span class="inline-flex min-h-[38px] items-center px-4 rounded-xl border border-white/10 bg-white/[0.03] text-white/35">
                            Berikutnya →
                        </span>
                    @endif
                </div>

                <span class="tabular-nums font-medium text-[#EBF0EB]">
                    Halaman {{ $spots->currentPage() }} dari {{ $spots->lastPage() }}
                </span>
            </div>
        @endif
    @endif
</section>
@endsection
