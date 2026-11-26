<?php

namespace Tests\Feature;

use App\Models\TouristSpot;
use App\Models\User;
use App\Services\ImageCompressor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;
use Tests\TestCase;

class AdminPhotoUploadTest extends TestCase
{
    use RefreshDatabase;

    private array $createdPublicFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->createdPublicFiles as $path) {
            if (is_string($path) && file_exists($path)) {
                @unlink($path);
            }
        }
        $this->createdPublicFiles = [];
        parent::tearDown();
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        return $admin;
    }

    private function createSampleWebpBytes(): string
    {
        $img = imagecreatetruecolor(16, 16);
        $green = imagecolorallocate($img, 82, 133, 48);
        imagefill($img, 0, 0, $green);
        ob_start();
        imagewebp($img, null, 80);
        $bytes = (string) ob_get_clean();
        $img = null;

        return $bytes;
    }

    private function createSampleAvifBytes(): string
    {
        if (function_exists('imageavif')) {
            $img = imagecreatetruecolor(16, 16);
            $green = imagecolorallocate($img, 82, 133, 48);
            imagefill($img, 0, 0, $green);
            ob_start();
            $ok = @imageavif($img, null, 80);
            $bytes = (string) ob_get_clean();
            $img = null;
            if ($ok && strlen($bytes) > 16) {
                return $bytes;
            }
        }

        // Minimal ISO-BMFF AVIF ftyp header (untuk fallback test jika libavif write tidak aktif di GD)
        return "\x00\x00\x00\x1Cftypavif\x00\x00\x00\x00avifmif1miaf";
    }

    private function createGdUndecodableJpegBytes(): string
    {
        // Header JPEG valid (FF D8 FF E0 + JFIF) namun gagal didekode imagecreatefromjpeg() -> wajib fallback copy!
        return "\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xFF\xDA\x00\x02FALLBACK";
    }

    public function test_image_compressor_falls_back_cleanly_when_gd_cannot_decode_and_still_rejects_scripts(): void
    {
        $tmpDir = sys_get_temp_dir();

        // 1. JPEG yang membuat imagecreatefromjpeg() mengembalikan false -> wajib fallback copy tanpa exception GD
        $quirkyJpegSource = tempnam($tmpDir, 'quirky_jpg_') . '.jpg';
        $quirkyBytes = $this->createGdUndecodableJpegBytes();
        file_put_contents($quirkyJpegSource, $quirkyBytes);

        $outJpgName = 'test_fallback_' . uniqid() . '.jpg';
        $savedJpg = ImageCompressor::compressAndSave($quirkyJpegSource, $tmpDir, $outJpgName);
        $this->assertFileExists($savedJpg);
        $this->assertSame($quirkyBytes, file_get_contents($savedJpg));
        @unlink($quirkyJpegSource);
        @unlink($savedJpg);

        // 2. WebP & AVIF yang diberi ekstensi .jpg (kasus umum unduhan Google Images)
        $webpAsJpgSource = tempnam($tmpDir, 'webp_src_') . '.jpg';
        file_put_contents($webpAsJpgSource, $this->createSampleWebpBytes());

        $outWebpName = 'test_webp_' . uniqid() . '.webp';
        $savedWebp = ImageCompressor::compressAndSave($webpAsJpgSource, $tmpDir, $outWebpName);
        $this->assertFileExists($savedWebp);
        $this->assertGreaterThan(0, filesize($savedWebp));
        @unlink($webpAsJpgSource);
        @unlink($savedWebp);

        $avifAsJpgSource = tempnam($tmpDir, 'avif_src_') . '.jpg';
        file_put_contents($avifAsJpgSource, $this->createSampleAvifBytes());

        $this->assertSame('image/avif', ImageCompressor::detectRealMime($avifAsJpgSource));

        $outAvifName = 'test_avif_' . uniqid() . '.avif';
        $savedAvif = ImageCompressor::compressAndSave($avifAsJpgSource, $tmpDir, $outAvifName);
        $this->assertFileExists($savedAvif);
        $this->assertGreaterThan(0, filesize($savedAvif));
        @unlink($avifAsJpgSource);
        @unlink($savedAvif);

        // 3. File teks / skrip palsu tetap ditolak dengan InvalidArgumentException
        $badPath = tempnam($tmpDir, 'notimg_');
        file_put_contents($badPath, 'not a real image');
        try {
            $this->expectException(InvalidArgumentException::class);
            ImageCompressor::compressAndSave($badPath, $tmpDir, 'rejected_' . uniqid() . '.jpg');
        } finally {
            @unlink($badPath);
        }
    }

    public function test_admin_update_cleanly_replaces_old_photos_with_three_new_uploads_including_gd_fallback(): void
    {
        $admin = $this->createAdmin();
        $spot = TouristSpot::create([
            'slug' => 'taman-uji-foto',
            'name' => 'Taman Uji Foto',
            'category' => 'Alam & Curug',
            'latitude' => -6.597,
            'longitude' => 106.799,
            'image' => '/images/spots/taman-peranginan.jpg',
            'gallery' => ['/images/spots/taman-peranginan.jpg'],
        ]);

        $webpFile = UploadedFile::fake()->createWithContent('google-download.jpg', $this->createSampleWebpBytes());
        $avifFile = UploadedFile::fake()->createWithContent('google-avif.jpg', $this->createSampleAvifBytes());
        $quirkyJpegFile = UploadedFile::fake()->createWithContent('camera-quirky.jpg', $this->createGdUndecodableJpegBytes());

        // Simulasikan form mengirim photo_order yang masih berisi foto lama + 3 foto baru
        $response = $this->actingAs($admin, 'web')->put(route('admin.spots.update', $spot->id), [
            'name' => 'Taman Uji Foto Updated',
            'category' => 'Alam & Curug',
            'latitude' => -6.597,
            'longitude' => 106.799,
            'photos' => [$webpFile, $avifFile, $quirkyJpegFile],
            'photo_order' => json_encode([
                ['src' => '/images/spots/taman-peranginan.jpg'],
                ['fileId' => 'new_0'],
                ['fileId' => 'new_1'],
                ['fileId' => 'new_2'],
            ]),
        ]);

        $response->assertRedirect(route('admin.spots.index'));
        $response->assertSessionHasNoErrors();

        $spot->refresh();
        // Foto lama wajib terganti bersih dengan 3 foto baru
        $this->assertCount(3, $spot->gallery);
        $this->assertNotContains('/images/spots/taman-peranginan.jpg', $spot->gallery);
        $this->assertSame($spot->gallery[0], $spot->image);
        $this->assertStringEndsWith('.webp', $spot->gallery[0]);
        $this->assertStringEndsWith('.avif', $spot->gallery[1]);
        $this->assertStringEndsWith('.jpg', $spot->gallery[2]);

        foreach ($spot->gallery as $relativePath) {
            $abs = public_path(ltrim($relativePath, '/'));
            $this->assertFileExists($abs);
            $this->createdPublicFiles[] = $abs;
        }
    }

    public function test_admin_update_without_new_photos_preserves_existing_photos(): void
    {
        $admin = $this->createAdmin();
        $spot = TouristSpot::create([
            'slug' => 'taman-tanpa-ganti-foto',
            'name' => 'Taman Lama',
            'category' => 'Alam & Curug',
            'latitude' => -6.597,
            'longitude' => 106.799,
            'image' => '/images/spots/taman-peranginan.jpg',
            'gallery' => ['/images/spots/taman-peranginan.jpg'],
        ]);

        $response = $this->actingAs($admin, 'web')->put(route('admin.spots.update', $spot->id), [
            'name' => 'Taman Diperbarui',
            'category' => 'Alam & Curug',
            'latitude' => -6.597,
            'longitude' => 106.799,
            'photo_order' => json_encode([
                ['src' => '/images/spots/taman-peranginan.jpg'],
            ]),
        ]);

        $response->assertRedirect(route('admin.spots.index'));
        $response->assertSessionHasNoErrors();

        $spot->refresh();
        $this->assertSame('Taman Diperbarui', $spot->name);
        $this->assertSame('/images/spots/taman-peranginan.jpg', $spot->image);
        $this->assertSame(['/images/spots/taman-peranginan.jpg'], $spot->gallery);
    }

    public function test_admin_update_rejects_php_script_and_shows_original_error_message(): void
    {
        $admin = $this->createAdmin();
        $spot = TouristSpot::create([
            'slug' => 'taman-uji-error',
            'name' => 'Taman Uji Error',
            'category' => 'Alam & Curug',
            'latitude' => -6.597,
            'longitude' => 106.799,
            'image' => '/images/spots/taman-peranginan.jpg',
            'gallery' => ['/images/spots/taman-peranginan.jpg'],
        ]);

        $maliciousFile = UploadedFile::fake()->createWithContent('shell.jpg', '<?php phpinfo(); ?>');

        $response = $this->actingAs($admin, 'web')->put(route('admin.spots.update', $spot->id), [
            'name' => 'Taman Uji Error',
            'category' => 'Alam & Curug',
            'latitude' => -6.597,
            'longitude' => 106.799,
            'photos' => [$maliciousFile],
        ]);

        $response->assertSessionHasErrors('photos');
        $errors = session('errors')->get('photos');
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('Salah satu file foto tidak valid atau gagal diproses:', $errors[0]);
    }
}
