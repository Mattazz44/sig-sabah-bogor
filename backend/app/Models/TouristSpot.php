<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class TouristSpot extends Model
{
    protected $table = 'tourist_spots';

    protected $fillable = [
        'slug',
        'name',
        'category',
        'description',
        'detailed_description',
        'address',
        'rating',
        'operational_hours',
        'ticket_price',
        'image',
        'gallery',
        'latitude',
        'longitude',
        'is_popular',
    ];

    protected $casts = [
        'rating' => 'float',
        'latitude' => 'float',
        'longitude' => 'float',
        'is_popular' => 'boolean',
        'gallery' => 'array',
    ];

    /**
     * Scope query untuk mengembalikan representasi GeoJSON / format spasial dari geom
     */
    public function scopeWithGeoJson($query)
    {
        return $query->select(
            'tourist_spots.*',
            DB::raw('ST_AsGeoJSON(geom) as geojson')
        );
    }
}
