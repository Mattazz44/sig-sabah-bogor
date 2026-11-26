import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SafeImage from '../ui/SafeImage'
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  getBogorFallbackGallery,
  getBogorFallbackPhoto,
} from '../../utils/imageHelper'
import {
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  MapPinIcon,
  ShareIcon,
  StarIcon,
  XIcon,
} from '../ui/VectorIcons'

function cleanDetailText(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  if (
    lower === 'kosong' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'tidak ada' ||
    lower === 'belum tersedia' ||
    /^[-\s–—.]+$/.test(trimmed)
  ) {
    return ''
  }
  return trimmed
}

function buildAutoDescription(place) {
  const name = place?.name || 'Destinasi ini'
  const category = (place?.category || '').toLowerCase()
  if (category.includes('alam')) {
    return `${name} merupakan destinasi wisata alam populer di kawasan Bogor dengan suasana sejuk dan lanskap asri yang menarik untuk dikunjungi bersama keluarga maupun teman.`
  }
  if (category.includes('kuliner')) {
    return `${name} adalah destinasi kuliner pilihan di kawasan Bogor yang menyajikan beragam hidangan menarik dengan suasana nyaman untuk bersantai bersama keluarga maupun teman.`
  }
  if (category.includes('edukasi') || category.includes('budaya')) {
    return `${name} merupakan wisata edukasi dan budaya unggulan di kawasan Bogor yang memadukan rekreasi serta wawasan menarik untuk dikunjungi bersama keluarga maupun teman.`
  }
  return 'Destinasi wisata dan pusat aktivitas populer di kawasan Bogor yang menarik untuk dikunjungi bersama keluarga maupun teman.'
}

function calcQuickDistanceKm(coordA, coordB) {
  if (
    typeof coordA?.lat !== 'number' ||
    typeof coordA?.lng !== 'number' ||
    typeof coordB?.lat !== 'number' ||
    typeof coordB?.lng !== 'number'
  ) {
    return Number.POSITIVE_INFINITY
  }
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(coordB.lat - coordA.lat)
  const dLng = toRad(coordB.lng - coordA.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coordA.lat)) *
      Math.cos(toRad(coordB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Konfigurasi transformasi fisik kartu polaroid (rest vs fan-out saat hover/fokus/sentuh)
const STACK_TRANSFORM_BY_INDEX = [
  {
    zIndex: 'z-30',
    rest: 'rotate-0 translate-x-0 translate-y-0 scale-100',
    fanned:
      'group-hover:-rotate-[1deg] group-hover:-translate-y-2 group-hover:scale-[1.02] group-focus-visible:-rotate-[1deg] group-focus-visible:-translate-y-2 group-focus-visible:scale-[1.02]',
    pressed: '-rotate-[1deg] -translate-y-2 scale-[1.02]',
  },
  {
    zIndex: 'z-20',
    rest: 'rotate-[3deg] translate-x-2.5 translate-y-1.5 scale-[0.97]',
    fanned:
      'group-hover:rotate-[9deg] group-hover:translate-x-5 sm:group-hover:translate-x-8 group-hover:translate-y-2.5 group-hover:scale-[0.985] group-focus-visible:rotate-[9deg] group-focus-visible:translate-x-5 sm:group-focus-visible:translate-x-8 group-focus-visible:translate-y-2.5',
    pressed: 'rotate-[9deg] translate-x-5 sm:translate-x-8 translate-y-2.5 scale-[0.985]',
  },
  {
    zIndex: 'z-10',
    rest: '-rotate-[4deg] -translate-x-2.5 translate-y-2 scale-[0.94]',
    fanned:
      'group-hover:-rotate-[10deg] group-hover:-translate-x-5 sm:group-hover:-translate-x-8 group-hover:translate-y-3 group-hover:scale-[0.97] group-focus-visible:-rotate-[10deg] group-focus-visible:-translate-x-5 sm:group-focus-visible:-translate-x-8 group-focus-visible:translate-y-3',
    pressed: '-rotate-[10deg] -translate-x-5 sm:-translate-x-8 translate-y-3 scale-[0.97]',
  },
]

const SWIPE_THRESHOLD_PX = 48
const SWIPE_VELOCITY_THRESHOLD = 0.35

function getFocusableElements(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

/**
 * Tumpukan kartu foto interaktif (Stacked Photo Deck) bergaya kartu foto fisik
 * dengan efek spring fan-out saat hover, fokus keyboard, maupun sentuhan layar.
 */
function PhotoStackDeck({ placeName, images, fallbackPhoto, onOpenLightbox }) {
  const [isPressed, setIsPressed] = useState(false)

  const displayImages = images && images.length > 0 ? images : [fallbackPhoto].filter(Boolean)

  if (displayImages.length === 0) {
    return null
  }

  const visibleStack = displayImages.slice(0, 3)

  return (
    <div className="mt-2">
      <button
        type="button"
        id="detail-photo-stack-btn"
        onClick={() => onOpenLightbox(0)}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        aria-label={`Buka galeri foto ${placeName}, ${displayImages.length} foto`}
        className="group relative block w-full rounded-2xl py-2.5 text-left transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EBF0EB]"
      >
        {/* Wadah tumpukan berasio 16:10 seragam agar foto landscape tidak gepeng atau terpotong sempit */}
        <div className="relative mx-auto aspect-[16/10] w-full max-w-[260px] min-[375px]:max-w-[296px] sm:max-w-[336px]">
          {[...visibleStack].reverse().map((imgUrl, revIdx) => {
            const stackIdx = visibleStack.length - 1 - revIdx
            const layer = STACK_TRANSFORM_BY_INDEX[stackIdx] || STACK_TRANSFORM_BY_INDEX[2]
            const activeTransform = isPressed ? layer.pressed : `${layer.rest} ${layer.fanned}`

            return (
              <div
                key={`${imgUrl}-${stackIdx}`}
                aria-hidden={stackIdx > 0}
                className={`absolute inset-0 rounded-2xl border border-[rgba(244,239,230,0.18)] bg-[#1C241C] p-1.5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)] will-change-transform transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transform-none motion-reduce:transition-none ${layer.zIndex} ${activeTransform}`}
              >
                <div className="relative aspect-[16/10] h-full w-full overflow-hidden rounded-xl bg-white/[0.04]">
                  <SafeImage
                    src={imgUrl}
                    fallback={fallbackPhoto}
                    alt={stackIdx === 0 ? `${placeName} foto galeri` : ''}
                    width={640}
                    height={400}
                    loading={stackIdx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full object-cover object-center"
                  />

                  {/* Badge penghitung foto di sudut kartu teratas */}
                  {stackIdx === 0 && (
                    <span className="pointer-events-none absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-[rgba(244,239,230,0.2)] bg-[#111711]/85 px-2.5 py-1 text-[11px] font-semibold not-italic tabular-nums text-[#F5F2EB] shadow-sm backdrop-blur-md">
                      <CameraIcon className="h-3.5 w-3.5 text-[#DFAA63]" />
                      <span>{displayImages.length} Foto</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-2.5 text-center text-[12px] font-medium text-white/60 transition-colors duration-150 group-hover:text-[#EBF0EB]">
          Ketuk foto untuk memperbesar di galeri penuh
        </p>
      </button>

      {/* Grid Preview Galeri 3 Foto Proporsional (aspect-[16/10] object-cover) */}
      {visibleStack.length > 1 && (
        <div className="mt-2.5 grid grid-cols-3 gap-2" role="group" aria-label={`Preview galeri ${placeName}`}>
          {visibleStack.map((imgUrl, idx) => (
            <button
              key={`${imgUrl}-preview-${idx}`}
              type="button"
              onClick={() => onOpenLightbox(idx)}
              aria-label={`Perbesar foto ${idx + 1} dari ${displayImages.length}`}
              className="group/thumb relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[rgba(244,239,230,0.16)] bg-white/[0.04] shadow-sm transition-all duration-150 hover:border-[#DFAA63]/55 active:scale-[0.97]"
            >
              <SafeImage
                src={imgUrl}
                fallback={fallbackPhoto}
                alt={`${placeName} preview ${idx + 1}`}
                width={320}
                height={200}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/thumb:scale-105"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Modal Lightbox fullscreen dengan backdrop Liquid Glass gelap, zoom-in halus,
 * gestur geser (swipe/drag), navigasi tombol panah/keyboard, dan fokus trap aksesibel.
 */
function PhotoLightboxModal({
  isOpen,
  images,
  fallbackPhoto,
  activeIndex,
  placeName,
  onClose,
  onChangeIndex,
}) {
  const modalRef = useRef(null)
  const closeBtnRef = useRef(null)
  const previousFocusRef = useRef(null)
  const dragStateRef = useRef(null)
  const didDragRef = useRef(false)
  const resetDidDragTimerRef = useRef(null)

  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [isEntered, setIsEntered] = useState(isOpen)
  const [dragOffsetX, setDragOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setIsClosing(false)
      setIsEntered(false)
      setDragOffsetX(0)
      setIsDragging(false)
    } else {
      setIsClosing(true)
    }
  }

  useEffect(() => {
    if (isOpen) {
      let nestedRafId = 0
      const rafId = requestAnimationFrame(() => {
        nestedRafId = requestAnimationFrame(() => {
          setIsEntered(true)
        })
      })
      return () => {
        cancelAnimationFrame(rafId)
        cancelAnimationFrame(nestedRafId)
      }
    }

    if (!isClosing) return undefined
    const timerId = window.setTimeout(() => {
      setIsClosing(false)
      setIsEntered(false)
    }, 220)
    return () => window.clearTimeout(timerId)
  }, [isOpen, isClosing])

  const shouldRender = isOpen || isClosing
  const isVisible = isOpen && isEntered && !isClosing
  const totalPhotos = images.length

  const goPrev = useCallback(() => {
    if (totalPhotos <= 1) return
    onChangeIndex((activeIndex - 1 + totalPhotos) % totalPhotos)
  }, [activeIndex, totalPhotos, onChangeIndex])

  const goNext = useCallback(() => {
    if (totalPhotos <= 1) return
    onChangeIndex((activeIndex + 1) % totalPhotos)
  }, [activeIndex, totalPhotos, onChangeIndex])

  // Tangani keyboard (Escape, panah kiri/kanan) & focus trap selama modal aktif
  useEffect(() => {
    if (!shouldRender) return undefined

    previousFocusRef.current = document.activeElement
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus()
    }, 20)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
        return
      }
      if (e.key === 'Tab') {
        const focusables = getFocusableElements(modalRef.current)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      if (resetDidDragTimerRef.current) {
        window.clearTimeout(resetDidDragTimerRef.current)
      }
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [shouldRender, onClose, goPrev, goNext])

  const handleStagePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    if (e.target.closest('button')) return

    didDragRef.current = false
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      lockedHorizontal: false,
    }
  }

  const handleStagePointerMove = (e) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    if (!drag.lockedHorizontal) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      // Jika user menggeser vertikal, batalkan gestur horizontal
      if (Math.abs(dy) > Math.abs(dx)) {
        dragStateRef.current = null
        return
      }
      drag.lockedHorizontal = true
      didDragRef.current = true
      setIsDragging(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Abaikan jika browser menolak pointer capture
      }
    }

    const atStartEdge = activeIndex === 0 && dx > 0
    const atEndEdge = activeIndex === totalPhotos - 1 && dx < 0
    const dampedDx = atStartEdge || atEndEdge ? dx * 0.35 : dx
    setDragOffsetX(dampedDx)
  }

  const finishStageDrag = (e) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragStateRef.current = null

    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Abaikan jika capture sudah dilepas
    }

    if (drag.lockedHorizontal && totalPhotos > 1) {
      const dx = e.clientX - drag.startX
      const elapsed = Math.max(performance.now() - drag.startTime, 16)
      const velocity = Math.abs(dx) / elapsed

      if ((dx < -SWIPE_THRESHOLD_PX || (dx < -18 && velocity > SWIPE_VELOCITY_THRESHOLD)) && activeIndex < totalPhotos - 1) {
        onChangeIndex(activeIndex + 1)
      } else if ((dx > SWIPE_THRESHOLD_PX || (dx > 18 && velocity > SWIPE_VELOCITY_THRESHOLD)) && activeIndex > 0) {
        onChangeIndex(activeIndex - 1)
      }
    }

    setIsDragging(false)
    setDragOffsetX(0)

    if (didDragRef.current) {
      resetDidDragTimerRef.current = window.setTimeout(() => {
        didDragRef.current = false
      }, 60)
    }
  }

  // Tutup modal hanya ketika user mengklik backdrop/area kosong di luar foto & kontrol
  const handleOverlayClick = (e) => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    if (e.target.closest('button') || e.target.tagName === 'IMG') {
      return
    }
    onClose()
  }

  if (!shouldRender || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={modalRef}
      id="photo-lightbox-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Galeri foto ${placeName}`}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[2100] flex flex-col justify-between bg-black/75 backdrop-blur-xl pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header Lightbox: Indikator Posisi & Tombol Tutup */}
      <div className="relative z-20 flex items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            id="lightbox-counter"
            className="shrink-0 rounded-full border border-white/20 bg-[#161E16]/90 px-3.5 py-1.5 text-[12px] font-semibold tabular-nums text-[#EBF0EB]"
          >
            {activeIndex + 1} / {totalPhotos}
          </span>
          <span className="truncate text-[13px] font-medium text-[#EBF0EB]">{placeName}</span>
        </div>

        <button
          ref={closeBtnRef}
          type="button"
          id="lightbox-close-button"
          onClick={onClose}
          aria-label="Tutup galeri foto"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#161E16]/90 text-[#EBF0EB] shadow-md transition-colors duration-150 hover:bg-[#253320] active:scale-[0.96]"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Stage Utama Lightbox: Zoom-in animasi + Swipe Track */}
      <div
        id="lightbox-stage"
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={finishStageDrag}
        onPointerCancel={finishStageDrag}
        className={`relative flex-1 min-h-0 w-full flex items-center overflow-hidden touch-pan-y transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {totalPhotos > 1 && (
          <button
            type="button"
            id="lightbox-prev-button"
            onClick={goPrev}
            aria-label="Foto sebelumnya"
            className="hidden sm:flex absolute left-4 md:left-6 top-1/2 z-20 h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[#161E16]/90 text-[#EBF0EB] shadow-lg transition-colors duration-150 hover:bg-[#253320] active:scale-[0.96]"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        )}

        <div
          className="flex h-full w-full items-center will-change-transform motion-reduce:transition-none"
          style={{
            transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffsetX}px), 0, 0)`,
            transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {images.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className="flex h-full w-full shrink-0 items-center justify-center px-3 py-2 sm:px-20"
            >
              <SafeImage
                src={imgUrl}
                fallback={fallbackPhoto}
                alt={`${placeName} - foto ${idx + 1} dari ${totalPhotos}`}
                fit="contain"
                loading="eager"
                decoding="async"
                className="max-h-[80vh] max-w-[90vw]"
                imgClassName="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl border border-white/20 shadow-2xl"
              />
            </div>
          ))}
        </div>

        {totalPhotos > 1 && (
          <button
            type="button"
            id="lightbox-next-button"
            onClick={goNext}
            aria-label="Foto berikutnya"
            className="hidden sm:flex absolute right-4 md:right-6 top-1/2 z-20 h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[#161E16]/90 text-[#EBF0EB] shadow-lg transition-colors duration-150 hover:bg-[#253320] active:scale-[0.96]"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Footer Lightbox: Kontrol Mobile & Strip Thumbnail Desktop */}
      <div className="relative z-20 flex flex-col items-center gap-3 px-4 pt-2 sm:px-6">
        {totalPhotos > 1 && (
          <div className="flex w-full max-w-md items-center justify-between gap-2 sm:w-auto sm:justify-center">
            <button
              type="button"
              id="lightbox-prev-mobile"
              onClick={goPrev}
              aria-label="Foto sebelumnya"
              className="flex sm:hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#161E16]/90 text-[#EBF0EB] transition-colors duration-150 hover:bg-[#253320] active:scale-[0.96]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {/* Indikator titik untuk mobile */}
            <div className="flex sm:hidden flex-1 flex-wrap items-center justify-center gap-0.5">
              {images.map((_, idx) => {
                const isCurrent = idx === activeIndex
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChangeIndex(idx)}
                    aria-label={`Lihat foto ${idx + 1}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 rounded-full transition-all duration-200 ${
                        isCurrent ? 'w-6 bg-[#EBF0EB]' : 'w-2 bg-[#EBF0EB]/40'
                      }`}
                    />
                  </button>
                )
              })}
            </div>

            {/* Thumbnail strip untuk tablet & desktop */}
            <div className="hidden sm:flex max-w-full items-center gap-2.5 overflow-x-auto p-1.5 no-scrollbar">
              {images.map((imgUrl, idx) => {
                const isCurrent = idx === activeIndex
                return (
                  <button
                    key={`${imgUrl}-thumb-${idx}`}
                    type="button"
                    onClick={() => onChangeIndex(idx)}
                    aria-label={`Pilih foto ${idx + 1} dari ${totalPhotos}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 ${
                      isCurrent
                        ? 'scale-105 border-[#EBF0EB] opacity-100'
                        : 'border-white/20 opacity-60 hover:opacity-95'
                    }`}
                  >
                    <SafeImage
                      src={imgUrl}
                      fallback={fallbackPhoto}
                      alt=""
                      width={160}
                      height={100}
                      loading="lazy"
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              id="lightbox-next-mobile"
              onClick={goNext}
              aria-label="Foto berikutnya"
              className="flex sm:hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#161E16]/90 text-[#EBF0EB] transition-colors duration-150 hover:bg-[#253320] active:scale-[0.96]"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function TouristDetailPage({
  place,
  allPlaces = [],
  onSelectPlace,
  onBack,
  onStartNavigation,
  isFavorite,
  toggleFavorite,
}) {
  const scrollContainerRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [prevSlug, setPrevSlug] = useState(place?.slug ?? null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [heroNaturalMeta, setHeroNaturalMeta] = useState({ src: '', width: 0, height: 0 })

  if ((place?.slug ?? null) !== prevSlug) {
    setPrevSlug(place?.slug ?? null)
    setIsLightboxOpen(false)
    setLightboxIndex(0)
    setHeroNaturalMeta({ src: '', width: 0, height: 0 })
  }

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  // Reset posisi scroll saat berpindah ke destinasi lain
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 })
  }, [place?.slug])

  const fallbackPhoto = useMemo(
    () => (place ? getBogorFallbackPhoto(place) : DEFAULT_IMAGE_PLACEHOLDER),
    [place],
  )

  const galleryImages = useMemo(() => {
    if (!place) return []
    const rawList = Array.isArray(place.gallery) && place.gallery.length > 0
      ? [place.image, ...place.gallery]
      : [place.image]
    const cleaned = rawList
      .map((img) => cleanDetailText(img))
      .filter((img) => Boolean(img) && img !== DEFAULT_IMAGE_PLACEHOLDER)
    if (cleaned.length > 0) {
      return [...new Set(cleaned)]
    }
    return getBogorFallbackGallery(place, 3)
  }, [place])

  const similarPlaces = useMemo(() => {
    if (!place || !Array.isArray(allPlaces) || allPlaces.length === 0) return []
    return allPlaces
      .filter((item) => item && item.slug !== place.slug && item.id !== place.id)
      .map((item) => {
        const distKm = calcQuickDistanceKm(place.coordinates, item.coordinates)
        const sameCategory = item.category === place.category
        // Prioritaskan destinasi kategori sama di radius berdekatan
        const score = (Number.isFinite(distKm) ? distKm : 50) + (sameCategory ? 0 : 8)
        return { item, distKm, score }
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 4)
  }, [place, allPlaces])

  if (!place) {
    return (
      <div
        id="tourist-detail-page"
        className="apple-canopy-bg flex h-full w-full flex-col items-center justify-center px-6 pb-32 text-center text-[#EBF0EB]"
      >
        <p className="text-[15px] font-semibold">Data tempat wisata tidak ditemukan.</p>
        <p className="mt-1.5 text-[13px] text-white/60">
          Pilih destinasi lain melalui halaman Explore untuk melihat informasi lengkapnya.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="apple-retro-cta mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold active:scale-[0.98]"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Kembali ke peta</span>
          </button>
        )}
      </div>
    )
  }

  const favoriteActive = isFavorite ? isFavorite(place.slug) : false
  const lat = place.coordinates?.lat ?? -6.6115
  const lng = place.coordinates?.lng ?? 106.7725
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  const handleShare = async () => {
    const shareData = {
      title: place.name,
      text: `${place.name} - Rekomendasi wisata di Bogor`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // Pengguna membatalkan dialog bagikan bawaan
      }
    } else {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(window.location.href)
        }
        setCopied(true)
      } catch {
        // Abaikan jika akses clipboard ditolak
      }
    }
  }

  const handleStartJourney = () => {
    if (onStartNavigation) {
      onStartNavigation(place)
    } else {
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const openLightbox = (startIndex = 0) => {
    if (galleryImages.length === 0) return
    const clampedIndex = Math.min(Math.max(startIndex, 0), galleryImages.length - 1)
    setLightboxIndex(clampedIndex)
    setIsLightboxOpen(true)
  }

  const cleanDetailed = cleanDetailText(place.detailedDescription)
  const cleanShort = cleanDetailText(place.description)
  const descriptionText = cleanDetailed || cleanShort || buildAutoDescription(place)
  const rawParagraphs = descriptionText
    .split('\n\n')
    .map((p) => cleanDetailText(p))
    .filter(Boolean)
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [buildAutoDescription(place)]

  const cleanOperational = cleanDetailText(place.operationalHours) || 'Belum tersedia'
  const operationalHoursParts = cleanOperational
    .split(';')
    .map((part) => cleanDetailText(part))
    .filter(Boolean)

  const priceAndTravelSummary = [
    { label: 'Tiket masuk', value: cleanDetailText(place.ticketPrice) || 'Cek di lokasi' },
    { label: 'Estimasi tiba', value: cleanDetailText(place.travelTime) || 'Aktifkan GPS' },
  ]
  const cleanAddress = cleanDetailText(place.address)
  const heroImage = cleanDetailText(place.image) || galleryImages[0] || fallbackPhoto
  const isHeroMetaCurrent = heroNaturalMeta.src === heroImage && heroNaturalMeta.width > 0
  const isHeroLowResOrPortrait =
    isHeroMetaCurrent &&
    (heroNaturalMeta.width < 680 || heroNaturalMeta.height > heroNaturalMeta.width * 0.92)

  const handleHeroImageLoad = (e) => {
    const imgEl = e?.currentTarget
    if (!imgEl) return
    const nextW = imgEl.naturalWidth || 0
    const nextH = imgEl.naturalHeight || 0
    if (nextW > 0 && nextH > 0) {
      setHeroNaturalMeta((prev) =>
        prev.src === heroImage && prev.width === nextW && prev.height === nextH
          ? prev
          : { src: heroImage, width: nextW, height: nextH },
      )
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      id="tourist-detail-page"
      className="apple-canopy-bg animate-detail-enter relative h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain text-[#F5F2EB]"
    >
      {/* Wrapper atas: Full-bleed di mobile (< 768px), terbingkai proporsional max-w-5xl di iPad / Nest Hub / Laptop */}
      <div className="relative w-full md:mx-auto md:max-w-5xl md:px-6 md:pt-6">
        {/* Top Navigation Glass Bar: Mengambang di Hero (Mobile) / Bar Navigasi Ringkas di atas Hero (Desktop & iPad) */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-[calc(env(safe-area-inset-top,0px)+14px)] md:pointer-events-auto md:static md:mb-4 md:pt-0">
          <div className="mx-auto flex w-full items-center justify-between px-4 md:px-0">
            <button
              type="button"
              id="detail-back-button"
              aria-label="Kembali ke peta"
              onClick={onBack}
              className="apple-glass-pill pointer-events-auto inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-[#F5F2EB] shadow-md transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97] px-3 sm:px-4"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Kembali ke peta</span>
            </button>

            <div className="pointer-events-auto relative flex items-center gap-2.5">
              <button
                type="button"
                id="detail-share-button"
                aria-label="Bagikan tempat ini"
                onClick={handleShare}
                className="apple-glass-pill inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full text-[13px] font-medium text-[#F5F2EB] shadow-md transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97] sm:px-3.5"
              >
                <ShareIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>

              <button
                type="button"
                id="detail-favorite-button"
                aria-pressed={favoriteActive}
                aria-label={favoriteActive ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                onClick={() => toggleFavorite && toggleFavorite(place.slug)}
                className={`inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full border text-[13px] font-medium shadow-md backdrop-blur-md transition-all duration-150 active:scale-[0.97] sm:px-3.5 ${
                  favoriteActive
                    ? 'border-rose-300/35 bg-[#3B1D24]/85 text-rose-200 hover:bg-[#49242D]'
                    : 'apple-glass-pill text-[#F5F2EB] hover:bg-white/[0.14]'
                }`}
              >
                <HeartIcon filled={favoriteActive} className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  {favoriteActive ? 'Tersimpan' : 'Simpan'}
                </span>
              </button>

              {copied && (
                <div
                  role="status"
                  aria-live="polite"
                  className="apple-glass-card absolute top-full right-0 z-30 mt-2 whitespace-nowrap rounded-xl px-3 py-1.5 text-[12px] font-medium text-[#F5F2EB] shadow-md"
                >
                  Tautan tersalin
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Banner Hero Image Proporsional + Ambient Backdrop Blur + Gradient Overlay Halus */}
        <section
          id="detail-hero-banner"
          className="apple-retro-bevel relative h-72 w-full overflow-hidden bg-[#131913] sm:aspect-[16/9] sm:h-auto md:h-[400px] lg:h-[440px] md:rounded-3xl md:border md:border-[rgba(244,239,230,0.16)] md:shadow-2xl"
        >
          {/* Lapisan Backdrop Blur dari gambar yang sama untuk kedalaman & pelindung foto resolusi rendah/portrait */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <SafeImage
              src={heroImage}
              fallback={fallbackPhoto}
              alt=""
              width={640}
              height={360}
              loading="eager"
              decoding="async"
              className="h-full w-full"
              imgClassName="scale-110 object-cover object-center blur-2xl saturate-125 brightness-[0.58]"
            />
          </div>

          {/* Foto Utama: object-cover penuh untuk foto landscape HD, atau object-contain tajam di atas backdrop blur bila foto kecil/portrait */}
          <div className="relative z-[1] flex h-full w-full items-center justify-center">
            <SafeImage
              src={heroImage}
              fallback={fallbackPhoto}
              alt={place.name}
              width={1280}
              height={720}
              fit={isHeroLowResOrPortrait ? 'contain' : 'cover'}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={handleHeroImageLoad}
              className={
                isHeroLowResOrPortrait
                  ? 'h-full w-full px-3 py-2 md:px-8 md:py-4'
                  : 'h-full w-full object-cover object-center'
              }
              imgClassName={
                isHeroLowResOrPortrait
                  ? 'max-h-full max-w-full rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.75)] ring-1 ring-white/15'
                  : 'object-cover object-center'
              }
            />
          </div>

          {/* Top scrim untuk visibilitas tombol kaca navigasi di atas foto terang */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-28 bg-gradient-to-b from-[#0C120C]/75 via-[#0C120C]/32 to-transparent md:h-24 md:from-black/45 md:via-black/15"
          />

          {/* Bottom gradient overlay multi-stop yang lembut & pekat agar teks judul putih selalu kontras tajam */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-44 bg-gradient-to-t from-[#111711] via-[#111711]/80 via-45% to-transparent md:h-60 md:from-[#0C120C]/95 md:via-[#0C120C]/62 md:via-50% to-transparent"
          />

          {/* Overlay Judul, Rating, & Kategori menyatu elegan di sudut kiri bawah foto pada iPad / Nest Hub / Laptop */}
          <div className="hidden md:flex md:flex-col md:justify-end absolute inset-x-0 bottom-0 z-10 p-6 lg:p-7">
            <h1
              id="detail-title"
              className="max-w-3xl text-[26px] lg:text-[32px] font-semibold leading-tight tracking-tight text-[#F5F2EB] drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]"
            >
              {place.name}
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] font-medium text-[#F5F2EB] drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
              <span className="inline-flex items-center gap-1.5">
                <StarIcon filled className="h-4 w-4 shrink-0 text-[#DFAA63]" />
                <span className="font-semibold not-italic tabular-nums text-[#F5F2EB]">
                  {Number(place.rating || 0).toFixed(1)}
                </span>
              </span>
              {place.category && (
                <>
                  <span className="text-[#F5F2EB]/45" aria-hidden="true">·</span>
                  <span className="rounded-full border border-[rgba(244,239,230,0.22)] bg-black/40 px-3 py-0.5 text-[12px] font-semibold text-[#DFAA63] backdrop-blur-md">
                    {place.category}
                  </span>
                </>
              )}
              {place.distance && (
                <>
                  <span className="text-[#F5F2EB]/45" aria-hidden="true">·</span>
                  <span className="not-italic tabular-nums text-[#F5F2EB]/85">{place.distance}</span>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Kontainer Utama Place Sheet: Mobile 1 Kolom vs iPad / Nest Hub / Laptop 2 Kolom Split (7 + 5) */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-32 md:px-6">
        {/* Judul & Metadata khusus Mobile (< 768px) */}
        <div className="relative -mt-8 mb-5 md:hidden">
          <h1
            id="detail-title-mobile"
            className="text-[clamp(1.5rem,2.5vw+0.9rem,2rem)] font-semibold leading-tight tracking-tight text-[#F5F2EB]"
          >
            {place.name}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] font-medium text-[#F5F2EB]">
            <span className="inline-flex items-center gap-1.5">
              <StarIcon filled className="h-4 w-4 shrink-0 text-[#DFAA63]" />
              <span className="font-semibold not-italic tabular-nums">
                {Number(place.rating || 0).toFixed(1)}
              </span>
            </span>
            {place.category && (
              <>
                <span className="text-[#F5F2EB]/40" aria-hidden="true">·</span>
                <span className="rounded-full border border-[rgba(244,239,230,0.16)] bg-white/[0.07] px-2.5 py-0.5 text-[12px] font-semibold text-[#DFAA63]">
                  {place.category}
                </span>
              </>
            )}
            {place.distance && (
              <>
                <span className="text-[#F5F2EB]/40" aria-hidden="true">·</span>
                <span className="not-italic tabular-nums text-[#F5F2EB]/70">{place.distance}</span>
              </>
            )}
          </div>
        </div>

        {/* Grid 2 Kolom Apple Place Card pada md+ */}
        <div className="grid grid-cols-1 gap-6 md:mt-6 md:grid-cols-12 md:items-start">
          {/* Kolom Kiri (7 kolom): Aksi Utama, Info Operasional, Alamat, & Tentang Destinasi */}
          <div className="md:col-span-7">
            <div className="apple-glass-card rounded-2xl p-4 sm:p-6">
              {/* Baris Tombol Aksi Utama */}
              <section
                aria-label="Aksi navigasi destinasi"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <button
                  type="button"
                  id="btn-mulai-perjalanan"
                  onClick={handleStartJourney}
                  className="apple-retro-cta inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold active:scale-[0.98]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                  <span>Mulai perjalanan</span>
                </button>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apple-glass-pill inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-medium text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.98]"
                >
                  <MapPinIcon className="h-4 w-4 text-[#DFAA63]" />
                  <span>Buka di Google Maps</span>
                </a>
              </section>

              {/* Kartu Info Ringkas (Jam buka, Tiket masuk, Estimasi tiba) */}
              <section
                aria-label="Informasi singkat tempat wisata"
                className="apple-retro-bevel mt-5 overflow-hidden rounded-2xl border border-[rgba(244,239,230,0.14)] bg-black/25"
              >
                <div className="flex items-start gap-3 border-b border-[rgba(244,239,230,0.12)] px-4 py-3.5 sm:items-center sm:px-5">
                  <div className="apple-glass-pill mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:mt-0">
                    <ClockIcon className="h-4 w-4 text-[#DFAA63]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium text-[#F5F2EB]/60">Jam buka</span>
                    {operationalHoursParts.length > 1 ? (
                      <div className="mt-1 flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                        {operationalHoursParts.map((part) => (
                          <span
                            key={part}
                            className="font-mono text-[12.5px] font-semibold leading-snug tabular-nums tracking-wide text-[#F5F2EB] sm:text-[13px]"
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="mt-0.5 block break-words font-mono text-[12.5px] font-semibold leading-snug tabular-nums tracking-wide text-[#F5F2EB] sm:text-[13px]">
                        {operationalHoursParts[0] || 'Belum tersedia'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-[rgba(244,239,230,0.12)]">
                  {priceAndTravelSummary.map((item) => (
                    <div
                      key={item.label}
                      className="flex min-w-0 flex-col items-center justify-center px-3 py-3.5 text-center sm:px-4"
                    >
                      <span className="text-[11px] font-medium text-[#F5F2EB]/60">{item.label}</span>
                      <span className="mt-1 break-words font-mono text-[12.5px] font-semibold leading-snug tabular-nums tracking-wide text-[#F5F2EB] sm:text-[13px]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Alamat Lengkap */}
              {cleanAddress && (
                <section aria-label="Alamat tempat wisata" className="mt-4">
                  <div className="apple-retro-bevel flex items-start gap-2.5 rounded-2xl border border-[rgba(244,239,230,0.12)] bg-white/[0.04] px-4 py-3 text-[13px] leading-relaxed text-[#F5F2EB]/80 sm:text-[13.5px]">
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#DFAA63]" />
                    <span>{cleanAddress}</span>
                  </div>
                </section>
              )}

              {/* Deskripsi Destinasi */}
              <section className="mt-6 border-t border-[rgba(244,239,230,0.12)] pt-5">
                <h2 className="mb-2.5 text-[16px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[17px]">
                  Tentang destinasi
                </h2>
                <div className="space-y-3 text-[14px] font-normal leading-relaxed text-[#F5F2EB]/85 sm:text-[15px]">
                  {paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Kolom Kanan (5 kolom - Sticky): Tumpukan Foto Lokasi & Destinasi Serupa */}
          <aside className="space-y-5 md:col-span-5 md:sticky md:top-6">
            {/* Tumpukan Kartu Interaktif "Foto lokasi" */}
            <section className="apple-glass-card overflow-hidden rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold tracking-tight text-[#F5F2EB]">
                  Foto lokasi
                </h2>
                <span className="text-[11.5px] font-medium not-italic tabular-nums text-[#F5F2EB]/60">
                  {galleryImages.length} tersimpan
                </span>
              </div>

              <PhotoStackDeck
                placeName={place.name}
                images={galleryImages}
                fallbackPhoto={fallbackPhoto}
                onOpenLightbox={openLightbox}
              />
            </section>

            {/* Kartu "Destinasi Serupa di Sekitar" */}
            {similarPlaces.length > 0 && (
              <section
                aria-labelledby="similar-places-heading"
                className="apple-glass-card rounded-2xl p-5"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2
                    id="similar-places-heading"
                    className="text-[15.5px] font-semibold tracking-tight text-[#F5F2EB]"
                  >
                    Destinasi Serupa di Sekitar
                  </h2>
                  <span className="text-[11px] font-medium text-[#F5F2EB]/55">Terdekat</span>
                </div>

                <ul className="divide-y divide-[rgba(244,239,230,0.12)]">
                  {similarPlaces.map(({ item, distKm }) => {
                    const itemDistLabel = Number.isFinite(distKm)
                      ? distKm < 1
                        ? `${Math.max(50, Math.round(distKm * 1000))} m`
                        : `${distKm.toFixed(1)} km`
                      : item.category
                    return (
                      <li key={item.id || item.slug}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPlace) {
                              onSelectPlace(item)
                            }
                          }}
                          className="group -mx-2 flex min-h-[56px] w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-all duration-150 hover:bg-white/[0.08] active:scale-[0.98]"
                        >
                          <div className="apple-retro-bevel aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-[rgba(244,239,230,0.16)]">
                            <SafeImage
                              src={cleanDetailText(item.image) || getBogorFallbackPhoto(item)}
                              fallback={getBogorFallbackPhoto(item)}
                              alt={item.name}
                              width={160}
                              height={100}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[13.5px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
                              {item.name}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#F5F2EB]/60">
                              <StarIcon filled className="h-3 w-3 shrink-0 text-[#DFAA63]" />
                              <span className="font-semibold not-italic tabular-nums text-[#F5F2EB]">
                                {Number(item.rating || 0).toFixed(1)}
                              </span>
                              <span aria-hidden="true" className="text-[#F5F2EB]/35">·</span>
                              <span className="truncate not-italic tabular-nums">{itemDistLabel}</span>
                              {item.category && Number.isFinite(distKm) && (
                                <>
                                  <span aria-hidden="true" className="text-[#F5F2EB]/35">·</span>
                                  <span className="truncate text-[#DFAA63]/90">{item.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/35 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]/80" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>

      {/* Modal Fullscreen Lightbox Gallery */}
      <PhotoLightboxModal
        isOpen={isLightboxOpen}
        images={galleryImages}
        fallbackPhoto={fallbackPhoto}
        activeIndex={lightboxIndex}
        placeName={place.name}
        onClose={() => setIsLightboxOpen(false)}
        onChangeIndex={setLightboxIndex}
      />
    </div>
  )
}

export default memo(TouristDetailPage)
