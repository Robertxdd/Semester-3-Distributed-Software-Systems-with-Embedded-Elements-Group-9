<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Desk extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'external_id',   // 👈 NUEVO
        'manufacturer',  // 👈 NUEVO
        'height',
        'min_height',
        'max_height',
        'state',
    ];

    // Relaciones con las nuevas tablas (las crearemos ahora)
    public function stateReadings()
    {
        return $this->hasMany(DeskStateReading::class);
    }

    public function usageSnapshots()
    {
        return $this->hasMany(DeskUsageSnapshot::class);
    }

    public function errors()
    {
        return $this->hasMany(DeskError::class);
    }
}
