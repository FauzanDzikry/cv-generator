<?php

namespace App\Services;

use App\Models\CVData;
use Illuminate\Filesystem\FilesystemManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class CVPhotoStorage
{
    private const EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
    ];

    public function __construct(private readonly FilesystemManager $filesystems) {}

    public function storeUpload(CVData $cv, UploadedFile $photo): array
    {
        $bytes = $photo->get();
        if ($bytes === false) {
            throw new RuntimeException('Unable to read CV photo upload.');
        }

        return $this->storeBytes($cv, $bytes, (string) $photo->getMimeType());
    }

    public function storeBytes(CVData $cv, string $bytes, string $mime): array
    {
        $extension = self::EXTENSIONS[$mime] ?? null;
        if ($extension === null) {
            throw new RuntimeException('Unsupported CV photo MIME type.');
        }

        $path = "cv-photos/{$cv->getKey()}/".Str::uuid().".{$extension}";
        $disks = config('filesystems.cv_photos.r2_enabled') ? ['r2', 'local'] : ['local'];
        $lastError = null;

        foreach ($disks as $disk) {
            try {
                if ($this->filesystems->disk($disk)->put($path, $bytes, ['visibility' => 'private'])) {
                    return [
                        'photo_disk' => $disk,
                        'photo_path' => $path,
                        'photo_mime' => $mime,
                    ];
                }

                throw new RuntimeException("Disk {$disk} rejected the write.");
            } catch (Throwable $error) {
                $lastError = $error;
                Log::warning('CV photo storage write failed.', [
                    'cv_id' => $cv->getKey(),
                    'disk' => $disk,
                    'error' => $error->getMessage(),
                ]);
            }
        }

        throw new RuntimeException('Unable to store CV photo.', previous: $lastError);
    }

    public function copy(CVData $source, CVData $target): array
    {
        $metadata = $this->metadata($source);
        if ($metadata === []) {
            $legacy = $source->custom_fields['photo_base64'] ?? null;
            if (! is_string($legacy) || $legacy === '') {
                return [];
            }

            [$bytes, $mime] = $this->decodeBase64($legacy);

            return $this->storeBytes($target, $bytes, $mime);
        }

        $bytes = $this->filesystems->disk($metadata['photo_disk'])->get($metadata['photo_path']);

        return $this->storeBytes($target, $bytes, $metadata['photo_mime']);
    }

    public function delete(array $metadata, CVData $cv): void
    {
        $metadata = $this->validateMetadata($metadata, $cv);
        if ($metadata === []) {
            return;
        }

        if (! $this->filesystems->disk($metadata['photo_disk'])->delete($metadata['photo_path'])) {
            throw new RuntimeException('Unable to delete CV photo.');
        }
    }

    public function response(CVData $cv): StreamedResponse
    {
        $metadata = $this->metadata($cv);
        if ($metadata !== []) {
            return $this->filesystems->disk($metadata['photo_disk'])->response(
                $metadata['photo_path'],
                null,
                [
                    'Content-Type' => $metadata['photo_mime'],
                    'Cache-Control' => 'private, no-store',
                ],
            );
        }

        [$bytes, $mime] = $this->decodeBase64((string) ($cv->custom_fields['photo_base64'] ?? ''));

        return response()->stream(function () use ($bytes) {
            echo $bytes;
        }, 200, [
            'Content-Type' => $mime,
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function hasPhoto(CVData $cv): bool
    {
        if ($this->metadata($cv) !== []) {
            return true;
        }

        try {
            $this->decodeBase64((string) ($cv->custom_fields['photo_base64'] ?? ''));

            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    public function metadata(CVData $cv): array
    {
        return $this->validateMetadata((array) $cv->custom_fields, $cv, false);
    }

    public function decodeBase64(string $dataUrl): array
    {
        if (! preg_match('/^data:(image\/(?:png|jpeg));base64,(.+)$/s', $dataUrl, $matches)) {
            throw new RuntimeException('Invalid legacy CV photo data.');
        }

        $bytes = base64_decode($matches[2], true);
        if ($bytes === false || strlen($bytes) > 5 * 1024 * 1024) {
            throw new RuntimeException('Invalid legacy CV photo data.');
        }

        if ((new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes) !== $matches[1]) {
            throw new RuntimeException('Invalid legacy CV photo data.');
        }

        return [$bytes, $matches[1]];
    }

    private function validateMetadata(array $metadata, CVData $cv, bool $throw = true): array
    {
        $disk = $metadata['photo_disk'] ?? null;
        $path = $metadata['photo_path'] ?? null;
        $mime = $metadata['photo_mime'] ?? null;
        $valid = in_array($disk, ['local', 'r2'], true)
            && is_string($path)
            && str_starts_with($path, "cv-photos/{$cv->getKey()}/")
            && isset(self::EXTENSIONS[$mime]);

        if ($valid) {
            return [
                'photo_disk' => $disk,
                'photo_path' => $path,
                'photo_mime' => $mime,
            ];
        }

        $hasAny = $disk !== null || $path !== null || $mime !== null;
        if ($throw && $hasAny) {
            throw new RuntimeException('Invalid CV photo metadata.');
        }

        return [];
    }
}
