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
@endphp

<section class="space-y-6">
    <!-- Baris Statistik Cepat (Bento Summary Cards) -->
    <div id="admin-bento-stats" class="grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-4" aria-label="Ringkasan statistik destinasi">
        <!-- 1. Total Destinasi -->
        <div class="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(244,239,230,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#76937A]/45 hover:bg-white/[0.055]">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11.5px] font-medium text-[#F5F2EB]/65">Total Destinasi</span>
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#76937A]/30 bg-[#76937A]/15 text-[#76937A]">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </span>
            </div>
            <p class="mt-2.5 flex items-baseline gap-1.5">
                <span class="font-mono text-[22px] sm:text-[24px] font-bold tracking-tight tabular-nums text-[#F5F2EB]">{{ $summaryStats['total'] }}</span>
                <span class="text-[12px] font-medium text-[#F5F2EB]/60">Lokasi</span>
            </p>
        </div>

        <!-- 2. Wisata Populer -->
        <div class="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(244,239,230,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C5A868]/45 hover:bg-white/[0.055]">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11.5px] font-medium text-[#F5F2EB]/65">Wisata Populer</span>
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#C5A868]/35 bg-[#C5A868]/15 text-[#C5A868]">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                    </svg>
                </span>
            </div>
            <p class="mt-2.5 flex items-baseline gap-1.5">
                <span class="font-mono text-[22px] sm:text-[24px] font-bold tracking-tight tabular-nums text-[#F5F2EB]">{{ $summaryStats['popular'] }}</span>
                <span class="text-[12px] font-medium text-[#C5A868]/90">Spot</span>
            </p>
        </div>

        <!-- 3. Wisata Gratis -->
        <div class="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(244,239,230,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/[0.055]">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11.5px] font-medium text-[#F5F2EB]/65">Wisata Gratis</span>
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/12 text-emerald-300">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                        <path d="M13 5v2"></path>
                        <path d="M13 17v2"></path>
                        <path d="M13 11v2"></path>
                    </svg>
                </span>
            </div>
            <p class="mt-2.5 flex items-baseline gap-1.5">
                <span class="font-mono text-[22px] sm:text-[24px] font-bold tracking-tight tabular-nums text-[#F5F2EB]">{{ $summaryStats['free'] }}</span>
                <span class="text-[12px] font-medium text-emerald-300/85">Bebas Tiket</span>
            </p>
        </div>

        <!-- 4. Rating Rata-Rata -->
        <div class="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(244,239,230,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C5A868]/45 hover:bg-white/[0.055]">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11.5px] font-medium text-[#F5F2EB]/65">Rating Rata-Rata</span>
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#C5A868]/35 bg-[#C5A868]/15 text-[#C5A868]">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </span>
            </div>
            <p class="mt-2.5 flex items-baseline gap-1.5">
                <span class="font-mono text-[22px] sm:text-[24px] font-bold tracking-tight tabular-nums text-[#F5F2EB]">{{ number_format((float)$summaryStats['avgRating'], 1) }}</span>
                <span class="text-[15px] font-semibold text-[#C5A868]" aria-hidden="true">★</span>
                <span class="text-[11.5px] font-medium text-[#F5F2EB]/55">/ 5.0</span>
            </p>
        </div>
    </div>

    <!-- Toolbar Pencarian & Filter Kategori -->
    <div class="apple-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <form id="admin-filter-form" data-applied-category="{{ $category }}" action="{{ route('admin.spots.index') }}" method="GET" class="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <input type="hidden" id="admin-filter-category-input" name="category" value="{{ $category }}">

            <div class="relative w-full min-w-0 sm:w-auto sm:flex-1">
                <label for="admin-search-q" class="sr-only">Cari destinasi wisata</label>
                <input
                    id="admin-search-q"
                    type="search"
                    name="q"
                    value="{{ $search }}"
                    data-applied-query="{{ $search }}"
                    placeholder="Cari nama wisata, kategori, atau alamat..."
                    class="liquid-glass-input h-11 w-full rounded-xl pl-10 pr-11 text-[13.5px] placeholder:text-[#F5F2EB]/45"
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
                    class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#F5F2EB]/60"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>

                @if($search)
                    <a href="{{ route('admin.spots.index', ['category' => $category]) }}"
                       aria-label="Hapus kata kunci pencarian"
                       class="absolute top-1/2 right-0.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-[#F5F2EB]/65 transition-colors hover:bg-white/[0.08] hover:text-[#F5F2EB]">
                        <span aria-hidden="true">✕</span>
                    </a>
                @endif
            </div>

            <div class="flex w-full items-center gap-3 sm:w-auto sm:shrink-0">
                <button
                    type="submit"
                    id="admin-search-submit"
                    class="apple-retro-bevel flex-auto sm:flex-none shrink-0 inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl border border-[rgba(244,239,230,0.16)] bg-white/[0.06] px-5 text-[13px] font-medium text-[#F5F2EB] transition-colors hover:bg-white/[0.12] active:scale-[0.98]"
                >
                    Cari
                </button>

                <a
                    href="{{ route('admin.spots.create') }}"
                    class="apple-retro-cta flex-auto sm:flex-none shrink-0 inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-5 text-[13px] font-semibold"
                >
                    <span>+ Tambah Baru</span>
                </a>
            </div>
        </form>

        <!-- Kategori Filter Pills -->
        <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-[rgba(244,239,230,0.12)]">
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
                    data-admin-category-pill
                    data-category-value="{{ $catValue }}"
                    class="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3.5 text-[12.5px] font-semibold transition-colors {{ $isActive ? 'apple-retro-cta border-[#F2ECE1]' : 'apple-retro-bevel border-[rgba(244,239,230,0.14)] bg-white/[0.05] text-[#F5F2EB]/70 hover:border-[rgba(244,239,230,0.28)] hover:bg-white/[0.09] hover:text-[#F5F2EB]' }}"
                >
                    <span>{{ $catLabel }}</span>
                    <span class="font-mono text-[11.5px] tabular-nums {{ $isActive ? 'text-[#141A14]/75' : 'text-[#DFAA63]' }}">({{ $count }})</span>
                </a>
            @endforeach
        </div>
    </div>

    <!-- Konten Grid Tempat Wisata -->
    @if($spots->isEmpty())
        <div class="apple-glass-card rounded-3xl flex flex-col items-center justify-center py-14 px-6 text-center">
            <svg class="h-10 w-10 text-[#DFAA63]/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p class="mt-3.5 text-[15px] font-semibold text-[#F5F2EB]">
                {{ $totalSpots === 0 ? 'Belum ada tempat wisata di database' : 'Tidak ada tempat wisata yang sesuai' }}
            </p>
            <p class="mt-1 max-w-sm text-[12.5px] text-[#F5F2EB]/65">
                {{ $totalSpots === 0 ? 'Mulai menambahkan destinasi pertama dengan menekan tombol di bawah.' : 'Coba gunakan kata kunci pencarian yang lain atau pilih kategori Semua.' }}
            </p>
            <div class="mt-6">
                @if($totalSpots === 0)
                    <a href="{{ route('admin.spots.create') }}"
                       class="apple-retro-cta inline-flex min-h-[44px] items-center rounded-xl px-6 text-[13px] font-semibold">
                        + Tambah Lokasi Pertama
                    </a>
                @else
                    <a href="{{ route('admin.spots.index') }}"
                       class="apple-retro-cta inline-flex min-h-[44px] items-center rounded-xl px-6 text-[13px] font-semibold">
                        Reset Filter
                    </a>
                @endif
            </div>
        </div>
    @else
        <div class="flex items-center justify-between px-0.5">
            <p class="text-[12.5px] font-medium text-[#F5F2EB]/65">
                Menampilkan <span class="font-mono tabular-nums font-semibold text-[#F5F2EB]">{{ $spots->firstItem() }}–{{ $spots->lastItem() }}</span> dari <span class="font-mono tabular-nums font-semibold text-[#DFAA63]">{{ $spots->total() }}</span> destinasi wisata
            </p>
        </div>

        <!-- Grid Kartu Wisata Responsif: 1 kolom mobile, 2 kolom tablet, 3 kolom desktop -->
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            @foreach($spots as $spot)
                <article class="group apple-glass-card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(244,239,230,0.14)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#76937A]/50 hover:shadow-[0_22px_40px_-14px_rgba(0,0,0,0.65),0_0_0_1px_rgba(118,147,122,0.2)]">
                    <div>
                        <!-- Thumbnail Header Seragam 16:10 + Zoom Halus -->
                        <div class="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#141A14]">
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
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/85"></div>

                            <span class="apple-retro-bevel absolute top-2.5 left-2.5 rounded-lg border border-[rgba(244,239,230,0.18)] bg-[#111711]/85 px-2.5 py-1 text-[11px] font-semibold text-[#F5F2EB] backdrop-blur-sm">
                                {{ $spot->category }}
                            </span>

                            @if($spot->is_popular)
                                <span class="apple-retro-bevel absolute top-2.5 right-2.5 rounded-lg border border-[#C5A868]/45 bg-[#111711]/90 px-2.5 py-1 text-[10.5px] font-semibold text-[#C5A868] backdrop-blur-sm">
                                    Populer
                                </span>
                            @endif
                        </div>

                        <!-- Info Body -->
                        <div class="p-4 sm:p-5 space-y-2">
                            <div class="flex items-start justify-between gap-2.5">
                                <h2 class="line-clamp-1 text-[15px] font-bold tracking-tight text-[#F5F2EB] transition-colors duration-200 group-hover:text-[#F2ECE1]" title="{{ $spot->name }}">
                                    {{ $spot->name }}
                                </h2>
                                <span class="inline-flex shrink-0 items-center gap-1 font-mono text-[12.5px] font-semibold tabular-nums text-[#C5A868]">
                                    <svg class="h-3.5 w-3.5 text-[#C5A868]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {{ number_format((float)$spot->rating, 1) }}
                                </span>
                            </div>

                            <p class="font-mono text-[12.5px] font-medium tabular-nums text-[#F5F2EB]/90">
                                {{ $spot->ticket_price ?: 'Gratis' }}
                            </p>

                            <p class="line-clamp-2 min-h-[36px] text-[12px] leading-relaxed text-[#F5F2EB]/65">
                                {{ $spot->address ?: 'Alamat belum tercatat' }}
                            </p>

                            <p class="font-mono text-[11.5px] tabular-nums text-[#F5F2EB]/55">
                                {{ number_format((float)$spot->latitude, 5) }}, {{ number_format((float)$spot->longitude, 5) }}
                            </p>
                        </div>
                    </div>

                    <!-- Tombol Aksi Bawah Kartu (Selalu aksesibel di perangkat sentuh & keyboard) -->
                    <div class="grid grid-cols-2 gap-2.5 border-t border-white/[0.09] bg-black/[0.12] px-4 py-3 sm:px-5">
                        <a
                            href="{{ route('admin.spots.edit', $spot->id) }}"
                            class="apple-retro-bevel inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-[rgba(244,239,230,0.16)] bg-white/[0.05] px-3 text-[12.5px] font-semibold text-[#F5F2EB] transition-all duration-150 hover:border-[#76937A]/50 hover:bg-white/[0.12] active:scale-[0.98]"
                        >
                            <svg class="h-3.5 w-3.5 text-[#76937A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
                            <button
                                type="submit"
                                class="apple-retro-bevel inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-rose-300/25 bg-[#3A1B22]/80 px-3 text-[12.5px] font-semibold text-rose-100 transition-all duration-150 hover:bg-[#4F232D] active:scale-[0.98]"
                            >
                                <svg class="h-3.5 w-3.5 text-rose-200/85" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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

        <!-- Pagination -->
        @if($spots->hasPages())
            <nav aria-label="Navigasi halaman wisata" class="apple-glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-[#F5F2EB]/70">
                <div class="flex items-center gap-2">
                    @if($spots->onFirstPage())
                        <span class="inline-flex min-h-[44px] items-center px-4 rounded-xl border border-[rgba(244,239,230,0.08)] bg-white/[0.03] text-[#F5F2EB]/35">
                            ← Sebelumnya
                        </span>
                    @else
                        <a href="{{ $spots->previousPageUrl() }}" class="apple-retro-bevel inline-flex min-h-[44px] items-center px-4 rounded-xl border border-[rgba(244,239,230,0.16)] bg-white/[0.06] text-[#F5F2EB] hover:bg-white/[0.12] transition-colors">
                            ← Sebelumnya
                        </a>
                    @endif

                    @if($spots->hasMorePages())
                        <a href="{{ $spots->nextPageUrl() }}" class="apple-retro-bevel inline-flex min-h-[44px] items-center px-4 rounded-xl border border-[rgba(244,239,230,0.16)] bg-white/[0.06] text-[#F5F2EB] hover:bg-white/[0.12] transition-colors">
                            Berikutnya →
                        </a>
                    @else
                        <span class="inline-flex min-h-[44px] items-center px-4 rounded-xl border border-[rgba(244,239,230,0.08)] bg-white/[0.03] text-[#F5F2EB]/35">
                            Berikutnya →
                        </span>
                    @endif
                </div>

                <span class="font-medium text-[#F5F2EB]/80">
                    Halaman <span class="font-mono tabular-nums text-[#F5F2EB]">{{ $spots->currentPage() }}</span> dari <span class="font-mono tabular-nums text-[#DFAA63]">{{ $spots->lastPage() }}</span>
                </span>
            </nav>
        @endif
    @endif
</section>
@endsection
