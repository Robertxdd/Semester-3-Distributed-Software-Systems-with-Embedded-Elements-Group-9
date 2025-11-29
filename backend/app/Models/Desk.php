<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Desk extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'external_id',   // linked simulator identifier
        'manufacturer',  // simulator-reported manufacturer
        'height',
        'min_height',
        'max_height',
        'state',
    ];

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

    public function settings()
    {
        return $this->hasMany(DeskSetting::class);
    }

    public function maintenanceRecords()
    {
        return $this->hasMany(MaintenanceRecord::class);
    }
}
