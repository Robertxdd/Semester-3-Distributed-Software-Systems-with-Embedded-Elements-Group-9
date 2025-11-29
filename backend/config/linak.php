<?php

return [
    // Ej: http://localhost:8000/api/v2
    'base_url' => env('LINAK_SIMULATOR_BASE_URL', 'http://localhost:8000/api/v2'),

    // API key que el servidor Python acepta (config/api_keys.json)
    'api_key' => env('LINAK_SIMULATOR_API_KEY'),
];
