import { useEffect, useMemo, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

export default function RoutingMachine({ userPosition, destination, onRouteFound }) {
  const map = useMap()
  const routingControlRef = useRef(null)
  const hasFittedBoundsRef = useRef(false)
  const prevDestRef = useRef(null)
  const onRouteFoundRef = useRef(onRouteFound)

  // Jaga callback reference selalu mutakhir tanpa memicu re-render / re-run effect
  useEffect(() => {
    onRouteFoundRef.current = onRouteFound
  }, [onRouteFound])

  // 1. Ekstrak koordinat GPS User
  const userLat = userPosition ? Number(userPosition[0].toFixed(4)) : null
  const userLng = userPosition ? Number(userPosition[1].toFixed(4)) : null

  // 1. TERIMA ARRAY MULTI-WAYPOINTS: Normalisasi destination baik single titik maupun multi-titik (array)
  const destPoints = useMemo(() => {
    if (!destination) return []

    // Jika destination adalah array
    if (Array.isArray(destination)) {
      if (destination.length === 0) return []

      // Format: [[lat1, lng1], [lat2, lng2], ...]
      if (Array.isArray(destination[0])) {
        return destination.map(([lat, lng]) => [Number(lat), Number(lng)])
      }

      // Format: [place1, place2, ...] (objek tempat wisata dengan coordinates { lat, lng })
      if (destination[0]?.coordinates) {
        return destination.map((p) => [
          Number(p.coordinates.lat),
          Number(p.coordinates.lng),
        ])
      }

      // Format: [{ lat, lng }, ...]
      if (destination[0]?.lat !== undefined) {
        return destination.map((p) => [Number(p.lat), Number(p.lng)])
      }

      // Single coordinate pair [lat, lng]
      if (typeof destination[0] === 'number') {
        return [[Number(destination[0]), Number(destination[1])]]
      }
    }

    // Jika destination adalah single object dengan coordinates { lat, lng }
    if (destination?.coordinates) {
      return [[Number(destination.coordinates.lat), Number(destination.coordinates.lng)]]
    }

    // Jika destination adalah single object { lat, lng }
    if (destination?.lat !== undefined) {
      return [[Number(destination.lat), Number(destination.lng)]]
    }

    return []
  }, [destination])

  // Buat string signature stabil untuk membandingkan perubahan tujuan rute
  const destSignature = destPoints
    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join('|')

  const destPointsRef = useRef(destPoints)
  useEffect(() => {
    destPointsRef.current = destPoints
  }, [destPoints])

  // Reset flag auto-fitBounds HANYA jika susunan titik koordinat tujuan berubah
  useEffect(() => {
    if (destSignature && prevDestRef.current !== destSignature) {
      hasFittedBoundsRef.current = false
      prevDestRef.current = destSignature
    }
  }, [destSignature])

  useEffect(() => {
    if (!map || userLat === null || userLng === null || !destSignature) {
      return
    }

    let isDisposed = false
    const currentDestPoints = destPointsRef.current

    const setupRouting = async () => {
      // Pastikan window.L terdefinisi sebelum modul leaflet-routing-machine dievaluasi
      if (typeof window !== 'undefined') {
        window.L = L
      }

      // Load modul leaflet-routing-machine secara dinamis jika belum terpasang
      if (!L.Routing || !L.Routing.control) {
        try {
          await import('leaflet-routing-machine')
        } catch (importErr) {
          console.warn('Could not load leaflet-routing-machine:', importErr)
        }
      }

      if (isDisposed || !map || !L.Routing || !L.Routing.control) return

      // 1. CLEANUP EFFECT: Hapus instansiasi kontrol yang lama sebelum membuat rute baru
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current)
        } catch {
          // ignore
        }
        routingControlRef.current = null
      }

      try {
        // 2. SUSUN URUTAN TITIK JALAN (WAYPOINTS):
        // Titik 1: GPS User saat ini
        // Titik 2...N: Titik destinasi berurutan (contoh: Museum Zoologi -> Museum PETA)
        const waypoints = [
          L.latLng(userLat, userLng),
          ...currentDestPoints.map(([lat, lng]) => L.latLng(lat, lng)),
        ]

        const control = L.Routing.control({
          waypoints,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'car',
          }),
          // Styling garis rute biru tegas
          lineOptions: {
            styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }],
            extendToWaypoints: true,
            missingRouteTolerance: 0,
          },
          // Matikan interaksi edit waypoints di peta
          addWaypoints: false,
          draggableWaypoints: false,
          routeWhileDragging: false,
          fitSelectedRoutes: false, // Matikan auto-zoom bawaan
          show: false, // Sembunyikan panel teks instruksi bawaan
          collapsible: true,
          createMarker: () => null, // Hindari marker duplikat bawaan leaflet
        })

        control.on('routesfound', (e) => {
          if (isDisposed) return
          const routes = e.routes
          if (routes && routes.length > 0) {
            const route = routes[0]

            // 4. AUTO-FITBOUNDS UNTUK MULTI-TITIK:
            // Pastikan posisi User, Museum Zoologi, dan Museum PETA terlihat proporsional dalam 1 layar
            if (!hasFittedBoundsRef.current && map) {
              const allPoints = [
                L.latLng(userLat, userLng),
                ...currentDestPoints.map(([lat, lng]) => L.latLng(lat, lng)),
                ...(route.coordinates || []),
              ]
              const bounds = L.latLngBounds(allPoints)
              map.fitBounds(bounds, {
                paddingTopLeft: [75, 40],
                paddingBottomRight: [40, 160],
                maxZoom: 15,
                animate: true,
              })
              hasFittedBoundsRef.current = true
            }

            // 3. SESUAIKAN ESTIMASI TOTAL PADA PANEL METRICS
            if (onRouteFoundRef.current) {
              const totalSecs = route.summary?.totalTime ?? 0
              const totalMeters = route.summary?.totalDistance ?? 0
              const minutes = Math.max(1, Math.round(totalSecs / 60))
              const km = (totalMeters / 1000).toFixed(1)
              onRouteFoundRef.current({
                timeText: `${minutes} Menit`,
                distanceText: `${km} KM`,
                totalMinutes: minutes,
                totalKm: km,
                isCustomRoute: currentDestPoints.length > 1,
              })
            }
          }
        })

        control.on('routingerror', (err) => {
          if (isDisposed) return
          console.warn('Routing machine error:', err)
        })

        if (!isDisposed && map) {
          control.addTo(map)
          routingControlRef.current = control
        }
      } catch (err) {
        console.warn('Leaflet routing machine setup error:', err)
      }
    }

    setupRouting()

    // 1. CLEANUP EFFECT: Hapus instansiasi kontrol yang lama saat unmount / dependencies berubah
    return () => {
      isDisposed = true
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current)
        } catch {
          // ignore
        }
        routingControlRef.current = null
      }
    }
  }, [map, userLat, userLng, destSignature])

  return null
}
