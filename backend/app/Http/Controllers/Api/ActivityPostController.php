<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityPost;
use App\Models\User;
use App\Services\ImageCompressor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ActivityPostController extends Controller
{
    /**
     * Mengambil daftar postingan aktivitas untuk subtab 'Kamu' dan 'Komunitas'.
     */
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'all'); // 'kamu' | 'komunitas' | 'all'
        $userId = $request->query('user_id');
        $userName = $request->query('user_name');

        $query = ActivityPost::query()->orderBy('created_at', 'desc');

        if ($tab === 'kamu') {
            if ($userId) {
                $query->where('user_id', $userId);
            } elseif ($userName) {
                $query->where('user_name', $userName);
            }
        }

        $posts = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $posts,
        ]);
    }

    /**
     * Membuat postingan aktivitas baru dengan dukungan upload & kompresi foto nyata.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'image' => 'nullable',
            'user_id' => 'nullable|integer',
            'user_email' => 'nullable|email',
            'user_name' => 'nullable|string',
            'user_avatar' => 'nullable|string',
            'date' => 'nullable|string',
        ]);

        // Resolusi user_id pemilik akun yang membuat postingan
        $userId = $request->input('user_id');
        if (!$userId && $request->user()) {
            $userId = $request->user()->id;
        }
        if (!$userId && $request->filled('user_email')) {
            $userId = User::where('email', $request->input('user_email'))->value('id');
        }
        if (!$userId && !empty($validated['user_name'])) {
            $userId = User::where('name', $validated['user_name'])
                ->orWhere('username', Str::slug($validated['user_name']))
                ->value('id');
        }

        $imagePath = null;

        // 1. Jika dikirim file foto nyata (FormData multipart)
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $cleanName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'activity';
            $fileName = 'activity_' . time() . '_' . uniqid() . '_' . $cleanName . '.' . $ext;
            $targetDir = public_path('images/activities');

            // Kompresi foto otomatis (maksimal 1280x1280 px dengan kualitas 82%)
            ImageCompressor::compressAndSave($file, $targetDir, $fileName, 1280, 1280, 82);
            $imagePath = '/images/activities/' . $fileName;
        } elseif ($request->filled('image')) {
            $rawImage = $request->input('image');
            // Cegah penyimpanan URL blob memori browser lokal (blob:https://...)
            if (!str_starts_with($rawImage, 'blob:')) {
                $imagePath = $rawImage;
            }
        }

        $userName = !empty($validated['user_name']) ? $validated['user_name'] : 'Pengguna';
        $userAvatar = !empty($validated['user_avatar']) ? $validated['user_avatar'] : null;

        // Simpan tanggal nyata format lengkap bahasa Indonesia (contoh: '13 November 2026')
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $postDate = $request->filled('date')
            ? $request->input('date')
            : now()->format('j') . ' ' . ($months[(int)now()->format('n')] ?? now()->format('F')) . ' ' . now()->format('Y');

        $post = ActivityPost::create([
            'user_id' => $userId,
            'user_name' => $userName,
            'user_avatar' => $userAvatar,
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
     * Menghapus postingan aktivitas milik pengguna sendiri.
     */
    public function destroy(Request $request, $id)
    {
        $post = ActivityPost::find($id);

        if (!$post) {
            return response()->json([
                'status' => 'error',
                'message' => 'Postingan aktivitas tidak ditemukan',
            ], 404);
        }

        // Verifikasi kepemilikan postingan jika identitas dikirim
        $currentUserName = $request->input('user_name') ?: ($request->user()?->name ?? null);
        $currentUserId = $request->input('user_id') ?: ($request->user()?->id ?? null);

        if ($currentUserId && $post->user_id && (int)$currentUserId !== (int)$post->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak akses untuk menghapus postingan ini',
            ], 403);
        }

        if ($currentUserName && $post->user_name && $currentUserName !== $post->user_name && !$currentUserId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak akses untuk menghapus postingan ini',
            ], 403);
        }

        // Hapus file foto dari public/images/activities/ jika ada
        if (!empty($post->image)) {
            $rawImagePath = ltrim(parse_url($post->image, PHP_URL_PATH) ?? '', '/');
            $fullFilePath = public_path($rawImagePath);
            if (File::exists($fullFilePath) && str_contains($rawImagePath, 'images/activities/')) {
                // Jangan hapus foto sample bawaan
                if (!str_contains($rawImagePath, 'curug-cikuluwung.jpg') && !str_contains($rawImagePath, 'curug-leuwi-hejo.jpg')) {
                    File::delete($fullFilePath);
                }
            }
        }

        $post->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Postingan aktivitas berhasil dihapus',
        ]);
    }
}

