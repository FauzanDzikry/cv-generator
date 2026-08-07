<?php

namespace Tests\Unit;

use App\Models\CVData;
use App\Services\CVPhotoStorage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Filesystem\FilesystemManager;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class CVPhotoStorageTest extends TestCase
{
    private const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    private string $cvId = '019fda5e-2532-75e2-97e8-b59a9e8faaf3';

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_r2_failure_falls_back_to_local_and_records_actual_disk(): void
    {
        config(['filesystems.cv_photos.r2_enabled' => true]);

        $r2 = Mockery::mock(FilesystemAdapter::class);
        $r2->shouldReceive('put')->once()->andThrow(new RuntimeException('R2 unavailable'));
        $local = Mockery::mock(FilesystemAdapter::class);
        $local->shouldReceive('put')->once()->andReturnTrue();

        $metadata = $this->serviceWithDisks($r2, $local)->storeBytes($this->cv(), 'image-bytes', 'image/png');

        $this->assertSame('local', $metadata['photo_disk']);
        $this->assertSame('image/png', $metadata['photo_mime']);
        $this->assertStringStartsWith("cv-photos/{$this->cvId}/", $metadata['photo_path']);
        $this->assertStringEndsWith('.png', $metadata['photo_path']);
    }

    public function test_r2_success_does_not_write_to_local(): void
    {
        config(['filesystems.cv_photos.r2_enabled' => true]);

        $r2 = Mockery::mock(FilesystemAdapter::class);
        $r2->shouldReceive('put')->once()->andReturnTrue();
        $local = Mockery::mock(FilesystemAdapter::class);
        $local->shouldNotReceive('put');

        $metadata = $this->serviceWithDisks($r2, $local)->storeBytes($this->cv(), 'image-bytes', 'image/jpeg');

        $this->assertSame('r2', $metadata['photo_disk']);
        $this->assertStringEndsWith('.jpg', $metadata['photo_path']);
    }

    public function test_disabled_r2_writes_directly_to_local(): void
    {
        config(['filesystems.cv_photos.r2_enabled' => false]);

        $r2 = Mockery::mock(FilesystemAdapter::class);
        $r2->shouldNotReceive('put');
        $local = Mockery::mock(FilesystemAdapter::class);
        $local->shouldReceive('put')->once()->andReturnTrue();

        $metadata = $this->serviceWithDisks($r2, $local)->storeBytes($this->cv(), 'image-bytes', 'image/png');

        $this->assertSame('local', $metadata['photo_disk']);
    }

    public function test_both_disks_failing_throws_and_does_not_return_metadata(): void
    {
        config(['filesystems.cv_photos.r2_enabled' => true]);

        $r2 = Mockery::mock(FilesystemAdapter::class);
        $r2->shouldReceive('put')->once()->andThrow(new RuntimeException('R2 unavailable'));
        $local = Mockery::mock(FilesystemAdapter::class);
        $local->shouldReceive('put')->once()->andThrow(new RuntimeException('Local unavailable'));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unable to store CV photo');

        $this->serviceWithDisks($r2, $local)->storeBytes($this->cv(), 'image-bytes', 'image/png');
    }

    public function test_invalid_mime_and_untrusted_metadata_are_rejected(): void
    {
        $manager = Mockery::mock(FilesystemManager::class);
        $service = new CVPhotoStorage($manager);

        try {
            $service->storeBytes($this->cv(), 'image-bytes', 'image/gif');
            $this->fail('Invalid MIME should fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Unsupported CV photo MIME type.', $exception->getMessage());
        }

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Invalid CV photo metadata');
        $service->delete([
            'photo_disk' => 'public',
            'photo_path' => "cv-photos/{$this->cvId}/photo.png",
            'photo_mime' => 'image/png',
        ], $this->cv());
    }

    public function test_legacy_base64_is_streamed_without_exposing_storage(): void
    {
        $manager = Mockery::mock(FilesystemManager::class);
        $service = new CVPhotoStorage($manager);
        $cv = $this->cv();
        $cv->custom_fields = [
            'photo_base64' => 'data:image/png;base64,'.self::PNG_BASE64,
        ];

        $response = $service->response($cv);

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertSame(base64_decode(self::PNG_BASE64), $content);
        $this->assertSame('image/png', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('private', (string) $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function test_copy_migrates_legacy_base64_to_an_independent_file(): void
    {
        config(['filesystems.cv_photos.r2_enabled' => false]);

        $source = $this->cv();
        $source->custom_fields = [
            'photo_base64' => 'data:image/png;base64,'.self::PNG_BASE64,
        ];
        $target = $this->cv('019fda5e-2532-75e2-97e8-b59a9e8faaf4');
        $r2 = Mockery::mock(FilesystemAdapter::class);
        $r2->shouldNotReceive('put');
        $local = Mockery::mock(FilesystemAdapter::class);
        $local->shouldReceive('put')->once()->withArgs(fn (string $path, string $bytes) => str_starts_with($path, "cv-photos/{$target->id}/")
            && $bytes === base64_decode(self::PNG_BASE64))->andReturnTrue();

        $metadata = $this->serviceWithDisks($r2, $local)->copy($source, $target);

        $this->assertSame('local', $metadata['photo_disk']);
        $this->assertStringStartsWith("cv-photos/{$target->id}/", $metadata['photo_path']);
    }

    private function cv(?string $id = null): CVData
    {
        $cv = new CVData;
        $cv->id = $id ?? $this->cvId;

        return $cv;
    }

    private function serviceWithDisks(FilesystemAdapter $r2, FilesystemAdapter $local): CVPhotoStorage
    {
        $manager = Mockery::mock(FilesystemManager::class);
        $manager->shouldReceive('disk')->with('r2')->zeroOrMoreTimes()->andReturn($r2);
        $manager->shouldReceive('disk')->with('local')->zeroOrMoreTimes()->andReturn($local);

        return new CVPhotoStorage($manager);
    }
}
