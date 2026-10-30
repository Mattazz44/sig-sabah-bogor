import { memo } from 'react'

function TouristCard({ place, onSelect }) {
  const displayLocation = place.address.toLowerCase().includes('bogor barat')
    ? 'Bogor, jawa barat'
    : place.address.toLowerCase().includes('kabupaten')
    ? 'Bogor, jawa barat'
    : 'Bogor, jawa barat'

  return (
    <button
      type="button"
      id={`card-${place.slug}`}
      onClick={() => onSelect(place.slug)}
      className="group block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <div className="relative overflow-hidden rounded-[22px]">
        <img
          src={place.image}
          alt={place.name}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Floating action buttons on top-right: Share and Save/Heart */}
        <div
          className="absolute top-3 right-3 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Bagikan ${place.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`Simpan ${place.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-[15px] font-semibold tracking-tight text-white">{place.name}</h3>
        <p className="mt-0.5 text-[11px] text-white/70">{displayLocation}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/80">
          <span className="text-amber-400">★</span>
          <span className="font-medium text-white">{place.rating.toFixed(1)}</span>
          <span className="text-white/40">·</span>
          <span>{place.distance || `${place.category}`}</span>
        </div>
      </div>
    </button>
  )
}

export default memo(TouristCard)
