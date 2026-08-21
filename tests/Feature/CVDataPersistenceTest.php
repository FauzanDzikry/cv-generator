<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CVDataPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_and_retrieves_aggregate_json_payload_with_all_nested_arrays(): void
    {
        $user = User::factory()->create();

        $this->assertSame('date', Schema::getColumnType('certifications', 'start_year'));
        $this->assertSame('date', Schema::getColumnType('certifications', 'end_year'));

        $payload = [
            'cv_name' => 'Full Legacy CV',
            'name' => 'John Doe Legacy',
            'address' => '123 Legacy St',
            'phone' => '08123456789',
            'email' => 'john@legacy.test',
            'linkedin' => 'https://linkedin.com/in/johnlegacy',
            'summary' => 'Experienced software developer in legacy persistence testing.',
            'work_experience' => [
                [
                    'company' => 'Legacy Corp',
                    'company_location' => 'Jakarta',
                    'position' => 'Senior Developer',
                    'location_type' => 'Remote',
                    'start_date' => '2021-01-01',
                    'end_date' => '2025-01-01',
                    'description' => 'Built robust PHP persistence systems.',
                    'is_current' => false,
                ],
            ],
            'education' => [
                [
                    'institution' => 'Univ Legacy',
                    'degree' => 'S1',
                    'field' => 'Informatika',
                    'start_date' => '2016-08-01',
                    'end_date' => '2020-06-01',
                    'description' => 'Graduated cum laude.',
                ],
            ],
            'skills' => [
                ['name' => 'PHP'],
                ['name' => 'Laravel'],
                ['name' => 'PostgreSQL'],
            ],
            'portfolios' => [
                ['title' => 'Project A', 'link' => 'https://example.com/a', 'description' => 'Desc A'],
            ],
            'certifications' => [
                [
                    'name' => 'Cert Laravel',
                    'organization' => 'Laravel Org',
                    'start_year' => '2022-03',
                    'end_year' => '2025-11',
                    'is_time_limited' => true,
                    'description' => 'Certified Dev',
                    'credential_id' => 'CRED-123',
                ],
            ],
            'languages' => [
                ['language' => 'Indonesia', 'level' => 'Native'],
            ],
            'accomplishments' => [
                ['description' => 'Winner of Hackathon 2023'],
            ],
            'organizations' => [
                [
                    'name' => 'Dev Community',
                    'position' => 'Member',
                    'start_date' => '2021-01-01',
                    'end_date' => '2025-01-01',
                    'is_current' => false,
                    'description' => 'Community participant.',
                ],
            ],
            'additional_info' => 'Willing to relocate.',
            'custom_fields' => ['is_use_photo' => false, 'photo_base64' => null],
        ];

        $response = $this->actingAs($user)->postJson('/cvs', $payload);

        $response->assertStatus(201);
        $id = $response->json('id');
        $this->assertNotNull($id);
        $this->assertDatabaseHas('certifications', [
            'cv_data_id' => $id,
            'start_year' => '2022-03-01',
            'end_year' => '2025-11-01',
        ]);

        $showResponse = $this->actingAs($user)->get("/cvs/{$id}");
        $showResponse->assertOk();

        $showResponse->assertInertia(fn ($page) => $page
            ->component('cvs/show')
            ->has('cv', fn ($cv) => $cv
                ->where('name', 'John Doe Legacy')
                ->where('work_experience.0.company', 'Legacy Corp')
                ->where('education.0.institution', 'Univ Legacy')
                ->where('skills.2.name', 'PostgreSQL')
                ->where('portfolios.0.title', 'Project A')
                ->where('certifications.0.credential_id', 'CRED-123')
                ->where('certifications.0.start_year', '2022-03')
                ->where('certifications.0.end_year', '2025-11')
                ->where('languages.0.language', 'Indonesia')
                ->where('accomplishments.0.description', 'Winner of Hackathon 2023')
                ->where('organizations.0.name', 'Dev Community')
                ->etc()
            )
        );
    }
}
