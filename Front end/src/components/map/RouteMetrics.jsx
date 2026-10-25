import { memo } from 'react'

function RouteMetrics({
  activeDestination,
  routeInfo,
  isNavigationMode = false,
}) {
  if (!isNavigationMode || !activeDestination) return null

  const isCustomRoute =
    Array.isArray(activeDestination) || Boolean(routeInfo?.isCustomRoute)

  // Judul & Badge
  let title = 'Destinasi Wisata'
  let badgeLabel = 'Navigasi Aktif'

  if (isCustomRoute) {
    badgeLabel = 'Rute Custom Aktif'
    if (Array.isArray(activeDestination)) {
      title = activeDestination
        .map((p) => p.name?.split('-')[0].trim() || 'Titik')
        .join(' ➔ ')
    } else {
      title = activeDestination?.name || 'Rute Custom Wisata'
    }
  } else {
    title = activeDestination?.name || 'Destinasi Wisata'
  }

  // Estimasi Waktu & Jarak
  const estimatedTime = routeInfo?.timeText || (isCustomRoute ? '15 Menit' : activeDestination?.travelTime || '20 Menit')
  const estimatedDistance = routeInfo?.distanceText || (isCustomRoute ? '5.4 KM' : activeDestination?.distance || '16 KM')

  return (
    <aside
      id="route-metrics-panel"
      aria-label="Panel perkiraan rute navigasi"
      className="fixed top-4 inset-x-4 max-w-sm mx-auto z-[1000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl bg-forest-900/95 backdrop-blur-md px-4 py-3 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-[13px] font-bold text-white truncate" title={title}>
              {title}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
            {badgeLabel}
          </span>
        </div>

        {/* Perkiraan Akumulasi Waktu & Jarak Multi-titik */}
        <div className="mt-0.5 flex items-center justify-between border-t border-white/10 pt-2 text-[12px]">
          <div className="flex items-center gap-1.5 text-white/90">
            <span className="text-white/60">
              {isCustomRoute ? 'Estimasi Total:' : 'Estimasi:'}
            </span>
            <span className="font-bold text-white">{estimatedTime}</span>
          </div>
          <span className="text-white/30">|</span>
          <div className="flex items-center gap-1.5 text-white/90">
            <span className="text-white/60">
              {isCustomRoute ? 'Jarak Total:' : 'Jarak:'}
            </span>
            <span className="font-bold text-white">{estimatedDistance}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default memo(RouteMetrics)
