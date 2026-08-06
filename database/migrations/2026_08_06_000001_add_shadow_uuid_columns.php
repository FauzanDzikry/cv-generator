<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Enforce transactional execution on PostgreSQL to mitigate partial backfill risks.
     */
    public $withinTransaction = true;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $cvTableName = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        // 1. Add shadow UUID columns with Schema Builder for PostgreSQL and SQLite compatibility
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->after('id');
        });

        Schema::table($cvTableName, function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->after('id');
            $table->uuid('user_uuid')->nullable()->after('user_id');
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->uuid('user_uuid')->nullable()->after('user_id');
        });

        // 2. Backfill UUID using Str::uuid7() (or Str::uuid() fallback) in deterministic chunks by legacy ID
        DB::table('users')->whereNull('uuid')->orderBy('id')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                $uuid = method_exists(Str::class, 'uuid7') ? Str::uuid7()->toString() : Str::uuid()->toString();
                DB::table('users')->where('id', $user->id)->update(['uuid' => $uuid]);
            }
        });

        DB::table($cvTableName)->whereNull('uuid')->orderBy('id')->chunkById(100, function ($cvs) use ($cvTableName) {
            foreach ($cvs as $cv) {
                $uuid = method_exists(Str::class, 'uuid7') ? Str::uuid7()->toString() : Str::uuid()->toString();
                DB::table($cvTableName)->where('id', $cv->id)->update(['uuid' => $uuid]);
            }
        });

        // 3. Populate cv_data.user_uuid via mapping user_id -> users.uuid; fail migration if orphan/non-null user_id cannot be mapped
        DB::table($cvTableName)->whereNotNull('user_id')->whereNull('user_uuid')->orderBy('id')->chunkById(100, function ($cvs) use ($cvTableName) {
            foreach ($cvs as $cv) {
                $userUuid = DB::table('users')->where('id', $cv->user_id)->value('uuid');
                if (!$userUuid) {
                    throw new \Exception("Migration failed: Orphan user_id ({$cv->user_id}) found in {$cvTableName} row ID {$cv->id} that cannot be mapped to users.uuid.");
                }
                DB::table($cvTableName)->where('id', $cv->id)->update(['user_uuid' => $userUuid]);
            }
        });

        // 4. Populate sessions.user_uuid for authenticated sessions; guest sessions stay null
        DB::table('sessions')->whereNotNull('user_id')->whereNull('user_uuid')->orderBy('last_activity')->chunk(100, function ($sessions) {
            foreach ($sessions as $session) {
                $userUuid = DB::table('users')->where('id', $session->user_id)->value('uuid');
                if ($userUuid) {
                    DB::table('sessions')->where('id', $session->id)->update(['user_uuid' => $userUuid]);
                }
            }
        });

        // 5. Add unique indexes on shadow UUIDs and standard indexes on foreign shadow UUIDs
        Schema::table('users', function (Blueprint $table) {
            $table->unique('uuid');
        });

        Schema::table($cvTableName, function (Blueprint $table) {
            $table->unique('uuid');
            $table->index('user_uuid');
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->index('user_uuid');
        });

        // 6. Verification: Domain null count must be zero (except sessions.user_uuid for guest)
        $nullUsers = DB::table('users')->whereNull('uuid')->count();
        if ($nullUsers > 0) {
            throw new \Exception("Migration verification failed: {$nullUsers} rows in 'users' have NULL uuid.");
        }

        $nullCvs = DB::table($cvTableName)->whereNull('uuid')->count();
        if ($nullCvs > 0) {
            throw new \Exception("Migration verification failed: {$nullCvs} rows in '{$cvTableName}' have NULL uuid.");
        }

        $nullUserUuidCvs = DB::table($cvTableName)->whereNotNull('user_id')->whereNull('user_uuid')->count();
        if ($nullUserUuidCvs > 0) {
            throw new \Exception("Migration verification failed: {$nullUserUuidCvs} rows in '{$cvTableName}' have non-null user_id but NULL user_uuid.");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $cvTableName = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        Schema::table('sessions', function (Blueprint $table) {
            $table->dropIndex(['user_uuid']);
            $table->dropColumn('user_uuid');
        });

        Schema::table($cvTableName, function (Blueprint $table) {
            $table->dropIndex(['user_uuid']);
            $table->dropUnique(['uuid']);
            $table->dropColumn(['uuid', 'user_uuid']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
