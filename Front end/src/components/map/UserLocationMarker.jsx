import { memo, useMemo } from 'react'
import L from 'leaflet'
import { Marker } from 'react-leaflet'

const USER_POSITION = [-6.5895, 106.802] // Central Bogor user position

function UserLocationMarker({ position = USER_POSITION }) {
  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: 'user-location-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        html: `
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            <div class="user-pulse-ring" style="position:absolute; width:44px; height:44px; border-radius:9999px; background:rgba(37,99,235,0.35);"></div>
            <div style="position:relative; width:16px; height:16px; border-radius:9999px; background:#1d4ed8; border:3px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
          </div>
        `,
      }),
    [],
  )

  return (
    <Marker
      position={position}
      icon={userIcon}
      interactive={false}
      alt="Posisi Kamu"
    />
  )
}

export default memo(UserLocationMarker)
