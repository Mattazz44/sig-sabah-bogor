import { useEffect, useMemo } from 'react'
import { useMapLibre } from '../components/map/mapContext'
import { ALL_CATEGORY } from '../components/ui/categories'
import { calculateDistanceKm } from '../utils/distance'

const FLY_ZOOM = 15.5

/**
 * Memoized category + name + optional radiusKm filter, sorted by rating ("Paling sering dikunjungi").
 */
export function useFilteredTourists(tourists, category, query, radiusKm = 0) {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    return tourists
      .filter((t) => category === ALL_CATEGORY || t.category === category)
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .filter((t) => {
        if (!radiusKm || radiusKm <= 0) return true
        if (typeof t.distanceKm !== 'number') return true
        return t.distanceKm <= radiusKm
      })
      .sort((a, b) => b.rating - a.rating)
  }, [tourists, category, query, radiusKm])
}

/**
 * Smoothly flies the MapLibre map to the selected place and opens its popup once the move ends.
 * Must be called inside MapLibreContext. Only re-runs when `selected` changes.
 */
export function useFlyToSelected(selected, markerRefs, getFocusOffset) {
  const { map } = useMapLibre()

  useEffect(() => {
    if (!map) return undefined

    if (!selected || Array.isArray(selected) || !selected.coordinates) {
      markerRefs.current?.forEach((handle) => handle?.closePopup?.())
      return undefined
    }

    const lat = Number(selected.coordinates.lat)
    const lng = Number(selected.coordinates.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined

    // Tutup popup lain agar hanya popup tempat yang aktif yang terbuka
    markerRefs.current?.forEach((handle, id) => {
      if (id !== selected.id) {
        handle?.closePopup?.()
      }
    })

    const openPopup = () => {
      const handle = markerRefs.current?.get(selected.id)
      if (handle?.openPopup) {
        handle.openPopup()
      } else {
        setTimeout(() => {
          markerRefs.current?.get(selected.id)?.openPopup?.()
        }, 150)
      }
    }

    const zoom = Math.max(map.getZoom(), FLY_ZOOM)
    const [ox, oy] = getFocusOffset?.() ?? [0, 0]
    const currentCenter = map.getCenter()
    const distKm = calculateDistanceKm(currentCenter.lat, currentCenter.lng, lat, lng) ?? 1

    const alreadyThere = distKm < 0.005 && Math.abs(map.getZoom() - zoom) < 0.1 && ox === 0 && oy === 0
    if (alreadyThere) {
      openPopup()
      return undefined
    }

    map.once('moveend', openPopup)
    map.flyTo({
      center: [lng, lat],
      zoom,
      offset: [-ox, -oy],
      duration: 1000,
    })

    return () => {
      map.off('moveend', openPopup)
    }
  }, [map, selected, markerRefs, getFocusOffset])
}
