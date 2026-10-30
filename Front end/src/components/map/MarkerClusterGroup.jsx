import { useMemo, useState } from 'react'
import L from 'leaflet'
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import MapMarker from './MapMarker'

// Clustering aktif saat zoom <= 14; terurai otomatis saat zoom >= 15 (PLACE_ZOOM)
const CLUSTER_MAX_ZOOM = 14
const CLUSTER_RADIUS_PX = 62

const clusterIconCache = new Map()

function getClusterIcon(count) {
  if (clusterIconCache.has(count)) return clusterIconCache.get(count)

  const size = count >= 20 ? 48 : count >= 10 ? 44 : 40
  const icon = L.divIcon({
    className: 'wisata-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 9999px;
        background: rgba(31, 138, 91, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s ease;
      ">
        <div style="
          width: ${size - 8}px;
          height: ${size - 8}px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #2c3b26 0%, #1f8a5b 100%);
          border: 2px solid #ffffff;
          color: #ffffff;
          font-weight: 800;
          font-size: ${count >= 10 ? '13px' : '14px'};
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: -0.02em;
        ">
          ${count}
        </div>
      </div>
    `,
  })

  clusterIconCache.set(count, icon)
  return icon
}

export default function MarkerClusterGroup({
  places,
  selected,
  onSelect,
  registerMarker,
  isNavigationMode = false,
  activeDestination = null,
  clusteringEnabled = true,
}) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom())
    },
  })

  const isMultiDestination = Array.isArray(activeDestination)
  const selectedId = selected && !Array.isArray(selected) ? selected.id : null

  const { clusters, singles } = useMemo(() => {
    // Jika clustering dinonaktifkan atau zoom sudah cukup dekat (>= 15), tampilkan semua marker
    if (!clusteringEnabled || zoom > CLUSTER_MAX_ZOOM) {
      return { clusters: [], singles: places }
    }

    const unclustered = []
    const candidates = []

    for (const place of places) {
      if (!place?.coordinates) continue
      const isSelected = selectedId !== null && place.id === selectedId
      const isRoutePoint =
        isNavigationMode &&
        (isMultiDestination
          ? activeDestination.some((d) => d.id === place.id)
          : activeDestination?.id === place.id)

      if (isSelected || isRoutePoint) {
        unclustered.push(place)
      } else {
        candidates.push(place)
      }
    }

    // Greedy spatial clustering berbasis jarak piksel pada level zoom saat ini
    const visited = new Set()
    const clusterList = []

    for (let i = 0; i < candidates.length; i++) {
      const p1 = candidates[i]
      if (visited.has(p1.id)) continue

      const pt1 = map.project([p1.coordinates.lat, p1.coordinates.lng], zoom)
      const group = [p1]
      visited.add(p1.id)

      for (let j = i + 1; j < candidates.length; j++) {
        const p2 = candidates[j]
        if (visited.has(p2.id)) continue

        const pt2 = map.project([p2.coordinates.lat, p2.coordinates.lng], zoom)
        const distPx = pt1.distanceTo(pt2)

        if (distPx <= CLUSTER_RADIUS_PX) {
          group.push(p2)
          visited.add(p2.id)
        }
      }

      if (group.length === 1) {
        unclustered.push(p1)
      } else {
        const sumLat = group.reduce((acc, item) => acc + item.coordinates.lat, 0)
        const sumLng = group.reduce((acc, item) => acc + item.coordinates.lng, 0)
        clusterList.push({
          id: 'cluster-' + group.map((g) => g.id).join('-'),
          center: [sumLat / group.length, sumLng / group.length],
          items: group,
        })
      }
    }

    return { clusters: clusterList, singles: unclustered }
  }, [
    places,
    zoom,
    map,
    clusteringEnabled,
    selectedId,
    isNavigationMode,
    isMultiDestination,
    activeDestination,
  ])

  const handleClusterClick = (cluster) => {
    const bounds = L.latLngBounds(
      cluster.items.map((item) => [item.coordinates.lat, item.coordinates.lng]),
    )
    const nextZoom = Math.min(Math.max(map.getZoom() + 2, CLUSTER_MAX_ZOOM + 1), 17)
    map.flyToBounds(bounds, {
      padding: [70, 70],
      maxZoom: nextZoom,
      duration: 0.85,
    })
  }

  return (
    <>
      {/* Render Cluster Badges */}
      {clusters.map((cluster) => {
        const previewNames = cluster.items
          .slice(0, 3)
          .map((item) => item.name)
          .join(', ')
        const moreCount = cluster.items.length - 3

        return (
          <Marker
            key={cluster.id}
            position={cluster.center}
            icon={getClusterIcon(cluster.items.length)}
            eventHandlers={{
              click: () => handleClusterClick(cluster),
            }}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
              <div className="text-xs font-semibold text-forest-900">
                {cluster.items.length} Objek Wisata:{' '}
                <span className="font-normal">
                  {previewNames}
                  {moreCount > 0 ? ` +${moreCount} lainnya` : ''}
                </span>
              </div>
            </Tooltip>
          </Marker>
        )
      })}

      {/* Render Individual Tourist Markers */}
      {singles.map((place) => {
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
    </>
  )
}
