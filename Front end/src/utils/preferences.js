import { createContext, useContext } from 'react'
import {
  TRANSLATIONS,
  translateCategory,
  translateDuration,
  translateDynamicText,
  translateKey,
  translateOperationalHours,
  translateTicketPrice,
} from './i18n'

export {
  TRANSLATIONS,
  translateCategory,
  translateDuration,
  translateDynamicText,
  translateKey,
  translateOperationalHours,
  translateTicketPrice,
}

export const PREFERENCES_STORAGE_KEY = 'sabah_user_preferences_v1'

export const DEFAULT_PREFERENCES = {
  language: 'id',
  distanceUnit: 'km',
  routeNotifications: true,
}

export function loadStoredPreferences() {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES }
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES }
    return {
      language: parsed.language === 'en' ? 'en' : 'id',
      distanceUnit: parsed.distanceUnit === 'mi' ? 'mi' : 'km',
      routeNotifications:
        typeof parsed.routeNotifications === 'boolean' ? parsed.routeNotifications : true,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

/**
 * Mengonversi nilai jarak rute (misal "4.2 KM", "850 m", atau angka km) ke KM atau Miles.
 */
export function formatRouteDistance(rawDistance, unit = 'km') {
  if (rawDistance === null || rawDistance === undefined || rawDistance === '') {
    return unit === 'mi' ? '0 MI' : '0 KM'
  }

  let kmValue = null
  if (typeof rawDistance === 'number' && Number.isFinite(rawDistance)) {
    kmValue = Math.max(0, rawDistance)
  } else {
    const str = String(rawDistance).trim()
    const match = str.match(/([\d.,]+)\s*(km|m|mi|miles?)?/i)
    if (!match) return str
    const numeric = Number.parseFloat(match[1].replace(',', '.'))
    if (!Number.isFinite(numeric)) return str
    const rawUnit = (match[2] || 'km').toLowerCase()
    if (rawUnit === 'm') {
      kmValue = numeric / 1000
    } else if (rawUnit.startsWith('mi')) {
      kmValue = numeric / 0.621371
    } else {
      kmValue = numeric
    }
  }

  if (unit === 'mi') {
    const miles = kmValue * 0.621371
    if (miles === 0) return '0 MI'
    const formatted = miles < 10 ? miles.toFixed(1) : Math.round(miles).toString()
    return `${formatted} MI`
  }

  if (kmValue > 0 && kmValue < 1) {
    return `${Math.round(kmValue * 1000)} m`
  }
  if (kmValue === 0) return '0 KM'
  const formattedKm = kmValue < 100 ? kmValue.toFixed(1) : Math.round(kmValue).toString()
  return `${formattedKm.replace(/\.0$/, '')} KM`
}

export const PreferencesContext = createContext({
  ...DEFAULT_PREFERENCES,
  setLanguage: () => {},
  setDistanceUnit: () => {},
  setRouteNotifications: () => {},
  t: (key, params) => translateKey('id', key, params),
  formatDistanceUnit: (raw) => formatRouteDistance(raw, 'km'),
  tCategory: (cat) => translateCategory(cat, 'id'),
  tDynamic: (text) => translateDynamicText(text, 'id'),
  tDuration: (text) => translateDuration(text, 'id'),
  tTicket: (text) => translateTicketPrice(text, 'id'),
  tHours: (text) => translateOperationalHours(text, 'id'),
})

export function usePreferences() {
  return useContext(PreferencesContext)
}
