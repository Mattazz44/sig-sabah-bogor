# Product Requirements Document (PRD)
## SIG Wisata Sabah Bogor — Progressive Web App (PWA) & Mobile GIS

| Atribut Dokumen | Detail Informasi |
| :--- | :--- |
| **Nama Produk** | SIG Wisata Sabah Bogor (Jelajah Wisata Kota & Kabupaten Bogor) |
| **Tipe Aplikasi** | Progressive Web Application (PWA) & Hybrid Android App (Capacitor) |
| **Arsitektur** | Single Page Application (React 19 + Vite) terintegrasi REST API Laravel & PostGIS |
| **Status Dokumen** | Final / Production Ready (v1.0) |
| **Terakhir Diperbarui** | 12 November 2026 |

---

## 1. Ringkasan Produk & Tujuan (Product Overview & Objectives)

### 1.1 Latar Belakang Masalah
Kota dan Kabupaten Bogor memiliki puluhan destinasi wisata unggulan yang tersebar di berbagai kategori (**Alam & Curug**, **Kuliner**, serta **Edukasi & Budaya**). Wisatawan sering mengalami kendala ketika merencanakan perjalanan:
1. Sulit memvisualisasikan sebaran lokasi wisata secara spasial terhadap posisi GPS mereka saat ini.
2. Tidak adanya fitur perencanaan rute berantai (*multi-waypoints itinerary*) yang menghitung estimasi jarak dan waktu tempuh antartitik wisata secara otomatis.
3. Kurangnya wadah komunitas terintegrasi untuk melihat dokumentasi kondisi terkini tempat wisata dari sesama pengunjung.

### 1.2 Visi & Tujuan Produk
**SIG Wisata Sabah Bogor** hadir sebagai aplikasi **Sistem Informasi Geografis (SIG)** berbasis *Mobile-First Progressive Web App (PWA)* dan Android (Capacitor) yang menggabungkan eksplorasi peta interaktif, perhitungan jarak *real-time*, navigasi rute *multi-destinasi*, kurasi rekomendasi personal, dan jejaring aktivitas komunitas wisatawan dalam satu antarmuka bertema *Forest Green* (`#2c3b26` & `#4f5f3b`).

**Tujuan Utama:**
* Menyediakan peta interaktif cepat (60 FPS) dengan pengelompokan titik (*Marker Clustering*) dan batas wilayah administrasi Kota Bogor (*GeoJSON Boundary Layer*).
* Memudahkan pengguna menemukan destinasi terdekat menggunakan perhitungan jarak *geodesic* (rumus Haversine) dan estimasi waktu tempuh lalu lintas Bogor secara *real-time*.
* Memungkinkan perencanaan perjalanan satu titik maupun *Rute Custom Multi-Waypoints* langsung di dalam aplikasi menggunakan mesin rute OSRM (*Open Source Routing Machine*).
* Menyediakan ekosistem penyimpanan riwayat kunjungan, daftar favorit, dan *feed* berbagi foto perjalanan komunitas.

---

## 2. Target Pengguna & User Personas

| Persona | Profil & Karakteristik | Kebutuhan Utama (*Goals*) | Solusi pada Sabah Bogor |
| :--- | :--- | :--- | :--- |
| **1. Wisatawan Akhir Pekan (Luar Daerah / Jabodetabek)** | Usia 18–40 tahun, berkunjung singkat di akhir pekan menggunakan kendaraan pribadi/umum, mengakses via smartphone. | Ingin mengunjungi 2–3 tempat wisata sekaligus yang searah tanpa membuang waktu di jalan. | Fitur **Rute Custom Multi-Waypoints**, **Marker Clustering**, dan panel **RouteMetrics** untuk melihat akumulasi jarak & durasi perjalanan. |
| **2. Penjelajah Lokal & Pecinta Alam/Kuliner** | Mahasiswa/warga lokal Bogor yang mencari tempat *healing* (curug/alam) atau kuliner legendaris. | Mencari tempat populer berdasarkan kategori, melihat jam operasional & harga tiket, serta menyimpan daftar tempat impian. | Fitur **Filter Kategori**, **Pencarian Instan**, **Halaman Detail Wisata**, **Folder Favorit**, dan rekomendasi **Untuk Kamu**. |
| **3. Kontributor Komunitas (*Social Explorer*)** | Wisatawan aktif yang gemar mendokumentasikan foto kunjungan dan mengikuti penjelajah lain. | Membagikan foto aktivitas perjalanan, melihat kiriman komunitas terkini, dan memantau profil penjelajah lain. | Fitur **Feed Aktivitas (`Kamu` & `Komunitas`)**, **Modal Upload Foto**, **Halaman Profil Penjelajah**, serta **Drawer Notifikasi**. |
| **4. Pengelola Data Wisata (Admin)** | Tim pengelola konten/admin GIS. | Menambahkan titik koordinat wisata baru secara presisi lewat peta interaktif dan mengekspor data JSON. | Halaman **Admin Wisata Bogor (`/admin`)** dengan *interactive coordinate picker* dan penyimpanan persisten. |

---

## 3. Spesifikasi Fitur Utama (Functional Requirements)

### 3.1 Modul Explore (Peta Interaktif, Pencarian, & Filter Kategori)
* **Peta Interaktif Leaflet (`src/components/map/MapContainer.jsx`)**:
  * Menampilkan peta dasar OpenStreetMap yang berpusat di Kota Bogor (`[-6.598, 106.805]`, zoom awal `13`).
  * **Layer Batas Wilayah (`BogorBoundaryLayer.jsx`)**: Menampilkan poligon GeoJSON batas administrasi Kota Bogor dari endpoint `/api/boundary` (dengan fallback `src/data/bogor_boundary.json`) yang dapat dinyalakan/dimatikan lewat tombol kontrol peta.
  * **Marker Clustering Dinamis (`MarkerClusterGroup.jsx`)**: Mengelompokkan marker wisata yang berdekatan secara otomatis pada level zoom `<= 14` menggunakan algoritma *greedy spatial pixel distance* (`62px`), dan menguraikannya menjadi pin kategori individual saat peta di-zoom dekat (`>= 15`) atau saat cluster diklik (`flyToBounds`).
  * **Pin Marker Berwarna Kategori (`MapMarker.jsx` & `MapPopup.jsx`)**: Pin kustom untuk kategori **Alam & Curug** (`#1f8a5b`), **Kuliner** (`#ef8a22`), dan **Edukasi & Budaya** (`#e2489a`), dilengkapi *popup* ringkas berisi foto, rating, dan tombol menuju detail.
* **Kontrol Peta & Pelacakan GPS (`LocateControl.jsx` & `UserLocationMarker.jsx`)**:
  * Tombol **Lokasi Saya** memicu pelacakan GPS perangkat (melalui `@capacitor/geolocation` di Android atau `navigator.geolocation` di browser) dan menampilkan titik biru berdenyut (*pulse ring*) beserta akurasi GPS.
  * Tombol *toggle* cepat untuk menyembunyikan/menampilkan **Batas Wilayah** dan **Marker Clustering**.
* **Bottom Sheet Interaktif (`BottomSheet.jsx` & `TouristList.jsx`)**:
  * Mendukung mode *Peek* (~44% layar bawah sehingga peta tetap terlihat) dan mode *Expanded Full Screen* (100% layar dengan *gesture drag/flick* dan *momentum scroll*).
  * **Pencarian & Filter Kategori (`SearchBar.jsx` & `CategoryFilter.jsx`)**: Filter instan berdasarkan nama wisata dan *pill* kategori (`Semua`, `Alam & Curug`, `Kuliner`, `Edukasi & Budaya`), ditambah *highlight* **"Populer dengan turis"** dan pengurutan (`Paling Relevan` / `Paling sering dikunjungi`).

### 3.2 Halaman Detail Destinasi Wisata (`TouristDetailPage.jsx`)
* Menampilkan *Hero Image* layar penuh di bagian atas dengan tombol **Kembali**, **Bagikan** (Web Share API / *clipboard fallback*), dan **Favorit (Hati)**.
* **Baris Informasi Cepat (3 Kolom)**: Menampilkan **Waktu Operasional**, **Harga Tiket**, dan **Waktu ke Destinasi** (dihitung secara dinamis dari posisi GPS pengguna menggunakan `src/utils/distance.js`).
* Menampilkan deskripsi lengkap multi-paragraf dan **Galeri Kolase Foto Estetik** (*staggered rounded collage*).
* **Tombol Melayang "Mulai Perjalanan"**: Memicu transisi otomatis ke tab **Navigasi** dan langsung menggambar rute jalan raya dari posisi pengguna ke tempat wisata tersebut.

### 3.3 Navigasi Internal Satu Titik & Multi-Waypoints (`RoutingMachine.jsx` & `RouteMetrics.jsx`)
* **Mesin Rute Jalan Raya OSRM (`RoutingMachine.jsx`)**:
  * Terintegrasi dengan `leaflet-routing-machine` dan layanan OSRM (`https://router.project-osrm.org/route/v1`, profil `car`).
  * Mendukung **navigasi destinasi tunggal** (`GPS User ➔ Destinasi`) maupun **navigasi Rute Custom Multi-Waypoints** (`GPS User ➔ Transit 1 ➔ Transit 2 ➔ Destinasi Akhir`).
  * Menggambar garis rute biru tegas (`#3b82f6`) di atas peta dan melakukan *auto-fitBounds* proporsional agar seluruh titik keberangkatan, transit, dan tujuan akhir terlihat utuh di layar.
* **Panel Informasi Rute Melayang (`RouteMetrics.jsx`)**:
  * Menampilkan nama destinasi atau rangkaian rute berantai (contoh: `Museum of zoology ➔ Museum PETA`), status badge (`Navigasi Aktif` / `Rute Custom Aktif`), serta **Estimasi Waktu Total** (menit) dan **Jarak Total** (KM) hasil kalkulasi OSRM.
* **Kontrol Penghentian Navigasi**: Tombol melayang **"Akhiri Perjalanan"** menghapus garis rute dari peta dan mengembalikan pengguna ke tampilan **Explore**.

### 3.4 Halaman Rekomendasi Personal "Untuk Kamu" (`ForYouPage.jsx`)
* Terproteksi oleh status autentikasi (*login gate*): menampilkan *empty state* ajakan masuk jika pengguna belum login.
* Saat pengguna sudah login, mengambil data kurasi dari endpoint `GET /api/for-you?favorites=...&recent=...` (dengan *fallback* cerdas berbasis daftar wisata lokal):
  1. **Berdasarkan aktivitas terakhir kamu**: Daftar tempat wisata yang direkomendasikan lengkap dengan tombol *toggle* favorit.
  2. **Lanjutkan Perjalanan? (Terakhir dilihat)**: Kartu akses cepat menuju destinasi terakhir yang baru saja dibuka pengguna.

### 3.5 Halaman Aktivitas Tersimpan & Perancang Rute Custom (`SavedActivitiesPage.jsx` & `CustomRoutePage.jsx`)
* **Tampilan Grid 3 Folder Koleksi (`SavedActivitiesPage.jsx`)**:
  1. **Folder Terakhir Dilihat**: Menyimpan hingga 10 destinasi terakhir yang dikunjungi pengguna (`useRecentlyViewed.js` di `localStorage`) dan menampilkannya dalam daftar khusus.
  2. **Folder Rute Custom**: Membuka halaman manajemen rute perjalanan multi-destinasi (`CustomRoutePage.jsx`).
  3. **Folder Favorit**: Menampilkan seluruh destinasi yang ditandai hati oleh pengguna (`useFavorites.js`), dilengkapi fitur pengurutan (**Terbaru**, **Terlama**, **Nama A-Z**).
* **Pencatatan Aktivitas Perjalanan Saya**:
  * Tombol **`+`** di kanan atas memungkinkan pengguna mencatat rencana/aktivitas perjalanan baru (Nama Aktivitas & Lokasi Wisata) yang disimpan ke `POST /api/saved-activities`.
* **Perancang Rute Custom Multi-Titik (`CustomRoutePage.jsx`)**:
  * Menampilkan daftar rute perjalanan tersimpan lengkap dengan indikator *stepper* urutan titik singgah (`Titik Awal`, `Transit`, `Destinasi Akhir`), akumulasi jarak/waktu, dan tombol **"Mulai Perjalanan"**.
  * **Modal "+ Buat Rute"**: Pengguna dapat memberi nama rute baru, memilih 2 atau lebih destinasi wisata dari daftar *checkbox* bergambar, menyimpannya ke backend (`POST /api/custom-routes`), dan langsung menjalankan navigasi multi-titik di peta.

### 3.6 Feed Aktivitas Komunitas & Upload Foto (`ActivitiesPage.jsx`)
* Memiliki navigasi *sub-tab* terkunci di bagian atas:
  * **Tab `Kamu`**: Menampilkan riwayat dokumentasi foto aktivitas milik pengguna yang sedang login.
  * **Tab `Komunitas`**: Menampilkan *feed* publik berisi dokumentasi perjalanan dari seluruh pengguna aplikasi (`GET /api/activities`).
* **Fitur Posting Foto (`+ Post`)**:
  * Membuka modal unggah aktivitas yang dilengkapi area *dropzone* / pemilih file foto dari galeri perangkat (`input type="file" accept="image/*"` dengan pratinjau langsung `URL.createObjectURL`), input lokasi wisata, dan cerita/keterangan perjalanan (`POST /api/activities`).
* **Interaksi Antar-Profil**: Mengetuk nama atau foto profil pengguna pada kiriman komunitas akan membuka halaman **Profil Penjelajah** pengguna tersebut.

### 3.7 Halaman Profil Pengguna, Notifikasi, Sistem Autentikasi, & Panel Admin
* **Halaman Profil (`ProfilePage.jsx`)**:
  * Mendukung 2 mode tampilan: **Profil Saya** (menampilkan avatar, nama, email, statistik Rute Custom/Pengikut/Mengikuti, daftar *Rute Saya*, serta tombol **Logout**) dan **Profil Penjelajah Lain** (menyembunyikan email pribadi, menampilkan tombol interaktif **Ikuti Perjalanan / Mengikuti**, serta kiriman aktivitas terkini pengguna tersebut).
* **Drawer Notifikasi (`NotificationDrawer.jsx`)**:
  * Menampilkan daftar pemberitahuan interaksi komunitas (seperti *like* pada rute custom, unggahan aktivitas baru, dan ulasan destinasi baru) dengan penanda belum dibaca (*unread badge*).
* **Modal Autentikasi Global (`LoginModal.jsx`)**:
  * Mendukung login menggunakan Email/Username & Kata Sandi ke endpoint `POST /api/auth/login` maupun opsi cepat **Masuk dengan Google**, dilengkapi informasi akun demo siap pakai (`ambalingham@gmail.com` / `password123`).
* **Halaman Admin Lokasi Wisata (`AdminPage.jsx` & `AdminLocationPickerMap.jsx`)**:
  * Diakses melalui rute `/admin`, memiliki tab **Tambah lokasi** (form informasi, jam operasional, peta interaktif penentu koordinat *Latitude/Longitude*, dan area *drag-and-drop* foto) serta tab **Daftar (x)** dengan fitur **Salin data (JSON)** ke *clipboard* (`useAdminLocations.js`).

---

## 4. Arsitektur Teknis & Tech Stack

### 4.1 Tech Stack Utama
* **Frontend Framework**: React 19 (`^19.3.1`) + Vite 8 (`^8.3.4`)
* **Routing**: React Router DOM v7 (`^7.18.4`)
* **Styling & Design System**: Tailwind CSS v4 (`^4.3.3` via `@tailwindcss/vite`) dengan *custom design tokens* (`--color-forest-900: #2c3b26`, `--color-forest-700: #4f5f3b`)
* **Mesin Peta & GIS**:
  * `leaflet` (`^1.9.4`) & `react-leaflet` (`^5.0.0`)
  * `leaflet-routing-machine` (`^3.2.12`) terhubung ke OSRM API (`router.project-osrm.org`)
* **Hybrid Mobile Runtime**: Capacitor v8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`)
* **State Management & Persistence**: React Hooks (`useState`, `useMemo`, `useCallback`, `useEffect`) + Custom Hooks berbasis `localStorage` (`useFavorites`, `useRecentlyViewed`, `useAdminLocations`, `useUserLocation`, `useMapControls`)
* **Backend & Database Integration**: REST API Laravel (`/api/tourists`, `/api/boundary`, `/api/for-you`, `/api/activities`, `/api/saved-activities`, `/api/custom-routes`, `/api/auth/login`, `/api/media/{path}`) dengan dukungan penuh *tunneling* Ngrok.

### 4.2 Diagram Alur Data & Arsitektur Komponen
```
[ Pengguna (Browser PWA / Android APK) ]
                  │
                  ▼
        [ src/App.jsx (Root State & Router) ]
          ├── Custom Hooks: useUserLocation, useFavorites, useRecentlyViewed, useAdminLocations
          ├── Utilitas API & Media: apiFetch() (api.js) + getImageUrl() (imageHelper.js) + SafeImage.jsx
          │
          ├──► Tab "Explore" & "Navigasi"
          │      ├── MapContainer.jsx (Leaflet Canvas + TileLayer)
          │      │     ├── BogorBoundaryLayer.jsx (GeoJSON Kota Bogor)
          │      │     ├── MarkerClusterGroup.jsx ──► MapMarker.jsx ──► MapPopup.jsx
          │      │     ├── UserLocationMarker.jsx & LocateControl.jsx
          │      │     └── RoutingMachine.jsx (OSRM) + RouteMetrics.jsx
          │      └── SidebarContainer.jsx ──► BottomSheet.jsx ──► TouristList.jsx ──► TouristCard.jsx
          │
          ├──► Halaman Detail: TouristDetailPage.jsx
          ├──► Tab "Untuk Anda": ForYouPage.jsx
          ├──► Tab "Tersimpan": SavedActivitiesPage.jsx ──► CustomRoutePage.jsx
          ├──► Tab "Aktivitas": ActivitiesPage.jsx ──► NotificationDrawer.jsx
          ├──► Profil & Auth: ProfilePage.jsx + LoginModal.jsx
          └──► Rute "/admin": AdminPage.jsx ──► AdminLocationPickerMap.jsx
```

---

## 5. Non-Functional Requirements (NFR)

1. **Desain Mobile-First & Ergonomi Satu Tangan**:
   * Seluruh halaman dan modal dirancang proporsional pada ukuran layar *smartphone* (`max-w-md mx-auto`, `h-dvh`), dengan *Bottom Navigation Bar* tetap di bagian bawah (`z-[600]`) dan dukungan `env(safe-area-inset-bottom)`.
2. **Performa Tinggi 60 FPS & Isolasi Komposit GPU**:
   * *Scroll container* pada *Bottom Sheet*, *Untuk Kamu*, *Tersimpan*, dan *Feed Aktivitas* menggunakan isolasi layer GPU (`overscroll-y-contain will-change-transform transform-gpu`) sehingga aktivitas *scrolling* cepat tidak memicu *re-layout* pada kanvas peta Leaflet di latar belakang.
   * Peta Leaflet dioptimalkan dengan `preferCanvas={true}`, `updateWhenIdle={true}`, dan `keepBuffer={2}`.
   * Seluruh kartu wisata dan tombol navigasi menggunakan *tactile feedback* ringan (`active:scale-[0.98] transition-transform duration-150`).
3. **Optimasi Pemuatan Gambar (`SafeImage.jsx`) & Anti Memory Leak**:
   * Setiap gambar menampilkan **Shimmer Skeleton Loader** (`animate-pulse shimmer-skeleton`) selama di-fetch dari server, lalu muncul dengan transisi *fade-in* halus (`transition-opacity duration-300 opacity-100`).
   * Menggunakan atribut HTML `loading="lazy"` dan `decoding="async"`, serta wajib memanggil `URL.revokeObjectURL` saat komponen *unmount* agar memori RAM perangkat seluler tetap hemat.
4. **Ketahanan Jaringan, Bypass Ngrok, & Fallback Offline**:
   * Seluruh permintaan API (`apiFetch`) dan pengambilan gambar (`SafeImage` / `imageHelper`) menyertakan header `'ngrok-skip-browser-warning': 'true'` dan normalisasi otomatis domain `localhost:8000` ke `VITE_API_BASE_URL`.
   * Apabila gambar dari server gagal dimuat (404 atau *offline*), sistem otomatis menampilkan *inline SVG Data URI Placeholder* bertema hijau hutan tanpa memicu *infinite error loop*.

