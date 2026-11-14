import { useMemo, useState } from 'react'
import SearchBar from '../ui/SearchBar'
import CategoryFilter from '../ui/CategoryFilter'
import TouristCard from './TouristCard'
import SafeImage from '../ui/SafeImage'
import { RefreshIcon, StarIcon } from '../ui/VectorIcons'

function formatCompactArea(address) {
  if (!address || typeof address !== 'string') return 'Bogor, Jawa Barat'
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
  }
  return parts[0] || 'Bogor, Jawa Barat'
}

export default function TouristList({
  places,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  onSelect,
  isLoading = false,
  isBackendError = false,
  isRetryingBackend = false,
  onRetryBackend,
  isFavorite,
  toggleFavorite,
}) {
  const [sortOption, setSortOption] = useState('Paling relevan')

  const popularSpot = useMemo(
    () => places.find((p) => p.isPopular) || places[0] || null,
    [places],
  )

  const sortedPlaces = useMemo(() => {
    const copy = [...places]
    if (sortOption === 'Rating tertinggi') {
      return copy.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    }
    return copy.sort((a, b) => {
      const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY
      const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY
      if (distA !== distB) return distA - distB
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
    })
  }, [places, sortOption])

  return (
    <div className="px-5 pt-2">
      {/* 1. Search Bar */}
      <SearchBar value={query} onChange={onQueryChange} />

      {/* 2. Category Filter */}
      <CategoryFilter active={category} onChange={onCategoryChange} />

      {/* 3. Sorotan Populer */}
      {popularSpot && !query && !isLoading && (
        <section className="mt-5" aria-labelledby="populer-heading">
          <h2 id="populer-heading" className="text-[13px] font-bold tracking-tight text-[#EBF0EB]">
            Populer dengan pengunjung
          </h2>
          <button
            type="button"
            onClick={() => onSelect(popularSpot.slug)}
            className="mt-2.5 flex w-full items-center gap-3 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020] p-2.5 text-left transition-colors duration-150 hover:bg-[#2A3927] active:scale-[0.98]"
          >
            <SafeImage
              src={popularSpot.image}
              alt={popularSpot.name}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[13px] font-semibold text-[#EBF0EB]">
                {popularSpot.name}
              </h3>
              <p className="truncate text-[12px] text-[#C8D3C8]">
                {formatCompactArea(popularSpot.address)}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#EBF0EB]/90">
                <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                <span className="font-semibold text-[#EBF0EB] tabular-nums">
                  {Number(popularSpot.rating || 0).toFixed(1)}
                </span>
                <span className="text-[#9AA89A]" aria-hidden="true">·</span>
                <span className="text-[#C8D3C8]">{popularSpot.distance || popularSpot.category}</span>
              </div>
            </div>
          </button>
        </section>
      )}

      {/* 4. Subheader jumlah & pengurutan */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <h2 id="tourist-count" className="text-[13px] font-bold text-[#EBF0EB] tabular-nums">
          {isLoading ? 'Memuat destinasi...' : `${sortedPlaces.length} Tujuan wisata`}
        </h2>
        <button
          type="button"
          onClick={() =>
            setSortOption((prev) =>
              prev === 'Paling relevan' ? 'Rating tertinggi' : 'Paling relevan',
            )
          }
          aria-label={`Urutan daftar: ${sortOption}. Klik untuk mengubah`}
          className="relative flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#EBF0EB]/[0.08] px-3 py-1.5 text-[12px] font-medium text-[#EBF0EB] transition-colors duration-150 hover:bg-[#EBF0EB]/[0.15] active:scale-[0.97] before:absolute before:-inset-1"
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
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* 5. Daftar destinasi wisata + loading/error/empty states */}
      {isLoading && places.length === 0 ? (
        <div className="mt-4 flex flex-col gap-4" aria-live="polite">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-2xl border border-[#EBF0EB]/10 bg-[#233020]"
            >
              <div className="aspect-[16/10] w-full bg-[#1C2719]" />
              <div className="space-y-2 p-3.5">
                <div className="h-4 w-2/3 rounded-md bg-[#2E3E2A]" />
                <div className="h-3 w-1/2 rounded-md bg-[#2A3826]" />
              </div>
            </div>
          ))}
        </div>
      ) : isBackendError && places.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-rose-400/25 bg-[#2a1216] p-5 text-center">
          <p className="text-[13px] font-semibold text-[#EBF0EB]">
            Daftar destinasi gagal dimuat
          </p>
          <p className="mt-1 text-[12px] text-rose-100/85">
            Pastikan server backend aktif lalu muat ulang data wisata.
          </p>
          {onRetryBackend && (
            <button
              type="button"
              onClick={onRetryBackend}
              disabled={isRetryingBackend}
              className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/12 px-4 text-[12px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#EBF0EB]/20 disabled:opacity-50"
            >
              <RefreshIcon className={`h-3.5 w-3.5 ${isRetryingBackend ? 'animate-spin' : ''}`} />
              <span>{isRetryingBackend ? 'Menghubungkan...' : 'Muat ulang'}</span>
            </button>
          )}
        </div>
      ) : sortedPlaces.length > 0 ? (
        <ul id="tourist-list" className="mt-4 flex flex-col gap-5">
          {sortedPlaces.map((place) => (
            <li key={place.id}>
              <TouristCard
                place={place}
                onSelect={onSelect}
                saved={Boolean(isFavorite?.(place.slug))}
                onToggleFavorite={toggleFavorite}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-[#C8D3C8]">Tidak ada tempat wisata yang cocok.</p>
          <button
            type="button"
            onClick={() => {
              onCategoryChange('Semua')
              onQueryChange('')
            }}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/[0.08] px-4 text-[12px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[#EBF0EB]/[0.15] active:scale-[0.97]"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  )
}
