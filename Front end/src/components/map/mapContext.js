import { createContext, useContext } from 'react'

export const MapLibreContext = createContext({
  map: null,
  isStyleLoaded: false,
})

export function useMapLibre() {
  return useContext(MapLibreContext)
}
