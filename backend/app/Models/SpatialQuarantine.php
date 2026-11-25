<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpatialQuarantine extends Model
{
    protected $table = 'spatial_quarantines';

    protected $fillable = [
        'user_id',
        'action',
        'source_channel',
        'target_spot_id',
        'spot_name',
        'category',
        'latitude',
        'longitude',
        'rejected_geometry',
        'payload_snapshot',
        'reason',
    ];

    protected $casts = [
        'target_spot_id' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
        'rejected_geometry' => 'array',
        'payload_snapshot' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
