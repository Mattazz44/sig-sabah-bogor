import { memo, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Marker, Popup } from 'maplibre-gl'
import MapPopup from './MapPopup'
import { CATEGORY_COLORS, CATEGORY_GLYPHS, CATEGORY_RGB } from '../ui/categories'
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
  onMarkerHover,
  registerMarker,
  isSelected = false,
  selectionStamp = 0,
  autoOpenPopup = false,
  isTransit = false,
  userPosition = null,
  locationStatus = 'idle',
}) {
  const { map } = useMapLibre()
  const onSelectRef = useRef(onSelect)
  const onMarkerHoverRef = useRef(onMarkerHover)
  const placeRef = useRef(place)
  const markerRef = useRef(null)
  const markerElRef = useRef(null)
  const popupRef = useRef(null)
  const popTimerRef = useRef(0)
  const lastClickedStampRef = useRef(0)
  const prevSelectionKeyRef = useRef(null)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    onMarkerHoverRef.current = onMarkerHover
  }, [onMarkerHover])

  useEffect(() => {
    placeRef.current = place
  }, [place])

  const triggerPop = () => {
    const el = markerElRef.current
    if (!el) return
    window.clearTimeout(popTimerRef.current)
    el.classList.remove('wisata-marker-popping')
    // Force reflow agar animasi pop-bounce dapat diputar ulang saat klik berturut-turut
    void el.offsetWidth
    el.classList.add('wisata-marker-popping')
    popTimerRef.current = window.setTimeout(() => {
      el.classList.remove('wisata-marker-popping')
    }, 460)
  }

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
    el.style.margin = '0'
    el.style.padding = '0'
    el.style.border = '0'
    el.style.background = 'transparent'
    el.style.cursor = 'pointer'
    el.style.setProperty('--pin-color', CATEGORY_COLORS[placeCategory] ?? '#dfaa63')
    el.style.setProperty('--pin-rgb', CATEGORY_RGB[placeCategory] ?? '223, 170, 99')
    el.setAttribute('title', placeName)
    el.setAttribute('aria-label', placeName)
    el.setAttribute('aria-pressed', 'false')
    el.innerHTML = `<span aria-hidden="true" class="wisata-marker-sonar"></span><span aria-hidden="true" class="wisata-marker-sonar wisata-marker-sonar-secondary"></span><span class="wisata-marker-body">${getCategorySvgHtml(placeCategory)}</span>`

    const popup = new Popup({
      className: 'wisata-popup',
      closeButton: false,
      maxWidth: '264px',
      offset: {
        top: [0, 10],
        'top-left': [0, 10],
        'top-right': [0, 10],
        bottom: [0, -44],
        'bottom-left': [0, -44],
        'bottom-right': [0, -44],
        left: [18, -22],
        right: [-18, -22],
      },
    })
      .setLngLat([lng, lat])
      .setDOMContent(popupContainer)

    const marker = new Marker({
      element: el,
      anchor: 'bottom',
      subpixelPositioning: true,
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
    })
      .setLngLat([lng, lat])
      .addTo(map)

    const openManagedPopup = () => {
      try {
        if (!popup.isOpen()) {
          popup.setLngLat([lng, lat]).addTo(map)
        }
      } catch {
        // ignore if map unmounted
      }
    }

    const closeManagedPopup = () => {
      try {
        if (popup.isOpen()) {
          popup.remove()
        }
      } catch {
        // ignore if map unmounted
      }
    }

    const handleClick = (e) => {
      e.stopPropagation()
      lastClickedStampRef.current = performance.now()
      markerElRef.current = el
      triggerPop()
      openManagedPopup()
      onSelectRef.current?.(placeRef.current)
    }

    const handleMouseEnter = () => {
      onMarkerHoverRef.current?.(placeId)
    }

    const handleMouseLeave = () => {
      onMarkerHoverRef.current?.(null)
    }

    el.addEventListener('click', handleClick)
    el.addEventListener('mouseenter', handleMouseEnter)
    el.addEventListener('mouseleave', handleMouseLeave)

    const markerHandle = {
      getElement: () => el,
      openPopup: openManagedPopup,
      closePopup: closeManagedPopup,
      setZIndexOffset: (offset) => {
        el.style.zIndex = offset > 0 ? String(offset) : ''
      },
    }

    markerElRef.current = el
    markerRef.current = marker
    popupRef.current = popup
    registerMarker?.(placeId, markerHandle)

    return () => {
      window.clearTimeout(popTimerRef.current)
      el.removeEventListener('click', handleClick)
      el.removeEventListener('mouseenter', handleMouseEnter)
      el.removeEventListener('mouseleave', handleMouseLeave)
      registerMarker?.(placeId, null)
      popup.remove()
      marker.remove()
      markerElRef.current = null
      markerRef.current = null
      popupRef.current = null
    }
  }, [map, placeId, placeSlug, placeName, placeCategory, lng, lat, isValidCoord, registerMarker, popupContainer])

  // Sinkronkan status active marker, gelombang pulse kategori, pop singkat, dan popup
  useEffect(() => {
    const el = markerElRef.current
    if (el) {
      el.classList.toggle('wisata-marker-active', Boolean(isSelected))
      el.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
    }

    if (isSelected) {
      const nextKey = `${placeId}:${selectionStamp}`
      const recentlyClickedDirectly = performance.now() - lastClickedStampRef.current < 150
      if (prevSelectionKeyRef.current !== nextKey && !recentlyClickedDirectly) {
        triggerPop()
      }
      prevSelectionKeyRef.current = nextKey
    } else {
      prevSelectionKeyRef.current = null
    }

    if (!isSelected && !autoOpenPopup) return undefined
    const delayMs = autoOpenPopup ? 350 : 20
    const timer = setTimeout(() => {
      try {
        if (map && popupRef.current && !popupRef.current.isOpen()) {
          popupRef.current.setLngLat([lng, lat]).addTo(map)
        }
      } catch {
        // ignore
      }
    }, delayMs)
    return () => clearTimeout(timer)
  }, [isSelected, selectionStamp, autoOpenPopup, map, placeId, lng, lat])

  if (!place || !isValidCoord) return null

  return createPortal(
    <MapPopup
      place={place}
      onOpenDetail={onOpenDetail}
      onSelect={onSelect}
      isTransit={isTransit}
      userPosition={userPosition}
      locationStatus={locationStatus}
    />,
    popupContainer,
  )
}

export default memo(MapMarker)
