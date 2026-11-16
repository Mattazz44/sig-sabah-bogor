import { useEffect, useMemo, useRef, useState } from 'react'
import { LngLatBounds, Marker } from 'maplibre-gl'
import MapMarker from './MapMarker'
import { useMapLibre } from './mapContext'

// Clustering aktif saat zoom <= 14; terurai otomatis saat zoom > 14 (default 15.5)
const CLUSTER_MAX_ZOOM = 14
const CLUSTER_RADIUS_PX = 62
const MERCATOR_TILE_SIZE = 512

function projectMercatorPx(lng, lat, zoom) {
  const scale = MERCATOR_TILE_SIZE * Math.pow(2, zoom)
  const x = ((lng + 180) / 360) * scale
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat))
  const sinLat = Math.sin((clampedLat * Math.PI) / 180)
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  return [x, y]
}

function ClusterBadgeMarker({ cluster, map, clusterRefs, onClusterClick }) {
  const onClickRef = useRef(onClusterClick)

  useEffect(() => {
    onClickRef.current = onClusterClick
  }, [onClusterClick])

  useEffect(() => {
    if (!map || !cluster) return undefined

    const count = cluster.items.length
    const size = count >= 20 ? 48 : count >= 10 ? 44 : 40
    const previewNames = cluster.items
      .slice(0, 3)
      .map((item) => item.name)
      .join(', ')
    const moreCount = count - 3
    const tooltipLabel = `${count} Objek Wisata: ${previewNames}${moreCount > 0 ? ` +${moreCount} lainnya` : ''}`

    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'wisata-cluster-marker'
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.padding = '0'
    el.style.border = '0'
    el.style.background = 'transparent'
    el.style.cursor = 'pointer'
    el.setAttribute('title', tooltipLabel)
    el.setAttribute('aria-label', tooltipLabel)
    el.innerHTML = `
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
    `

    const [lng, lat] = cluster.center
    const marker = new Marker({
      element: el,
      anchor: 'center',
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
    })
      .setLngLat([lng, lat])
      .addTo(map)

    const handleClick = (e) => {
      e.stopPropagation()
      onClickRef.current?.(cluster)
    }

    el.addEventListener('click', handleClick)

    const clusterMap = clusterRefs.current
    clusterMap.set(cluster.id, {
      marker: {
        getElement: () => el,
        setZIndexOffset: (offset) => {
          el.style.zIndex = offset > 0 ? String(offset) : ''
        },
      },
      itemIds: new Set(cluster.items.map((item) => item.id)),
    })

    return () => {
      el.removeEventListener('click', handleClick)
      clusterMap.delete(cluster.id)
      marker.remove()
    }
  }, [map, cluster, clusterRefs])

  return null
}

export default function MarkerClusterGroup({
  places,
  selected,
  onSelect,
  onOpenDetail,
  registerMarker,
  markerRefs = null,
  onRegisterHoverHandler = null,
  isNavigationMode = false,
  activeDestination = null,
  clusteringEnabled = true,
}) {
  const { map } = useMapLibre()
  const [zoom, setZoom] = useState(() => (map ? map.getZoom() : 15.5))
  const clusterRefs = useRef(new Map())

  useEffect(() => {
    if (!map) return undefined
    const rafId = requestAnimationFrame(() => {
      setZoom(map.getZoom())
    })
    const handleZoomEnd = () => {
      setZoom(map.getZoom())
    }
    map.on('zoomend', handleZoomEnd)
    return () => {
      cancelAnimationFrame(rafId)
      map.off('zoomend', handleZoomEnd)
    }
  }, [map])

  useEffect(() => {
    if (!onRegisterHoverHandler) return undefined
    let activeEl = null
    let activeMarker = null
    let activeClass = ''

    const clearActive = () => {
      if (activeEl && activeClass) {
        activeEl.classList.remove(activeClass)
      }
      if (activeMarker?.setZIndexOffset) {
        try {
          activeMarker.setZIndexOffset(0)
        } catch {
          // abaikan bila marker sudah unmount
        }
      }
      activeEl = null
      activeMarker = null
      activeClass = ''
    }

    const highlightPlace = (placeId) => {
      clearActive()
      if (placeId === null || placeId === undefined) return

      const directMarker = markerRefs?.current?.get(placeId)
      if (directMarker) {
        const el = directMarker.getElement?.()
        if (el) {
          el.classList.add('wisata-marker-hovered')
          directMarker.setZIndexOffset?.(900)
          activeEl = el
          activeMarker = directMarker
          activeClass = 'wisata-marker-hovered'
          return
        }
      }

      for (const entry of clusterRefs.current.values()) {
        if (entry.itemIds.has(placeId)) {
          const el = entry.marker?.getElement?.()
          if (el) {
            el.classList.add('wisata-cluster-hovered')
            entry.marker.setZIndexOffset?.(900)
            activeEl = el
            activeMarker = entry.marker
            activeClass = 'wisata-cluster-hovered'
            return
          }
        }
      }
    }

    onRegisterHoverHandler(highlightPlace)
    return () => {
      clearActive()
      onRegisterHoverHandler(null)
    }
  }, [onRegisterHoverHandler, markerRefs])

  const isMultiDestination = Array.isArray(activeDestination)
  const selectedId = selected && !Array.isArray(selected) ? selected.id : null

  const { clusters, singles } = useMemo(() => {
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

    const visited = new Set()
    const clusterList = []

    for (let i = 0; i < candidates.length; i++) {
      const p1 = candidates[i]
      if (visited.has(p1.id)) continue

      const [x1, y1] = projectMercatorPx(
        Number(p1.coordinates.lng),
        Number(p1.coordinates.lat),
        zoom,
      )
      const group = [p1]
      visited.add(p1.id)

      for (let j = i + 1; j < candidates.length; j++) {
        const p2 = candidates[j]
        if (visited.has(p2.id)) continue

        const [x2, y2] = projectMercatorPx(
          Number(p2.coordinates.lng),
          Number(p2.coordinates.lat),
          zoom,
        )
        const distPx = Math.hypot(x2 - x1, y2 - y1)

        if (distPx <= CLUSTER_RADIUS_PX) {
          group.push(p2)
          visited.add(p2.id)
        }
      }

      if (group.length === 1) {
        unclustered.push(p1)
      } else {
        const sumLat = group.reduce((acc, item) => acc + Number(item.coordinates.lat), 0)
        const sumLng = group.reduce((acc, item) => acc + Number(item.coordinates.lng), 0)
        clusterList.push({
          id: 'cluster-' + group.map((g) => g.id).join('-'),
          center: [sumLng / group.length, sumLat / group.length],
          items: group,
        })
      }
    }

    return { clusters: clusterList, singles: unclustered }
  }, [
    places,
    zoom,
    clusteringEnabled,
    selectedId,
    isNavigationMode,
    isMultiDestination,
    activeDestination,
  ])

  const handleClusterClick = (cluster) => {
    if (!map) return
    const bounds = new LngLatBounds()
    cluster.items.forEach((item) => {
      bounds.extend([Number(item.coordinates.lng), Number(item.coordinates.lat)])
    })
    const nextZoom = Math.min(Math.max(map.getZoom() + 2, CLUSTER_MAX_ZOOM + 1), 17)
    map.fitBounds(bounds, {
      padding: 70,
      maxZoom: nextZoom,
      pitch: map.getPitch(),
      duration: 850,
    })
  }

  return (
    <>
      {clusters.map((cluster) => (
        <ClusterBadgeMarker
          key={cluster.id}
          cluster={cluster}
          map={map}
          clusterRefs={clusterRefs}
          onClusterClick={handleClusterClick}
        />
      ))}

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
            onOpenDetail={onOpenDetail}
            registerMarker={registerMarker}
            autoOpenPopup={isTransit}
            isTransit={isTransit}
          />
        )
      })}
    </>
  )
}
