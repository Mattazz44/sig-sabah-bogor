import { memo } from 'react'

function RouteMetrics({
  activeDestination,
  routeInfo,
  isNavigationMode = false,
}) {
  if (!isNavigationMode || !activeDestination) return null

  const isCustomRoute =
    Array.isArray(activeDestination) || Boolean(routeInfo?.isCustomRoute)

  let title = 'Destinasi wisata'
  let badgeLabel = 'Navigasi aktif'

  if (isCustomRoute) {
    badgeLabel = 'Rute custom'
    if (Array.isArray(activeDestination)) {
      title = activeDestination
        .map((p) => p.name?.split('-')[0].trim() || 'Titik')
        .join(' ke ')
    } else {
      title = activeDestination?.name || 'Rute custom wisata'
    }
  } else {
    title = activeDestination?.name || 'Destinasi wisata'
  }

  const estimatedTime =
    routeInfo?.timeText || activeDestination?.travelTime || 'Menghitung...'
  const estimatedDistance =
    routeInfo?.distanceText || activeDestination?.distance || 'Menghitung...'

  return (
    <aside
      id="route-metrics-panel"
      aria-label="Panel perkiraan rute navigasi"
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
              {isCustomRoute ? 'Estimasi total:' : 'Estimasi:'}
            </span>
            <span className="font-mono font-semibold tabular-nums tracking-wide text-[#F5F2EB]">{estimatedTime}</span>
          </div>
          <span className="text-[#F5F2EB]/25" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5 text-[#F5F2EB]">
            <span className="text-[#F5F2EB]/60">
              {isCustomRoute ? 'Jarak total:' : 'Jarak:'}
            </span>
            <span className="font-mono font-semibold tabular-nums tracking-wide text-[#F5F2EB]">{estimatedDistance}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default memo(RouteMetrics)
