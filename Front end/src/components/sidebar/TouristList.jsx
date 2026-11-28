import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import SearchBar from '../ui/SearchBar'
import CategoryFilter from '../ui/CategoryFilter'
import TouristCard from './TouristCard'
import SafeImage from '../ui/SafeImage'
import { getBogorFallbackPhoto } from '../../utils/imageHelper'
import { useBottomSheet } from '../ui/bottomSheetContext'
import { CheckIcon, ChevronRightIcon, RefreshIcon, StarIcon } from '../ui/VectorIcons'
import { usePreferences } from '../../utils/preferences'

const SORT_OPTIONS = [
  { key: 'Paling relevan', labelKey: 'explore.sortRelevant' },
  { key: 'Rating tertinggi', labelKey: 'explore.sortHighestRated' },
  { key: 'Jarak terdekat', labelKey: 'explore.sortNearest' },
  { key: 'Terpopuler', labelKey: 'explore.sortPopular' },
]

function formatCompactArea(address, fallbackArea) {
  if (!address || typeof address !== 'string') return fallbackArea
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => Boolean(part) && !/^rt\.?\d+/i.test(part))
  if (parts.length >= 3) {
    const kec = parts.find((p) =>
      /kecamatan|bogor\s+(tengah|utara|selatan|timur|barat)|tanah\s+sareal/i.test(p),
    )
    const shortKec = kec ? kec.replace(/^Kecamatan\s+/i, 'Kec. ') : parts[2]
    return `${parts[0]}, ${parts[1]}, ${shortKec}`
  }
  if (parts.length === 2) {
    return `${parts[0]}, ${parts[1]}`
  }
  return parts[0] || fallbackArea
}

export default function TouristList({
  places,
  selectedId = null,
  selectedStamp = 0,
  hoveredPlaceId = null,
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
  const { t, tCategory } = usePreferences()
  const prefersReduced = useReducedMotion()
  const sheetCtx = useBottomSheet()
  const scrollContainerRef = sheetCtx?.scrollContainerRef
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false)
  const scrollYMotion = useMotionValue(0)
  const carouselParallaxY = useTransform(scrollYMotion, [0, 180], [0, -10])
  const carouselParallaxOpacity = useTransform(scrollYMotion, [0, 180], [1, 0.84])
  const [sortOption, setSortOption] = useState('Paling relevan')
  const currentSortLabel =
    t(SORT_OPTIONS.find((opt) => opt.key === sortOption)?.labelKey || 'explore.sortRelevant')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [onlyPopular, setOnlyPopular] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [activeCarouselId, setActiveCarouselId] = useState(null)

  const sortMenuRef = useRef(null)
  const listContainerRef = useRef(null)
  const carouselRef = useRef(null)
  const carouselRafRef = useRef(0)

  useEffect(() => {
    const container = scrollContainerRef?.current || document.getElementById('sidebar-content')
    if (!container) return undefined

    let rafId = 0
    const syncScrollState = () => {
      rafId = 0
      const top = container.scrollTop || 0
      scrollYMotion.set(top)
      setIsHeaderScrolled((prev) => {
        const next = top > 8
        return prev === next ? prev : next
      })
    }

    const handleScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(syncScrollState)
    }

    rafId = window.requestAnimationFrame(syncScrollState)
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [scrollContainerRef, scrollYMotion])

  useEffect(() => {
    if (selectedId === null || selectedId === undefined) return undefined
    const scrollParent = document.getElementById('sidebar-content')
    if (!scrollParent) return undefined
    const isScrollable = window.getComputedStyle(scrollParent).overflowY === 'auto'
    if (!isScrollable) return undefined

    const targetCard = listContainerRef.current?.querySelector(`[data-place-id="${selectedId}"]`)
    if (!targetCard) return undefined

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    const rafId = window.requestAnimationFrame(() => {
      targetCard.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'nearest',
      })
    })
    return () => window.cancelAnimationFrame(rafId)
  }, [selectedId, selectedStamp])

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

  const carouselSpots = useMemo(() => {
    const popularFirst = [...places].sort(
      (a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || Number(b.rating || 0) - Number(a.rating || 0),
    )
    return popularFirst.slice(0, 8)
  }, [places])

  useEffect(() => {
    return () => {
      if (carouselRafRef.current) cancelAnimationFrame(carouselRafRef.current)
    }
  }, [])

  const handleCarouselScroll = () => {
    if (carouselRafRef.current) return
    carouselRafRef.current = requestAnimationFrame(() => {
      carouselRafRef.current = 0
      const container = carouselRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width * 0.42
      const cards = container.querySelectorAll('[data-carousel-place-id]')
      let closestId = null
      let minDist = Number.POSITIVE_INFINITY

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const dist = Math.abs(cardCenter - centerX)
        if (dist < minDist) {
          minDist = dist
          const rawId = card.getAttribute('data-carousel-place-id')
          const numId = Number(rawId)
          closestId = Number.isNaN(numId) ? rawId : numId
        }
      })

      if (closestId !== null && closestId !== activeCarouselId) {
        setActiveCarouselId(closestId)
        onHoverPlace?.(closestId)
      }
    })
  }

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
    <div className="w-full px-4 md:px-5">
      {/* 1 & 2. Sticky Header: Search Bar + Category Filter dengan efek glassmorphism progresif saat di-scroll */}
      <div
        id="explore-sticky-header"
        data-scrolled={isHeaderScrolled ? 'true' : 'false'}
        className={`sticky top-0 z-40 -mx-4 px-4 pt-2 pb-3 md:-mx-5 md:px-5 md:pt-3 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-250 ease-out ${
          isHeaderScrolled
            ? 'border-b border-white/[0.12] bg-[#141B14]/88 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.62)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent shadow-none'
        }`}
      >
        <SearchBar
          value={query}
          onChange={onQueryChange}
          onSubmit={() => {
            if (sortedPlaces.length > 0) {
              onSelect?.(sortedPlaces[0])
            }
          }}
        />

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
      </div>

      {/* 3. Sorotan Populer Interaktif (Header lega, kartu tanpa border kaku, parallax lembut saat scroll) */}
      {carouselSpots.length > 0 && !query && !isLoading && (
        <motion.section
          id="explore-popular-section"
          style={
            prefersReduced
              ? undefined
              : { y: carouselParallaxY, opacity: carouselParallaxOpacity }
          }
          className="mt-1 will-change-transform"
          aria-labelledby="populer-heading"
        >
          <div className="flex items-center justify-between">
            <h2 id="populer-heading" className="text-[13.5px] font-semibold tracking-tight text-[#F5F2EB]/92">
              {t('explore.popularHeading')}
            </h2>
          </div>
          <div
            ref={carouselRef}
            id="explore-card-carousel"
            data-no-sheet-drag
            onScroll={handleCarouselScroll}
            onPointerDown={(e) => e.stopPropagation()}
            className="no-scrollbar scroll-smooth mt-3 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-1 md:-mx-5 md:px-5"
          >
            {carouselSpots.map((spot) => {
              const isSpotSelected = selectedId !== null && spot.id === selectedId
              const isSpotSynced =
                (hoveredPlaceId !== null && spot.id === hoveredPlaceId) ||
                (activeCarouselId !== null && spot.id === activeCarouselId)
              return (
                <motion.button
                  key={spot.id}
                  type="button"
                  data-carousel-place-id={spot.id}
                  data-selected={isSpotSelected ? 'true' : 'false'}
                  data-synced={isSpotSynced ? 'true' : 'false'}
                  aria-current={isSpotSelected ? 'location' : undefined}
                  whileHover={prefersReduced ? undefined : { y: -2 }}
                  whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={() => {
                    setActiveCarouselId(spot.id)
                    onHoverPlace?.(spot.id)
                  }}
                  onMouseLeave={() => onHoverPlace?.(null)}
                  onFocus={() => {
                    setActiveCarouselId(spot.id)
                    onHoverPlace?.(spot.id)
                  }}
                  onClick={() => onSelect?.(spot)}
                  className={`group flex w-[264px] min-w-[264px] shrink-0 snap-start items-center gap-3.5 rounded-2xl p-3.5 text-left transition-[background-color,box-shadow] duration-200 ease-out will-change-transform ${
                    isSpotSelected
                      ? 'bg-[#DFAA63]/[0.16] shadow-[0_10px_24px_-10px_rgba(223,170,99,0.28)]'
                      : isSpotSynced
                        ? 'bg-white/[0.11] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)]'
                        : 'bg-white/[0.055] hover:bg-white/[0.095]'
                  }`}
                >
                  <div className="relative aspect-[16/10] w-[76px] shrink-0 overflow-hidden rounded-xl bg-black/25">
                    <SafeImage
                      src={spot.image || getBogorFallbackPhoto(spot)}
                      fallback={getBogorFallbackPhoto(spot)}
                      alt={spot.name}
                      width={160}
                      height={100}
                      loading="eager"
                      className={`h-full w-full object-cover object-center transition-transform duration-200 ease-out ${
                        isSpotSynced ? 'scale-105' : 'group-hover:scale-105'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1 pr-0.5">
                    <h3
                      className={`truncate text-[13.5px] font-semibold tracking-tight transition-colors duration-200 ${
                        isSpotSelected || isSpotSynced
                          ? 'text-[#DFAA63]'
                          : 'text-[#F5F2EB] group-hover:text-[#DFAA63]'
                      }`}
                      title={spot.name}
                    >
                      {spot.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[11.5px] text-[#F5F2EB]/60">
                      {formatCompactArea(spot.address, t('common.bogorCityWestJava'))}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#F5F2EB]/80">
                      <StarIcon filled className="h-3 w-3 shrink-0 text-[#DFAA63]" />
                      <span className="font-semibold not-italic tabular-nums text-[#F5F2EB]">
                        {Number(spot.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-[#F5F2EB]/35" aria-hidden="true">·</span>
                      <span className="truncate text-[11px] not-italic tabular-nums text-[#F5F2EB]/65">
                        {spot.distance || tCategory(spot.category)}
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon
                    className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                      isSpotSelected || isSpotSynced
                        ? 'translate-x-0.5 text-[#DFAA63]'
                        : 'text-[#F5F2EB]/40 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]/85'
                    }`}
                  />
                </motion.button>
              )
            })}
          </div>
        </motion.section>
      )}

      {/* 4. Subheader jumlah & Dropdown Pengurutan (spasi vertikal lega 32px tanpa garis pembatas) */}
      <div id="explore-list-header" className="relative z-30 mt-8 flex items-center justify-between gap-2">
        <h2 id="tourist-count" className="text-[13px] font-semibold tracking-tight text-[#F5F2EB]">
          {isLoading ? (
            t('explore.loadingDestinations')
          ) : (
            <>
              <span className="not-italic tabular-nums">{sortedPlaces.length}</span>{' '}
              {t('explore.destinationsLabel')}
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
            aria-label={t('explore.sortAria', { sort: currentSortLabel })}
            className={`apple-retro-bevel relative flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium text-[#F5F2EB] transition-all duration-150 active:scale-[0.95] before:absolute before:-inset-y-1.5 before:inset-x-0 ${
              sortMenuOpen
                ? 'border-[#DFAA63]/50 bg-white/[0.15]'
                : 'border-[rgba(244,239,230,0.16)] bg-white/[0.08] hover:bg-white/[0.14]'
            }`}
          >
            <span>{currentSortLabel}</span>
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
            aria-label={t('explore.sortListAria')}
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
              const isSelected = option.key === sortOption
              return (
                <li key={option.key} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    tabIndex={sortMenuOpen ? 0 : -1}
                    onClick={() => {
                      setSortOption(option.key)
                      setSortMenuOpen(false)
                    }}
                    className={`flex min-h-[38px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition-colors duration-150 active:scale-[0.97] ${
                      isSelected
                        ? 'bg-[#DFAA63]/15 font-semibold text-[#DFAA63]'
                        : 'font-medium text-[#F5F2EB] hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{t(option.labelKey)}</span>
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
        <div className="mt-4 flex flex-col" aria-live="polite">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="border-b border-white/10 py-4 first:pt-1 last:border-b-0 last:pb-0"
            >
              <div className="shimmer-skeleton aspect-[16/10] w-full rounded-2xl bg-white/[0.04]" />
              <div className="space-y-2 pt-2.5">
                <div className="shimmer-skeleton h-4 w-2/3 rounded-md bg-white/[0.04]" />
                <div className="shimmer-skeleton h-3 w-1/2 rounded-md bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : isBackendError && places.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-rose-400/25 bg-[#2a1216] p-5 text-center">
          <p className="text-[13px] font-semibold text-[#EBF0EB]">
            {t('explore.loadFailedTitle')}
          </p>
          <p className="mt-1 text-[12px] text-rose-100/85">
            {t('explore.loadFailedDesc')}
          </p>
          {onRetryBackend && (
            <button
              type="button"
              onClick={onRetryBackend}
              disabled={isRetryingBackend}
              className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/12 px-4 text-[12px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#EBF0EB]/20 disabled:opacity-50"
            >
              <RefreshIcon className={`h-3.5 w-3.5 ${isRetryingBackend ? 'animate-spin' : ''}`} />
              <span>{isRetryingBackend ? t('explore.connecting') : t('common.reload')}</span>
            </button>
          )}
        </div>
      ) : sortedPlaces.length > 0 ? (
        <ul key={listTransitionKey} ref={listContainerRef} id="tourist-list" className="mt-4 flex flex-col">
          {sortedPlaces.map((place, index) => (
            <motion.li
              key={place.id}
              data-scroll-reveal="true"
              initial={prefersReduced ? false : { opacity: 0, y: 16, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{
                once: true,
                amount: 0.15,
                root: scrollContainerRef,
              }}
              transition={
                prefersReduced
                  ? { duration: 0.01 }
                  : {
                      duration: 0.35,
                      delay: index < 4 ? index * 0.045 : 0.02,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
              className="border-b border-white/10 py-3.5 first:pt-0 last:border-b-0 last:pb-0 will-change-transform"
            >
              <TouristCard
                place={place}
                onSelect={onSelect}
                onHover={onHoverPlace}
                isSelected={selectedId !== null && place.id === selectedId}
                isMapHovered={hoveredPlaceId !== null && place.id === hoveredPlaceId}
                isPriorityImage={index < 4}
                saved={Boolean(isFavorite?.(place.slug))}
                onToggleFavorite={toggleFavorite}
              />
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-[#C8D3C8]">{t('explore.noMatch')}</p>
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/[0.08] px-4 text-[12px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[#EBF0EB]/[0.15] active:scale-[0.97]"
          >
            {t('common.resetFilter')}
          </button>
        </div>
      )}
    </div>
  )
}
