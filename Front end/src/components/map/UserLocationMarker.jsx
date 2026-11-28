import { memo, useEffect, useRef } from 'react'
import { Marker } from 'maplibre-gl'
import { useMapLibre } from './mapContext'
import { usePreferences } from '../../utils/preferences'

const USER_POSITION = [-6.5895, 106.802] // [lat, lng] Central Bogor

function UserLocationMarker({ position = USER_POSITION }) {
  const { t } = usePreferences()
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
      markerRef.current.getElement()?.setAttribute('aria-label', t('map.yourLocationAria'))
      return
    }

    const el = document.createElement('div')
    el.className = 'user-location-marker'
    el.style.width = '56px'
    el.style.height = '56px'
    el.style.pointerEvents = 'none'
    el.setAttribute('aria-label', t('map.yourLocationAria'))
    el.innerHTML = `
      <div style="position:relative; width:56px; height:56px; display:flex; align-items:center; justify-content:center;">
        <span aria-hidden="true" class="user-pulse-ring"></span>
        <span aria-hidden="true" class="user-pulse-ring user-pulse-ring-secondary"></span>
        <span aria-hidden="true" class="user-pulse-ring user-pulse-ring-tertiary"></span>
        <span aria-hidden="true" class="user-location-core"></span>
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
  }, [map, lng, lat, isValid, t])

  useEffect(() => {
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [map])

  return null
}

export default memo(UserLocationMarker)
