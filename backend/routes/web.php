<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['status' => 'ok'];
});  // to start php artisan serve