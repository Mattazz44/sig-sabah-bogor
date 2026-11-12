# SIG Wisata Sabah Bogor (Progressive Web App & Mobile GIS)

**SIG Wisata Sabah Bogor** adalah aplikasi **Sistem Informasi Geografis (SIG)** berbasis *Mobile-First Progressive Web App (PWA)* dan Android (Capacitor) yang dirancang untuk membantu wisatawan menjelajahi, merencanakan rute perjalanan, dan berbagi pengalaman wisata di wilayah **Kota & Kabupaten Bogor**.

Aplikasi ini memadukan peta interaktif **Leaflet**, pengelompokan lokasi otomatis (**Marker Clustering**), batas administrasi wilayah Kota Bogor (**GeoJSON Boundary**), perhitungan jarak & estimasi waktu tempuh *real-time* dari GPS pengguna, serta fitur **Rute Custom Multi-Waypoints** berbasis mesin rute jalan raya **OSRM**.

---

## Fitur Unggulan

1. **Eksplorasi Peta Interaktif & Marker Clustering (`Explore`)**
   * Visualisasi sebaran destinasi wisata Bogor berdasarkan 3 kategori utama: **Alam & Curug**, **Kuliner**, serta **Edukasi & Budaya**.
   * Dilengkapi **Layer Batas Wilayah Kota Bogor (GeoJSON)** dan **Marker Clustering** otomatis yang dapat dinyalakan/dimatikan langsung dari tombol kontrol peta.
   * **Bottom Sheet ala Google Maps**: Geser ke atas (*expand*) untuk menjelajahi daftar kartu wisata lengkap dengan pencarian instan, filter kategori, dan pengurutan.

2. **Pelacakan GPS Real-Time & Kalkulasi Jarak Dinamis**
   * Mendeteksi koordinat GPS pengguna menggunakan **HTML5 Geolocation API** dan **Capacitor Geolocation** (Android).
   * Menghitung jarak *geodesic* (Haversine) dan estimasi waktu tempuh berkendara menuju setiap tempat wisata secara otomatis dari posisi pengguna saat ini.

3. **Navigasi Internal Satu Titik & Rute Custom Multi-Waypoints (`Navigasi`)**
   * Menggambar garis rute perjalanan langsung di atas peta aplikasi menggunakan **Leaflet Routing Machine (OSRM)**.
   * Mendukung rute berantai banyak titik sekaligus (contoh: *Lokasi Anda ➔ Museum Zoologi ➔ Museum PETA*) lengkap dengan panel **RouteMetrics** yang menampilkan total jarak (KM) dan akumulasi waktu tempuh (Menit).

4. **Rekomendasi Personal (`Untuk Anda`) & Koleksi Tersimpan (`Tersimpan`)**
   * Kurasi rekomendasi tempat wisata berdasarkan riwayat kunjungan dan daftar favorit pengguna.
   * Pengelolaan koleksi dalam 3 folder rapi: **Terakhir Dilihat**, **Rute Custom** (perancang rute multi-destinasi), dan **Favorit**, ditambah fitur pencatatan rencana aktivitas perjalanan.

5. **Feed Aktivitas Komunitas & Upload Foto (`Aktivitas`)**
   * Berbagi dokumentasi foto perjalanan ke tab **Kamu** dan **Komunitas** lengkap dengan unggah foto dari galeri HP, keterangan cerita, halaman **Profil Penjelajah**, dan **Drawer Notifikasi**.

6. **Performa 60 FPS & Optimasi Gambar `SafeImage`**
   * Dilengkapi *Shimmer Skeleton Loader*, *lazy loading*, `decoding="async"`, pembersihan memori `URL.revokeObjectURL`, isolasi komposit GPU (`transform-gpu`), serta dukungan penuh *bypass* halaman intersitial server **Ngrok**.

---

## Prasyarat Sistem (Prerequisites)

Sebelum menjalankan proyek ini di perangkat lokal Anda, pastikan sudah menginstal:
* **Node.js** versi `18.x` atau `20.x+` (disarankan LTS terbaru)
* **npm** (bawaan instalasi Node.js)
* **Git**
* *(Opsional)* **PHP 8.2+ & Composer** jika ingin menjalankan server *Backend* Laravel secara lokal di folder `backend/`.

---

## Cara Instalasi & Menjalankan Proyek (Local Setup)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi **Frontend** di komputer Anda:

### 1. Clone Repository
```bash
git clone https://github.com/Mattazz44/sig-sabah-bogor.git
cd "sig-sabah-bogor"
```

### 2. Masuk ke Direktori Frontend & Instal Dependensi
```bash
cd "Front end"
npm install
```

### 3. Konfigurasi File Environment (`.env`)
Buat atau perbarui file `.env` di dalam folder `Front end/` (`Front end/.env`) dan atur variabel `VITE_API_BASE_URL` sesuai alamat server Backend (lokal maupun link HTTPS Ngrok):

```env
# Contoh jika menggunakan server Backend Laravel lokal:
VITE_API_BASE_URL=http://localhost:8000

# Contoh jika terhubung ke server Backend tim melalui Ngrok:
# VITE_API_BASE_URL=https://nama-subdomain-anda.ngrok-free.dev
```

### 4. Jalankan Server Development Vite
```bash
npm run dev
```
Setelah server berjalan, buka browser dan akses alamat yang tampil di terminal (umumnya **`http://localhost:5173`**).

### 5. Perintah Tambahan (Build & Preview Produksi)
```bash
# Mem-build aplikasi untuk produksi ke folder dist/
npm run build

# Menjalankan pratinjau hasil build produksi
npm run preview
```

---

## Cara Menggunakan Aplikasi (User Guide)

### 1. Mencari & Memfilter Tempat Wisata
1. Buka aplikasi pada tab **Explore** (ikon kaca pembesar di navigasi bawah).
2. Tarik panel bawah (*Bottom Sheet*) ke atas untuk membuka daftar wisata layar penuh, atau gunakan langsung dari mode *peek*.
3. Ketik nama destinasi pada kolom **Cari tempat wisata di Bogor...** atau ketuk salah satu *pill* kategori (**Semua**, **Alam & Curug**, **Kuliner**, **Edukasi & Budaya**).
4. Ketuk salah satu kartu wisata atau pin marker di peta untuk membuka **Halaman Detail Wisata** (informasi jam operasional, harga tiket, waktu tempuh, dan galeri foto).

### 2. Menggunakan Fitur "Lokasi Saya" & Kontrol Layer Peta
1. Pada tampilan peta **Explore**, perhatikan 3 tombol melayang di sisi kanan bawah peta:
   * **Tombol Crosshair GPS (Paling Bawah)**: Ketuk untuk mengaktifkan izin lokasi perangkat dan memusatkan kamera peta ke posisi GPS Anda saat ini.
   * **Tombol Cluster (Tengah)**: Ketuk untuk mengaktifkan/menonaktifkan pengelompokan otomatis marker wisata (*Marker Clustering*).
   * **Tombol Peta/Poligon (Atas)**: Ketuk untuk menampilkan/menyembunyikan garis batas wilayah administrasi Kota Bogor.

### 3. Membuat & Menjalankan Navigasi Rute Custom Multi-Titik
1. Masuk ke akun Anda terlebih dahulu, lalu buka tab **Tersimpan** (ikon hati di navigasi bawah).
2. Pilih folder **Rute custom**.
3. Untuk membuat rute baru, ketuk tombol **`+ Buat Rute`** di pojok kanan atas:
   * Masukkan **Nama Rute** (contoh: *Tur Edukasi & Kuliner Bogor*).
   * Centang **2 atau lebih destinasi singgah** yang ingin dikunjungi secara berurutan.
   * Ketuk **Simpan Rute**.
4. Pada kartu rute yang sudah dibuat, ketuk tombol **"Mulai Perjalanan"**.
5. Aplikasi akan otomatis beralih ke tab **Navigasi**, menampilkan garis rute biru dari lokasi Anda melewati seluruh titik transit hingga tujuan akhir, serta memunculkan panel estimasi jarak dan waktu total di bagian atas layar.
6. Ketuk tombol merah **"Akhiri Perjalanan"** di bagian bawah layar jika ingin menghentikan mode navigasi.

### 4. Login Akun & Membagikan Foto Aktivitas Perjalanan
1. Ketuk ikon profil di kanan atas atau buka tab **Untuk Anda** / **Aktivitas**, lalu klik **Masuk ke Akun**.
2. Anda dapat masuk menggunakan akun demo yang tersedia:
   * **Email**: `ambalingham@gmail.com`
   * **Kata Sandi**: `password123`
   * *(Atau klik tombol **Masuk dengan Google**).*
3. Setelah login, buka tab **Aktivitas** (ikon grafik detak di navigasi bawah) lalu ketuk tombol **`+ Post`** di kanan atas.
4. Pilih foto dokumentasi dari galeri HP/komputer Anda, isi nama **Lokasi Wisata** dan **Cerita / Keterangan**, lalu ketuk **Bagikan ke Komunitas**.
5. Ketuk foto profil di pojok kanan atas kapan saja untuk membuka **Profil Saya** atau melakukan **Logout**.

### 5. Mengakses Halaman Admin Wisata (`/admin`)
* Arahkan URL browser ke `http://localhost:5173/admin` untuk membuka panel **Admin Wisata Bogor**.
* Di halaman ini Anda dapat menambahkan titik lokasi wisata baru dengan mengetuk peta interaktif (koordinat *Latitude* & *Longitude* terisi otomatis), mengunggah foto, dan menyalin seluruh data dalam format JSON melalui tab **Daftar**.

---

## Struktur Folder Proyek

```text
project sabah bogor/
├── PRD.md                                  # Dokumen Spesifikasi Produk (Product Requirements Document)
├── README.md                               # Dokumentasi Utama Proyek & Panduan Penggunaan
├── Front end/                              # Aplikasi Utama Frontend (React 19 + Vite + Tailwind CSS)
│   ├── .env                                # Variabel environment (VITE_API_BASE_URL)
│   ├── capacitor.config.json               # Konfigurasi aplikasi hybrid Android Capacitor
│   ├── index.html                          # Entry point HTML
│   ├── package.json                        # Daftar dependensi dan script npm
│   ├── vite.config.js                      # Konfigurasi bundler Vite & proxy API
│   └── src/
│       ├── main.jsx                        # Bootstrapper React DOM & BrowserRouter
│       ├── App.jsx                         # Root component, state global, & pengatur tab/routing
│       ├── index.css                       # Konfigurasi Tailwind CSS, tema warna, & animasi shimmer
│       ├── components/
│       │   ├── map/                        # Komponen khusus peta interaktif Leaflet
│       │   │   ├── AdminLocationPickerMap.jsx
│       │   │   ├── BogorBoundaryLayer.jsx
│       │   │   ├── LocateControl.jsx
│       │   │   ├── MapContainer.jsx
│       │   │   ├── MapController.jsx
│       │   │   ├── MapMarker.jsx
│       │   │   ├── MapPopup.jsx
│       │   │   ├── MarkerClusterGroup.jsx
│       │   │   ├── RouteMetrics.jsx
│       │   │   ├── RoutingMachine.jsx
│       │   │   └── UserLocationMarker.jsx
│       │   ├── pages/                      # Halaman-halaman fitur utama aplikasi
│       │   │   ├── ActivitiesPage.jsx
│       │   │   ├── AdminPage.jsx
│       │   │   ├── CustomRoutePage.jsx
│       │   │   ├── ForYouPage.jsx
│       │   │   ├── ProfilePage.jsx
│       │   │   ├── SavedActivitiesPage.jsx
│       │   │   └── TouristDetailPage.jsx
│       │   ├── sidebar/                    # Panel daftar kartu tempat wisata
│       │   │   ├── SidebarContainer.jsx
│       │   │   ├── TouristCard.jsx
│       │   │   └── TouristList.jsx
│       │   └── ui/                         # Komponen antarmuka reusable (BottomSheet, Modal, SafeImage)
│       │       ├── BottomNav.jsx
│       │       ├── BottomSheet.jsx
│       │       ├── CategoryFilter.jsx
│       │       ├── LoginModal.jsx
│       │       ├── NotificationDrawer.jsx
│       │       ├── SafeImage.jsx
│       │       ├── SearchBar.jsx
│       │       ├── categories.js
│       │       └── sheetMetrics.js
│       ├── data/
│       │   └── bogor_boundary.json         # Data GeoJSON fallback batas wilayah Kota Bogor
│       ├── hooks/                          # Custom React Hooks (Geolocation & LocalStorage state)
│       │   ├── useAdminLocations.js
│       │   ├── useFavorites.js
│       │   ├── useMapControls.js
│       │   ├── useRecentlyViewed.js
│       │   └── useUserLocation.js
│       └── utils/                          # Fungsi utilitas API, kalkulasi jarak, & helper gambar
│           ├── api.js
│           ├── distance.js
│           └── imageHelper.js
└── backend/                                # Server REST API Backend (Laravel & PostGIS)
```

---

## Tim Pengembang
Dikembangkan oleh Tim **Pemuda berkaca mata**.
