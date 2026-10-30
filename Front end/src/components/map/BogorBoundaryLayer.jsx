import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import bogorBoundaryFallback from '../../data/bogor_boundary.json'

const BOUNDARY_STYLE = {
  color: '#1f8a5b',
  weight: 2.5,
  opacity: 0.85,
  dashArray: '8, 6',
  fillColor: '#1f8a5b',
  fillOpacity: 0.06,
  interactive: false, // Pastikan tidak menutupi klik pada marker objek wisata (AC WBS 1.2.7)
}

export default function BogorBoundaryLayer({ visible = true }) {
  const [boundaryData, setBoundaryData] = useState(bogorBoundaryFallback)

  useEffect(() => {
    fetch('/api/boundary')
      .then((res) => {
        if (!res.ok) throw new Error('Boundary API error')
        return res.json()
      })
      .then((data) => {
        if (data && data.type === 'FeatureCollection') {
          setBoundaryData(data)
        }
      })
      .catch(() => {
        // Gunakan fallback data lokal bogor_boundary.json
      })
  }, [])

  if (!visible || !boundaryData) return null

  return (
    <GeoJSON
      key="kota-bogor-boundary"
      data={boundaryData}
      style={BOUNDARY_STYLE}
      interactive={false}
    />
  )
}
