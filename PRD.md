# Product Requirements Document (PRD)
## SIG Wisata Sabah Bogor — Progressive Web App (PWA) & Mobile GIS

| Atribut Dokumen | Detail Informasi |
| :--- | :--- |
| **Nama Produk** | SIG Wisata Sabah Bogor (Jelajah Wisata Kota & Kabupaten Bogor) |
| **Tipe Aplikasi** | Progressive Web Application (PWA) & Hybrid Android App (Capacitor) |
| **Arsitektur** | SPA (`React 19 + Vite 8 + MapLibre GL`) terintegrasi REST API `Laravel 13 + Sanctum + Spatial DB (PostGIS/MySQL/SQLite)` |
| **Status Dokumen** | Updated / Standardized Local Dev & Security Hardened (v1.2) |
| **Terakhir Diperbarui** | 25 November 2026 |

---

## 1. Ringkasan Produk & Tujuan (Product Overview & Objectives)

### 1.1 Latar Belakang Masalah
Kota dan Kabupaten Bogor memiliki puluhan destinasi wisata unggulan yang tersebar di berbagai kategori (**Alam & Curug**, **Kuliner**, serta **Edukasi & Budaya**). Wisatawan sering mengalami kendala ketika merencanakan perjalanan:
1. Sulit memvisualisasikan sebaran lokasi wisata secara spasial terhadap posisi GPS mereka saat ini.
2. Tidak adanya fitur perencanaan rute berantai (*multi-waypoints itinerary*) yang menghitung estimasi jarak dan waktu tempuh antartitik wisata secara otomatis.
3. Kurangnya wadah komunitas terintegrasi yang aman untuk melihat dan berbagi dokumentasi kondisi terkini tempat wisata dari sesama pengunjung.

### 1.2 Visi & Tujuan Produk
**SIG Wisata Sabah Bogor** hadir sebagai aplikasi **Sistem Informasi Geografis (SIG)** berbasis *Mobile-First Progressive Web App (PWA)* dan Android (Capacitor) yang menggabungkan eksplorasi peta 3D interaktif, perhitungan jarak *real-time*, navigasi rute *multi-destinasi*, kurasi rekomendasi personal, dan jejaring aktivitas komunitas wisatawan dalam estetika **Modern Apple (Liquid Glass & Apple Maps) + Subtle Retro** (*Deep Forest Charcoal* `#111711`, *Classic Macintosh Bone* `#F2ECE1`, dan *Vintage Amber* `#DFAA63`).

**Tujuan Utama:**
* Menyediakan peta interaktif cepat (60 FPS) berbasis MapLibre GL 3D dengan pengelompokan titik (*Marker Clustering*) dan batas wilayah administrasi Kota Bogor (*GeoJSON Boundary Layer*).
* Memudahkan pengguna menemukan destinasi terdekat menggunakan perhitungan jarak *geodesic* (rumus Haversine) dan estimasi waktu tempuh secara *real-time*.
* Memungkinkan perencanaan perjalanan satu titik maupun *Rute Custom Multi-Waypoints* langsung di dalam aplikasi menggunakan mesin rute OSRM (*Open Source Routing Machine*).
* Menyediakan sistem autentikasi aman berbasis **Laravel Sanctum Bearer Token** & **Google OAuth One-Time Code Exchange**, pemisahan peran **Role-Based Access Control (RBAC)** (`user` vs `admin`), serta proteksi kepemilikan data pengguna.

---

## 2. Target Pengguna & Role-Based Access Control (RBAC)

### 2.1 User Personas & Hak Akses
| Persona / Role | Karakteristik | Kebutuhan Utama (*Goals*) | Hak Akses Sistem (RBAC) |
| :--- | :--- | :--- | :--- |
| **Tamu (Unauthenticated)** | Wisatawan yang baru membuka aplikasi/PWA. | Menjelajahi peta wisata, mencari lokasi, membaca detail destinasi, melihat rute navigasi & feed komunitas publik. | Akses *read-only* pada `/api/tourists`, `/api/boundary`, `/api/for-you`, `/api/activities` (publik), `/api/users/{id}` (tanpa email), dan `/api/media/{filename}`. |
| **Penjelajah (`role: 'user'`)** | Wisatawan terdaftar via registrasi email/password atau Google OAuth. | Menyimpan aktivitas perjalanan, merancang *Rute Custom Multi-Waypoints*, mengunggah foto ke feed komunitas, mengedit avatar profil, serta mengikuti penjelajah lain. | Hak penuh atas data milik sendiri yang terikat ke `$request->user()->id` via token Sanctum Bearer. Ditolak (`403`) saat mengakses `/admin` atau API mutasi destinasi wisata. |
| **Administrator (`role: 'admin'`)** | Tim pengelola konten/admin GIS. | Menambah, mengedit, dan menghapus data destinasi wisata beserta koordinat peta (`Latitude`/`Longitude` + kolom spasial `geom`), serta moderasi postingan aktivitas bila diperlukan. | Akses penuh panel web `/admin*` (guard `web` + middleware `admin`) dan API mutasi `/api/tourists*` (`auth:sanctum` + middleware `admin`), serta hak moderasi `DELETE /api/activities/{id}`. |

### 2.2 Aturan Proteksi Role (`users.role`)
* Tabel `users` memiliki kolom `role` terindeks dengan nilai default `'user'`.
* Atribut `role` **dikecualikan** dari daftar mass-assignment (`#[Fillable]`) pada model `User` sehingga pendaftar publik tidak dapat menyisipkan `"role": "admin"` melalui endpoint registrasi maupun OAuth.
* Penetapan role `'admin'` hanya dapat dilakukan di server (seeder/migrasi atau *privilege update* eksplisit melalui `$user->forceFill(['role' => 'admin'])`).
* Middleware `EnsureUserIsAdmin` (`admin`) memverifikasi `$request->user()->isAdmin()` di seluruh rute `/admin*` dan rute mutasi `/api/tourists*`. Login form admin (`POST /login`) menolak akun non-admin sebelum sesi dibuat.

---

## 3. Spesifikasi Fitur Utama (Functional Requirements)

### 3.1 Modul Explore (Peta Interaktif 3D, Pencarian, & Filter Kategori)
* **Peta Interaktif MapLibre GL (`src/components/map/MapContainer.jsx`)**:
  * Menampilkan peta 3D dengan perspektif (`pitch: 55`, pusat Kota Bogor `[106.805, -6.598]`).
  * **Layer Batas Wilayah (`BogorBoundaryLayer.jsx`)**: Poligon GeoJSON batas administrasi Kota Bogor dari endpoint `/api/boundary` dengan fallback lokal `src/data/bogor_boundary.json`.
  * **Marker Clustering Dinamis (`MarkerClusterGroup.jsx`)**: Mengelompokkan marker pada zoom `<= 14` (`CLUSTER_RADIUS_PX = 62`) dan menguraikannya menjadi pin kategori saat zoom lebih dekat atau cluster diklik.
  * **Pin Marker & Liquid Glass Mini-Popup (`MapMarker.jsx` & `MapPopup.jsx`)**: Pin kategori **Alam & Curug**, **Kuliner**, dan **Edukasi & Budaya** dengan *sonar pulse* hover sync serta popup mini-card berisi foto, rating, dan tombol cepat menuju detail.
* **Kontrol Peta & Pelacakan GPS (`LocateControl.jsx` & `UserLocationMarker.jsx`)**:
  * Deteksi GPS melalui `@capacitor/geolocation` di Android atau HTML5 Geolocation API di browser.
* **Panel Daftar Wisata (`SidebarContainer.jsx`, `BottomSheet.jsx`, `TouristList.jsx`)**:
  * *Bottom Sheet* mobile responsif (default snap awal ~`38vh`, mendukung drag *peek* hingga layar penuh) dan floating sidebar proporsional untuk iPad/Desktop.
  * Pencarian instan, filter kategori, filter radius, dan *highlight* destinasi populer.

### 3.2 Halaman Detail Destinasi Wisata (`TouristDetailPage.jsx`)
* Tata letak *Apple Place Sheet* responsif (1 kolom di mobile, 2 kolom di tablet/desktop).
* Menampilkan *Hero Image*, tombol **Kembali**, **Bagikan**, dan **Favorit**, ringkasan **Jam Buka**, **Harga Tiket**, dan **Estimasi Tiba**, deskripsi lengkap, galeri foto interaktif (*Stacked Photo Deck*), rekomendasi destinasi sekitar, serta tombol **"Mulai Perjalanan"**.

### 3.3 Navigasi Internal Satu Titik & Multi-Waypoints (`RoutingMachine.jsx` & `RouteMetrics.jsx`)
* Mengambil rute jalan raya dari OSRM (`router.project-osrm.org`) dan menggambar garis rute beranimasi (*polyline casing & line*) untuk satu destinasi maupun *Rute Custom Multi-Waypoints*.
* Panel instrumen **RouteMetrics** menampilkan nama/rute aktif, estimasi durasi, dan total jarak tempuh, dilengkapi kontrol **"Akhiri Perjalanan"**.

### 3.4 Halaman Rekomendasi Personal "Untuk Anda" (`ForYouPage.jsx`)
* Mengambil kurasi dari `GET /api/for-you?favorites=...&recent=...` dengan *fallback* cerdas berbasis daftar wisata lokal, menampilkan seksi rekomendasi sesuai preferensi kategori serta akses cepat **"Lanjutkan Perjalanan"**.

### 3.5 Halaman Aktivitas Tersimpan & Perancang Rute Custom (`SavedActivitiesPage.jsx` & `CustomRoutePage.jsx`)
* **Grid 3 Koleksi**: **Terakhir Dilihat** (`useRecentlyViewed.js`), **Rute Custom**, dan **Favorit** (`useFavorites.js`).
* **Aktivitas Tersimpan & Rute Custom Terautentikasi**:
  * Pengambilan dan penyimpanan data (`GET /api/saved-activities`, `POST /api/saved-activities`, `POST /api/custom-routes`) wajib membawa Bearer token Sanctum.
  * Seluruh ID referensi tempat wisata pada `place_ids.*` divalidasi (`integer|exists:tourist_spots,id`) dan disimpan atomik menggunakan `DB::transaction()`.
  * Pembaruan UI *optimistic update* dilengkapi verifikasi `res.ok` dan *rollback state* otomatis bila server mengembalikan error.

### 3.6 Feed Aktivitas Komunitas & Upload Foto (`ActivitiesPage.jsx`)
* **Tab `Kamu` & `Komunitas`**:
  * `GET /api/activities` menyediakan *feed* publik komunitas; parameter `?tab=kamu` mewajibkan autentikasi Sanctum (`401` bila belum login) dan hanya mengambil kiriman milik `$request->user()->id`.
* **Posting Foto (`POST /api/activities`) & Hapus Postingan (`DELETE /api/activities/{id}`)**:
  * Wajib menyertakan Bearer token Sanctum. Identitas penulis (`user_id`, `user_name`, `user_avatar`) ditetapkan sepenuhnya di sisi server dari `$request->user()`.
  * Penghapusan postingan hanya diizinkan bagi pemilik sah (`(int)$post->user_id === (int)$user->id`) atau akun dengan role `admin`; request dari user lain atau atas postingan legacy tanpa `user_id` oleh non-admin ditolak (`403`).

### 3.7 Profil Pengguna, Autentikasi Sanctum, Google OAuth & Panel Admin
* **Halaman Profil (`ProfilePage.jsx`)**:
  * Mode **Profil Saya** menampilkan data akun terautentikasi (termasuk `email`), statistik follower/following, daftar *Rute Saya*, pengunggah avatar (`POST /api/auth/update-avatar`), dan tombol **Logout** (`POST /api/auth/logout`).
  * Mode **Profil Penjelajah Lain** (`GET /api/users/{usernameOrId}`) **menyembunyikan alamat `email`** ketika peninjau bukan pemilik akun (`!$isSelf`), serta mendukung aksi follow (`POST /api/users/{usernameOrId}/follow`) menggunakan `$request->user()->id`.
* **Panel Admin Wisata (`/admin`)**:
  * Panel manajemen destinasi berbasis Laravel Blade (`AdminTouristSpotController`) yang diproteksi oleh `auth` + `admin` RBAC, mendukung pengelolaan informasi lokasi, jam operasional, *interactive coordinate picker* Peta Bogor, unggah & pengurutan ulang foto (*drag-and-drop*), serta eksekusi atomik (`DB::transaction()`) bersama pembaruan koordinat spasial `geom`.
  * Rute `/admin` pada frontend SPA mengarahkan secara dinamis menggunakan `buildApiUrl('/admin')` (berbasis `VITE_API_BASE_URL` atau relative path `/admin`).

---

## 4. Spesifikasi Teknis Autentikasi & Keamanan

### 4.1 Alur Autentikasi Laravel Sanctum Bearer Token
1. **Login Kredensial (`POST /api/auth/login`)**:
   * Input `login` (atau `email`) dan `password` (`required|string`) wajib diisi; tidak ada login fallback tanpa password maupun *master password* statis.
   * Server memverifikasi hash kata sandi (`Hash::check`), menerbitkan token melalui `$user->createToken('auth_token')->plainTextToken`, dan mengembalikan `{ status, token, token_type: 'Bearer', data }`.
2. **Registrasi Akun (`POST /api/auth/register`)**:
   * Memvalidasi `name`, `email` unik, dan `password` (`min:6|confirmed`), menetapkan role `'user'`, lalu menerbitkan Bearer token Sanctum.
3. **Verifikasi Sesi & Auto-Logout Global**:
   * `GET /api/auth/current-user` (`auth:sanctum`) mengembalikan `$request->user()` sebagai sumber kebenaran sesi.
   * `apiFetch()` di [api.js](file:///d:/project%20sabah%20bogor/Front%20end/src/utils/api.js) menyimpan token pada `localStorage` (`sabah_auth_token`), otomatis menyisipkan header `Authorization: Bearer <token>` ke endpoint backend internal, dan membersihkan penyimpanan lokal + memicu *auto-logout* event (`sabah:auth-expired`) apabila server merespons `401` atau `403` pada endpoint terproteksi.
4. **Logout (`POST /api/auth/logout`)**:
   * Mencabut token Sanctum aktif via `currentAccessToken()?->delete()` serta membersihkan `sabah_auth_token` dan `sabah_current_user` di klien.

### 4.2 Alur Aman Google OAuth Code Exchange
1. Frontend mengarahkan user ke `GET /api/auth/google/redirect?origin=<window.location.origin>`.
2. `GoogleAuthController::redirect()` menormalkan dan memvalidasi `origin` terhadap **whitelist `FRONTEND_URL` dan `APP_URL`** (menolak/fallback bila domain eksternal tak dikenal untuk mencegah *Open Redirect*), lalu mengenkripsi `{ origin, nonce }` ke parameter OAuth `state` menggunakan `Crypt::encryptString()`.
3. Setelah otorisasi Google pada `GET /api/auth/google/callback`, server mendekripsi `state`, memvalidasi ulang origin terhadap whitelist, membuat/menautkan akun (tanpa hak admin otomatis), dan menyimpan *one-time exchange code* 64 karakter (di-hash SHA-256 pada `Cache` dengan TTL 2 menit).
4. Server me-redirect ke frontend dengan parameter `?auth_provider=google&oauth_code=<kode>` tanpa menyertakan JSON profil maupun token pada URL.
5. Frontend (`App.jsx`) mengirim kode sekali pakai tersebut via `POST /api/auth/google/exchange` (`{ code }`); server mengonsumsi kode dengan `Cache::pull()` (tidak dapat di-*replay*) dan mengembalikan Bearer token Sanctum beserta data pengguna.

### 4.3 Kontrol Keamanan Sistem Lainnya
* **Rate Limiting**:
  * `POST /api/auth/login` -> `throttle:5,1,login` (maks 5 percobaan/menit per tanda tangan request).
  * `POST /api/auth/register` -> `throttle:5,1,register`.
  * `POST /login` (Admin Web) -> `throttle:5,1,admin_login`.
  * `POST /api/auth/google/exchange` -> `throttle:10,1`.
* **Validasi Upload & Pemrosesan Gambar**:
  * `ActivityPostController::store()` memvalidasi `'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240'` serta memetakan ekstensi aman hasil `guessExtension()`.
  * `ImageCompressor::compressAndSave()` memverifikasi keberadaan file, validitas `@getimagesize()`, serta whitelist tipe gambar (`JPEG`, `PNG`, `WEBP`, `GIF`) sebelum melakukan decoding/re-encoding GD. Jika validasi gambar gagal atau ekstensi GD tidak tersedia, fungsi langsung melempar exception (`InvalidArgumentException` / `RuntimeException`) tanpa fallback `$file->move()`/`copy()` mentah.
* **Proteksi Path Traversal Media**:
  * `GET /api/media/{filename}` menolak segmen `..` dan null-byte, menormalkan `basename()`, serta memastikan hasil `realpath()` target berada tepat di dalam direktori `public_path('images')`.
* **CORS & Enkapsulasi Env**:
  * `backend/config/cors.php` mem-parsing `FRONTEND_URL` (dengan fallback `APP_URL`) dan mengaktifkan `'supports_credentials' => true`.
  * File `.env` lokal dan konfigurasi/dokumen AI agents lokal dikecualikan melalui `.gitignore`.

---

## 5. Arsitektur Teknis & Tech Stack

### 5.1 Tech Stack Utama
* **Frontend Framework**: React 19 (`^19.3.1`) + Vite 8 (`^8.3.5`) + Tailwind CSS v4 (`^4.3.3`) + React Router DOM v7 (`^7.18.4`)
* **Mesin Peta & GIS**: `maplibre-gl` (`^6.18.0`) + OSRM API (`router.project-osrm.org`)
* **Hybrid Mobile Runtime**: Capacitor v8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`) dengan fallback `DEFAULT_REMOTE_BACKEND` terdefinisi di [api.js](file:///d:/project%20sabah%20bogor/Front%20end/src/utils/api.js)
* **Backend & Autentikasi**: PHP `^8.3` (`config.platform.php: "8.4.0"`), Laravel 13 (`^13.17`), Laravel Sanctum (`^4.0`), Laravel Socialite (`^5.0`), dan PHPUnit 12 (`^12.5`)

### 5.2 Diagram Alur Arsitektur
```text
[ Browser PWA / Android Capacitor App ]
                  │
                  ▼ (Authorization: Bearer <token> + credentials: 'include')
     [ Front end/src/utils/api.js ] ──► 401/403 Interceptor ──► Auto-Logout & LoginModal
                  │
                  ├──► Google OAuth: /api/auth/google/redirect ─► Callback (?oauth_code=...) ─► POST /api/auth/google/exchange
                  │
                  ▼
     [ Laravel 13 Backend (routes/api.php & routes/web.php) ]
       ├── Rate Limiters (throttle:5,1) & CORS Whitelist (FRONTEND_URL)
       ├── Sanctum Token Auth (auth:sanctum) & Admin RBAC (EnsureUserIsAdmin)
       ├── Ownership Guards ($request->user()->id) & Upload Verification (ImageCompressor GD)
       └── DB Transactions (TouristSpot + geom spatial point & CustomRoute)
```

---

## 6. Non-Functional Requirements (NFR)

1. **Desain Mobile-First, Responsif Tablet/Desktop & Ergonomi Satu Tangan**: Seluruh halaman mendukung ukuran layar smartphone hingga desktop (`h-dvh`, `env(safe-area-inset-bottom)`), dengan kontrol sentuh minimal `44x44px`.
2. **Performa Tinggi 60 FPS**: Isolasi *scroll container* dan animasi berbasis properti komposit GPU agar interaksi *Explore*, *Navigasi*, dan *Sidebar* tetap mulus tanpa *re-layout* berat pada kanvas peta.
3. **Optimasi Pemuatan Gambar (`SafeImage.jsx`) & Anti Memory Leak**: Menggunakan *Shimmer Skeleton Loader*, `loading="lazy"`, `decoding="async"`, *fallback inline SVG Data URI*, serta pembersihan `URL.revokeObjectURL()` setelah pratinjau/upload avatar.
4. **Keterujian Otomatis**: Seluruh mekanisme autentikasi, RBAC, rate limiting, proteksi IDOR, validasi upload, anti path traversal, validasi spasial Kota Bogor, dan alur Google OAuth terverifikasi oleh *Feature Test Suite* di [SecurityHardeningTest.php](file:///d:/project%20sabah%20bogor/backend/tests/Feature/SecurityHardeningTest.php) dan [SilentSpatialValidationTest.php](file:///d:/project%20sabah%20bogor/backend/tests/Feature/SilentSpatialValidationTest.php).

---

## 7. Standar Lingkungan Pengembangan & Troubleshooting Server (Windows)

Untuk memastikan seluruh anggota tim pengembang dapat menjalankan aplikasi tanpa kendala bentrok port maupun perbedaan versi PHP di Windows, proyek ini menerapkan standar operasional berikut:

### 7.1 Standarisasi Port Backend (`8001`) & Frontend (`5173`)
* **Backend Laravel (`http://127.0.0.1:8001`)**: Port utama backend distandarkan ke **`8001`** (bukan `8000`) pada `backend/.env.example` (`APP_URL=http://127.0.0.1:8001`), `backend/config/cors.php`, `backend/config/sanctum.php`, `Front end/.env.example` (`VITE_API_BASE_URL=http://127.0.0.1:8001`), dan proxy `Front end/vite.config.js`. Hal ini mencegah bentrok dengan reservasi port `8000` oleh layanan **Hyper-V / WSL2 / WinNAT** di Windows.
* **Shortcut Menjalankan Backend**: File `backend/composer.json` menyediakan script `composer serve` (dan `composer dev`) yang otomatis mengeksekusi `php artisan serve --port=8001` tanpa batas waktu proses Composer.

### 7.2 Troubleshooting & Panduan Menjalankan Server (Windows)

1. **Menjalankan Backend di Port `8001`:**
   ```powershell
   cd backend
   composer serve
   # atau secara eksplisit:
   php artisan serve --port=8001
   ```

2. **Menjalankan Backend dengan Herd Lite (Mengatasi Konflik PHP Versi Lama di `PATH`):**
   * Proyek ini mensyaratkan **PHP `8.4.0+`**. Apabila perintah `php` di terminal masih memanggil PHP versi lama (misalnya bawaan XAMPP), jalankan binary PHP **Herd Lite** secara langsung di PowerShell:
     ```powershell
     cd backend
     & "$env:USERPROFILE\.config\herd-lite\bin\php.exe" artisan serve --port=8001
     ```
   * Untuk perbaikan permanen: buka **Environment Variables** Windows, edit variabel **`Path`** pada *User variables*, lalu pindahkan `%USERPROFILE%\.config\herd-lite\bin` ke **urutan paling atas** menggunakan tombol **Move Up**, simpan, dan buka ulang terminal.

3. **Verifikasi Layanan Database (MySQL) & Konfigurasi `.env` Frontend:**
   * Pastikan layanan **MySQL** (jika memakai `DB_CONNECTION=mysql` di `backend/.env`) sudah berstatus aktif/berjalan (*Running*), atau file `backend/database/database.sqlite` tersedia jika memakai `DB_CONNECTION=sqlite`.
   * Pastikan `backend/.env` menggunakan `APP_URL=http://127.0.0.1:8001` dan `FRONTEND_URL=http://localhost:5173` (jalankan `php artisan config:clear` setelah mengedit `.env`).
   * Pastikan `Front end/.env` mengatur `VITE_API_BASE_URL=http://127.0.0.1:8001`, lalu restart `npm run dev` pada folder `Front end/` agar Vite memuat konfigurasi port `8001`.
