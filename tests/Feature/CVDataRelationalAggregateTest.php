<?php

namespace Tests\Feature;

use App\Models\CVData;
use App\Models\CVWorkExperience;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CVDataRelationalAggregateTest extends TestCase
{
    use RefreshDatabase;

    protected function getCVPayload(): array
    {
        return [
            'cv_name' => 'Full Stack Developer CV',
            'name' => 'John Doe',
            'address' => 'Jakarta, Indonesia',
            'phone' => '+628123456789',
            'email' => 'john.doe@example.com',
            'linkedin' => 'https://linkedin.com/in/johndoe',
            'summary' => 'Experienced Full Stack Developer with over 8 years of experience.',
            'work_experience' => [
                [
                    'company' => 'PT Tech Nusantara',
                    'company_location' => 'Jakarta',
                    'position' => 'Senior Developer',
                    'location_type' => 'Hybrid',
                    'start_date' => '2020-01-01',
                    'end_date' => '',
                    'is_current' => '1',
                    'description' => 'Leading backend architecture.',
                ]
            ],
            'education' => [
                [
                    'institution' => 'Universitas Indonesia',
                    'degree' => 'B.Sc.',
                    'field' => 'Computer Science',
                    'start_date' => '2015-09-01',
                    'end_date' => '2019-06-01',
                    'description' => 'Honors degree.',
                ]
            ],
            'skills' => [
                ['name' => 'PHP'],
                ['name' => 'Laravel'],
                ['name' => 'TypeScript'],
            ],
            'portfolios' => [
                ['title' => 'Project X', 'link' => 'https://projectx.test', 'description' => 'Enterprise application']
            ],
            'certifications' => [
                ['name' => 'AWS Solutions Architect', 'organization' => 'Amazon', 'start_year' => '2022', 'end_year' => '', 'is_time_limited' => false, 'credential_id' => 'AWS-12345']
            ],
            'languages' => [
                ['language' => 'Indonesian', 'level' => 'Native'],
                ['language' => 'English', 'level' => 'Professional'],
            ],
            'accomplishments' => [
                ['description' => 'Winner of National Hackathon 2021']
            ],
            'organizations' => [
                ['name' => 'Open Source ID', 'position' => 'Maintainer', 'start_date' => '2021-01-01', 'is_current' => true, 'description' => 'Contributing to open source.']
            ],
            'additional_info' => 'Willing to relocate.',
            'custom_fields' => ['hobby' => 'Chess'],
        ];
    }

    public function test_ownership_enforcement_returns_404_for_unauthorized_access(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $response = $this->actingAs($owner)->postJson('/cvs', $this->getCVPayload());
        $response->assertStatus(201);
        $cvId = $response->json('id');

        // Other user tries to show, edit, update, and destroy the CV
        $this->actingAs($otherUser)->get("/cvs/{$cvId}")->assertStatus(404);
        $this->actingAs($otherUser)->get("/cvs/{$cvId}/edit")->assertStatus(404);
        $this->actingAs($otherUser)->putJson("/cvs/{$cvId}", $this->getCVPayload())->assertStatus(404);
        $this->actingAs($otherUser)->delete("/cvs/{$cvId}")->assertStatus(404);
    }

    public function test_destroy_hard_deletes_cv_and_cascades_to_all_relational_sections(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/cvs', $this->getCVPayload());
        $response->assertStatus(201);
        $cvId = $response->json('id');

        $this->assertEquals(1, DB::table('work_experiences')->count());
        $this->assertEquals(1, DB::table('educations')->count());
        $this->assertEquals(3, DB::table('skills')->count());

        // Perform DELETE request
        $deleteResponse = $this->actingAs($user)->delete("/cvs/{$cvId}");
        $deleteResponse->assertRedirect(route('cvs.index'));

        // Verify hard delete and cascade across parent and children
        $this->assertEquals(0, CVData::count(), "CVData parent record must be permanently removed without SoftDeletes.");
        $this->assertEquals(0, DB::table('work_experiences')->count());
        $this->assertEquals(0, DB::table('educations')->count());
        $this->assertEquals(0, DB::table('skills')->count());
        $this->assertEquals(0, DB::table('portfolios')->count());
        $this->assertEquals(0, DB::table('certifications')->count());
        $this->assertEquals(0, DB::table('languages')->count());
        $this->assertEquals(0, DB::table('accomplishments')->count());
        $this->assertEquals(0, DB::table('organizations')->count());
    }

    public function test_user_deletion_triggers_database_cascade_to_cvs_and_all_child_sections(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/cvs', $this->getCVPayload())->assertStatus(201);

        $this->assertEquals(1, CVData::count());
        $this->assertEquals(3, DB::table('skills')->count());

        // Delete user directly
        $user->delete();

        // Ensure database-level cascade removed the CV and child rows
        $this->assertEquals(0, CVData::count());
        $this->assertEquals(0, DB::table('skills')->count());
        $this->assertEquals(0, DB::table('work_experiences')->count());
    }

    public function test_index_fetches_parent_metadata_only_without_querying_or_serializing_child_tables(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/cvs', $this->getCVPayload())->assertStatus(201);
        $this->actingAs($user)->postJson('/cvs', $this->getCVPayload())->assertStatus(201);

        // Track executed SQL queries during index endpoint request
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        $response = $this->actingAs($user)->get('/cvs');
        $response->assertStatus(200);

        // Verify none of the 8 child tables were queried during index loading
        $childTableNames = ['work_experiences', 'educations', 'skills', 'portfolios', 'certifications', 'languages', 'accomplishments', 'organizations'];
        foreach ($queries as $sql) {
            foreach ($childTableNames as $childTable) {
                $this->assertStringNotContainsString($childTable, $sql, "Index route should not query child table {$childTable}.");
            }
        }

        // Verify serialized props do not contain child sections
        $pageProps = $response->viewData('page')['props'];
        $cvList = $pageProps['cvs'];
        $this->assertNotEmpty($cvList);
        $this->assertArrayNotHasKey('work_experience', $cvList[0]);
        $this->assertArrayNotHasKey('skills', $cvList[0]);
        $this->assertArrayHasKey('id', $cvList[0]);
        $this->assertArrayHasKey('cv_name', $cvList[0]);
    }

    public function test_transaction_rollback_prevents_parent_persistence_when_child_creation_fails(): void
    {
        $user = User::factory()->create();

        // Register a model event listener to simulate a runtime database exception during child creation
        CVWorkExperience::creating(function () {
            throw new \RuntimeException("Simulated child table persistence failure.");
        });

        $response = $this->actingAs($user)->postJson('/cvs', $this->getCVPayload());
        $response->assertStatus(500);

        // Assert parent CVData and any other rows were completely rolled back
        $this->assertEquals(0, CVData::count(), "CVData parent must be rolled back if child creation fails.");
        $this->assertEquals(0, DB::table('work_experiences')->count());

        // Remove listener for subsequent tests
        CVWorkExperience::flushEventListeners();
    }
}
