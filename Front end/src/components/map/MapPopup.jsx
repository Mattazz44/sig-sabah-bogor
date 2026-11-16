import SafeImage from '../ui/SafeImage'
import { ChevronRightIcon, StarIcon } from '../ui/VectorIcons'

export default function MapPopup({ place, onOpenDetail, onSelect, isTransit = false }) {
  if (!place) return null

  const ratingText = typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating
  const triggerOpenDetail = onOpenDetail || onSelect

  const handleOpen = (e) => {
    e.stopPropagation()
    triggerOpenDetail?.(place)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleOpen(e)
        }
      }}
      className="group block w-[205px] max-w-[215px] cursor-pointer overflow-hidden rounded-xl text-left transition-transform duration-150 active:scale-[0.98]"
    >
      <div className="relative overflow-hidden">
        <SafeImage
          src={place.image}
          alt={place.name}
          className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {isTransit && (
          <span className="absolute top-1.5 left-1.5 z-[2] inline-flex items-center gap-1 rounded-md border border-[#E2D7B5]/40 bg-[#1B261B]/95 px-2 py-0.5 text-[9px] font-semibold text-[#E2D7B5] shadow-sm">
            <span>Lokasi Transit</span>
          </span>
        )}
        {place.category && (
          <span className="absolute bottom-1.5 left-2 z-[2] rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/95 backdrop-blur-sm">
            {place.category}
          </span>
        )}
      </div>

      <div className="bg-[#1A261A] p-2.5">
        <p className="truncate text-[13px] font-bold leading-tight text-[#EBF0EB]">
          {place.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#C8D3C8]">
          <StarIcon filled className="h-3 w-3 shrink-0 text-amber-300" />
          <span className="font-semibold text-white tabular-nums">{ratingText}</span>
          {place.distance && (
            <>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="truncate">{place.distance}</span>
            </>
          )}
        </p>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-[#E2D7B5]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#E2D7B5] transition-colors group-hover:bg-[#E2D7B5]/25">
          <span>{isTransit ? 'Arah menuju sini' : 'Lihat detail'}</span>
          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  )
}
