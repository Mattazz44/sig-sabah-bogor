<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use InvalidArgumentException;
use RuntimeException;

class ImageCompressor
{
    /**
     * Mengompresi dan mengubah ukuran gambar secara aman sebelum disimpan ke storage publik.
     * Menolak dan melempar exception jika file bukan gambar valid.
     *
     * @param UploadedFile|string $file File yang diunggah
     * @param string $targetDir Direktori tujuan (misal: public_path('images/spots'))
     * @param string $fileName Nama file tujuan
     * @param int $maxWidth Lebar maksimal (default 1280px)
     * @param int $maxHeight Tinggi maksimal (default 1280px)
     * @param int $quality Kualitas kompresi (1-100, default 82)
     * @return string Path absolut file yang berhasil disimpan
     *
     * @throws InvalidArgumentException|RuntimeException
     */
    public static function compressAndSave(
        $file,
        string $targetDir,
        string $fileName,
        int $maxWidth = 1280,
        int $maxHeight = 1280,
        int $quality = 82
    ): string {
        $sourcePath = $file instanceof UploadedFile ? $file->getRealPath() : $file;
        if (!is_string($sourcePath) || $sourcePath === '' || !file_exists($sourcePath)) {
            throw new InvalidArgumentException('File gambar sumber tidak ditemukan atau tidak valid.');
        }

        // Validasi header & dimensi gambar nyata sebelum pemrosesan apa pun
        $imageInfo = @getimagesize($sourcePath);
        if ($imageInfo === false) {
            throw new InvalidArgumentException('File yang diunggah bukan gambar yang valid.');
        }

        [$origWidth, $origHeight, $imageType] = $imageInfo;
        $allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF];
        if (!in_array($imageType, $allowedTypes, true)) {
            throw new InvalidArgumentException('Format gambar tidak didukung.');
        }

        if (!extension_loaded('gd')) {
            throw new RuntimeException('Ekstensi GD diperlukan untuk memproses dan memverifikasi gambar.');
        }

        $srcImage = match ($imageType) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($sourcePath),
            IMAGETYPE_PNG => @imagecreatefrompng($sourcePath),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($sourcePath) : null,
            IMAGETYPE_GIF => @imagecreatefromgif($sourcePath),
            default => null,
        };

        if (!$srcImage) {
            throw new InvalidArgumentException('File gambar rusak atau tidak dapat didekode.');
        }

        // Perbaiki orientasi EXIF untuk foto kamera HP (JPEG)
        if ($imageType === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            try {
                $exif = @exif_read_data($sourcePath);
                if (!empty($exif['Orientation'])) {
                    switch ($exif['Orientation']) {
                        case 3:
                            $srcImage = imagerotate($srcImage, 180, 0);
                            break;
                        case 6:
                            $srcImage = imagerotate($srcImage, -90, 0);
                            [$origWidth, $origHeight] = [$origHeight, $origWidth];
                            break;
                        case 8:
                            $srcImage = imagerotate($srcImage, 90, 0);
                            [$origWidth, $origHeight] = [$origHeight, $origWidth];
                            break;
                    }
                }
            } catch (\Throwable) {
                // Abaikan jika pembacaan EXIF gagal
            }
        }

        if ($origWidth > $maxWidth || $origHeight > $maxHeight) {
            $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
            $targetWidth = max(1, (int) round($origWidth * $ratio));
            $targetHeight = max(1, (int) round($origHeight * $ratio));
        } else {
            $targetWidth = $origWidth;
            $targetHeight = $origHeight;
        }

        $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);

        if ($imageType === IMAGETYPE_PNG || $imageType === IMAGETYPE_WEBP) {
            imagealphablending($targetImage, false);
            imagesavealpha($targetImage, true);
            $transparent = imagecolorallocatealpha($targetImage, 255, 255, 255, 127);
            imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);
        }

        imagecopyresampled(
            $targetImage,
            $srcImage,
            0, 0, 0, 0,
            $targetWidth,
            $targetHeight,
            $origWidth,
            $origHeight
        );

        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $safeFileName = basename($fileName);
        $destination = rtrim($targetDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $safeFileName;
        $ext = strtolower(pathinfo($safeFileName, PATHINFO_EXTENSION));
        $saved = false;

        switch ($ext) {
            case 'png':
                $pngQuality = (int) max(0, min(9, round((100 - $quality) / 10)));
                $saved = @imagepng($targetImage, $destination, $pngQuality);
                break;
            case 'webp':
                if (function_exists('imagewebp')) {
                    $saved = @imagewebp($targetImage, $destination, $quality);
                }
                break;
            case 'jpg':
            case 'jpeg':
                $saved = @imagejpeg($targetImage, $destination, $quality);
                break;
            case 'gif':
                if (function_exists('imagegif')) {
                    $saved = @imagegif($targetImage, $destination);
                }
                break;
            default:
                @imagedestroy($targetImage);
                @imagedestroy($srcImage);
                throw new InvalidArgumentException('Ekstensi file gambar tujuan tidak diizinkan.');
        }

        @imagedestroy($targetImage);
        @imagedestroy($srcImage);

        if (!$saved || !file_exists($destination)) {
            throw new RuntimeException('Gagal menyimpan gambar yang telah tervalidasi.');
        }

        return $destination;
    }
}
