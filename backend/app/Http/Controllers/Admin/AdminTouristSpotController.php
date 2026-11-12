<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TouristSpot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminTouristSpotController extends Controller
{
    /**
     * Tampilkan halaman dashboard admin daftar dan form input tempat wisata
     */
    public function index(Request $request)
    {
        $category = $request->query('category', 'Semua');
        $search = $request->query('q', '');

        $query = TouristSpot::query()->orderBy('created_at', 'desc');

        if ($category && $category !== 'Semua') {
            $query->where('category', $category);
        }

        if (!empty($search)) {
            $likeOp = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $likeOp) {
                $q->where('name', $likeOp, "%{$search}%")
                  ->orWhere('address', $likeOp, "%{$search}%")
                  ->orWhere('description', $likeOp, "%{$search}%");
            });
        }

        $spots = $query->paginate(10)->withQueryString();
        $totalSpots = TouristSpot::count();
        $categoriesCount = [
            'Semua' => $totalSpots,
            'Alam & Curug' => TouristSpot::where('category', 'Alam & Curug')->count(),
            'Kuliner' => TouristSpot::where('category', 'Kuliner')->count(),
            'Edukasi & Budaya' => TouristSpot::where('category', 'Edukasi & Budaya')->count(),
        ];

        return view('admin.spots.index', compact('spots', 'category', 'search', 'totalSpots', 'categoriesCount'));
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
    public function store(Request $request)
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
            'photos.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
            'photo_order' => 'nullable|string', // JSON array of identifiers
        ]);

        // Buat slug unik
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (TouristSpot::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        // Upload file foto-foto yang diunggah
        $uploadedMap = []; // id -> path
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $idx => $photoFile) {
                $ext = $photoFile->getClientOriginalExtension();
                $cleanName = Str::slug(pathinfo($photoFile->getClientOriginalName(), PATHINFO_FILENAME));
                $fileName = time() . '_' . uniqid() . '_' . $cleanName . '.' . $ext;
                $photoFile->move(public_path('images'), $fileName);
                $uploadedMap['new_' . $idx] = '/images/' . $fileName;
            }
        }

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

        // Fallback jika tidak ada orderList yang terproses tapi ada foto yang diupload
        if (empty($orderedGallery) && !empty($uploadedMap)) {
            $orderedGallery = array_values($uploadedMap);
        }

        // Jika sama sekali tidak ada foto yang diupload, gunakan foto default
        if (empty($orderedGallery)) {
            $orderedGallery = ['/images/taman-peranginan.jpg'];
        }

        // Foto paling atas (indeks 0) menjadi foto utama!
        $primaryImage = $orderedGallery[0];

        $spot = TouristSpot::create([
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
        $this->updateSpatialPoint($spot->id, (float) $validated['longitude'], (float) $validated['latitude']);

        return redirect()->route('admin.spots.index')->with('success', "Tempat wisata '{$spot->name}' berhasil ditambahkan ke database!");
    }

    /**
     * Tampilkan form edit tempat wisata
     */
    public function edit($id)
    {
        $spot = TouristSpot::findOrFail($id);
        $totalSpots = TouristSpot::count();
        return view('admin.spots.edit', compact('spot', 'totalSpots'));
    }

    /**
     * Update data tempat wisata
     */
    public function update(Request $request, $id)
    {
        $spot = TouristSpot::findOrFail($id);

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
            'photos.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
            'photo_order' => 'nullable|string',
        ]);

        // Upload file foto baru yang diunggah
        $uploadedMap = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $idx => $photoFile) {
                $ext = $photoFile->getClientOriginalExtension();
                $cleanName = Str::slug(pathinfo($photoFile->getClientOriginalName(), PATHINFO_FILENAME));
                $fileName = time() . '_' . uniqid() . '_' . $cleanName . '.' . $ext;
                $photoFile->move(public_path('images'), $fileName);
                $uploadedMap['new_' . $idx] = '/images/' . $fileName;
            }
        }

        // Susun urutan foto berdasarkan photo_order drag-and-drop
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

        // Fallback jika kosong, pertahankan foto yang ada sebelumnya
        if (empty($orderedGallery)) {
            $orderedGallery = is_array($spot->gallery) && count($spot->gallery) > 0 ? $spot->gallery : [$spot->image];
        }

        $orderedGallery = array_values(array_unique(array_filter($orderedGallery)));
        $primaryImage = $orderedGallery[0] ?? $spot->image;

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

        return redirect()->route('admin.spots.index')->with('success', "Tempat wisata '{$spot->name}' berhasil diperbarui!");
    }

    /**
     * Hapus tempat wisata
     */
    public function destroy($id)
    {
        $spot = TouristSpot::findOrFail($id);
        $name = $spot->name;
        $spot->delete();

        return redirect()->route('admin.spots.index')->with('success', "Tempat wisata '{$name}' telah dihapus.");
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
