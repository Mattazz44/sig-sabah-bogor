import { memo, useEffect, useRef, useState } from 'react'
import { usePreferences } from '../../utils/preferences'

function parseNumericSuffix(text, unitRegex) {
  if (typeof text === 'number' && Number.isFinite(text)) return text
  if (typeof text !== 'string') return null
  const match = text.match(unitRegex)
  if (!match) return null
  const parsed = Number.parseFloat(match[1].replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Menginterpolasi angka telemetri secara halus pada 60fps tanpa memicu lonjakan layout,
 * dan langsung berhenti di cleanup bila komponen di-unmount atau rute berganti.
 */
function useRollingNumber(targetValue, durationMs = 420) {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const currentRef = useRef(targetValue ?? 0)

  useEffect(() => {
    if (targetValue === null || !Number.isFinite(targetValue)) {
      currentRef.current = 0
      const resetRaf = requestAnimationFrame(() => setDisplayValue(null))
      return () => cancelAnimationFrame(resetRaf)
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (prefersReducedMotion) {
      currentRef.current = targetValue
      const instantRaf = requestAnimationFrame(() => setDisplayValue(targetValue))
      return () => cancelAnimationFrame(instantRaf)
    }

    const startValue = Number.isFinite(currentRef.current) ? currentRef.current : 0
    if (Math.abs(targetValue - startValue) < 0.01) {
      currentRef.current = targetValue
      const syncRaf = requestAnimationFrame(() => setDisplayValue(targetValue))
      return () => cancelAnimationFrame(syncRaf)
    }

    const startTime = performance.now()
    let rafId = 0

    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = startValue + (targetValue - startValue) * eased
      currentRef.current = next
      setDisplayValue(next)

      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [targetValue, durationMs])

  return displayValue
}

function RouteMetrics({
  activeDestination,
  routeInfo,
  isNavigationMode = false,
}) {
  const { language, distanceUnit, t, tDuration, formatDistanceUnit } = usePreferences()
  const isActive = isNavigationMode && Boolean(activeDestination)

  const targetMinutes = isActive
    ? routeInfo?.totalMinutes ??
      parseNumericSuffix(activeDestination?.travelTime, /([\d.,]+)\s*(?:menit|min)/i)
    : null

  const targetKm = isActive
    ? parseNumericSuffix(routeInfo?.totalKm ?? routeInfo?.distanceText, /([\d.,]+)/) ??
      (typeof activeDestination?.distanceKm === 'number'
        ? activeDestination.distanceKm
        : parseNumericSuffix(activeDestination?.distance, /([\d.,]+)\s*km/i))
    : null

  const animatedMinutes = useRollingNumber(targetMinutes, 420)
  const animatedKm = useRollingNumber(targetKm, 460)

  if (!isActive) return null

  const isCustomRoute =
    Array.isArray(activeDestination) || Boolean(routeInfo?.isCustomRoute)

  let title = t('common.destinationFallback')
  let badgeLabel = t('map.activeNavBadge')

  if (isCustomRoute) {
    badgeLabel = t('map.customRouteBadge')
    if (Array.isArray(activeDestination)) {
      title = activeDestination
        .map((p) => p.name?.split('-')[0].trim() || t('map.pointFallback'))
        .join(t('map.routeJoinWord'))
    } else {
      title = activeDestination?.name || t('map.customRouteFallback')
    }
  } else {
    title = activeDestination?.name || t('common.destinationFallback')
  }

  const fallbackTimeText = tDuration(routeInfo?.timeText || activeDestination?.travelTime) || t('map.calculating')
  const fallbackDistanceText =
    routeInfo?.distanceText || activeDestination?.distance
      ? formatDistanceUnit(routeInfo?.distanceText || activeDestination?.distance)
      : t('map.calculating')
  const isFallbackOrigin = Boolean(routeInfo?.isFallbackOrigin)

  const minUnit = language === 'en' ? 'min' : 'Menit'
  const formattedTime =
    animatedMinutes !== null
      ? `${Math.max(1, Math.round(animatedMinutes))} ${minUnit}`
      : fallbackTimeText
  const formattedDistance =
    animatedKm !== null
      ? distanceUnit === 'mi'
        ? `${(animatedKm * 0.621371).toFixed(1)} MI`
        : `${animatedKm.toFixed(1)} KM`
      : fallbackDistanceText

  return (
    <aside
      id="route-metrics-panel"
      aria-label={t('map.metricsAria')}
      className="pointer-events-none fixed top-4 inset-x-4 z-[900] mx-auto max-w-sm animate-tab-enter"
    >
      <div className="pointer-events-auto apple-glass-card flex flex-col gap-1.5 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#DFAA63]" aria-hidden="true" />
            <h2 className="truncate text-[13.5px] font-semibold tracking-tight text-[#F5F2EB]" title={title}>
              {title}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-[#DFAA63]/35 bg-[#DFAA63]/12 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-wide text-[#DFAA63]">
            {badgeLabel}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between border-t border-[rgba(244,239,230,0.14)] pt-2 text-[12px]">
          <div className="flex items-center gap-1.5 text-[#F5F2EB]">
            <span className="text-[#F5F2EB]/60">
              {isCustomRoute ? t('map.totalEstimate') : t('map.estimate')}
            </span>
            <span className="font-mono font-semibold tabular-nums tracking-wide text-[#F5F2EB]">
              {formattedTime}
            </span>
          </div>
          <span className="text-[#F5F2EB]/25" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5 text-[#F5F2EB]">
            <span className="text-[#F5F2EB]/60">
              {isCustomRoute ? t('map.totalDistance') : t('map.distance')}
            </span>
            <span className="font-mono font-semibold tabular-nums tracking-wide text-[#DFAA63]">
              {formattedDistance}
            </span>
          </div>
        </div>

        {isFallbackOrigin && (
          <p className="mt-1 text-center text-[10.5px] font-medium text-[#F5F2EB]/65">
            {isCustomRoute ? t('map.gpsFallbackMulti') : t('map.gpsFallbackSingle')}
          </p>
        )}
      </div>
    </aside>
  )
}

export default memo(RouteMetrics)
