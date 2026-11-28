import SafeImage from '../ui/SafeImage'
import { getBogorFallbackPhoto } from '../../utils/imageHelper'
import { calculateDistanceKm, formatShortDistance } from '../../utils/distance'
import { ChevronRightIcon, MapPinIcon, RouteIcon, StarIcon } from '../ui/VectorIcons'
import { usePreferences } from '../../utils/preferences'

function extractStreetName(address) {
  if (!address || typeof address !== 'string') return null
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => Boolean(part) && !/^(rt|rw)\.?\s*\d+/i.test(part))
  if (parts.length === 0) return null

  const streetPart = parts.find((p) => /^(jl\.?|jalan|gg\.?|gang)\b/i.test(p))
  return streetPart || parts[0]
}

export default function MapPopup({
  place,
  onOpenDetail,
  onStartNavigation,
  onClosePopup,
  onSelect,
  isTransit = false,
  userPosition = null,
  locationStatus = 'idle',
}) {
  const { t, tCategory, distanceUnit } = usePreferences()
  if (!place) return null

  const numericRating = Number(place.rating)
  const hasValidRating = Number.isFinite(numericRating) && numericRating > 0
  const ratingText = hasValidRating ? numericRating.toFixed(1) : null
  const streetName = extractStreetName(place.address)
  const triggerOpenDetail = onOpenDetail || onSelect
  const fallbackPhoto = getBogorFallbackPhoto(place)

  // Hitung jarak aktual dari posisi GPS user menggunakan utilitas distance.js
  let resolvedDistanceKm =
    typeof place.distanceKm === 'number' && Number.isFinite(place.distanceKm)
      ? place.distanceKm
      : null

  if (
    resolvedDistanceKm === null &&
    Array.isArray(userPosition) &&
    userPosition.length >= 2
  ) {
    const destLat = Number(place.coordinates?.lat ?? place.latitude)
    const destLng = Number(place.coordinates?.lng ?? place.longitude)
    if (Number.isFinite(destLat) && Number.isFinite(destLng)) {
      resolvedDistanceKm = calculateDistanceKm(userPosition[0], userPosition[1], destLat, destLng)
    }
  }

  const shortDistanceText =
    place.shortDistance || formatShortDistance(resolvedDistanceKm, { unit: distanceUnit })
  const isGpsActive = Boolean(shortDistanceText)
  const distanceFallbackLabel =
    locationStatus === 'requesting' ? t('map.gpsSearching') : t('map.gpsOff')

  const handleOpen = (e) => {
    e.stopPropagation()
    onClosePopup?.()
    triggerOpenDetail?.(place)
  }

  const handleStart = (e) => {
    e.stopPropagation()
    onClosePopup?.()
    if (onStartNavigation) {
      onStartNavigation(place)
    } else {
      triggerOpenDetail?.(place)
    }
  }

  return (
    <article
      data-map-popup-card="true"
      className="group relative w-[252px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-[#F4EFE6]/15 bg-[#1C241C]/90 text-left text-[#F5F2EB] shadow-2xl backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(244,239,230,0.22)]"
    >
      {/* Area Foto & Ringkasan yang bisa diklik menuju halaman Detail */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t('map.viewDetailAria', { name: place.name })}
        className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F2ECE1]"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.04]">
          <SafeImage
            src={place.image || fallbackPhoto}
            fallback={fallbackPhoto}
            alt={place.name}
            width={252}
            height={158}
            className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent"
          />
          {isTransit && (
            <span className="absolute top-2 left-2 z-[2] inline-flex items-center rounded-full border border-[#DFAA63]/40 bg-[#111711]/85 px-2.5 py-0.5 text-[10px] font-semibold text-[#DFAA63] backdrop-blur-sm">
              {t('map.transitBadge')}
            </span>
          )}
          {place.category && (
            <span className="absolute bottom-2 left-2.5 z-[2] rounded-full border border-[rgba(244,239,230,0.16)] bg-[#111711]/75 px-2.5 py-0.5 text-[10px] font-medium text-[#F5F2EB] backdrop-blur-sm">
              {tCategory(place.category)}
            </span>
          )}
        </div>

        <div className="px-3 pt-2.5 pb-2">
          <h3 className="truncate text-[14px] font-semibold tracking-tight leading-snug text-[#F5F2EB]">
            {place.name}
          </h3>

          {streetName && (
            <p
              data-popup-street="true"
              title={place.address}
              className="mt-0.5 flex items-center gap-1 text-[11px] leading-snug text-[#F5F2EB]/65"
            >
              <MapPinIcon className="h-3 w-3 shrink-0 text-[#F5F2EB]/45" />
              <span className="truncate">{streetName}</span>
            </p>
          )}

          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11.5px]">
            {hasValidRating && (
              <span className="inline-flex shrink-0 items-center gap-1">
                <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />
                <span className="font-semibold not-italic tabular-nums text-[#DFAA63]">
                  {ratingText}
                </span>
              </span>
            )}

            {hasValidRating && (
              <span aria-hidden="true" className="shrink-0 text-[#F5F2EB]/35">
                •
              </span>
            )}

            {isGpsActive ? (
              <span
                data-popup-distance="active"
                title={
                  place.travelTime
                    ? t('map.distanceWithEta', {
                        distance: shortDistanceText,
                        eta: place.travelTime,
                      })
                    : t('map.distanceFromYou', { distance: shortDistanceText })
                }
                className="inline-flex min-w-0 items-center gap-1 text-[#F5F2EB]/85"
              >
                <RouteIcon className="h-3.5 w-3.5 shrink-0 text-[#8AC757]" />
                <span className="truncate font-medium not-italic tabular-nums">
                  {shortDistanceText}
                </span>
              </span>
            ) : (
              <span
                data-popup-distance="gps-off"
                title={t('map.gpsOffHint')}
                className="inline-flex min-w-0 items-center gap-1 text-[#F5F2EB]/55"
              >
                <RouteIcon className="h-3 w-3 shrink-0 text-[#F5F2EB]/45" />
                <span className="truncate text-[11px] font-medium">
                  {distanceFallbackLabel}
                </span>
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Baris Aksi: Tombol Utama "Mulai" + Tombol Sekunder "Detail" */}
      <div className="flex items-center gap-2 border-t border-[#F4EFE6]/10 px-3 py-2.5">
        <button
          type="button"
          id="btn-popup-start-nav"
          data-popup-action="start"
          onClick={handleStart}
          aria-label={t('map.startNavAria', { name: place.name })}
          className="apple-retro-cta inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F2ECE1] px-3 py-1.5 text-[12px] font-semibold text-[#141A14] transition-transform duration-150 hover:bg-[#E7DFD1] active:scale-[0.96]"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <span>{t('map.startBtn')}</span>
        </button>

        <button
          type="button"
          id="btn-popup-detail"
          data-popup-action="detail"
          onClick={handleOpen}
          aria-label={t('map.viewDetailAria', { name: place.name })}
          className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1 rounded-xl border border-[#F4EFE6]/16 bg-white/[0.08] px-3 py-1.5 text-[12px] font-semibold text-[#F5F2EB] transition-colors duration-150 hover:bg-white/[0.15] active:scale-[0.96]"
        >
          <span>{t('map.detailBtn')}</span>
          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    </article>
  )
}
