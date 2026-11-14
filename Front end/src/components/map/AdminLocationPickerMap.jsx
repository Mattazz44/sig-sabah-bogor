import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import {
  MapContainer as LeafletMap,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

const DEFAULT_BOGOR_CENTER = [-6.5971, 106.806]

const adminPinIcon = L.divIcon({
  className: 'wisata-marker',
  iconSize: [32, 42],
  iconAnchor: [16, 41],
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 4px 8px rgb(0 0 0 / .48))">
    <path d="M16 41S3 26.5 3 16a13 13 0 1 1 26 0c0 10.5-13 25-13 25Z" fill="#1F8A5B" stroke="#EBF0EB" stroke-width="2.2"/>
    <circle cx="16" cy="15" r="5" fill="#E2D7B5"/>
  </svg>`,
})

function MapClickHandler({ onPickFromMap }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onPickFromMap({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      })
    },
  })
  return null
}

function MapSyncAndControls({ hasValidCoord, markerPosition, skipNextPanRef, onResetCenter }) {
  const map = useMap()

  useEffect(() => {
    if (!hasValidCoord) return
    if (skipNextPanRef.current) {
      skipNextPanRef.current = false
      return
    }
    const center = map.getCenter()
    const latDiff = Math.abs(center.lat - markerPosition[0])
    const lngDiff = Math.abs(center.lng - markerPosition[1])
    if (latDiff > 0.00005 || lngDiff > 0.00005) {
      map.panTo(markerPosition, { animate: true, duration: 0.35 })
    }
  }, [hasValidCoord, markerPosition, map, skipNextPanRef])

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-white/20 bg-[#141C14]/80 text-[#EBF0EB] shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          aria-label="Perbesar peta"
          title="Perbesar peta"
          className="flex h-9 w-9 items-center justify-center text-[16px] font-semibold transition-colors hover:bg-white/10 active:bg-white/15"
        >
          +
        </button>
        <div className="h-px w-full bg-white/15" />
        <button
          type="button"
          onClick={() => map.zoomOut()}
          aria-label="Perkecil peta"
          title="Perkecil peta"
          className="flex h-9 w-9 items-center justify-center text-[16px] font-semibold transition-colors hover:bg-white/10 active:bg-white/15"
        >
          -
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          map.setView(DEFAULT_BOGOR_CENTER, 13, { animate: true })
          onResetCenter({
            lat: DEFAULT_BOGOR_CENTER[0],
            lng: DEFAULT_BOGOR_CENTER[1],
          })
        }}
        title="Pusatkan ke Kota Bogor"
        aria-label="Pusatkan pin ke Kota Bogor"
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#141C14]/80 text-[#E2D7B5] shadow-md backdrop-blur-md transition-colors hover:bg-[#233020] active:scale-[0.96]"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
        </svg>
      </button>
    </div>
  )
}

function AdminLocationPickerMap({ lat, lng, onPickCoordinate }) {
  const skipNextPanRef = useRef(false)
  const numericLat = Number(lat)
  const numericLng = Number(lng)
  const hasValidCoord =
    lat !== '' &&
    lng !== '' &&
    Number.isFinite(numericLat) &&
    Number.isFinite(numericLng) &&
    numericLat >= -90 &&
    numericLat <= 90 &&
    numericLng >= -180 &&
    numericLng <= 180

  const markerPosition = useMemo(
    () => (hasValidCoord ? [numericLat, numericLng] : DEFAULT_BOGOR_CENTER),
    [hasValidCoord, numericLat, numericLng],
  )

  const handleMapInteract = useCallback(
    (coords) => {
      skipNextPanRef.current = true
      onPickCoordinate(coords)
    },
    [onPickCoordinate],
  )

  const markerEventHandlers = useMemo(
    () => ({
      dragend(e) {
        const { lat: nextLat, lng: nextLng } = e.target.getLatLng()
        handleMapInteract({
          lat: Number(nextLat.toFixed(6)),
          lng: Number(nextLng.toFixed(6)),
        })
      },
    }),
    [handleMapInteract],
  )

  return (
    <div className="relative h-[280px] sm:h-[320px] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#1B261B] shadow-inner">
      <LeafletMap
        center={markerPosition}
        zoom={13}
        attributionControl={false}
        zoomControl={false}
        className="z-0 h-full w-full cursor-crosshair"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapClickHandler onPickFromMap={handleMapInteract} />
        <MapSyncAndControls
          hasValidCoord={hasValidCoord}
          markerPosition={markerPosition}
          skipNextPanRef={skipNextPanRef}
          onResetCenter={onPickCoordinate}
        />
        {hasValidCoord && (
          <Marker
            position={markerPosition}
            icon={adminPinIcon}
            draggable
            eventHandlers={markerEventHandlers}
          />
        )}
      </LeafletMap>

      {/* Chip koordinat & panduan gestur */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-xl border border-white/15 bg-[#141C14]/80 px-2.5 py-1 text-[11px] font-medium text-[#C8D3C8] backdrop-blur-md">
          Klik peta atau geser pin untuk akurasi
        </span>
        <span className="rounded-xl border border-white/15 bg-[#141C14]/85 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-[#EBF0EB] backdrop-blur-md">
          {markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}
        </span>
      </div>
    </div>
  )
}

export default memo(AdminLocationPickerMap)
