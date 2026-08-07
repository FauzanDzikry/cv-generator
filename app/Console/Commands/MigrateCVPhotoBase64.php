<?php

namespace App\Console\Commands;

use App\Models\CVData;
use App\Services\CVPhotoStorage;
use Illuminate\Console\Command;
use Throwable;

class MigrateCVPhotoBase64 extends Command
{
    protected $signature = 'cv-photos:migrate-base64';

    protected $description = 'Move legacy CV photo base64 data into private file storage';

    public function handle(CVPhotoStorage $photos): int
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        CVData::query()->orderBy('id')->chunkById(100, function ($cvs) use ($photos, &$migrated, &$skipped, &$failed) {
            foreach ($cvs as $cv) {
                $fields = (array) $cv->custom_fields;
                $base64 = $fields['photo_base64'] ?? null;

                if (isset($fields['photo_path']) || ! is_string($base64) || $base64 === '') {
                    $skipped++;

                    continue;
                }

                $metadata = [];
                try {
                    [$bytes, $mime] = $photos->decodeBase64($base64);
                    $metadata = $photos->storeBytes($cv, $bytes, $mime);
                    unset($fields['photo_base64']);
                    $cv->update(['custom_fields' => array_merge($fields, $metadata)]);
                    $migrated++;
                } catch (Throwable $error) {
                    if ($metadata !== []) {
                        try {
                            $photos->delete($metadata, $cv);
                        } catch (Throwable) {
                            // The primary error is reported below; storage cleanup already logs its own failure.
                        }
                    }

                    $failed++;
                    $this->error("CV {$cv->getKey()}: {$error->getMessage()}");
                }
            }
        });

        $this->info("Migrated: {$migrated}");
        $this->info("Skipped: {$skipped}");
        $this->info("Failed: {$failed}");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
