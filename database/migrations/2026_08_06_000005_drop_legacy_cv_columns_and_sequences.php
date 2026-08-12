<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        $cvTable = $driver === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        // Drop legacy indexes before dropping columns to satisfy SQLite constraints
        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS cv_data_legacy_id_unique;');
            DB::statement('DROP INDEX IF EXISTS users_legacy_id_unique;');
            DB::statement('DROP INDEX IF EXISTS sessions_legacy_user_id_index;');
        } else {
            DB::statement('ALTER TABLE cv.cv_data DROP CONSTRAINT IF EXISTS cv_data_legacy_id_unique CASCADE;');
            DB::statement('ALTER TABLE cv.cv_data DROP CONSTRAINT IF EXISTS cv_data_legacy_id_key CASCADE;');
            DB::statement('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_legacy_id_unique CASCADE;');
            DB::statement('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_legacy_id_key CASCADE;');
            DB::statement('DROP INDEX IF EXISTS public.sessions_legacy_user_id_index CASCADE;');
        }

        // 1. Drop legacy columns from cv_data table
        Schema::table($cvTable, function (Blueprint $table) {
            $columns = [
                'legacy_id',
                'legacy_user_id',
                'work_experience',
                'education',
                'skills',
                'portfolios',
                'certifications',
                'languages',
                'accomplishments',
                'organizations',
                'deleted_at',
            ];
            $toDrop = [];
            foreach ($columns as $col) {
                if (Schema::hasColumn($table->getTable(), $col)) {
                    $toDrop[] = $col;
                }
            }
            if (!empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });

        // 2. Drop legacy_id from users
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'legacy_id')) {
                $table->dropColumn('legacy_id');
            }
        });

        // 3. Drop legacy_user_id from sessions
        Schema::table('sessions', function (Blueprint $table) {
            if (Schema::hasColumn('sessions', 'legacy_user_id')) {
                $table->dropColumn('legacy_user_id');
            }
        });

        // 4. Drop legacy sequences in PostgreSQL if they still exist after column drop
        if ($driver === 'pgsql') {
            DB::statement('DROP SEQUENCE IF EXISTS public.users_id_seq CASCADE;');
            DB::statement('DROP SEQUENCE IF EXISTS cv.cv_data_id_seq CASCADE;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        $cvTable = $driver === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        Schema::table($cvTable, function (Blueprint $table) {
            $table->integer('legacy_id')->nullable();
            $table->integer('legacy_user_id')->nullable();
            $table->json('work_experience')->nullable();
            $table->json('education')->nullable();
            $table->json('skills')->nullable();
            $table->json('portfolios')->nullable();
            $table->json('certifications')->nullable();
            $table->json('languages')->nullable();
            $table->json('accomplishments')->nullable();
            $table->json('organizations')->nullable();
            $table->softDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->integer('legacy_id')->nullable();
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->integer('legacy_user_id')->nullable();
        });
    }
};
