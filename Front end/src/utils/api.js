import { Capacitor } from '@capacitor/core'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  handleImageError,
} from './imageHelper'

// URL backend publik (ngrok atau server hosting)
const DEFAULT_REMOTE_BACKEND = 'https://doorstop-agent-mobile.ngrok-free.dev'

// Gunakan VITE_API_BASE_URL jika ada di .env; jika di Android Capacitor gunakan backend remote; jika di browser dev gunakan proxy ''
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : Capacitor.isNativePlatform()
      ? DEFAULT_REMOTE_BACKEND
      : ''

export {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  handleImageError,
}

/**
 * Wrapper fetch sentral yang otomatis:
 * 1. Mengarahkan endpoint '/api/...' ke API_BASE_URL jika ada
 * 2. Menyematkan header 'ngrok-skip-browser-warning' agar tidak diblokir halaman intersitial ngrok
 * 3. Menambahkan header Content-Type & Accept json jika diperlukan
 */
export async function apiFetch(endpoint, options = {}) {
  const url =
    endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers = new Headers(options.headers || {})

  // Bypass peringatan halaman browser gratis ngrok
  if (!headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }

  // Set default Accept jika belum ada
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
