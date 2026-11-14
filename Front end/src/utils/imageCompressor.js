/**
 * Mengompresi file gambar menggunakan HTML5 Canvas di browser client sebelum diunggah ke backend.
 * Mengubah resolusi gambar mentah kamera HP (seringkali 4000x3000px, 5-15 MB) menjadi ukuran optimal
 * (misal max 1280px / 600px, ~50-200 KB) dengan mempertahankan aspek rasio secara akurat.
 *
 * @param {File|Blob} file File gambar asli dari input
 * @param {Object} options Opsi kompresi
 * @param {number} [options.maxWidth=1280] Lebar maksimal dalam pixel
 * @param {number} [options.maxHeight=1280] Tinggi maksimal dalam pixel
 * @param {number} [options.quality=0.82] Kualitas kompresi (0.1 - 1.0)
 * @param {string} [options.mimeType='image/jpeg'] Format output (image/jpeg atau image/webp)
 * @returns {Promise<File>} File gambar baru hasil kompresi yang jauh lebih ringan
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options

  // Jika bukan file gambar atau browser tidak mendukung Canvas/FileReader, kembalikan file asli
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file
  }

  // File vektor SVG atau GIF animasi dipertahankan apa adanya
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Hitung aspek rasio jika melebihi ukuran maksimum
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.max(1, Math.round(width * ratio))
          height = Math.max(1, Math.round(height * ratio))
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Haluskan rendering gambar pada saat scaling
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Gambar ulang ke canvas
        ctx.drawImage(img, 0, 0, width, height)

        const targetMime = file.type === 'image/png' ? 'image/png' : mimeType

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            // Jika hasil kompresi ternyata lebih besar dari file asli, tetap gunakan file asli
            if (blob.size >= file.size) {
              resolve(file)
              return
            }

            // Buat File object baru dengan nama file asli
            const compressedFile = new File([blob], file.name, {
              type: targetMime,
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          targetMime,
          quality,
        )
      }

      img.onerror = () => resolve(file)
      img.src = e.target.result
    }

    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

