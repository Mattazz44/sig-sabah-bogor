# Changelog

Semua perubahan penting pada proyek **SIG Wisata Sabah Bogor** didokumentasikan di file ini.

Format changelog mengikuti standar [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.2.0] - 2026-11-22

### Added
- **Dokumentasi & Bukti Blackbox Testing (`docs/qa-report/`)**: Menambahkan laporan `docs/qa-report/LAPORAN-BLACKBOX-TESTING.md` (`29` skenario `BB-01` s/d `BB-29`, pass rate `100%` dengan `0` console error) beserta `31` tangkapan layar bukti visual di `docs/qa-report/screenshots/`.
- **Mikro-Animasi Marker Peta & Kartu Sidebar (`MapMarker.jsx`, `MarkerClusterGroup.jsx`, `TouristCard.jsx`, `TouristList.jsx`, `categories.js`, `index.css`)**:
  - Efek hover pin wisata `scale(1.15)` dengan elevasi `translateY(-3px)`, transisi spring `cubic-bezier(0.34, 1.56, 0.64, 1)`, peningkatan `z-index` saat hover/active, *bounce/pop* saat diklik, gelombang *pulse ring* ganda berwarna kategori pada dasar pin, serta offset popup per-anchor.
  - Efek hover kartu sidebar (`200ms ease-out`, `-translate-y-0.5`, bayangan & ring aksen tema, thumbnail `scale-105` dalam `overflow-hidden`), *tactile press* `active:scale-[0.98]`, badge status `Aktif di peta`, serta sinkronisasi dua arah (Sidebar <-> Peta termasuk auto-scroll kartu terpilih).
- **Guard Spasial pada Seeder (`TouristSpotSeeder.php`)**: Menambahkan pengecekan polygon `bogor_boundary.geojson` (`isInsideBogorBoundary()`) saat seeding GeoJSON dan CSV agar tidak memasukkan destinasi di luar Kota Bogor.

### Changed
- **Kalibrasi Koordinat Destinasi (`database.sqlite`, `tourist_spots.geojson`, `Front end/src/data/tourists.json`)**: Memperbarui koordinat *Lawang Surya Kencana* (`lawang-surya-kencana`) ke `-6.60327, 106.79891` secara serentak pada tabel `tourist_spots`, embedded JSON rute `custom_routes` (`cr-kuliner`), file GeoJSON backend, dan `tourists.json` frontend.
- **Kalkulasi Jarak Rute Custom & Sinkronisasi Build (`SavedActivityController.php`, `CustomRoutePage.jsx`, `backend/public/`)**: Menyempurnakan perhitungan jarak per segmen rute custom serta membangun ulang aset production Vite ke `backend/public/`.

### Fixed
- **Bug Marker Drift saat Zoom (`MapMarker.jsx`, `MarkerClusterGroup.jsx`, `UserLocationMarker.jsx`, `AdminLocationPickerMap.jsx`, `index.css`)**: Menghapus properti `transform` dan `transition: all` pada elemen root marker yang dikelola MapLibre, menggunakan `anchor: 'bottom'` / `'center'` dengan `subpixelPositioning: true`, serta mengisolasi animasi pada child container internal.
- **Estimasi Rute Navigasi & Rating Transit (`RoutingMachine.jsx`, `MapContainer.jsx`, `MapPopup.jsx`, `RouteMetrics.jsx`)**: Menambahkan fallback koordinat Pusat Kota Bogor saat GPS ditolak/timeout agar kalkulasi estimasi waktu dan jarak tidak tertahan di `"Menghitung..."`, serta menormalkan tampilan rating valid pada popup *Lokasi transit*.
- **Pemuatan Gambar Destinasi (`SafeImage.jsx`, `imageHelper.js`)**: Mengatasi URL blob rusak dan memperbaiki fallback foto destinasi Bogor (termasuk *Istana Kepresidenan Bogor*) agar seluruh gambar termuat normal (`broken: 0`).
- **Interaksi Klik Kartu & Marker (`App.jsx`, `useMapControls.js`)**: Memastikan klik pertama pada kartu sidebar Explore maupun marker peta langsung memunculkan popup destinasi dengan tombol `Detail >`.
- **Aksesibilitas Banner Alert (`App.jsx`)**: Mencegah komponen `aside[role="alert"]` ter-render atau fokus-able di DOM ketika tidak dalam kondisi error koneksi.
- **Stabilitas Halaman Komunitas, Tersimpan, & Profil (`ActivitiesPage.jsx`, `SavedActivitiesPage.jsx`, `ForYouPage.jsx`, `ProfilePage.jsx`)**: Memperbaiki validasi modal kosong, persistensi rute custom & status follow, serta kontrol otorisasi postingan/profil.

### Removed
- **Pembersihan Data Wisata di Luar Batas Kota Bogor (Point-in-Polygon)**:
  - **SQLite (`backend/database/database.sqlite`)**: Menghapus `6` destinasi yang terdeteksi berada di luar polygon `bogor_boundary.geojson` (*Jbound Geo Edu Park*, *Curug Leuwi Hejo*, *Curug Nangka*, *Kopi Daong*, *Situ Panjang*, dan *Kebun Raya Residence Sports Club*) beserta pengecekan orphan relasi (`saved_activities`, `custom_routes`), menyisakan **80 destinasi** di dalam Kota Bogor.
  - **Dataset Seeder & Frontend**: Menghapus `13` baris luar/Kabupaten Bogor pada `backend/database/data/tourist_spots_additional.csv` (tersisa `113` baris data), `2` entri pada `backend/database/data/tourist_spots_additional.sql`, serta `4` destinasi luar Kota Bogor pada `Front end/src/data/tourists.json` (tersisa `8` item).

---

## [1.1.0] - 2026-11-21

### Added
- **RBAC Role Pengguna (`users.role`)**: Menambahkan migrasi `2026_11_21_000001_add_role_to_users_table` untuk kolom `role` terindeks (default `'user'`) beserta backfill akun admin, helper `User::isAdmin()`, serta memperbarui `AdditionalPagesSeeder`.
- **Middleware Admin (`EnsureUserIsAdmin`)**: Menambahkan middleware alias `'admin'` pada `backend/bootstrap/app.php` untuk membatasi akses administrator pada API maupun web panel.
- **Endpoint Auth Baru**: Menambahkan `POST /api/auth/logout` (pencabutan token Sanctum aktif) dan `POST /api/auth/google/exchange` (*one-time exchange* `oauth_code` menjadi Bearer token Sanctum).
- **Konfigurasi CORS Terdedikasi (`backend/config/cors.php`)**: Mem-parsing origin dari env `FRONTEND_URL` (dengan fallback `APP_URL`) dan mengaktifkan `'supports_credentials' => true`.
- **Template & Aturan Ignore Repositori**: Menambahkan `Front end/.env.example`, `.gitignore` di root repositori (mengabaikan `.env`, `.env.*`, serta file/folder AI agents lokal `auditor.md`, `.agents/`, `.claude/`, `.cursor/`), dan mendokumentasikan `FRONTEND_URL` pada `backend/.env.example`.
- **Manajemen Token & Auto-Logout Global Frontend (`Front end/src/utils/api.js`)**: Menambahkan helper `getAuthToken`, `setAuthToken`, `getStoredUser`, `setStoredUser`, `clearAuthStorage`, `buildApiUrl`, penyisipan otomatis header `Authorization: Bearer <token>`, serta event global `sabah:auth-expired` saat status `401`/`403`.
- **Automated Security Test Suite**: Menambahkan `backend/tests/Feature/SecurityHardeningTest.php` yang menguji autentikasi, rate limiting, RBAC API/Admin web, proteksi IDOR, validasi upload file & `ImageCompressor`, anti path traversal media, serta alur Google OAuth code exchange (10 tests, 103 assertions lolos).

### Changed
- **Autentikasi Sanctum Penuh (`AuthController`)**: `login()` kini mewajibkan `password` (`required|string`), memverifikasi `Hash::check()`, dan menerbitkan token Sanctum Bearer. `register()` menetapkan role default `'user'` serta menerbitkan token Sanctum. `currentUser()` mengembalikan `$request->user()`.
- **Proteksi Rute Backend (`routes/api.php` & `routes/web.php`)**:
  - Endpoint mutasi wisata (`POST|PUT|PATCH|DELETE /api/tourists*`) kini dilindungi `['auth:sanctum', 'admin']`.
  - Grup panel admin web (`/admin*`) dilindungi `['auth', 'admin']`; `AdminAuthController` memakai guard `'web'` secara eksplisit dan menolak login non-admin.
  - Seluruh endpoint user/aktivitas/rute privat (`/api/auth/current-user`, `/api/auth/logout`, `/api/auth/update-avatar`, `/api/users/{usernameOrId}/follow`, `GET|POST /api/saved-activities`, `POST /api/custom-routes`, `POST /api/activities`, `DELETE /api/activities/{id}`) kini dilindungi `auth:sanctum`.
- **Alur Autentikasi & URL Dinamis Frontend**:
  - `App.jsx` mengganti pembacaan `?auth_data=` menjadi pertukaran `?oauth_code=` ke `POST /api/auth/google/exchange` (aman terhadap React `StrictMode`), memvalidasi sesi lewat `/api/auth/current-user`, dan mengganti URL hardcode `http://localhost:8000/admin` dengan `buildApiUrl('/admin')`.
  - `LoginModal.jsx` mewajibkan input kata sandi di mode login, menyimpan Sanctum Bearer token ke `localStorage`, dan menyertakan `origin` pada URL redirect Google OAuth.
  - `SavedActivitiesPage.jsx`, `CustomRoutePage.jsx`, `ActivitiesPage.jsx`, dan `ProfilePage.jsx` diselaraskan menggunakan `apiFetch` ber-token tanpa menyertakan payload identitas (`user_id`/`email`/`user_name`) yang dapat dipalsukan.
- **Kompatibilitas Composer PHP 8.4.0 (`backend/composer.json` & `composer.lock`)**: Mengunci `"laravel/socialite": "^5.0"` (dari `*`), menambahkan `"platform": { "php": "8.4.0" }`, serta memperbarui lockfile & dependensi vendor agar kompatibel dengan runtime PHP `8.4.0`.
- **Pembaruan Dokumentasi**: Menyelaraskan `PRD.md` dan `README.md` dengan arsitektur MapLibre GL 3D, Sanctum Bearer Token, Google OAuth Exchange, RBAC, serta setup lokal terbaru.

### Security
- **Penutupan Auth Bypass**: Menghapus fallback email `'ambalingham@gmail.com'`, *master password* `'password123'`, dan fallback auto-login klien tanpa kredensial.
- **Pembersihan Tracking File Sensitif Git**: Menghapus `Front end/.env` serta file AI agent/skills lokal dari indeks Git (`git rm --cached`) tanpa menghapus file fisiknya di mesin lokal.
- **Penutupan Celah IDOR & Kebocoran Data Pribadi**: `SavedActivityController` dan `ActivityPostController` mengambil kepemilikan data murni dari `$request->user()->id`; `ActivityPostController::destroy()` menolak penghapusan (`403`) kecuali oleh pemilik sah atau admin; `AuthController::userProfile()` menggunakan `$request->user('sanctum')` dan menyembunyikan field `email` saat diakses pengguna lain atau publik; pesan error exception mentah di `toggleFollow()` diganti dengan logging server.
- **Rate Limiting Endpoint Autentikasi**: Memasang limiter terisolasi `throttle:5,1,login`, `throttle:5,1,register`, `throttle:5,1,admin_login`, serta `throttle:10,1` pada `/api/auth/google/exchange`.
- **Hardening Upload Gambar & Anti Path Traversal**: `ActivityPostController::store()` memvalidasi `'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240'` dan menghapus fallback penyimpanan string URL mentah. `ImageCompressor::compressAndSave()` memvalidasi file dengan `@getimagesize()`, menolak format tak didukung, menghapus fallback `$file->move()`/`copy()` tanpa validasi, dan melempar exception bila file bukan gambar valid. Endpoint `/api/media/{filename}` menormalkan `basename()` dan memverifikasi `realpath()` berada di dalam `public_path('images')`.
- **Pencegahan Open Redirect Google OAuth**: `GoogleAuthController` memvalidasi origin `redirect()` dan `callback()` terhadap whitelist `FRONTEND_URL`/`APP_URL`, mengenkripsi parameter `state` dengan `Crypt::encryptString()`, dan menukar *one-time* `oauth_code` (hash SHA-256) alih-alih mengirim JSON user pada URL.

### Fixed
- **Crash Runtime Capacitor (`Front end/src/utils/api.js`)**: Mendefinisikan konstanta `DEFAULT_REMOTE_BACKEND` yang sebelumnya terkomentar sehingga mencegah `ReferenceError` pada build native Capacitor.
- **Atomisitas Transaksi Database**: Membungkus operasi `create`/`update` bersama `updateSpatialPoint()` di `TouristSpotController` dan `AdminTouristSpotController` dengan `DB::transaction()` (serta meneruskan error SQL spasial pada `pgsql`/`mysql` agar memicu *rollback*), dan menambahkan validasi `'place_ids.*' => 'integer|exists:tourist_spots,id'` di `SavedActivityController::storeCustomRoute()`.
- **Sinkronisasi Guard Admin Web (`AdminAuthController`)**: Menetapkan `Auth::guard('web')` secara eksplisit agar autentikasi panel admin tidak terbentur *default guard switching* (`RequestGuard::attempt does not exist`).
- **Reliabilitas UI & Memori Frontend**: Menambahkan verifikasi `res.ok` serta *rollback state* UI pada operasi *optimistic update* di `ActivitiesPage`, `SavedActivitiesPage`, `CustomRoutePage`, dan `ProfilePage`, memperbarui `localStorage` saat avatar profil berubah, membersihkan `URL.revokeObjectURL()` setelah unggah avatar, serta memperbaiki pemanggilan conditional hook `useMatch` di `App.jsx`.
