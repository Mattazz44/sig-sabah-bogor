import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AttributionControl, Map as MapLibreMap } from 'maplibre-gl'
import { MapLibreContext } from './mapContext'
import MapController from './MapController'
import UserLocationMarker from './UserLocationMarker'
import LocateControl from './LocateControl'
import RoutingMachine from './RoutingMachine'
import RouteMetrics from './RouteMetrics'
import BogorBoundaryLayer from './BogorBoundaryLayer'
import MarkerClusterGroup from './MarkerClusterGroup'
import { getMapFocusOffset } from '../ui/sheetMetrics'

const BOGOR_CENTER = [106.805, -6.598] // [lng, lat]
const DEFAULT_ZOOM = 15.5
const DEFAULT_PITCH = 55
const PLACE_ZOOM = 15.5

export default function MapView({
  places,
  selected,
  onSelect,
  userPosition,
  locationStatus,
  onRequestLocation,
  navigationTarget,
  onStopNavigation,
  isNavigationMode = false,
  onRegisterHoverHandler = null,
}) {
  const mapContainerRef = useRef(null)
  const [mapInstance, setMapInstance] = useState(null)
  const [isStyleLoaded, setIsStyleLoaded] = useState(false)
  const markerRefs = useRef(new Map())

  const registerMarker = useCallback((id, instance) => {
    if (instance) markerRefs.current.set(id, instance)
    else markerRefs.current.delete(id)
  }, [])

  const [routeInfo, setRouteInfo] = useState(null)
  const [showBoundary, setShowBoundary] = useState(true)
  const [clusteringEnabled, setClusteringEnabled] = useState(true)
  const [is3D, setIs3D] = useState(true)

  const handleToggleBoundary = useCallback(() => {
    setShowBoundary((prev) => !prev)
  }, [])

  const handleToggleClustering = useCallback(() => {
    setClusteringEnabled((prev) => !prev)
  }, [])

  const handleToggle3D = useCallback(() => {
    if (!mapInstance) return
    const nextIs3D = mapInstance.getPitch() < 20
    mapInstance.easeTo({
      pitch: nextIs3D ? DEFAULT_PITCH : 0,
      duration: 600,
    })
    setIs3D(nextIs3D)
  }, [mapInstance])

  // Target destinasi: objek tempat wisata tunggal ATAU array rute custom (multi-titik)
  const activeDestination = navigationTarget || (isNavigationMode ? selected : null)
  const isMultiDestination = Array.isArray(activeDestination)
  const hasDestination = isMultiDestination
    ? activeDestination.length > 0
    : Boolean(activeDestination?.coordinates)

  const activeDestinationKey = isMultiDestination
    ? 'multi-' + activeDestination.map((p) => p.id || p.slug).join('-')
    : activeDestination?.id || 'none'

  const handleRouteUpdate = useCallback(
    (info) => {
      setRouteInfo({ ...info, targetKey: activeDestinationKey })
    },
    [activeDestinationKey],
  )

  const [initialView] = useState(() => {
    if (selected && !Array.isArray(selected) && selected.coordinates) {
      return {
        center: [Number(selected.coordinates.lng), Number(selected.coordinates.lat)],
        zoom: PLACE_ZOOM,
        pitch: DEFAULT_PITCH,
      }
    }
    return { center: BOGOR_CENTER, zoom: DEFAULT_ZOOM, pitch: DEFAULT_PITCH }
  })

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return undefined

    const cappedPixelRatio =
      typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1

    const map = new MapLibreMap({
      container,
      style: '/style.json',
      center: initialView.center,
      zoom: initialView.zoom,
      pitch: initialView.pitch,
      bearing: 0,
      minZoom: 5,
      maxZoom: 19,
      maxPitch: 60,
      pixelRatio: cappedPixelRatio,
      fadeDuration: 150,
      attributionControl: false,
      canvasContextAttributes: {
        antialias: false,
        powerPreference: 'high-performance',
      },
    })

    map.addControl(new AttributionControl({ compact: true }), 'top-right')

    const handleStyleLoad = () => {
      setIsStyleLoaded(true)
    }

    const handlePitchEnd = () => {
      setIs3D(map.getPitch() >= 20)
    }

    map.on('style.load', handleStyleLoad)
    map.on('pitchend', handlePitchEnd)

    setMapInstance(map)
    if (map.isStyleLoaded()) {
      setIsStyleLoaded(true)
    }

    return () => {
      map.off('style.load', handleStyleLoad)
      map.off('pitchend', handlePitchEnd)
      setIsStyleLoaded(false)
      setMapInstance(null)
      map.remove()
    }
  }, [initialView])

  const contextValue = useMemo(
    () => ({ map: mapInstance, isStyleLoaded }),
    [mapInstance, isStyleLoaded],
  )

  return (
    <section
      id="map-section"
      aria-label="Peta wisata Bogor"
      className="relative z-0 h-full w-full bg-[#F5F5F7]"
    >
      {/* 3. PANEL METRICS MELAYANG (RouteMetrics.jsx) */}
      {isNavigationMode && hasDestination && (
        <RouteMetrics
          activeDestination={activeDestination}
          routeInfo={routeInfo}
          isNavigationMode={isNavigationMode}
        />
      )}

      {/* DEFAULT STATE HANDLER: Tampilan petunjuk jika Navigasi dibuka langsung tanpa destinasi */}
      {isNavigationMode && !hasDestination && (
        <aside
          aria-label="Petunjuk navigasi"
          className="pointer-events-none absolute top-4 inset-x-4 z-[900] mx-auto max-w-sm animate-tab-enter"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#EBF0EB]/15 bg-[#1F2C1C] px-4 py-3 shadow-xl">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-[#E2D7B5]"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[12px] font-medium leading-snug text-[#EBF0EB]">
              Pilih destinasi di menu Explore atau susun Rute Custom untuk mulai navigasi.
            </p>
          </div>
        </aside>
      )}

      {/* Tombol Melayang "Akhiri Perjalanan" di atas Floating Dock */}
      {isNavigationMode && hasDestination && (
        <div
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 94px)' }}
          className="pointer-events-none fixed inset-x-0 z-[1000] flex justify-center"
        >
          <button
            type="button"
            id="btn-akhiri-perjalanan"
            onClick={onStopNavigation}
            className="pointer-events-auto flex min-h-[44px] items-center gap-2 rounded-full border border-[#EBF0EB]/20 bg-[#253320] px-6 py-2.5 text-[13px] font-semibold text-[#EBF0EB] shadow-md transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Akhiri perjalanan</span>
          </button>
        </div>
      )}

      <div ref={mapContainerRef} className="h-full w-full" />

      <MapLibreContext.Provider value={contextValue}>
        {mapInstance && (
          <>
            <BogorBoundaryLayer visible={showBoundary} />

            {userPosition && <UserLocationMarker position={userPosition} />}

            <MarkerClusterGroup
              places={places}
              selected={selected}
              onSelect={onSelect}
              registerMarker={registerMarker}
              markerRefs={markerRefs}
              onRegisterHoverHandler={onRegisterHoverHandler}
              isNavigationMode={isNavigationMode}
              activeDestination={activeDestination}
              clusteringEnabled={clusteringEnabled}
            />

            {hasDestination && userPosition && (
              <RoutingMachine
                key={activeDestinationKey}
                userPosition={userPosition}
                destination={activeDestination}
                onRouteFound={handleRouteUpdate}
              />
            )}

            {!isMultiDestination && (
              <MapController
                selected={selected}
                markerRefs={markerRefs}
                getFocusOffset={getMapFocusOffset}
              />
            )}

            <LocateControl
              userPosition={userPosition}
              status={locationStatus}
              onRequestLocation={onRequestLocation}
              is3D={is3D}
              onToggle3D={handleToggle3D}
              showBoundary={showBoundary}
              onToggleBoundary={handleToggleBoundary}
              clusteringEnabled={clusteringEnabled}
              onToggleClustering={handleToggleClustering}
            />
          </>
        )}
      </MapLibreContext.Provider>
    </section>
  )
}
