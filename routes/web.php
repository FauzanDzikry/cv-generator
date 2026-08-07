<?php

use App\Http\Controllers\CVDataController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('home');
})->name('home');

/* Route::get('/welcome', function () {
    return Inertia::render('welcome');
})->name('welcome'); */

Route::get('/generate-cv', function () {
    return Inertia::render('form-generate');
})->name('form-generate');

Route::middleware(['auth', 'verified'])->group(function () {
    /* Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard'); */

    Route::get('cvs', [CVDataController::class, 'index'])->name('cvs.index');
    Route::post('cvs', [CVDataController::class, 'store'])->name('cvs.store');
    Route::get('cvs/{cv}', [CVDataController::class, 'show'])->name('cvs.show')->whereUuid('cv');
    Route::get('cvs/{cv}/edit', [CVDataController::class, 'edit'])->name('cvs.edit')->whereUuid('cv');
    Route::get('cvs/{cv}/photo', [CVDataController::class, 'showPhoto'])->name('cvs.photo.show')->whereUuid('cv');
    Route::delete('cvs/{cv}/photo', [CVDataController::class, 'destroyPhoto'])->name('cvs.photo.destroy')->whereUuid('cv');
    Route::put('cvs/{cv}', [CVDataController::class, 'update'])->name('cvs.update')->whereUuid('cv');
    Route::delete('cvs/{cv}', [CVDataController::class, 'destroy'])->name('cvs.destroy')->whereUuid('cv');
    Route::post('cvs/{cv}/duplicate', [CVDataController::class, 'duplicate'])->name('cvs.duplicate')->whereUuid('cv');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
