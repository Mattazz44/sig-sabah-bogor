import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DESKTOP_BREAKPOINT, getPeekHeight } from './sheetMetrics'
import { BottomSheetContext } from './bottomSheetContext'

const DRAG_THRESHOLD = 12 // px vertical before tap becomes drag
const FLICK_VELOCITY = 0.35 // px/ms
const PULL_DOWN_THRESHOLD = 36 // px pulled down while at top of scroll
const DESKTOP_COLLAPSED_HEIGHT = 112 // px exposed at bottom-left on desktop (handle bar + SearchBar)
const SPRING_STIFFNESS = 300 // ~300-340ms gentle ease-out spring settling
const SPRING_DAMPING = 32

function computeSnapPositions(viewportHeight) {
  const peekHeight = getPeekHeight(viewportHeight)
  const peekY = Math.max(0, viewportHeight - peekHeight)
  const rawHalfY = Math.round(viewportHeight * 0.34)
  const halfY = Math.max(0, Math.min(rawHalfY, Math.max(0, peekY - 84)))
  const fullY = 0
  return { peekY, halfY, fullY }
}

function computeDesktopCollapsedY(viewportHeight) {
  return Math.max(0, viewportHeight - DESKTOP_COLLAPSED_HEIGHT)
}

function clampWithRubberBand(rawY, minY, maxY) {
  if (rawY < minY) {
    return minY + (rawY - minY) * 0.2
  }
  if (rawY > maxY) {
    return maxY + (rawY - maxY) * 0.25
  }
  return rawY
}

/**
 * Bottom Sheet 3 snap point di mobile (peek, half, full) sekaligus
 * Collapsible Left Sidebar di desktop (expanded / collapsed ke bar pencarian)
 * dengan tracking 1:1 dan animasi spring 60fps via requestAnimationFrame.
 */
export default function BottomSheet({ id, label, expanded, onExpandedChange, children }) {
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  }))
  const [snap, setSnap] = useState(() => (expanded ? 'full' : 'peek'))
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [prevExpandedProp, setPrevExpandedProp] = useState(expanded)

  // Sinkronisasi bersih jika parent mengubah prop `expanded` secara eksplisit
  if (expanded !== prevExpandedProp) {
    setPrevExpandedProp(expanded)
    setSnap(expanded ? 'full' : 'peek')
  }

  const sheetRef = useRef(null)
  const contentRef = useRef(null)
  const dragInfo = useRef(null)
  const touchPullInfo = useRef(null)
  const suppressClickRef = useRef(false)
  const suppressTimerRef = useRef(null)
  const pendingVelocityRef = useRef(0)

  const isDesktop = viewportSize.width >= DESKTOP_BREAKPOINT
  const viewportHeight = viewportSize.height
  const { peekY, halfY, fullY } = computeSnapPositions(viewportHeight)
  const desktopCollapsedY = computeDesktopCollapsedY(viewportHeight)

  const getYForSnap = useCallback(
    (targetSnap) => {
      if (targetSnap === 'full') return fullY
      if (targetSnap === 'half') return halfY
      return peekY
    },
    [fullY, halfY, peekY],
  )

  const getTargetY = useCallback(() => {
    if (isDesktop) {
      return desktopCollapsed ? desktopCollapsedY : 0
    }
    return getYForSnap(snap)
  }, [isDesktop, desktopCollapsed, desktopCollapsedY, getYForSnap, snap])

  const animRef = useRef({
    y: getTargetY(),
    v: 0,
    rafId: null,
  })

  const applyTransform = useCallback((y) => {
    animRef.current.y = y
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
    }
  }, [])

  const stopAnimation = useCallback(() => {
    if (animRef.current.rafId !== null) {
      cancelAnimationFrame(animRef.current.rafId)
      animRef.current.rafId = null
    }
  }, [])

  const animateTo = useCallback(
    (targetY, initialVelocityPxPerMs = 0) => {
      stopAnimation()

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

      if (prefersReducedMotion) {
        animRef.current.v = 0
        applyTransform(targetY)
        return
      }

      // Clamp initial throw velocity agar tetap responsif namun tidak memantul ekstrem
      const clampedVel = Math.max(-2400, Math.min(2400, initialVelocityPxPerMs * 1000))
      animRef.current.v = clampedVel

      let lastTime = performance.now()
      const step = (now) => {
        const dt = Math.min(0.032, Math.max(0.001, (now - lastTime) / 1000))
        lastTime = now

        const currY = animRef.current.y
        const currV = animRef.current.v
        const displacement = currY - targetY
        const accel = -SPRING_STIFFNESS * displacement - SPRING_DAMPING * currV
        const nextV = currV + accel * dt
        const nextY = currY + nextV * dt

        if (Math.abs(targetY - nextY) < 0.45 && Math.abs(nextV) < 10) {
          animRef.current.v = 0
          animRef.current.rafId = null
          applyTransform(targetY)
          return
        }

        animRef.current.v = nextV
        applyTransform(nextY)
        animRef.current.rafId = requestAnimationFrame(step)
      }

      animRef.current.rafId = requestAnimationFrame(step)
    },
    [applyTransform, stopAnimation],
  )

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      stopAnimation()
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    }
  }, [stopAnimation])

  // Jalankan spring setiap kali target posisi atau ukuran viewport berubah saat tidak sedang drag
  useLayoutEffect(() => {
    if (dragInfo.current?.hasMoved) return
    const initialVel = pendingVelocityRef.current
    pendingVelocityRef.current = 0
    animateTo(getTargetY(), initialVel)
  }, [getTargetY, animateTo])

  // Reset scroll internal ke atas saat sheet dilipat agar search bar selalu terlihat penuh
  useEffect(() => {
    const isCollapsedNow = isDesktop ? desktopCollapsed : snap === 'peek'
    if (isCollapsedNow && contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [isDesktop, desktopCollapsed, snap])

  const commitDesktopCollapsed = useCallback(
    (nextCollapsed, velocityPxPerMs = 0) => {
      const targetY = nextCollapsed ? desktopCollapsedY : 0
      if (nextCollapsed === desktopCollapsed) {
        pendingVelocityRef.current = 0
        animateTo(targetY, velocityPxPerMs)
      } else {
        pendingVelocityRef.current = velocityPxPerMs
        setDesktopCollapsed(nextCollapsed)
      }
      onExpandedChange?.(!nextCollapsed)
    },
    [desktopCollapsed, desktopCollapsedY, animateTo, onExpandedChange],
  )

  const commitSnap = useCallback(
    (nextSnap, velocityPxPerMs = 0) => {
      const nextExpanded = nextSnap === 'full'
      setPrevExpandedProp(nextExpanded)
      if (nextSnap === snap) {
        pendingVelocityRef.current = 0
        animateTo(getYForSnap(nextSnap), velocityPxPerMs)
      } else {
        pendingVelocityRef.current = velocityPxPerMs
        setSnap(nextSnap)
      }
      onExpandedChange?.(nextExpanded)
    },
    [snap, animateTo, getYForSnap, onExpandedChange],
  )

  const scheduleSuppressReset = useCallback(() => {
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    suppressTimerRef.current = setTimeout(() => {
      suppressClickRef.current = false
    }, 120)
  }, [])

  const pickNearestSnap = useCallback(
    (finalY, velocity) => {
      const snaps = [
        { name: 'full', y: fullY },
        { name: 'half', y: halfY },
        { name: 'peek', y: peekY },
      ]

      // Flick ke atas / ke bawah memindahkan ke snap berikutnya secara intuitif
      if (Math.abs(velocity) > FLICK_VELOCITY) {
        if (velocity < 0) {
          if (finalY > halfY + 24) return 'half'
          return 'full'
        }
        if (finalY < halfY - 24) return 'half'
        return 'peek'
      }

      // Pilih snap point terdekat berdasarkan posisi akhir
      let closest = snaps[0]
      let minDist = Math.abs(finalY - closest.y)
      for (let i = 1; i < snaps.length; i += 1) {
        const dist = Math.abs(finalY - snaps[i].y)
        if (dist < minDist) {
          minDist = dist
          closest = snaps[i]
        }
      }
      return closest.name
    },
    [fullY, halfY, peekY],
  )

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return

    // Jangan pernah ganggu input form atau kontrol dropdown/filter melayang
    if (e.target.closest('input, textarea, select, [data-no-sheet-drag]')) {
      return
    }

    const scrollContainer = contentRef.current
    const fromHandle = Boolean(e.target.closest(`#${id}-handle-container`))
    const inContent = Boolean(scrollContainer && scrollContainer.contains(e.target))

    if (isDesktop) {
      // Di desktop, klik/geser mouse pada kartu daftar tidak menarik sidebar agar seleksi & klik aman
      if (!fromHandle && !desktopCollapsed && e.pointerType === 'mouse') {
        return
      }
      if (!fromHandle && !desktopCollapsed && inContent && (scrollContainer?.scrollTop ?? 0) > 2) {
        return
      }
    } else if (!fromHandle && snap === 'full' && inContent && (scrollContainer?.scrollTop ?? 0) > 2) {
      // Di mobile mode full saat konten sedang ter-scroll di bawah, biarkan native vertical scroll bekerja
      return
    }

    stopAnimation()

    dragInfo.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseY: animRef.current.y,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
      hasMoved: false,
      fromHandle,
    }
  }

  const handlePointerMove = (e) => {
    const info = dragInfo.current
    if (!info || info.pointerId !== e.pointerId) return

    const deltaX = e.clientX - info.startX
    const deltaY = e.clientY - info.startY

    if (!info.hasMoved) {
      // Batalkan drag sheet jika pengguna melakukan swipe horizontal (mis. filter kategori)
      if (!info.fromHandle && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        dragInfo.current = null
        return
      }

      if (Math.abs(deltaY) < DRAG_THRESHOLD) return

      const isExpandedAtTop = isDesktop ? !desktopCollapsed : snap === 'full'
      // Saat panel penuh dengan konten di puncak, drag ke atas menjadi native scroll
      if (!info.fromHandle && isExpandedAtTop && deltaY < 0) {
        dragInfo.current = null
        return
      }

      // Jangan lock drag jika gerakan tidak cukup vertikal
      if (!info.fromHandle && Math.abs(deltaY) <= Math.abs(deltaX) * 1.25) {
        return
      }

      info.hasMoved = true
      suppressClickRef.current = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // abaikan bila target tidak mendukung capture
      }
    }

    const dt = e.timeStamp - info.lastTime
    if (dt > 0) {
      // Exponential smoothing ringan agar velocity release stabil
      const instVelocity = (e.clientY - info.lastY) / dt
      info.velocity = info.velocity * 0.4 + instVelocity * 0.6
    }
    info.lastY = e.clientY
    info.lastTime = e.timeStamp

    const maxDragY = isDesktop ? desktopCollapsedY : peekY
    applyTransform(clampWithRubberBand(info.baseY + deltaY, fullY, maxDragY))
  }

  const finishDrag = (e) => {
    const info = dragInfo.current
    if (!info || (e && info.pointerId !== e.pointerId)) return
    dragInfo.current = null

    if (!info.hasMoved) {
      suppressClickRef.current = false
      return
    }

    scheduleSuppressReset()
    try {
      if (e?.currentTarget?.hasPointerCapture?.(info.pointerId)) {
        e.currentTarget.releasePointerCapture(info.pointerId)
      }
    } catch {
      // abaikan
    }

    if (isDesktop) {
      const shouldCollapse =
        Math.abs(info.velocity) > 0.3
          ? info.velocity > 0
          : animRef.current.y >= desktopCollapsedY * 0.42
      commitDesktopCollapsed(shouldCollapse, info.velocity)
      return
    }

    const nextSnap = pickNearestSnap(animRef.current.y, info.velocity)
    commitSnap(nextSnap, info.velocity)
  }

  const handlePointerCancel = () => {
    const info = dragInfo.current
    dragInfo.current = null
    suppressClickRef.current = false
    if (info?.hasMoved) {
      animateTo(getTargetY(), 0)
    }
  }

  // Blokir click sintetis sesaat setelah drag nyata terjadi
  const handleClickCapture = (e) => {
    if (suppressClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClickRef.current = false
    }
  }

  // Interaksi mouse wheel di mobile saja agar wheel scrolling di desktop tidak melipat panel tanpa sengaja
  const handleWheel = (e) => {
    if (isDesktop) return
    if (snap === 'peek' && e.deltaY > 18) {
      commitSnap('half')
    } else if (snap === 'half' && e.deltaY > 18) {
      commitSnap('full')
    } else if (snap === 'half' && e.deltaY < -20) {
      commitSnap('peek')
    } else if (snap === 'full' && e.deltaY < -24 && (contentRef.current?.scrollTop ?? 0) <= 0) {
      commitSnap('half')
    }
  }

  // Fallback touch pull-down saat berada di puncak daftar mode penuh (mobile & layar sentuh)
  const handleTouchStart = (e) => {
    if (!contentRef.current || !e.touches?.[0]) return
    touchPullInfo.current = {
      y: e.touches[0].clientY,
      x: e.touches[0].clientX,
      scrollTop: contentRef.current.scrollTop,
    }
  }

  const handleTouchMove = (e) => {
    const info = touchPullInfo.current
    if (!info || !contentRef.current || !e.touches?.[0]) return
    const dy = e.touches[0].clientY - info.y
    const dx = e.touches[0].clientX - info.x
    const isExpandedNow = isDesktop ? !desktopCollapsed : snap === 'full'

    if (
      isExpandedNow &&
      info.scrollTop <= 0 &&
      dy > PULL_DOWN_THRESHOLD &&
      Math.abs(dy) > Math.abs(dx) * 1.3
    ) {
      touchPullInfo.current = null
      if (isDesktop) {
        commitDesktopCollapsed(true, 0.45)
      } else {
        commitSnap('half', 0.45)
      }
    }
  }

  const handleToggleFromButton = () => {
    if (suppressClickRef.current) return
    if (isDesktop) {
      commitDesktopCollapsed(!desktopCollapsed)
      return
    }
    if (snap === 'peek') {
      commitSnap('half')
    } else if (snap === 'half') {
      commitSnap('full')
    } else {
      commitSnap('peek')
    }
  }

  const isFullMobile = snap === 'full'
  const isExpandedState = isDesktop ? !desktopCollapsed : isFullMobile
  const canScrollContent = isDesktop ? !desktopCollapsed : isFullMobile
  const handleTitle = isExpandedState
    ? 'Tarik ke bawah atau klik untuk melipat panel'
    : 'Tarik ke atas atau klik untuk membuka penuh panel'

  const cornerRadiusClass = isDesktop
    ? desktopCollapsed
      ? 'rounded-none md:rounded-tr-2xl md:border-t'
      : 'rounded-none md:border-t-transparent'
    : isFullMobile
      ? 'rounded-none'
      : 'rounded-t-[32px]'

  const ensurePeekCleared = useCallback(() => {
    if (!isDesktop && snap === 'peek') {
      commitSnap('half')
    } else if (isDesktop && desktopCollapsed) {
      commitDesktopCollapsed(false)
    }
  }, [isDesktop, snap, desktopCollapsed, commitSnap, commitDesktopCollapsed])

  const sheetContextValue = useMemo(
    () => ({ ensurePeekCleared }),
    [ensurePeekCleared],
  )

  return (
    <BottomSheetContext.Provider value={sheetContextValue}>
      <section
      ref={sheetRef}
      id={id}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      className={`fixed top-0 bottom-0 left-0 right-0 z-[500] mx-0 ml-0 mr-0 flex w-screen max-w-none flex-col bg-forest-900 text-white shadow-lg will-change-transform transform-gpu transition-[border-radius,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:top-0 md:bottom-0 md:left-0 md:right-auto md:ml-0 md:w-[420px] md:border-r md:border-white/10 ${cornerRadiusClass}`}
      style={{
        height: '100dvh',
        transform: `translate3d(0, ${getTargetY()}px, 0)`,
        touchAction: canScrollContent ? 'pan-y' : 'pan-x',
      }}
    >
      {/* Top drag handle bar + desktop collapse toggle */}
      <div className="relative flex w-full shrink-0 items-center justify-center md:h-10">
        <button
          type="button"
          id={`${id}-handle-container`}
          aria-label={handleTitle}
          title={handleTitle}
          aria-expanded={isExpandedState}
          onClick={handleToggleFromButton}
          style={{ touchAction: 'none' }}
          className={`flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing transition-[padding] duration-200 ${
            isDesktop ? 'py-2' : isFullMobile ? 'pt-4 pb-2.5' : 'pt-3 pb-2.5'
          }`}
        >
          <span
            id={`${id}-handle`}
            aria-hidden="true"
            className={`h-1.5 rounded-full bg-white/90 transition-all duration-200 ${
              isDesktop
                ? 'w-14 opacity-75'
                : isFullMobile
                  ? 'w-16 opacity-75'
                  : snap === 'half'
                    ? 'w-20 opacity-90'
                    : 'w-24 opacity-100'
            }`}
          />
        </button>

        {isDesktop && (
          <button
            type="button"
            id={`${id}-desktop-toggle`}
            aria-label={desktopCollapsed ? 'Buka penuh daftar wisata' : 'Lipat panel sidebar ke bawah'}
            title={desktopCollapsed ? 'Perluas panel wisata' : 'Lipat panel ke bawah'}
            aria-expanded={!desktopCollapsed}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              commitDesktopCollapsed(!desktopCollapsed)
            }}
            className="absolute right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-[#EBF0EB] transition-colors duration-150 hover:bg-white/[0.16] active:scale-[0.95] before:absolute before:-inset-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                desktopCollapsed ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Sheet content area */}
      <div
        ref={contentRef}
        id={`${id}-content`}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onFocusCapture={(e) => {
          if (isDesktop && desktopCollapsed && e.target.closest('input, textarea')) {
            commitDesktopCollapsed(false)
          }
        }}
        className={`no-scrollbar w-full flex-1 overscroll-contain will-change-transform transform-gpu md:pt-1 ${
          canScrollContent ? 'overflow-x-hidden overflow-y-auto' : 'overflow-hidden'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: canScrollContent ? 'pan-y' : 'pan-x',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)',
        }}
      >
        {children}
      </div>
    </section>
    </BottomSheetContext.Provider>
  )
}
