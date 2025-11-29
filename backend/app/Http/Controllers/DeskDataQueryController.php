<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use App\Services\DeskDataHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DeskDataQueryController extends Controller
{
    public function __construct(protected DeskDataHandler $handler)
    {
    }

    public function stateHistory(Request $request, Desk $desk): JsonResponse
    {
        [$from, $to] = $this->parseRange($request);

        $history = $this->handler->getStateHistory($desk, $from, $to);

        return response()->json($history);
    }

    public function usageSummary(Request $request, Desk $desk): JsonResponse
    {
        [$from, $to] = $this->parseRange($request);

        $summary = $this->handler->getUsageSummary($desk, $from, $to);

        return response()->json($summary);
    }

    protected function parseRange(Request $request): array
    {
        $from = $request->query('from');
        $to = $request->query('to');

        return [
            $from ? Carbon::parse($from) : null,
            $to ? Carbon::parse($to) : null,
        ];
    }
}
