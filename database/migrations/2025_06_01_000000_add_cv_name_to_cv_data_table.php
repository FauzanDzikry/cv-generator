<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';
        Schema::table($tableName, function (Blueprint $table) {
            $table->string('cv_name', 255)->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        $tableName = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';
        Schema::table($tableName, function (Blueprint $table) {
            $table->dropColumn('cv_name');
        });
    }
};
