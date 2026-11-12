// Placeholder SVG data URI agar tetap tampil rapi meskipun server/internet offline (anti-broken image loop)
export const DEFAULT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23384931'/%3E%3Cpath d='M180 290l75-95 60 72 45-52 60 75H180z' fill='%234f5f3b'/%3E%3Ccircle cx='230' cy='155' r='24' fill='%23687d50'/%3E%3Ctext x='50%25' y='84%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff80' font-family='Inter, sans-serif' font-size='16'%3EGambar Wisata Bogor%3C/text%3E%3C/svg%3E"

export const DEFAULT_AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23384931'/%3E%3Ccircle cx='60' cy='45' r='20' fill='%23687d50'/%3E%3Cpath d='M25 105c5-22 22-32 35-32s30 10 35 32' fill='%23687d50'/%3E%3C/svg%3E"

// Cache penyimpanan blob URL gambar yang sudah berhasil di-fetch via header ngrok
const ngrokBlobCache = new Map()
const ngrokPendingFetches = new Map()

/**
 * Mengonversi path gambar dari API Backend menjadi URL lengkap.
 * - Jika imagePath kosong atau null -> kembalikan DEFAULT_IMAGE_PLACEHOLDER.
 * - Jika sudah ada di cache blob -> kembalikan blob URL dari memori.
 * - Jika imagePath berupa path relatif (misal: /images/taman.jpg) ->
 *   gabungkan dengan baseUrl yang bersih dari spasi dan trailing slash.
 */
export function getImageUrl(imagePath, fallback = DEFAULT_IMAGE_PLACEHOLDER) {
  if (!imagePath || typeof imagePath !== 'string') {
    return fallback
  }

  const trimmed = imagePath.trim()
  if (!trimmed) {
    return fallback
  }

  if (ngrokBlobCache.has(trimmed)) {
    return ngrokBlobCache.get(trimmed)
  }

  // Jika sudah berupa URL lengkap atau data/blob URI, jangan di-prefix lagi
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }

  // Bersihkan baseUrl dari spasi (whitespace) dan trailing slash
  const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
  const baseUrl = rawBase.replace(/\/+$/, '')
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const fullUrl = `${baseUrl}${normalizedPath}`

  if (ngrokBlobCache.has(fullUrl)) {
    return ngrokBlobCache.get(fullUrl)
  }

  return fullUrl
}

/**
 * Event handler onError pada elemen <img>:
 * 1. Jika tag <img> gagal karena pencegatan halaman HTML ngrok, otomatis lakukan fetch()
 *    ke endpoint /api/media/{filename} dengan header 'ngrok-skip-browser-warning: true',
 *    ubah menjadi Blob URL, dan pasang ke elemen <img>!
 * 2. Jika tetap gagal (404 / offline), baru ganti ke SVG placeholder.
 */
export function handleImageError(e, fallback = DEFAULT_IMAGE_PLACEHOLDER) {
  const target = e?.currentTarget
  if (!target) return

  const failedSrc = target.src || ''

  // Cegah loop jika sudah mencoba fetch blob atau sudah di fallback
  if (
    failedSrc === fallback ||
    failedSrc.startsWith('data:') ||
    failedSrc.startsWith('blob:') ||
    target.dataset.retriedNgrok === 'true'
  ) {
    target.onerror = null
    target.src = fallback
    return
  }

  target.dataset.retriedNgrok = 'true'

  // Jika sudah ada di cache blob, langsung pakai
  if (ngrokBlobCache.has(failedSrc)) {
    target.src = ngrokBlobCache.get(failedSrc)
    return
  }

  // Bangun URL endpoint /api/media/{filename} yang dilengkapi CORS penuh di Laravel
  const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  const fileName = failedSrc.split('/').pop()?.split('?')[0]

  if (!fileName) {
    target.onerror = null
    target.src = fallback
    return
  }

  const mediaApiUrl = `${rawBase}/api/media/${fileName}`

  let fetchPromise = ngrokPendingFetches.get(failedSrc)
  if (!fetchPromise) {
    fetchPromise = fetch(mediaApiUrl, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        // Pastikan yang diterima benar-benar image (bukan text/html dari ngrok)
        if (blob.type && !blob.type.startsWith('image/')) {
          throw new Error(`Invalid image MIME: ${blob.type}`)
        }
        const blobUrl = URL.createObjectURL(blob)
        ngrokBlobCache.set(failedSrc, blobUrl)
        return blobUrl
      })
      .finally(() => {
        ngrokPendingFetches.delete(failedSrc)
      })

    ngrokPendingFetches.set(failedSrc, fetchPromise)
  }

  fetchPromise
    .then((blobUrl) => {
      target.src = blobUrl
    })
    .catch(() => {
      target.onerror = null
      target.src = fallback
    })
}

