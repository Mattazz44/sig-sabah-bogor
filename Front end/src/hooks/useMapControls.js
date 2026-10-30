import { useEffect, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import { ALL_CATEGORY } from '../components/ui/categories'

const FLY_ZOOM = 15

/**
 * Memoized category + name filter, sorted by rating ("Paling sering dikunjungi").
 */
export function useFilteredTourists(tourists, category, query) {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    return tourists
      .filter((t) => category === ALL_CATEGORY || t.category === category)
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => b.rating - a.rating)
  }, [tourists, category, query])
}

/**
 * Smoothly flies the map to the selected place and opens its popup once the move ends.
 * Must be called inside a react-leaflet <MapContainer>. Only re-runs when `selected` changes,
 * so it never causes re-center loops.
 */
export function useFlyToSelected(selected, markerRefs, getFocusOffset) {
  const map = useMap()

  useEffect(() => {
    if (!selected) {
      map.closePopup()
      return
    }

    const { lat, lng } = selected.coordinates
    const openPopup = () => markerRefs.current.get(selected.id)?.openPopup()

    // Shift the map center so the place appears in the area not covered by the bottom sheet.
    const zoom = Math.max(map.getZoom(), FLY_ZOOM)
    const [ox, oy] = getFocusOffset?.() ?? [0, 0]
    const center = map.unproject(map.project([lat, lng], zoom).add([ox, oy]), zoom)

    const alreadyThere = map.getCenter().distanceTo(center) < 5 && map.getZoom() === zoom
    if (alreadyThere) {
      openPopup()
      return
    }

    map.once('moveend', openPopup)
    map.flyTo(center, zoom, { duration: 1.2 })

    return () => {
      map.off('moveend', openPopup)
    }
  }, [map, selected, markerRefs, getFocusOffset])
}
