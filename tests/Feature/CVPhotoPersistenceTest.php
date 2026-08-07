<?php

namespace Tests\Feature;

use App\Models\CVData;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CVPhotoPersistenceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['filesystems.cv_photos.r2_enabled' => false]);
    }

    public function test_uploaded_photo_and_include_flag_are_persisted_and_internal_metadata_is_hidden(): void
    {
        $owner = User::factory()->create();

        $response = $this->actingAs($owner)->post('/cvs', $this->payload([
            'photo' => UploadedFile::fake()->image('profile.png', 300, 300),
            'custom_fields' => [
                'is_use_photo' => true,
                'enabled_sections' => [],
            ],
        ]));

        $response->assertRedirect();
        $cv = CVData::firstOrFail();
        $this->assertTrue($cv->custom_fields['is_use_photo']);
        $this->assertSame('local', $cv->custom_fields['photo_disk']);
        $this->assertSame('image/png', $cv->custom_fields['photo_mime']);
        Storage::disk('local')->assertExists($cv->custom_fields['photo_path']);

        $this->actingAs($owner)->get("/cvs/{$cv->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('cv.has_photo', true)
                ->where('cv.photo_url', route('cvs.photo.show', $cv))
                ->where('cv.custom_fields.is_use_photo', true)
                ->missing('cv.custom_fields.photo_disk')
                ->missing('cv.custom_fields.photo_path')
                ->missing('cv.custom_fields.photo_mime')
                ->missing('cv.custom_fields.photo_base64')
                ->etc());
    }

    public function test_private_photo_route_only_streams_to_the_owner(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $cv = $this->createCvWithPhoto($owner);

        $this->actingAs($owner)->get(route('cvs.photo.show', $cv))
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');

        $this->actingAs($other)->get(route('cvs.photo.show', $cv))->assertNotFound();
        auth()->logout();
        $this->get(route('cvs.photo.show', $cv))->assertRedirect('/login');
    }

    public function test_toggling_include_off_keeps_the_existing_file_and_metadata(): void
    {
        $owner = User::factory()->create();
        $cv = $this->createCvWithPhoto($owner);
        $path = $cv->custom_fields['photo_path'];

        $this->actingAs($owner)->put("/cvs/{$cv->id}", $this->payload([
            'custom_fields' => [
                'is_use_photo' => false,
                'enabled_sections' => [],
            ],
        ]))->assertRedirect();

        $cv->refresh();
        $this->assertFalse($cv->custom_fields['is_use_photo']);
        $this->assertSame($path, $cv->custom_fields['photo_path']);
        Storage::disk('local')->assertExists($path);
    }

    public function test_deleting_photo_removes_file_and_metadata(): void
    {
        $owner = User::factory()->create();
        $cv = $this->createCvWithPhoto($owner);
        $path = $cv->custom_fields['photo_path'];

        $this->actingAs($owner)->delete(route('cvs.photo.destroy', $cv))->assertNoContent();

        $cv->refresh();
        Storage::disk('local')->assertMissing($path);
        $this->assertFalse($cv->custom_fields['is_use_photo']);
        $this->assertArrayNotHasKey('photo_path', $cv->custom_fields);
        $this->assertArrayNotHasKey('photo_disk', $cv->custom_fields);
        $this->assertArrayNotHasKey('photo_mime', $cv->custom_fields);
    }

    public function test_duplicate_copies_photo_to_an_independent_path(): void
    {
        $owner = User::factory()->create();
        $source = $this->createCvWithPhoto($owner);
        $sourcePath = $source->custom_fields['photo_path'];

        $this->actingAs($owner)->post(route('cvs.duplicate', $source))->assertRedirect(route('cvs.index'));

        $duplicate = CVData::query()->whereKeyNot($source->id)->firstOrFail();
        $duplicatePath = $duplicate->custom_fields['photo_path'];
        $this->assertNotSame($sourcePath, $duplicatePath);
        Storage::disk('local')->assertExists($sourcePath);
        Storage::disk('local')->assertExists($duplicatePath);

        $this->actingAs($owner)->delete(route('cvs.photo.destroy', $source))->assertNoContent();
        Storage::disk('local')->assertMissing($sourcePath);
        Storage::disk('local')->assertExists($duplicatePath);
    }

    public function test_deleting_cv_removes_its_photo_file(): void
    {
        $owner = User::factory()->create();
        $cv = $this->createCvWithPhoto($owner);
        $path = $cv->custom_fields['photo_path'];

        $this->actingAs($owner)->delete(route('cvs.destroy', $cv))->assertRedirect(route('cvs.index'));

        Storage::disk('local')->assertMissing($path);
        $this->assertNull($cv->fresh());
    }

    public function test_deleting_account_removes_all_cv_photo_files(): void
    {
        $owner = User::factory()->create();
        $first = $this->createCvWithPhoto($owner);
        $second = $this->createCvWithPhoto($owner);
        $paths = [$first->custom_fields['photo_path'], $second->custom_fields['photo_path']];

        $this->actingAs($owner)->delete('/settings/profile', ['password' => 'password'])->assertRedirect('/');

        foreach ($paths as $path) {
            Storage::disk('local')->assertMissing($path);
        }
        $this->assertNull($owner->fresh());
    }

    private function createCvWithPhoto(User $owner): CVData
    {
        $this->actingAs($owner)->post('/cvs', $this->payload([
            'photo' => UploadedFile::fake()->image('profile.png', 300, 300),
            'custom_fields' => [
                'is_use_photo' => true,
                'enabled_sections' => [],
            ],
        ]))->assertRedirect();

        return CVData::latest('created_at')->firstOrFail();
    }

    private function payload(array $overrides = []): array
    {
        return array_replace_recursive([
            'cv_type' => 'professional',
            'cv_name' => 'Private Photo CV',
            'name' => 'Photo Owner',
            'address' => 'Jakarta',
            'phone' => '08123456789',
            'email' => 'owner@example.test',
            'linkedin' => '',
            'summary' => 'CV with a private profile photo.',
            'work_experience' => [[
                'company' => 'Example Corp',
                'position' => 'Developer',
            ]],
            'education' => [[
                'institution' => 'Example University',
                'degree' => 'Bachelor',
            ]],
            'skills' => [['name' => 'PHP']],
            'portfolios' => [],
            'certifications' => [],
            'languages' => [],
            'accomplishments' => [],
            'organizations' => [],
            'additional_info' => '',
            'custom_fields' => [
                'is_use_photo' => false,
                'enabled_sections' => [],
            ],
        ], $overrides);
    }
}
