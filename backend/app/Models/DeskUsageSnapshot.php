<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeskUsageSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'desk_id',
        'activations_counter',
        'sit_stand_counter',
        'collected_at',
    ];

    protected $casts = [
        'collected_at' => 'datetime',
    ];

    public function desk()
    {
        return $this->belongsTo(Desk::class);
    }
}
