import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { Marker } from 'react-leaflet'
import MapPopup from './MapPopup'
import { CATEGORY_COLORS, CATEGORY_GLYPHS } from '../ui/categories'

// Pin geometry: 32x42 box, tip of the teardrop at (16, 41).
const PIN_SIZE = [32, 42]
const PIN_ANCHOR = [16, 41]
const POPUP_ANCHOR = [0, -38]

const iconCache = new Map()

function getCategoryIcon(category) {
  if (iconCache.has(category)) return iconCache.get(category)
  const color = CATEGORY_COLORS[category] ?? 'var(--color-forest-900)'
  const glyph = CATEGORY_GLYPHS[category] ?? ''
  const icon = L.divIcon({
    className: 'wisata-marker',
    iconSize: PIN_SIZE,
    iconAnchor: PIN_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
    html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgb(0 0 0 / .3))">
      <path d="M16 41S3 26.5 3 16a13 13 0 1 1 26 0c0 10.5-13 25-13 25Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <g transform="translate(8 8) scale(.6667)">${glyph}</g>
    </svg>`,
  })
  iconCache.set(category, icon)
  return icon
}

function MapMarker({ place, onSelect, registerMarker, autoOpenPopup = false, isTransit = false }) {
  const markerRef = useRef(null)

  const setRef = useCallback(
    (instance) => {
      markerRef.current = instance
      registerMarker(place.id, instance)
    },
    [registerMarker, place.id],
  )

  // 1. POP-UP LOCATION PADA MULTI-ROUTE:
  // Otomatis buka Leaflet popup saat mode navigasi transit multi-titik aktif
  useEffect(() => {
    if (autoOpenPopup && markerRef.current) {
      const timer = setTimeout(() => {
        try {
          markerRef.current.openPopup()
        } catch {
          // ignore
        }
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [autoOpenPopup])

  const position = useMemo(
    () => [place.coordinates.lat, place.coordinates.lng],
    [place.coordinates.lat, place.coordinates.lng],
  )

  const eventHandlers = useMemo(
    () => ({ click: () => onSelect(place.slug) }),
    [onSelect, place.slug],
  )

  return (
    <Marker
      ref={setRef}
      position={position}
      icon={getCategoryIcon(place.category)}
      eventHandlers={eventHandlers}
      title={place.name}
      alt={place.name}
    >
      <MapPopup place={place} onSelect={onSelect} isTransit={isTransit} />
    </Marker>
  )
}

export default memo(MapMarker)
