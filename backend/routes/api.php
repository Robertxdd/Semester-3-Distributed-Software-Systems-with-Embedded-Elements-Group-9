<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeskController;
use App\Http\Controllers\DeskDataCollectionController;
use App\Http\Controllers\DeskDataQueryController;
use App\Http\Controllers\DeskStatsController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);

    Route::get('/desks', [DeskController::class, 'index']);
    Route::post('/desks', [DeskController::class, 'store']);
    Route::get('/desks/{desk}', [DeskController::class, 'show']);
    Route::put('/desks/{desk}', [DeskController::class, 'update']);
    Route::delete('/desks/{desk}', [DeskController::class, 'destroy']);

    Route::post('/desks/{desk}/up', [DeskController::class, 'moveUp']);
    Route::post('/desks/{desk}/down', [DeskController::class, 'moveDown']);
    Route::post('/desks/{desk}/stop', [DeskController::class, 'stop']);

    // Nueva ruta para disparar data collection
    Route::post('/desks/collect', [DeskDataCollectionController::class, 'collect']);

    // Lecturas para UI/informes
    Route::get('/desks/{desk}/state-history', [DeskDataQueryController::class, 'stateHistory']);
    Route::get('/desks/{desk}/usage-summary', [DeskDataQueryController::class, 'usageSummary']);
    Route::get('/desks/{desk}/today-stats', [DeskStatsController::class, 'todayStats']);
    Route::post('/desks/{desk}/log-state', [DeskStatsController::class, 'logState']);
});
