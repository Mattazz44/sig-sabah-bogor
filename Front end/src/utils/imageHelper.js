// Placeholder elegan (tanpa ikon gunung/lingkaran hijau mencolok)
export const DEFAULT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23232e22'/%3E%3Cstop offset='100%25' stop-color='%23161e16'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='400' fill='url(%23g)'/%3E%3Ccircle cx='300' cy='200' r='34' fill='none' stroke='%23E2D7B5' stroke-opacity='0.35' stroke-width='2'/%3E%3Cpolygon points='315,185 305,205 285,215 295,195' fill='%23E2D7B5' fill-opacity='0.35'/%3E%3C/svg%3E"

export const DEFAULT_AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23253024'/%3E%3Cstop offset='100%25' stop-color='%23161e16'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='120' rx='60' fill='url(%23a)'/%3E%3Ccircle cx='60' cy='46' r='16' fill='none' stroke='%23EBF0EB' stroke-opacity='0.65' stroke-width='3'/%3E%3Cpath d='M32 98c4-18 16-26 28-26s24 8 28 26' fill='none' stroke='%23EBF0EB' stroke-opacity='0.65' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E"

const BOGOR_FALLBACK_POOLS = {
  alam: [
    '/images/spots/kebun-raya-bogor.jpg',
    '/images/spots/curug-cikuluwung.jpg',
    '/images/spots/curug-leuwi-hejo.jpg',
    '/images/spots/curug-nangka.jpg',
    '/images/spots/taman-peranginan.jpg',
  ],
  kuliner: [
    '/images/spots/kopi-daong.jpg',
    '/images/spots/jalan-suryakencana.jpg',
    '/images/spots/lawang-surya-kencana.jpg',
  ],
  edukasi: [
    '/images/spots/jbound-geo-edu-park.jpg',
    '/images/spots/museum-zoologi.jpg',
    '/images/spots/museum-peta.jpg',
    '/images/spots/prasasti-batutulis.jpg',
    '/images/spots/tugu-kujang.jpg',
  ],
}

function getPoolKeyForPlace(placeOrCategory) {
  const category =
    typeof placeOrCategory === 'string'
      ? placeOrCategory
      : `${placeOrCategory?.category || ''} ${placeOrCategory?.name || ''}`
  const lower = category.toLowerCase()
  if (lower.includes('kuliner') || lower.includes('kopi') || lower.includes('kafe') || lower.includes('surya')) {
    return 'kuliner'
  }
  if (lower.includes('edukasi') || lower.includes('budaya') || lower.includes('museum') || lower.includes('sejarah') || lower.includes('tugu') || lower.includes('istana')) {
    return 'edukasi'
  }
  return 'alam'
}

export function getBogorFallbackPhoto(placeOrCategory) {
  const poolKey = getPoolKeyForPlace(placeOrCategory)
  const pool = BOGOR_FALLBACK_POOLS[poolKey] || BOGOR_FALLBACK_POOLS.alam
  const seedText =
    typeof placeOrCategory === 'object' && placeOrCategory !== null
      ? String(placeOrCategory.slug || placeOrCategory.name || placeOrCategory.id || 'bogor')
      : String(placeOrCategory || 'bogor')
  let hash = 0
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0
  }
  return pool[hash % pool.length]
}

export function getBogorFallbackGallery(place, count = 3) {
  const primary = getBogorFallbackPhoto(place)
  const pool = [
    ...(BOGOR_FALLBACK_POOLS[getPoolKeyForPlace(place)] || BOGOR_FALLBACK_POOLS.alam),
    '/images/spots/kebun-raya-bogor.jpg',
    '/images/spots/tugu-kujang.jpg',
    '/images/spots/kopi-daong.jpg',
  ]
  const unique = [primary, ...pool.filter((item) => item !== primary)]
  return unique.slice(0, Math.max(1, count))
}

// Cache penyimpanan blob URL gambar yang sudah berhasil di-fetch via header ngrok
const ngrokBlobCache = new Map()
const ngrokPendingFetches = new Map()

/**
 * Menentukan apakah fetch eksplisit dengan header bypass ngrok diperlukan.
 * Pada localhost/same-origin reguler, native <img> jauh lebih cepat tanpa saturasi koneksi.
 */
export function shouldUseNgrokFetch(url = '') {
  if (typeof window !== 'undefined' && /ngrok/i.test(window.location.hostname || '')) {
    return true
  }
  const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
  if (/ngrok/i.test(rawBase)) {
    return true
  }
  return typeof url === 'string' && /ngrok/i.test(url)
}

/**
 * Mengonversi path gambar dari API Backend menjadi URL lengkap.
 * - Jika imagePath kosong atau null -> kembalikan DEFAULT_IMAGE_PLACEHOLDER.
 * - Jika sudah ada di cache blob -> kembalikan blob URL dari memori.
 * - Jika imagePath masih mengandung http://localhost:8000 atau http://127.0.0.1:8000 ->
 *   ganti domain tersebut dengan import.meta.env.VITE_API_BASE_URL.
 * - Jika imagePath berupa path relatif (misal: /images/taman.jpg) ->
 *   gabungkan dengan baseUrl yang bersih dari spasi dan trailing slash.
 */
export function getImageUrl(imagePath, fallback = DEFAULT_IMAGE_PLACEHOLDER) {
  if (!imagePath || typeof imagePath !== 'string') {
    return fallback
  }

  let trimmed = imagePath.trim()
  if (!trimmed) {
    return fallback
  }

  if (ngrokBlobCache.has(trimmed)) {
    return ngrokBlobCache.get(trimmed)
  }

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  // Bersihkan baseUrl dari spasi (whitespace) dan trailing slash (kosong = same-origin)
  const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
  const baseUrl = rawBase.replace(/\/+$/, '')

  // Ganti domain localhost/127.0.0.1 bawaan Laravel jika diakses lewat ngrok / server lain
  trimmed = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseUrl)

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (ngrokBlobCache.has(trimmed)) {
      return ngrokBlobCache.get(trimmed)
    }
    return trimmed
  }

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
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          throw new Error(`Invalid HTML response for image: ${contentType}`)
        }
        return res.blob()
      })
      .then((blob) => {
        if (!blob || blob.size === 0 || (blob.type && !blob.type.startsWith('image/'))) {
          throw new Error(`Invalid image MIME/size: ${blob?.type || 'unknown'}`)
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
