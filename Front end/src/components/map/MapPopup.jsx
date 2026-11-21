import SafeImage from '../ui/SafeImage'
import { getBogorFallbackPhoto } from '../../utils/imageHelper'
import { ChevronRightIcon, StarIcon } from '../ui/VectorIcons'

export default function MapPopup({ place, onOpenDetail, onSelect, isTransit = false }) {
  if (!place) return null

  const ratingText = typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating
  const triggerOpenDetail = onOpenDetail || onSelect
  const fallbackPhoto = getBogorFallbackPhoto(place)

  const handleOpen = (e) => {
    e.stopPropagation()
    triggerOpenDetail?.(place)
  }

  return (
    <article
      className="group relative w-[228px] max-w-[238px] overflow-hidden rounded-2xl border border-[#F4EFE6]/15 bg-[#1C241C]/80 text-left text-[#F5F2EB] shadow-2xl backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(244,239,230,0.22)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.04]">
        <SafeImage
          src={place.image || fallbackPhoto}
          fallback={fallbackPhoto}
          alt={place.name}
          width={228}
          height={142}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent"
        />
        {isTransit && (
          <span className="absolute top-2 left-2 z-[2] inline-flex items-center rounded-full border border-[#DFAA63]/40 bg-[#111711]/85 px-2.5 py-0.5 text-[10px] font-semibold text-[#DFAA63] backdrop-blur-sm">
            Lokasi transit
          </span>
        )}
        {place.category && (
          <span className="absolute bottom-2 left-2.5 z-[2] rounded-full border border-[rgba(244,239,230,0.16)] bg-[#111711]/75 px-2.5 py-0.5 text-[10px] font-medium text-[#F5F2EB] backdrop-blur-sm">
            {place.category}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-[13.5px] font-semibold tracking-tight leading-snug text-[#F5F2EB]">
          {place.name}
        </h3>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-[11.5px]">
            <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />
            <span className="font-semibold not-italic tabular-nums text-[#DFAA63]">
              {ratingText}
            </span>
            {place.distance && (
              <>
                <span aria-hidden="true" className="text-[#F5F2EB]/35">
                  ·
                </span>
                <span className="truncate not-italic tabular-nums text-[#F5F2EB]/70">
                  {place.distance}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpen}
            aria-label={`Lihat detail ${place.name}`}
            className="apple-retro-cta z-[2] inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-[#F2ECE1] px-3.5 py-1.5 text-[11.5px] font-semibold text-[#141A14] transition-transform duration-150 active:scale-[0.96] after:absolute after:inset-0 after:z-[1] after:content-['']"
          >
            <span>{isTransit ? 'Rute' : 'Detail'}</span>
            <ChevronRightIcon className="h-3 w-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
