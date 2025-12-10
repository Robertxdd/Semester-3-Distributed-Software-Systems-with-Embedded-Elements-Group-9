<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeskController;
use App\Http\Controllers\DeskDataCollectionController;
use App\Http\Controllers\DeskDataQueryController;
use App\Http\Controllers\DeskReportingController;
use App\Http\Controllers\DeskStatsController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\UserHealthController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
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
    Route::get('/auth/me', function (Request $request) {
        return $request->user();
    });
    
    // Desk management routes
    Route::get('/desks', [DeskController::class, 'index']);
    Route::post('/desks', [DeskController::class, 'store']);
    Route::get('/desks/{desk}', [DeskController::class, 'show']);
    Route::put('/desks/{desk}', [DeskController::class, 'update']);
    Route::delete('/desks/{desk}', [DeskController::class, 'destroy']);
    Route::post('/desks/sync', [DeskController::class, 'syncAll']);
    
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
    
    Route::get('/desks/{desk}/manager-report', [DeskReportingController::class, 'report']);

    // Admin settings + users
    Route::get('/admin/settings', [AdminSettingsController::class, 'index']);
    Route::put('/admin/settings', [AdminSettingsController::class, 'update']);
    Route::get('/users', [UserController::class, 'index']);

    // User well-being features
    Route::get('/users/me/health-summary', [UserHealthController::class, 'healthSummary']);
    Route::get('/users/me/reminders', [UserHealthController::class, 'reminders']);
    Route::put('/users/me/reminders', [UserHealthController::class, 'updateReminders']);
});
