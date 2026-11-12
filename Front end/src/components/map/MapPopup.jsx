import { Popup } from 'react-leaflet'
import SafeImage from '../ui/SafeImage'

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
      autoPanPaddingBottomRight={[20, 100]}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect && onSelect(place)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect(place)}
        className="w-[190px] max-w-[200px] cursor-pointer text-left active:scale-[0.98] transition-transform duration-150 focus:outline-none"
      >
        <div className="relative">
          <SafeImage
            src={place.image}
            alt={place.name}
            className="h-20 w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* 1. BADGE LOKASI TRANSIT PADA MULTI-ROUTE */}
          {isTransit && (
            <span className="absolute top-1.5 left-1.5 z-[2] rounded-full bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 text-[8.5px] font-bold text-white border border-emerald-400/40 shadow-sm flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>Lokasi Transit 1</span>
            </span>
          )}
        </div>

        <div className="px-2.5 py-2">
          <p className="text-[12px] font-semibold text-white leading-tight truncate">
            {place.name}
          </p>
          <p className="mt-0.5 text-[10px] text-white/70 truncate">
            {place.category} · ★ {ratingText}
          </p>
          <p className="mt-1 text-[9.5px] font-semibold text-amber-300 flex items-center gap-1">
            <span>{isTransit ? 'Arah Menuju Sini' : 'Lihat Detail'}</span>
            <span>→</span>
          </p>
        </div>
      </div>
    </Popup>
  )
}
