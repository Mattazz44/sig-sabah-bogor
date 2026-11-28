import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from 'framer-motion'
import {
  DESKTOP_BREAKPOINT,
  SHEET_DESKTOP_LEFT,
  getDesktopSidebarWidth,
} from '../ui/sheetMetrics'
import { BottomSheetContext } from '../ui/bottomSheetContext'
import ScrollToTopButton from '../ui/ScrollToTopButton'
import { usePreferences } from '../../utils/preferences'

// Mobile 2-state metrics:
// - expanded: melebar penuh edge-to-edge hingga menyentuh bagian atas layar (top: 0 / 100dvh)
// - minimized: hanya menyisakan drag handle + search bar di atas floating BottomNav (~82px)
const MOBILE_TOP_GAP_RATIO = 0
const MOBILE_MINIMIZED_HEIGHT = 168
const SWIPE_OFFSET_THRESHOLD_PX = 40
const SWIPE_VELOCITY_THRESHOLD_PX_S = 300
const PULL_DOWN_STEP_THRESHOLD = 40
const TAP_DRAG_TOLERANCE_PX = 8

const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 844 }
  }
  return {
    width: Math.round(window.visualViewport?.width || window.innerWidth),
    height: Math.round(window.visualViewport?.height || window.innerHeight),
  }
}

function computeMobileMetrics(viewportHeight) {
  const safeHeight = Math.max(420, viewportHeight)
  const topOffset = Math.round(safeHeight * MOBILE_TOP_GAP_RATIO) // top: 0 (full 100dvh)
  const expandedHeight = Math.max(320, safeHeight - topOffset)
  const minimizedHeight = Math.min(expandedHeight - 80, MOBILE_MINIMIZED_HEIGHT)

  // Offset Y terhadap posisi expanded (y = 0 -> top: 0, tinggi penuh 100dvh)
  const expandedY = 0
  const minimizedY = Math.max(0, expandedHeight - minimizedHeight)

  return { topOffset, expandedHeight, minimizedHeight, expandedY, minimizedY }
}

/**
 * Wrapper responsif untuk panel daftar destinasi wisata peta:
 * 1. Desktop (>= 768px): Floating left sidebar dark glassmorphism (`backdrop-blur-md`)
 *    dengan tombol toggle panah kecil di sisi kanan luar untuk slide buka/tutup (spring).
 * 2. Mobile (< 768px): Draggable bottom sheet 2 state (`expanded` top 6% & `minimized`)
 *    dengan `overflow-hidden` anti-bocor, drag handle terpisah dari scroll list,
 *    serta auto-minimize saat interaksi peta/marker.
 */
export default function ResponsiveSidebar({
  id = 'sidebar',
  label,
  expanded = false,
  onExpandedChange,
  children,
}) {
  const { t } = usePreferences()
  const resolvedLabel = label || t('explore.sidebarLabel')
  const prefersReducedMotion = useReducedMotion()
  const [viewport, setViewport] = useState(getViewportSize)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileState, setMobileState] = useState(() => (expanded ? 'expanded' : 'minimized'))
  const [prevExpandedProp, setPrevExpandedProp] = useState(expanded)

  // Sinkronisasi langsung ketika parent mengubah prop `expanded` (termasuk `minimizeSheet()`)
  if (expanded !== prevExpandedProp) {
    setPrevExpandedProp(expanded)
    setMobileState(expanded ? 'expanded' : 'minimized')
  }

  const isDesktop = viewport.width >= DESKTOP_BREAKPOINT
  const desktopWidth = getDesktopSidebarWidth(viewport.width)
  const desktopClosedX = -(desktopWidth + SHEET_DESKTOP_LEFT)

  const mobileMetrics = useMemo(
    () => computeMobileMetrics(viewport.height),
    [viewport.height],
  )

  const getYForMobileState = useCallback(
    (stateName) => (stateName === 'expanded' ? mobileMetrics.expandedY : mobileMetrics.minimizedY),
    [mobileMetrics.expandedY, mobileMetrics.minimizedY],
  )

  const sheetY = useMotionValue(getYForMobileState(mobileState))
  const dragControls = useDragControls()
  const contentRef = useRef(null)
  const prevIsDesktopRef = useRef(isDesktop)
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
    window.addEventListener('orientationchange', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    }
  }, [])

  // Animasikan sheetY ke posisi target mobile setiap kali state atau ukuran viewport berubah
  useEffect(() => {
    const switchedToMobile = prevIsDesktopRef.current && !isDesktop
    prevIsDesktopRef.current = isDesktop
    if (isDesktop || isDraggingRef.current) return undefined

    const targetY = getYForMobileState(mobileState)
    if (switchedToMobile) {
      sheetY.set(targetY)
      return undefined
    }
    const controls = animate(sheetY, targetY, activeTransition)
    return () => controls.stop()
  }, [isDesktop, mobileState, getYForMobileState, sheetY, activeTransition])

  // Reset scroll internal ke puncak saat sheet turun ke mode minimized agar search bar selalu terlihat
  useEffect(() => {
    if (!isDesktop && mobileState === 'minimized' && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [isDesktop, mobileState])

  const commitMobileState = useCallback(
    (nextState, velocity = 0) => {
      const nextExpanded = nextState === 'expanded'
      setPrevExpandedProp(nextExpanded)
      setMobileState(nextState)
      onExpandedChange?.(nextExpanded)

      const targetY = getYForMobileState(nextState)
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
    [getYForMobileState, onExpandedChange, prefersReducedMotion, sheetY],
  )

  const minimizeSheet = useCallback(() => {
    if (!isDesktop && mobileState !== 'minimized') {
      commitMobileState('minimized')
    }
  }, [isDesktop, mobileState, commitMobileState])

  const toggleDesktopOpen = useCallback(() => {
    setDesktopOpen((prev) => !prev)
  }, [])

  const ensurePeekCleared = useCallback(() => {
    if (isDesktop) {
      setDesktopOpen(true)
    } else if (mobileState === 'minimized') {
      commitMobileState('expanded')
    }
  }, [isDesktop, mobileState, commitMobileState])

  const sheetContextValue = useMemo(
    () => ({ ensurePeekCleared, minimizeSheet, scrollContainerRef: contentRef }),
    [ensurePeekCleared, minimizeSheet],
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

    // Aturan swipe up / swipe down tegas (2 state saja)
    if (info.offset.y < -SWIPE_OFFSET_THRESHOLD_PX || info.velocity.y < -SWIPE_VELOCITY_THRESHOLD_PX_S) {
      commitMobileState('expanded', info.velocity.y)
      return
    }
    if (info.offset.y > SWIPE_OFFSET_THRESHOLD_PX || info.velocity.y > SWIPE_VELOCITY_THRESHOLD_PX_S) {
      commitMobileState('minimized', info.velocity.y)
      return
    }

    // Jika geseran kecil tanpa velocity tinggi, snap ke posisi terdekat
    const currentY = sheetY.get()
    const midpoint = mobileMetrics.minimizedY / 2
    commitMobileState(currentY < midpoint ? 'expanded' : 'minimized', info.velocity.y)
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
    commitMobileState(mobileState === 'expanded' ? 'minimized' : 'expanded')
  }

  // Saat mode minimized, tarik dari area non-input di header search bar juga bisa mengangkat sheet
  const handleContentPointerDown = (e) => {
    if (mobileState !== 'minimized') return
    if (e.button !== undefined && e.button !== 0) return
    if (e.target.closest('input, textarea, select, button, a, [data-no-sheet-drag]')) {
      return
    }
    handlePointerStartRef.current = { x: e.clientX, y: e.clientY }
    dragControls.start(e)
  }

  // Handoff pull-down saat daftar sudah berada di puncak (scrollTop <= 0) tanpa mengganggu scroll list
  const handleContentTouchStart = (e) => {
    if (mobileState !== 'expanded' || !contentRef.current || !e.touches?.[0]) return
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
      commitMobileState('minimized', 350)
    }
  }

  const handleContentTouchEnd = () => {
    touchPullRef.current = null
  }

  const handleContentFocusCapture = (e) => {
    if (!e.target.closest('input, textarea')) return
    if (isDesktop && !desktopOpen) {
      setDesktopOpen(true)
    } else if (!isDesktop && mobileState === 'minimized') {
      commitMobileState('expanded')
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
          aria-label={resolvedLabel}
          data-mode="desktop"
          data-open={desktopOpen ? 'true' : 'false'}
          initial={false}
          animate={{ x: desktopOpen ? 0 : desktopClosedX }}
          transition={activeTransition}
          style={{ width: desktopWidth }}
          className="pointer-events-none fixed top-3 bottom-24 left-3 z-[500] xl:bottom-3 will-change-transform"
        >
          {/* Panel utama floating sidebar dengan dark glassmorphism */}
          <div className="apple-maps-sidebar pointer-events-auto relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/[0.16] bg-[#161D16]/75 text-white shadow-2xl backdrop-blur-md">
            <div
              ref={contentRef}
              id={`${id}-content`}
              onFocusCapture={handleContentFocusCapture}
              className="no-scrollbar scroll-smooth min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>

            <ScrollToTopButton
              scrollContainerRef={contentRef}
              hidden={!desktopOpen}
              className="absolute right-5 bottom-6 z-30"
            />
          </div>

          {/* Tombol toggle panah kecil di sisi kanan luar panel */}
          <button
            type="button"
            id={`${id}-desktop-toggle`}
            onClick={toggleDesktopOpen}
            aria-expanded={desktopOpen}
            aria-controls={`${id}-content`}
            aria-label={desktopOpen ? t('explore.closeSidebarAria') : t('explore.openSidebarAria')}
            title={desktopOpen ? t('explore.closeSidebarTitle') : t('explore.openSidebarTitle')}
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
  // 2. MOBILE (< 768px): Draggable Bottom Sheet 2 State (expanded top 0 full / minimized)
  // =========================================================================
  const isExpandedMobile = mobileState === 'expanded'
  const handleAriaLabel = isExpandedMobile
    ? t('explore.sheetCollapseAria')
    : t('explore.sheetExpandAria')

  return (
    <BottomSheetContext.Provider value={sheetContextValue}>
      <motion.section
        id={id}
        aria-label={resolvedLabel}
        data-mode="mobile"
        data-snap={mobileState}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: mobileMetrics.expandedY, bottom: mobileMetrics.minimizedY }}
        dragElastic={{ top: 0, bottom: 0.12 }}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          y: sheetY,
          height: mobileMetrics.expandedHeight,
        }}
        className={`apple-maps-sidebar pointer-events-auto fixed inset-x-0 bottom-0 left-0 right-0 z-[500] m-0 flex w-full max-w-full flex-col overflow-hidden p-0 text-white backdrop-blur-md transition-[border-radius,background-color] duration-200 will-change-transform ${
          isExpandedMobile
            ? 'rounded-none border-t-0 bg-[#161D16]/95 shadow-none'
            : 'rounded-t-[28px] border-t border-white/[0.18] bg-[#161D16]/85 shadow-[0_-16px_44px_-8px_rgba(0,0,0,0.62)]'
        }`}
      >
        {/* Area drag handle khusus di bagian atas (terpisah penuh dari scrollable list agar card/gambar tidak bocor) */}
        <div
          id={`${id}-handle-container`}
          onPointerDown={handleHandlePointerDown}
          style={{
            touchAction: 'none',
            paddingTop: isExpandedMobile ? 'calc(env(safe-area-inset-top, 0px) + 12px)' : '12px',
          }}
          className={`relative z-10 flex w-full shrink-0 cursor-grab items-center justify-center pb-2 select-none active:cursor-grabbing ${
            isExpandedMobile ? 'bg-[#161D16]/95' : 'bg-[#161D16]/70'
          }`}
        >
          <button
            type="button"
            id={`${id}-handle-button`}
            onClick={handleHandleClick}
            aria-label={handleAriaLabel}
            aria-expanded={isExpandedMobile}
            className="flex h-6 w-28 cursor-grab items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DFAA63] active:cursor-grabbing"
          >
            <span
              id={`${id}-handle`}
              aria-hidden="true"
              className={`h-1.5 rounded-full bg-white/85 transition-[width,opacity] duration-200 ${
                isExpandedMobile ? 'w-14 opacity-80' : 'w-20 opacity-100'
              }`}
            />
          </button>
        </div>

        {/* Kontainer scrollable list terisolasi di bawah handle (overflow-y-auto flex-1 min-h-0) */}
        <div
          ref={contentRef}
          id={`${id}-content`}
          onPointerDown={handleContentPointerDown}
          onTouchStart={handleContentTouchStart}
          onTouchMove={handleContentTouchMove}
          onTouchEnd={handleContentTouchEnd}
          onTouchCancel={handleContentTouchEnd}
          onFocusCapture={handleContentFocusCapture}
          className={`no-scrollbar scroll-smooth relative z-0 min-h-0 w-full overscroll-contain ${
            isExpandedMobile
              ? 'flex-1 overflow-x-hidden overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+112px)]'
              : 'max-h-[54px] shrink-0 overflow-hidden pb-0'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: isExpandedMobile ? 'pan-y' : 'none',
          }}
        >
          {children}
        </div>

        <ScrollToTopButton
          scrollContainerRef={contentRef}
          hidden={!isExpandedMobile}
          className="absolute right-4 bottom-24 z-40"
        />
      </motion.section>
    </BottomSheetContext.Provider>
  )
}
