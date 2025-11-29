<?php

use App\Http\Controllers\DeskController;
use App\Http\Controllers\DeskDataCollectionController;
use Illuminate\Support\Facades\Route;

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
