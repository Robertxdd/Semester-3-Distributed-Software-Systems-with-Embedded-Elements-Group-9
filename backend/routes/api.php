<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DeskController;

Route::get('/desks', [DeskController::class, 'getAll']);
Route::get('/desks/{id}', [DeskController::class, 'getOne']);
Route::put('/desks/{id}/state', [DeskController::class, 'updateState']);