<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$collector = app(App\Services\DeskDataCollector::class);
$result = $collector->collect();
echo json_encode($result, JSON_PRETTY_PRINT), "\n";
