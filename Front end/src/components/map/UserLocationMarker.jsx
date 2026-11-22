import { memo, useEffect, useRef } from 'react'
import { Marker } from 'maplibre-gl'
import { useMapLibre } from './mapContext'

const USER_POSITION = [-6.5895, 106.802] // [lat, lng] Central Bogor

function UserLocationMarker({ position = USER_POSITION }) {
  const { map } = useMapLibre()
  const markerRef = useRef(null)

  const lat = Number(position?.[0])
  const lng = Number(position?.[1])
  const isValid = Number.isFinite(lat) && Number.isFinite(lng)

  useEffect(() => {
    if (!map || !isValid) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
      return
    }

    const el = document.createElement('div')
    el.className = 'user-location-marker'
    el.style.width = '44px'
    el.style.height = '44px'
    el.style.pointerEvents = 'none'
    el.setAttribute('aria-label', 'Posisi Kamu')
    el.innerHTML = `
      <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
        <div class="user-pulse-ring" style="position:absolute; width:44px; height:44px; border-radius:9999px; background:rgba(37,99,235,0.35);"></div>
        <div style="position:relative; width:16px; height:16px; border-radius:9999px; background:#1d4ed8; border:3px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
      </div>
    `

    markerRef.current = new Marker({
      element: el,
      anchor: 'center',
      subpixelPositioning: true,
      pitchAlignment: 'map',
      rotationAlignment: 'viewport',
    })
      .setLngLat([lng, lat])
      .addTo(map)
  }, [map, lng, lat, isValid])

  useEffect(() => {
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [map])

  return null
}

export default memo(UserLocationMarker)
