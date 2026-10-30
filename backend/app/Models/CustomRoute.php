<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomRoute extends Model
{
    protected $table = 'custom_routes';

    protected $fillable = [
        'user_id',
        'slug',
        'title',
        'desc',
        'is_primary',
        'stops',
        'total_distance',
        'total_duration',
        'place_ids',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'stops' => 'array',
        'place_ids' => 'array',
    ];
}
