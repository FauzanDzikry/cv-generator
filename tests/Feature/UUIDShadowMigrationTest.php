<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class UUIDShadowMigrationTest extends TestCase
{
    use RefreshDatabase;

    protected function getCVTableName(): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';
    }

    public function test_shadow_uuid_columns_backfill_and_map_legacy_ids(): void
    {
        $cvTable = $this->getCVTableName();

        // 1. Roll back the shadow UUID migration to simulate pre-migration database state
        $this->artisan('migrate:rollback', ['--step' => 1]);

        $this->assertFalse(Schema::hasColumn('users', 'uuid'), 'users table should not have uuid column after rollback.');
        $this->assertFalse(Schema::hasColumn($cvTable, 'uuid'), 'cv_data table should not have uuid column after rollback.');
        $this->assertFalse(Schema::hasColumn($cvTable, 'user_uuid'), 'cv_data table should not have user_uuid column after rollback.');
        $this->assertFalse(Schema::hasColumn('sessions', 'user_uuid'), 'sessions table should not have user_uuid column after rollback.');

        // 2. Insert legacy rows before Phase 8 migration
        DB::table('users')->insert([
            ['id' => 1, 'name' => 'User One', 'email' => 'one@legacy.test', 'password' => 'secret123', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'User Two', 'email' => 'two@legacy.test', 'password' => 'secret123', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table($cvTable)->insert([
            [
                'id' => 1, // Legacy CV ID 1
                'user_id' => 1,
                'name' => 'Legacy CV 1',
                'address' => 'Jakarta',
                'phone' => '081234567890',
                'email' => 'one@legacy.test',
                'summary' => 'Summary 1',
                'work_experience' => '[]',
                'education' => '[]',
                'skills' => '[]',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'user_id' => 2,
                'name' => 'Legacy CV 2',
                'address' => 'Bandung',
                'phone' => '081234567891',
                'email' => 'two@legacy.test',
                'summary' => 'Summary 2',
                'work_experience' => '[]',
                'education' => '[]',
                'skills' => '[]',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('sessions')->insert([
            ['id' => 'auth_session_1', 'user_id' => 1, 'payload' => 'payload1', 'last_activity' => time()],
            ['id' => 'guest_session_1', 'user_id' => null, 'payload' => 'payload2', 'last_activity' => time()],
        ]);

        // 3. Re-run migration to perform shadow UUID creation, backfill, and mapping
        $this->artisan('migrate');

        // 4. Verify users table UUIDs
        $users = DB::table('users')->get();
        $this->assertCount(2, $users);
        $uuids = [];
        foreach ($users as $user) {
            $this->assertNotNull($user->uuid, "User ID {$user->id} must have a non-null UUID.");
            $this->assertTrue(Str::isUuid($user->uuid), "User ID {$user->id} UUID format is invalid: {$user->uuid}");
            $uuids[] = $user->uuid;
        }
        $this->assertCount(2, array_unique($uuids), 'All user UUIDs must be strictly unique.');

        // 5. Verify cv_data UUIDs and mapping for CV Legacy ID 1
        $cvs = DB::table($cvTable)->get();
        $this->assertCount(2, $cvs);
        $cvUuids = [];
        foreach ($cvs as $cv) {
            $this->assertNotNull($cv->uuid, "CV ID {$cv->id} must have a non-null UUID.");
            $this->assertTrue(Str::isUuid($cv->uuid), "CV ID {$cv->id} UUID format is invalid.");
            $cvUuids[] = $cv->uuid;
        }
        $this->assertCount(2, array_unique($cvUuids), 'All CV UUIDs must be strictly unique.');

        // Assert CV legacy ID 1 has mapped user_uuid matching user ID 1's UUID
        $user1Uuid = DB::table('users')->where('id', 1)->value('uuid');
        $cv1UserUuid = DB::table($cvTable)->where('id', 1)->value('user_uuid');
        $this->assertNotNull($cv1UserUuid, 'CV Legacy ID 1 user_uuid must not be null.');
        $this->assertEquals($user1Uuid, $cv1UserUuid, 'CV Legacy ID 1 user_uuid must perfectly map to User ID 1 uuid.');

        // 6. Verify sessions mapping
        $authSessionUserUuid = DB::table('sessions')->where('id', 'auth_session_1')->value('user_uuid');
        $this->assertEquals($user1Uuid, $authSessionUserUuid, 'Authenticated session user_uuid must map to corresponding user uuid.');

        $guestSessionUserUuid = DB::table('sessions')->where('id', 'guest_session_1')->value('user_uuid');
        $this->assertNull($guestSessionUserUuid, 'Guest session user_uuid must remain null.');
    }

    public function test_migration_fails_and_aborts_when_orphan_user_id_exists(): void
    {
        $cvTable = $this->getCVTableName();

        $this->artisan('migrate:rollback', ['--step' => 1]);

        DB::table($cvTable)->insert([
            'id' => 99,
            'user_id' => 9999, // Non-existent user ID in users table (orphan)
            'name' => 'Orphan CV',
            'address' => 'Nowhere',
            'phone' => '00000000',
            'email' => 'orphan@legacy.test',
            'summary' => 'Orphan Summary',
            'work_experience' => '[]',
            'education' => '[]',
            'skills' => '[]',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Orphan user_id');

        $this->artisan('migrate');
    }
}
