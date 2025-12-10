<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReminderSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'enabled',
        'type',
        'every_minutes',
        'max_sitting_minutes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
