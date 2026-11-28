import { memo, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePreferences } from '../../utils/preferences'

/**
 * Maskot Rusa Tutul Sabah Bogor (Axis axis) — diakses terpusat dari aset statis
 * Front end/public/assets/mascot/ (/assets/mascot/mascot-*.svg & .png).
 *
 * Varian tersedia:
 * - 'default'      : /assets/mascot/mascot-default.svg
 * - 'confused'     : /assets/mascot/mascot-confused.svg
 * - 'taking-photo' : /assets/mascot/mascot-taking-photo.svg
 * - 'happy'        : /assets/mascot/mascot-happy.svg
 * - 'goodbye'      : /assets/mascot/mascot-goodbye.svg
 * - 'admin'        : /assets/mascot/mascot-admin.svg
 */
const SIZE_CLASSES = {
  xs: 'h-11 w-11',
  sm: 'h-14 w-14',
  modal: 'h-20 w-20',
  md: 'h-24 w-24',
  lg: 'h-28 w-28',
}

const MASCOT_ASSETS = {
  default: {
    svg: '/assets/mascot/mascot-default.svg',
    png: '/assets/mascot/mascot-default.png',
    labelKey: 'mascot.default',
  },
  confused: {
    svg: '/assets/mascot/mascot-confused.svg',
    png: '/assets/mascot/mascot-confused.png',
    labelKey: 'mascot.confused',
  },
  'taking-photo': {
    svg: '/assets/mascot/mascot-taking-photo.svg',
    png: '/assets/mascot/mascot-taking-photo.png',
    labelKey: 'mascot.takingPhoto',
  },
  happy: {
    svg: '/assets/mascot/mascot-happy.svg',
    png: '/assets/mascot/mascot-happy.png',
    labelKey: 'mascot.happy',
  },
  goodbye: {
    svg: '/assets/mascot/mascot-goodbye.svg',
    png: '/assets/mascot/mascot-goodbye.png',
    labelKey: 'mascot.goodbye',
  },
  admin: {
    svg: '/assets/mascot/mascot-admin.svg',
    png: '/assets/mascot/mascot-admin.png',
    labelKey: 'mascot.admin',
  },
}

const GREETING_KEYS = [
  'mascot.greet1',
  'mascot.greet2',
  'mascot.greet3',
  'mascot.greet4',
]

const TAP_REACTIONS = [
  // 0: Playful hop
  {
    y: [0, -11, 0, -4, 0],
    scaleX: [1, 0.94, 1.07, 0.98, 1],
    scaleY: [1, 1.1, 0.93, 1.03, 1],
    rotate: [0, -5, 4, -2, 0],
  },
  // 1: Friendly nod & wiggle
  {
    y: [0, 2, -4, 1, 0],
    rotate: [0, -9, 8, -4, 0],
    scale: [1, 1.06, 1.04, 1.01, 1],
  },
  // 2: Joyful pop tilt
  {
    y: [0, -8, 1, -2, 0],
    rotate: [0, 7, -6, 2, 0],
    scale: [1, 1.11, 0.96, 1.02, 1],
  },
]

function SabahMascot({
  variant = 'default',
  size = 'md',
  animate,
  format = 'svg',
  className = '',
  label,
  interactive = false,
  bubbleAlign = 'center',
  id,
}) {
  const { t } = usePreferences()
  const prefersReduced = useReducedMotion()
  const [tapCount, setTapCount] = useState(0)
  const [bubbleText, setBubbleText] = useState('')
  const [isReacting, setIsReacting] = useState(false)
  const hideBubbleTimerRef = useRef(null)
  const reactTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (hideBubbleTimerRef.current) window.clearTimeout(hideBubbleTimerRef.current)
      if (reactTimerRef.current) window.clearTimeout(reactTimerRef.current)
    }
  }, [])

  const resolvedVariant = MASCOT_ASSETS[variant] ? variant : 'default'
  const asset = MASCOT_ASSETS[resolvedVariant]
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md
  const shouldAnimate = animate ?? resolvedVariant !== 'default'
  const src = format === 'png' ? asset.png : asset.svg
  const altText = label || t(asset.labelKey)

  const wrapperAnimClass =
    !interactive && shouldAnimate
      ? resolvedVariant === 'happy'
        ? 'sabah-mascot-happy-hop'
        : resolvedVariant === 'taking-photo'
          ? 'sabah-mascot-focus-lean'
          : resolvedVariant === 'default'
            ? 'sabah-mascot-float'
            : ''
      : ''

  const handleInteractiveTap = () => {
    const nextTap = tapCount + 1
    setTapCount(nextTap)
    const greetingKey = GREETING_KEYS[(nextTap - 1) % GREETING_KEYS.length]
    setBubbleText(t(greetingKey))
    setIsReacting(true)

    if (reactTimerRef.current) window.clearTimeout(reactTimerRef.current)
    reactTimerRef.current = window.setTimeout(() => {
      setIsReacting(false)
    }, 520)

    if (hideBubbleTimerRef.current) window.clearTimeout(hideBubbleTimerRef.current)
    hideBubbleTimerRef.current = window.setTimeout(() => {
      setBubbleText('')
    }, 2800)
  }

  const bubbleAlignClass =
    bubbleAlign === 'left'
      ? 'left-0'
      : bubbleAlign === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2'

  if (interactive) {
    const reaction = TAP_REACTIONS[tapCount % TAP_REACTIONS.length]
    return (
      <div className="relative inline-flex shrink-0 items-center justify-center">
        <AnimatePresence>
          {bubbleText && (
            <motion.div
              key={`${tapCount}-${bubbleText}`}
              role="status"
              aria-live="polite"
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.9 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              className={`pointer-events-none absolute -top-11 z-40 w-max max-w-[210px] rounded-xl border border-[#C5A868]/30 bg-[#19231D]/95 px-3 py-1.5 text-center text-[11.5px] font-medium leading-snug text-[#F5F2EB] shadow-[0_10px_24px_-6px_rgba(0,0,0,0.65)] ${bubbleAlignClass}`}
            >
              <span>{bubbleText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          id={id}
          data-mascot-variant={resolvedVariant}
          data-mascot-interactive="true"
          data-tap-count={tapCount}
          aria-label={t('mascot.tapAria')}
          title={t('mascot.tapAria')}
          onClick={handleInteractiveTap}
          whileHover={prefersReduced ? undefined : { scale: 1.06 }}
          whileTap={prefersReduced ? undefined : { scale: 0.92 }}
          animate={
            isReacting && !prefersReduced
              ? reaction
              : { y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 }
          }
          transition={
            isReacting
              ? { duration: 0.48, ease: [0.22, 1, 0.36, 1] }
              : { type: 'spring', stiffness: 360, damping: 24 }
          }
          className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A868] ${sizeClass} ${className}`}
        >
          <img
            src={src}
            alt={altText}
            width={1024}
            height={1024}
            loading="eager"
            decoding="async"
            draggable={false}
            className="h-full w-full object-contain"
          />
        </motion.button>
      </div>
    )
  }

  return (
    <div
      id={id}
      data-mascot-variant={resolvedVariant}
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${sizeClass} ${wrapperAnimClass} ${className}`}
    >
      <img
        src={src}
        alt={altText}
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
        draggable={false}
        className="h-full w-full object-contain"
      />
    </div>
  )
}

export default memo(SabahMascot)
