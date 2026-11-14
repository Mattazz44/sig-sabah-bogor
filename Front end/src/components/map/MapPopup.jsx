import { Popup } from 'react-leaflet'
import SafeImage from '../ui/SafeImage'
import { ChevronRightIcon, StarIcon } from '../ui/VectorIcons'

export default function MapPopup({ place, onSelect, isTransit = false }) {
  if (!place) return null

  const ratingText = typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating

  return (
    <Popup
      className="wisata-popup"
      closeButton={false}
      minWidth={180}
      maxWidth={200}
      autoPan={true}
      autoPanPaddingTopLeft={[20, 120]}
      autoPanPaddingBottomRight={[20, 110]}
    >
      <button
        type="button"
        onClick={() => onSelect && onSelect(place)}
        className="block w-[190px] max-w-[200px] text-left transition-transform duration-150 active:scale-[0.98]"
      >
        <div className="relative">
          <SafeImage
            src={place.image}
            alt={place.name}
            className="h-20 w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {isTransit && (
            <span className="absolute top-1.5 left-1.5 z-[2] inline-flex items-center gap-1 rounded-md border border-[#E2D7B5]/40 bg-[#1B261B]/95 px-2 py-0.5 text-[9px] font-semibold text-[#E2D7B5] shadow-sm">
              <span>Lokasi Transit</span>
            </span>
          )}
        </div>

        <div className="px-2.5 py-2">
          <p className="truncate text-[12px] font-semibold leading-tight text-[#EBF0EB]">
            {place.name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#C8D3C8]">
            <span>{place.category}</span>
            <span aria-hidden="true">·</span>
            <StarIcon filled className="h-3 w-3 shrink-0 text-amber-300" />
            <span className="tabular-nums">{ratingText}</span>
          </p>
          <p className="mt-1 flex items-center gap-0.5 text-[10px] font-semibold text-[#E2D7B5]">
            <span>{isTransit ? 'Arah menuju sini' : 'Lihat detail'}</span>
            <ChevronRightIcon className="h-3 w-3 shrink-0" />
          </p>
        </div>
      </button>
    </Popup>
  )
}
