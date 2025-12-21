<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desk_state_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('desk_id')->constrained('desks')->cascadeOnDelete();

            $table->integer('position_mm')->nullable();
            $table->integer('speed_mms')->nullable();
            $table->string('status')->nullable();

            $table->boolean('is_position_lost')->default(false);
            $table->boolean('is_overload_protection_up')->default(false);
            $table->boolean('is_overload_protection_down')->default(false);
            $table->boolean('is_anti_collision')->default(false);

            $table->timestamp('collected_at');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desk_state_readings');
    }
};
