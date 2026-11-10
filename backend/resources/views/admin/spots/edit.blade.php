@extends('layouts.admin')

@section('title', 'Edit Tempat Wisata: ' . $spot->name)

@section('content')
<div class="max-w-4xl mx-auto space-y-6">

    <!-- Header Breadcrumb & Back -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <a href="{{ route('admin.spots.index') }}" class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </a>
            <div>
                <h1 class="text-xl font-bold text-white tracking-tight">Edit Tempat Wisata: {{ $spot->name }}</h1>
                <p class="text-xs text-white/60">Perbarui data spasial & kelola urutan foto galeri tempat wisata</p>
            </div>
        </div>
    </div>

    <!-- Form Container -->
    <form id="spot-form" action="{{ route('admin.spots.update', $spot->id) }}" method="POST" enctype="multipart/form-data" class="space-y-6">
        @csrf
        @method('PUT')

        <!-- Hidden input untuk Urutan Foto Hasil Drag & Drop -->
        <input type="hidden" name="photo_order" id="photo_order" value="[]">

        <!-- Informasi Utama -->
        <div class="rounded-2xl bg-forest-900/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
            <h2 class="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span>📝</span> Informasi Utama
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Nama Tempat -->
                <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">Nama Tempat Wisata <span class="text-rose-400">*</span></label>
                    <input type="text" name="name" value="{{ old('name', $spot->name) }}" required
                           class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
                </div>

                <!-- Kategori Wisata -->
                <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">Kategori Wisata <span class="text-rose-400">*</span></label>
                    <select name="category" required class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 transition">
                        <option value="Alam & Curug" {{ old('category', $spot->category) == 'Alam & Curug' ? 'selected' : '' }}>Alam & Curug</option>
                        <option value="Kuliner" {{ old('category', $spot->category) == 'Kuliner' ? 'selected' : '' }}>Kuliner</option>
                        <option value="Edukasi & Budaya" {{ old('category', $spot->category) == 'Edukasi & Budaya' ? 'selected' : '' }}>Edukasi & Budaya</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Jam Operasional -->
                <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">Jam Operasional</label>
                    <input type="text" name="operational_hours" value="{{ old('operational_hours', $spot->operational_hours) }}"
                           class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
                </div>

                <!-- Harga Tiket -->
                <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">Harga Tiket Masuk</label>
                    <input type="text" name="ticket_price" value="{{ old('ticket_price', $spot->ticket_price) }}"
                           class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
                </div>

                <!-- Rating -->
                <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">Rating Wisata (0.0 - 5.0)</label>
                    <input type="number" step="0.1" min="0" max="5" name="rating" value="{{ old('rating', $spot->rating) }}"
                           class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
                </div>
            </div>

            <!-- Checkbox Populer -->
            <div class="flex items-center gap-2 pt-1">
                <input type="checkbox" id="is_popular" name="is_popular" value="1" {{ old('is_popular', $spot->is_popular) ? 'checked' : '' }}
                       class="rounded bg-forest-700 border-white/30 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer">
                <label for="is_popular" class="text-xs text-white/90 font-medium cursor-pointer">
                    Tandai sebagai Tempat Wisata Populer
                </label>
            </div>
        </div>

        <!-- Lokasi Spasial & Peta Interaktif (PostGIS) -->
        <div class="rounded-2xl bg-forest-900/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span>🗺️</span> Lokasi & Koordinat Spasial (PostGIS)
                </h2>
                <span class="text-[11px] text-white/50">Geser pin marker untuk memperbarui lokasi</span>
            </div>

            <!-- Map Picker Container -->
            <div id="map-picker" class="h-64 sm:h-80 w-full rounded-xl border border-white/20 overflow-hidden shadow-inner z-10"></div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">Latitude (Lintang) <span class="text-rose-400">*</span></label>
                    <input type="number" step="any" id="input-lat" name="latitude" value="{{ old('latitude', $spot->latitude) }}" required
                           class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">Longitude (Bujur) <span class="text-rose-400">*</span></label>
                    <input type="number" step="any" id="input-lng" name="longitude" value="{{ old('longitude', $spot->longitude) }}" required
                           class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400 transition">
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">Alamat Lengkap</label>
                <input type="text" name="address" value="{{ old('address', $spot->address) }}"
                       class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">
            </div>
        </div>

        <!-- Deskripsi Wisata -->
        <div class="rounded-2xl bg-forest-900/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
            <h2 class="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span>📄</span> Deskripsi & Narasi
            </h2>

            <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">Deskripsi Ringkas</label>
                <textarea name="description" rows="2"
                          class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">{{ old('description', $spot->description) }}</textarea>
            </div>

            <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">Deskripsi Detail</label>
                <textarea name="detailed_description" rows="4"
                          class="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition">{{ old('detailed_description', $spot->detailed_description) }}</textarea>
            </div>
        </div>

        <!-- Foto & Galeri Wisata (Drag & Drop Reordering) -->
        <div class="rounded-2xl bg-forest-900/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <span>📸</span> Foto & Galeri Wisata
                    </h2>
                    <p class="text-[11px] text-white/60 mt-0.5">Unggah foto baru atau geser/drag kartu foto untuk mengatur urutan. <strong>Foto pertama/paling atas otomatis menjadi Foto Utama</strong>.</p>
                </div>
            </div>

            <!-- Upload Dropzone Area -->
            <div id="dropzone-area" class="border-2 border-dashed border-white/20 hover:border-emerald-400/80 bg-white/5 hover:bg-white/10 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group">
                <input type="file" id="photos-input" name="photos[]" multiple accept="image/*" class="hidden">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/30 text-emerald-300 group-hover:scale-110 transition border border-emerald-400/30">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <div class="text-xs font-semibold text-white">
                    Klik untuk pilih foto tambahan atau tarik file ke sini
                </div>
                <p class="text-[10px] text-white/50">Mendukung format JPG, PNG, WEBP hingga 10MB per foto</p>
            </div>

            <!-- Sortable Photos Container (List Drag & Drop) -->
            <div class="space-y-2">
                <div class="flex items-center justify-between text-xs text-white/70">
                    <span class="font-medium">Urutan Foto Terpasang (<span id="photo-count">0</span> foto):</span>
                    <span class="text-[10px] text-emerald-300/80 flex items-center gap-1">
                        <span>⇅</span> Drag handle kartu untuk mengubah urutan
                    </span>
                </div>

                <div id="photo-sortable-list" class="space-y-2.5 min-h-[50px] p-1.5 rounded-xl bg-black/20 border border-white/10">
                    <!-- Kartu foto akan di-render oleh JS -->
                </div>
            </div>
        </div>

        <!-- Tombol Aksi Simpan -->
        <div class="flex items-center justify-end gap-3 pt-2">
            <a href="{{ route('admin.spots.index') }}" class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition">
                Batal
            </a>
            <button type="submit" id="btn-submit" class="px-7 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition cursor-pointer flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Perbarui Tempat Wisata
            </button>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function () {
        // --- 1. Leaflet Map Picker ---
        const currentLat = parseFloat(document.getElementById('input-lat').value) || -6.5971;
        const currentLng = parseFloat(document.getElementById('input-lng').value) || 106.8060;

        const map = L.map('map-picker').setView([currentLat, currentLng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        const markerIcon = L.divIcon({
            className: 'custom-picker-pin',
            html: '<div style="background-color: #10b981; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });

        let marker = L.marker([currentLat, currentLng], { icon: markerIcon, draggable: true }).addTo(map);

        function updateInputs(lat, lng) {
            document.getElementById('input-lat').value = lat.toFixed(7);
            document.getElementById('input-lng').value = lng.toFixed(7);
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

        let photoItems = [];
        let newFileCounter = 0;
        const fileStore = new DataTransfer();

        // Inisialisasi foto yang sudah ada dari database
        const existingGallery = @json(is_array($spot->gallery) ? $spot->gallery : []);
        const primaryImage = @json($spot->image);

        // Pastikan primary image ada di urutan pertama jika belum di galeri
        let initialList = [...existingGallery];
        if (primaryImage && !initialList.includes(primaryImage)) {
            initialList.unshift(primaryImage);
        }

        initialList.forEach((src, idx) => {
            const fileName = src.split('/').pop();
            photoItems.push({
                id: 'existing_' + idx,
                fileId: null,
                src: src,
                name: fileName,
                size: 'Tersimpan di Backend'
            });
        });

        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-emerald-400', 'bg-white/10');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('border-emerald-400', 'bg-white/10');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-emerald-400', 'bg-white/10');
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
                    photoItems.push({
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

            if (photoItems.length === 0) {
                sortableList.innerHTML = `
                    <div class="py-8 text-center text-xs text-white/40">
                        Belum ada foto yang diunggah. Klik area di atas untuk menambahkan foto.
                    </div>
                `;
                syncOrderInput();
                return;
            }

            photoItems.forEach((item, index) => {
                const isPrimary = index === 0;
                const card = document.createElement('div');
                card.dataset.id = item.id;
                card.className = `flex items-center justify-between p-3 rounded-xl border transition group cursor-grab active:cursor-grabbing ${
                    isPrimary 
                        ? 'bg-forest-800/95 border-emerald-400/50 shadow-md ring-1 ring-emerald-400/30' 
                        : 'bg-forest-700/60 border-white/10 hover:border-white/20'
                }`;

                card.innerHTML = `
                    <div class="flex items-center gap-3 min-w-0">
                        <!-- Drag Handle -->
                        <div class="flex items-center text-white/30 group-hover:text-emerald-300 transition shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                        </div>

                        <!-- Thumbnail -->
                        <div class="relative h-14 w-20 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                            <img src="${item.src}" alt="${item.name}" class="h-full w-full object-cover">
                            ${isPrimary ? '<span class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-600 text-white uppercase tracking-wider shadow">Utama</span>' : ''}
                        </div>

                        <!-- Info -->
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">${item.name}</span>
                                ${isPrimary ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">★ Foto Utama</span>' : `<span class="text-[10px] text-white/40">Galeri #${index + 1}</span>`}
                            </div>
                            <p class="text-[11px] text-white/40 mt-0.5">${item.size || ''}</p>
                        </div>
                    </div>

                    <!-- Action: Remove -->
                    <button type="button" class="btn-remove-photo p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-300 transition" title="Hapus Foto">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
            handle: '.group',
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
