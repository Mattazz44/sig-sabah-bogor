<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityPost extends Model
{
    protected $table = 'activity_posts';

    protected $fillable = [
        'user_id',
        'user_name',
        'user_avatar',
        'date',
        'image',
        'title',
        'location',
    ];

    /**
     * Relasi ke model User pemilik postingan aktivitas
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Pastikan format tanggal selalu valid dalam format lengkap bahasa Indonesia
     */
    public function getDateAttribute($value)
    {
        if (($value === 'Baru saja' || empty($value)) && $this->created_at) {
            $months = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
                7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];
            $month = $months[(int)$this->created_at->format('n')] ?? $this->created_at->format('F');
            return $this->created_at->format('j') . ' ' . $month . ' ' . $this->created_at->format('Y');
        }

        return $value ?: 'Hari ini';
    }

    /**
     * Pastikan URL gambar aktivitas selalu mengarah ke direktori /images/activities/
     */
    public function getImageAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // Jika path gambar masih berformat lama /images/... (tanpa subfolder activities)
        if (str_starts_with($value, '/images/') && 
            !str_starts_with($value, '/images/activities/') && 
            !str_starts_with($value, '/images/spots/') && 
            !str_starts_with($value, '/images/avatars/')) {
            return '/images/activities/' . substr($value, strlen('/images/'));
        }

        return $value;
    }
}
