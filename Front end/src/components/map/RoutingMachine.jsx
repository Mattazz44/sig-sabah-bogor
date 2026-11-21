import { useEffect, useMemo, useRef } from 'react'
import { LngLatBounds } from 'maplibre-gl'
import { useMapLibre } from './mapContext'
import { calculateDistanceKm } from '../../utils/distance'

const ROUTE_SOURCE_ID = 'navigation-route'
const ROUTE_CASING_LAYER_ID = 'navigation-route-casing'
const ROUTE_LINE_LAYER_ID = 'navigation-route-line'
const ROUTE_DRAW_DURATION_MS = 720

function removeRouteLayers(map) {
  if (!map) return
  try {
    if (!map.getStyle()) return
    if (map.getLayer(ROUTE_LINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_LAYER_ID)
    if (map.getLayer(ROUTE_CASING_LAYER_ID)) map.removeLayer(ROUTE_CASING_LAYER_ID)
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID)
  } catch {
    // Abaikan bila map sudah unmount
  }
}

/** Hitung jarak kumulatif tiap titik agar animasi garis meluncur konstan tanpa tersendat. */
function buildCumulativePath(coords) {
  if (!Array.isArray(coords) || coords.length === 0) {
    return { coords: [], cumDist: [], totalDist: 0 }
  }
  const cumDist = [0]
  let running = 0
  for (let i = 1; i < coords.length; i += 1) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const seg = Math.hypot(lng2 - lng1, lat2 - lat1)
    running += seg
    cumDist.push(running)
  }
  return { coords, cumDist, totalDist: running }
}

function sliceCoordsAtProgress(pathData, progress) {
  const { coords, cumDist, totalDist } = pathData
  if (coords.length <= 2 || totalDist <= 0 || progress >= 1) {
    return coords
  }
  if (progress <= 0) {
    return [coords[0], coords[0]]
  }

  const targetDist = totalDist * progress
  const sliced = [coords[0]]

  for (let i = 1; i < coords.length; i += 1) {
    if (cumDist[i] <= targetDist) {
      sliced.push(coords[i])
    } else {
      const prevDist = cumDist[i - 1]
      const segDist = cumDist[i] - prevDist
      const frac = segDist > 0 ? (targetDist - prevDist) / segDist : 0
      const [lng1, lat1] = coords[i - 1]
      const [lng2, lat2] = coords[i]
      sliced.push([lng1 + (lng2 - lng1) * frac, lat1 + (lat2 - lat1) * frac])
      break
    }
  }

  return sliced.length >= 2 ? sliced : [coords[0], coords[0]]
}

export default function RoutingMachine({ userPosition, destination, onRouteFound }) {
  const { map, isStyleLoaded } = useMapLibre()
  const hasFittedBoundsRef = useRef(false)
  const hasAnimatedRouteRef = useRef(false)
  const prevDestRef = useRef(null)
  const onRouteFoundRef = useRef(onRouteFound)

  useEffect(() => {
    onRouteFoundRef.current = onRouteFound
  }, [onRouteFound])

  const userLat = userPosition ? Number(userPosition[0].toFixed(4)) : null
  const userLng = userPosition ? Number(userPosition[1].toFixed(4)) : null

  const destPoints = useMemo(() => {
    if (!destination) return []

    if (Array.isArray(destination)) {
      if (destination.length === 0) return []
      if (Array.isArray(destination[0])) {
        return destination.map(([lat, lng]) => [Number(lat), Number(lng)])
      }
      if (destination[0]?.coordinates) {
        return destination.map((p) => [
          Number(p.coordinates.lat),
          Number(p.coordinates.lng),
        ])
      }
      if (destination[0]?.lat !== undefined) {
        return destination.map((p) => [Number(p.lat), Number(p.lng)])
      }
      if (typeof destination[0] === 'number') {
        return [[Number(destination[0]), Number(destination[1])]]
      }
    }

    if (destination?.coordinates) {
      return [[Number(destination.coordinates.lat), Number(destination.coordinates.lng)]]
    }

    if (destination?.lat !== undefined) {
      return [[Number(destination.lat), Number(destination.lng)]]
    }

    return []
  }, [destination])

  const destSignature = destPoints
    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join('|')

  const destPointsRef = useRef(destPoints)
  useEffect(() => {
    destPointsRef.current = destPoints
  }, [destPoints])

  useEffect(() => {
    if (destSignature && prevDestRef.current !== destSignature) {
      hasFittedBoundsRef.current = false
      hasAnimatedRouteRef.current = false
      prevDestRef.current = destSignature
    }
  }, [destSignature])

  useEffect(() => {
    if (!map || !isStyleLoaded || userLat === null || userLng === null || !destSignature) {
      return undefined
    }

    let isDisposed = false
    let animFrameId = 0
    const controller = new AbortController()
    const currentDestPoints = destPointsRef.current
    const waypointsLngLat = [
      [userLng, userLat],
      ...currentDestPoints.map(([lat, lng]) => [lng, lat]),
    ]

    const updateSourceCoords = (coords) => {
      if (isDisposed || !map || !map.getStyle()) return
      const featureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
            properties: {},
          },
        ],
      }

      const existingSource = map.getSource(ROUTE_SOURCE_ID)
      if (existingSource) {
        existingSource.setData(featureCollection)
      } else {
        map.addSource(ROUTE_SOURCE_ID, {
          type: 'geojson',
          data: featureCollection,
        })
      }
    }

    const ensureRouteLayers = () => {
      if (!map || !map.getStyle()) return
      const beforeId = map.getLayer('building-3d') ? 'building-3d' : undefined

      if (!map.getLayer(ROUTE_CASING_LAYER_ID)) {
        map.addLayer(
          {
            id: ROUTE_CASING_LAYER_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#1d4ed8',
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 10],
              'line-opacity': 0.85,
            },
          },
          beforeId,
        )
      }

      if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
        map.addLayer(
          {
            id: ROUTE_LINE_LAYER_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 6.5],
              'line-opacity': 0.95,
            },
          },
          beforeId,
        )
      }
    }

    const drawRouteGeoJson = (geometry, totalMeters, totalSecs) => {
      if (isDisposed || !map || !map.getStyle()) return

      const rawCoords = Array.isArray(geometry?.coordinates) ? geometry.coordinates : []
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      const shouldAnimateDraw =
        !hasAnimatedRouteRef.current && !prefersReducedMotion && rawCoords.length >= 2

      cancelAnimationFrame(animFrameId)

      if (shouldAnimateDraw) {
        hasAnimatedRouteRef.current = true
        const pathData = buildCumulativePath(rawCoords)
        updateSourceCoords(sliceCoordsAtProgress(pathData, 0.02))
        ensureRouteLayers()

        const startTime = performance.now()
        const step = (now) => {
          if (isDisposed || !map || !map.getStyle()) return
          const elapsed = now - startTime
          const t = Math.min(1, elapsed / ROUTE_DRAW_DURATION_MS)
          const eased = 1 - Math.pow(1 - t, 3)

          updateSourceCoords(sliceCoordsAtProgress(pathData, eased))
          if (t < 1) {
            animFrameId = requestAnimationFrame(step)
          } else {
            animFrameId = 0
          }
        }
        animFrameId = requestAnimationFrame(step)
      } else {
        updateSourceCoords(rawCoords)
        ensureRouteLayers()
      }

      if (!hasFittedBoundsRef.current) {
        const bounds = new LngLatBounds()
        waypointsLngLat.forEach((coord) => bounds.extend(coord))
        rawCoords.forEach((coord) => bounds.extend(coord))
        map.fitBounds(bounds, {
          padding: { top: 140, bottom: 160, left: 24, right: 24 },
          maxZoom: 15.5,
          pitch: map.getPitch(),
          duration: 850,
        })
        hasFittedBoundsRef.current = true
      }

      if (onRouteFoundRef.current) {
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

    const coordParam = waypointsLngLat.map(([lng, lat]) => `${lng},${lat}`).join(';')
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordParam}?overview=full&geometries=geojson`

    fetch(osrmUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (isDisposed) return
        const route = data?.routes?.[0]
        if (!route?.geometry) throw new Error('Rute tidak ditemukan')
        drawRouteGeoJson(route.geometry, route.distance ?? 0, route.duration ?? 0)
      })
      .catch((err) => {
        if (isDisposed || err?.name === 'AbortError') return
        console.warn('OSRM routing error, menggunakan garis estimasi:', err)
        let totalKm = 0
        for (let i = 0; i < waypointsLngLat.length - 1; i++) {
          const [lng1, lat1] = waypointsLngLat[i]
          const [lng2, lat2] = waypointsLngLat[i + 1]
          totalKm += (calculateDistanceKm(lat1, lng1, lat2, lng2) ?? 0) * 1.35
        }
        const totalMeters = totalKm * 1000
        const totalSecs = (totalKm / 25) * 3600
        drawRouteGeoJson(
          { type: 'LineString', coordinates: waypointsLngLat },
          totalMeters,
          totalSecs,
        )
      })

    return () => {
      isDisposed = true
      cancelAnimationFrame(animFrameId)
      controller.abort()
      removeRouteLayers(map)
    }
  }, [map, isStyleLoaded, userLat, userLng, destSignature])

  return null
}
