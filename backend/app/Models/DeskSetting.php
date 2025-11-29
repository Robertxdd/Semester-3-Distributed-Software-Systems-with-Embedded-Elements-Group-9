<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeskSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'desk_id',
        'user_id',
        'preset_name',
        'target_height',
        'notes',
    ];

    public function desk()
    {
        return $this->belongsTo(Desk::class);
    }
}
