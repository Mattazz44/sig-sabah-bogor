import { Popup } from 'react-leaflet'

export default function MapPopup({ place, onSelect, isTransit = false }) {
  if (!place) return null

  const ratingText = typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating

  return (
    <Popup className="wisata-popup" closeButton={false} minWidth={220} maxWidth={220}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect && onSelect(place)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect(place)}
        className="w-[220px] cursor-pointer text-left focus:outline-none"
      >
        <div className="relative">
          <img
            src={place.image}
            alt={place.name}
            className="h-[100px] w-full object-cover"
            loading="lazy"
          />
          {/* 1. BADGE LOKASI TRANSIT PADA MULTI-ROUTE */}
          {isTransit && (
            <span className="absolute top-2 left-2 rounded-full bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold text-white border border-emerald-400/40 shadow-md flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>Lokasi Transit 1</span>
            </span>
          )}
        </div>

        <div className="px-3 py-2.5">
          <p className="text-[13px] font-semibold text-white leading-tight">
            {place.name}
          </p>
          <p className="mt-1 text-[11px] text-white/70">
            {place.category} · ★ {ratingText}
          </p>
          <p className="mt-1.5 text-[10px] font-semibold text-amber-300 flex items-center gap-1">
            <span>{isTransit ? 'Arah Menuju Sini' : 'Lihat Detail'}</span>
            <span>→</span>
          </p>
        </div>
      </div>
    </Popup>
  )
}
