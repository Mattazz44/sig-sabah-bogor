import { useCallback, useEffect, useRef, useState } from 'react'

export const BOGOR_CENTER = [-6.598, 106.805] // Pusat Kota Bogor untuk default viewport peta

/**
 * Hook untuk mendapatkan dan memantau posisi GPS riil pengguna.
 * Nilai position awal adalah null (tidak menggunakan lokasi palsu).
 */
export function useUserLocation() {
  const [position, setPosition] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  const [errorMessage, setErrorMessage] = useState(null)
  const watchIdRef = useRef(null)

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable')
      setErrorMessage('Geolocation tidak didukung oleh browser Anda')
      return
    }

    setStatus('requesting')

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

    // Ambil lokasi sekali secara cepat
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    })

    // Bersihkan watcher sebelumnya jika ada
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    // Pantau pergerakan lokasi pengguna secara real-time
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

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

    // Ambil lokasi sekali secara cepat saat pertama kali dimount
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    })

    // Pantau pergerakan lokasi pengguna secara real-time
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    })

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    position,
    accuracy,
    status,
    errorMessage,
    requestLocation,
  }
}
