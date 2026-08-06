<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class CVSectionMigrationTest extends TestCase
{
    use RefreshDatabase;

    protected function getCVTableName(): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';
    }

    protected function getTableName(string $table): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? $table : 'cv.' . $table;
    }

    protected function rollbackToBeforeShadowUuidMigration(): void
    {
        $targetMigration = DB::table('migrations')->where('migration', 'like', '%_add_shadow_uuid_columns%')->first();
        if ($targetMigration) {
            $count = DB::table('migrations')->where('id', '>=', $targetMigration->id)->count();
            $this->artisan('migrate:rollback', ['--step' => $count]);
        }
    }

    public function test_json_sections_backfill_and_domain_keys_switch_to_uuid(): void
    {
        $cvTable = $this->getCVTableName();

        // 1. Roll back to pre-UUID shadow state
        $this->rollbackToBeforeShadowUuidMigration();

        // 2. Insert legacy user and legacy CV ID 1 with JSON arrays across all 8 sections
        DB::table('users')->insert([
            'id' => 1,
            'name' => 'Legacy User',
            'email' => 'legacy@cv.test',
            'password' => 'secret123',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $workExpJson = json_encode([
            ['company' => 'Tech Corp', 'position' => 'Developer', 'is_current' => '1', 'start_date' => '2020-01-01', 'end_date' => '']
        ]);
        $eduJson = json_encode([
            ['institution' => 'University', 'degree' => 'B.Sc.', 'field' => 'CS', 'start_date' => '2016-09-01', 'end_date' => '2020-06-01']
        ]);
        $skillsJson = json_encode([
            ['name' => 'PHP'],
            ['name' => 'Laravel'],
            ['name' => 'React']
        ]);
        $portfolioJson = json_encode([
            ['title' => 'Project X', 'link' => 'https://example.test', 'description' => 'Great project']
        ]);
        $certJson = json_encode([
            ['name' => 'Certified Developer', 'organization' => 'CertOrg', 'start_year' => '2021', 'end_year' => '', 'is_time_limited' => false]
        ]);
        $langJson = json_encode([
            ['language' => 'Indonesian', 'level' => 'Native']
        ]);
        $accomplishmentJson = json_encode([
            ['description' => 'Won hackathon']
        ]);
        $orgJson = json_encode([
            ['name' => 'Open Source Group', 'position' => 'Contributor', 'is_current' => true]
        ]);

        DB::table($cvTable)->insert([
            'id' => 1,
            'user_id' => 1,
            'name' => 'Legacy CV 1',
            'address' => 'Jakarta',
            'phone' => '08123456789',
            'email' => 'legacy@cv.test',
            'summary' => 'Experienced Developer',
            'work_experience' => $workExpJson,
            'education' => $eduJson,
            'skills' => $skillsJson,
            'portfolios' => $portfolioJson,
            'certifications' => $certJson,
            'languages' => $langJson,
            'accomplishments' => $accomplishmentJson,
            'organizations' => $orgJson,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('sessions')->insert([
            'id' => 'sess_1',
            'user_id' => 1,
            'payload' => 'dummy',
            'last_activity' => time(),
        ]);

        // 3. Migrate forward through Phase 9 and Phase 10 migrations (up to domain cutover)
        $this->artisan('migrate', ['--path' => 'database/migrations/2026_08_06_000001_add_shadow_uuid_columns.php']);
        $this->artisan('migrate', ['--path' => 'database/migrations/2026_08_06_000002_create_cv_section_tables.php']);
        $this->artisan('migrate', ['--path' => 'database/migrations/2026_08_06_000003_backfill_uuid_and_cv_sections.php']);
        $this->artisan('migrate', ['--path' => 'database/migrations/2026_08_06_000004_switch_domain_keys_to_uuid.php']);

        // 4. Verify domain keys switched to UUIDs and legacy IDs preserved
        $user = DB::table('users')->where('legacy_id', 1)->first();
        $this->assertNotNull($user);
        $this->assertTrue(Str::isUuid($user->id), "Users table primary key must be converted to UUID.");
        $this->assertEquals(1, $user->legacy_id);

        $cv = DB::table($cvTable)->where('legacy_id', 1)->first();
        $this->assertNotNull($cv);
        $this->assertTrue(Str::isUuid($cv->id), "CV data primary key must be converted to UUID.");
        $this->assertEquals(1, $cv->legacy_id);
        $this->assertEquals($user->id, $cv->user_id, "CV user_id must map to newly promoted user UUID.");

        // 5. Verify existing sessions invalidated during cutover
        $this->assertEquals(0, DB::table('sessions')->count());

        // 6. Verify backfilled counts match exact expectations for legacy CV ID 1 (1/1/3/1/1/1/1/1)
        $expectedCounts = [
            'work_experiences' => 1,
            'educations' => 1,
            'skills' => 3,
            'portfolios' => 1,
            'certifications' => 1,
            'languages' => 1,
            'accomplishments' => 1,
            'organizations' => 1,
        ];

        foreach ($expectedCounts as $table => $expected) {
            $actual = DB::table($this->getTableName($table))->where('cv_data_id', $cv->id)->count();
            $this->assertEquals($expected, $actual, "Relational table {$table} should have exactly {$expected} backfilled items for legacy CV ID 1.");
        }

        // 7. Verify field sanitization (empty string dates converted to null, booleans cast properly)
        $workExp = DB::table($this->getTableName('work_experiences'))->where('cv_data_id', $cv->id)->first();
        $this->assertNull($workExp->end_date, "Empty string end_date should be sanitized to null.");
        $this->assertEquals(1, (int)$workExp->is_current, "String '1' should be cast to boolean true/1.");

        $cert = DB::table($this->getTableName('certifications'))->where('cv_data_id', $cv->id)->first();
        $this->assertNull($cert->end_year, "Empty string end_year should be sanitized to null.");

        // 8. Verify Phase 13 cleanup migration drops legacy columns and sequences
        $this->artisan('migrate', ['--path' => 'database/migrations/2026_08_06_000005_drop_legacy_cv_columns_and_sequences.php']);
        $this->assertFalse(Schema::hasColumn('users', 'legacy_id'));
        $this->assertFalse(Schema::hasColumn($cvTable, 'legacy_id'));
        $this->assertFalse(Schema::hasColumn($cvTable, 'work_experience'));
        $this->assertFalse(Schema::hasColumn($cvTable, 'deleted_at'));
    }
}
