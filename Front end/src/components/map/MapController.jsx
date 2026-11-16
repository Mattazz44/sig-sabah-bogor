import { useEffect } from 'react'
import { useMapLibre } from './mapContext'
import { useFlyToSelected } from '../../hooks/useMapControls'

/** Renders nothing; syncs the selected place and resizes the MapLibre map when its container changes. */
export default function MapController({ selected, markerRefs, getFocusOffset }) {
  const { map } = useMapLibre()

  useFlyToSelected(selected, markerRefs, getFocusOffset)

  useEffect(() => {
    if (!map) return undefined
    const container = map.getContainer()
    if (!container || typeof ResizeObserver === 'undefined') return undefined

    let frameId = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        map.resize()
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
