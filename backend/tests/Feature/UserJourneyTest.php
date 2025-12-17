<?php

namespace Tests\Feature;

use App\Models\Desk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserJourneyTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function complete_user_workflow_from_registration_to_desk_control()
    {
        // Step 1: Register
        $registerResponse = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $registerResponse->assertStatus(201);
        $token = $registerResponse->json('token');

        // Step 2: View available desks
        $desk = Desk::factory()->create(['name' => 'Test Desk']);

        $desksResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                              ->getJson('/api/desks');

        $desksResponse->assertStatus(200)
                      ->assertJsonCount(1);

        // Step 3: Control a desk
        $controlResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                                ->postJson("/api/desks/{$desk->id}/up");

        $controlResponse->assertStatus(200);

        // Step 4: View desk stats
        $statsResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                              ->getJson("/api/desks/{$desk->id}/today-stats");

        $statsResponse->assertStatus(200);

        // Step 5: Logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                               ->postJson('/api/logout');

        $logoutResponse->assertStatus(200);

        // Step 6: Verify token is invalidated
        $afterLogoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                                    ->getJson('/api/desks');

        $afterLogoutResponse->assertStatus(401);
    }
}