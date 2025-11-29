<?php

namespace App\Http\Controllers;

use App\Services\DeskDataCollector;
use Illuminate\Http\JsonResponse;

class DeskDataCollectionController extends Controller
{
    public function collect(DeskDataCollector $collector): JsonResponse
    {
        $summary = $collector->collect();

        return response()->json([
            'message' => 'Desk data collected successfully.',
            'summary' => $summary,
        ]);
    }
}
