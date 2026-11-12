// Placeholder SVG data URI agar tetap tampil rapi meskipun server/internet offline (anti-broken image loop)
export const DEFAULT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23384931'/%3E%3Cpath d='M180 290l75-95 60 72 45-52 60 75H180z' fill='%234f5f3b'/%3E%3Ccircle cx='230' cy='155' r='24' fill='%23687d50'/%3E%3Ctext x='50%25' y='84%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff80' font-family='Inter, sans-serif' font-size='16'%3EGambar Wisata Bogor%3C/text%3E%3C/svg%3E"

export const DEFAULT_AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23384931'/%3E%3Ccircle cx='60' cy='45' r='20' fill='%23687d50'/%3E%3Cpath d='M25 105c5-22 22-32 35-32s30 10 35 32' fill='%23687d50'/%3E%3C/svg%3E"

/**
 * Mengonversi path gambar dari API Backend menjadi URL lengkap.
 * - Jika imagePath kosong atau null -> kembalikan DEFAULT_IMAGE_PLACEHOLDER.
 * - Jika imagePath sudah diawali http://, https://, data:, atau blob: -> kembalikan langsung.
 * - Jika imagePath berupa path relatif dari backend (misal: /uploads/foto.jpg atau /images/foto.jpg) ->
 *   gabungkan dengan import.meta.env.VITE_API_BASE_URL.
 */
export function getImageUrl(imagePath, fallback = DEFAULT_IMAGE_PLACEHOLDER) {
  if (!imagePath || typeof imagePath !== 'string' || !imagePath.trim()) {
    return fallback
  }

  const trimmed = imagePath.trim()

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(
    /\/+$/,
    '',
  )
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  return `${baseUrl}${normalizedPath}`
}

/**
 * Event handler onError pada elemen <img> agar otomatis mengganti src ke placeholder
 * jika gambar dari server Backend gagal dimuat (404 / network error).
 */
export function handleImageError(e, fallback = DEFAULT_IMAGE_PLACEHOLDER) {
  const target = e?.currentTarget
  if (!target) return
  if (target.src !== fallback) {
    target.onerror = null
    target.src = fallback
  }
}

