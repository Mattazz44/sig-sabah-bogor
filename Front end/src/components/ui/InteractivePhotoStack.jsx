import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import SafeImage from './SafeImage'
import { ChevronRightIcon, MapPinIcon, RouteWaypointsIcon, StarIcon } from './VectorIcons'
import { getBogorFallbackPhoto } from '../../utils/imageHelper'
import { formatShortDistance } from '../../utils/distance'
import { usePreferences } from '../../utils/preferences'

const SWIPE_OFFSET_THRESHOLD = 78
const SWIPE_VELOCITY_THRESHOLD = 360

function formatStackDistance(place, { distanceUnit, tDuration }) {
  if (typeof place?.distanceKm === 'number' && Number.isFinite(place.distanceKm)) {
    return formatShortDistance(place.distanceKm, { unit: distanceUnit })
  }
  if (place?.travelTime && place.travelTime !== 'Aktifkan GPS' && place.travelTime !== 'Enable GPS') {
    return tDuration ? tDuration(place.travelTime) : place.travelTime
  }
  return null
}

function InteractivePhotoStack({
  places = [],
  onOpenDetail,
  onStartNavigation,
  heading,
  subtitle,
  idPrefix = 'photo-stack',
}) {
  const { t, tCategory, tDuration, distanceUnit } = usePreferences()
  const prefersReduced = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState(1)
  const didDragRef = useRef(false)

  const dragX = useMotionValue(0)
  const frontRotate = useTransform(dragX, [-220, 0, 220], [-14, 0, 14])
  const frontOpacity = useTransform(dragX, [-280, -170, 0, 170, 280], [0.55, 1, 1, 1, 0.55])
  const dragProgress = useTransform(dragX, [-160, 0, 160], [1, 0, 1])

  const secondScale = useTransform(dragProgress, [0, 1], [0.945, 0.995])
  const secondY = useTransform(dragProgress, [0, 1], [11, 2])
  const secondRotate = useTransform(dragProgress, [0, 1], [3.4, 0.4])
  const secondOpacity = useTransform(dragProgress, [0, 1], [0.85, 1])

  const thirdScale = useTransform(dragProgress, [0, 1], [0.89, 0.945])
  const thirdY = useTransform(dragProgress, [0, 1], [20, 11])
  const thirdRotate = useTransform(dragProgress, [0, 1], [-3.8, 1.4])
  const thirdOpacity = useTransform(dragProgress, [0, 1], [0.58, 0.85])

  // Deduplikasi destinasi agar setiap kartu dalam tumpukan selalu unik
  const deck = useMemo(() => {
    if (!Array.isArray(places)) return []
    const seen = new Set()
    const unique = []
    for (const item of places) {
      if (!item) continue
      const key = item.slug || String(item.id || item.name)
      if (!key || seen.has(key)) continue
      seen.add(key)
      unique.push(item)
      if (unique.length >= 8) break
    }
    return unique
  }, [places])

  const total = deck.length
  const safeIndex = total > 0 ? activeIndex % total : 0

  const advanceCard = useCallback(
    (dir = 1) => {
      if (total <= 1) return
      setExitDirection(dir >= 0 ? 1 : -1)
      setActiveIndex((prev) => (prev + 1) % total)
      dragX.set(0)
    },
    [total, dragX],
  )

  const handleDragStart = () => {
    didDragRef.current = true
  }

  const handleDragEnd = (_event, info) => {
    const swipedFar = Math.abs(info.offset.x) > SWIPE_OFFSET_THRESHOLD
    const swipedFast = Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD

    if (total > 1 && (swipedFar || swipedFast)) {
      const dir = info.offset.x !== 0 ? Math.sign(info.offset.x) : Math.sign(info.velocity.x) || 1
      advanceCard(dir)
    }

    window.setTimeout(() => {
      didDragRef.current = false
    }, 80)
  }

  const handleFrontTap = () => {
    if (didDragRef.current) return
    if (total > 1) {
      advanceCard(1)
    } else if (deck[0]) {
      onOpenDetail?.(deck[0])
    }
  }

  if (total === 0) return null

  const frontPlace = deck[safeIndex]
  const secondPlace = total > 1 ? deck[(safeIndex + 1) % total] : null
  const thirdPlace = total > 2 ? deck[(safeIndex + 2) % total] : null

  const frontFallback = getBogorFallbackPhoto(frontPlace)
  const frontDistLabel = formatStackDistance(frontPlace, { distanceUnit, tDuration })
  const frontRating = Number(frontPlace.rating || 0).toFixed(1)

  return (
    <section
      id={`${idPrefix}-section`}
      aria-label={heading || t('motion.stackHeading')}
      className="select-none"
    >
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#F5F2EB] sm:text-[18px]">
            {heading || t('motion.stackHeading')}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#A7B2AA]">
            {subtitle || t('motion.stackHint')}
          </p>
        </div>

        {total > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[12px] font-medium tabular-nums text-[#94A198]">
              {safeIndex + 1} / {total}
            </span>
            <button
              type="button"
              id={`${idPrefix}-next-btn`}
              onClick={() => advanceCard(1)}
              aria-label={t('motion.stackNextAria')}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18211C] text-[#F5F2EB] transition-colors duration-150 hover:bg-[#222F28] active:scale-[0.94]"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stacked Card Stage: Background deck sits cleanly at z-[1]/z-[10], active draggable card at z-[20] */}
      <div className="relative isolate mx-auto h-[272px] w-full max-w-[420px] sm:mx-0 sm:max-w-[460px]">
        {/* Depth 2 (deepest card) */}
        {thirdPlace && (
          <motion.div
            key={`third-${thirdPlace.slug || thirdPlace.id}`}
            aria-hidden="true"
            style={
              prefersReduced
                ? { scale: 0.91, y: 18, opacity: 0.55 }
                : {
                    scale: thirdScale,
                    y: thirdY,
                    rotate: thirdRotate,
                    opacity: thirdOpacity,
                  }
            }
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl bg-[#151C18] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)]"
          >
            <SafeImage
              src={thirdPlace.image || getBogorFallbackPhoto(thirdPlace)}
              fallback={getBogorFallbackPhoto(thirdPlace)}
              alt=""
              loading="eager"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#0E1310]/45" />
          </motion.div>
        )}

        {/* Depth 1 (next card up, scales & straightens dynamically as front card drags) */}
        {secondPlace && (
          <motion.div
            key={`second-${secondPlace.slug || secondPlace.id}`}
            aria-hidden="true"
            style={
              prefersReduced
                ? { scale: 0.955, y: 10, opacity: 0.82 }
                : {
                    scale: secondScale,
                    y: secondY,
                    rotate: secondRotate,
                    opacity: secondOpacity,
                  }
            }
            className="pointer-events-none absolute inset-0 z-[10] overflow-hidden rounded-2xl bg-[#151C18] shadow-[0_18px_36px_-14px_rgba(0,0,0,0.65)]"
          >
            <SafeImage
              src={secondPlace.image || getBogorFallbackPhoto(secondPlace)}
              fallback={getBogorFallbackPhoto(secondPlace)}
              alt=""
              loading="eager"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E1310]/80 via-[#0E1310]/25 to-transparent" />
          </motion.div>
        )}

        {/* Depth 0 (interactive front card) */}
        <AnimatePresence initial={false} custom={exitDirection}>
          <motion.article
            key={`front-${safeIndex}-${frontPlace.slug || frontPlace.id}`}
            id={`${idPrefix}-front-card`}
            data-place-slug={frontPlace.slug}
            custom={exitDirection}
            drag={!prefersReduced && total > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { scale: 0.945, y: 11, rotate: 3.2, opacity: 0.88 }
            }
            animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
            exit={(dir) =>
              prefersReduced
                ? { opacity: 0, transition: { duration: 0.14 } }
                : {
                    x: dir * 360,
                    y: -14,
                    rotate: dir * 18,
                    opacity: 0,
                    scale: 0.92,
                    zIndex: 30,
                    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                  }
            }
            transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.8 }}
            style={
              prefersReduced
                ? undefined
                : {
                    x: dragX,
                    rotate: frontRotate,
                    opacity: frontOpacity,
                    touchAction: 'pan-y',
                  }
            }
            whileTap={!prefersReduced && total > 1 ? { scale: 0.985 } : undefined}
            className="absolute inset-0 z-[20] flex flex-col justify-between overflow-hidden rounded-2xl bg-[#151C18] shadow-[0_22px_44px_-14px_rgba(0,0,0,0.75)] will-change-transform cursor-grab active:cursor-grabbing"
          >
            {/* Photo Layer & Tap-to-Flip Button */}
            <button
              type="button"
              onClick={handleFrontTap}
              aria-label={
                total > 1
                  ? t('motion.stackTapFlipAria', { name: frontPlace.name })
                  : frontPlace.name
              }
              className="absolute inset-0 z-[1] h-full w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F2ECE1]"
            >
              <SafeImage
                src={frontPlace.image || frontFallback}
                fallback={frontFallback}
                alt={frontPlace.name}
                loading="eager"
                className="h-full w-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D120F]/95 via-[#0D120F]/40 to-black/20"
              />
            </button>

            {/* Top Meta Strip */}
            <div className="pointer-events-none relative z-[10] flex items-center justify-between gap-2 p-3.5">
              {frontPlace.category ? (
                <span className="rounded-lg bg-[#121915]/82 px-2.5 py-1 text-[11px] font-semibold text-[#F5F2EB] backdrop-blur-md">
                  {tCategory(frontPlace.category)}
                </span>
              ) : (
                <span />
              )}

              <span className="inline-flex items-center gap-1 rounded-lg bg-[#121915]/82 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#F5F2EB] backdrop-blur-md">
                <StarIcon filled className="h-3.5 w-3.5 text-[#C5A868]" aria-hidden="true" />
                {frontRating}
              </span>
            </div>

            {/* Bottom Editorial Info + Non-Blocking Action Buttons */}
            <div className="pointer-events-none relative z-[10] flex items-end justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-[18px] font-bold tracking-[-0.02em] text-[#F5F2EB] drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
                  {frontPlace.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#D7DFD8]">
                  <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[#C5A868]" aria-hidden="true" />
                  <span className="truncate">
                    {frontDistLabel || frontPlace.address || frontPlace.location || t('common.bogorWestJava')}
                  </span>
                </p>
              </div>

              <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
                {onStartNavigation && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartNavigation(frontPlace)
                    }}
                    aria-label={t('foryou.quickRouteAria', { name: frontPlace.name })}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18211C]/90 text-[#F5F2EB] backdrop-blur-md transition-colors duration-150 hover:bg-[#233029] active:scale-[0.95]"
                  >
                    <RouteWaypointsIcon className="h-4 w-4 text-[#C5A868]" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  id={`${idPrefix}-open-detail`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDetail?.(frontPlace)
                  }}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#F2ECE1] px-3.5 py-2 text-[12.5px] font-semibold text-[#141A14] transition-colors duration-150 hover:bg-[#E7DFD1] active:scale-[0.96]"
                >
                  {t('foryou.viewDetail')}
                </button>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/* Subtle Progress Dots */}
      {total > 1 && (
        <div className="mt-7 flex items-center justify-center gap-1.5 sm:justify-start" aria-hidden="true">
          {deck.map((item, i) => (
            <span
              key={item.slug || item.id || i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === safeIndex ? 'w-5 bg-[#C5A868]' : 'w-1.5 bg-[#F2ECE1]/20'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default memo(InteractivePhotoStack)
