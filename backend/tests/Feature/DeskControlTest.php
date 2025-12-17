<?php

namespace Tests\Feature;

use App\Models\Desk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeskControlTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_user_can_move_desk_up()
    {
        $user = User::factory()->create(['is_admin' => false]);
        $desk = Desk::factory()->create([
            'height' => 700,
            'max_height' => 1300,
        ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson("/api/desks/{$desk->id}/up");

        $response->assertStatus(200);
        $this->assertEquals(1300, $desk->fresh()->height);
        $this->assertEquals('stopped', $desk->fresh()->state);
    }

    /** @test */
    public function authenticated_user_can_move_desk_down()
    {
        $user = User::factory()->create(['is_admin' => false]);
        $desk = Desk::factory()->create([
            'height' => 1200,
            'min_height' => 650,
        ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson("/api/desks/{$desk->id}/down");

        $response->assertStatus(200);
        $this->assertEquals(650, $desk->fresh()->height);
    }

    /** @test */
    public function authenticated_user_can_stop_desk()
    {
        $user = User::factory()->create();
        $desk = Desk::factory()->create(['state' => 'moving_up']);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson("/api/desks/{$desk->id}/stop");

        $response->assertStatus(200);
        $this->assertEquals('stopped', $desk->fresh()->state);
    }

    /** @test */
    public function unauthenticated_user_cannot_control_desk()
    {
        $desk = Desk::factory()->create();

        $response = $this->postJson("/api/desks/{$desk->id}/up");

        $response->assertStatus(401);
    }
}