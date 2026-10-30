import { useMemo, useState } from 'react'
import SearchBar from '../ui/SearchBar'
import CategoryFilter from '../ui/CategoryFilter'
import TouristCard from './TouristCard'

export default function TouristList({
  places,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  onSelect,
}) {
  const [sortOption, setSortOption] = useState('Paling Relevan')

  // Find popular item if available
  const popularSpot = useMemo(
    () => places.find((p) => p.isPopular) || places[0],
    [places],
  )

  return (
    <div className="px-5 pt-2">
      {/* 1. Search Bar */}
      <SearchBar value={query} onChange={onQueryChange} />

      {/* 2. Category Filter Pills */}
      <CategoryFilter active={category} onChange={onCategoryChange} />

      {/* 3. Populer dengan turis (Figma expanded view) */}
      {popularSpot && !query && (
        <section className="mt-5" aria-labelledby="populer-heading">
          <h2 id="populer-heading" className="text-[13px] font-bold tracking-tight text-white">
            Populer dengan turis
          </h2>
          <button
            type="button"
            onClick={() => onSelect(popularSpot.slug)}
            className="mt-2.5 flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white/5 p-2 text-left transition hover:bg-white/10"
          >
            <img
              src={popularSpot.image}
              alt={popularSpot.name}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[13px] font-semibold text-white">
                {popularSpot.name}
              </h3>
              <p className="text-[11px] text-white/70">Bogor, jawa barat</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="text-amber-400">★</span>
                <span className="font-medium text-white">{popularSpot.rating.toFixed(1)}</span>
                <span className="text-white/40">·</span>
                <span>{popularSpot.distance || popularSpot.category}</span>
              </div>
            </div>
          </button>
        </section>
      )}

      {/* 4. Subheader row: count & sort dropdown */}
      <div className="mt-5 flex items-center justify-between">
        <h2 id="tourist-count" className="text-[13px] font-bold text-white">
          {places.length} Tujuan wisata
        </h2>
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setSortOption((prev) =>
                prev === 'Paling Relevan' ? 'Paling sering dikunjungi' : 'Paling Relevan',
              )
            }
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-white/20"
          >
            <span>{sortOption}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* 5. List of tourist cards */}
      {places.length > 0 ? (
        <ul id="tourist-list" className="mt-4 flex flex-col gap-5">
          {places.map((place) => (
            <li key={place.id}>
              <TouristCard place={place} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-white/70">Tidak ada tempat wisata yang cocok.</p>
          <button
            type="button"
            onClick={() => {
              onCategoryChange('Semua')
              onQueryChange('')
            }}
            className="mt-3 inline-block rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-white/20"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  )
}
