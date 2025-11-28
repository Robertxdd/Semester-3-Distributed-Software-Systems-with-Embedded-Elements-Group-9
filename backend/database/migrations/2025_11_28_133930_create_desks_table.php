<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('desks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('height')->default(70);
            $table->integer('min_height')->default(60);
            $table->integer('max_height')->default(120);
            $table->string('state')->default('stopped');
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('desks');
    }
};
