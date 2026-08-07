<?php

namespace Tests\Feature;

use App\Models\CVData;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MigrateCVPhotoBase64CommandTest extends TestCase
{
    use RefreshDatabase;

    private const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['filesystems.cv_photos.r2_enabled' => false]);
    }

    public function test_command_migrates_valid_base64_skips_completed_and_preserves_failures_for_retry(): void
    {
        $user = User::factory()->create();
        $valid = $this->cv($user, [
            'is_use_photo' => true,
            'photo_base64' => 'data:image/png;base64,'.self::PNG_BASE64,
        ]);
        $completed = $this->cv($user, [
            'is_use_photo' => true,
            'photo_base64' => 'data:image/png;base64,'.base64_encode('must-not-run'),
        ]);
        $existingPath = "cv-photos/{$completed->id}/existing.png";
        Storage::disk('local')->put($existingPath, 'existing');
        $completed->update(['custom_fields' => [
            'is_use_photo' => true,
            'photo_disk' => 'local',
            'photo_path' => $existingPath,
            'photo_mime' => 'image/png',
            'photo_base64' => 'data:image/png;base64,'.base64_encode('must-not-run'),
        ]]);
        $invalid = $this->cv($user, [
            'is_use_photo' => true,
            'photo_base64' => 'not-a-data-url',
        ]);

        $this->artisan('cv-photos:migrate-base64')
            ->expectsOutputToContain('Migrated: 1')
            ->expectsOutputToContain('Skipped: 1')
            ->expectsOutputToContain('Failed: 1')
            ->assertExitCode(1);

        $valid->refresh();
        $completed->refresh();
        $invalid->refresh();
        $this->assertSame('local', $valid->custom_fields['photo_disk']);
        $this->assertArrayNotHasKey('photo_base64', $valid->custom_fields);
        Storage::disk('local')->assertExists($valid->custom_fields['photo_path']);
        $this->assertSame($existingPath, $completed->custom_fields['photo_path']);
        $this->assertArrayHasKey('photo_base64', $completed->custom_fields);
        $this->assertSame('not-a-data-url', $invalid->custom_fields['photo_base64']);

        $fields = $invalid->custom_fields;
        $fields['photo_base64'] = 'data:image/png;base64,'.self::PNG_BASE64;
        $invalid->update(['custom_fields' => $fields]);

        $this->artisan('cv-photos:migrate-base64')
            ->expectsOutputToContain('Migrated: 1')
            ->expectsOutputToContain('Skipped: 2')
            ->expectsOutputToContain('Failed: 0')
            ->assertSuccessful();

        $this->assertArrayNotHasKey('photo_base64', $invalid->refresh()->custom_fields);
        Storage::disk('local')->assertExists($invalid->custom_fields['photo_path']);
    }

    private function cv(User $user, array $customFields): CVData
    {
        return $user->cvs()->create([
            'cv_name' => 'Legacy Photo CV',
            'name' => 'Legacy Owner',
            'address' => 'Jakarta',
            'phone' => '08123456789',
            'email' => 'legacy@example.test',
            'summary' => 'Legacy photo migration test.',
            'custom_fields' => $customFields,
        ]);
    }
}
