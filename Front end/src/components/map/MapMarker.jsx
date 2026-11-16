import { memo, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Marker, Popup } from 'maplibre-gl'
import MapPopup from './MapPopup'
import { CATEGORY_COLORS, CATEGORY_GLYPHS } from '../ui/categories'
import { useMapLibre } from './mapContext'

const svgHtmlCache = new Map()

function getCategorySvgHtml(category) {
  if (svgHtmlCache.has(category)) return svgHtmlCache.get(category)
  const color = CATEGORY_COLORS[category] ?? 'var(--color-forest-900)'
  const glyph = CATEGORY_GLYPHS[category] ?? ''
  const html = `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgb(0 0 0 / .3))">
    <path d="M16 41S3 26.5 3 16a13 13 0 1 1 26 0c0 10.5-13 25-13 25Z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <g transform="translate(8 8) scale(.6667)">${glyph}</g>
  </svg>`
  svgHtmlCache.set(category, html)
  return html
}

function MapMarker({
  place,
  onSelect,
  onOpenDetail,
  registerMarker,
  autoOpenPopup = false,
  isTransit = false,
}) {
  const { map } = useMapLibre()
  const onSelectRef = useRef(onSelect)
  const markerRef = useRef(null)
  const popupRef = useRef(null)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  const popupContainer = useMemo(() => document.createElement('div'), [])

  const placeId = place?.id
  const placeSlug = place?.slug
  const placeName = place?.name ?? ''
  const placeCategory = place?.category
  const lat = Number(place?.coordinates?.lat)
  const lng = Number(place?.coordinates?.lng)
  const isValidCoord = Number.isFinite(lat) && Number.isFinite(lng)

  useEffect(() => {
    if (!map || placeId === undefined || placeId === null || !isValidCoord) return undefined

    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'wisata-marker'
    el.style.width = '32px'
    el.style.height = '42px'
    el.style.padding = '0'
    el.style.border = '0'
    el.style.background = 'transparent'
    el.style.cursor = 'pointer'
    el.setAttribute('title', placeName)
    el.setAttribute('aria-label', placeName)
    el.innerHTML = getCategorySvgHtml(placeCategory)

    const popup = new Popup({
      className: 'wisata-popup',
      closeButton: false,
      maxWidth: '220px',
      offset: [0, -38],
    }).setDOMContent(popupContainer)

    const marker = new Marker({
      element: el,
      anchor: 'bottom',
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
    })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map)

    const handleClick = (e) => {
      e.stopPropagation()
      if (!popup.isOpen()) {
        marker.togglePopup()
      }
      onSelectRef.current?.(place)
    }

    el.addEventListener('click', handleClick)

    const markerHandle = {
      getElement: () => el,
      openPopup: () => {
        if (!popup.isOpen()) marker.togglePopup()
      },
      closePopup: () => {
        if (popup.isOpen()) marker.togglePopup()
      },
      setZIndexOffset: (offset) => {
        el.style.zIndex = offset > 0 ? String(offset) : ''
      },
    }

    markerRef.current = marker
    popupRef.current = popup
    registerMarker?.(placeId, markerHandle)

    return () => {
      el.removeEventListener('click', handleClick)
      registerMarker?.(placeId, null)
      popup.remove()
      marker.remove()
      markerRef.current = null
      popupRef.current = null
    }
  }, [map, placeId, placeSlug, placeName, placeCategory, lng, lat, isValidCoord, registerMarker, popupContainer, place])

  // Otomatis buka popup saat mode navigasi transit multi-titik aktif
  useEffect(() => {
    if (!autoOpenPopup) return undefined
    const timer = setTimeout(() => {
      try {
        if (markerRef.current && popupRef.current && !popupRef.current.isOpen()) {
          markerRef.current.togglePopup()
        }
      } catch {
        // ignore
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [autoOpenPopup])

  if (!place || !isValidCoord) return null

  return createPortal(
    <MapPopup
      place={place}
      onOpenDetail={onOpenDetail}
      onSelect={onSelect}
      isTransit={isTransit}
    />,
    popupContainer,
  )
}

export default memo(MapMarker)
