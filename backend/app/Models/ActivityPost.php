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
        'is_community',
        'is_other_user',
    ];

    protected $casts = [
        'is_community' => 'boolean',
        'is_other_user' => 'boolean',
    ];
}
