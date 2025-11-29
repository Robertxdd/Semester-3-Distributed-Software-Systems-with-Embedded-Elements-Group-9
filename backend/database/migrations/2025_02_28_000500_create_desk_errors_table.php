<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desk_errors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('desk_id')->constrained('desks')->cascadeOnDelete();

            $table->integer('error_code')->nullable();
            $table->integer('time_s')->nullable(); // campo que viene del simulador

            // Momento de recogida en vuestro sistema
            $table->timestamp('collected_at');

            $table->timestamps();

            // Para evitar duplicar exactamente el mismo error varias veces
            $table->unique(['desk_id', 'error_code', 'time_s']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desk_errors');
    }
};
