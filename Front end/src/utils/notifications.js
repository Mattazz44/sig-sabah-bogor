const NOTIFICATION_STORAGE_KEY = 'sabah_notifications_v2'
export const NOTIFICATIONS_UPDATED_EVENT = 'sabah:notifications-updated'

// Hanya 4 kategori pemicu penting yang diizinkan (tanpa riwayat jelajah / baru dilihat)
export const ALLOWED_NOTIFICATION_TYPES = new Set(['success', 'route', 'social', 'favorite'])

const MAX_NOTIFICATIONS = 25

export function formatNotificationTime(timestamp, language = 'id') {
  const isEn = language === 'en'
  if (!timestamp || Number.isNaN(Number(timestamp))) return isEn ? 'Just now' : 'Baru saja'
  const diffMs = Date.now() - Number(timestamp)
  if (diffMs < 60_000) return isEn ? 'Just now' : 'Baru saja'
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return isEn ? `${diffMin} min ago` : `${diffMin} menit lalu`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return isEn ? `${diffHours} hr ago` : `${diffHours} jam lalu`
  try {
    return new Intl.DateTimeFormat(isEn ? 'en-US' : 'id-ID', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(Number(timestamp)))
  } catch {
    return isEn ? 'Just now' : 'Baru saja'
  }
}

export function getAppNotifications() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        ALLOWED_NOTIFICATION_TYPES.has(item.type),
    )
  } catch {
    return []
  }
}

function writeAppNotifications(list) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Abaikan kegagalan storage pada mode privat
  }
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT))
}

export function pushAppNotification({ id = null, type, title, desc = '', slug = null }) {
  if (typeof window === 'undefined') return null
  if (!ALLOWED_NOTIFICATION_TYPES.has(type) || !title) return null

  const entry = {
    id: id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title: String(title).trim(),
    desc: String(desc || '').trim(),
    slug: slug || null,
    createdAt: Date.now(),
  }

  const current = getAppNotifications()
  const deduplicated = current.filter((item) => {
    if (item.id === entry.id) return false
    if (entry.type === 'favorite' && entry.slug && item.type === 'favorite' && item.slug === entry.slug) {
      return false
    }
    return true
  })

  const next = [entry, ...deduplicated].slice(0, MAX_NOTIFICATIONS)
  writeAppNotifications(next)
  return entry
}

export function removeFavoriteNotification(slug) {
  if (typeof window === 'undefined' || !slug) return
  const current = getAppNotifications()
  const filtered = current.filter((item) => !(item.type === 'favorite' && item.slug === slug))
  if (filtered.length !== current.length) {
    writeAppNotifications(filtered)
  }
}
