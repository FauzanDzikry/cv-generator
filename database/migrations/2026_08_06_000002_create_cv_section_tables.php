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

    protected function getTableName(string $table): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? $table : 'cv.' . $table;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $cvTable = $isSqlite ? 'cv_data' : 'cv.cv_data';

        Schema::create($this->getTableName('work_experiences'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->string('company')->nullable();
            $table->string('company_location')->nullable();
            $table->string('position')->nullable();
            $table->string('location_type')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_current')->nullable()->default(false);
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });

        Schema::create($this->getTableName('educations'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->string('institution')->nullable();
            $table->string('degree')->nullable();
            $table->string('field')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });

        Schema::create($this->getTableName('skills'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->string('name')->nullable();
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });

        Schema::create($this->getTableName('portfolios'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->string('title')->nullable();
            $table->string('link')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });

        Schema::create($this->getTableName('certifications'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->string('name')->nullable();
            $table->string('organization')->nullable();
            $table->smallInteger('start_year')->nullable();
            $table->smallInteger('end_year')->nullable();
            $table->boolean('is_time_limited')->nullable()->default(false);
            $table->text('description')->nullable();
            $table->string('credential_id')->nullable();
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });

        Schema::create($this->getTableName('languages'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->string('language')->nullable();
            $table->string('level')->nullable();
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });

        Schema::create($this->getTableName('accomplishments'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });

        Schema::create($this->getTableName('organizations'), function (Blueprint $table) use ($cvTable, $isSqlite) {
            $table->uuid('id')->primary();
            $table->uuid('cv_data_id');
            $table->smallInteger('sort_order');
            $table->string('name')->nullable();
            $table->string('position')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->nullable()->default(false);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['cv_data_id', 'sort_order']);
            if (!$isSqlite) {
                $table->foreign('cv_data_id')->references('uuid')->on($cvTable)->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'organizations',
            'accomplishments',
            'languages',
            'certifications',
            'portfolios',
            'skills',
            'educations',
            'work_experiences',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($this->getTableName($table));
        }
    }
};
