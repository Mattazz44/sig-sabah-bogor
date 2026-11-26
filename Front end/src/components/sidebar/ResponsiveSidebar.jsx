import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from 'framer-motion'
import {
  DESKTOP_BREAKPOINT,
  SHEET_DESKTOP_LEFT,
  getDesktopSidebarWidth,
} from '../ui/sheetMetrics'
import { BottomSheetContext } from '../ui/bottomSheetContext'

// Mobile snap heights:
// - collapsed: hanya handle drag + search bar yang tampil rapi di atas floating BottomNav (~82px)
// - half: 50% tinggi viewport
// - full: 90% tinggi viewport
const MOBILE_COLLAPSED_HEIGHT = 170
const MOBILE_HALF_RATIO = 0.5
const MOBILE_FULL_RATIO = 0.9
const FLICK_VELOCITY_PX_S = 380
const PULL_DOWN_STEP_THRESHOLD = 36
const TAP_DRAG_TOLERANCE_PX = 8

const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 360,
  damping: 34,
  mass: 0.9,
}

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 844 }
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function computeMobileMetrics(viewportHeight) {
  const safeHeight = Math.max(420, viewportHeight)
  const fullHeight = Math.round(safeHeight * MOBILE_FULL_RATIO)
  const halfHeight = Math.round(safeHeight * MOBILE_HALF_RATIO)
  const collapsedHeight = Math.min(halfHeight - 48, MOBILE_COLLAPSED_HEIGHT)

  // Offset Y terhadap posisi penuh (y = 0 -> tinggi 90% layar terlihat dari bawah)
  const fullY = 0
  const halfY = Math.max(0, fullHeight - halfHeight)
  const collapsedY = Math.max(halfY + 48, fullHeight - collapsedHeight)

  return { fullHeight, halfHeight, collapsedHeight, fullY, halfY, collapsedY }
}

/**
 * Wrapper responsif untuk panel daftar destinasi wisata peta:
 * 1. Desktop (>= 768px): Floating left sidebar dark glassmorphism (`backdrop-blur-md`)
 *    dengan tombol toggle panah kecil di sisi kanan luar untuk slide buka/tutup (spring).
 * 2. Mobile (< 768px): Draggable bottom sheet 3 snap points (collapsed, half 50%, full 90%)
 *    non-modal agar drag/zoom peta di belakang & floating BottomNav (z-[600]) tetap bebas.
 */
export default function ResponsiveSidebar({
  id = 'sidebar',
  label = 'Daftar tempat wisata',
  expanded = false,
  onExpandedChange,
  children,
}) {
  const prefersReducedMotion = useReducedMotion()
  const [viewport, setViewport] = useState(getViewportSize)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileSnap, setMobileSnap] = useState(() => (expanded ? 'full' : 'half'))
  const [prevExpandedProp, setPrevExpandedProp] = useState(expanded)

  // Sinkronisasi bila parent mengubah prop `expanded` (mis. memilih marker peta saat sheet penuh)
  if (expanded !== prevExpandedProp) {
    setPrevExpandedProp(expanded)
    setMobileSnap((current) => {
      if (expanded) return 'full'
      return current === 'collapsed' ? 'collapsed' : 'half'
    })
  }

  const isDesktop = viewport.width >= DESKTOP_BREAKPOINT
  const desktopWidth = getDesktopSidebarWidth(viewport.width)
  const desktopClosedX = -(desktopWidth + SHEET_DESKTOP_LEFT)

  const mobileMetrics = useMemo(
    () => computeMobileMetrics(viewport.height),
    [viewport.height],
  )

  const getYForMobileSnap = useCallback(
    (snapName) => {
      if (snapName === 'full') return mobileMetrics.fullY
      if (snapName === 'half') return mobileMetrics.halfY
      return mobileMetrics.collapsedY
    },
    [mobileMetrics.fullY, mobileMetrics.halfY, mobileMetrics.collapsedY],
  )

  const sheetY = useMotionValue(getYForMobileSnap(mobileSnap))
  const dragControls = useDragControls()
  const contentRef = useRef(null)
  const handlePointerStartRef = useRef(null)
  const touchPullRef = useRef(null)
  const isDraggingRef = useRef(false)
  const suppressHandleClickRef = useRef(false)
  const suppressTimerRef = useRef(null)

  const activeTransition = useMemo(
    () => (prefersReducedMotion ? { duration: 0.01 } : SPRING_CONFIG),
    [prefersReducedMotion],
  )

  useEffect(() => {
    const handleResize = () => setViewport(getViewportSize())
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    }
  }, [])

  const prevIsDesktopRef = useRef(isDesktop)

  // Animasikan sheetY ke snap point mobile aktif setiap kali snap atau tinggi layar berubah
  useEffect(() => {
    const switchedToMobile = prevIsDesktopRef.current && !isDesktop
    prevIsDesktopRef.current = isDesktop
    if (isDesktop || isDraggingRef.current) return undefined
    const targetY = getYForMobileSnap(mobileSnap)
    if (switchedToMobile) {
      sheetY.set(targetY)
      return undefined
    }
    const controls = animate(sheetY, targetY, activeTransition)
    return () => controls.stop()
  }, [isDesktop, mobileSnap, getYForMobileSnap, sheetY, activeTransition])

  // Reset scroll internal ke puncak saat mobile sheet dalam mode collapsed agar search bar selalu terlihat
  useEffect(() => {
    if (!isDesktop && mobileSnap === 'collapsed' && contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [isDesktop, mobileSnap])

  const commitMobileSnap = useCallback(
    (nextSnap, velocity = 0) => {
      const nextExpanded = nextSnap === 'full'
      setPrevExpandedProp(nextExpanded)
      setMobileSnap(nextSnap)
      onExpandedChange?.(nextExpanded)

      const targetY = getYForMobileSnap(nextSnap)
      animate(
        sheetY,
        targetY,
        prefersReducedMotion
          ? { duration: 0.01 }
          : {
              ...SPRING_CONFIG,
              velocity: Math.max(-1800, Math.min(1800, velocity)),
            },
      )
    },
    [getYForMobileSnap, onExpandedChange, prefersReducedMotion, sheetY],
  )

  const toggleDesktopOpen = useCallback(() => {
    setDesktopOpen((prev) => {
      const next = !prev
      onExpandedChange?.(next)
      return next
    })
  }, [onExpandedChange])

  const ensurePeekCleared = useCallback(() => {
    if (isDesktop) {
      setDesktopOpen(true)
      onExpandedChange?.(true)
    } else if (mobileSnap === 'collapsed') {
      commitMobileSnap('half')
    }
  }, [isDesktop, mobileSnap, commitMobileSnap, onExpandedChange])

  const sheetContextValue = useMemo(
    () => ({ ensurePeekCleared }),
    [ensurePeekCleared],
  )

  const pickNextSnap = useCallback(
    (currentY, velocityY) => {
      const { fullY, halfY, collapsedY } = mobileMetrics

      // Flick cepat ke atas / bawah langsung berpindah satu tingkat snap point
      if (Math.abs(velocityY) >= FLICK_VELOCITY_PX_S) {
        if (velocityY < 0) {
          return currentY > halfY + 24 ? 'half' : 'full'
        }
        return currentY < halfY - 24 ? 'half' : 'collapsed'
      }

      const candidates = [
        { name: 'full', y: fullY },
        { name: 'half', y: halfY },
        { name: 'collapsed', y: collapsedY },
      ]

      let closest = candidates[0]
      let minDistance = Math.abs(currentY - closest.y)
      for (let i = 1; i < candidates.length; i += 1) {
        const dist = Math.abs(currentY - candidates[i].y)
        if (dist < minDistance) {
          minDistance = dist
          closest = candidates[i]
        }
      }
      return closest.name
    },
    [mobileMetrics],
  )

  const handleDragStart = () => {
    isDraggingRef.current = true
  }

  const handleDragEnd = (_event, info) => {
    isDraggingRef.current = false

    const startPt = handlePointerStartRef.current
    const movedDistance = startPt
      ? Math.hypot(info.offset.x, info.offset.y)
      : Math.abs(info.offset.y)
    handlePointerStartRef.current = null

    if (movedDistance >= TAP_DRAG_TOLERANCE_PX) {
      suppressHandleClickRef.current = true
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
      suppressTimerRef.current = setTimeout(() => {
        suppressHandleClickRef.current = false
      }, 150)
    }

    const nextSnap = pickNextSnap(sheetY.get(), info.velocity.y)
    commitMobileSnap(nextSnap, info.velocity.y)
  }

  const handleHandlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    handlePointerStartRef.current = { x: e.clientX, y: e.clientY }
    dragControls.start(e)
  }

  const handleHandleClick = () => {
    if (suppressHandleClickRef.current) {
      suppressHandleClickRef.current = false
      return
    }
    if (mobileSnap === 'collapsed') {
      commitMobileSnap('half')
    } else if (mobileSnap === 'half') {
      commitMobileSnap('full')
    } else {
      commitMobileSnap('collapsed')
    }
  }

  // Izinkan tarik sheet dari area non-interaktif saat mode collapsed agar mudah dibuka
  const handleContentPointerDown = (e) => {
    if (mobileSnap !== 'collapsed') return
    if (e.button !== undefined && e.button !== 0) return
    if (e.target.closest('input, textarea, select, button, a, [data-no-sheet-drag]')) {
      return
    }
    handlePointerStartRef.current = { x: e.clientX, y: e.clientY }
    dragControls.start(e)
  }

  // Handoff tarik-turun halus hanya saat scroll daftar sudah di puncak (scrollTop <= 0)
  // sehingga scroll daftar wisata di mode half/full tidak pernah bentrok dengan drag sheet
  const handleContentTouchStart = (e) => {
    if (!contentRef.current || !e.touches?.[0]) return
    if (e.target.closest('input, textarea, select, [data-no-sheet-drag]')) {
      touchPullRef.current = null
      return
    }
    touchPullRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      scrollTop: contentRef.current.scrollTop,
    }
  }

  const handleContentTouchMove = (e) => {
    const info = touchPullRef.current
    if (!info || !contentRef.current || !e.touches?.[0]) return
    const dy = e.touches[0].clientY - info.y
    const dx = e.touches[0].clientX - info.x

    // Jika pengguna menggeser horizontal (mis. filter kategori) atau sedang scroll ke bawah, batalkan
    if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
      touchPullRef.current = null
      return
    }

    if (
      info.scrollTop <= 1 &&
      contentRef.current.scrollTop <= 1 &&
      dy > PULL_DOWN_STEP_THRESHOLD &&
      Math.abs(dy) > Math.abs(dx) * 1.4
    ) {
      touchPullRef.current = null
      if (mobileSnap === 'full') {
        commitMobileSnap('half', 420)
      } else if (mobileSnap === 'half') {
        commitMobileSnap('collapsed', 420)
      }
    }
  }

  const handleContentTouchEnd = () => {
    touchPullRef.current = null
  }

  const handleContentFocusCapture = (e) => {
    if (!e.target.closest('input, textarea')) return
    if (isDesktop && !desktopOpen) {
      setDesktopOpen(true)
      onExpandedChange?.(true)
    } else if (!isDesktop && mobileSnap === 'collapsed') {
      commitMobileSnap('half')
    }
  }

  // =========================================================================
  // 1. DESKTOP (>= 768px): Floating Dark Glassmorphism Left Sidebar + External Arrow Toggle
  // =========================================================================
  if (isDesktop) {
    return (
      <BottomSheetContext.Provider value={sheetContextValue}>
        <motion.aside
          id={id}
          aria-label={label}
          data-mode="desktop"
          data-open={desktopOpen ? 'true' : 'false'}
          initial={false}
          animate={{ x: desktopOpen ? 0 : desktopClosedX }}
          transition={activeTransition}
          style={{ width: desktopWidth }}
          className="pointer-events-none fixed top-3 bottom-24 left-3 z-[500] xl:bottom-3 will-change-transform"
        >
          {/* Panel utama floating sidebar dengan dark glassmorphism */}
          <div className="apple-maps-sidebar pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/[0.16] bg-[#161D16]/75 text-white shadow-2xl backdrop-blur-md">
            <div
              ref={contentRef}
              id={`${id}-content`}
              onFocusCapture={handleContentFocusCapture}
              className="no-scrollbar min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pt-2.5 pb-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>
          </div>

          {/* Tombol toggle panah kecil di sisi kanan luar panel */}
          <button
            type="button"
            id={`${id}-desktop-toggle`}
            onClick={toggleDesktopOpen}
            aria-expanded={desktopOpen}
            aria-controls={`${id}-content`}
            aria-label={desktopOpen ? 'Tutup panel daftar wisata' : 'Buka panel daftar wisata'}
            title={desktopOpen ? 'Tutup panel wisata' : 'Buka panel wisata'}
            className="apple-maps-sidebar pointer-events-auto absolute top-1/2 left-full z-10 ml-2 flex h-11 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border border-white/[0.2] bg-[#161D16]/85 text-[#F5F2EB] shadow-xl backdrop-blur-md transition-colors duration-150 hover:border-[#DFAA63]/55 hover:bg-[#1E281E]/95 hover:text-[#DFAA63] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DFAA63] active:scale-[0.95]"
          >
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              initial={false}
              animate={{ rotate: desktopOpen ? 0 : 180 }}
              transition={activeTransition}
            >
              <polyline points="15 18 9 12 15 6" />
            </motion.svg>
          </button>
        </motion.aside>
      </BottomSheetContext.Provider>
    )
  }

  // =========================================================================
  // 2. MOBILE (< 768px): Draggable Bottom Sheet 3 Snap Points (Collapsed / 50% / 90%)
  // =========================================================================
  const canScrollList = mobileSnap !== 'collapsed'
  const mobileBottomPaddingPx =
    mobileSnap === 'half' ? mobileMetrics.halfY + 112 : 112
  const handleAriaLabel =
    mobileSnap === 'full'
      ? 'Tarik ke bawah atau ketuk untuk melipat daftar wisata'
      : 'Tarik ke atas atau ketuk untuk memperluas daftar wisata'

  return (
    <BottomSheetContext.Provider value={sheetContextValue}>
      <motion.section
        id={id}
        aria-label={label}
        data-mode="mobile"
        data-snap={mobileSnap}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: mobileMetrics.fullY, bottom: mobileMetrics.collapsedY }}
        dragElastic={{ top: 0.08, bottom: 0.14 }}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          y: sheetY,
          height: mobileMetrics.fullHeight,
        }}
        className="apple-maps-sidebar pointer-events-auto fixed inset-x-0 bottom-0 z-[500] flex w-full flex-col rounded-t-[28px] border-t border-white/[0.18] bg-[#161D16]/82 text-white shadow-[0_-16px_44px_-8px_rgba(0,0,0,0.62)] backdrop-blur-md will-change-transform"
      >
        {/* Area pegangan drag khusus (terpisah dari scroll list agar gestur tidak bentrok) */}
        <div
          id={`${id}-handle-container`}
          onPointerDown={handleHandlePointerDown}
          style={{ touchAction: 'none' }}
          className="flex w-full shrink-0 cursor-grab items-center justify-center pt-3 pb-2 select-none active:cursor-grabbing"
        >
          <button
            type="button"
            id={`${id}-handle-button`}
            onClick={handleHandleClick}
            aria-label={handleAriaLabel}
            aria-expanded={mobileSnap !== 'collapsed'}
            className="flex h-6 w-28 cursor-grab items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DFAA63] active:cursor-grabbing"
          >
            <span
              id={`${id}-handle`}
              aria-hidden="true"
              className={`h-1.5 rounded-full bg-white/85 transition-[width,opacity] duration-200 ${
                mobileSnap === 'full'
                  ? 'w-14 opacity-75'
                  : mobileSnap === 'half'
                    ? 'w-16 opacity-90'
                    : 'w-20 opacity-100'
              }`}
            />
          </button>
        </div>

        {/* Konten daftar wisata dengan isolasi scroll internal (tidak bentrok dengan drag sheet & aman di atas BottomNav) */}
        <div
          ref={contentRef}
          id={`${id}-content`}
          onPointerDown={handleContentPointerDown}
          onTouchStart={handleContentTouchStart}
          onTouchMove={handleContentTouchMove}
          onTouchEnd={handleContentTouchEnd}
          onTouchCancel={handleContentTouchEnd}
          onFocusCapture={handleContentFocusCapture}
          className={`no-scrollbar min-h-0 w-full flex-1 overscroll-contain ${
            canScrollList ? 'overflow-x-hidden overflow-y-auto' : 'overflow-hidden'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: canScrollList ? 'pan-y' : 'none',
            paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${mobileBottomPaddingPx}px)`,
          }}
        >
          {children}
        </div>
      </motion.section>
    </BottomSheetContext.Provider>
  )
}
