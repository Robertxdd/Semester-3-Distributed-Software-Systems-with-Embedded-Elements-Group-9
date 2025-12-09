<?php

namespace App\Services;

use App\Models\Desk;
use Illuminate\Support\Facades\DB;

class DeskReportingService
{
    public function breakdowns(Desk $desk, $from, $to)
    {
        return DB::table('desk_errors')
            ->where('desk_id', $desk->id)
            ->when($from, fn($q) => $q->where('collected_at', '>=', $from))
            ->when($to, fn($q) => $q->where('collected_at', '<=', $to))
            ->get();
    }

    public function improperUse(Desk $desk, $from, $to)
    {
        return DB::table('desk_state_readings')
            ->where('desk_id', $desk->id)
            ->when($from, fn($q) => $q->where('collected_at', '>=', $from))
            ->when($to, fn($q) => $q->where('collected_at', '<=', $to))
            ->where(function ($q) {
                $q->where('is_overload_protection_up', true)
                  ->orWhere('is_overload_protection_down', true)
                  ->orWhere('is_anti_collision', true)
                  ->orWhere('position_mm', '<', 300)
                  ->orWhere('position_mm', '>', 1400);
            })
            ->get();
    }

    public function usage(Desk $desk, $from, $to)
    {
        return DB::table('desk_usage_snapshots')
            ->where('desk_id', $desk->id)
            ->when($from, fn($q) => $q->where('collected_at', '>=', $from))
            ->when($to, fn($q) => $q->where('collected_at', '<=', $to))
            ->selectRaw('
                MIN(activations_counter) as start_activations,
                MAX(activations_counter) as end_activations,
                MIN(sit_stand_counter) as start_sitstand,
                MAX(sit_stand_counter) as end_sitstand
            ')
            ->first();
    }
}
