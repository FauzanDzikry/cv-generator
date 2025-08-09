<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Jadikan kolom password bisa kosong (nullable)
            // Pastikan Anda sudah menginstall package `doctrine/dbal` untuk mengubah kolom
            // composer require doctrine/dbal
            $table->string('password')->nullable()->change();

            // Tambahkan kolom untuk Google ID dan Avatar
            $table->string('google_id')->nullable()->after('email');
            $table->string('avatar')->nullable()->after('google_id');

            // Kolom opsional untuk token
            $table->text('google_token')->nullable()->after('avatar');
            $table->text('google_refresh_token')->nullable()->after('google_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            
        });
    }
};