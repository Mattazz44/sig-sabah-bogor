import { useCallback, useRef, useState } from 'react'
import { AttributionControl, MapContainer as LeafletMap, TileLayer } from 'react-leaflet'
import MapMarker from './MapMarker'
import MapController from './MapController'
import UserLocationMarker from './UserLocationMarker'
import LocateControl from './LocateControl'
import RoutingMachine from './RoutingMachine'
import RouteMetrics from './RouteMetrics'
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
      className="fixed inset-0 z-0 h-screen w-full"
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
          className="fixed top-5 inset-x-4 max-w-sm mx-auto z-[1000] pointer-events-none"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-forest-900/95 backdrop-blur-md px-4 py-3 border border-white/20 shadow-2xl">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-amber-300"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[12px] font-medium text-white/90 leading-snug">
              Silakan pilih tempat wisata di menu Explore atau Rute Custom untuk memulai navigasi.
            </p>
          </div>
        </aside>
      )}

      {/* Tombol Melayang "Akhiri Perjalanan" di atas peta */}
      {isNavigationMode && hasDestination && (
        <div className="fixed bottom-[74px] inset-x-0 flex justify-center z-[1000] pointer-events-none">
          <button
            type="button"
            id="btn-akhiri-perjalanan"
            onClick={onStopNavigation}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_6px_24px_rgba(225,29,72,0.5)] transition border border-rose-400/30 cursor-pointer"
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Akhiri Perjalanan</span>
          </button>
        </div>
      )}

      <LeafletMap
        center={initialView.center}
        zoom={initialView.zoom}
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
        />

        {/* 2c. Custom GPS User Marker */}
        {userPosition && <UserLocationMarker position={userPosition} />}

        {/* Tourist spots markers (termasuk titik-titik rute custom) */}
        {places.map((place) => {
          const isTransit =
            isNavigationMode &&
            isMultiDestination &&
            activeDestination[0]?.id === place.id

          return (
            <MapMarker
              key={place.id}
              place={place}
              onSelect={onSelect}
              registerMarker={registerMarker}
              autoOpenPopup={isTransit}
              isTransit={isTransit}
            />
          )
        })}

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

        {/* Tombol GPS ala Google Maps: Tampilkan Lokasi Anda / Re-center */}
        <LocateControl
          userPosition={userPosition}
          status={locationStatus}
          onRequestLocation={onRequestLocation}
        />
      </LeafletMap>
    </section>
  )
}
