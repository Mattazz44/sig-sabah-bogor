import { memo, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer as LeafletMap, Marker, TileLayer, useMapEvents } from 'react-leaflet'

const DEFAULT_BOGOR_CENTER = [-6.5971, 106.806]

const adminPinIcon = L.divIcon({
  className: 'wisata-marker',
  iconSize: [32, 42],
  iconAnchor: [16, 41],
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 3px 6px rgb(0 0 0 / .45))">
    <path d="M16 41S3 26.5 3 16a13 13 0 1 1 26 0c0 10.5-13 25-13 25Z" fill="#8c785c" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="15" r="5" fill="#fff"/>
  </svg>`,
})

function MapClickHandler({ onPickCoordinate }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onPickCoordinate({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
      })
    },
  })
  return null
}

function AdminLocationPickerMap({ lat, lng, onPickCoordinate }) {
  const hasValidCoord =
    lat !== '' &&
    lng !== '' &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng))

  const markerPosition = useMemo(
    () => (hasValidCoord ? [Number(lat), Number(lng)] : DEFAULT_BOGOR_CENTER),
    [hasValidCoord, lat, lng],
  )

  return (
    <div className="relative h-[180px] w-full overflow-hidden rounded-xl border border-white/10 bg-[#253520] shadow-inner">
      <LeafletMap
        center={markerPosition}
        zoom={13}
        attributionControl={false}
        zoomControl={false}
        className="h-full w-full z-0 cursor-crosshair"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapClickHandler onPickCoordinate={onPickCoordinate} />
        {hasValidCoord && <Marker position={markerPosition} icon={adminPinIcon} />}
      </LeafletMap>

      {/* Subtle grid & label overlay matching schema mockup */}
      <div className="pointer-events-none absolute inset-0 z-[400] bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_32px]" />
      <span className="pointer-events-none absolute bottom-2 left-2.5 z-[400] rounded bg-[#2c3b26]/85 px-1.5 py-0.5 text-[10px] text-white/60 backdrop-blur-xs">
        Peta skema
      </span>
    </div>
  )
}

export default memo(AdminLocationPickerMap)

