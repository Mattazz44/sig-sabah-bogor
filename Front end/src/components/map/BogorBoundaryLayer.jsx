import { useEffect, useState } from 'react'
import bogorBoundaryFallback from '../../data/bogor_boundary.json'
import { apiFetch } from '../../utils/api'
import { useMapLibre } from './mapContext'

const SOURCE_ID = 'bogor-boundary'
const FILL_LAYER_ID = 'bogor-boundary-fill'
const LINE_LAYER_ID = 'bogor-boundary-line'

export default function BogorBoundaryLayer({ visible = true }) {
  const { map, isStyleLoaded } = useMapLibre()
  const [boundaryData, setBoundaryData] = useState(bogorBoundaryFallback)

  useEffect(() => {
    let active = true
    apiFetch('/api/boundary')
      .then((res) => {
        if (!res.ok) throw new Error('Boundary API error')
        return res.json()
      })
      .then((data) => {
        if (active && data && data.type === 'FeatureCollection') {
          setBoundaryData(data)
        }
      })
      .catch(() => {
        // Gunakan fallback data lokal bogor_boundary.json
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!map || !isStyleLoaded || !boundaryData) return undefined

    const visibility = visible ? 'visible' : 'none'
    const beforeId = map.getLayer('building-3d') ? 'building-3d' : undefined

    const existingSource = map.getSource(SOURCE_ID)
    if (existingSource) {
      existingSource.setData(boundaryData)
    } else {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: boundaryData,
      })
    }

    if (!map.getLayer(FILL_LAYER_ID)) {
      map.addLayer(
        {
          id: FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          layout: {
            visibility,
          },
          paint: {
            'fill-antialias': false,
            'fill-color': '#1f8a5b',
            'fill-opacity': 0.06,
          },
        },
        beforeId,
      )
    } else {
      map.setLayoutProperty(FILL_LAYER_ID, 'visibility', visibility)
    }

    if (!map.getLayer(LINE_LAYER_ID)) {
      map.addLayer(
        {
          id: LINE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          layout: {
            visibility,
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#1f8a5b',
            'line-width': 2.2,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2],
          },
        },
        beforeId,
      )
    } else {
      map.setLayoutProperty(LINE_LAYER_ID, 'visibility', visibility)
    }
  }, [map, isStyleLoaded, boundaryData, visible])

  useEffect(() => {
    return () => {
      if (!map) return
      try {
        if (!map.getStyle()) return
        if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID)
        if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // Abaikan bila map sudah di-unmount
      }
    }
  }, [map])

  return null
}
