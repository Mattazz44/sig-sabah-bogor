import { useCallback, useEffect, useRef, useState } from 'react'
import { getPeekHeight } from './sheetMetrics'

const DRAG_THRESHOLD = 6 // px before pointer click becomes drag
const FLICK_VELOCITY = 0.35 // px/ms
const PULL_DOWN_THRESHOLD = 40 // px pulled down while at top of scroll

/**
 * Mobile-First Google Maps style Bottom Sheet / Drawer.
 * - Collapsed (Peek mode): peeks at the bottom showing search bar, categories, and top of first card (~44% of screen). Background map is visible.
 * - Expanded (Full Screen mode): extends 100% to the top (h-screen / max-h-screen, translateY = 0), completely covering the map in the background.
 * - Content scrolls independently (overflow-y-auto) when full screen.
 * - When scrolled back to top (scrollTop <= 0) and pulled down, collapses smoothly back to peek position.
 */
export default function BottomSheet({ id, label, expanded, onExpandedChange, children }) {
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 844,
  )
  const [dragY, setDragY] = useState(null)
  const scrollTopRef = useRef(0)

  const contentRef = useRef(null)
  const dragInfo = useRef(null)
  const touchStartInfo = useRef(null)
  const isDragging = dragY !== null

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // When sheet collapses, smoothly reset internal scroll to top
  useEffect(() => {
    if (!expanded && contentRef.current) {
      contentRef.current.scrollTop = 0
      scrollTopRef.current = 0
    }
  }, [expanded])

  // Positions:
  // Collapsed: sits at bottom covering peekHeight (approx 44% of viewport)
  const peekHeight = getPeekHeight(viewportHeight)
  const collapsedY = Math.max(0, viewportHeight - peekHeight)
  // Full screen: exactly 0px from top, completely covering the map
  const expandedY = 0

  const targetY = expanded ? expandedY : collapsedY
  const currentY = dragY !== null ? dragY : targetY

  const clamp = useCallback(
    (val) => Math.min(Math.max(val, expandedY), collapsedY),
    [expandedY, collapsedY],
  )

  // Handle scroll on the container
  const handleScroll = (e) => {
    const st = e.currentTarget.scrollTop
    scrollTopRef.current = st
    // If user starts scrolling down and not yet full screen, force full screen
    if (st > 4 && !expanded) {
      onExpandedChange(true)
    }
  }

  // Pointer drag handling (mouse and touch on handle or non-scroll areas)
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    const isTouch = e.pointerType === 'touch'
    const scrollContainer = contentRef.current

    // If already expanded in full screen and pointer is inside scrollable area:
    // Only allow drag if scrolled to the very top and moving down
    if (expanded && scrollContainer && scrollContainer.contains(e.target)) {
      if (scrollContainer.scrollTop > 2) {
        return // Let native scroll handle it
      }
    }

    dragInfo.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      baseY: currentY,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
      hasMoved: false,
      isTouch,
    }
  }

  const handlePointerMove = (e) => {
    const info = dragInfo.current
    if (!info || info.pointerId !== e.pointerId) return

    const deltaY = e.clientY - info.startY
    if (!info.hasMoved) {
      if (Math.abs(deltaY) < DRAG_THRESHOLD) return
      // If expanded full screen and dragging up inside list, abort drag and let list scroll
      if (expanded && deltaY < 0) {
        dragInfo.current = null
        return
      }
      info.hasMoved = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    const dt = e.timeStamp - info.lastTime
    if (dt > 0) {
      info.velocity = (e.clientY - info.lastY) / dt
    }
    info.lastY = e.clientY
    info.lastTime = e.timeStamp

    const nextY = clamp(info.baseY + deltaY)
    setDragY(nextY)
  }

  const handlePointerUp = () => {
    const info = dragInfo.current
    dragInfo.current = null
    if (!info || !info.hasMoved) {
      setDragY(null)
      return
    }

    const finalY = currentY
    const midPoint = (collapsedY + expandedY) / 2
    let nextExpanded = expanded

    // Flick gesture or position past midpoint
    if (Math.abs(info.velocity) > FLICK_VELOCITY) {
      nextExpanded = info.velocity < 0
    } else {
      nextExpanded = finalY < midPoint
    }

    setDragY(null)
    onExpandedChange(nextExpanded)
  }

  const handlePointerCancel = () => {
    dragInfo.current = null
    setDragY(null)
  }

  // Wheel interaction: scroll down expands to fullscreen, scroll up at top collapses
  const handleWheel = (e) => {
    if (!expanded && e.deltaY > 0) {
      onExpandedChange(true)
    } else if (expanded && e.deltaY < -20 && (contentRef.current?.scrollTop ?? 0) <= 0) {
      onExpandedChange(false)
    }
  }

  // Touch gesture for pulling down to collapse when at top
  const handleTouchStart = (e) => {
    if (!contentRef.current) return
    touchStartInfo.current = {
      y: e.touches[0].clientY,
      scrollTop: contentRef.current.scrollTop,
    }
  }

  const handleTouchMove = (e) => {
    const info = touchStartInfo.current
    if (!info || !expanded || !contentRef.current) return

    // If at top of scroll and pulling down, trigger collapse
    if (info.scrollTop <= 0) {
      const dy = e.touches[0].clientY - info.y
      if (dy > PULL_DOWN_THRESHOLD) {
        touchStartInfo.current = null
        onExpandedChange(false)
      }
    }
  }

  return (
    <section
      id={id}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`fixed inset-x-0 bottom-0 z-[500] flex flex-col bg-forest-900 text-white shadow-[0_-8px_32px_rgba(0,0,0,0.36)] md:right-auto md:left-6 md:w-[420px] ${
        isDragging
          ? ''
          : 'transition-[transform,border-radius] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]'
      } ${expanded ? 'rounded-none' : 'rounded-t-[32px]'}`}
      style={{
        top: 0,
        height: '100dvh',
        transform: `translate3d(0, ${currentY}px, 0)`,
        touchAction: expanded ? 'pan-y' : 'none',
      }}
    >
      {/* Top drag handle header bar */}
      <div
        id={`${id}-handle-container`}
        className={`flex w-full shrink-0 cursor-grab items-center justify-center active:cursor-grabbing transition-all ${
          expanded ? 'pt-4 pb-2' : 'pt-3 pb-2'
        }`}
        onClick={() => onExpandedChange(!expanded)}
      >
        <div
          id={`${id}-handle`}
          className={`h-1.5 rounded-full bg-white/90 transition-all duration-300 hover:bg-white ${
            expanded ? 'w-16 opacity-75' : 'w-24 opacity-100'
          }`}
          title={expanded ? 'Tarik atau klik untuk menutup' : 'Tarik atau klik untuk memperbesar'}
        />
      </div>

      {/* Sheet content area with independent scroll */}
      <div
        ref={contentRef}
        id={`${id}-content`}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={`no-scrollbar flex-1 overscroll-contain ${
          expanded ? 'overflow-y-auto' : 'overflow-hidden'
        } pb-[96px]`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: expanded ? 'pan-y' : 'none',
        }}
      >
        {children}
      </div>
    </section>
  )
}
