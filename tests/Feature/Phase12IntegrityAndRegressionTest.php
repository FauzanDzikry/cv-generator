<?php

namespace Tests\Feature;

use App\Models\CVData;
use App\Models\CVSkill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class Phase12IntegrityAndRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function getTableName(string $table): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? $table : "cv.{$table}";
    }

    public function test_sql_orphan_child_audit_returns_zero(): void
    {
        // Ensure some data exists first
        $user = User::factory()->create();
        $cv = CVData::create([
            'user_id' => $user->id,
            'name' => 'Orphan Test CV',
            'email' => 'test@example.com',
            'phone' => '08123456789',
            'address' => 'Jakarta',
            'summary' => 'Test summary',
        ]);

        CVSkill::create([
            'cv_data_id' => $cv->id,
            'name' => 'Laravel',
            'sort_order' => 0,
        ]);

        $tables = [
            'work_experiences',
            'educations',
            'skills',
            'portfolios',
            'certifications',
            'languages',
            'accomplishments',
            'organizations',
        ];

        $cvTable = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        foreach ($tables as $table) {
            $childTable = $this->getTableName($table);
            $orphanCount = DB::table("{$childTable} as child")
                ->leftJoin("{$cvTable} as parent", 'parent.id', '=', 'child.cv_data_id')
                ->whereNull('parent.id')
                ->count();

            $this->assertEquals(0, $orphanCount, "Orphan audit count for table {$table} must be zero.");
        }
    }

    public function test_legacy_json_vs_relational_comparison_by_sort_order(): void
    {
        $user = User::factory()->create();
        $cv = CVData::create([
            'user_id' => $user->id,
            'name' => 'Comparison CV',
            'email' => 'comp@example.com',
            'phone' => '08123456789',
            'address' => 'Jakarta',
            'summary' => 'Comparison summary',
        ]);

        $expectedArray = [
            ['name' => 'Alpha'],
            ['name' => 'Beta'],
            ['name' => 'Gamma'],
        ];

        $cvTable = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        if (Schema::hasColumn($cvTable, 'skills')) {
            DB::table($cvTable)->where('id', $cv->id)->update([
                'skills' => json_encode($expectedArray),
            ]);
        }

        // Insert relational rows out of primary order but with correct sort_order
        CVSkill::create(['cv_data_id' => $cv->id, 'name' => 'Gamma', 'sort_order' => 2]);
        CVSkill::create(['cv_data_id' => $cv->id, 'name' => 'Alpha', 'sort_order' => 0]);
        CVSkill::create(['cv_data_id' => $cv->id, 'name' => 'Beta', 'sort_order' => 1]);

        $relationalSkills = $cv->skills()->orderBy('sort_order')->get()->map(fn ($item) => ['name' => $item->name])->toArray();

        if (Schema::hasColumn($cvTable, 'skills')) {
            $legacySkills = json_decode(DB::table($cvTable)->where('id', $cv->id)->value('skills'), true);
            $this->assertEquals($legacySkills, $relationalSkills, "Relational array ordered by sort_order must be value- and order-identical to legacy JSON.");
        } else {
            $this->assertEquals($expectedArray, $relationalSkills, "Relational array ordered by sort_order must match exact expected ordering.");
        }
    }

    public function test_sql_uuid_domain_keys_audit(): void
    {
        $tables = ['users', 'cv_data', 'work_experiences', 'educations', 'skills', 'portfolios', 'certifications', 'languages', 'accomplishments', 'organizations'];

        foreach ($tables as $table) {
            $tableName = $table === 'users' ? 'users' : $this->getTableName($table);
            $type = Schema::getColumnType($tableName, 'id');
            $this->assertNotContains($type, ['integer', 'bigint', 'smallint'], "Table {$table} primary key 'id' must not be numeric integer type.");
        }
    }

    public function test_regression_create_show_list_update_delete_and_user_cascade(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Create
        $payload = [
            'cv_name' => 'Regression CV',
            'name' => 'Jane Regress',
            'email' => 'jane@example.com',
            'phone' => '08987654321',
            'address' => 'Bandung',
            'summary' => 'Testing regression',
            'work_experience' => [
                ['company' => 'Tech Corp', 'position' => 'Dev', 'is_current' => '1', 'start_date' => '2021-01-01', 'end_date' => '']
            ],
            'education' => [
                ['institution' => 'ITB', 'degree' => 'B.Eng.', 'field' => 'Informatics', 'start_date' => '2017-08-01', 'end_date' => '2021-07-01']
            ],
            'skills' => [['name' => 'PostgreSQL'], ['name' => 'TypeScript']],
            'portfolios' => [],
            'certifications' => [],
            'languages' => [['language' => 'English', 'level' => 'Fluent']],
            'accomplishments' => [],
            'organizations' => [],
        ];

        $response = $this->postJson(route('cvs.store'), $payload);
        $response->assertStatus(201);

        $cv = CVData::where('user_id', $user->id)->first();
        $this->assertNotNull($cv);
        $this->assertTrue(Str::isUuid($cv->id), 'CV ID must be UUID.');
        $this->assertEquals(2, $cv->skills()->count());
        $this->assertEquals('PostgreSQL', $cv->skills()->orderBy('sort_order')->first()->name);

        // Show
        $response = $this->get(route('cvs.show', $cv->id));
        $response->assertStatus(200);

        // List
        $response = $this->get(route('cvs.index'));
        $response->assertStatus(200);

        // Update
        $payload['cv_name'] = 'Updated Regression CV';
        $payload['skills'] = [['name' => 'Go'], ['name' => 'Rust'], ['name' => 'C++']];
        $response = $this->putJson(route('cvs.update', $cv->id), $payload);
        $response->assertStatus(200);

        $this->assertEquals('Updated Regression CV', $cv->fresh()->cv_name);
        $this->assertEquals(3, $cv->skills()->count());
        $this->assertEquals('Go', $cv->skills()->orderBy('sort_order')->first()->name);

        // User Delete Cascade
        $user->delete();
        $this->assertNull(CVData::find($cv->id), 'CVData must cascade delete when user is deleted.');
        $this->assertEquals(0, DB::table($this->getTableName('skills'))->where('cv_data_id', $cv->id)->count());
    }

    public function test_phase13_sql_audit_legacy_columns_and_soft_deletes(): void
    {
        $cvTable = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        $this->assertFalse(Schema::hasColumn('users', 'legacy_id'), 'users table must not have legacy_id column.');
        $this->assertFalse(Schema::hasColumn('sessions', 'legacy_user_id'), 'sessions table must not have legacy_user_id column.');

        $removedCvColumns = [
            'legacy_id', 'legacy_user_id', 'deleted_at',
            'work_experience', 'education', 'skills', 'portfolios',
            'certifications', 'languages', 'accomplishments', 'organizations'
        ];

        foreach ($removedCvColumns as $column) {
            $this->assertFalse(Schema::hasColumn($cvTable, $column), "cv_data table must not have {$column} column after Phase 13 cleanup.");
        }
    }
}
