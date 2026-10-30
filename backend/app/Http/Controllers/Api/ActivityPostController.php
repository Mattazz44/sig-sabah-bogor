<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityPost;
use Illuminate\Http\Request;

class ActivityPostController extends Controller
{
    /**
     * Mengambil daftar postingan aktivitas untuk subtab 'Kamu' dan 'Komunitas'.
     */
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'all'); // 'kamu' | 'komunitas' | 'all'

        $query = ActivityPost::query()->orderBy('created_at', 'desc');

        if ($tab === 'kamu') {
            $query->where('is_community', false);
        } elseif ($tab === 'komunitas') {
            $query->where('is_community', true);
        }

        $posts = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $posts,
        ]);
    }

    /**
     * Membuat postingan aktivitas baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'image' => 'nullable|string',
            'user_name' => 'nullable|string',
            'user_avatar' => 'nullable|string',
            'is_community' => 'nullable|boolean',
        ]);

        $post = ActivityPost::create([
            'user_name' => $validated['user_name'] ?? 'Ambalingham',
            'user_avatar' => $validated['user_avatar'] ?? '/images/avatar-ambalingham.jpg',
            'date' => 'Baru saja',
            'image' => $validated['image'] ?? '/images/curug-cikuluwung.jpg',
            'title' => $validated['title'],
            'location' => $validated['location'],
            'is_community' => $validated['is_community'] ?? false,
            'is_other_user' => false,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Postingan aktivitas berhasil dibuat',
            'data' => $post,
        ], 201);
    }
}

