<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Enforce transactional execution on PostgreSQL.
     */
    public $withinTransaction = true;

    protected function getTableName(string $table): string
    {
        return DB::connection()->getDriverName() === 'sqlite' ? $table : 'cv.' . $table;
    }

    protected function sanitizeField(string $key, $value)
    {
        if (in_array($key, ['start_date', 'end_date'])) {
            return ($value === '' || $value === null) ? null : (string) $value;
        }
        if (in_array($key, ['start_year', 'end_year'])) {
            return ($value === '' || $value === null || !is_numeric($value)) ? null : (int) $value;
        }
        if (in_array($key, ['is_current', 'is_time_limited'])) {
            return (bool) filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }
        return $value === null ? null : (string) $value;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $cvTable = DB::connection()->getDriverName() === 'sqlite' ? 'cv_data' : 'cv.cv_data';

        $sectionMap = [
            'work_experience' => 'work_experiences',
            'education' => 'educations',
            'skills' => 'skills',
            'portfolios' => 'portfolios',
            'certifications' => 'certifications',
            'languages' => 'languages',
            'accomplishments' => 'accomplishments',
            'organizations' => 'organizations',
        ];

        $allowedFields = [
            'work_experiences' => ['company', 'company_location', 'position', 'location_type', 'start_date', 'end_date', 'description', 'is_current'],
            'educations' => ['institution', 'degree', 'field', 'start_date', 'end_date', 'description'],
            'skills' => ['name'],
            'portfolios' => ['title', 'link', 'description'],
            'certifications' => ['name', 'organization', 'start_year', 'end_year', 'is_time_limited', 'description', 'credential_id'],
            'languages' => ['language', 'level'],
            'accomplishments' => ['description'],
            'organizations' => ['name', 'position', 'start_date', 'end_date', 'is_current', 'description'],
        ];

        $totalJsonCount = array_fill_keys(array_values($sectionMap), 0);

        // 1. Backfill all arrays using raw DB queries without Eloquent models
        DB::table($cvTable)->orderBy('id')->chunkById(100, function ($cvs) use ($sectionMap, $allowedFields, &$totalJsonCount) {
            foreach ($cvs as $cv) {
                if (!$cv->uuid) {
                    throw new \Exception("CV row ID {$cv->id} has NULL uuid during section backfill.");
                }

                foreach ($sectionMap as $jsonCol => $childTable) {
                    $items = json_decode($cv->{$jsonCol} ?? '[]', true);
                    if (!is_array($items) || empty($items)) {
                        continue;
                    }

                    $totalJsonCount[$childTable] += count($items);
                    $insertRows = [];

                    foreach ($items as $index => $item) {
                        $row = [
                            'id' => method_exists(Str::class, 'uuid7') ? Str::uuid7()->toString() : Str::uuid()->toString(),
                            'cv_data_id' => $cv->uuid,
                            'sort_order' => $index,
                            'created_at' => $cv->created_at ?? now(),
                            'updated_at' => $cv->updated_at ?? now(),
                        ];

                        foreach ($allowedFields[$childTable] as $field) {
                            $val = is_array($item) ? ($item[$field] ?? null) : null;
                            $row[$field] = $this->sanitizeField($field, $val);
                        }

                        $insertRows[] = $row;
                    }

                    if (!empty($insertRows)) {
                        DB::table($this->getTableName($childTable))->insert($insertRows);
                    }
                }
            }
        });

        // 2. Verify total JSON element count matches total child row count for every section
        foreach ($sectionMap as $jsonCol => $childTable) {
            $dbCount = DB::table($this->getTableName($childTable))->count();
            $expectedCount = $totalJsonCount[$childTable];
            if ($dbCount !== $expectedCount) {
                throw new \Exception("Section backfill verification failed for '{$childTable}': expected {$expectedCount} rows from JSON, found {$dbCount} rows in DB.");
            }
        }

        // 3. Special verification for legacy CV ID 1: count 1/1/3/1/1/1/1/1 if row ID 1 exists
        $cv1 = DB::table($cvTable)->where('id', 1)->first();
        if ($cv1 && $cv1->uuid) {
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
                $actual = DB::table($this->getTableName($table))->where('cv_data_id', $cv1->uuid)->count();
                if ($actual !== $expected) {
                    throw new \Exception("Legacy CV ID 1 verification failed for '{$table}': expected {$expected}, got {$actual}.");
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'organizations',
            'accomplishments',
            'languages',
            'certifications',
            'portfolios',
            'skills',
            'educations',
            'work_experiences',
        ];

        foreach ($tables as $table) {
            DB::table($this->getTableName($table))->delete();
        }
    }
};
