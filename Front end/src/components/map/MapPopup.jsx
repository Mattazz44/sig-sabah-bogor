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
    triggerOpenDetail?.(place)
  }

  return (
    <article
      className="group relative w-[244px] max-w-[256px] overflow-hidden rounded-2xl border border-[#F4EFE6]/15 bg-[#1C241C]/85 text-left text-[#F5F2EB] shadow-2xl backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(244,239,230,0.22)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.04]">
        <SafeImage
          src={place.image || fallbackPhoto}
          fallback={fallbackPhoto}
          alt={place.name}
          width={244}
          height={152}
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

      <div className="p-3">
        <h3 className="truncate text-[13.5px] font-semibold tracking-tight leading-snug text-[#F5F2EB]">
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

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-[11.5px]">
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
                className="inline-flex min-w-0 items-center gap-1 text-[#F5F2EB]/50"
              >
                <RouteIcon className="h-3 w-3 shrink-0 text-[#F5F2EB]/45" />
                <span className="truncate text-[11px] font-medium">
                  {distanceFallbackLabel}
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpen}
            aria-label={t('map.viewDetailAria', { name: place.name })}
            className="apple-retro-cta z-[2] inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-[#F2ECE1] px-3.5 py-1.5 text-[11.5px] font-semibold text-[#141A14] transition-transform duration-150 active:scale-[0.96] after:absolute after:inset-0 after:z-[1] after:content-['']"
          >
            <span>{isTransit ? t('map.routeBtn') : t('map.detailBtn')}</span>
            <ChevronRightIcon className="h-3 w-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
