<?php

use App\Http\Controllers\CVDataController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('home');
})->name('home');

Route::get('/welcome', function () {
    return Inertia::render('welcome');
})->name('welcome');

Route::get('/generate-cv', function () {
    return Inertia::render('form-generate');
})->name('form-generate');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('cvs', [CVDataController::class, 'index'])->name('cvs.index');
    Route::post('cvs', [CVDataController::class, 'store'])->name('cvs.store');
    Route::get('cvs/{id}', [CVDataController::class, 'show'])->name('cvs.show')->whereNumber('id');
    Route::get('cvs/{id}/edit', [CVDataController::class, 'edit'])->name('cvs.edit')->whereNumber('id');
    Route::put('cvs/{id}', [CVDataController::class, 'update'])->name('cvs.update')->whereNumber('id');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
