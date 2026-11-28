@extends('layouts.admin')

@section('title', 'Daftar Lokasi Wisata')

@section('content')
@php
    $summaryStats = $stats ?? [
        'total' => $totalSpots ?? 0,
        'popular' => 0,
        'free' => 0,
        'avgRating' => 0,
    ];
    $pillCategories = [
        'Semua' => 'Semua',
        'Alam & Curug' => 'Alam & Curug',
        'Kuliner' => 'Kuliner',
        'Edukasi & Budaya' => 'Edukasi & Budaya',
    ];
    $currentListParams = array_filter([
        'category' => ($category && $category !== 'Semua') ? $category : null,
        'q' => trim((string) $search) !== '' ? trim((string) $search) : null,
        'page' => $spots->currentPage() > 1 ? $spots->currentPage() : null,
    ], fn ($value) => $value !== null && $value !== '');
@endphp

<section class="space-y-7">
    <!-- 1. Compact Metric Strip: 1 Baris Statistik Ringkas (Tanpa Ikon Kotak Berlebih) -->
    <div
        id="admin-metric-strip"
        aria-label="Ringkasan statistik destinasi"
        class="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#161D19] md:grid-cols-4"
    >
        <div class="border-b border-r border-[#F2ECE1]/[0.07] px-5 py-4 md:border-b-0">
            <span class="block text-[11.5px] font-medium tracking-wide text-[#F5F2EB]/50">Total Destinasi</span>
            <p class="mt-1.5 flex items-baseline gap-1.5">
                <span class="text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#F5F2EB]">{{ $summaryStats['total'] }}</span>
                <span class="text-[12px] font-medium text-[#F5F2EB]/50">lokasi</span>
            </p>
        </div>

        <div class="border-b border-[#F2ECE1]/[0.07] px-5 py-4 md:border-b-0 md:border-r">
            <span class="block text-[11.5px] font-medium tracking-wide text-[#F5F2EB]/50">Wisata Populer</span>
            <p class="mt-1.5 flex items-baseline gap-1.5">
                <span class="text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#F5F2EB]">{{ $summaryStats['popular'] }}</span>
                <span class="text-[12px] font-medium text-[#C5A868]">unggulan</span>
            </p>
        </div>

        <div class="border-r border-[#F2ECE1]/[0.07] px-5 py-4">
            <span class="block text-[11.5px] font-medium tracking-wide text-[#F5F2EB]/50">Wisata Gratis</span>
            <p class="mt-1.5 flex items-baseline gap-1.5">
                <span class="text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#F5F2EB]">{{ $summaryStats['free'] }}</span>
                <span class="text-[12px] font-medium text-[#8FB596]">bebas tiket</span>
            </p>
        </div>

        <div class="px-5 py-4">
            <span class="block text-[11.5px] font-medium tracking-wide text-[#F5F2EB]/50">Rating Rata-Rata</span>
            <p class="mt-1.5 flex items-baseline gap-1.5">
                <span class="text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#F5F2EB]">{{ number_format((float)$summaryStats['avgRating'], 1) }}</span>
                <span class="text-[14px] font-semibold text-[#C5A868]" aria-hidden="true">★</span>
                <span class="text-[12px] font-medium text-[#F5F2EB]/45">/ 5.0</span>
            </p>
        </div>
    </div>

    <!-- 2. Toolbar Terpadu: Filter Kategori Minimalis + Pencarian + Aksi Primer Tunggal -->
    <div id="admin-control-bar" class="space-y-4">
        <div class="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <!-- Form Pencarian Ringkas -->
            <form
                id="admin-filter-form"
                data-applied-category="{{ $category }}"
                action="{{ route('admin.spots.index') }}"
                method="GET"
                class="flex w-full items-center gap-2 lg:max-w-md"
            >
                <input type="hidden" id="admin-filter-category-input" name="category" value="{{ $category }}">

                <div class="relative min-w-0 flex-1">
                    <label for="admin-search-q" class="sr-only">Cari destinasi wisata</label>
                    <input
                        id="admin-search-q"
                        type="search"
                        name="q"
                        value="{{ $search }}"
                        data-applied-query="{{ $search }}"
                        placeholder="Cari nama wisata, alamat, atau deskripsi..."
                        class="h-11 w-full rounded-xl border border-[#F2ECE1]/10 bg-[#161D19] pl-10 pr-10 text-[13.5px] text-[#F5F2EB] placeholder:text-[#F5F2EB]/40 transition-colors focus:border-[#8FB596]/55 focus:bg-[#19211C] focus:outline-none"
                    />
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#F5F2EB]/45"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>

                    @if($search)
                        <a
                            href="{{ route('admin.spots.index', ['category' => $category]) }}"
                            aria-label="Hapus kata kunci pencarian"
                            class="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#F5F2EB]/55 transition-colors hover:bg-white/[0.06] hover:text-[#F5F2EB]"
                        >
                            <span aria-hidden="true">✕</span>
                        </a>
                    @endif
                </div>

                <button
                    type="submit"
                    id="admin-search-submit"
                    class="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[#F2ECE1]/10 bg-[#161D19] px-4 text-[13px] font-semibold text-[#F5F2EB]/85 transition-colors hover:border-[#F2ECE1]/20 hover:bg-[#1D2621] hover:text-[#F5F2EB] active:scale-[0.98]"
                >
                    Cari
                </button>
            </form>

            <!-- Satu-satunya Tombol Aksi Primer Berwarna Aksen Cerah -->
            <a
                href="{{ route('admin.spots.create') }}"
                id="btn-add-destination"
                class="apple-retro-cta inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-[13.5px] font-bold tracking-[-0.01em] sm:w-auto"
            >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Tambah Destinasi</span>
            </a>
        </div>

        <!-- Baris Tab Kategori Minimalis (Garis Bawah Halus, Tanpa Kotak Putih Mencolok) -->
        <div class="flex flex-col gap-2.5 border-b border-[#F2ECE1]/[0.08] sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Filter kategori wisata" class="-mb-px flex flex-wrap items-center gap-x-1 gap-y-0.5 sm:flex-nowrap sm:gap-x-2">
                @foreach($pillCategories as $catValue => $catLabel)
                    @php
                        $isActive = ($category === $catValue) || (empty($category) && $catValue === 'Semua');
                        $count = $categoriesCount[$catValue] ?? 0;
                    @endphp
                    <a
                        href="{{ route('admin.spots.index', ['category' => $catValue, 'q' => request('q')]) }}"
                        data-admin-category-pill
                        data-category-value="{{ $catValue }}"
                        aria-current="{{ $isActive ? 'page' : 'false' }}"
                        class="relative inline-flex min-h-[42px] shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-[13px] transition-colors sm:min-h-[44px] sm:px-3 sm:py-2.5 {{ $isActive ? 'border-[#8FB596] font-semibold text-[#F5F2EB]' : 'border-transparent font-medium text-[#F5F2EB]/55 hover:border-[#F2ECE1]/20 hover:text-[#F5F2EB]/90' }}"
                    >
                        <span>{{ $catLabel }}</span>
                        <span class="font-mono text-[11.5px] tabular-nums {{ $isActive ? 'text-[#8FB596]' : 'text-[#F5F2EB]/40' }}">{{ $count }}</span>
                    </a>
                @endforeach
            </nav>

            @if(!$spots->isEmpty())
                <p class="pb-2.5 text-[12px] font-medium text-[#F5F2EB]/50 sm:pb-0">
                    Menampilkan <span class="font-mono tabular-nums text-[#F5F2EB]/85">{{ $spots->firstItem() }}–{{ $spots->lastItem() }}</span> dari <span class="font-mono tabular-nums text-[#F5F2EB]/85">{{ $spots->total() }}</span>
                </p>
            @endif
        </div>
    </div>

    <!-- 3. Konten Grid Tempat Wisata -->
    @if($spots->isEmpty())
        <div class="flex flex-col items-center justify-center rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#161D19] py-16 px-6 text-center">
            <p class="text-[15px] font-semibold text-[#F5F2EB]">
                {{ $totalSpots === 0 ? 'Belum ada destinasi wisata di database' : 'Tidak ada destinasi yang sesuai filter' }}
            </p>
            <p class="mt-1.5 max-w-sm text-[13px] text-[#F5F2EB]/55">
                {{ $totalSpots === 0 ? 'Mulai tambahkan destinasi pertama Anda untuk mengisi peta wisata Kota Bogor.' : 'Ubah kata kunci pencarian atau pilih kategori Semua untuk melihat seluruh data.' }}
            </p>
            <div class="mt-6">
                @if($totalSpots === 0)
                    <a href="{{ route('admin.spots.create') }}"
                       class="apple-retro-cta inline-flex min-h-[44px] items-center rounded-xl px-5 text-[13px] font-bold">
                        + Tambah Destinasi Pertama
                    </a>
                @else
                    <a href="{{ route('admin.spots.index') }}"
                       class="inline-flex min-h-[44px] items-center rounded-xl border border-[#F2ECE1]/15 bg-[#1D2621] px-5 text-[13px] font-semibold text-[#F5F2EB] transition-colors hover:bg-[#243029]">
                        Reset Filter
                    </a>
                @endif
            </div>
        </div>
    @else
        <!-- Grid Kartu Wisata Responsif: 1 kolom mobile, 2 kolom tablet, 3 kolom desktop -->
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            @foreach($spots as $spot)
                <article class="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#F2ECE1]/[0.06] bg-[#161D19] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#8FB596]/35">
                    <div>
                        <!-- Thumbnail Seragam 16:10 Bersih Tanpa Overlay Tombol -->
                        <div class="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#111613]">
                            <img
                                src="{{ $spot->image ?: '/images/spots/taman-peranginan.jpg' }}"
                                alt="{{ $spot->name }}"
                                width="640"
                                height="400"
                                onerror="this.onerror=null;this.src='/images/spots/taman-peranginan.jpg';"
                                class="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                                loading="{{ $loop->index < 3 ? 'eager' : 'lazy' }}"
                                @if($loop->first) fetchpriority="high" @endif
                            />
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#161D19]/80 via-[#161D19]/15 to-transparent"></div>

                            <span class="absolute top-2.5 left-2.5 rounded-lg bg-[#0D110F]/80 px-2.5 py-1 text-[11px] font-medium text-[#F5F2EB]/95 backdrop-blur-sm">
                                {{ $spot->category }}
                            </span>

                            @if($spot->is_popular)
                                <span class="absolute top-2.5 right-2.5 rounded-lg bg-[#0D110F]/85 px-2.5 py-1 text-[10.5px] font-semibold text-[#C5A868] backdrop-blur-sm">
                                    Populer
                                </span>
                            @endif
                        </div>

                        <!-- Info Body -->
                        <div class="space-y-2 p-4 sm:p-5">
                            <div class="flex items-start justify-between gap-2.5">
                                <h2 class="line-clamp-1 text-[15px] font-semibold tracking-[-0.01em] text-[#F5F2EB]" title="{{ $spot->name }}">
                                    {{ $spot->name }}
                                </h2>
                                <span class="inline-flex shrink-0 items-center gap-1 font-mono text-[12px] font-semibold tabular-nums text-[#C5A868]">
                                    <svg class="h-3.5 w-3.5 text-[#C5A868]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {{ number_format((float)$spot->rating, 1) }}
                                </span>
                            </div>

                            <p class="text-[12.5px] font-medium tabular-nums text-[#8FB596]">
                                {{ $spot->ticket_price ?: 'Gratis' }}
                            </p>

                            <p class="line-clamp-2 min-h-[36px] text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                                {{ $spot->address ?: 'Alamat belum tercatat' }}
                            </p>

                            <p class="font-mono text-[11px] tabular-nums text-[#F5F2EB]/40">
                                {{ number_format((float)$spot->latitude, 5) }}, {{ number_format((float)$spot->longitude, 5) }}
                            </p>
                        </div>
                    </div>

                    <!-- Satu Pasang Tombol Aksi Edit & Hapus di Footer Kartu -->
                    <div class="grid grid-cols-2 gap-2.5 border-t border-[#F2ECE1]/[0.06] px-4 py-3 sm:px-5">
                        <a
                            href="{{ route('admin.spots.edit', array_merge(['id' => $spot->id], $currentListParams)) }}"
                            class="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#1D2621] px-3 text-[12.5px] font-semibold text-[#F5F2EB]/90 transition-colors hover:bg-[#25312A] hover:text-[#F5F2EB] active:scale-[0.98]"
                        >
                            <svg class="h-3.5 w-3.5 text-[#8FB596]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span>Edit</span>
                        </a>

                        <form
                            action="{{ route('admin.spots.destroy', $spot->id) }}"
                            method="POST"
                            data-admin-delete-form
                            data-spot-name="{{ $spot->name }}"
                        >
                            @csrf
                            @method('DELETE')
                            @if(!empty($currentListParams['category']))
                                <input type="hidden" name="return_category" value="{{ $currentListParams['category'] }}">
                            @endif
                            @if(!empty($currentListParams['q']))
                                <input type="hidden" name="return_q" value="{{ $currentListParams['q'] }}">
                            @endif
                            @if(!empty($currentListParams['page']))
                                <input type="hidden" name="return_page" value="{{ $currentListParams['page'] }}">
                            @endif
                            <button
                                type="submit"
                                class="inline-flex w-full min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 px-3 text-[12.5px] font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 hover:text-rose-100 active:scale-[0.98]"
                            >
                                <svg class="h-3.5 w-3.5 text-rose-300/85" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                <span>Hapus</span>
                            </button>
                        </form>
                    </div>
                </article>
            @endforeach
        </div>

        <!-- Pagination Ringkas -->
        @if($spots->hasPages())
            <nav aria-label="Navigasi halaman wisata" class="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#F2ECE1]/[0.06] bg-[#161D19] px-4 py-3 text-[12.5px] text-[#F5F2EB]/65 sm:flex-row">
                <div class="flex items-center gap-2">
                    @if($spots->onFirstPage())
                        <span class="inline-flex min-h-[40px] items-center rounded-xl bg-[#111613] px-3.5 text-[#F5F2EB]/30">
                            ← Sebelumnya
                        </span>
                    @else
                        <a href="{{ $spots->previousPageUrl() }}" class="inline-flex min-h-[40px] items-center rounded-xl bg-[#1D2621] px-3.5 font-medium text-[#F5F2EB]/90 transition-colors hover:bg-[#25312A] hover:text-[#F5F2EB]">
                            ← Sebelumnya
                        </a>
                    @endif

                    @if($spots->hasMorePages())
                        <a href="{{ $spots->nextPageUrl() }}" class="inline-flex min-h-[40px] items-center rounded-xl bg-[#1D2621] px-3.5 font-medium text-[#F5F2EB]/90 transition-colors hover:bg-[#25312A] hover:text-[#F5F2EB]">
                            Berikutnya →
                        </a>
                    @else
                        <span class="inline-flex min-h-[40px] items-center rounded-xl bg-[#111613] px-3.5 text-[#F5F2EB]/30">
                            Berikutnya →
                        </span>
                    @endif
                </div>

                <span class="font-medium text-[#F5F2EB]/65">
                    Halaman <span class="font-mono tabular-nums text-[#F5F2EB]">{{ $spots->currentPage() }}</span> dari <span class="font-mono tabular-nums text-[#8FB596]">{{ $spots->lastPage() }}</span>
                </span>
            </nav>
        @endif
    @endif
</section>
@endsection
