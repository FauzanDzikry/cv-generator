<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cv.cv_data', function (Blueprint $table) {
            $table->string('cv_name', 255)->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('cv.cv_data', function (Blueprint $table) {
            $table->dropColumn('cv_name');
        });
    }
};
