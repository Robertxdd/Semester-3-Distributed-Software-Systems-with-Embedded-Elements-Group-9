<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use App\Services\DeskDataHandler;
use Illuminate\Http\JsonResponse;

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
}
