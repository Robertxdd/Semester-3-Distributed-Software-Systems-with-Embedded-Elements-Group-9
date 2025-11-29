<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('desks', function (Blueprint $table) {
            // ID del simulador (MAC / identificador externo)
            $table->string('external_id')->nullable()->unique()->after('id');

            // Fabricante tomado de config del simulador
            $table->string('manufacturer')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('desks', function (Blueprint $table) {
            $table->dropColumn(['external_id', 'manufacturer']);
        });
    }
};
