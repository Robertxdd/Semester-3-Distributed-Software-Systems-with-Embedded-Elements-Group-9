<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desk_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('desk_id')->constrained('desks')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('preset_name')->default('default');
            $table->integer('target_height')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desk_settings');
    }
};
