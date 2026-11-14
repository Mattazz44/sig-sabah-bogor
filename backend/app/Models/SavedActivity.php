<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedActivity extends Model
{
    protected $table = 'saved_activities';

    protected $fillable = [
        'user_id',
        'tourist_spot_id',
        'spot_slug',
        'name',
        'location',
        'date_label',
    ];

    public function touristSpot()
    {
        return $this->belongsTo(TouristSpot::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
