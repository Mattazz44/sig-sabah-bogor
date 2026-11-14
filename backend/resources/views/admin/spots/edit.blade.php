@extends('layouts.admin')

@section('title', 'Edit Lokasi: ' . $spot->name)

@section('content')
@php
    $rawHours = $spot->operational_hours ?: '08:00 - 17:00';
    $is24h = str_contains(strtolower($rawHours), '24 jam');
    $openVal = '08:00';
    $closeVal = '17:00';
    if (preg_match('/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/', $rawHours, $m)) {
        $openVal = str_pad($m[1], 2, '0', STR_PAD_LEFT) . ':' . $m[2];
        $closeVal = str_pad($m[3], 2, '0', STR_PAD_LEFT) . ':' . $m[4];
    }

    $galleryList = is_array($spot->gallery) && count($spot->gallery) > 0 ? $spot->gallery : ($spot->image ? [$spot->image] : []);
    $galleryList = array_values(array_unique(array_filter($galleryList)));
@endphp

<form id="spot-form" action="{{ route('admin.spots.update', $spot->id) }}" method="POST" enctype="multipart/form-data" class="space-y-6" novalidate>
    @csrf
    @method('PUT')
    <input type="hidden" name="photo_order" id="photo_order" value="[]">
    <input type="hidden" name="operational_hours" id="input-operational-hours" value="{{ old('operational_hours', $spot->operational_hours) }}">

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <!-- KOLOM KIRI (7 KOLOM): Informasi Lokasi & Jam Operasional -->
        <div class="space-y-6 lg:col-span-7">
            <!-- 1. Kartu Informasi Lokasi -->
            <section class="liquid-glass-card rounded-2xl p-5 sm:p-6" aria-labelledby="heading-info-lokasi">
                <div class="flex items-center justify-between gap-2">
                    <h2 id="heading-info-lokasi" class="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                        Informasi Lokasi
                    </h2>
                    <span class="rounded-lg border border-[#E2D7B5]/30 bg-[#141C14]/70 px-2.5 py-1 text-[11px] font-medium text-[#E2D7B5]">
                        ID #{{ $spot->id }}
                    </span>
                </div>
                <p class="mt-0.5 text-[12px] text-[#C8D3C8]">
                    Perbarui nama, kategori, tarif masuk, dan alamat tempat wisata.
                </p>

                <div class="mt-5 space-y-4">
                    <div>
                        <label for="admin-name" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Nama tempat wisata
                        </label>
                        <input
                            id="admin-name"
                            type="text"
                            name="name"
                            value="{{ old('name', $spot->name) }}"
                            placeholder="Contoh: Kebun Raya Bogor"
                            class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] placeholder:text-[#98A698]"
                            required
                        />
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label for="admin-category" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                                Kategori
                            </label>
                            <div class="relative">
                                <select
                                    id="admin-category"
                                    name="category"
                                    class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 pr-9 text-[13.5px] appearance-none cursor-pointer"
                                >
                                    <option value="Alam & Curug" {{ old('category', $spot->category) == 'Alam & Curug' ? 'selected' : '' }} class="bg-[#1B261B] text-[#EBF0EB]">Alam & Curug</option>
                                    <option value="Kuliner" {{ old('category', $spot->category) == 'Kuliner' ? 'selected' : '' }} class="bg-[#1B261B] text-[#EBF0EB]">Kuliner</option>
                                    <option value="Edukasi & Budaya" {{ old('category', $spot->category) == 'Edukasi & Budaya' ? 'selected' : '' }} class="bg-[#1B261B] text-[#EBF0EB]">Edukasi & Budaya</option>
                                </select>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                    class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C8D3C8]"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label for="admin-ticket" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                                Harga tiket
                            </label>
                            <input
                                id="admin-ticket"
                                type="text"
                                name="ticket_price"
                                value="{{ old('ticket_price', $spot->ticket_price) }}"
                                placeholder="Contoh: Rp 15.000 atau Gratis"
                                class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] placeholder:text-[#98A698]"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label for="admin-rating" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                                Rating (0.0 – 5.0)
                            </label>
                            <input
                                id="admin-rating"
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                name="rating"
                                value="{{ old('rating', $spot->rating) }}"
                                placeholder="4.5"
                                class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] font-mono tabular-nums"
                            />
                        </div>

                        <div class="flex flex-col justify-end">
                            <span class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">Visibilitas</span>
                            <label for="admin-popular" class="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.15] bg-white/[0.06] px-3.5 py-2 transition-colors hover:bg-white/[0.09]">
                                <span class="text-[13px] font-medium text-[#EBF0EB]">
                                    Tandai wisata populer
                                </span>
                                <span class="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                                    <input
                                        id="admin-popular"
                                        type="checkbox"
                                        name="is_popular"
                                        value="1"
                                        {{ old('is_popular', $spot->is_popular) ? 'checked' : '' }}
                                        class="peer sr-only"
                                    />
                                    <span class="h-5 w-5 rounded-md border border-white/25 bg-white/[0.06] transition-colors peer-checked:border-[#EBF0EB] peer-checked:bg-[#EBF0EB]"></span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#161E16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute h-3.5 w-3.5 opacity-0 transition-opacity peer-checked:opacity-100" aria-hidden="true">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label for="admin-address" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Alamat
                        </label>
                        <input
                            id="admin-address"
                            type="text"
                            name="address"
                            value="{{ old('address', $spot->address) }}"
                            placeholder="Jl. Ir. H. Juanda No.13, Kota Bogor, Jawa Barat"
                            class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] placeholder:text-[#98A698]"
                        />
                    </div>

                    <div>
                        <label for="admin-description" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Deskripsi
                        </label>
                        <textarea
                            id="admin-description"
                            name="description"
                            rows="3"
                            placeholder="Tulis gambaran singkat daya tarik wisata dan suasana lokasi"
                            class="liquid-glass-input w-full rounded-xl p-3.5 text-[13.5px] placeholder:text-[#98A698] resize-y"
                        >{{ old('description', $spot->description) }}</textarea>
                    </div>

                    <div>
                        <label for="admin-detailed-description" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Deskripsi detail
                        </label>
                        <textarea
                            id="admin-detailed-description"
                            name="detailed_description"
                            rows="4"
                            placeholder="Tulis ulasan mendalam, fasilitas, sejarah, dan tips berkunjung"
                            class="liquid-glass-input w-full rounded-xl p-3.5 text-[13.5px] placeholder:text-[#98A698] resize-y"
                        >{{ old('detailed_description', $spot->detailed_description) }}</textarea>
                    </div>
                </div>
            </section>

            <!-- 2. Kartu Jam Operasional -->
            <section class="liquid-glass-card rounded-2xl p-5 sm:p-6" aria-labelledby="heading-jam-operasional">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <svg class="h-4 w-4 text-[#E2D7B5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <h2 id="heading-jam-operasional" class="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                            Jam Operasional
                        </h2>
                    </div>

                    <button
                        type="button"
                        id="btn-toggle-24h"
                        class="min-h-[34px] rounded-xl border border-white/15 bg-white/[0.06] px-3 text-[12px] font-medium text-[#C8D3C8] transition-colors hover:text-[#EBF0EB] cursor-pointer"
                    >
                        Buka 24 jam
                    </button>
                </div>

                <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label for="admin-open" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Jam buka
                        </label>
                        <input
                            id="admin-open"
                            type="time"
                            value="{{ $openVal }}"
                            class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] [color-scheme:dark]"
                        />
                    </div>

                    <div>
                        <label for="admin-close" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Jam tutup
                        </label>
                        <input
                            id="admin-close"
                            type="time"
                            value="{{ $closeVal }}"
                            class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13.5px] [color-scheme:dark]"
                        />
                    </div>
                </div>

                <div class="mt-5">
                    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span class="text-[12px] font-medium text-[#C8D3C8]">
                            Hari buka (Senin–Minggu)
                        </span>
                        <div class="flex items-center gap-2 text-[11px]">
                            <button type="button" id="btn-quick-all" class="rounded-lg px-2 py-1 font-medium text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-[#EBF0EB] cursor-pointer">
                                Setiap hari
                            </button>
                            <button type="button" id="btn-quick-weekdays" class="rounded-lg px-2 py-1 font-medium text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-[#EBF0EB] cursor-pointer">
                                Senin–Jumat
                            </button>
                            <button type="button" id="btn-quick-weekends" class="rounded-lg px-2 py-1 font-medium text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-[#EBF0EB] cursor-pointer">
                                Akhir pekan
                            </button>
                        </div>
                    </div>

                    <div id="weekday-pills" class="grid grid-cols-4 gap-2 sm:grid-cols-7" role="group" aria-label="Pilih hari buka">
                        @foreach(['Senin' => 'Sen', 'Selasa' => 'Sel', 'Rabu' => 'Rab', 'Kamis' => 'Kam', 'Jumat' => 'Jum', 'Sabtu' => 'Sab', 'Minggu' => 'Min'] as $dayFull => $dayShort)
                            <button
                                type="button"
                                data-day="{{ $dayFull }}"
                                aria-pressed="true"
                                class="day-toggle-btn flex min-h-[42px] items-center justify-center rounded-xl border border-[#EBF0EB] bg-[#EBF0EB] px-2 text-[12.5px] font-semibold text-[#161E16] shadow-sm transition-colors cursor-pointer"
                            >
                                {{ $dayShort }}
                            </button>
                        @endforeach
                    </div>

                    <p class="mt-2.5 text-[12px] text-[#C8D3C8]">
                        Format tersimpan: <span id="operational-hours-preview" class="font-medium text-[#EBF0EB]">{{ $spot->operational_hours ?: '08:00 - 17:00' }}</span>
                    </p>
                </div>
            </section>
        </div>

        <!-- KOLOM KANAN (5 KOLOM): Titik Koordinat & Foto Lokasi Multi-Upload -->
        <div class="space-y-6 lg:col-span-5">
            <!-- 3. Kartu Titik Koordinat -->
            <section class="liquid-glass-card rounded-2xl p-5 sm:p-6" aria-labelledby="heading-koordinat">
                <div class="flex items-center gap-2">
                    <svg class="h-4 w-4 text-[#E2D7B5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    <h2 id="heading-koordinat" class="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                        Titik Koordinat
                    </h2>
                </div>
                <p class="mt-0.5 text-[12px] text-[#C8D3C8]">
                    Klik peta atau geser pin untuk memperbarui titik lokasi di Google Maps & Leaflet.
                </p>

                <div class="mt-4 relative h-[280px] sm:h-[320px] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#1B261B] shadow-inner">
                    <div id="map-picker" class="h-full w-full z-0 cursor-crosshair"></div>

                    <!-- Custom Controls: Zoom & Center -->
                    <div class="pointer-events-none absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
                        <div class="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-white/20 bg-[#141C14]/80 text-[#EBF0EB] shadow-md backdrop-blur-md">
                            <button type="button" id="btn-zoom-in" aria-label="Perbesar" class="flex h-9 w-9 items-center justify-center text-[16px] font-semibold hover:bg-white/10 active:bg-white/15 cursor-pointer">+</button>
                            <div class="h-px w-full bg-white/15"></div>
                            <button type="button" id="btn-zoom-out" aria-label="Perkecil" class="flex h-9 w-9 items-center justify-center text-[16px] font-semibold hover:bg-white/10 active:bg-white/15 cursor-pointer">-</button>
                        </div>
                        <button type="button" id="btn-center-bogor" title="Pusatkan ke Kota Bogor" class="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#141C14]/80 text-[#E2D7B5] shadow-md backdrop-blur-md hover:bg-[#233020] active:scale-95 cursor-pointer">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="7" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                                <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
                            </svg>
                        </button>
                    </div>

                    <div class="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex flex-wrap items-center justify-between gap-2">
                        <span class="rounded-xl border border-white/15 bg-[#141C14]/80 px-2.5 py-1 text-[11px] font-medium text-[#C8D3C8] backdrop-blur-md">
                            Klik peta atau geser pin
                        </span>
                        <span id="coord-display-chip" class="rounded-xl border border-white/15 bg-[#141C14]/85 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-[#EBF0EB] backdrop-blur-md">
                            {{ number_format($spot->latitude, 5) }}, {{ number_format($spot->longitude, 5) }}
                        </span>
                    </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <label for="input-lat" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Latitude
                        </label>
                        <input
                            id="input-lat"
                            type="number"
                            step="any"
                            name="latitude"
                            value="{{ old('latitude', $spot->latitude) }}"
                            placeholder="-6.5971"
                            class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums"
                            required
                        />
                    </div>

                    <div>
                        <label for="input-lng" class="mb-1.5 block text-[12px] font-medium text-[#C8D3C8]">
                            Longitude
                        </label>
                        <input
                            id="input-lng"
                            type="number"
                            step="any"
                            name="longitude"
                            value="{{ old('longitude', $spot->longitude) }}"
                            placeholder="106.8060"
                            class="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums"
                            required
                        />
                    </div>
                </div>
            </section>

            <!-- 4. Kartu Foto Lokasi Multi-Upload -->
            <section class="liquid-glass-card rounded-2xl p-5 sm:p-6" aria-labelledby="heading-foto-lokasi">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <svg class="h-4 w-4 text-[#E2D7B5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle cx="12" cy="13" r="3" />
                        </svg>
                        <h2 id="heading-foto-lokasi" class="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                            Foto Lokasi
                        </h2>
                    </div>
                    <span class="text-[12px] font-medium tabular-nums text-[#C8D3C8]">
                        <span id="photo-count">0</span> foto
                    </span>
                </div>
                <p class="mt-0.5 text-[12px] text-[#C8D3C8]">
                    Kelola foto yang sudah ada atau tambahkan foto baru. Foto pertama adalah foto sampul utama.
                </p>

                <input type="file" id="photos-input" name="photos[]" multiple accept="image/*" class="hidden">

                <button
                    type="button"
                    id="dropzone-area"
                    class="mt-4 flex min-h-[136px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] px-4 py-5 text-center transition-colors hover:border-white/40 hover:bg-white/[0.08] cursor-pointer"
                >
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#141C14]/70 text-[#E2D7B5]">
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle cx="12" cy="13" r="3" />
                        </svg>
                    </span>
                    <span class="text-[13px] font-medium text-[#EBF0EB]">
                        Klik atau seret foto baru ke sini
                    </span>
                    <span class="text-[11.5px] text-[#C8D3C8]">
                        JPG, PNG, WebP · Kompresi otomatis sebelum diunggah
                    </span>
                </button>

                <!-- Sortable Thumbnail Preview Grid -->
                <div id="photo-sortable-list" class="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3"></div>
            </section>
        </div>
    </div>

    <!-- Footer Aksi Form -->
    <div class="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-white/12 pt-6 sm:flex-row sm:items-center">
        <a
            href="{{ route('admin.spots.index') }}"
            class="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/18 bg-[#141C14]/65 px-6 py-2.5 text-[13.5px] font-medium text-[#C8D3C8] backdrop-blur-md transition-colors hover:border-white/30 hover:text-[#EBF0EB]"
        >
            Batal
        </a>

        <button
            type="submit"
            id="btn-submit-spot"
            class="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#EBF0EB] px-9 py-3 text-[14px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98] cursor-pointer"
        >
            Simpan Perubahan
        </button>
    </div>
</form>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function () {
    // ----------------------------------------------------
    // 1. Sinkronisasi Jam & Hari Operasional
    // ----------------------------------------------------
    const openInput = document.getElementById('admin-open');
    const closeInput = document.getElementById('admin-close');
    const opHoursInput = document.getElementById('input-operational-hours');
    const previewEl = document.getElementById('operational-hours-preview');
    const toggle24hBtn = document.getElementById('btn-toggle-24h');
    const dayButtons = Array.from(document.querySelectorAll('.day-toggle-btn'));
    let is24Hours = {{ $is24h ? 'true' : 'false' }};

    // Deteksi hari aktif dari teks operasional yang ada
    const initialRawText = {!! json_encode($rawHours) !!}.toLowerCase();
    if (initialRawText.includes('senin - jumat') || initialRawText.includes('senin-jumat')) {
        dayButtons.forEach(b => {
            const d = b.getAttribute('data-day');
            const active = !['Sabtu', 'Minggu'].includes(d);
            setBtnState(b, active);
        });
    } else if (initialRawText.includes('sabtu - minggu') || initialRawText.includes('sabtu-minggu')) {
        dayButtons.forEach(b => {
            const d = b.getAttribute('data-day');
            const active = ['Sabtu', 'Minggu'].includes(d);
            setBtnState(b, active);
        });
    } else if (initialRawText.includes('selasa - minggu') || initialRawText.includes('selasa-minggu')) {
        dayButtons.forEach(b => {
            const d = b.getAttribute('data-day');
            const active = d !== 'Senin';
            setBtnState(b, active);
        });
    }

    if (is24Hours) {
        openInput.disabled = true;
        closeInput.disabled = true;
        toggle24hBtn.className = 'min-h-[34px] rounded-xl border border-[#EBF0EB] bg-[#EBF0EB] px-3 text-[12px] font-semibold text-[#161E16] cursor-pointer';
    }

    function setBtnState(btn, active) {
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.className = active
            ? 'day-toggle-btn flex min-h-[42px] items-center justify-center rounded-xl border border-[#EBF0EB] bg-[#EBF0EB] px-2 text-[12.5px] font-semibold text-[#161E16] shadow-sm transition-colors cursor-pointer'
            : 'day-toggle-btn flex min-h-[42px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-2 text-[12.5px] font-semibold text-[#C8D3C8] hover:border-white/30 hover:text-[#EBF0EB] transition-colors cursor-pointer';
    }

    function getSelectedDays() {
        return dayButtons
            .filter(b => b.getAttribute('aria-pressed') === 'true')
            .map(b => b.getAttribute('data-day'));
    }

    function formatDaysString(days) {
        if (days.length === 0 || days.length === 7) return 'Setiap hari';
        if (days.length === 5 && !days.includes('Sabtu') && !days.includes('Minggu')) return 'Senin - Jumat';
        if (days.length === 2 && days.includes('Sabtu') && days.includes('Minggu')) return 'Sabtu - Minggu';
        if (days.length === 6 && !days.includes('Senin')) return 'Selasa - Minggu';
        return days.join(', ');
    }

    function syncOperationalHours() {
        const days = getSelectedDays();
        const dayLabel = formatDaysString(days);
        let result = '';

        if (is24Hours) {
            result = dayLabel === 'Setiap hari' ? '24 Jam' : `${dayLabel} · 24 Jam`;
        } else {
            const openVal = openInput.value || '08:00';
            const closeVal = closeInput.value || '17:00';
            const timeRange = `${openVal} - ${closeVal}`;
            result = dayLabel === 'Setiap hari' ? timeRange : `${dayLabel} · ${timeRange}`;
        }

        opHoursInput.value = result;
        previewEl.textContent = result;
    }

    toggle24hBtn.addEventListener('click', function () {
        is24Hours = !is24Hours;
        openInput.disabled = is24Hours;
        closeInput.disabled = is24Hours;
        if (is24Hours) {
            this.className = 'min-h-[34px] rounded-xl border border-[#EBF0EB] bg-[#EBF0EB] px-3 text-[12px] font-semibold text-[#161E16] cursor-pointer';
        } else {
            this.className = 'min-h-[34px] rounded-xl border border-white/15 bg-white/[0.06] px-3 text-[12px] font-medium text-[#C8D3C8] hover:text-[#EBF0EB] cursor-pointer';
        }
        syncOperationalHours();
    });

    dayButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const wasActive = this.getAttribute('aria-pressed') === 'true';
            const currentSelected = getSelectedDays();
            if (wasActive && currentSelected.length === 1) return;

            setBtnState(this, !wasActive);
            syncOperationalHours();
        });
    });

    document.getElementById('btn-quick-all').addEventListener('click', () => {
        dayButtons.forEach(b => setBtnState(b, true));
        syncOperationalHours();
    });

    document.getElementById('btn-quick-weekdays').addEventListener('click', () => {
        dayButtons.forEach(b => {
            const day = b.getAttribute('data-day');
            setBtnState(b, !['Sabtu', 'Minggu'].includes(day));
        });
        syncOperationalHours();
    });

    document.getElementById('btn-quick-weekends').addEventListener('click', () => {
        dayButtons.forEach(b => {
            const day = b.getAttribute('data-day');
            setBtnState(b, ['Sabtu', 'Minggu'].includes(day));
        });
        syncOperationalHours();
    });

    openInput.addEventListener('change', syncOperationalHours);
    closeInput.addEventListener('change', syncOperationalHours);
    document.getElementById('spot-form').addEventListener('submit', syncOperationalHours);
    syncOperationalHours();

    // ----------------------------------------------------
    // 2. Leaflet Map Interactive Picker
    // ----------------------------------------------------
    const latInput = document.getElementById('input-lat');
    const lngInput = document.getElementById('input-lng');
    const chipEl = document.getElementById('coord-display-chip');

    let currentLat = parseFloat(latInput.value) || {{ $spot->latitude }};
    let currentLng = parseFloat(lngInput.value) || {{ $spot->longitude }};

    const map = L.map('map-picker', {
        zoomControl: false,
        attributionControl: false
    }).setView([currentLat, currentLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    const adminPinIcon = L.divIcon({
        className: 'wisata-marker',
        iconSize: [32, 42],
        iconAnchor: [16, 41],
        html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 4px 8px rgb(0 0 0 / .48))">
            <path d="M16 41S3 26.5 3 16a13 13 0 1 1 26 0c0 10.5-13 25-13 25Z" fill="#1F8A5B" stroke="#EBF0EB" stroke-width="2.2"/>
            <circle cx="16" cy="15" r="5" fill="#E2D7B5"/>
        </svg>`
    });

    let marker = L.marker([currentLat, currentLng], { icon: adminPinIcon, draggable: true }).addTo(map);

    function updateCoordinates(lat, lng, pan = false) {
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
        chipEl.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        marker.setLatLng([lat, lng]);
        if (pan) map.panTo([lat, lng]);
    }

    marker.on('dragend', function (e) {
        const pos = e.target.getLatLng();
        updateCoordinates(pos.lat, pos.lng);
    });

    map.on('click', function (e) {
        updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    latInput.addEventListener('change', function () {
        const valLat = parseFloat(this.value);
        const valLng = parseFloat(lngInput.value);
        if (!isNaN(valLat) && !isNaN(valLng)) updateCoordinates(valLat, valLng, true);
    });

    lngInput.addEventListener('change', function () {
        const valLat = parseFloat(latInput.value);
        const valLng = parseFloat(this.value);
        if (!isNaN(valLat) && !isNaN(valLng)) updateCoordinates(valLat, valLng, true);
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => map.zoomOut());
    document.getElementById('btn-center-bogor').addEventListener('click', () => {
        map.setView([{{ $spot->latitude }}, {{ $spot->longitude }}], 14);
        updateCoordinates({{ $spot->latitude }}, {{ $spot->longitude }}, true);
    });

    // ----------------------------------------------------
    // 3. Foto & Galeri Multi-Upload + Drag & Drop Reordering
    // ----------------------------------------------------
    const dropzone = document.getElementById('dropzone-area');
    const fileInput = document.getElementById('photos-input');
    const sortableList = document.getElementById('photo-sortable-list');
    const photoOrderInput = document.getElementById('photo_order');
    const countBadge = document.getElementById('photo-count');

    let photoItems = []; // [{ id, kind: 'new'|'existing', file, previewUrl, name }]
    let newFileCounter = 0;

    // Masukkan foto galeri yang sudah ada di database
    const initialExistingGallery = {!! json_encode($galleryList) !!};
    initialExistingGallery.forEach((path, idx) => {
        photoItems.push({
            id: `existing_${idx}`,
            kind: 'existing',
            file: null,
            previewUrl: path,
            name: path.split('/').pop() || `Foto ${idx + 1}`
        });
    });

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-[#E2D7B5]', 'bg-white/[0.12]');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-[#E2D7B5]', 'bg-white/[0.12]');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-[#E2D7B5]', 'bg-white/[0.12]');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleNewFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            handleNewFiles(this.files);
        }
    });

    async function compressImageClient(file) {
        if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
            return file;
        }
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    let width = img.naturalWidth || img.width;
                    let height = img.naturalHeight || img.height;
                    const max = 1280;
                    if (width > max || height > max) {
                        const ratio = Math.min(max / width, max / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (!blob || blob.size >= file.size) {
                            resolve(file);
                        } else {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        }
                    }, 'image/jpeg', 0.82);
                };
                img.onerror = () => resolve(file);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    }

    async function handleNewFiles(files) {
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue;
            const compressed = await compressImageClient(file);
            const fileId = `new_${newFileCounter++}`;
            const previewUrl = URL.createObjectURL(compressed);

            photoItems.push({
                id: fileId,
                kind: 'new',
                file: compressed,
                previewUrl: previewUrl,
                name: compressed.name
            });
        }
        syncFileInputAndUI();
    }

    function renderPhotoGrid() {
        sortableList.innerHTML = '';
        countBadge.textContent = photoItems.length;

        photoItems.forEach((item, index) => {
            const isPrimary = index === 0;
            const card = document.createElement('div');
            card.dataset.id = item.id;
            card.className = 'group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/15 bg-[#1B261B] cursor-grab';

            card.innerHTML = `
                <img src="${item.previewUrl}" alt="${item.name}" class="h-full w-full object-cover pointer-events-none" />
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
                ${isPrimary
                    ? '<span class="absolute top-2 left-2 rounded-md border border-white/25 bg-[#141C14]/85 px-2 py-0.5 text-[10px] font-semibold text-[#E2D7B5] backdrop-blur-sm">Utama</span>'
                    : `<button type="button" class="btn-make-primary absolute bottom-2 left-2 rounded-md border border-white/25 bg-[#141C14]/85 px-2 py-0.5 text-[10px] font-medium text-[#EBF0EB] backdrop-blur-sm hover:bg-[#233020] transition-colors cursor-pointer">Jadikan utama</button>`
                }
                <button type="button" class="btn-remove-photo absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-[#141C14]/85 text-[#EBF0EB] backdrop-blur-sm hover:bg-rose-500/80 transition-colors cursor-pointer">✕</button>
            `;

            card.querySelector('.btn-remove-photo').addEventListener('click', (e) => {
                e.stopPropagation();
                removePhoto(item.id);
            });

            const makePrimaryBtn = card.querySelector('.btn-make-primary');
            if (makePrimaryBtn) {
                makePrimaryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setPrimary(item.id);
                });
            }

            sortableList.appendChild(card);
        });
    }

    function removePhoto(targetId) {
        photoItems = photoItems.filter(p => p.id !== targetId);
        syncFileInputAndUI();
    }

    function setPrimary(targetId) {
        const idx = photoItems.findIndex(p => p.id === targetId);
        if (idx > -1) {
            const [item] = photoItems.splice(idx, 1);
            photoItems.unshift(item);
            syncFileInputAndUI();
        }
    }

    function syncFileInputAndUI() {
        renderPhotoGrid();
        // Update photo_order JSON
        const orderArr = photoItems.map(item => {
            if (item.kind === 'new') return { fileId: item.id };
            return { src: item.previewUrl };
        });
        photoOrderInput.value = JSON.stringify(orderArr);

        // Update real FileList on HTML input
        const dt = new DataTransfer();
        photoItems.forEach(item => {
            if (item.kind === 'new' && item.file) dt.items.add(item.file);
        });
        fileInput.files = dt.files;
    }

    // Initialize SortableJS
    new Sortable(sortableList, {
        animation: 180,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: function () {
            const reordered = [];
            sortableList.querySelectorAll('[data-id]').forEach(el => {
                const id = el.dataset.id;
                const found = photoItems.find(p => p.id === id);
                if (found) reordered.push(found);
            });
            photoItems = reordered;
            syncFileInputAndUI();
        }
    });

    // Jalankan render awal galeri
    syncFileInputAndUI();
});
</script>
@endpush
