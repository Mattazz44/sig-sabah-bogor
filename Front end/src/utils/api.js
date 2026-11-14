import { Capacitor } from '@capacitor/core'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  handleImageError,
} from './imageHelper'

// URL backend publik (ngrok atau server hosting)
//const DEFAULT_REMOTE_BACKEND = 'https://doorstop-agent-mobile.ngrok-free.dev'

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

let isHandshakeRunning = false

/**
 * Otomatis menyelesaikan handshake cookie keamanan InfinityFree (__test aes.js).
 * InfinityFree memblokir request AJAX/API langsung jika browser belum memiliki cookie __test.
 * Fungsi ini membuat iframe tersembunyi ke rute server (/login) agar script aes.js dieksekusi
 * secara legal oleh browser, mengeset cookie __test untuk seluruh domain, lalu me-resolve Promise.
 */
export async function ensureInfinityFreeHandshake() {
  if (typeof document === 'undefined') return false
  if (isHandshakeRunning) return false
  isHandshakeRunning = true

  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.width = '1px'
      iframe.style.height = '1px'
      iframe.style.opacity = '0.01'
      iframe.style.pointerEvents = 'none'
      iframe.style.bottom = '0'
      iframe.style.right = '0'
      // Rute Blade server nyata yang tidak di-intercept cache Service Worker
      iframe.src = '/login'

      let finished = false
      const done = (ok) => {
        if (finished) return
        finished = true
        clearTimeout(timeoutId)
        setTimeout(() => {
          try {
            iframe.remove()
          } catch {}
          isHandshakeRunning = false
          resolve(ok)
        }, 300)
      }

      const timeoutId = setTimeout(() => done(false), 5000)

      iframe.onload = () => done(true)
      iframe.onerror = () => done(false)

      document.body.appendChild(iframe)
    } catch {
      isHandshakeRunning = false
      resolve(false)
    }
  })
}

/**
 * Wrapper fetch sentral yang otomatis:
 * 1. Mengarahkan endpoint '/api/...' ke API_BASE_URL jika ada
 * 2. Menyematkan header 'ngrok-skip-browser-warning' agar tidak diblokir halaman intersitial ngrok
 * 3. Menambahkan header Content-Type & Accept json jika diperlukan
 * 4. Menyertakan credentials: 'include' agar cookie otentikasi & proteksi __test dikirim
 * 5. Mendeteksi intersepsi proteksi anti-bot InfinityFree (__test / aes.js) dan menyelesaikannya otomatis
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

  const fetchOptions = {
    credentials: 'include',
    ...options,
    headers,
  }

  let response = await fetch(url, fetchOptions)

  // Deteksi jika respon di-intercept oleh proteksi bot InfinityFree (mengembalikan HTML dengan aes.js)
  const contentType = response.headers.get('content-type') || ''
  if (response.ok && contentType.includes('text/html')) {
    try {
      const clone = response.clone()
      const text = await clone.text()
      if (
        text.includes('aes.js') ||
        text.includes('__test') ||
        text.includes('InfinityFree') ||
        text.includes('slowAES')
      ) {
        console.warn('Proteksi cookie InfinityFree terdeteksi! Menjalankan silent handshake otomatis...')
        const handshakeSuccess = await ensureInfinityFreeHandshake()
        if (handshakeSuccess) {
          // Ulangi request fetch sekarang dengan cookie __test yang sudah aktif di browser
          response = await fetch(url, fetchOptions)
        }
      }
    } catch {
      // Abaikan jika kloning/text gagal
    }
  }

  return response
}
