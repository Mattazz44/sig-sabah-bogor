<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedActivity extends Model
{
    protected $table = 'saved_activities';

    protected $fillable = [
        'user_id',
        'name',
        'location',
        'date_label',
    ];
}
