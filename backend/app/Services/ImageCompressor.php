<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use InvalidArgumentException;
use RuntimeException;

class ImageCompressor
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif',
        'image/heic',
        'image/heif',
        'image/bmp',
    ];

    private const ALLOWED_EXTENSIONS = [
        'jpg',
        'jpeg',
        'jfif',
        'png',
        'webp',
        'gif',
        'avif',
        'heic',
        'heif',
        'bmp',
    ];

    /**
     * Mengompresi dan mengubah ukuran gambar secara aman sebelum disimpan ke storage publik.
     * Memeriksa tipe MIME asli file (termasuk AVIF/WebP yang sering berekstensi .jpg dari Google Images),
     * menggunakan GD bila tersedia, dan langsung fallback menyalin file asli jika fungsi GD
     * gagal mendekode atau menyimpan (tanpa melempar error fatal GD).
     * Tetap menolak file non-gambar / skrip berbahaya dengan InvalidArgumentException.
     *
     * @param  UploadedFile|string  $file  File yang diunggah
     * @param  string  $targetDir  Direktori tujuan (misal: public_path('images/spots'))
     * @param  string  $fileName  Nama file tujuan
     * @param  int  $maxWidth  Lebar maksimal (default 1280px)
     * @param  int  $maxHeight  Tinggi maksimal (default 1280px)
     * @param  int  $quality  Kualitas kompresi (1-100, default 82)
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

        $safeFileName = basename($fileName);
        $ext = strtolower(pathinfo($safeFileName, PATHINFO_EXTENSION));
        if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
            throw new InvalidArgumentException("Ekstensi file gambar tujuan (.{$ext}) tidak diizinkan.");
        }

        // Deteksi tipe MIME nyata file (bukan sekadar ekstensi nama file)
        $detectedMime = self::detectRealMime($sourcePath);
        if ($detectedMime === null || !in_array($detectedMime, self::ALLOWED_MIMES, true)) {
            $mimeLabel = $detectedMime ?: 'tidak dikenal';
            throw new InvalidArgumentException("File yang diunggah bukan gambar valid yang didukung (MIME: {$mimeLabel}).");
        }

        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $destination = rtrim($targetDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $safeFileName;

        // Jika ekstensi GD tidak aktif, langsung fallback salin file asli
        if (!extension_loaded('gd')) {
            return self::copyOriginalFallback($file, $sourcePath, $destination);
        }

        $srcImage = null;
        $targetImage = null;

        try {
            @ini_set('gd.jpeg_ignore_warning', '1');
            $srcImage = self::createGdImage($sourcePath, $detectedMime);

            // Jika fungsi GD (imagecreatefromjpeg/png/webp/avif/gif) gagal atau mengembalikan false,
            // jangan gagalkan upload — langsung fallback menyalin file upload asli ke folder tujuan.
            if (!$srcImage) {
                return self::copyOriginalFallback($file, $sourcePath, $destination);
            }

            $origWidth = imagesx($srcImage);
            $origHeight = imagesy($srcImage);
            if ($origWidth <= 0 || $origHeight <= 0) {
                $srcImage = null;
                return self::copyOriginalFallback($file, $sourcePath, $destination);
            }

            // Perbaiki orientasi EXIF untuk foto kamera HP (JPEG)
            if ($detectedMime === 'image/jpeg' && function_exists('exif_read_data')) {
                try {
                    $exif = @exif_read_data($sourcePath);
                    if (!empty($exif['Orientation'])) {
                        switch ($exif['Orientation']) {
                            case 3:
                                $rotated = @imagerotate($srcImage, 180, 0);
                                if ($rotated) {
                                    $srcImage = $rotated;
                                }
                                break;
                            case 6:
                                $rotated = @imagerotate($srcImage, -90, 0);
                                if ($rotated) {
                                    $srcImage = $rotated;
                                    [$origWidth, $origHeight] = [$origHeight, $origWidth];
                                }
                                break;
                            case 8:
                                $rotated = @imagerotate($srcImage, 90, 0);
                                if ($rotated) {
                                    $srcImage = $rotated;
                                    [$origWidth, $origHeight] = [$origHeight, $origWidth];
                                }
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

            $targetImage = @imagecreatetruecolor($targetWidth, $targetHeight);
            if (!$targetImage) {
                $srcImage = null;
                return self::copyOriginalFallback($file, $sourcePath, $destination);
            }

            if (in_array($detectedMime, ['image/png', 'image/webp', 'image/avif'], true)) {
                imagealphablending($targetImage, false);
                imagesavealpha($targetImage, true);
                $transparent = imagecolorallocatealpha($targetImage, 255, 255, 255, 127);
                imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);
            }

            $resampled = @imagecopyresampled(
                $targetImage,
                $srcImage,
                0, 0, 0, 0,
                $targetWidth,
                $targetHeight,
                $origWidth,
                $origHeight
            );

            if (!$resampled) {
                $targetImage = null;
                $srcImage = null;
                return self::copyOriginalFallback($file, $sourcePath, $destination);
            }

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
                case 'avif':
                    if (function_exists('imageavif')) {
                        $saved = @imageavif($targetImage, $destination, $quality);
                    }
                    break;
                case 'jpg':
                case 'jpeg':
                case 'jfif':
                    $saved = @imagejpeg($targetImage, $destination, $quality);
                    break;
                case 'gif':
                    if (function_exists('imagegif')) {
                        $saved = @imagegif($targetImage, $destination);
                    }
                    break;
                case 'bmp':
                    if (function_exists('imagebmp')) {
                        $saved = @imagebmp($targetImage, $destination);
                    }
                    break;
            }

            $targetImage = null;
            $srcImage = null;

            if (!$saved || !file_exists($destination) || @filesize($destination) === 0) {
                return self::copyOriginalFallback($file, $sourcePath, $destination);
            }

            return $destination;
        } catch (\Throwable) {
            $targetImage = null;
            $srcImage = null;

            return self::copyOriginalFallback($file, $sourcePath, $destination);
        }
    }

    /**
     * Deteksi MIME nyata file gambar menggunakan magic bytes biner, mime_content_type(),
     * serta getimagesize(), sekaligus memblokir file teks/skrip berbahaya (PHP/HTML/SVG).
     */
    public static function detectRealMime(string $sourcePath): ?string
    {
        $header = '';
        $handle = @fopen($sourcePath, 'rb');
        if ($handle) {
            $header = (string) fread($handle, 64);
            fclose($handle);
        }

        // Tolak payload teks skrip/HTML/SVG meskipun berekstensi gambar
        $trimmedHead = ltrim($header);
        $lowerHead = strtolower($trimmedHead);
        foreach (['<?php', '<?=', '<script', '<!doctype', '<html', '<svg'] as $dangerousPrefix) {
            if (str_starts_with($lowerHead, $dangerousPrefix)) {
                return null;
            }
        }

        $mime = null;

        if (function_exists('mime_content_type')) {
            $detected = @mime_content_type($sourcePath);
            if (is_string($detected) && $detected !== '') {
                $mime = self::normalizeMime(strtolower(trim(explode(';', $detected)[0])));
            }
        }

        if ($mime !== null && in_array($mime, self::ALLOWED_MIMES, true)) {
            return $mime;
        }

        $imageInfo = @getimagesize($sourcePath);
        if (is_array($imageInfo) && !empty($imageInfo['mime'])) {
            $infoMime = self::normalizeMime(strtolower(trim((string) $imageInfo['mime'])));
            if (in_array($infoMime, self::ALLOWED_MIMES, true)) {
                return $infoMime;
            }
        }

        // Inspeksi magic bytes raster standar (termasuk AVIF/HEIC/WebP/JPEG/PNG/GIF/BMP)
        $magicMime = self::detectMimeFromMagicBytes($header);
        if ($magicMime !== null) {
            return $magicMime;
        }

        return $mime;
    }

    private static function normalizeMime(string $mime): string
    {
        return match ($mime) {
            'image/jpg', 'image/pjpeg' => 'image/jpeg',
            'image/x-png' => 'image/png',
            'image/x-ms-bmp' => 'image/bmp',
            default => $mime,
        };
    }

    private static function detectMimeFromMagicBytes(string $header): ?string
    {
        $len = strlen($header);
        if ($len >= 3 && substr($header, 0, 3) === "\xFF\xD8\xFF") {
            return 'image/jpeg';
        }
        if ($len >= 8 && substr($header, 0, 8) === "\x89PNG\r\n\x1A\n") {
            return 'image/png';
        }
        if ($len >= 6 && (str_starts_with($header, 'GIF87a') || str_starts_with($header, 'GIF89a'))) {
            return 'image/gif';
        }
        if ($len >= 12 && substr($header, 0, 4) === 'RIFF' && substr($header, 8, 4) === 'WEBP') {
            return 'image/webp';
        }
        if ($len >= 12 && substr($header, 4, 4) === 'ftyp') {
            $brands = substr($header, 8, 24);
            if (str_contains($brands, 'avif') || str_contains($brands, 'avis')) {
                return 'image/avif';
            }
            if (
                str_contains($brands, 'heic') ||
                str_contains($brands, 'heix') ||
                str_contains($brands, 'hevc') ||
                str_contains($brands, 'mif1') ||
                str_contains($brands, 'msf1')
            ) {
                return 'image/heic';
            }
        }
        if ($len >= 2 && substr($header, 0, 2) === 'BM') {
            return 'image/bmp';
        }

        return null;
    }

    /**
     * Buat resource GdImage sesuai MIME nyata (termasuk imagecreatefromavif & imagecreatefromwebp).
     * Mengembalikan null jika fungsi tidak tersedia atau gagal mendekode agar langsung fallback copy.
     */
    private static function createGdImage(string $sourcePath, string $mime)
    {
        try {
            $img = match ($mime) {
                'image/jpeg' => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($sourcePath) : false,
                'image/png' => function_exists('imagecreatefrompng') ? @imagecreatefrompng($sourcePath) : false,
                'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($sourcePath) : false,
                'image/gif' => function_exists('imagecreatefromgif') ? @imagecreatefromgif($sourcePath) : false,
                'image/avif' => function_exists('imagecreatefromavif') ? @imagecreatefromavif($sourcePath) : false,
                'image/bmp' => function_exists('imagecreatefrombmp') ? @imagecreatefrombmp($sourcePath) : false,
                default => false,
            };

            return $img ?: null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Fallback menyalin/memindahkan file upload asli langsung ke folder tujuan saat GD gagal memproses.
     */
    private static function copyOriginalFallback($file, string $sourcePath, string $destination): string
    {
        if (@copy($sourcePath, $destination) && file_exists($destination)) {
            return $destination;
        }

        if ($file instanceof UploadedFile && $file->isValid()) {
            $file->move(dirname($destination), basename($destination));
            if (file_exists($destination)) {
                return $destination;
            }
        }

        throw new RuntimeException('Gagal menyalin file gambar ke folder tujuan.');
    }
}
