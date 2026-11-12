@extends('layouts.admin')

@section('title', 'Edit Lokasi: ' . $spot->name)

@section('content')
@php
    $inputClass = 'w-full rounded-lg bg-[#384931] border border-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition';
    $labelClass = 'block text-[11px] font-medium text-white/60 mb-1.5';

    $rawHours = $spot->operational_hours ?: '08:00-17:00';
    $openVal = '08:00';
    $closeVal = '17:00';
    $dayVal = 'Setiap hari';
    if (str_contains($rawHours, ',')) {
        [$dayPart, $timePart] = array_map('trim', explode(',', $rawHours, 2));
        $dayVal = $dayPart ?: 'Setiap hari';
        $rawHours = $timePart;
    }
    if (preg_match('/(\d{2}[:.]\d{2})\s*[-–]\s*(\d{2}[:.]\d{2})/', $rawHours, $m)) {
        $openVal = str_replace('.', ':', $m[1]);
        $closeVal = str_replace('.', ':', $m[2]);
    }
@endphp

<form id="spot-form" action="{{ route('admin.spots.update', $spot->id) }}" method="POST" enctype="multipart/form-data" class="mt-6 space-y-7" novalidate>
    @csrf
    @method('PUT')
    <input type="hidden" name="photo_order" id="photo_order" value="[]">
    <input type="hidden" name="operational_hours" id="input-operational-hours" value="{{ old('operational_hours', $spot->operational_hours) }}">

    <!-- 1. Bagian Informasi -->
    <section class="space-y-3.5">
        <div class="flex items-center justify-between">
            <h2 class="text-[12px] font-bold tracking-wide text-white">
                Informasi
            </h2>
            <a href="{{ route('admin.spots.index') }}" class="text-[11px] text-white/55 hover:text-white transition">
                ← Kembali ke daftar
            </a>
        </div>

        <div>
            <label for="admin-name" class="{{ $labelClass }}">
                Nama tempat wisata
            </label>
            <input
                id="admin-name"
                type="text"
                name="name"
                value="{{ old('name', $spot->name) }}"
                placeholder="Jbound Geo Edu Park"
                class="{{ $inputClass }}"
                required
            />
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div>
                <label for="admin-category" class="{{ $labelClass }}">
                    Kategori
                </label>
                <div class="relative">
                    <select
                        id="admin-category"
                        name="category"
                        class="{{ $inputClass }} appearance-none pr-8 cursor-pointer"
                    >
                        <option value="Alam & Curug" {{ old('category', $spot->category) == 'Alam & Curug' ? 'selected' : '' }} class="bg-[#2c3b26] text-white">Alam</option>
                        <option value="Kuliner" {{ old('category', $spot->category) == 'Kuliner' ? 'selected' : '' }} class="bg-[#2c3b26] text-white">Kuliner</option>
                        <option value="Edukasi & Budaya" {{ old('category', $spot->category) == 'Edukasi & Budaya' ? 'selected' : '' }} class="bg-[#2c3b26] text-white">Edukasi & Budaya</option>
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
                        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>

            <div>
                <label for="admin-ticket" class="{{ $labelClass }}">
                    Harga tiket
                </label>
                <input
                    id="admin-ticket"
                    type="text"
                    name="ticket_price"
                    value="{{ old('ticket_price', $spot->ticket_price) }}"
                    placeholder="Rp 15.000 / Gratis"
                    class="{{ $inputClass }}"
                />
            </div>
        </div>

        <div>
            <label for="admin-address" class="{{ $labelClass }}">
                Alamat
            </label>
            <input
                id="admin-address"
                type="text"
                name="address"
                value="{{ old('address', $spot->address) }}"
                placeholder="Bogor, Jawa Barat"
                class="{{ $inputClass }}"
            />
        </div>

        <div>
            <label for="admin-description" class="{{ $labelClass }}">
                Deskripsi
            </label>
            <textarea
                id="admin-description"
                name="description"
                rows="3"
                placeholder="Tulis deskripsi singkat"
                class="{{ $inputClass }} resize-none"
            >{{ old('description', $spot->description) }}</textarea>
        </div>

        <div>
            <label for="admin-detailed-description" class="{{ $labelClass }}">
                Deskripsi detail
            </label>
            <textarea
                id="admin-detailed-description"
                name="detailed_description"
                rows="3"
                placeholder="Tulis ulasan lengkap, fasilitas, dan daya tarik wisata"
                class="{{ $inputClass }} resize-none"
            >{{ old('detailed_description', $spot->detailed_description) }}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3 items-end">
            <div>
                <label for="admin-rating" class="{{ $labelClass }}">
                    Rating (0.0 - 5.0)
                </label>
                <input
                    id="admin-rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    name="rating"
                    value="{{ old('rating', $spot->rating) }}"
                    placeholder="4.6"
                    class="{{ $inputClass }}"
                />
            </div>

            <label class="flex items-center gap-2 rounded-lg bg-[#384931] border border-white/10 px-3.5 py-2.5 cursor-pointer">
                <input type="checkbox" name="is_popular" value="1" {{ old('is_popular', $spot->is_popular) ? 'checked' : '' }}
                       class="rounded bg-[#2c3b26] border-white/30 text-[#8c785c] focus:ring-0 w-4 h-4 cursor-pointer">
                <span class="text-[12px] text-white/80">Wisata populer</span>
            </label>
        </div>
    </section>

    <!-- 2. Bagian Operasional -->
    <section class="space-y-3.5">
        <h2 class="text-[12px] font-bold tracking-wide text-white">
            Operasional
        </h2>

        <div class="grid grid-cols-2 gap-3">
            <div>
                <label for="admin-open" class="{{ $labelClass }}">
                    Buka
                </label>
                <input
                    id="admin-open"
                    type="text"
                    value="{{ $openVal }}"
                    placeholder="08:00"
                    class="{{ $inputClass }}"
                />
            </div>

            <div>
                <label for="admin-close" class="{{ $labelClass }}">
                    Tutup
                </label>
                <input
                    id="admin-close"
                    type="text"
                    value="{{ $closeVal }}"
                    placeholder="17:00"
                    class="{{ $inputClass }}"
                />
            </div>
        </div>

        <div>
            <label for="admin-days" class="{{ $labelClass }}">
                Hari
            </label>
            <div class="relative">
                <select
                    id="admin-days"
                    class="{{ $inputClass }} appearance-none pr-8 cursor-pointer"
                >
                    @foreach(['Setiap hari', 'Senin - Jumat', 'Sabtu - Minggu', 'Selasa - Minggu'] as $d)
                        <option value="{{ $d }}" {{ $dayVal === $d ? 'selected' : '' }} class="bg-[#2c3b26] text-white">{{ $d }}</option>
                    @endforeach
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
                    class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
        </div>
    </section>

    <!-- 3. Bagian Lokasi (Peta Interaktif sesuai AdminLocationPickerMap.jsx) -->
    <section class="space-y-3.5">
        <div>
            <h2 class="text-[12px] font-bold tracking-wide text-white">
                Lokasi
            </h2>
            <p class="mt-1 text-[11px] text-white/55">
                Ketuk peta untuk menaruh titik
            </p>
        </div>

        <div class="relative h-[180px] w-full overflow-hidden rounded-xl border border-white/10 bg-[#253520] shadow-inner">
            <div id="map-picker" class="h-full w-full z-0 cursor-crosshair"></div>
            <!-- Subtle grid & label overlay matching AdminLocationPickerMap.jsx -->
            <div class="pointer-events-none absolute inset-0 z-[400] bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_32px]"></div>
            <span class="pointer-events-none absolute bottom-2 left-2.5 z-[400] rounded bg-[#2c3b26]/85 px-1.5 py-0.5 text-[10px] text-white/60 backdrop-blur-sm">
                Peta skema
            </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div>
                <label for="input-lat" class="{{ $labelClass }}">
                    Latitude
                </label>
                <input
                    id="input-lat"
                    type="number"
                    step="any"
                    name="latitude"
                    value="{{ old('latitude', $spot->latitude) }}"
                    placeholder="-6.5971"
                    class="{{ $inputClass }}"
                    required
                />
            </div>

            <div>
                <label for="input-lng" class="{{ $labelClass }}">
                    Longitude
                </label>
                <input
                    id="input-lng"
                    type="number"
                    step="any"
                    name="longitude"
                    value="{{ old('longitude', $spot->longitude) }}"
                    placeholder="106.8060"
                    class="{{ $inputClass }}"
                    required
                />
            </div>
        </div>
    </section>

    <!-- 4. Bagian Foto (Sesuai AdminPage.jsx + SortableJS Multi-Photo) -->
    <section class="space-y-3">
        <div class="flex items-center justify-between">
            <h2 class="text-[12px] font-bold tracking-wide text-white">
                Foto
            </h2>
            <span class="text-[10px] text-white/45">
                <span id="photo-count">0</span> foto · geser urutan di bawah
            </span>
        </div>

        <input type="file" id="photos-input" name="photos[]" multiple accept="image/*" class="hidden">

        <div
            id="dropzone-area"
            role="button"
            tabindex="0"
            class="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#384931] hover:bg-[#3e5036] transition cursor-pointer"
        >
            <!-- Crosshair subtle divider lines like AdminPage.jsx -->
            <div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/5"></div>
            <div class="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/5"></div>

            <img id="primary-photo-preview" src="" alt="Pratinjau foto lokasi" class="hidden h-full w-full object-cover z-10">
            <span id="primary-photo-badge" class="hidden absolute bottom-2.5 right-2.5 z-20 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                Ganti foto
            </span>
            <span id="primary-photo-empty" class="z-10 text-[12px] font-medium text-white/50">
                Tambah foto
            </span>
        </div>

        <!-- Daftar Sortable Urutan Foto -->
        <div id="photo-sortable-list" class="space-y-2"></div>
    </section>

    <!-- Tombol Aksi Simpan -->
    <div class="pt-3 flex items-center justify-center gap-3">
        <a href="{{ route('admin.spots.index') }}"
           class="rounded-full bg-white/10 hover:bg-white/15 px-6 py-2.5 text-[12px] font-medium text-white/80 transition">
            Batal
        </a>
        <button
            type="submit"
            id="btn-submit"
            class="rounded-full bg-[#8c785c] hover:bg-[#9b8669] active:scale-95 px-9 py-2.5 text-[12px] font-semibold text-white shadow-md transition cursor-pointer"
        >
            Perbarui lokasi
        </button>
    </div>
</form>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function () {
        // --- 0. Sinkronisasi Jam Operasional ---
        const openInput = document.getElementById('admin-open');
        const closeInput = document.getElementById('admin-close');
        const daysSelect = document.getElementById('admin-days');
        const opHoursInput = document.getElementById('input-operational-hours');

        function syncOperationalHours() {
            const openVal = openInput.value.trim() || '08:00';
            const closeVal = closeInput.value.trim() || '17:00';
            const dayVal = daysSelect.value;
            opHoursInput.value = dayVal === 'Setiap hari'
                ? `${openVal}-${closeVal}`
                : `${dayVal}, ${openVal}-${closeVal}`;
        }
        [openInput, closeInput, daysSelect].forEach(el => el.addEventListener('change', syncOperationalHours));
        document.getElementById('spot-form').addEventListener('submit', syncOperationalHours);

        // --- 1. Leaflet Map Picker (Sesuai AdminLocationPickerMap.jsx) ---
        const currentLat = parseFloat(document.getElementById('input-lat').value) || -6.5971;
        const currentLng = parseFloat(document.getElementById('input-lng').value) || 106.8060;

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
            html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 3px 6px rgb(0 0 0 / .45))">
                <path d="M16 41S3 26.5 3 16a13 13 0 1 1 26 0c0 10.5-13 25-13 25Z" fill="#8c785c" stroke="#fff" stroke-width="2"/>
                <circle cx="16" cy="15" r="5" fill="#fff"/>
            </svg>`
        });

        let marker = L.marker([currentLat, currentLng], { icon: adminPinIcon, draggable: true }).addTo(map);

        function updateInputs(lat, lng) {
            document.getElementById('input-lat').value = lat.toFixed(6);
            document.getElementById('input-lng').value = lng.toFixed(6);
        }

        marker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            updateInputs(pos.lat, pos.lng);
        });

        map.on('click', function (e) {
            marker.setLatLng(e.latlng);
            updateInputs(e.latlng.lat, e.latlng.lng);
        });

        document.getElementById('input-lat').addEventListener('change', function () {
            const lat = parseFloat(this.value);
            const lng = parseFloat(document.getElementById('input-lng').value);
            if (!isNaN(lat) && !isNaN(lng)) {
                marker.setLatLng([lat, lng]);
                map.panTo([lat, lng]);
            }
        });

        document.getElementById('input-lng').addEventListener('change', function () {
            const lat = parseFloat(document.getElementById('input-lat').value);
            const lng = parseFloat(this.value);
            if (!isNaN(lat) && !isNaN(lng)) {
                marker.setLatLng([lat, lng]);
                map.panTo([lat, lng]);
            }
        });

        // --- 2. Foto & Galeri Drag & Drop Upload Management ---
        const dropzone = document.getElementById('dropzone-area');
        const fileInput = document.getElementById('photos-input');
        const sortableList = document.getElementById('photo-sortable-list');
        const photoOrderInput = document.getElementById('photo_order');
        const photoCountBadge = document.getElementById('photo-count');
        const primaryPreview = document.getElementById('primary-photo-preview');
        const primaryBadge = document.getElementById('primary-photo-badge');
        const primaryEmpty = document.getElementById('primary-photo-empty');

        let photoItems = [];
        let newFileCounter = 0;
        const fileStore = new DataTransfer();

        const existingGallery = @json(is_array($spot->gallery) ? $spot->gallery : []);
        const primaryImage = @json($spot->image);

        let initialList = [...existingGallery];
        if (primaryImage && !initialList.includes(primaryImage)) {
            initialList.unshift(primaryImage);
        }

        initialList.forEach((src, idx) => {
            if (!src) return;
            const fileName = src.split('/').pop();
            photoItems.push({
                id: 'existing_' + idx,
                fileId: null,
                src: src,
                name: fileName,
                size: 'Tersimpan'
            });
        });

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-amber-300/60', 'bg-[#3f5237]');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('border-amber-300/60', 'bg-[#3f5237]');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-amber-300/60', 'bg-[#3f5237]');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleNewFiles(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                handleNewFiles(this.files);
            }
        });

        function handleNewFiles(files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                const fileId = 'new_' + newFileCounter++;
                fileStore.items.add(file);

                const reader = new FileReader();
                reader.onload = function (e) {
                    photoItems.unshift({
                        id: fileId,
                        fileId: fileId,
                        src: e.target.result,
                        name: file.name,
                        size: (file.size / 1024).toFixed(0) + ' KB'
                    });
                    renderPhotoList();
                };
                reader.readAsDataURL(file);
            }
            fileInput.files = fileStore.files;
        }

        function renderPhotoList() {
            sortableList.innerHTML = '';
            photoCountBadge.textContent = photoItems.length;

            if (photoItems.length > 0) {
                primaryPreview.src = photoItems[0].src;
                primaryPreview.classList.remove('hidden');
                primaryBadge.classList.remove('hidden');
                primaryEmpty.classList.add('hidden');
            } else {
                primaryPreview.src = '';
                primaryPreview.classList.add('hidden');
                primaryBadge.classList.add('hidden');
                primaryEmpty.classList.remove('hidden');
            }

            photoItems.forEach((item, index) => {
                const isPrimary = index === 0;
                const card = document.createElement('div');
                card.dataset.id = item.id;
                card.className = `flex items-center justify-between gap-3 p-2.5 rounded-xl border transition group cursor-grab active:cursor-grabbing ${
                    isPrimary
                        ? 'bg-[#384931] border-[#8c785c]/70'
                        : 'bg-[#384931]/65 border-white/10 hover:border-white/20'
                }`;

                card.innerHTML = `
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="text-white/35 text-xs shrink-0">⋮⋮</span>
                        <img src="${item.src}" alt="${item.name}" class="h-10 w-12 rounded-lg object-cover bg-black/20 shrink-0">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <span class="text-[12px] font-medium text-white truncate max-w-[160px]">${item.name}</span>
                                ${isPrimary ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#8c785c] text-white">Utama</span>' : ''}
                            </div>
                            <p class="text-[10px] text-white/45">${item.size || ''}</p>
                        </div>
                    </div>
                    <button type="button" class="btn-remove-photo rounded-lg bg-rose-500/15 hover:bg-rose-500/30 px-2 py-1 text-[10px] font-medium text-rose-200 transition cursor-pointer shrink-0">
                        Hapus
                    </button>
                `;

                card.querySelector('.btn-remove-photo').addEventListener('click', (e) => {
                    e.stopPropagation();
                    photoItems = photoItems.filter(p => p.id !== item.id);
                    renderPhotoList();
                });

                sortableList.appendChild(card);
            });

            syncOrderInput();
        }

        function syncOrderInput() {
            const orderData = photoItems.map((item, index) => ({
                id: item.id,
                fileId: item.fileId || null,
                src: item.src.startsWith('data:') ? '' : item.src,
                order: index
            }));
            photoOrderInput.value = JSON.stringify(orderData);
        }

        new Sortable(sortableList, {
            animation: 200,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onEnd: function () {
                const newOrderIds = Array.from(sortableList.children).map(c => c.dataset.id);
                photoItems.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
                renderPhotoList();
            }
        });

        renderPhotoList();
    });
</script>
@endpush
