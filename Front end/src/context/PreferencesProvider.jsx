import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  PREFERENCES_STORAGE_KEY,
  PreferencesContext,
  formatRouteDistance,
  loadStoredPreferences,
  translateCategory,
  translateDuration,
  translateDynamicText,
  translateKey,
  translateOperationalHours,
  translateTicketPrice,
} from '../utils/preferences'

export default function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => loadStoredPreferences())

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Abaikan kegagalan storage pada mode privat
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = preferences.language === 'en' ? 'en' : 'id'
      document.title = translateKey(preferences.language, 'app.pageTitle')
    }
  }, [preferences])

  const setLanguage = useCallback((nextLang) => {
    const safeLang = nextLang === 'en' ? 'en' : 'id'
    setPreferences((prev) => (prev.language === safeLang ? prev : { ...prev, language: safeLang }))
  }, [])

  const setDistanceUnit = useCallback((nextUnit) => {
    const safeUnit = nextUnit === 'mi' ? 'mi' : 'km'
    setPreferences((prev) =>
      prev.distanceUnit === safeUnit ? prev : { ...prev, distanceUnit: safeUnit },
    )
  }, [])

  const setRouteNotifications = useCallback((enabled) => {
    const nextVal = Boolean(enabled)
    setPreferences((prev) =>
      prev.routeNotifications === nextVal ? prev : { ...prev, routeNotifications: nextVal },
    )
  }, [])

  const t = useCallback(
    (key, params) => translateKey(preferences.language, key, params),
    [preferences.language],
  )

  const formatDistanceUnit = useCallback(
    (rawDistance) => formatRouteDistance(rawDistance, preferences.distanceUnit),
    [preferences.distanceUnit],
  )

  const tCategory = useCallback(
    (category) => translateCategory(category, preferences.language),
    [preferences.language],
  )

  const tDynamic = useCallback(
    (text) => translateDynamicText(text, preferences.language),
    [preferences.language],
  )

  const tDuration = useCallback(
    (text) => translateDuration(text, preferences.language),
    [preferences.language],
  )

  const tTicket = useCallback(
    (text) => translateTicketPrice(text, preferences.language),
    [preferences.language],
  )

  const tHours = useCallback(
    (text) => translateOperationalHours(text, preferences.language),
    [preferences.language],
  )

  const value = useMemo(
    () => ({
      language: preferences.language,
      distanceUnit: preferences.distanceUnit,
      routeNotifications: preferences.routeNotifications,
      setLanguage,
      setDistanceUnit,
      setRouteNotifications,
      t,
      formatDistanceUnit,
      tCategory,
      tDynamic,
      tDuration,
      tTicket,
      tHours,
    }),
    [
      preferences,
      setLanguage,
      setDistanceUnit,
      setRouteNotifications,
      t,
      formatDistanceUnit,
      tCategory,
      tDynamic,
      tDuration,
      tTicket,
      tHours,
    ],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
