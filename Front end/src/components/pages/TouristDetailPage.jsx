import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SafeImage from '../ui/SafeImage'
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
function PhotoStackDeck({ placeName, images, onOpenLightbox }) {
  const [isPressed, setIsPressed] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="mt-3 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border border-[#EBF0EB]/15 bg-[#1B261B] p-6 text-center">
        <CameraIcon className="h-8 w-8 text-[#C8D3C8]/70" />
        <p className="mt-2.5 text-[13px] font-medium text-[#C8D3C8]">
          Foto lokasi belum tersedia saat ini.
        </p>
      </div>
    )
  }

  const visibleStack = images.slice(0, 3)

  return (
    <div className="mt-3">
      <button
        type="button"
        id="detail-photo-stack-btn"
        onClick={() => onOpenLightbox(0)}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        aria-label={`Buka galeri foto ${placeName}, ${images.length} foto`}
        className="group relative block w-full rounded-2xl py-3 text-left transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EBF0EB]"
      >
        {/* Wadah tumpukan berdimensi eksplisit agar aman terhadap CLS & overflow horizontal mobile/tablet */}
        <div className="relative mx-auto h-[188px] min-[375px]:h-[218px] sm:h-[256px] w-full max-w-[204px] min-[375px]:max-w-[244px] sm:max-w-[312px]">
          {[...visibleStack].reverse().map((imgUrl, revIdx) => {
            const stackIdx = visibleStack.length - 1 - revIdx
            const layer = STACK_TRANSFORM_BY_INDEX[stackIdx] || STACK_TRANSFORM_BY_INDEX[2]
            const activeTransform = isPressed ? layer.pressed : `${layer.rest} ${layer.fanned}`

            return (
              <div
                key={`${imgUrl}-${stackIdx}`}
                aria-hidden={stackIdx > 0}
                className={`absolute inset-0 rounded-2xl border border-white/25 bg-[#1B261B] p-1.5 pb-2.5 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.5)] will-change-transform transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transform-none motion-reduce:transition-none ${layer.zIndex} ${activeTransform}`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#253320]">
                  <SafeImage
                    src={imgUrl}
                    alt={stackIdx === 0 ? `${placeName} foto galeri` : ''}
                    width={480}
                    height={360}
                    loading={stackIdx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full"
                  />

                  {/* Badge penghitung foto di sudut kartu teratas */}
                  {stackIdx === 0 && (
                    <span className="pointer-events-none absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#161E16]/90 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#EBF0EB] shadow-sm">
                      <CameraIcon className="h-3.5 w-3.5 text-[#E2D7B5]" />
                      <span>{images.length} Foto</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-center text-[12px] font-medium text-[#C8D3C8] transition-colors duration-150 group-hover:text-[#EBF0EB]">
          Ketuk kartu untuk melihat seluruh galeri
        </p>
      </button>
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
                alt={`${placeName} - foto ${idx + 1} dari ${totalPhotos}`}
                fit="contain"
                loading="eager"
                decoding="async"
                className="max-h-[70dvh] sm:max-h-[74dvh] max-w-full"
                imgClassName="rounded-2xl border border-white/20 shadow-2xl"
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
                    className={`relative h-12 w-16 overflow-hidden rounded-xl border-2 transition-all duration-150 ${
                      isCurrent
                        ? 'scale-105 border-[#EBF0EB] opacity-100'
                        : 'border-white/20 opacity-60 hover:opacity-95'
                    }`}
                  >
                    <SafeImage
                      src={imgUrl}
                      alt=""
                      width={96}
                      height={72}
                      loading="lazy"
                      className="h-full w-full"
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

  if ((place?.slug ?? null) !== prevSlug) {
    setPrevSlug(place?.slug ?? null)
    setIsLightboxOpen(false)
    setLightboxIndex(0)
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

  const galleryImages = useMemo(() => {
    if (!place) return []
    const rawGallery =
      Array.isArray(place.gallery) && place.gallery.length > 0 ? place.gallery : [place.image]
    return [...new Set(rawGallery.filter(Boolean))]
  }, [place])

  if (!place) {
    return (
      <div
        id="tourist-detail-page"
        className="flex h-full w-full flex-col items-center justify-center bg-forest-900 px-6 pb-32 text-center text-[#EBF0EB]"
      >
        <p className="text-[15px] font-semibold">Data tempat wisata tidak ditemukan.</p>
        <p className="mt-1.5 text-[13px] text-[#C8D3C8]">
          Pilih destinasi lain melalui halaman Explore untuk melihat informasi lengkapnya.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#EBF0EB] px-6 py-2.5 text-[13px] font-semibold text-[#161E16] transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98]"
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

  const descriptionText = place.detailedDescription || place.description || ''
  const paragraphs = descriptionText.split('\n\n').filter(Boolean)

  const operationalHoursParts = (place.operationalHours || 'Belum tersedia')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)

  const priceAndTravelSummary = [
    { label: 'Tiket masuk', value: place.ticketPrice || 'Cek di lokasi' },
    { label: 'Estimasi tiba', value: place.travelTime || 'Aktifkan GPS' },
  ]

  return (
    <div
      ref={scrollContainerRef}
      id="tourist-detail-page"
      className="relative h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain overscroll-y-contain bg-forest-900 text-[#EBF0EB]"
    >
      {/* Hero Image penuh di atas (full-bleed) konsisten di seluruh ukuran & orientasi layar */}
      <div className="relative w-full">
        {/* Top Action Bar terpusat mengikuti tepi kontainer konten max-w-3xl */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-[calc(env(safe-area-inset-top,0px)+14px)] sm:pt-5">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 sm:px-8">
            <button
              type="button"
              id="detail-back-button"
              aria-label="Kembali ke peta"
              onClick={onBack}
              className="pointer-events-auto inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full border border-[#EBF0EB]/20 bg-[#161E16]/75 text-[13px] font-semibold text-[#EBF0EB] shadow-md backdrop-blur-md transition-colors duration-150 hover:bg-[#233020]/90 active:scale-[0.97] sm:px-4"
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
                className="inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full border border-[#EBF0EB]/20 bg-[#161E16]/75 text-[13px] font-medium text-[#EBF0EB] shadow-md backdrop-blur-md transition-colors duration-150 hover:bg-[#233020]/90 active:scale-[0.97] sm:px-3.5"
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
                className={`inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full border text-[13px] font-medium shadow-md backdrop-blur-md transition-colors duration-150 active:scale-[0.97] sm:px-3.5 ${
                  favoriteActive
                    ? 'border-rose-300/35 bg-[#3B1D24]/85 text-rose-200 hover:bg-[#49242D]'
                    : 'border-[#EBF0EB]/20 bg-[#161E16]/75 text-[#EBF0EB] hover:bg-[#233020]/90'
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
                  className="absolute top-full right-0 z-30 mt-2 whitespace-nowrap rounded-xl border border-[#EBF0EB]/20 bg-[#1B261B] px-3 py-1.5 text-[12px] font-medium text-[#EBF0EB] shadow-md"
                >
                  Tautan tersalin
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="relative h-[42svh] min-h-[280px] max-h-[460px] w-full overflow-hidden bg-[#1B261B]">
          <SafeImage
            src={place.image}
            alt={place.name}
            width={1200}
            height={720}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-[42svh] min-h-[280px] max-h-[460px] object-cover w-full"
          />

          {/* Top & bottom scrim di seluruh ukuran layar agar kontrol header dan transisi judul selalu kontras */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 via-black/35 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-forest-900 via-forest-900/80 to-transparent"
          />
        </section>
      </div>

      {/* Kontainer Konten Terpusat & Fluid (1 Kolom Vertikal Konsisten di Semua Perangkat) */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-5 sm:px-8 pb-32 animate-fade-enter">
        {/* Judul, Rating, Kategori & Jarak */}
        <div className="relative -mt-8">
          <h1
            id="detail-title"
            className="text-[clamp(1.5rem,2.5vw+0.9rem,2.25rem)] font-bold leading-tight tracking-tight text-[#EBF0EB]"
          >
            {place.name}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] font-medium text-[#EBF0EB]">
            <span className="inline-flex items-center gap-1.5">
              <StarIcon filled className="h-4 w-4 shrink-0 text-amber-300" />
              <span className="font-semibold tabular-nums">
                {Number(place.rating || 0).toFixed(1)}
              </span>
            </span>
            {place.category && (
              <>
                <span className="text-[#9AA89A]" aria-hidden="true">·</span>
                <span className="rounded-lg border border-[#EBF0EB]/18 bg-[#233020] px-2.5 py-0.5 text-[12px] font-semibold text-[#E2D7B5]">
                  {place.category}
                </span>
              </>
            )}
            {place.distance && (
              <>
                <span className="text-[#9AA89A]" aria-hidden="true">·</span>
                <span className="text-[#C8D3C8]">{place.distance}</span>
              </>
            )}
          </div>
        </div>

        {/* Ringkasan Informasi Operasional (Jam Buka, Tiket Masuk, Estimasi Tiba) */}
        <section
          aria-label="Informasi singkat tempat wisata"
          className="mt-5 overflow-hidden rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] shadow-sm"
        >
          {/* Baris penuh Jam buka agar teks jadwal panjang tetap rapi */}
          <div className="flex items-start gap-3 border-b border-[#EBF0EB]/15 px-4 py-3.5 sm:items-center sm:px-5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#EBF0EB]/10 bg-[#1B261B] sm:mt-0">
              <ClockIcon className="h-4 w-4 text-[#E2D7B5]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium text-[#C8D3C8]">Jam buka</span>
              {operationalHoursParts.length > 1 ? (
                <div className="mt-1 flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                  {operationalHoursParts.map((part) => (
                    <span
                      key={part}
                      className="text-[13px] font-bold leading-snug tracking-tight text-[#EBF0EB] sm:text-[13.5px]"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="mt-0.5 block break-words text-[13px] font-bold leading-snug tracking-tight text-[#EBF0EB] sm:text-[13.5px]">
                  {operationalHoursParts[0] || 'Belum tersedia'}
                </span>
              )}
            </div>
          </div>

          {/* Baris 2 kolom sejajar untuk Tiket masuk dan Estimasi tiba */}
          <div className="grid grid-cols-2 divide-x divide-[#EBF0EB]/15">
            {priceAndTravelSummary.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 flex-col items-center justify-center px-3 py-3.5 text-center sm:px-4"
              >
                <span className="text-[11px] font-medium text-[#C8D3C8]">{item.label}</span>
                <span className="mt-1 break-words text-[13px] font-bold leading-snug tracking-tight text-[#EBF0EB] sm:text-[13.5px]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Alamat Destinasi */}
        {place.address && (
          <section
            aria-label="Alamat tempat wisata"
            className="mt-4"
          >
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020]/65 px-4 py-3 text-[13px] leading-relaxed text-[#C8D3C8] sm:text-[13.5px]">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#E2D7B5]" />
              <span>{place.address}</span>
            </div>
          </section>
        )}

        {/* Tombol Aksi Inline (1 kolom di HP kecil, 2 kolom sejajar di layar >= sm) */}
        <section
          aria-label="Aksi navigasi destinasi"
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <button
            type="button"
            id="btn-mulai-perjalanan"
            onClick={handleStartJourney}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#EBF0EB] px-5 py-3 text-[14px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98]"
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
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#EBF0EB]/20 bg-[#1B261B]/65 px-5 py-3 text-[14px] font-medium text-[#EBF0EB] backdrop-blur-md transition-colors duration-150 hover:border-[#EBF0EB]/30 hover:bg-[#253320]/85 active:scale-[0.98]"
          >
            <MapPinIcon className="h-4 w-4 text-[#E2D7B5]" />
            <span>Buka di Google Maps</span>
          </a>
        </section>

        {/* Deskripsi Destinasi */}
        <section className="mt-7">
          <h2 className="mb-2.5 text-[16px] font-bold tracking-tight text-[#EBF0EB] sm:text-[17px]">
            Tentang destinasi
          </h2>
          {paragraphs.length > 0 ? (
            <div className="space-y-3.5 text-[14px] font-normal leading-relaxed text-[#EBF0EB]/90 sm:text-[15px]">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-[#C8D3C8]">
              Deskripsi lengkap destinasi belum tersedia saat ini.
            </p>
          )}
        </section>

        {/* Bagian Galeri Foto Lokasi dengan Interactive Stacked Photo Deck */}
        <section className="mt-7 overflow-hidden rounded-3xl border border-[#EBF0EB]/12 bg-[#233020]/75 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-bold tracking-tight text-[#EBF0EB] sm:text-[17px]">
              Foto lokasi
            </h2>
            {galleryImages.length > 0 && (
              <span className="text-[12px] font-medium tabular-nums text-[#C8D3C8]">
                {galleryImages.length} tersimpan
              </span>
            )}
          </div>

          <PhotoStackDeck
            placeName={place.name}
            images={galleryImages}
            onOpenLightbox={openLightbox}
          />
        </section>
      </div>

      {/* Modal Fullscreen Lightbox Gallery */}
      <PhotoLightboxModal
        isOpen={isLightboxOpen}
        images={galleryImages}
        activeIndex={lightboxIndex}
        placeName={place.name}
        onClose={() => setIsLightboxOpen(false)}
        onChangeIndex={setLightboxIndex}
      />
    </div>
  )
}

export default memo(TouristDetailPage)
