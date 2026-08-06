<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enforce transactional execution on PostgreSQL.
     */
    public $withinTransaction = true;

    protected function recreateChildTablesSqlite(?string $targetFkColumn): void
    {
        $tables = [
            'work_experiences' => function (Blueprint $table) {
                $table->string('company')->nullable();
                $table->string('company_location')->nullable();
                $table->string('position')->nullable();
                $table->string('location_type')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_current')->nullable()->default(false);
            },
            'educations' => function (Blueprint $table) {
                $table->string('institution')->nullable();
                $table->string('degree')->nullable();
                $table->string('field')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->text('description')->nullable();
            },
            'skills' => function (Blueprint $table) {
                $table->string('name')->nullable();
            },
            'portfolios' => function (Blueprint $table) {
                $table->string('title')->nullable();
                $table->string('link')->nullable();
                $table->text('description')->nullable();
            },
            'certifications' => function (Blueprint $table) {
                $table->string('name')->nullable();
                $table->string('organization')->nullable();
                $table->smallInteger('start_year')->nullable();
                $table->smallInteger('end_year')->nullable();
                $table->boolean('is_time_limited')->nullable()->default(false);
                $table->text('description')->nullable();
                $table->string('credential_id')->nullable();
            },
            'languages' => function (Blueprint $table) {
                $table->string('language')->nullable();
                $table->string('level')->nullable();
            },
            'accomplishments' => function (Blueprint $table) {
                $table->text('description')->nullable();
            },
            'organizations' => function (Blueprint $table) {
                $table->string('name')->nullable();
                $table->string('position')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->boolean('is_current')->nullable()->default(false);
                $table->text('description')->nullable();
            },
        ];

        foreach ($tables as $name => $fieldsClosure) {
            Schema::create($name . '_tmp', function (Blueprint $table) use ($fieldsClosure, $targetFkColumn) {
                $table->uuid('id')->primary();
                $table->uuid('cv_data_id');
                $table->smallInteger('sort_order');
                $fieldsClosure($table);
                $table->timestamps();
                if ($targetFkColumn !== null) {
                    $table->foreign('cv_data_id')->references($targetFkColumn)->on('cv_data')->onDelete('cascade');
                }
            });

            DB::statement("INSERT INTO {$name}_tmp SELECT * FROM {$name}");
            Schema::drop($name);
            Schema::rename($name . '_tmp', $name);

            Schema::table($name, function (Blueprint $table) {
                $table->unique(['cv_data_id', 'sort_order']);
            });
        }
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        $cvTable = $driver === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        // 1. Audit user_uuid nulls before switching primary/foreign keys
        $nullUsers = DB::table($cvTable)->whereNull('user_uuid')->count();
        if ($nullUsers > 0) {
            throw new \Exception("Cutover audit failed: Found {$nullUsers} rows in {$cvTable} with NULL user_uuid.");
        }

        // 2. Invalidate existing sessions as serialized auth identifiers will become invalid after cutover
        DB::table('sessions')->delete();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');

            // Rebuild users table with UUID primary key and legacy_id
            Schema::create('users_tmp', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->integer('legacy_id');
                $table->string('name');
                $table->string('email');
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->rememberToken();
                $table->timestamps();
                $table->string('google_id')->nullable();
                $table->string('avatar')->nullable();
                $table->string('google_token')->nullable();
                $table->string('google_refresh_token')->nullable();
            });

            DB::statement("INSERT INTO users_tmp (
                id, legacy_id, name, email, email_verified_at, password, remember_token,
                created_at, updated_at, google_id, avatar, google_token, google_refresh_token
            ) SELECT
                uuid, id, name, email, email_verified_at, password, remember_token,
                created_at, updated_at, google_id, avatar, google_token, google_refresh_token
            FROM users");

            Schema::drop('users');
            Schema::rename('users_tmp', 'users');
            Schema::table('users', function (Blueprint $table) {
                $table->unique('legacy_id');
                $table->unique('email');
            });

            // Rebuild cv_data table with UUID primary key, legacy_id, and UUID user_id
            Schema::create('cv_data_tmp', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->integer('legacy_id');
                $table->uuid('user_id');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->integer('legacy_user_id')->nullable();
                $table->string('cv_name')->nullable();
                $table->string('name');
                $table->string('address');
                $table->string('phone');
                $table->string('email');
                $table->string('linkedin')->nullable();
                $table->text('summary');
                $table->json('work_experience');
                $table->json('education');
                $table->json('skills');
                $table->json('portfolios')->nullable();
                $table->json('certifications')->nullable();
                $table->json('languages')->nullable();
                $table->json('accomplishments')->nullable();
                $table->json('organizations')->nullable();
                $table->text('additional_info')->nullable();
                $table->json('custom_fields')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });

            DB::statement("INSERT INTO cv_data_tmp (
                id, legacy_id, user_id, legacy_user_id, cv_name, name, address, phone, email, linkedin, summary,
                work_experience, education, skills, portfolios, certifications, languages, accomplishments,
                organizations, additional_info, custom_fields, created_at, updated_at, deleted_at
            ) SELECT
                uuid, id, user_uuid, user_id, cv_name, name, address, phone, email, linkedin, summary,
                work_experience, education, skills, portfolios, certifications, languages, accomplishments,
                organizations, additional_info, custom_fields, created_at, updated_at, deleted_at
            FROM cv_data");

            Schema::drop('cv_data');
            Schema::rename('cv_data_tmp', 'cv_data');
            Schema::table('cv_data', function (Blueprint $table) {
                $table->unique('legacy_id');
                $table->index('user_id');
            });

            // Rebuild sessions table with nullable UUID user_id and legacy_user_id
            Schema::create('sessions_tmp', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->uuid('user_id')->nullable();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->integer('legacy_user_id')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity');
            });

            DB::statement("INSERT INTO sessions_tmp (
                id, user_id, legacy_user_id, ip_address, user_agent, payload, last_activity
            ) SELECT
                id, user_uuid, user_id, ip_address, user_agent, payload, last_activity
            FROM sessions");

            Schema::drop('sessions');
            Schema::rename('sessions_tmp', 'sessions');
            Schema::table('sessions', function (Blueprint $table) {
                $table->index('user_id');
                $table->index('legacy_user_id');
                $table->index('last_activity');
            });

            // Recreate 8 child tables in SQLite so their foreign key explicitly targets cv_data(id)
            $this->recreateChildTablesSqlite('id');

            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            // PostgreSQL atomic domain key cutover
            DB::statement('ALTER TABLE users DROP CONSTRAINT users_pkey CASCADE;');
            DB::statement('ALTER TABLE users RENAME COLUMN id TO legacy_id;');
            DB::statement('ALTER TABLE users RENAME COLUMN uuid TO id;');
            DB::statement('ALTER TABLE users ADD PRIMARY KEY (id);');
            DB::statement('ALTER TABLE users ADD UNIQUE (legacy_id);');

            DB::statement('ALTER TABLE cv.cv_data DROP CONSTRAINT cv_data_pkey CASCADE;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN id TO legacy_id;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN uuid TO id;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN user_id TO legacy_user_id;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN user_uuid TO user_id;');
            DB::statement('ALTER TABLE cv.cv_data ADD PRIMARY KEY (id);');
            DB::statement('ALTER TABLE cv.cv_data ADD UNIQUE (legacy_id);');
            DB::statement('ALTER TABLE cv.cv_data ALTER COLUMN user_id SET NOT NULL;');
            DB::statement('ALTER TABLE cv.cv_data ADD CONSTRAINT cv_data_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;');

            DB::statement('ALTER TABLE sessions RENAME COLUMN user_id TO legacy_user_id;');
            DB::statement('ALTER TABLE sessions RENAME COLUMN user_uuid TO user_id;');
            DB::statement('ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');

            // Detach FKs from child tables before dropping cv_data during rollback
            $this->recreateChildTablesSqlite(null);

            Schema::create('users_tmp', function (Blueprint $table) {
                $table->integer('id')->primary();
                $table->uuid('uuid')->nullable();
                $table->string('name');
                $table->string('email');
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->rememberToken();
                $table->timestamps();
                $table->string('google_id')->nullable();
                $table->string('avatar')->nullable();
                $table->string('google_token')->nullable();
                $table->string('google_refresh_token')->nullable();
            });

            DB::statement("INSERT INTO users_tmp (
                id, uuid, name, email, email_verified_at, password, remember_token,
                created_at, updated_at, google_id, avatar, google_token, google_refresh_token
            ) SELECT
                legacy_id, id, name, email, email_verified_at, password, remember_token,
                created_at, updated_at, google_id, avatar, google_token, google_refresh_token
            FROM users");

            Schema::drop('users');
            Schema::rename('users_tmp', 'users');
            Schema::table('users', function (Blueprint $table) {
                $table->unique('uuid');
                $table->unique('email');
            });

            Schema::create('cv_data_tmp', function (Blueprint $table) {
                $table->integer('id')->primary();
                $table->uuid('uuid')->nullable();
                $table->integer('user_id')->nullable();
                $table->uuid('user_uuid')->nullable();
                $table->string('cv_name')->nullable();
                $table->string('name');
                $table->string('address');
                $table->string('phone');
                $table->string('email');
                $table->string('linkedin')->nullable();
                $table->text('summary');
                $table->json('work_experience');
                $table->json('education');
                $table->json('skills');
                $table->json('portfolios')->nullable();
                $table->json('certifications')->nullable();
                $table->json('languages')->nullable();
                $table->json('accomplishments')->nullable();
                $table->json('organizations')->nullable();
                $table->text('additional_info')->nullable();
                $table->json('custom_fields')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });

            DB::statement("INSERT INTO cv_data_tmp (
                id, uuid, user_id, user_uuid, cv_name, name, address, phone, email, linkedin, summary,
                work_experience, education, skills, portfolios, certifications, languages, accomplishments,
                organizations, additional_info, custom_fields, created_at, updated_at, deleted_at
            ) SELECT
                legacy_id, id, legacy_user_id, user_id, cv_name, name, address, phone, email, linkedin, summary,
                work_experience, education, skills, portfolios, certifications, languages, accomplishments,
                organizations, additional_info, custom_fields, created_at, updated_at, deleted_at
            FROM cv_data");

            Schema::drop('cv_data');
            Schema::rename('cv_data_tmp', 'cv_data');
            Schema::table('cv_data', function (Blueprint $table) {
                $table->unique('uuid');
                $table->index('user_uuid');
            });

            Schema::create('sessions_tmp', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->integer('user_id')->nullable();
                $table->uuid('user_uuid')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity');
            });

            DB::statement("INSERT INTO sessions_tmp (
                id, user_id, user_uuid, ip_address, user_agent, payload, last_activity
            ) SELECT
                id, legacy_user_id, user_id, ip_address, user_agent, payload, last_activity
            FROM sessions");

            Schema::drop('sessions');
            Schema::rename('sessions_tmp', 'sessions');
            Schema::table('sessions', function (Blueprint $table) {
                $table->index('user_id');
                $table->index('user_uuid');
                $table->index('last_activity');
            });

            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('ALTER TABLE sessions DROP CONSTRAINT sessions_user_id_foreign;');
            DB::statement('ALTER TABLE sessions RENAME COLUMN user_id TO user_uuid;');
            DB::statement('ALTER TABLE sessions RENAME COLUMN legacy_user_id TO user_id;');

            DB::statement('ALTER TABLE cv.cv_data DROP CONSTRAINT cv_data_user_id_foreign;');
            DB::statement('ALTER TABLE cv.cv_data DROP CONSTRAINT cv_data_pkey CASCADE;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN user_id TO user_uuid;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN legacy_user_id TO user_id;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN id TO uuid;');
            DB::statement('ALTER TABLE cv.cv_data RENAME COLUMN legacy_id TO id;');
            DB::statement('ALTER TABLE cv.cv_data ADD PRIMARY KEY (id);');

            DB::statement('ALTER TABLE users DROP CONSTRAINT users_pkey CASCADE;');
            DB::statement('ALTER TABLE users RENAME COLUMN id TO uuid;');
            DB::statement('ALTER TABLE users RENAME COLUMN legacy_id TO id;');
            DB::statement('ALTER TABLE users ADD PRIMARY KEY (id);');
        }
    }
};
