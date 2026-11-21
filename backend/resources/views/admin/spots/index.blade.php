@extends('layouts.admin')

@section('title', 'Daftar Lokasi Wisata')

@section('content')
<section class="space-y-6">
    <!-- Toolbar Pencarian & Filter Kategori -->
    <div class="apple-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <form action="{{ route('admin.spots.index') }}" method="GET" class="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <input type="hidden" name="category" value="{{ $category }}">

            <div class="relative w-full min-w-0 sm:w-auto sm:flex-1">
                <label for="admin-search-q" class="sr-only">Cari destinasi wisata</label>
                <input
                    id="admin-search-q"
                    type="search"
                    name="q"
                    value="{{ $search }}"
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
                <article class="apple-glass-card rounded-2xl overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-[rgba(244,239,230,0.26)]">
                    <div>
                        <!-- Thumbnail Header Seragam 16:10 -->
                        <div class="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#141A14]">
                            <img
                                src="{{ $spot->image ?: '/images/spots/taman-peranginan.jpg' }}"
                                alt="{{ $spot->name }}"
                                width="640"
                                height="400"
                                onerror="this.onerror=null;this.src='/images/spots/taman-peranginan.jpg';"
                                class="h-full w-full object-cover"
                                loading="{{ $loop->index < 3 ? 'eager' : 'lazy' }}"
                                @if($loop->first) fetchpriority="high" @endif
                            />
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent"></div>

                            <span class="apple-retro-bevel absolute top-2.5 left-2.5 rounded-lg border border-[rgba(244,239,230,0.18)] bg-[#111711]/85 px-2.5 py-1 text-[11px] font-semibold text-[#F5F2EB]">
                                {{ $spot->category }}
                            </span>

                            @if($spot->is_popular)
                                <span class="apple-retro-bevel absolute top-2.5 right-2.5 rounded-lg border border-[#DFAA63]/40 bg-[#111711]/90 px-2.5 py-1 text-[10.5px] font-semibold text-[#DFAA63]">
                                    Populer
                                </span>
                            @endif
                        </div>

                        <!-- Info Body -->
                        <div class="p-4 sm:p-5 space-y-2">
                            <div class="flex items-start justify-between gap-2.5">
                                <h2 class="line-clamp-1 text-[15px] font-bold tracking-tight text-[#F5F2EB]" title="{{ $spot->name }}">
                                    {{ $spot->name }}
                                </h2>
                                <span class="inline-flex shrink-0 items-center gap-1 font-mono text-[12.5px] font-semibold tabular-nums text-[#DFAA63]">
                                    <svg class="h-3.5 w-3.5 text-[#DFAA63]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

                    <!-- Tombol Aksi Bawah Kartu -->
                    <div class="grid grid-cols-2 gap-2.5 border-t border-[rgba(244,239,230,0.12)] px-4 py-3.5 sm:px-5">
                        <a
                            href="{{ route('admin.spots.edit', $spot->id) }}"
                            class="apple-retro-bevel inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[rgba(244,239,230,0.16)] bg-white/[0.06] px-3 text-[12.5px] font-semibold text-[#F5F2EB] transition-colors hover:bg-white/[0.13] active:scale-[0.98]"
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
                                class="apple-retro-bevel w-full min-h-[44px] rounded-xl border border-rose-300/25 bg-[#3A1B22]/85 px-3 text-[12.5px] font-semibold text-rose-100 transition-colors hover:bg-[#49222B] active:scale-[0.98]"
                            >
                                Hapus
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
