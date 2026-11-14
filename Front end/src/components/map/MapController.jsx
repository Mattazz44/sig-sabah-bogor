import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { useFlyToSelected } from '../../hooks/useMapControls'

/** Renders nothing; syncs the selected place and resizes the Leaflet map when its container changes. */
export default function MapController({ selected, markerRefs, getFocusOffset }) {
  const map = useMap()

  useFlyToSelected(selected, markerRefs, getFocusOffset)

  useEffect(() => {
    const container = map.getContainer()
    if (!container || typeof ResizeObserver === 'undefined') return undefined

    let frameId = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false })
      })
    })

    observer.observe(container)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [map])

  return null
}
