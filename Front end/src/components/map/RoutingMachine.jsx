import { useEffect, useMemo, useRef } from 'react'
import { LngLatBounds, Marker } from 'maplibre-gl'
import { useMapLibre } from './mapContext'
import { calculateDistanceKm } from '../../utils/distance'
import {
  buildConnectedRouteGeometry,
  buildCumulativePath,
  samplePointAndBearing,
  sliceCoordsAtProgress,
  sliceTwoPointSegment,
} from '../../utils/routeGeometry'

const ROUTE_SOURCE_ID = 'navigation-route'
const ROUTE_CASING_LAYER_ID = 'navigation-route-casing'
const ROUTE_LINE_LAYER_ID = 'navigation-route-line'

const CONNECTOR_SOURCE_ID = 'navigation-route-connector'
const CONNECTOR_CASING_LAYER_ID = 'navigation-route-connector-casing'
const CONNECTOR_LINE_LAYER_ID = 'navigation-route-connector-line'

const ROUTE_DRAW_DURATION_MS = 640
const TRAVELER_CYCLE_MS = 4600

function removeRouteLayers(map) {
  if (!map) return
  try {
    if (!map.getStyle()) return
    const layerIds = [
      CONNECTOR_LINE_LAYER_ID,
      CONNECTOR_CASING_LAYER_ID,
      ROUTE_LINE_LAYER_ID,
      ROUTE_CASING_LAYER_ID,
    ]
    const sourceIds = [CONNECTOR_SOURCE_ID, ROUTE_SOURCE_ID]
    layerIds.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id)
    })
    sourceIds.forEach((id) => {
      if (map.getSource(id)) map.removeSource(id)
    })
  } catch {
    // Abaikan bila map sudah unmount
  }
}

function buildLineFeatureCollection(lines) {
  const features = (lines || [])
    .filter((coords) => Array.isArray(coords) && coords.length >= 2)
    .map((coords) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {},
    }))
  return {
    type: 'FeatureCollection',
    features,
  }
}

function upsertGeoJsonSource(map, sourceId, featureCollection) {
  if (!map || !map.getStyle()) return
  const existingSource = map.getSource(sourceId)
  if (existingSource) {
    existingSource.setData(featureCollection)
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: featureCollection,
    })
  }
}

function ensureRouteLayers(map) {
  if (!map || !map.getStyle()) return

  const roadBeforeId = map.getLayer('building-3d')
    ? 'building-3d'
    : map.getLayer('road-label')
      ? 'road-label'
      : undefined
  const connectorBeforeId = map.getLayer('road-label')
    ? 'road-label'
    : map.getLayer('park-label')
      ? 'park-label'
      : undefined

  // 1. Satu garis rute utama berwarna biru navigasi solid (#2563EB) dengan casing biru gelap
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
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5.6, 16, 10.6],
          'line-opacity': 0.88,
        },
      },
      roadBeforeId,
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
          'line-color': '#2563eb',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.4, 16, 7],
          'line-opacity': 0.98,
        },
      },
      roadBeforeId,
    )
  }

  // 2. Last-mile dashed connector biru di ujung rute agar menyambung rapat tepat ke pusat ikon pin
  if (!map.getLayer(CONNECTOR_CASING_LAYER_ID)) {
    map.addLayer(
      {
        id: CONNECTOR_CASING_LAYER_ID,
        type: 'line',
        source: CONNECTOR_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4.4, 16, 7.8],
          'line-dasharray': [1.2, 1.9],
          'line-opacity': 0.84,
        },
      },
      connectorBeforeId,
    )
  }

  if (!map.getLayer(CONNECTOR_LINE_LAYER_ID)) {
    map.addLayer(
      {
        id: CONNECTOR_LINE_LAYER_ID,
        type: 'line',
        source: CONNECTOR_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.8, 16, 5.2],
          'line-dasharray': [1.2, 1.9],
          'line-opacity': 0.98,
        },
      },
      connectorBeforeId,
    )
  }
}

export default function RoutingMachine({
  userPosition,
  destination,
  isFallbackOrigin = false,
  onRouteFound,
}) {
  const { map, isStyleLoaded } = useMapLibre()
  const hasFittedBoundsRef = useRef(false)
  const hasAnimatedRouteRef = useRef(false)
  const prevDestRef = useRef(null)
  const onRouteFoundRef = useRef(onRouteFound)

  useEffect(() => {
    onRouteFoundRef.current = onRouteFound
  }, [onRouteFound])

  const exactUserLat =
    userPosition && Number.isFinite(Number(userPosition[0])) ? Number(userPosition[0]) : null
  const exactUserLng =
    userPosition && Number.isFinite(Number(userPosition[1])) ? Number(userPosition[1]) : null
  const userFetchKey =
    exactUserLat !== null && exactUserLng !== null
      ? `${exactUserLat.toFixed(4)},${exactUserLng.toFixed(4)}`
      : null

  const exactOriginRef = useRef(null)
  useEffect(() => {
    exactOriginRef.current =
      exactUserLat !== null && exactUserLng !== null ? [exactUserLng, exactUserLat] : null
  }, [exactUserLat, exactUserLng])

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
    if (!map || !isStyleLoaded || !userFetchKey || !destSignature) {
      return undefined
    }

    let isDisposed = false
    let timedOut = false
    let animFrameId = 0
    let travelerFrameId = 0
    let travelerMarker = null
    const controller = new AbortController()
    const currentDestPoints = destPointsRef.current
    const exactOriginLngLat = exactOriginRef.current
    if (!exactOriginLngLat) return undefined

    const useStopToStopOnly = isFallbackOrigin && currentDestPoints.length > 1
    const waypointsLngLat = useStopToStopOnly
      ? currentDestPoints.map(([lat, lng]) => [lng, lat])
      : [
          exactOriginLngLat,
          ...currentDestPoints.map(([lat, lng]) => [lng, lat]),
        ]

    const updateRouteSources = (roadCoords, connectorLines) => {
      if (isDisposed || !map || !map.getStyle()) return
      upsertGeoJsonSource(
        map,
        ROUTE_SOURCE_ID,
        buildLineFeatureCollection(roadCoords ? [roadCoords] : []),
      )
      upsertGeoJsonSource(
        map,
        CONNECTOR_SOURCE_ID,
        buildLineFeatureCollection(connectorLines),
      )
    }

    const drawPrimaryRoute = (geometry, totalMeters, totalSecs) => {
      if (isDisposed || !map || !map.getStyle()) return

      const rawCoords = Array.isArray(geometry?.coordinates) ? geometry.coordinates : []
      const connected = buildConnectedRouteGeometry(rawCoords, waypointsLngLat)
      const allConnectors = [
        connected.originConnector,
        ...connected.intermediateConnectors,
        connected.destConnector,
      ].filter(Boolean)

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      const shouldAnimateDraw =
        !hasAnimatedRouteRef.current &&
        !prefersReducedMotion &&
        connected.fullPathCoords.length >= 2

      cancelAnimationFrame(animFrameId)
      cancelAnimationFrame(travelerFrameId)
      if (travelerMarker) {
        travelerMarker.remove()
        travelerMarker = null
      }

      const roadPathData = buildCumulativePath(connected.roadCoords)
      const fullPathData = buildCumulativePath(connected.fullPathCoords)

      const startRouteTraveler = () => {
        if (isDisposed || !map || !map.getStyle() || fullPathData.coords.length < 2) return

        const el = document.createElement('div')
        el.className = 'nav-route-traveler'
        el.setAttribute('aria-hidden', 'true')
        el.innerHTML = `
          <div class="nav-route-traveler-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>
        `
        const badgeEl = el.querySelector('.nav-route-traveler-badge')
        const initialSample = samplePointAndBearing(fullPathData, prefersReducedMotion ? 0.5 : 0)
        if (!initialSample) return

        if (badgeEl) {
          badgeEl.style.transform = `rotate(${initialSample.bearingDeg.toFixed(1)}deg)`
        }

        travelerMarker = new Marker({
          element: el,
          anchor: 'center',
          subpixelPositioning: true,
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport',
        })
          .setLngLat(initialSample.lngLat)
          .addTo(map)

        if (prefersReducedMotion) return

        const loopStart = performance.now()
        const animateTraveler = (now) => {
          if (isDisposed || !map || !map.getStyle() || !travelerMarker) return
          const rawProgress = ((now - loopStart) % TRAVELER_CYCLE_MS) / TRAVELER_CYCLE_MS
          const easedProgress =
            rawProgress < 0.5
              ? 2 * rawProgress * rawProgress
              : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2
          const sample = samplePointAndBearing(fullPathData, easedProgress)
          if (sample) {
            travelerMarker.setLngLat(sample.lngLat)
            if (badgeEl) {
              const fade =
                rawProgress < 0.06
                  ? rawProgress / 0.06
                  : rawProgress > 0.94
                    ? (1 - rawProgress) / 0.06
                    : 1
              badgeEl.style.opacity = fade.toFixed(2)
              badgeEl.style.transform = `rotate(${sample.bearingDeg.toFixed(1)}deg)`
            }
          }
          travelerFrameId = requestAnimationFrame(animateTraveler)
        }
        travelerFrameId = requestAnimationFrame(animateTraveler)
      }

      if (shouldAnimateDraw) {
        hasAnimatedRouteRef.current = true
        const originLen = connected.originConnector
          ? buildCumulativePath(connected.originConnector).totalDist
          : 0
        const roadLen = roadPathData.totalDist
        const destLen = connected.destConnector
          ? buildCumulativePath(connected.destConnector).totalDist
          : 0
        const totalDrawLen = Math.max(originLen + roadLen + destLen, 1e-9)

        const renderProgress = (eased) => {
          const distCursor = totalDrawLen * eased
          const activeConnectors = []

          if (connected.originConnector) {
            const originProgress = originLen > 0 ? Math.min(1, distCursor / originLen) : 1
            const slicedOrigin = sliceTwoPointSegment(connected.originConnector, originProgress)
            if (slicedOrigin) activeConnectors.push(slicedOrigin)
          }

          let activeRoad = null
          if (distCursor > originLen || originLen === 0) {
            const roadProgress =
              roadLen > 0 ? Math.min(1, Math.max(0, (distCursor - originLen) / roadLen)) : 1
            activeRoad = sliceCoordsAtProgress(roadPathData, roadProgress)
          }

          if (eased >= 0.85 && connected.intermediateConnectors.length > 0) {
            activeConnectors.push(...connected.intermediateConnectors)
          }

          if (connected.destConnector && distCursor > originLen + roadLen) {
            const destProgress =
              destLen > 0
                ? Math.min(1, Math.max(0, (distCursor - originLen - roadLen) / destLen))
                : 1
            const slicedDest = sliceTwoPointSegment(connected.destConnector, destProgress)
            if (slicedDest) activeConnectors.push(slicedDest)
          }

          updateRouteSources(activeRoad, activeConnectors)
        }

        renderProgress(0.05)
        ensureRouteLayers(map)

        const startTime = performance.now()
        const step = (now) => {
          if (isDisposed || !map || !map.getStyle()) return
          const elapsed = now - startTime
          const t = Math.min(1, elapsed / ROUTE_DRAW_DURATION_MS)
          const eased = 1 - Math.pow(1 - t, 3)

          if (t < 1) {
            renderProgress(eased)
            animFrameId = requestAnimationFrame(step)
          } else {
            updateRouteSources(connected.roadCoords, allConnectors)
            animFrameId = 0
            startRouteTraveler()
          }
        }
        animFrameId = requestAnimationFrame(step)
      } else {
        updateRouteSources(connected.roadCoords, allConnectors)
        ensureRouteLayers(map)
        startRouteTraveler()
      }

      if (!hasFittedBoundsRef.current) {
        const bounds = new LngLatBounds()
        waypointsLngLat.forEach((coord) => bounds.extend(coord))
        connected.fullPathCoords.forEach((coord) => bounds.extend(coord))
        map.fitBounds(bounds, {
          padding: { top: 155, bottom: 160, left: 32, right: 64 },
          maxZoom: 15.5,
          pitch: map.getPitch(),
          duration: 850,
        })
        hasFittedBoundsRef.current = true
      }

      if (onRouteFoundRef.current) {
        const minutes = Math.max(1, Math.round(totalSecs / 60))
        const totalKm = Number(Math.max(0.1, totalMeters / 1000).toFixed(1))
        onRouteFoundRef.current({
          timeText: `${minutes} Menit`,
          distanceText: `${totalKm.toFixed(1)} KM`,
          totalMinutes: minutes,
          totalKm,
          isCustomRoute: currentDestPoints.length > 1,
          isFallbackOrigin,
        })
      }
    }

    const computeHaversineFallback = () => {
      let totalKm = 0
      for (let i = 0; i < waypointsLngLat.length - 1; i += 1) {
        const [lng1, lat1] = waypointsLngLat[i]
        const [lng2, lat2] = waypointsLngLat[i + 1]
        totalKm += (calculateDistanceKm(lat1, lng1, lat2, lng2) ?? 0) * 1.35
      }
      totalKm = Math.max(0.1, totalKm)
      const totalMeters = totalKm * 1000
      const totalSecs = Math.max(120, (totalKm / 25) * 3600)
      return { totalMeters, totalSecs }
    }

    const coordParam = waypointsLngLat.map(([lng, lat]) => `${lng},${lat}`).join(';')
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordParam}?overview=full&geometries=geojson&steps=false&alternatives=false`
    const fetchTimeoutId = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 3500)

    fetch(osrmUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        window.clearTimeout(fetchTimeoutId)
        if (isDisposed) return
        const route = data?.routes?.[0]
        if (!route?.geometry) throw new Error('Rute tidak ditemukan')
        drawPrimaryRoute(route.geometry, route.distance ?? 0, route.duration ?? 0)
      })
      .catch((err) => {
        window.clearTimeout(fetchTimeoutId)
        if (isDisposed || (err?.name === 'AbortError' && !timedOut)) return
        console.warn('OSRM routing fallback (Haversine):', err?.message || err)
        const { totalMeters, totalSecs } = computeHaversineFallback()
        drawPrimaryRoute(
          { type: 'LineString', coordinates: waypointsLngLat },
          totalMeters,
          totalSecs,
        )
      })

    return () => {
      isDisposed = true
      window.clearTimeout(fetchTimeoutId)
      cancelAnimationFrame(animFrameId)
      cancelAnimationFrame(travelerFrameId)
      if (travelerMarker) {
        travelerMarker.remove()
        travelerMarker = null
      }
      controller.abort()
      removeRouteLayers(map)
    }
  }, [map, isStyleLoaded, userFetchKey, destSignature, isFallbackOrigin])

  return null
}
