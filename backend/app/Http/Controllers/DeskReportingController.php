<?php

namespace App\Http\Controllers;

use App\Models\Desk;
use App\Services\DeskReportingService;
use Illuminate\Http\Request;

class DeskReportingController extends Controller
{
    public function report(Request $request, Desk $desk, DeskReportingService $service)
    {
        $from = $request->query('from');
        $to   = $request->query('to');

        return response()->json([
            'breakdowns'   => $service->breakdowns($desk, $from, $to),
            'improper_use' => $service->improperUse($desk, $from, $to),
            'usage'        => $service->usage($desk, $from, $to),
        ]);
    }
}
