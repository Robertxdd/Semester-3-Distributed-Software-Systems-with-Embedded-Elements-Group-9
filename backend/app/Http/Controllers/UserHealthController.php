<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use App\Models\ReminderSetting;
use App\Services\DeskDataHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class UserHealthController extends Controller
{
    public function healthSummary(Request $request, DeskDataHandler $handler): JsonResponse
    {
        $range = $request->query('range', 'today');
        $end = Carbon::now();
        $start = $range === 'week'
            ? $end->copy()->startOfDay()->subDays(6)
            : $end->copy()->startOfDay();

        $desks = Desk::all();
        $sitting = 0;
        $standing = 0;
        $postureChanges = 0;
        $perDay = [];

        if ($range === 'week') {
            for ($i = 0; $i < 7; $i++) {
                $dayStart = $start->copy()->addDays($i);
                $dayEnd = $dayStart->copy()->endOfDay();
                $daySit = 0;
                $dayStand = 0;
                $dayChanges = 0;

                foreach ($desks as $desk) {
                    $stats = $handler->getPostureStatsForRange($desk, $dayStart, $dayEnd);
                    $daySit += $stats['sitting_minutes'] ?? 0;
                    $dayStand += $stats['standing_minutes'] ?? 0;
                    $dayChanges += $handler->getMovementsForRange($desk, $dayStart, $dayEnd);
                }

                $perDay[] = [
                    'date' => $dayStart->format('Y-m-d'),
                    'sitting' => $daySit,
                    'standing' => $dayStand,
                ];

                $sitting += $daySit;
                $standing += $dayStand;
                $postureChanges += $dayChanges;
            }
        } else {
            foreach ($desks as $desk) {
                $stats = $handler->getPostureStatsForRange($desk, $start, $end);
                $sitting += $stats['sitting_minutes'] ?? 0;
                $standing += $stats['standing_minutes'] ?? 0;
                $postureChanges += $handler->getMovementsForRange($desk, $start, $end);
            }
        }

        return response()->json([
            'range' => $range,
            'sitting_minutes' => $sitting,
            'standing_minutes' => $standing,
            'posture_changes' => $postureChanges,
            'health_message' => $this->buildHealthMessage($standing, $sitting, $postureChanges),
            'per_day' => $perDay,
        ]);
    }

    public function reminders(Request $request): JsonResponse
    {
        $user = $request->user();

        $settings = ReminderSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'enabled' => true,
                'type' => 'TIME',
                'every_minutes' => 45,
                'max_sitting_minutes' => 90,
            ]
        );

        return response()->json($settings);
    }

    public function updateReminders(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'type' => ['required', 'in:TIME,USAGE'],
            'every_minutes' => ['nullable', 'integer', 'min:10', 'max:240'],
            'max_sitting_minutes' => ['nullable', 'integer', 'min:15', 'max:300'],
        ]);

        $settings = ReminderSetting::firstOrCreate(['user_id' => $request->user()->id]);
        $settings->fill([
            'enabled' => $data['enabled'],
            'type' => $data['type'],
            'every_minutes' => $data['type'] === 'TIME'
                ? ($data['every_minutes'] ?? $settings->every_minutes ?? 45)
                : $settings->every_minutes,
            'max_sitting_minutes' => $data['type'] === 'USAGE'
                ? ($data['max_sitting_minutes'] ?? $settings->max_sitting_minutes ?? 90)
                : $settings->max_sitting_minutes,
        ]);
        $settings->save();

        return response()->json($settings);
    }

    protected function buildHealthMessage(int $standingMinutes, int $sittingMinutes, int $postureChanges): string
    {
        $total = max(1, $standingMinutes + $sittingMinutes);
        $standingShare = round(($standingMinutes / $total) * 100);

        if ($standingMinutes + $sittingMinutes < 30) {
            return 'Not much desk time yet. Plan a sit/stand rotation of 40-60% standing as your day ramps up.';
        }

        if ($standingShare < 35) {
            return 'Mostly sitting so far. Stand for 10 minutes and add a few posture changes to rebalance.';
        }

        if ($standingShare > 65) {
            return 'You are standing a lot. Sit briefly every hour to avoid fatigue and keep circulation flowing.';
        }

        if ($postureChanges < 5) {
            return 'Good balance, but try a couple more posture shifts this hour to stay limber.';
        }

        return 'Great balance today. Keep alternating every 40-60 minutes to maintain that healthy rhythm.';
    }
}
