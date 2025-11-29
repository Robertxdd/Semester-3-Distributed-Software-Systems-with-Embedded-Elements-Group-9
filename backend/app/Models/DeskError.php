<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeskError extends Model
{
    use HasFactory;

    protected $fillable = [
        'desk_id',
        'error_code',
        'time_s',
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
