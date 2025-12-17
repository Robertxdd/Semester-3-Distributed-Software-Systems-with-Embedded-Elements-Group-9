<?php

namespace Tests\Unit;

use App\Models\Desk;
use App\Models\DeskStateReading;
use App\Models\DeskError;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeskTest extends TestCase
{
    use RefreshDatabase;

    // Helper method to create desks
    private function createDesk(array $attributes = []): Desk
    {
        return Desk::create(array_merge([
            'name' => 'Test Desk',
            'external_id' => 'DESK-' . rand(100, 999),
            'manufacturer' => 'Linak',
            'height' => 750,
            'min_height' => 650,
            'max_height' => 1300,
            'state' => 'stopped',
        ], $attributes));
    }

    /** @test */
    public function it_has_state_readings_relationship()
    {
        $desk = $this->createDesk();
        
        DeskStateReading::create([
            'desk_id' => $desk->id,
            'position_mm' => 750,
            'status' => 'moving_up',
            'collected_at' => now(),
            'recorded_at' => now(),
        ]);

        $this->assertCount(1, $desk->stateReadings);
        $this->assertEquals(750, $desk->stateReadings->first()->position_mm);
    }

    /** @test */
    /** @test */
public function it_has_errors_relationship()
{
    $desk = $this->createDesk();
    
    DeskError::create([
        'desk_id' => $desk->id,
        'error_code' => 'ERR_OVERLOAD',      // ← NEW (correct)
        'time_s' => 1234,                     // ← NEW (correct)
        'collected_at' => now(),
    ]);

    $this->assertCount(1, $desk->errors);
    $this->assertEquals('ERR_OVERLOAD', $desk->errors->first()->error_code);  // ← NEW (correct)
}

    /** @test */
    public function it_can_update_desk_height()
    {
        $desk = $this->createDesk(['height' => 700]);

        $desk->update(['height' => 1200]);

        $this->assertEquals(1200, $desk->fresh()->height);
    }
}