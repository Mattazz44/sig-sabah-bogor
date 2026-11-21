# Changelog

Semua perubahan penting pada proyek **SIG Wisata Sabah Bogor** didokumentasikan di file ini.

Format changelog mengikuti standar [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
