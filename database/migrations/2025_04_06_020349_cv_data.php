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
        DB::statement('CREATE SCHEMA IF NOT EXISTS cv');

        Schema::create('cv.cv_data', function (Blueprint $table) {
            $table->id();
            $table->integer('user_id')->nullable();
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cv.cv_data');
    }
};
