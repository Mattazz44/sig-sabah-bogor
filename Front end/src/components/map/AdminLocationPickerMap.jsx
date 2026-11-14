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
    <div className="relative h-[180px] w-full overflow-hidden rounded-xl border border-[#EBF0EB]/16 bg-[#233020] shadow-inner">
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
        <MapClickHandler onPickCoordinate={onPickCoordinate} />
        {hasValidCoord && <Marker position={markerPosition} icon={adminPinIcon} />}
      </LeafletMap>
    </div>
  )
}

export default memo(AdminLocationPickerMap)

