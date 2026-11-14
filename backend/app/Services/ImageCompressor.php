<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class ImageCompressor
{
    /**
     * Mengompresi dan mengubah ukuran gambar sebelum disimpan ke storage publik.
     *
     * @param UploadedFile|string $file File yang diunggah
     * @param string $targetDir Direktori tujuan (misal: public_path('images/spots'))
     * @param string $fileName Nama file tujuan
     * @param int $maxWidth Lebar maksimal (default 1280px)
     * @param int $maxHeight Tinggi maksimal (default 1280px)
     * @param int $quality Kualitas kompresi (1-100, default 82)
     * @return string Path absolut file yang berhasil disimpan
     */
    public static function compressAndSave(
        $file,
        string $targetDir,
        string $fileName,
        int $maxWidth = 1280,
        int $maxHeight = 1280,
        int $quality = 82
    ): string {
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $destination = rtrim($targetDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName;
        $sourcePath = $file instanceof UploadedFile ? $file->getRealPath() : $file;

        // Jika ekstensi GD tidak aktif, lakukan fallback move langsung
        if (!extension_loaded('gd') || !file_exists($sourcePath)) {
            if ($file instanceof UploadedFile) {
                $file->move($targetDir, $fileName);
            } else {
                copy($sourcePath, $destination);
            }
            return $destination;
        }

        $imageInfo = @getimagesize($sourcePath);
        if (!$imageInfo) {
            if ($file instanceof UploadedFile) {
                $file->move($targetDir, $fileName);
            } else {
                copy($sourcePath, $destination);
            }
            return $destination;
        }

        [$origWidth, $origHeight, $imageType] = $imageInfo;

        // Buat GD resource berdasarkan tipe gambar
        $srcImage = null;
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $srcImage = @imagecreatefromjpeg($sourcePath);
                break;
            case IMAGETYPE_PNG:
                $srcImage = @imagecreatefrompng($sourcePath);
                break;
            case IMAGETYPE_WEBP:
                if (function_exists('imagecreatefromwebp')) {
                    $srcImage = @imagecreatefromwebp($sourcePath);
                }
                break;
            case IMAGETYPE_GIF:
                $srcImage = @imagecreatefromgif($sourcePath);
                break;
        }

        if (!$srcImage) {
            if ($file instanceof UploadedFile) {
                $file->move($targetDir, $fileName);
            } else {
                copy($sourcePath, $destination);
            }
            return $destination;
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
            } catch (\Throwable $e) {
                // Abaikan jika pembacaan EXIF gagal
            }
        }

        // Hitung dimensi baru dengan mempertahankan aspek rasio (aspect ratio)
        if ($origWidth > $maxWidth || $origHeight > $maxHeight) {
            $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
            $targetWidth = max(1, (int) round($origWidth * $ratio));
            $targetHeight = max(1, (int) round($origHeight * $ratio));
        } else {
            $targetWidth = $origWidth;
            $targetHeight = $origHeight;
        }

        // Buat canvas gambar baru
        $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);

        // Pertahankan transparansi untuk format PNG dan WEBP
        if ($imageType === IMAGETYPE_PNG || $imageType === IMAGETYPE_WEBP) {
            imagealphablending($targetImage, false);
            imagesavealpha($targetImage, true);
            $transparent = imagecolorallocatealpha($targetImage, 255, 255, 255, 127);
            imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);
        }

        // Resampling resolusi dengan kualitas tinggi
        imagecopyresampled(
            $targetImage,
            $srcImage,
            0, 0, 0, 0,
            $targetWidth,
            $targetHeight,
            $origWidth,
            $origHeight
        );

        // Simpan gambar terkompresi sesuai ekstensi file tujuan
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $saved = false;

        switch ($ext) {
            case 'png':
                // Kompresi PNG skala 0 (tanpa) sampai 9 (maksimal)
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
            default:
                $saved = @imagejpeg($targetImage, $destination, $quality);
                break;
        }

        // Bebaskan memori GD
        @imagedestroy($targetImage);
        @imagedestroy($srcImage);

        // Jika fungsi penyimpanan GD gagal, fallback ke move biasa
        if (!$saved || !file_exists($destination)) {
            if ($file instanceof UploadedFile) {
                $file->move($targetDir, $fileName);
            } else {
                copy($sourcePath, $destination);
            }
        }

        return $destination;
    }
}

