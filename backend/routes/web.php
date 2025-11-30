<?php

use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

Route::get('/manager', function (): BinaryFileResponse {
    return response()->file(public_path('manager.html'));
});
