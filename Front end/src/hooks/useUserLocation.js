import { useEffect, useState } from 'react'

export const DEFAULT_USER_POSITION = [-6.5895, 106.802] // Central Bogor (Sempur / Jl. Sudirman)

export function useUserLocation() {
  const [position, setPosition] = useState(DEFAULT_USER_POSITION)
  const [accuracy, setAccuracy] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    const handleSuccess = (pos) => {
      const { latitude, longitude, accuracy: acc } = pos.coords
      setPosition([latitude, longitude])
      setAccuracy(acc)
    }

    const handleError = (err) => {
      // Fallback kept to default central Bogor position
      console.warn('Geolocation info:', err.message)
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    })

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 30000,
    })

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return { position, accuracy }
}
