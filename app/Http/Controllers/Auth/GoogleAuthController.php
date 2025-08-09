<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google for authentication
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google callback
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            // Cek apakah user sudah ada berdasarkan Google ID
            $user = User::where('google_id', $googleUser->id)->first();
            
            if ($user) {
                // User sudah ada, login
                Auth::login($user);
                return redirect()->intended(route('dashboard'));
            }
            
            // Cek apakah user sudah ada berdasarkan email
            $existingUser = User::where('email', $googleUser->email)->first();
            
            if ($existingUser) {
                // Update user yang sudah ada dengan Google ID
                $existingUser->update([
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'google_token' => $googleUser->token,
                    'google_refresh_token' => $googleUser->refreshToken,
                ]);
                
                Auth::login($existingUser);
                return redirect()->intended(route('home'));
            }
            
            // Buat user baru
            $newUser = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'google_id' => $googleUser->id,
                'avatar' => $googleUser->avatar,
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'email_verified_at' => now(), // Google account sudah terverifikasi
            ]);
            
            Auth::login($newUser);
            return redirect()->intended(route('dashboard'));
            
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Terjadi kesalahan saat login dengan Google: ' . $e->getMessage());
        }
    }
}
