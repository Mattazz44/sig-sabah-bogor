import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export const BOGOR_CENTER = [-6.598, 106.805] // Pusat Kota Bogor untuk default viewport peta

/**
 * Hook untuk mendapatkan dan memantau posisi GPS riil pengguna.
 * Mendukung Android native via @capacitor/geolocation dan web browser via navigator.geolocation.
 */
export function useUserLocation() {
  const [position, setPosition] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  const [errorMessage, setErrorMessage] = useState(null)
  const watchIdRef = useRef(null)

  const requestLocation = useCallback(async () => {
    setStatus('requesting')

    // Jika berjalan di platform native Android Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        const check = await Geolocation.checkPermissions()
        if (check.location !== 'granted') {
          const req = await Geolocation.requestPermissions()
          if (req.location !== 'granted') {
            setStatus('denied')
            setErrorMessage('Izin akses lokasi perangkat ditolak.')
            return
          }
        }

        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        })
        setPosition([pos.coords.latitude, pos.coords.longitude])
        setAccuracy(pos.coords.accuracy)
        setStatus('granted')
        setErrorMessage(null)

        if (watchIdRef.current) {
          await Geolocation.clearWatch({ id: watchIdRef.current })
        }

        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true },
          (livePos) => {
            if (livePos?.coords) {
              setPosition([livePos.coords.latitude, livePos.coords.longitude])
              setAccuracy(livePos.coords.accuracy)
            }
          }
        )
        watchIdRef.current = watchId
        return
      } catch (err) {
        console.warn('Capacitor Geolocation error:', err)
        setStatus('unavailable')
        setErrorMessage('Gagal memperoleh koordinat GPS perangkat.')
        return
      }
    }

    // Fallback Web Browser biasa
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable')
      setErrorMessage('Geolocation tidak didukung oleh browser Anda')
      return
    }

    const handleSuccess = (pos) => {
      const { latitude, longitude, accuracy: acc } = pos.coords
      setPosition([latitude, longitude])
      setAccuracy(acc)
      setStatus('granted')
      setErrorMessage(null)
    }

    const handleError = (err) => {
      console.warn('Geolocation info:', err.message)
      if (err.code === 1) {
        setStatus('denied')
        setErrorMessage('Izin akses lokasi ditolak.')
      } else {
        setStatus('unavailable')
        setErrorMessage('Tidak dapat memperoleh lokasi perangkat.')
      }
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    })

    if (watchIdRef.current !== null && typeof watchIdRef.current === 'number') {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    })
  }, [])

  useEffect(() => {
    requestLocation()

    return () => {
      if (watchIdRef.current !== null) {
        if (Capacitor.isNativePlatform()) {
          Geolocation.clearWatch({ id: watchIdRef.current }).catch(() => {})
        } else if (navigator.geolocation && typeof watchIdRef.current === 'number') {
          navigator.geolocation.clearWatch(watchIdRef.current)
        }
      }
    }
  }, [requestLocation])

  return {
    position,
    accuracy,
    status,
    errorMessage,
    requestLocation,
  }
}
