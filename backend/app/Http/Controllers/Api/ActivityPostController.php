<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityPost;
use App\Services\ImageCompressor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ActivityPostController extends Controller
{
    /**
     * Mengambil daftar postingan aktivitas untuk subtab 'Kamu' (terautentikasi) dan 'Komunitas'.
     */
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'all'); // 'kamu' | 'komunitas' | 'all'
        $query = ActivityPost::query()->orderBy('created_at', 'desc');

        if ($tab === 'kamu') {
            $authUser = $request->user('sanctum');
            if (!$authUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tidak terautentikasi.',
                ], 401);
            }

            $query->where('user_id', $authUser->id);
        }

        $posts = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $posts,
        ]);
    }

    /**
     * Membuat postingan aktivitas baru milik user terautentikasi dengan validasi & kompresi foto ketat.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
            'date' => 'nullable|string|max:64',
        ]);

        $imagePath = null;

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $guessedExt = strtolower((string) ($file->guessExtension() ?: $file->getClientOriginalExtension() ?: 'jpg'));
            $ext = in_array($guessedExt, ['jpg', 'jpeg', 'png', 'webp'], true) ? $guessedExt : 'jpg';
            $cleanName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'activity';
            $fileName = 'activity_' . $user->id . '_' . time() . '_' . uniqid() . '_' . $cleanName . '.' . $ext;
            $targetDir = public_path('images/activities');

            try {
                ImageCompressor::compressAndSave($file, $targetDir, $fileName, 1280, 1280, 82);
                $imagePath = '/images/activities/' . $fileName;
            } catch (\Throwable) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File gambar tidak valid atau gagal diproses.',
                ], 422);
            }
        }

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $postDate = !empty($validated['date'])
            ? $validated['date']
            : now()->format('j') . ' ' . ($months[(int) now()->format('n')] ?? now()->format('F')) . ' ' . now()->format('Y');

        $post = ActivityPost::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_avatar' => $user->avatar,
            'date' => $postDate,
            'image' => $imagePath,
            'title' => $validated['title'],
            'location' => $validated['location'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Postingan aktivitas berhasil dibuat',
            'data' => $post,
        ], 201);
    }

    /**
     * Menghapus postingan aktivitas (hanya pemilik postingan atau admin).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        $post = ActivityPost::find($id);

        if (!$post) {
            return response()->json([
                'status' => 'error',
                'message' => 'Postingan aktivitas tidak ditemukan',
            ], 404);
        }

        $isOwner = $post->user_id !== null && (int) $post->user_id === (int) $user->id;
        if (!$isOwner && !$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak akses untuk menghapus postingan ini',
            ], 403);
        }

        if (!empty($post->image)) {
            $rawImagePath = ltrim(parse_url($post->image, PHP_URL_PATH) ?? '', '/');
            $safeName = basename(str_replace('\\', '/', $rawImagePath));
            $activitiesRoot = realpath(public_path('images/activities'));
            $fullFilePath = $activitiesRoot ? realpath($activitiesRoot . DIRECTORY_SEPARATOR . $safeName) : false;

            if (
                $fullFilePath &&
                $activitiesRoot &&
                str_starts_with($fullFilePath, rtrim($activitiesRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR) &&
                File::exists($fullFilePath) &&
                !in_array($safeName, ['curug-cikuluwung.jpg', 'curug-leuwi-hejo.jpg'], true)
            ) {
                File::delete($fullFilePath);
            }
        }

        $post->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Postingan aktivitas berhasil dihapus',
        ]);
    }
}
