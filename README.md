# SIG Wisata Sabah Bogor (Progressive Web App & Mobile GIS)

**SIG Wisata Sabah Bogor** adalah aplikasi **Sistem Informasi Geografis (SIG)** berbasis *Mobile-First Progressive Web App (PWA)* dan Android (Capacitor) yang dirancang untuk membantu wisatawan menjelajahi, merencanakan rute perjalanan, dan berbagi pengalaman wisata di wilayah **Kota & Kabupaten Bogor**.

Aplikasi ini dibangun menggunakan **React 19 + Vite + Tailwind CSS + MapLibre GL 3D** di sisi *Frontend*, terintegrasi dengan REST API **Laravel 13 + Laravel Sanctum + Laravel Socialite + Spatial Database (PostGIS/MySQL/SQLite)** di sisi *Backend*.

---

## Fitur Unggulan

1. **Eksplorasi Peta 3D Interaktif & Marker Clustering (`Explore`)**
   * Visualisasi peta MapLibre GL 3D dengan sebaran destinasi wisata Bogor berdasarkan 3 kategori: **Alam & Curug**, **Kuliner**, dan **Edukasi & Budaya**.
   * Dilengkapi **Layer Batas Wilayah Kota Bogor (GeoJSON)**, **Marker Clustering** dinamis, *sonar pulse* hover sync, serta mini-card popup bergaya *Liquid Glass*.
   * Panel responsif adaptif: *Bottom Sheet* proporsional di mobile (`38vh` awal) dan *Floating Sidebar* di tablet/desktop.

2. **Pelacakan GPS Real-Time & Kalkulasi Jarak Dinamis**
   * Mendeteksi lokasi pengguna via HTML5 Geolocation atau `@capacitor/geolocation` untuk menghitung jarak Haversine dan estimasi waktu tempuh menuju destinasi.

3. **Navigasi Satu Titik & Rute Custom Multi-Waypoints (`Navigasi`)**
   * Menggambar animasi jalur rute jalan raya langsung di atas peta menggunakan **OSRM** lengkap dengan kartu telemetry **RouteMetrics** (jarak total & estimasi durasi).

4. **Rekomendasi Personal (`Untuk Anda`) & Koleksi Tersimpan (`Tersimpan`)**
   * Kurasi destinasi pribadi, folder **Terakhir Dilihat**, **Favorit**, pencatatan aktivitas perjalanan, serta perancang **Rute Custom** multi-destinasi yang tersinkron ke server.

5. **Feed Aktivitas Komunitas & Profil Penjelajah (`Aktivitas`)**
   * Berbagi foto dokumentasi perjalanan ke tab **Kamu** & **Komunitas**, unggah avatar profil, ikuti penjelajah lain (*follow/unfollow*), serta notifikasi interaktif.

6. **Keamanan & Panel Admin RBAC (`/admin`)**
   * Autentikasi **Laravel Sanctum Bearer Token** & **Google OAuth One-Time Code Exchange**.
   * Pemisahan role `user` dan `admin` (*RBAC*) yang melindungi panel `/admin` dan endpoint mutasi destinasi wisata, dilengkapi validasi upload gambar berbasis `getimagesize()` + GD dan proteksi kepemilikan data (*anti-IDOR*).

---

## Prasyarat Sistem (Prerequisites)

Pastikan lingkungan lokal Anda sudah memiliki:
* **PHP `8.4.0`+** (dengan ekstensi aktif `gd`, `zip`, `curl`, `openssl`, `mbstring`, `exif`, serta `pdo_sqlite` / `pdo_pgsql` / `pdo_mysql`)
* **Composer** (v2.x)
* **Node.js `18.x` / `20.x+`** dan **npm**
* **Git**

---

## Cara Instalasi & Setup Lokal (Backend & Frontend)

### 1. Clone Repository
```bash
git clone https://github.com/Mattazz44/sig-sabah-bogor.git
cd "sig-sabah-bogor"
```

### 2. Setup Backend (Laravel 13)
```bash
cd backend
composer install
```

Salin file template `.env.example` menjadi `.env`:
```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Buka `backend/.env` dan sesuaikan konfigurasi lokal (jangan pernah membagikan atau meng-commit file `.env`):
```env
APP_NAME="Sabah Bogor"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8001
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=sqlite
# Jika menggunakan MySQL / MariaDB, pastikan service MySQL sudah aktif lalu sesuaikan:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=sabah_bogor
# DB_USERNAME=root
# DB_PASSWORD=

# Isi jika menggunakan Google OAuth Login (diperoleh dari Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8001/api/auth/google/callback
```
> **Catatan CORS & OAuth:** Nilai `FRONTEND_URL=http://localhost:5173` digunakan oleh `backend/config/cors.php` (dengan `supports_credentials: true`) dan whitelist redirect pada `GoogleAuthController`. Untuk multiple origin, pisahkan dengan koma (misal `http://localhost:5173,http://127.0.0.1:8001`). Untuk lingkungan *production*, pastikan `APP_DEBUG=false`, `APP_ENV=production`, dan `FRONTEND_URL` diisi domain produksi resmi.

Buat application key, jalankan migrasi (dan seeder opsional), lalu nyalakan server Laravel di **port `8001`**:
```bash
php artisan key:generate
php artisan migrate
# Opsional untuk mengisi data awal destinasi wisata & struktur contoh:
php artisan db:seed

# Jalankan server backend pada port 8001 (menggunakan shortcut Composer)
composer serve

# Atau menggunakan perintah Artisan secara eksplisit:
php artisan serve --port=8001
```

Untuk menjalankan pengujian backend (termasuk *Security Hardening Tests*):
```bash
php artisan test
```

### 3. Setup Frontend (React 19 + Vite 8)
Buka terminal baru pada root proyek, lalu masuk ke folder `Front end`:
```bash
cd "Front end"
npm install
```

Salin `Front end/.env.example` menjadi `Front end/.env`:
```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Konfigurasi `Front end/.env`:
```env
# Arahkan ke server Backend Laravel lokal pada port 8001:
VITE_API_BASE_URL=http://127.0.0.1:8001

# Untuk build Capacitor Android atau domain API terpisah, isi dengan URL origin backend:
# VITE_API_BASE_URL=https://api.example.com
```
*(Catatan: Proxy dev server di `Front end/vite.config.js` untuk `/api`, `/images`, dan `/sanctum` juga telah distandarkan ke `http://127.0.0.1:8001`.)*

Jalankan server development Frontend:
```bash
npm run dev
```
Aplikasi Frontend akan tersedia di **`http://localhost:5173`** dan terhubung otomatis ke backend di **`http://127.0.0.1:8001`**.

Perintah linter & build produksi Frontend (ke `backend/public`):
```bash
npm run lint
npm run build
```

---

## Troubleshooting & Panduan Menjalankan Server (Windows)

Bagian ini membantu mengatasi kendala umum saat menjalankan proyek di lingkungan **Windows** (bentrok port `8000`, konflik versi PHP lama di `PATH`, serta koneksi database & `.env`).

### 1. Menghindari Bentrok / Blokir Port `8000` di Windows
Pada Windows 10/11, port `8000` sering dikunci atau direservasi secara otomatis oleh layanan sistem seperti **Hyper-V**, **WSL2**, atau **Windows NAT (`WinNAT`)**, sehingga `php artisan serve` bawaan gagal dijalankan atau tidak dapat diakses oleh frontend.

Oleh karena itu, seluruh konfigurasi proyek ini telah distandarkan menggunakan **port `8001` (`http://127.0.0.1:8001`)**. Selalu jalankan backend dengan salah satu perintah berikut di dalam folder `backend/`:
```powershell
# Opsi 1: Menggunakan script shortcut Composer (disarankan)
composer serve

# Opsi 2: Menentukan port 8001 secara eksplisit pada Artisan
php artisan serve --port=8001
```

### 2. Mengatasi Error Versi PHP Lama bagi Pengguna Herd Lite (Windows)
Backend Laravel pada proyek ini membutuhkan **PHP `8.4.0` ke atas**. Jika di komputer Anda terpasang lebih dari satu versi PHP (misalnya XAMPP/Laragon lama dengan PHP `8.1`/`8.2` masih berada di urutan atas `PATH` sistem), perintah `php` atau `composer` biasa dapat memunculkan error `Your Composer dependencies require a PHP version ">= 8.4.0"`.

Jika Anda menggunakan **Laravel Herd Lite** di Windows, gunakan salah satu solusi berikut:

* **Cara Cepat (Panggil Binary PHP Herd Lite Langsung di PowerShell):**
  ```powershell
  cd backend
  & "$env:USERPROFILE\.config\herd-lite\bin\php.exe" artisan serve --port=8001
  ```
  *(Anda juga dapat menjalankan perintah lain dengan pola yang sama, misalnya `& "$env:USERPROFILE\.config\herd-lite\bin\php.exe" artisan migrate`.)*

* **Cara Permanen (Naikkan Urutan `PATH` Herd Lite ke Paling Atas):**
  1. Tekan `Win + S`, ketik **Environment Variables**, lalu pilih **Edit environment variables for your account** (atau *Edit the system environment variables* -> tombol **Environment Variables**).
  2. Pada daftar **User variables** (serta cek juga **System variables**), pilih variabel **`Path`** lalu klik **Edit**.
  3. Pastikan path Herd Lite (`%USERPROFILE%\.config\herd-lite\bin` atau `C:\Users\<NamaUser>\.config\herd-lite\bin`) sudah terdaftar, lalu klik tombol **Move Up** hingga berada di **urutan paling atas** (di atas `C:\xampp\php` atau folder PHP versi lama lainnya).
  4. Klik **OK** untuk menyimpan, **tutup seluruh jendela PowerShell / terminal VS Code**, lalu buka terminal baru dan jalankan `php -v` untuk memastikan versi aktif sudah **PHP 8.4+**.

### 3. Memastikan Layanan Database (MySQL) Aktif & Konfigurasi `.env` Sinkron ke Port `8001`
Sebelum menguji aplikasi di browser, pastikan daftar periksa berikut sudah terpenuhi:
1. **Layanan Database Aktif:**
   * Jika `backend/.env` menggunakan **MySQL / MariaDB** (`DB_CONNECTION=mysql`), pastikan service **MySQL** sudah menyala (*Running*) melalui panel Laragon, XAMPP, atau Windows Services (`services.msc`), serta database sudah dibuat sebelum menjalankan `php artisan migrate --seed`.
   * Jika menggunakan **SQLite** (`DB_CONNECTION=sqlite`), pastikan file `backend/database/database.sqlite` tersedia.
2. **Konfigurasi `backend/.env`:**
   * Pastikan tertulis `APP_URL=http://127.0.0.1:8001` dan `FRONTEND_URL=http://localhost:5173`.
   * Setiap kali mengubah isi `backend/.env`, bersihkan cache konfigurasi dengan perintah:
     ```powershell
     php artisan config:clear
     ```
3. **Konfigurasi `Front end/.env`:**
   * Pastikan file `Front end/.env` memiliki nilai `VITE_API_BASE_URL=http://127.0.0.1:8001` (bukan `8000`).
   * Jika server Vite (`npm run dev`) sudah terlanjur berjalan saat `.env` diubah, tekan `Ctrl + C` lalu jalankan ulang `npm run dev` agar Vite membaca URL port `8001` terbaru.

---

## Ringkasan Endpoint API Utama

Semua endpoint di bawah berada di bawah prefix `/api`. Wrapper frontend ([Front end/src/utils/api.js](file:///d:/project%20sabah%20bogor/Front%20end/src/utils/api.js)) otomatis menyisipkan header `Authorization: Bearer <token>` setelah login dan memicu *auto-logout* jika server merespons `401` atau `403`.

### Autentikasi, Google OAuth & Profil Pengguna
| Method | Endpoint | Akses / Keamanan | Keterangan |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Publik (`throttle:5,1`) | Login email/username + password; menerbitkan Sanctum Bearer token. |
| `POST` | `/api/auth/register` | Publik (`throttle:5,1`) | Registrasi akun baru (`role: user`); menerbitkan Sanctum Bearer token. |
| `GET` | `/api/auth/google/redirect` | Publik | Redirect ke Google OAuth dengan parameter `state` terenkripsi whitelist `FRONTEND_URL`. |
| `GET` | `/api/auth/google/callback` | Publik | Callback Google OAuth; redirect ke frontend membawa `?oauth_code=...` sekali pakai. |
| `POST` | `/api/auth/google/exchange` | Publik (`throttle:10,1`) | Menukar `oauth_code` sekali pakai menjadi Bearer token Sanctum & data user. |
| `GET` | `/api/auth/current-user` | **Wajib Bearer Token** | Mengambil data user yang sedang terautentikasi (`$request->user()`). |
| `POST` | `/api/auth/logout` | **Wajib Bearer Token** | Mencabut token Sanctum aktif milik pengguna saat ini. |
| `POST` | `/api/auth/update-avatar` | **Wajib Bearer Token** | Mengunggah & mengompresi avatar profil milik user terautentikasi (`jpg/jpeg/png/webp`, maks 5 MB). |
| `GET` | `/api/users/{usernameOrId}` | Publik *(Opsional Bearer)* | Mengambil profil & statistik user (`email` disembunyikan kecuali pemilik akun sendiri). |
| `POST` | `/api/users/{usernameOrId}/follow` | **Wajib Bearer Token** | Follow / unfollow penjelajah lain memakai identitas `$request->user()`. |

### Destinasi Wisata, Peta & Media
| Method | Endpoint | Akses / Keamanan | Keterangan |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tourists` | Publik | Daftar seluruh tempat wisata (mendukung filter `category`, `q`, `popular`, `lat`/`lon`/`radius_km`, dan `format=geojson`). |
| `GET` | `/api/tourists/{slugOrId}` | Publik | Detail lengkap tempat wisata berdasarkan `slug` atau `id`. |
| `GET` | `/api/boundary` | Publik | GeoJSON batas wilayah administrasi Kota Bogor. |
| `POST` | `/api/tourists` | **Wajib Bearer Token + Role `admin`** | Tambah destinasi wisata baru + titik spasial `geom` dalam `DB::transaction()`. |
| `PUT/PATCH/POST` | `/api/tourists/{id}` | **Wajib Bearer Token + Role `admin`** | Perbarui destinasi wisata + titik spasial `geom` dalam `DB::transaction()`. |
| `DELETE` | `/api/tourists/{id}` | **Wajib Bearer Token + Role `admin`** | Hapus destinasi wisata dari database. |
| `GET` | `/api/media/{filename}` | Publik | Menyajikan file gambar dari `public/images/` dengan sanitasi `basename()` & verifikasi `realpath()`. |

### Fitur Personal, Tersimpan & Komunitas
| Method | Endpoint | Akses / Keamanan | Keterangan |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/for-you` | Publik | Rekomendasi destinasi wisata berdasarkan parameter `favorites` & `recent`. |
| `GET` | `/api/saved-activities` | **Wajib Bearer Token** | Mengambil aktivitas tersimpan & daftar rute custom milik `$request->user()->id`. |
| `POST` | `/api/saved-activities` | **Wajib Bearer Token** | Menyimpan aktivitas/destinasi milik `$request->user()->id`. |
| `POST` | `/api/custom-routes` | **Wajib Bearer Token** | Membuat rute custom multi-waypoints baru (`place_ids.*` tervalidasi `exists:tourist_spots,id`). |
| `GET` | `/api/activities` | Publik / **Bearer (`?tab=kamu`)** | Mengambil feed komunitas publik (`komunitas`/`all`) atau kiriman pribadi (`tab=kamu` wajib token). |
| `POST` | `/api/activities` | **Wajib Bearer Token** | Membuat postingan aktivitas komunitas dengan validasi file gambar ketat (`jpg/jpeg/png/webp`, maks 10 MB). |
| `DELETE` | `/api/activities/{id}` | **Wajib Bearer Token (Pemilik atau `admin`)** | Menghapus postingan aktivitas (ditolak `403` jika bukan pemilik atau admin). |

---

## Panduan Singkat Pengguna & Admin

1. **Akun Pengguna**: Klik ikon profil atau buka tab **Untuk Anda** / **Aktivitas**, lalu daftar akun baru lewat modal **Buat akun baru** atau masuk menggunakan **Email/Username & Kata Sandi** maupun tombol **Masuk dengan Google**.
2. **Panel Admin (`/admin`)**: Rute web `/login` dan `/admin*` hanya dapat diakses oleh pengguna dengan `role === 'admin'`. Akun admin awal disediakan oleh seeder database (`AdditionalPagesSeeder`) — segera ubah kata sandi bawaan sebelum aplikasi digunakan secara publik/production.

---

## Struktur Folder Proyek

```text
project sabah bogor/
├── .gitignore
├── CHANGELOG.md
├── PRD.md
├── README.md
├── Front end/                              # Aplikasi PWA Frontend (React 19 + Vite 8 + Tailwind CSS v4)
│   ├── .env.example                        # Template environment frontend (VITE_API_BASE_URL)
│   ├── .gitignore
│   ├── capacitor.config.json
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                         # Root router, OAuth exchange, auth state & auto-logout listener
│       ├── main.jsx                        # React DOM entry & ErrorBoundary
│       ├── index.css                       # Tema Apple Liquid Glass + Subtle Retro
│       ├── components/
│       │   ├── map/                        # Komponen peta MapLibre GL, OSRM routing & GPS markers
│       │   ├── pages/                      # ActivitiesPage, CustomRoutePage, ForYouPage, ProfilePage, SavedActivitiesPage, TouristDetailPage
│       │   ├── sidebar/                    # SidebarContainer, TouristCard, TouristDetail, TouristList
│       │   └── ui/                         # BottomNav, BottomSheet, LoginModal, SafeImage, SearchBar, dll.
│       ├── data/                           # GeoJSON boundary & data fallback lokal
│       ├── hooks/                          # useAdminLocations, useFavorites, useMapControls, useRecentlyViewed, useUserLocation
│       └── utils/                          # api.js (Bearer token + 401/403 interceptor), distance.js, imageCompressor.js, imageHelper.js
└── backend/                                # Backend REST API & Admin Panel (Laravel 13)
    ├── .env.example
    ├── composer.json                       # Lock platform PHP 8.4.0 & dependensi Laravel/Sanctum/Socialite
    ├── app/
    │   ├── Http/
    │   │   ├── Controllers/
    │   │   │   ├── Admin/                  # AdminAuthController & AdminTouristSpotController
    │   │   │   └── Api/                    # AuthController, GoogleAuthController, TouristSpotController, SavedActivityController, ActivityPostController, ForYouController
    │   │   └── Middleware/                 # EnsureUserIsAdmin (RBAC 'admin')
    │   ├── Models/                         # User, TouristSpot, SavedActivity, CustomRoute, ActivityPost
    │   └── Services/                       # ImageCompressor (GD verification & compression)
    ├── config/
    │   └── cors.php                        # Konfigurasi CORS berbasis FRONTEND_URL + supports_credentials
    ├── database/
    │   ├── migrations/                     # Termasuk add_role_to_users_table
    │   └── seeders/
    ├── resources/views/admin/              # UI Admin Panel Blade (Apple Glass + Subtle Retro)
    ├── routes/                             # api.php & web.php
    └── tests/Feature/                      # SecurityHardeningTest.php & Feature tests
```

---

## Tim Pengembang
Dikembangkan oleh Tim **Pemuda berkaca mata**.
