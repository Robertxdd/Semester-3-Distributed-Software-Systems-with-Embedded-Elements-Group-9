<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use App\Services\DeskDataHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeskStatsController extends Controller
{
    public function todayStats(Desk $desk, DeskDataHandler $handler): JsonResponse
    {
        $posture = $handler->getTodayPostureStats($desk);
        $movements = $handler->getTodayMovements($desk);
        $errors = $handler->getTodayErrorCount($desk);
        $health = $handler->evaluateTodayHealth($desk);

        return response()->json([
            'desk_id' => $desk->id,
            'standing_minutes' => $posture['standing_minutes'] ?? 0,
            'sitting_minutes' => $posture['sitting_minutes'] ?? 0,
            'movements_today' => $movements,
            'errors_today' => $errors,
            'meets_recommendation' => $health['meets_recommendation'] ?? false,
            'health_message' => $health['message'] ?? '',
        ]);
    }

    public function logState(Request $request, Desk $desk, DeskDataHandler $handler): JsonResponse
    {
        $data = $request->validate([
            'position_mm' => ['required', 'integer'],
            'status' => ['nullable', 'string', 'max:255'],
        ]);

        $handler->saveStateReading($desk, [
            'position_mm' => $data['position_mm'],
            'speed_mms' => null,
            'status' => $data['status'] ?? null,
            'isPositionLost' => false,
            'isOverloadProtectionUp' => false,
            'isOverloadProtectionDown' => false,
            'isAntiCollision' => false,
        ], now());

        return response()->json(['message' => 'State logged']);
    }

    public function todayStatsAll(Request $request, DeskDataHandler $handler): JsonResponse
    {
        $ids = $request->query('ids');
        $deskIds = null;
        if ($ids) {
            $deskIds = collect(explode(',', $ids))
                ->map(fn ($id) => (int) trim($id))
                ->filter(fn ($id) => $id > 0)
                ->values();
        }

        $desksQuery = Desk::query();
        if ($deskIds && $deskIds->isNotEmpty()) {
            $desksQuery->whereIn('id', $deskIds);
        }

        $desks = $desksQuery->get();
        $stats = $desks->map(function (Desk $desk) use ($handler) {
            $posture = $handler->getTodayPostureStats($desk);
            $movements = $handler->getTodayMovements($desk);
            $errors = $handler->getTodayErrorCount($desk);

            return [
                'desk_id' => $desk->id,
                'name' => $desk->name,
                'standing_minutes' => $posture['standing_minutes'] ?? 0,
                'sitting_minutes' => $posture['sitting_minutes'] ?? 0,
                'movements_today' => $movements,
                'errors_today' => $errors,
            ];
        });

        return response()->json([
            'count' => $stats->count(),
            'items' => $stats,
        ]);
    }
}
