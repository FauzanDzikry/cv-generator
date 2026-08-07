<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = true;

    private function table(string $name): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? $name : 'cv.'.$name;
    }

    public function up(): void
    {
        Schema::table($this->table('cv_data'), function (Blueprint $table) {
            $table->string('cv_type')->default('professional');
        });

        Schema::table($this->table('languages'), function (Blueprint $table) {
            $table->boolean('has_certification')->default(false);
            $table->string('test_name')->nullable();
            $table->string('issuing_organization')->nullable();
            $table->string('score', 100)->nullable();
            $table->date('issue_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->boolean('is_time_limited')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table($this->table('languages'), function (Blueprint $table) {
            $table->dropColumn([
                'has_certification',
                'test_name',
                'issuing_organization',
                'score',
                'issue_date',
                'expiration_date',
                'is_time_limited',
            ]);
        });

        Schema::table($this->table('cv_data'), function (Blueprint $table) {
            $table->dropColumn('cv_type');
        });
    }
};
