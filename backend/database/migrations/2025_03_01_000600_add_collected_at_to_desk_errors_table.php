<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('desk_errors', 'collected_at')) {
            Schema::table('desk_errors', function (Blueprint $table) {
                $table->timestamp('collected_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('desk_errors', 'collected_at')) {
            Schema::table('desk_errors', function (Blueprint $table) {
                $table->dropColumn('collected_at');
            });
        }
    }
};
