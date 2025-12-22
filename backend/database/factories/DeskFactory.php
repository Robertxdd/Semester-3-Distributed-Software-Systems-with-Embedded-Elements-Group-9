<?php

namespace Database\Factories;

use App\Models\Desk;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Desk>
 */
class DeskFactory extends Factory
{
    protected $model = Desk::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(2, true),
            'external_id' => $this->faker->unique()->bothify('desk-####'),
            'manufacturer' => $this->faker->randomElement(['Linak', 'Generic']),
            'height' => $this->faker->numberBetween(60, 130),
            'min_height' => 60,
            'max_height' => 130,
            'state' => $this->faker->randomElement(['stopped', 'moving_up', 'moving_down']),
        ];
    }
}
