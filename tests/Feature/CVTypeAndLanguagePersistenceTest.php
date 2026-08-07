<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CVTypeAndLanguagePersistenceTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_replace([
            'cv_type' => 'fresh_graduate',
            'cv_name' => 'Language CV',
            'name' => 'Test User',
            'address' => 'Jakarta, Indonesia',
            'phone' => '08123456789',
            'email' => 'test@example.com',
            'linkedin' => null,
            'summary' => 'A concise professional summary.',
            'work_experience' => [[
                'company' => 'Example Corp',
                'company_location' => 'Jakarta',
                'position' => 'Engineer',
                'location_type' => 'Remote',
                'start_date' => '2024-01-01',
                'end_date' => null,
                'description' => 'Built internal products.',
                'is_current' => true,
            ]],
            'education' => [[
                'institution' => 'Test University',
                'degree' => 'Bachelor',
                'field' => 'Computer Science',
                'start_date' => '2020-01-01',
                'end_date' => '2024-01-01',
                'description' => 'Graduated with honors.',
            ]],
            'skills' => [['name' => 'TypeScript']],
            'portfolios' => [],
            'certifications' => [],
            'languages' => [[
                'language' => 'English',
                'level' => null,
                'has_certification' => true,
                'test_name' => 'IELTS',
                'issuing_organization' => 'British Council',
                'score' => '8.0',
                'issue_date' => '2026-01',
                'expiration_date' => '2028-01',
                'is_time_limited' => true,
            ]],
            'accomplishments' => [['description' => 'Won a national competition.']],
            'organizations' => [],
            'additional_info' => null,
            'custom_fields' => [
                'is_use_photo' => false,
                'photo_base64' => null,
                'enabled_sections' => [
                    'portfolios' => false,
                    'certifications' => false,
                    'accomplishments' => true,
                    'organizations' => false,
                    'languages' => true,
                    'additional_info' => false,
                ],
            ],
        ], $overrides);
    }

    public function test_it_persists_cv_type_language_credentials_and_section_visibility(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/cvs', $this->payload());

        $response->assertCreated();
        $id = $response->json('id');

        $this->assertDatabaseHas('cv_data', [
            'id' => $id,
            'cv_type' => 'fresh_graduate',
        ]);
        $this->assertDatabaseHas('languages', [
            'cv_data_id' => $id,
            'language' => 'English',
            'has_certification' => true,
            'test_name' => 'IELTS',
            'issuing_organization' => 'British Council',
            'score' => '8.0',
            'issue_date' => '2026-01-01',
            'expiration_date' => '2028-01-01',
            'is_time_limited' => true,
        ]);

        $this->actingAs($user)->get("/cvs/{$id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('cv.cv_type', 'fresh_graduate')
                ->where('cv.languages.0.test_name', 'IELTS')
                ->where('cv.custom_fields.enabled_sections.languages', true)
                ->etc()
            );
    }

    public function test_language_without_certification_only_requires_its_name(): void
    {
        $user = User::factory()->create();
        $payload = $this->payload([
            'languages' => [[
                'language' => 'English',
                'has_certification' => false,
                'is_time_limited' => false,
            ]],
        ]);

        $this->actingAs($user)->postJson('/cvs', $payload)
            ->assertCreated();

        $this->assertDatabaseHas('languages', [
            'language' => 'English',
            'level' => null,
            'has_certification' => false,
            'test_name' => null,
            'is_time_limited' => false,
        ]);
    }

    public function test_fresh_graduate_can_be_saved_without_professional_experience(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/cvs', $this->payload([
            'work_experience' => [],
        ]))->assertCreated();
    }

    public static function requiredCredentialFields(): array
    {
        return [
            'test name' => ['test_name'],
            'issuing organization' => ['issuing_organization'],
            'score' => ['score'],
            'issue date' => ['issue_date'],
        ];
    }

    #[DataProvider('requiredCredentialFields')]
    public function test_certified_language_requires_credential_details(string $field): void
    {
        $user = User::factory()->create();
        $payload = $this->payload();
        $payload['languages'][0][$field] = '';

        $this->actingAs($user)->postJson('/cvs', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors("languages.0.{$field}");
    }

    public function test_time_limited_language_requires_valid_expiration_after_issue_date(): void
    {
        $user = User::factory()->create();
        $missingExpiration = $this->payload();
        $missingExpiration['languages'][0]['expiration_date'] = '';

        $this->actingAs($user)->postJson('/cvs', $missingExpiration)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('languages.0.expiration_date');

        $expirationBeforeIssue = $this->payload();
        $expirationBeforeIssue['languages'][0]['issue_date'] = '2026-02';
        $expirationBeforeIssue['languages'][0]['expiration_date'] = '2026-01';

        $this->actingAs($user)->postJson('/cvs', $expirationBeforeIssue)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('languages.0.expiration_date');
    }

    public function test_switching_type_keeps_hidden_professional_experience_rows(): void
    {
        $user = User::factory()->create();
        $workExperience = [[
            'company' => 'Example Corp',
            'company_location' => 'Jakarta',
            'position' => 'Engineer',
            'location_type' => 'Remote',
            'start_date' => '2024-01-01',
            'end_date' => null,
            'description' => 'Built internal products.',
            'is_current' => true,
        ]];
        $professional = $this->payload([
            'cv_type' => 'professional',
            'work_experience' => $workExperience,
        ]);

        $id = $this->actingAs($user)->postJson('/cvs', $professional)
            ->assertCreated()
            ->json('id');

        $freshGraduate = $this->payload([
            'cv_type' => 'fresh_graduate',
            'work_experience' => $workExperience,
        ]);

        $this->actingAs($user)->putJson("/cvs/{$id}", $freshGraduate)
            ->assertOk();

        $this->assertSame(1, DB::table('work_experiences')->where('cv_data_id', $id)->count());
        $this->assertDatabaseHas('work_experiences', [
            'cv_data_id' => $id,
            'company' => 'Example Corp',
        ]);
    }
}
