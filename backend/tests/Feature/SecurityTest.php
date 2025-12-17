<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function rate_limiting_prevents_brute_force_login()
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('correct-password'),
        ]);

        // Make 6 failed login attempts (limit is 5)
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
                'role' => 'user',
            ]);
        }

        // The 6th attempt should be rate-limited
        $response->assertStatus(429); // Too Many Requests
    }

    /** @test */
    public function authenticated_routes_require_valid_token()
    {
        $response = $this->getJson('/api/desks');

        $response->assertStatus(401)
                 ->assertJson(['message' => 'Unauthenticated.']);
    }

    /** @test */
    public function invalid_token_is_rejected()
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-12345')
                         ->getJson('/api/desks');

        $response->assertStatus(401);
    }

    /** @test */
    public function expired_token_is_rejected()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        
        // Delete the token to simulate expiration
        $user->tokens()->delete();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->getJson('/api/desks');

        $response->assertStatus(401);
    }
}