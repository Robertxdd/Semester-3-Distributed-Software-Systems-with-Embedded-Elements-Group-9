<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StandReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'interval_minutes',
        'is_active',
        'start_time',
        'end_time',
        'last_reminded_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_reminded_at' => 'datetime',
        'start_time' => 'datetime:H:i:s',
        'end_time' => 'datetime:H:i:s',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}