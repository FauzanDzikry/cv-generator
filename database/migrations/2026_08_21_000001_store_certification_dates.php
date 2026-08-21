<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = true;

    private function table(): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? 'certifications' : 'cv.certifications';
    }

    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE cv.certifications ALTER COLUMN start_year TYPE date USING CASE WHEN start_year IS NULL THEN NULL ELSE make_date(start_year, 1, 1) END');
            DB::statement('ALTER TABLE cv.certifications ALTER COLUMN end_year TYPE date USING CASE WHEN end_year IS NULL THEN NULL ELSE make_date(end_year, 1, 1) END');

            return;
        }

        Schema::table($this->table(), function (Blueprint $table) {
            $table->date('start_year')->nullable()->change();
            $table->date('end_year')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE cv.certifications ALTER COLUMN start_year TYPE smallint USING EXTRACT(YEAR FROM start_year)::smallint');
            DB::statement('ALTER TABLE cv.certifications ALTER COLUMN end_year TYPE smallint USING EXTRACT(YEAR FROM end_year)::smallint');

            return;
        }

        Schema::table($this->table(), function (Blueprint $table) {
            $table->smallInteger('start_year')->nullable()->change();
            $table->smallInteger('end_year')->nullable()->change();
        });
    }
};
