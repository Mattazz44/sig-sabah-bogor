import { useFlyToSelected } from '../../hooks/useMapControls'

/** Renders nothing; syncs the selected place with the Leaflet map. */
export default function MapController({ selected, markerRefs, getFocusOffset }) {
  useFlyToSelected(selected, markerRefs, getFocusOffset)
  return null
}
