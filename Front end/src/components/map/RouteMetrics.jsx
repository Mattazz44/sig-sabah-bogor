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
      <div className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl border border-[#EBF0EB]/15 bg-[#1F2C1C] px-4 py-3 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
            <h2 className="truncate text-[13px] font-bold text-[#EBF0EB]" title={title}>
              {title}
            </h2>
          </div>
          <span className="shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
            {badgeLabel}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between border-t border-[#EBF0EB]/12 pt-2 text-[12px]">
          <div className="flex items-center gap-1.5 text-[#EBF0EB]">
            <span className="text-[#C8D3C8]">
              {isCustomRoute ? 'Estimasi total:' : 'Estimasi:'}
            </span>
            <span className="font-bold tabular-nums text-[#EBF0EB]">{estimatedTime}</span>
          </div>
          <span className="text-[#EBF0EB]/30" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5 text-[#EBF0EB]">
            <span className="text-[#C8D3C8]">
              {isCustomRoute ? 'Jarak total:' : 'Jarak:'}
            </span>
            <span className="font-bold tabular-nums text-[#EBF0EB]">{estimatedDistance}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default memo(RouteMetrics)
