<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desk_usage_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('desk_id')->constrained('desks')->cascadeOnDelete();

            $table->unsignedBigInteger('activations_counter')->nullable();
            $table->unsignedBigInteger('sit_stand_counter')->nullable();

            $table->timestamp('collected_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desk_usage_snapshots');
    }
};
