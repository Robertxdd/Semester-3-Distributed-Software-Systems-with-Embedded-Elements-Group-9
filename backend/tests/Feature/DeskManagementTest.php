<?php

namespace Tests\Feature;

use App\Models\Desk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeskManagementTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_user_can_view_all_desks()
    {
        $user = User::factory()->create();
        Desk::factory()->count(3)->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/desks');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    /** @test */
    public function unauthenticated_user_cannot_view_desks()
    {
        $response = $this->getJson('/api/desks');

        $response->assertStatus(401);
    }

    /** @test */
    public function admin_can_create_desk()
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson('/api/desks', [
                             'name' => 'Engineering Desk 1',
                             'manufacturer' => 'Linak',
                             'height' => 750,
                             'min_height' => 650,
                             'max_height' => 1300,
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('desks', ['name' => 'Engineering Desk 1']);
    }

    /** @test */
    public function regular_user_cannot_create_desk()
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/desks', [
                             'name' => 'Test Desk',
                             'manufacturer' => 'Linak',
                         ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function admin_can_delete_desk()
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $desk = Desk::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
                         ->deleteJson("/api/desks/{$desk->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('desks', ['id' => $desk->id]);
    }

    /** @test */
    public function regular_user_cannot_delete_desk()
    {
        $user = User::factory()->create(['is_admin' => false]);
        $desk = Desk::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->deleteJson("/api/desks/{$desk->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('desks', ['id' => $desk->id]);
    }
}