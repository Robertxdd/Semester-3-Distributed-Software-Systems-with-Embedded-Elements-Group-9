<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stand_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('interval_minutes'); // How often to remind (e.g., 30, 60)
            $table->boolean('is_active')->default(true);
            $table->time('start_time')->default('09:00:00'); // When to start reminders
            $table->time('end_time')->default('17:00:00'); // When to stop reminders
            $table->timestamp('last_reminded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stand_reminders');
    }
};