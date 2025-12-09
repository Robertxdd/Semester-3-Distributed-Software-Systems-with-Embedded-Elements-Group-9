<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeskController;
use App\Http\Controllers\DeskDataCollectionController;
use App\Http\Controllers\DeskDataQueryController;
use App\Http\Controllers\DeskStatsController;
use Illuminate\Support\Facades\Route;

// Public routes with rate limiting to prevent brute force
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes - require authentication
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    
    // Desk management routes
    Route::get('/desks', [DeskController::class, 'index']);
    Route::post('/desks', [DeskController::class, 'store']);
    Route::get('/desks/{desk}', [DeskController::class, 'show']);
    Route::put('/desks/{desk}', [DeskController::class, 'update']);
    Route::delete('/desks/{desk}', [DeskController::class, 'destroy']);
    
    // Desk control routes
    Route::post('/desks/{desk}/up', [DeskController::class, 'moveUp']);
    Route::post('/desks/{desk}/down', [DeskController::class, 'moveDown']);
    Route::post('/desks/{desk}/stop', [DeskController::class, 'stop']);
    
    // Data collection
    Route::post('/desks/collect', [DeskDataCollectionController::class, 'collect']);
    
    // Reporting routes
    Route::get('/desks/{desk}/state-history', [DeskDataQueryController::class, 'stateHistory']);
    Route::get('/desks/{desk}/usage-summary', [DeskDataQueryController::class, 'usageSummary']);
    Route::get('/desks/{desk}/today-stats', [DeskStatsController::class, 'todayStats']);
    Route::post('/desks/{desk}/log-state', [DeskStatsController::class, 'logState']);
});