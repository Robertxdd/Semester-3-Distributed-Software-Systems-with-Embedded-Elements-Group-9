<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthApiController;
use App\Http\Controllers\DeskCommandController;
use App\Http\Controllers\DeskViewController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\UserSelfController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/auth/login', [AuthApiController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthApiController::class, 'me']);

    // Telemetry ingest
    Route::post('/desks/{deskId}/telemetry', [TelemetryController::class, 'ingest']);

    // Desk commands
    Route::post('/desks/{desk}/commands/set-height', [DeskCommandController::class, 'setHeight']);
    Route::post('/desks/{desk}/commands/preset', [DeskCommandController::class, 'preset']);
    Route::post('/desks/bulk/commands/set-height', [DeskCommandController::class, 'bulkSetHeight']);

    // User (occupant) endpoints
    Route::get('/users/me/active-desk', [UserSelfController::class, 'activeDeskEndpoint']);
    Route::get('/users/me/usage', [UserSelfController::class, 'usage']);
    Route::get('/users/me/health-summary', [UserSelfController::class, 'healthSummary']);
    Route::get('/users/me/presets', [UserSelfController::class, 'getPresets']);
    Route::put('/users/me/presets', [UserSelfController::class, 'putPresets']);
    Route::get('/users/me/reminders', [UserSelfController::class, 'getReminders']);
    Route::put('/users/me/reminders', [UserSelfController::class, 'putReminders']);
    Route::get('/users/me/notifications', [UserSelfController::class, 'notifications']);
    Route::patch('/users/me/notifications/{id}/read', [UserSelfController::class, 'markNotification']);

    // Manager/Admin desk view
    Route::get('/desks', [DeskViewController::class, 'index']);
    Route::get('/desks/{desk}', [DeskViewController::class, 'show']);
    Route::get('/desks/{desk}/usage', [DeskViewController::class, 'usage']);
    Route::get('/desks/{desk}/errors', [DeskViewController::class, 'errors']);

    // Reports
    Route::get('/reports/errors', [ReportsController::class, 'errors']);
    Route::patch('/errors/{errorId}/resolve', [ReportsController::class, 'resolveError']);
    Route::get('/reports/usage-summary', [ReportsController::class, 'usageSummary']);
    Route::get('/reports/space-optimization', [ReportsController::class, 'spaceOptimization']);

    // Admin
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::patch('/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

    Route::get('/system-settings', [SystemSettingsController::class, 'index']);
    Route::put('/system-settings', [SystemSettingsController::class, 'updateSettings']);
});
