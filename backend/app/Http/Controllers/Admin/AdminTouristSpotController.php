<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TouristSpot;
use App\Services\ImageCompressor;
use App\Services\SpatialBoundaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminTouristSpotController extends Controller
{
    private const PER_PAGE = 10;

    private const ALLOWED_CATEGORIES = [
        'Alam & Curug',
        'Kuliner',
        'Edukasi & Budaya',
    ];

    /**
     * Tampilkan halaman dashboard admin daftar dan form input tempat wisata
     */
    public function index(Request $request)
    {
        $category = $request->query('category', 'Semua');
        $search = $request->query('q', '');

        $query = $this->buildFilteredSpotsQuery($category, $search)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');

        $spots = $query->paginate(self::PER_PAGE)->withQueryString();
        $totalSpots = TouristSpot::count();
        $popularSpots = TouristSpot::where('is_popular', true)->count();
        $freeSpots = TouristSpot::where(function ($q) {
            $q->whereNull('ticket_price')
              ->orWhereRaw("TRIM(ticket_price) = ''")
              ->orWhereRaw("LOWER(ticket_price) LIKE '%gratis%'")
              ->orWhereRaw("LOWER(ticket_price) LIKE '%free%'");
        })->count();
        $averageRating = round((float) (TouristSpot::whereNotNull('rating')->where('rating', '>', 0)->avg('rating') ?? 0), 1);

        $stats = [
            'total' => $totalSpots,
            'popular' => $popularSpots,
            'free' => $freeSpots,
            'avgRating' => $averageRating,
        ];

        $categoriesCount = [
            'Semua' => $totalSpots,
            'Alam & Curug' => TouristSpot::where('category', 'Alam & Curug')->count(),
            'Kuliner' => TouristSpot::where('category', 'Kuliner')->count(),
            'Edukasi & Budaya' => TouristSpot::where('category', 'Edukasi & Budaya')->count(),
        ];

        return view('admin.spots.index', compact('spots', 'category', 'search', 'totalSpots', 'categoriesCount', 'stats'));
    }

    /**
     * Tampilkan form pembuatan tempat wisata baru
     */
    public function create()
    {
        $totalSpots = TouristSpot::count();
        return view('admin.spots.create', compact('totalSpots'));
    }

    /**
     * Simpan tempat wisata baru ke database PostgreSQL / PostGIS
     */
    public function store(Request $request, SpatialBoundaryService $spatialBoundary)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:Alam & Curug,Kuliner,Edukasi & Budaya',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'detailed_description' => 'nullable|string',
            'operational_hours' => 'nullable|string|max:100',
            'ticket_price' => 'nullable|string|max:100',
            'rating' => 'nullable|numeric|between:0,5',
            'is_popular' => 'nullable|boolean',
            'photos.*' => 'nullable|file|max:15360',
            'photo_order' => 'nullable|string', // JSON array of identifiers
        ]);

        // Silent Spatial Validation (Auto-Kill / Quarantine jika di luar batas administrasi Kota Bogor)
        if (!$spatialBoundary->isWithinKotaBogor((float) $validated['latitude'], (float) $validated['longitude'])) {
            $spatialBoundary->quarantine($request, $validated, 'create', 'web_admin');
            $cleanName = trim((string) $validated['name']);

            return redirect()->route('admin.spots.index')
                ->with('success', "Tempat wisata '{$cleanName}' berhasil ditambahkan ke database!")
                ->with('admin_feedback_type', 'save-success');
        }

        // Buat slug unik
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (TouristSpot::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        // Upload file foto-foto yang diunggah ke folder public/images/spots/
        $uploadedMap = $this->processUploadedPhotos($request);

        // Susun urutan foto berdasarkan photo_order yang dikirim (hasil drag and drop)
        $orderedGallery = [];
        $orderList = json_decode($request->input('photo_order', '[]'), true) ?: [];

        foreach ($orderList as $item) {
            $src = $item['src'] ?? '';
            $fileId = $item['fileId'] ?? null;

            if ($fileId && isset($uploadedMap[$fileId])) {
                $orderedGallery[] = $uploadedMap[$fileId];
            } elseif (!empty($src) && str_starts_with($src, '/images/')) {
                $orderedGallery[] = $src;
            }
        }

        // Pastikan seluruh foto baru yang terunggah ikut masuk ke galeri (meski tidak ada di photo_order)
        foreach ($uploadedMap as $uploadedPath) {
            if (!in_array($uploadedPath, $orderedGallery, true)) {
                $orderedGallery[] = $uploadedPath;
            }
        }

        // Jika sama sekali tidak ada foto yang diupload, gunakan foto default
        if (empty($orderedGallery)) {
            $orderedGallery = ['/images/spots/taman-peranginan.jpg'];
        }

        // Foto paling atas (indeks 0) menjadi foto utama!
        $primaryImage = $orderedGallery[0];

        $spot = DB::transaction(function () use ($slug, $validated, $request, $primaryImage, $orderedGallery) {
            $created = TouristSpot::create([
                'slug' => $slug,
                'name' => $validated['name'],
                'category' => $validated['category'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'address' => $validated['address'] ?? null,
                'description' => $validated['description'] ?? null,
                'detailed_description' => $validated['detailed_description'] ?? null,
                'operational_hours' => $validated['operational_hours'] ?? '08.00 - 17.00 WIB',
                'ticket_price' => $validated['ticket_price'] ?? 'Gratis',
                'rating' => $validated['rating'] ?? 4.5,
                'is_popular' => $request->has('is_popular'),
                'image' => $primaryImage,
                'gallery' => array_values(array_unique($orderedGallery)),
            ]);

            // Simpan Geometry spasial (kompatibel PostgreSQL PostGIS & MySQL/MariaDB)
            $this->updateSpatialPoint($created->id, (float) $validated['longitude'], (float) $validated['latitude']);

            return $created;
        });

        return redirect()->route('admin.spots.index')
            ->with('success', "Tempat wisata '{$spot->name}' berhasil ditambahkan ke database!")
            ->with('admin_feedback_type', 'save-success');
    }

    /**
     * Tampilkan form edit tempat wisata
     */
    public function edit(Request $request, $id)
    {
        $spot = TouristSpot::findOrFail($id);
        $totalSpots = TouristSpot::count();
        $returnContext = $this->extractListContext($request);
        $returnQuery = $this->formatRawListParams($returnContext);
        $backToListUrl = route('admin.spots.index', $returnQuery);

        return view('admin.spots.edit', compact('spot', 'totalSpots', 'returnQuery', 'backToListUrl'));
    }

    /**
     * Update data tempat wisata
     */
    public function update(Request $request, $id, SpatialBoundaryService $spatialBoundary)
    {
        $spot = TouristSpot::findOrFail($id);
        $listContext = $this->extractListContext($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:Alam & Curug,Kuliner,Edukasi & Budaya',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'detailed_description' => 'nullable|string',
            'operational_hours' => 'nullable|string|max:100',
            'ticket_price' => 'nullable|string|max:100',
            'rating' => 'nullable|numeric|between:0,5',
            'is_popular' => 'nullable|boolean',
            'photos.*' => 'nullable|file|max:15360',
            'photo_order' => 'nullable|string',
        ]);

        // Silent Spatial Validation (Auto-Kill / Quarantine jika koordinat baru keluar batas Kota Bogor)
        if (!$spatialBoundary->isWithinKotaBogor((float) $validated['latitude'], (float) $validated['longitude'])) {
            $spatialBoundary->quarantine($request, $validated, 'update', 'web_admin', $spot);
            $cleanName = trim((string) $validated['name']);
            $redirectParams = $this->buildListRedirectParams($listContext);

            return redirect()->route('admin.spots.index', $redirectParams)
                ->with('success', "Tempat wisata '{$cleanName}' berhasil diperbarui!")
                ->with('admin_feedback_type', 'save-success');
        }

        // Upload file foto baru yang diunggah ke public/images/spots/
        $uploadedMap = $this->processUploadedPhotos($request);

        // Susun urutan foto berdasarkan photo_order drag-and-drop
        $orderedGallery = [];
        $orderList = json_decode($request->input('photo_order', '[]'), true) ?: [];

        if (!empty($uploadedMap)) {
            // Ketika admin mengunggah foto baru pada halaman Edit, ganti foto lama dengan bersih
            // mengikuti urutan drag-and-drop foto baru (dan pastikan semua foto baru tersimpan)
            foreach ($orderList as $item) {
                $fileId = $item['fileId'] ?? null;
                if ($fileId && isset($uploadedMap[$fileId])) {
                    $orderedGallery[] = $uploadedMap[$fileId];
                }
            }
            foreach ($uploadedMap as $uploadedPath) {
                if (!in_array($uploadedPath, $orderedGallery, true)) {
                    $orderedGallery[] = $uploadedPath;
                }
            }
        } else {
            // Tidak ada foto baru: pertahankan urutan/penghapusan foto lama dari photo_order
            foreach ($orderList as $item) {
                $src = $item['src'] ?? '';
                if (!empty($src) && str_starts_with($src, '/images/')) {
                    $orderedGallery[] = $src;
                }
            }
        }

        // Fallback jika kosong, pertahankan foto yang ada sebelumnya
        if (empty($orderedGallery)) {
            $orderedGallery = is_array($spot->gallery) && count($spot->gallery) > 0 ? $spot->gallery : [$spot->image];
        }

        $orderedGallery = array_values(array_unique(array_filter($orderedGallery)));
        $primaryImage = $orderedGallery[0] ?? $spot->image;

        DB::transaction(function () use ($spot, $validated, $request, $primaryImage, $orderedGallery) {
            $spot->update([
                'name' => $validated['name'],
                'category' => $validated['category'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'address' => $validated['address'] ?? null,
                'description' => $validated['description'] ?? null,
                'detailed_description' => $validated['detailed_description'] ?? null,
                'operational_hours' => $validated['operational_hours'] ?? $spot->operational_hours,
                'ticket_price' => $validated['ticket_price'] ?? $spot->ticket_price,
                'rating' => $validated['rating'] ?? $spot->rating,
                'is_popular' => $request->has('is_popular'),
                'image' => $primaryImage,
                'gallery' => $orderedGallery,
            ]);

            // Update Geometry spasial (kompatibel PostgreSQL PostGIS & MySQL/MariaDB)
            $this->updateSpatialPoint($spot->id, (float) $validated['longitude'], (float) $validated['latitude']);
        });

        $redirectParams = $this->buildListRedirectParams($listContext);

        return redirect()->route('admin.spots.index', $redirectParams)
            ->with('success', "Tempat wisata '{$spot->name}' berhasil diperbarui!")
            ->with('admin_feedback_type', 'save-success');
    }

    /**
     * Hapus tempat wisata
     */
    public function destroy(Request $request, $id)
    {
        $spot = TouristSpot::findOrFail($id);
        $listContext = $this->extractListContext($request);
        $name = $spot->name;
        $spot->delete();

        $redirectParams = $this->buildListRedirectParams($listContext);

        return redirect()->route('admin.spots.index', $redirectParams)
            ->with('success', "Tempat wisata '{$name}' telah dihapus.")
            ->with('admin_feedback_type', 'delete-success');
    }

    /**
     * Bangun query daftar destinasi berdasarkan filter kategori & kata kunci pencarian.
     */
    private function buildFilteredSpotsQuery(?string $category, ?string $search)
    {
        $query = TouristSpot::query();

        if ($category && $category !== 'Semua' && in_array($category, self::ALLOWED_CATEGORIES, true)) {
            $query->where('category', $category);
        }

        $trimmedSearch = trim((string) ($search ?? ''));
        if ($trimmedSearch !== '') {
            $likeOp = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($trimmedSearch, $likeOp) {
                $q->where('name', $likeOp, "%{$trimmedSearch}%")
                  ->orWhere('address', $likeOp, "%{$trimmedSearch}%")
                  ->orWhere('description', $likeOp, "%{$trimmedSearch}%");
            });
        }

        return $query;
    }

    /**
     * Ekstrak konteks halaman daftar wisata (kategori, pencarian, nomor halaman) secara aman
     * dari input form, query string, atau Referer internal /admin/spots (anti open-redirect).
     *
     * @return array{category: ?string, q: string, page: int}
     */
    private function extractListContext(Request $request): array
    {
        $rawCategory = $request->input('return_category', $request->query('category'));
        $rawSearch = $request->input('return_q', $request->query('q'));
        $rawPage = $request->input('return_page', $request->query('page'));

        // Fallback aman: baca hanya query string dari Referer internal /admin/spots jika input tidak dikirim
        if ($rawCategory === null && $rawSearch === null && $rawPage === null) {
            $referer = (string) $request->headers->get('referer', '');
            if ($referer !== '') {
                $parsed = parse_url($referer);
                $refPath = $parsed['path'] ?? '';
                if (in_array($refPath, ['/admin', '/admin/spots'], true) && !empty($parsed['query'])) {
                    parse_str($parsed['query'], $refParams);
                    $rawCategory = $refParams['category'] ?? null;
                    $rawSearch = $refParams['q'] ?? null;
                    $rawPage = $refParams['page'] ?? null;
                }
            }
        }

        $category = is_string($rawCategory) && in_array($rawCategory, self::ALLOWED_CATEGORIES, true)
            ? $rawCategory
            : null;
        $search = is_string($rawSearch) ? trim($rawSearch) : '';
        $page = is_numeric($rawPage) ? max(1, (int) $rawPage) : 1;

        return [
            'category' => $category,
            'q' => $search,
            'page' => $page,
        ];
    }

    /**
     * Konversi konteks daftar mentah menjadi array query parameter yang ringkas.
     *
     * @param  array{category: ?string, q: string, page: int}  $context
     * @return array<string, int|string>
     */
    private function formatRawListParams(array $context): array
    {
        $params = [];
        if (!empty($context['category'])) {
            $params['category'] = $context['category'];
        }
        if ($context['q'] !== '') {
            $params['q'] = $context['q'];
        }
        if ($context['page'] > 1) {
            $params['page'] = $context['page'];
        }

        return $params;
    }

    /**
     * Bangun parameter redirect ke daftar wisata dengan clamp halaman otomatis
     * agar tidak pernah mendarat pada halaman kosong pasca hapus/ubah kategori.
     *
     * @param  array{category: ?string, q: string, page: int}  $context
     * @return array<string, int|string>
     */
    private function buildListRedirectParams(array $context): array
    {
        $matchingCount = $this->buildFilteredSpotsQuery($context['category'], $context['q'])->count();
        $lastPage = max(1, (int) ceil($matchingCount / self::PER_PAGE));
        $clampedPage = min(max(1, $context['page']), $lastPage);

        return $this->formatRawListParams([
            'category' => $context['category'],
            'q' => $context['q'],
            'page' => $clampedPage,
        ]);
    }

    /**
     * Proses seluruh file foto yang diunggah ke public/images/spots/ dengan validasi non-ketat (isValid + <= 15MB)
     * dan fallback langsung copy/move jika GD gagal mendekode gambar unduhan browser.
     *
     * @return array<string, string>
     */
    private function processUploadedPhotos(Request $request): array
    {
        $uploadedMap = [];
        if (!$request->hasFile('photos')) {
            return $uploadedMap;
        }

        $spotsDir = public_path('images/spots');
        if (!file_exists($spotsDir)) {
            mkdir($spotsDir, 0755, true);
        }

        $files = $request->file('photos');
        if (!is_array($files)) {
            $files = [$files];
        }

        foreach (array_values($files) as $idx => $photoFile) {
            if (!$photoFile) {
                continue;
            }

            if (!$photoFile->isValid()) {
                throw ValidationException::withMessages([
                    'photos' => ['Upload foto gagal: ' . $photoFile->getErrorMessage()],
                ]);
            }

            $ext = $this->resolvePhotoExtension($photoFile);
            $cleanName = Str::slug(pathinfo($photoFile->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'spot';
            $fileName = time() . '_' . uniqid() . '_' . $cleanName . '.' . $ext;

            try {
                ImageCompressor::compressAndSave($photoFile, $spotsDir, $fileName, 1280, 1280, 82);
            } catch (\Throwable $e) {
                throw ValidationException::withMessages([
                    'photos' => ['Salah satu file foto tidak valid atau gagal diproses: ' . $e->getMessage()],
                ]);
            }

            $uploadedMap['new_' . $idx] = '/images/spots/' . $fileName;
        }

        return $uploadedMap;
    }

    /**
     * Tentukan ekstensi aman dari tipe MIME asli file (menangani AVIF/WebP/JFIF yang berekstensi .jpg).
     */
    private function resolvePhotoExtension($photoFile): string
    {
        $realPath = $photoFile->getRealPath();
        $realMime = is_string($realPath) && $realPath !== ''
            ? ImageCompressor::detectRealMime($realPath)
            : null;

        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/avif' => 'avif',
            'image/heic' => 'heic',
            'image/heif' => 'heif',
            'image/bmp' => 'bmp',
        ];

        if ($realMime && isset($mimeToExt[$realMime])) {
            return $mimeToExt[$realMime];
        }

        $clientExt = strtolower((string) $photoFile->getClientOriginalExtension());
        if ($clientExt === 'jfif' || $clientExt === 'jpeg') {
            return 'jpg';
        }

        if (in_array($clientExt, ['jpg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif', 'bmp'], true)) {
            return $clientExt;
        }

        $guessedExt = strtolower((string) ($photoFile->guessExtension() ?: 'jpg'));
        if ($guessedExt === 'jfif' || $guessedExt === 'jpeg') {
            return 'jpg';
        }

        return in_array($guessedExt, ['jpg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif', 'bmp'], true)
            ? $guessedExt
            : 'jpg';
    }

    /**
     * Update kolom spasial geom sesuai driver database (PostGIS / MySQL).
     */
    private function updateSpatialPoint(int $spotId, float $lon, float $lat): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement(
                'UPDATE tourist_spots SET geom = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?',
                [$lon, $lat, $spotId]
            );
        } elseif ($driver === 'mysql') {
            DB::statement(
                'UPDATE tourist_spots SET geom = POINT(?, ?) WHERE id = ?',
                [$lon, $lat, $spotId]
            );
        }
    }
}
