import { useEffect, useMemo, useRef, useState } from 'react'
import SearchBar from '../ui/SearchBar'
import CategoryFilter from '../ui/CategoryFilter'
import TouristCard from './TouristCard'
import SafeImage from '../ui/SafeImage'
import { useBottomSheet } from '../ui/bottomSheetContext'
import { CheckIcon, ChevronRightIcon, RefreshIcon, StarIcon } from '../ui/VectorIcons'

const SORT_OPTIONS = ['Paling relevan', 'Rating tertinggi', 'Jarak terdekat', 'Terpopuler']

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
  radiusKm = 0,
  onRadiusChange,
  hasUserLocation = false,
  onRequestLocation,
  onSelect,
  onHoverPlace,
  isLoading = false,
  isBackendError = false,
  isRetryingBackend = false,
  onRetryBackend,
  isFavorite,
  toggleFavorite,
}) {
  const sheetCtx = useBottomSheet()
  const [sortOption, setSortOption] = useState('Paling relevan')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [onlyPopular, setOnlyPopular] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [isPopularPressed, setIsPopularPressed] = useState(false)

  const sortMenuRef = useRef(null)

  useEffect(() => {
    if (!sortMenuOpen) return undefined

    const handlePointerDownOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSortMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDownOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [sortMenuOpen])

  const handleFilterChange = (patch) => {
    if ('minRating' in patch) setMinRating(patch.minRating)
    if ('onlyPopular' in patch) setOnlyPopular(patch.onlyPopular)
    if ('onlyFavorites' in patch) setOnlyFavorites(patch.onlyFavorites)
  }

  const handleResetAllFilters = () => {
    onCategoryChange('Semua')
    onQueryChange('')
    onRadiusChange?.(0)
    setMinRating(0)
    setOnlyPopular(false)
    setOnlyFavorites(false)
  }

  const popularSpot = useMemo(
    () => places.find((p) => p.isPopular) || places[0] || null,
    [places],
  )

  const sortedPlaces = useMemo(() => {
    const refined = places.filter((place) => {
      if (minRating > 0 && Number(place.rating || 0) < minRating) return false
      if (onlyPopular && !place.isPopular) return false
      if (onlyFavorites && !isFavorite?.(place.slug)) return false
      return true
    })

    const copy = [...refined]
    if (sortOption === 'Rating tertinggi') {
      return copy.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    }
    if (sortOption === 'Terpopuler') {
      return copy.sort((a, b) => {
        const popDiff = (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
        if (popDiff !== 0) return popDiff
        return Number(b.rating || 0) - Number(a.rating || 0)
      })
    }
    if (sortOption === 'Jarak terdekat') {
      return copy.sort((a, b) => {
        const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY
        const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY
        if (distA !== distB) return distA - distB
        return Number(b.rating || 0) - Number(a.rating || 0)
      })
    }

    // Default: "Paling relevan"
    return copy.sort((a, b) => {
      const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY
      const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY
      if (distA !== distB) return distA - distB
      const popDiff = (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
      if (popDiff !== 0) return popDiff
      return Number(b.rating || 0) - Number(a.rating || 0)
    })
  }, [places, sortOption, minRating, onlyPopular, onlyFavorites, isFavorite])

  const listTransitionKey = `${category}|${sortOption}|${minRating}|${onlyPopular}|${onlyFavorites}|${radiusKm}`

  return (
    <div className="px-4 pt-1.5">
      {/* 1. Search Bar */}
      <SearchBar
        value={query}
        onChange={onQueryChange}
        onSubmit={() => {
          if (sortedPlaces.length > 0) {
            onSelect?.(sortedPlaces[0])
          }
        }}
      />

      {/* 2. Category Filter + Tombol Filter Lanjutan */}
      <CategoryFilter
        active={category}
        onChange={onCategoryChange}
        minRating={minRating}
        onlyPopular={onlyPopular}
        onlyFavorites={onlyFavorites}
        radiusKm={radiusKm}
        onRadiusChange={onRadiusChange}
        hasUserLocation={hasUserLocation}
        onRequestLocation={onRequestLocation}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetAllFilters}
        resultCount={sortedPlaces.length}
        isOpen={filterOpen}
        onToggleOpen={(next) => {
          if (next) {
            setSortMenuOpen(false)
            sheetCtx?.ensurePeekCleared?.()
          }
          setFilterOpen(next)
        }}
        onClose={() => setFilterOpen(false)}
      />

      {/* 3. Sorotan Populer (Apple Maps Favorites Compact Row) */}
      {popularSpot && !query && !isLoading && (
        <section className="mt-5" aria-labelledby="populer-heading">
          <h2 id="populer-heading" className="text-[13px] font-semibold tracking-tight text-[#F5F2EB]/90">
            Populer dengan pengunjung
          </h2>
          <div className="mt-1.5 border-b border-[rgba(244,239,230,0.12)] pb-3">
            <button
              type="button"
              data-pressed={isPopularPressed ? 'true' : 'false'}
              onPointerDown={() => setIsPopularPressed(true)}
              onPointerUp={() => setIsPopularPressed(false)}
              onPointerCancel={() => setIsPopularPressed(false)}
              onMouseEnter={() => onHoverPlace?.(popularSpot.id)}
              onMouseLeave={() => {
                setIsPopularPressed(false)
                onHoverPlace?.(null)
              }}
              onFocus={() => onHoverPlace?.(popularSpot.id)}
              onBlur={() => onHoverPlace?.(null)}
              onClick={() => onSelect?.(popularSpot)}
              className={`group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2 text-left transition-all duration-150 ease-out ${
                isPopularPressed
                  ? 'scale-[0.985] bg-white/[0.1]'
                  : 'hover:bg-white/[0.06]'
              }`}
            >
              <div className="apple-retro-bevel relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-[rgba(244,239,230,0.16)]">
                <SafeImage
                  src={popularSpot.image}
                  alt={popularSpot.name}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-35"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
                  {popularSpot.name}
                </h3>
                <p className="mt-0.5 truncate text-[12px] text-[#F5F2EB]/60">
                  {formatCompactArea(popularSpot.address)}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#F5F2EB]/80">
                  <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />
                  <span className="font-mono font-semibold text-[#F5F2EB] tabular-nums tracking-wide">
                    {Number(popularSpot.rating || 0).toFixed(1)}
                  </span>
                  <span className="text-[#F5F2EB]/35" aria-hidden="true">·</span>
                  <span className="truncate font-mono text-[11.5px] tabular-nums tracking-wide text-[#F5F2EB]/65">
                    {popularSpot.distance || popularSpot.category}
                  </span>
                </div>
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/35 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]/80" />
            </button>
          </div>
        </section>
      )}

      {/* 4. Subheader jumlah & Dropdown Pengurutan (Liquid Glass melayang z-[700]) */}
      <div className="relative z-30 mt-4 flex items-center justify-between gap-2">
        <h2 id="tourist-count" className="text-[13px] font-semibold tracking-tight text-[#F5F2EB]">
          {isLoading ? (
            'Memuat destinasi...'
          ) : (
            <>
              <span className="font-mono tabular-nums tracking-wide">{sortedPlaces.length}</span>{' '}
              Tujuan wisata
            </>
          )}
        </h2>

        <div ref={sortMenuRef} className="relative" data-no-sheet-drag>
          <button
            type="button"
            id="btn-sort-dropdown"
            data-no-sheet-drag
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              const next = !sortMenuOpen
              if (next) {
                setFilterOpen(false)
                sheetCtx?.ensurePeekCleared?.()
              }
              setSortMenuOpen(next)
            }}
            aria-haspopup="listbox"
            aria-expanded={sortMenuOpen}
            aria-controls="sort-dropdown-menu"
            aria-label={`Urutan daftar: ${sortOption}. Klik untuk mengubah`}
            className={`apple-retro-bevel relative flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium text-[#F5F2EB] transition-all duration-150 active:scale-[0.95] before:absolute before:-inset-y-1.5 before:inset-x-0 ${
              sortMenuOpen
                ? 'border-[#DFAA63]/50 bg-white/[0.15]'
                : 'border-[rgba(244,239,230,0.16)] bg-white/[0.08] hover:bg-white/[0.14]'
            }`}
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
              className={`transition-transform duration-[180ms] ease-out motion-reduce:transition-none ${
                sortMenuOpen ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <ul
            id="sort-dropdown-menu"
            role="listbox"
            aria-label="Pilihan pengurutan destinasi"
            aria-hidden={!sortMenuOpen}
            data-no-sheet-drag
            onPointerDown={(e) => e.stopPropagation()}
            className={`liquid-glass-modal absolute top-full right-0 z-[700] mt-2 min-w-[196px] origin-top-right rounded-2xl p-1.5 transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              sortMenuOpen
                ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
            }`}
          >
            {SORT_OPTIONS.map((option) => {
              const isSelected = option === sortOption
              return (
                <li key={option} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    tabIndex={sortMenuOpen ? 0 : -1}
                    onClick={() => {
                      setSortOption(option)
                      setSortMenuOpen(false)
                    }}
                    className={`flex min-h-[38px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition-colors duration-150 active:scale-[0.97] ${
                      isSelected
                        ? 'bg-[#DFAA63]/15 font-semibold text-[#DFAA63]'
                        : 'font-medium text-[#F5F2EB] hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* 5. Daftar destinasi wisata + animasi pergantian + loading/error/empty states */}
      {isLoading && places.length === 0 ? (
        <div className="mt-3.5 flex flex-col" aria-live="polite">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="border-b border-white/10 py-4 first:pt-1 last:border-b-0 last:pb-0"
            >
              <div className="aspect-[16/10] w-full rounded-2xl bg-white/[0.07]" />
              <div className="space-y-2 pt-2.5">
                <div className="h-4 w-2/3 rounded-md bg-white/[0.08]" />
                <div className="h-3 w-1/2 rounded-md bg-white/[0.05]" />
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
        <ul key={listTransitionKey} id="tourist-list" className="mt-3.5 flex flex-col">
          {sortedPlaces.map((place, index) => (
            <li
              key={place.id}
              className="animate-tourist-card border-b border-white/10 py-4 first:pt-1 last:border-b-0 last:pb-0"
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              <TouristCard
                place={place}
                onSelect={onSelect}
                onHover={onHoverPlace}
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
            onClick={handleResetAllFilters}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/[0.08] px-4 text-[12px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[#EBF0EB]/[0.15] active:scale-[0.97]"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  )
}
