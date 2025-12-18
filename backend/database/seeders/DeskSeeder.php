<?php

namespace Database\Seeders;

use App\Models\Desk;
use Illuminate\Database\Seeder;

class DeskSeeder extends Seeder
{
    public function run(): void
    {
        Desk::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Desk 1',
                'height' => 105,
                'min_height' => 60,
                'max_height' => 130,
                'state' => 'stopped',
            ],
        );
    }
}

