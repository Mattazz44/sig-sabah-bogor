import { useCallback, useRef, useState } from 'react'
import { AttributionControl, MapContainer as LeafletMap, TileLayer } from 'react-leaflet'
import MapController from './MapController'
import UserLocationMarker from './UserLocationMarker'
import LocateControl from './LocateControl'
import RoutingMachine from './RoutingMachine'
import RouteMetrics from './RouteMetrics'
import BogorBoundaryLayer from './BogorBoundaryLayer'
import MarkerClusterGroup from './MarkerClusterGroup'
import { getMapFocusOffset } from '../ui/sheetMetrics'

const BOGOR_CENTER = [-6.598, 106.805]
const DEFAULT_ZOOM = 13
const PLACE_ZOOM = 15

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
}) {
  const markerRefs = useRef(new Map())
  const registerMarker = useCallback((id, instance) => {
    if (instance) markerRefs.current.set(id, instance)
    else markerRefs.current.delete(id)
  }, [])

  const [routeInfo, setRouteInfo] = useState(null)
  const [showBoundary, setShowBoundary] = useState(true)
  const [clusteringEnabled, setClusteringEnabled] = useState(true)

  const handleToggleBoundary = useCallback(() => {
    setShowBoundary((prev) => !prev)
  }, [])

  const handleToggleClustering = useCallback(() => {
    setClusteringEnabled((prev) => !prev)
  }, [])

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

  // Initial view is computed once
  const [initialView] = useState(() => {
    if (selected && !Array.isArray(selected) && selected.coordinates) {
      return { center: [selected.coordinates.lat, selected.coordinates.lng], zoom: PLACE_ZOOM }
    }
    return { center: BOGOR_CENTER, zoom: DEFAULT_ZOOM }
  })

  return (
    <section
      id="map-section"
      aria-label="Peta wisata Bogor"
      className="relative z-0 h-full w-full"
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

      <LeafletMap
        center={initialView.center}
        zoom={initialView.zoom}
        preferCanvas={true}
        updateWhenIdle={true}
        attributionControl={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <AttributionControl position="topright" prefix={false} />

        {/* Base map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          updateWhenIdle={true}
          keepBuffer={2}
        />

        {/* Layer Batas Administrasi Kota Bogor (WBS 1.2.7) */}
        <BogorBoundaryLayer visible={showBoundary} />

        {/* 2c. Custom GPS User Marker */}
        {userPosition && <UserLocationMarker position={userPosition} />}

        {/* Tourist spots markers dengan fitur Marker Clustering (WBS 1.4.1) */}
        <MarkerClusterGroup
          places={places}
          selected={selected}
          onSelect={onSelect}
          registerMarker={registerMarker}
          isNavigationMode={isNavigationMode}
          activeDestination={activeDestination}
          clusteringEnabled={clusteringEnabled}
        />

        {/* 1 & 2. Internal Routing Machine: Mendukung Single Titik maupun Multi-Waypoints */}
        {hasDestination && userPosition && (
          <RoutingMachine
            key={activeDestinationKey}
            userPosition={userPosition}
            destination={activeDestination}
            onRouteFound={handleRouteUpdate}
          />
        )}

        {/* Map Controller untuk pan/zoom ketika memilih destinasi tunggal dari sidebar */}
        {!isMultiDestination && (
          <MapController
            selected={selected}
            markerRefs={markerRefs}
            getFocusOffset={getMapFocusOffset}
          />
        )}

        {/* Tombol GPS & Toggle Layer Batas Wilayah + Marker Clustering */}
        <LocateControl
          userPosition={userPosition}
          status={locationStatus}
          onRequestLocation={onRequestLocation}
          showBoundary={showBoundary}
          onToggleBoundary={handleToggleBoundary}
          clusteringEnabled={clusteringEnabled}
          onToggleClustering={handleToggleClustering}
        />
      </LeafletMap>
    </section>
  )
}
