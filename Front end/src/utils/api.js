import { Capacitor } from '@capacitor/core'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  handleImageError,
} from './imageHelper'

// Fallback backend untuk build Capacitor native ketika VITE_API_BASE_URL tidak diisi
const DEFAULT_REMOTE_BACKEND = 'http://10.0.2.2:8000'
const configuredApiBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

// Gunakan VITE_API_BASE_URL jika ada di .env; jika di Android Capacitor gunakan backend default native; jika di browser dev/PWA gunakan proxy/same-origin ''
export const API_BASE_URL =
  configuredApiBase !== ''
    ? configuredApiBase
    : Capacitor.isNativePlatform()
      ? DEFAULT_REMOTE_BACKEND
      : ''

export const AUTH_TOKEN_STORAGE_KEY = 'sabah_auth_token'
export const CURRENT_USER_STORAGE_KEY = 'sabah_current_user'
export const AUTH_EXPIRED_EVENT = 'sabah:auth-expired'

export function getAuthToken() {
  if (typeof window === 'undefined') return null
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    return token && token.trim() !== '' ? token.trim() : null
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return
  try {
    if (token && String(token).trim() !== '') {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, String(token).trim())
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }
  } catch {
    // Abaikan jika localStorage diblokir
  }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') return
  try {
    if (user && typeof user === 'object') {
      const sanitizedUser = { ...user }
      delete sanitizedUser.token
      window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(sanitizedUser))
    } else {
      window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
    }
  } catch {
    // Abaikan jika localStorage diblokir
  }
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
  } catch {
    // Abaikan jika localStorage diblokir
  }
}

export function buildApiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL || '/'
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${normalizedPath}`
}

export {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  handleImageError,
}

let isHandshakeRunning = false

/**
 * Otomatis menyelesaikan handshake cookie keamanan InfinityFree (__test aes.js).
 */
export async function ensureInfinityFreeHandshake() {
  if (typeof document === 'undefined') return false
  if (isHandshakeRunning) return false
  isHandshakeRunning = true

  return new Promise((resolve) => {
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      isHandshakeRunning = false
      resolve(result)
    }

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.src = `${API_BASE_URL}/login`

    const timer = setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
      finish(false)
    }, 8000)

    iframe.onload = () => {
      setTimeout(() => {
        clearTimeout(timer)
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        finish(true)
      }, 2200)
    }

    document.body.appendChild(iframe)
  })
}

function isBackendTarget(endpoint) {
  if (!endpoint) return false
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    return true
  }
  return Boolean(API_BASE_URL && endpoint.startsWith(API_BASE_URL))
}

function isAuthAttemptEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') return false
  const path = endpoint.replace(/^https?:\/\/[^/]+/i, '')
  return /^\/?api\/auth\/(login|register|google\/exchange)(?:[/?]|$)/.test(path)
}

/**
 * Wrapper fetch sentral yang otomatis:
 * 1. Mengarahkan endpoint '/api/...' ke API_BASE_URL jika ada
 * 2. Menyematkan header Authorization Bearer <token> dari localStorage ke endpoint backend
 * 3. Menangani 401/403 secara global dengan menghapus token dan memicu auto-logout ke login
 */
export async function apiFetch(endpoint, options = {}) {
  const url = buildApiUrl(endpoint)
  const internalTarget = isBackendTarget(endpoint)
  const headers = new Headers(options.headers || {})

  if (!headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const token = getAuthToken()
  if (internalTarget && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const fetchOptions = {
    credentials: 'include',
    ...options,
    headers,
  }

  let response = await fetch(url, fetchOptions)

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
          response = await fetch(url, fetchOptions)
        }
      }
    } catch {
      // Abaikan jika kloning/text gagal
    }
  }

  if (
    internalTarget &&
    (response.status === 401 || response.status === 403) &&
    !isAuthAttemptEndpoint(endpoint)
  ) {
    clearAuthStorage()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: { status: response.status, endpoint },
        }),
      )
    }
  }

  return response
}
