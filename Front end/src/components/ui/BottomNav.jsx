import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ITEMS = [
  {
    id: 'explore',
    label: 'Explore',
    icon: (
      <g {...stroke} strokeWidth="2.2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </g>
    ),
  },
  {
    id: 'untuk-anda',
    label: 'Untuk Anda',
    icon: (
      <g {...stroke}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </g>
    ),
  },
  {
    id: 'navigasi',
    label: 'Navigasi',
    icon: (
      <g {...stroke}>
        <path d="M21 3 3 10.5l7.5 3L14 21l7-18Z" />
      </g>
    ),
  },
  {
    id: 'tersimpan',
    label: 'Tersimpan',
    icon: (
      <g {...stroke}>
        <path d="M12 20s-7.5-4.6-9-9.2C2 7.4 4.3 4.5 7.5 4.5c1.9 0 3.4 1 4.5 2.6 1.1-1.6 2.6-2.6 4.5-2.6 3.2 0 5.5 2.9 4.5 6.3-1.5 4.6-9 9.2-9 9.2Z" />
      </g>
    ),
  },
  {
    id: 'aktivitas',
    label: 'Aktivitas',
    icon: (
      <g {...stroke}>
        <path d="M2 12h5l2-5 4 10 2-5h7" />
      </g>
    ),
  },
]

const DRAG_THRESHOLD_PX = 6

// Fisika viscous liquid spring (sekitar 450-550ms agar peregangan cair terlihat mewah dan lembut)
const SPRING_STIFFNESS = 195
const SPRING_DAMPING = 21.5
const STRETCH_STIFFNESS = 280
const STRETCH_DAMPING = 22

const INACTIVE_RGB = [184, 197, 184] // #B8C5B8
const ACTIVE_RGB = [235, 240, 235]   // #EBF0EB

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

function resolveActiveIndex(activeTab) {
  const normalized = (activeTab || 'Explore').toLowerCase()
  const idx = ITEMS.findIndex(
    (item) =>
      item.label.toLowerCase() === normalized ||
      (item.label === 'Tersimpan' && normalized === 'aktivitas tersimpan'),
  )
  return idx >= 0 ? idx : 0
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

export default function BottomNav({ activeTab = 'Explore', setActiveTab, onTabChange }) {
  const location = useLocation()
  const navigate = useNavigate()
  const activeIndex = useMemo(() => resolveActiveIndex(activeTab), [activeTab])

  const trackRef = useRef(null)
  const pillRef = useRef(null)
  const sheenRef = useRef(null)
  const iconRefs = useRef([])
  const labelRefs = useRef([])
  const buttonRefs = useRef([])

  const suppressClickRef = useRef(false)
  const dragStateRef = useRef(null)
  const physicsRef = useRef({
    pos: activeIndex,
    vel: 0,
    target: activeIndex,
    stretchPos: 0,
    stretchVel: 0,
    sheenShift: 0,
    dragging: false,
    rafId: 0,
    lastTime: 0,
  })

  const emitTabSelect = useCallback(
    (label) => {
      if (setActiveTab) setActiveTab(label)
      if (onTabChange && onTabChange !== setActiveTab) onTabChange(label)
      if (
        location.pathname !== '/' &&
        (typeof window === 'undefined' || window.location.pathname !== '/')
      ) {
        navigate('/')
      }
    },
    [setActiveTab, onTabChange, location.pathname, navigate],
  )

  const applyVisuals = useCallback((floatIdx, stretch, sheenShift, isDraggingNow) => {
    const clampedStretch = clamp(stretch, -0.045, 0.38)
    const sx = 1 + clampedStretch
    const sy = isDraggingNow && clampedStretch < 0.06
      ? 1.035
      : clamp(1 - clampedStretch * 0.22, 0.91, 1.035)

    const pillEl = pillRef.current
    if (pillEl) {
      pillEl.style.transform = `translate3d(${floatIdx * 100}%, 0, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
      pillEl.dataset.dragging = isDraggingNow ? 'true' : 'false'
    }

    const sheenEl = sheenRef.current
    if (sheenEl) {
      const clampedShift = clamp(sheenShift, -32, 32)
      const energy = clamp(Math.abs(clampedStretch) / 0.32, 0, 1)
      sheenEl.style.transform = `translate3d(${clampedShift.toFixed(2)}%, 0, 0)`
      sheenEl.style.opacity = (0.38 + energy * 0.56).toFixed(3)
    }

    for (let i = 0; i < ITEMS.length; i++) {
      const dist = Math.abs(floatIdx - i)
      const rawProx = Math.max(0, 1 - dist)
      const proximity = rawProx * rawProx * (3 - 2 * rawProx)

      const r = Math.round(INACTIVE_RGB[0] + (ACTIVE_RGB[0] - INACTIVE_RGB[0]) * proximity)
      const g = Math.round(INACTIVE_RGB[1] + (ACTIVE_RGB[1] - INACTIVE_RGB[1]) * proximity)
      const b = Math.round(INACTIVE_RGB[2] + (ACTIVE_RGB[2] - INACTIVE_RGB[2]) * proximity)
      const color = `rgb(${r}, ${g}, ${b})`

      const iconEl = iconRefs.current[i]
      if (iconEl) {
        const iconScale = 1 + 0.14 * proximity
        const iconY = -1 * proximity
        iconEl.style.transform = `translate3d(0, ${iconY.toFixed(2)}px, 0) scale(${iconScale.toFixed(3)})`
        iconEl.style.color = color
      }

      const labelEl = labelRefs.current[i]
      if (labelEl) {
        labelEl.style.color = color
        labelEl.style.fontWeight = proximity > 0.55 ? '700' : '500'
      }
    }
  }, [])

  const stopSpringLoop = useCallback(() => {
    if (physicsRef.current.rafId) {
      cancelAnimationFrame(physicsRef.current.rafId)
      physicsRef.current.rafId = 0
    }
  }, [])

  const startSpringLoop = useCallback(() => {
    const phys = physicsRef.current

    if (prefersReducedMotion()) {
      stopSpringLoop()
      phys.pos = phys.target
      phys.vel = 0
      phys.stretchPos = 0
      phys.stretchVel = 0
      phys.sheenShift = 0
      applyVisuals(phys.pos, 0, 0, false)
      return
    }

    if (phys.rafId) return
    phys.lastTime = performance.now()

    const step = (now) => {
      const p = physicsRef.current
      const dt = Math.min(Math.max((now - p.lastTime) / 1000, 0.001), 0.032)
      p.lastTime = now

      if (p.dragging) {
        // Saat jari ditahan diam di tengah drag, kapsul berangsur rileks ke bentuk droplet tenang
        const dragIdleTargetStretch = 0.035
        const stretchAccel =
          STRETCH_STIFFNESS * (dragIdleTargetStretch - p.stretchPos) -
          STRETCH_DAMPING * p.stretchVel
        p.stretchVel += stretchAccel * dt
        p.stretchPos += p.stretchVel * dt
        p.sheenShift += (0 - p.sheenShift) * Math.min(1, dt * 8)

        applyVisuals(p.pos, p.stretchPos, p.sheenShift, true)
        p.rafId = requestAnimationFrame(step)
        return
      }

      const displacement = p.target - p.pos
      const accel = SPRING_STIFFNESS * displacement - SPRING_DAMPING * p.vel
      p.vel += accel * dt
      p.pos += p.vel * dt

      const stretchTarget = clamp(
        Math.abs(p.vel) * 0.031 + Math.min(0.24, Math.abs(displacement) * 0.19),
        0,
        0.38,
      )
      const stretchAccel =
        STRETCH_STIFFNESS * (stretchTarget - p.stretchPos) - STRETCH_DAMPING * p.stretchVel
      p.stretchVel += stretchAccel * dt
      p.stretchPos += p.stretchVel * dt

      const targetSheen = clamp(p.vel * 3.8, -32, 32)
      p.sheenShift += (targetSheen - p.sheenShift) * Math.min(1, dt * 12)

      const isSettled =
        Math.abs(displacement) < 0.002 &&
        Math.abs(p.vel) < 0.006 &&
        Math.abs(p.stretchPos) < 0.003 &&
        Math.abs(p.stretchVel) < 0.01

      if (isSettled) {
        p.pos = p.target
        p.vel = 0
        p.stretchPos = 0
        p.stretchVel = 0
        p.sheenShift = 0
        p.rafId = 0
        applyVisuals(p.pos, 0, 0, false)
        return
      }

      applyVisuals(
        clamp(p.pos, -0.18, ITEMS.length - 0.82),
        p.stretchPos,
        p.sheenShift,
        false,
      )
      p.rafId = requestAnimationFrame(step)
    }

    phys.rafId = requestAnimationFrame(step)
  }, [applyVisuals, stopSpringLoop])

  useEffect(() => {
    const phys = physicsRef.current
    phys.target = activeIndex
    if (!phys.dragging) {
      startSpringLoop()
    }
  }, [activeIndex, startSpringLoop])

  useEffect(() => {
    applyVisuals(physicsRef.current.pos, 0, 0, false)
    return () => stopSpringLoop()
  }, [applyVisuals, stopSpringLoop])

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    const trackEl = trackRef.current
    if (!trackEl) return

    const rect = trackEl.getBoundingClientRect()
    if (rect.width <= 0) return

    const tabWidth = rect.width / ITEMS.length
    const pointerIdx = clamp((e.clientX - rect.left) / tabWidth - 0.5, 0, ITEMS.length - 1)
    const currentPos = physicsRef.current.pos
    const initialOffset = Math.abs(pointerIdx - currentPos) <= 0.65 ? pointerIdx - currentPos : 0

    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      rectLeft: rect.left,
      tabWidth,
      grabOffset: initialOffset,
      hasDragged: false,
      lastIdx: currentPos,
      lastTime: performance.now(),
      dragVel: 0,
    }
  }

  const handlePointerMove = (e) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    if (!drag.hasDragged) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      drag.hasDragged = true
      suppressClickRef.current = true
      physicsRef.current.dragging = true

      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Abaikan jika browser tidak mengizinkan pointer capture
      }

      startSpringLoop()
    }

    const travelRatio = clamp(Math.abs(dx) / (drag.tabWidth * 0.45), 0, 1)
    const activeOffset = drag.grabOffset * (1 - travelRatio * 0.25)

    const rawIdx = (e.clientX - drag.rectLeft) / drag.tabWidth - 0.5 - activeOffset
    const nextPos = clamp(rawIdx, 0, ITEMS.length - 1)

    const now = performance.now()
    const dt = Math.max((now - drag.lastTime) / 1000, 0.004)
    const instVel = (nextPos - drag.lastIdx) / dt
    drag.dragVel = drag.dragVel * 0.52 + instVel * 0.48
    drag.lastIdx = nextPos
    drag.lastTime = now

    const phys = physicsRef.current
    phys.pos = nextPos
    const dragStretchTarget = clamp(Math.abs(drag.dragVel) * 0.044 + 0.06, 0.05, 0.38)
    phys.stretchPos += (dragStretchTarget - phys.stretchPos) * 0.45
    phys.stretchVel = 0
    phys.sheenShift = clamp(drag.dragVel * 3.8, -32, 32)

    applyVisuals(nextPos, phys.stretchPos, phys.sheenShift, true)
  }

  const finishDrag = (e) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragStateRef.current = null

    if (!drag.hasDragged) return

    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Abaikan jika pointer capture sudah lepas
    }

    const phys = physicsRef.current
    const projected = clamp(phys.pos + drag.dragVel * 0.085, 0, ITEMS.length - 1)
    const snappedIndex = Math.round(projected)

    phys.dragging = false
    phys.target = snappedIndex
    phys.vel = clamp(drag.dragVel, -10, 10)
    startSpringLoop()

    emitTabSelect(ITEMS[snappedIndex].label)

    setTimeout(() => {
      suppressClickRef.current = false
    }, 60)
  }

  const handleButtonClick = (index, label) => {
    if (suppressClickRef.current) return
    const phys = physicsRef.current
    const prevTarget = phys.target
    phys.target = index

    // Beri dorongan impuls stretch awal agar klik tab terdekat sekalipun memanjang cair
    const jumpDist = Math.abs(index - phys.pos)
    if (jumpDist > 0.25 && !prefersReducedMotion()) {
      phys.stretchPos = Math.max(phys.stretchPos, clamp(0.14 + jumpDist * 0.06, 0.16, 0.34))
      phys.sheenShift = clamp((index - prevTarget) * 10, -28, 28)
    }

    startSpringLoop()
    emitTabSelect(label)
  }

  const handleKeyDown = (e, index) => {
    let nextIndex = null
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % ITEMS.length
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + ITEMS.length) % ITEMS.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = ITEMS.length - 1

    if (nextIndex !== null) {
      e.preventDefault()
      buttonRefs.current[nextIndex]?.focus()
      handleButtonClick(nextIndex, ITEMS[nextIndex].label)
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[590] h-28"
        style={{
          background:
            'linear-gradient(to top, rgba(14, 20, 14, 0.52) 0%, rgba(14, 20, 14, 0.18) 55%, transparent 100%)',
        }}
      />

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[600] flex justify-center px-3 sm:px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <nav
          id="bottom-navigation"
          aria-label="Navigasi utama"
          className="liquid-glass-dock pointer-events-auto relative w-full max-w-[424px] overflow-hidden rounded-full p-1.5 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_14px_34px_-6px_rgba(0,0,0,0.48)] select-none transform-gpu"
        >
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            className="relative grid w-full grid-cols-5 items-center rounded-full touch-none"
          >
            {/* Kapsul Indikator Liquid Glass dengan efek memanjang & kilau specular dinamis */}
            <div
              ref={pillRef}
              aria-hidden="true"
              data-dragging="false"
              className="liquid-glass-pill pointer-events-none absolute inset-y-0 left-0 w-1/5 rounded-full will-change-transform"
            >
              <span
                ref={sheenRef}
                aria-hidden="true"
                className="liquid-glass-sheen pointer-events-none absolute inset-0 rounded-full opacity-40"
              />
            </div>

            {ITEMS.map((item, idx) => {
              const isActive = idx === activeIndex

              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    buttonRefs.current[idx] = el
                  }}
                  id={`nav-${item.id}`}
                  type="button"
                  onClick={() => handleButtonClick(idx, item.label)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative z-10 flex min-h-[48px] w-full flex-col items-center justify-center gap-1 rounded-full px-1 py-1.5 transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#EBF0EB] active:scale-[0.97]"
                >
                  <span
                    ref={(el) => {
                      iconRefs.current[idx] = el
                    }}
                    className="flex h-[22px] w-[22px] items-center justify-center will-change-transform"
                    style={{
                      color: isActive ? '#EBF0EB' : '#B8C5B8',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      {item.icon}
                    </svg>
                  </span>
                  <span
                    ref={(el) => {
                      labelRefs.current[idx] = el
                    }}
                    className="w-full truncate text-center text-[10px] leading-none tracking-tight"
                    style={{
                      color: isActive ? '#EBF0EB' : '#B8C5B8',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
