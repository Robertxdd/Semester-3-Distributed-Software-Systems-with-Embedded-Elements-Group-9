<?php

namespace App\Services;

use App\Models\Desk;
use App\Models\DeskError;
use App\Models\DeskSetting;
use App\Models\DeskStateReading;
use App\Models\DeskUsageSnapshot;
use App\Models\MaintenanceRecord;
use Illuminate\Support\Carbon;

class DeskDataHandler
{
    public const STANDING_THRESHOLD_MM = 800;
    public const SITTING_THRESHOLD_MM = 400;
    public const MOVEMENT_DELTA_MM = 10;
    public const MIN_STANDING_MINUTES_PER_DAY = 60;

    public function saveStateReading(Desk $desk, array $state, Carbon $timestamp): DeskStateReading
    {
        return DeskStateReading::create([
            'desk_id' => $desk->id,
            'position_mm' => $state['position_mm'] ?? null,
            'speed_mms' => $state['speed_mms'] ?? null,
            'status' => $state['status'] ?? null,
            'is_position_lost' => $state['isPositionLost'] ?? false,
            'is_overload_protection_up' => $state['isOverloadProtectionUp'] ?? false,
            'is_overload_protection_down' => $state['isOverloadProtectionDown'] ?? false,
            'is_anti_collision' => $state['isAntiCollision'] ?? false,
            'collected_at' => $timestamp,
        ]);
    }

    public function saveUsageSnapshot(Desk $desk, array $usage, Carbon $timestamp): DeskUsageSnapshot
    {
        return DeskUsageSnapshot::create([
            'desk_id' => $desk->id,
            'activations_counter' => $usage['activationsCounter'] ?? null,
            'sit_stand_counter' => $usage['sitStandCounter'] ?? null,
            'collected_at' => $timestamp,
        ]);
    }

    public function saveErrors(Desk $desk, array $errors, Carbon $timestamp): int
    {
        $inserted = 0;

        foreach ($errors as $error) {
            $created = DeskError::firstOrCreate(
                [
                    'desk_id' => $desk->id,
                    'error_code' => $error['errorCode'] ?? null,
                    'time_s' => $error['time_s'] ?? null,
                ],
                [
                    'collected_at' => $timestamp,
                ]
            );

            if ($created->wasRecentlyCreated) {
                $inserted++;
            }
        }

        return $inserted;
    }

    public function getStateHistory(Desk $desk, ?Carbon $from = null, ?Carbon $to = null)
    {
        $query = $desk->stateReadings()->orderByDesc('collected_at');

        if ($from) {
            $query->where('collected_at', '>=', $from);
        }

        if ($to) {
            $query->where('collected_at', '<=', $to);
        }

        return $query->get();
    }

    public function getUsageSummary(Desk $desk, ?Carbon $from = null, ?Carbon $to = null): array
    {
        $query = $desk->usageSnapshots()->orderBy('collected_at');

        if ($from) {
            $query->where('collected_at', '>=', $from);
        }

        if ($to) {
            $query->where('collected_at', '<=', $to);
        }

        $snapshots = $query->get();

        if ($snapshots->isEmpty()) {
            return [
                'activations_delta' => 0,
                'sit_stand_delta' => 0,
                'from' => $from,
                'to' => $to,
            ];
        }

        $first = $snapshots->first();
        $last = $snapshots->last();

        return [
            'activations_delta' => ($last->activations_counter ?? 0) - ($first->activations_counter ?? 0),
            'sit_stand_delta' => ($last->sit_stand_counter ?? 0) - ($first->sit_stand_counter ?? 0),
            'from' => $from ?? $first->collected_at,
            'to' => $to ?? $last->collected_at,
        ];
    }

    private function classifyPosture(?int $positionMm): ?string
    {
        if ($positionMm === null) {
            return null;
        }

        if ($positionMm >= self::STANDING_THRESHOLD_MM) {
            return 'standing';
        }

        if ($positionMm <= self::SITTING_THRESHOLD_MM) {
            return 'sitting';
        }

        return null;
    }

    public function getTodayPostureStats(Desk $desk): array
    {
        $start = now()->startOfDay();
        $end = now();

        $readings = $desk->stateReadings()
            ->whereBetween('collected_at', [$start, $end])
            ->orderBy('collected_at')
            ->get();

        $standingSeconds = 0;
        $sittingSeconds = 0;

        for ($i = 0; $i < $readings->count() - 1; $i++) {
            $current = $readings[$i];
            $next = $readings[$i + 1];

            $posture = $this->classifyPosture($current->position_mm);
            $delta = $current->collected_at->diffInSeconds($next->collected_at);

            if ($posture === 'standing') {
                $standingSeconds += $delta;
            } elseif ($posture === 'sitting') {
                $sittingSeconds += $delta;
            }
        }

        return [
            'standing_minutes' => (int) floor($standingSeconds / 60),
            'sitting_minutes' => (int) floor($sittingSeconds / 60),
        ];
    }

    public function getTodayMovements(Desk $desk): int
    {
        $start = now()->startOfDay();
        $end = now();

        $readings = $desk->stateReadings()
            ->whereBetween('collected_at', [$start, $end])
            ->orderBy('collected_at')
            ->get();

        $movements = 0;
        for ($i = 0; $i < $readings->count() - 1; $i++) {
            $current = $readings[$i];
            $next = $readings[$i + 1];

            $delta = abs(($next->position_mm ?? 0) - ($current->position_mm ?? 0));
            if ($delta >= self::MOVEMENT_DELTA_MM) {
                $movements++;
            }
        }

        return $movements;
    }

    public function getTodayErrorCount(Desk $desk): int
    {
        $start = now()->startOfDay();
        $end = now();

        return $desk->errors()
            ->whereBetween('collected_at', [$start, $end])
            ->count();
    }

    public function evaluateTodayHealth(Desk $desk): array
    {
        $posture = $this->getTodayPostureStats($desk);
        $standingMinutes = $posture['standing_minutes'] ?? 0;

        if ($standingMinutes >= self::MIN_STANDING_MINUTES_PER_DAY) {
            return [
                'meets_recommendation' => true,
                'message' => 'You are standing enough today. Good job!',
            ];
        }

        return [
            'meets_recommendation' => false,
            'message' => 'You have been sitting too much today. Try to stand up more often in short intervals.',
        ];
    }

    public function updateDeskSettings(Desk $desk, array $data): DeskSetting
    {
        return DeskSetting::updateOrCreate(
            ['desk_id' => $desk->id, 'preset_name' => $data['preset_name'] ?? 'default'],
            [
                'user_id' => $data['user_id'] ?? null,
                'target_height' => $data['target_height'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]
        );
    }

    public function createMaintenanceRecord(Desk $desk, array $data): MaintenanceRecord
    {
        return MaintenanceRecord::create([
            'desk_id' => $desk->id,
            'summary' => $data['summary'] ?? 'Maintenance event',
            'details' => $data['details'] ?? null,
            'error_code' => $data['error_code'] ?? null,
            'recorded_at' => $data['recorded_at'] ?? Carbon::now(),
        ]);
    }
}
