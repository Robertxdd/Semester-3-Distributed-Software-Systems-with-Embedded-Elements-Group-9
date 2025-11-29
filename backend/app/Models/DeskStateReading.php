<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeskStateReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'desk_id',
        'position_mm',
        'speed_mms',
        'status',
        'is_position_lost',
        'is_overload_protection_up',
        'is_overload_protection_down',
        'is_anti_collision',
        'collected_at',
    ];

    protected $casts = [
        'is_position_lost' => 'boolean',
        'is_overload_protection_up' => 'boolean',
        'is_overload_protection_down' => 'boolean',
        'is_anti_collision' => 'boolean',
        'collected_at' => 'datetime',
    ];

    public function desk()
    {
        return $this->belongsTo(Desk::class);
    }
}
