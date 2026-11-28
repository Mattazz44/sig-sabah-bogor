import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_CATEGORY, CATEGORIES } from './categories'
import { CheckIcon, StarIcon, XIcon } from './VectorIcons'
import { usePreferences } from '../../utils/preferences'

const RATING_OPTIONS = [
  { key: 'all', value: 0 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
]

const RADIUS_VALUES = [0, 2, 5, 10]

export default function CategoryFilter({
  active,
  onChange,
  minRating = 0,
  onlyPopular = false,
  onlyFavorites = false,
  radiusKm = 0,
  onRadiusChange,
  hasUserLocation = false,
  onRequestLocation,
  onFilterChange,
  onResetFilters,
  resultCount = 0,
  isOpen,
  onToggleOpen,
  onClose,
}) {
  const { t, tCategory, distanceUnit } = usePreferences()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof isOpen === 'boolean'
  const filterOpen = isControlled ? isOpen : internalOpen

  const containerRef = useRef(null)

  const setOpenState = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(filterOpen) : next
      if (!isControlled) setInternalOpen(resolved)
      if (resolved) {
        if (onToggleOpen) onToggleOpen(true)
      } else if (onClose) {
        onClose()
      } else if (onToggleOpen) {
        onToggleOpen(false)
      }
    },
    [filterOpen, isControlled, onToggleOpen, onClose],
  )

  useEffect(() => {
    if (!filterOpen) return undefined

    const handlePointerDownOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenState(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenState(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDownOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [filterOpen, setOpenState])

  const activeAdvancedCount =
    (minRating > 0 ? 1 : 0) +
    (onlyPopular ? 1 : 0) +
    (onlyFavorites ? 1 : 0) +
    (radiusKm > 0 ? 1 : 0)
  const hasAnyFilter = active !== ALL_CATEGORY || activeAdvancedCount > 0

  return (
    <div ref={containerRef} className="relative z-40 mt-4 flex items-center gap-2.5">
      <button
        type="button"
        id="btn-advanced-filter"
        data-no-sheet-drag
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpenState(!filterOpen)}
        aria-expanded={filterOpen}
        aria-haspopup="dialog"
        aria-controls="advanced-filter-popover"
        aria-label={
          activeAdvancedCount > 0
            ? t('explore.filterBtnAriaActive', { count: activeAdvancedCount })
            : t('explore.filterBtnAria')
        }
        title={t('explore.filterBtnTitle')}
        className={`apple-retro-bevel relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-150 active:scale-[0.95] before:absolute before:-inset-1.5 ${
          filterOpen || activeAdvancedCount > 0
            ? 'border-[#DFAA63]/55 bg-[#DFAA63]/20 text-[#DFAA63]'
            : 'border-[rgba(244,239,230,0.16)] bg-white/[0.08] text-[#F5F2EB]/85 hover:bg-white/[0.14] hover:text-[#F5F2EB]'
        }`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 6h18M6 12h12M10 18h4" />
        </svg>
        {activeAdvancedCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DFAA63] px-1 text-[10px] font-bold not-italic tabular-nums text-[#141A14]"
          >
            {activeAdvancedCount}
          </span>
        )}
      </button>

      <div
        role="tablist"
        aria-label={t('explore.categoryTabsAria')}
        className="no-scrollbar flex min-w-0 flex-1 gap-2.5 overflow-x-auto py-0.5 pr-5"
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat === active
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="tourist-list"
              id={`filter-${cat.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              onClick={() => onChange(cat)}
              className={`relative flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-all duration-150 active:scale-[0.95] before:absolute before:-inset-y-1.5 before:inset-x-0 ${
                isActive
                  ? 'apple-retro-cta font-semibold'
                  : 'apple-retro-bevel border border-[rgba(244,239,230,0.14)] bg-white/[0.07] text-[#F5F2EB]/80 hover:bg-white/[0.13] hover:text-[#F5F2EB]'
              }`}
            >
              {tCategory(cat)}
            </button>
          )
        })}
      </div>

      {/* Floating Popover Filter Lanjutan (Liquid Glass + Retro Bevel, z-[700]) */}
      <div
        id="advanced-filter-popover"
        role="dialog"
        aria-label={t('explore.filterBtnTitle')}
        aria-hidden={!filterOpen}
        data-no-sheet-drag
        onPointerDown={(e) => e.stopPropagation()}
        className={`liquid-glass-modal absolute top-full left-0 z-[700] mt-2 w-[min(312px,calc(100vw-2.5rem))] origin-top-left rounded-2xl p-3.5 text-[#F5F2EB] transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          filterOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[rgba(244,239,230,0.14)] pb-2.5">
          <p className="text-[13px] font-semibold tracking-tight text-[#F5F2EB]">
            {t('explore.filterDialogTitle')}
          </p>
          <button
            type="button"
            tabIndex={filterOpen ? 0 : -1}
            onClick={() => setOpenState(false)}
            aria-label={t('explore.filterCloseAria')}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#C8D3C8] transition-colors hover:bg-white/[0.14] hover:text-[#EBF0EB] active:scale-[0.95]"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Kategori Cepat */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#C8D3C8]">
            {t('explore.filterCategory')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const selected = cat === active
              return (
                <button
                  key={`pop-${cat}`}
                  type="button"
                  tabIndex={filterOpen ? 0 : -1}
                  onClick={() => onChange(cat)}
                  className={`rounded-xl border px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 active:scale-[0.95] ${
                    selected
                      ? 'border-[#E2D7B5]/45 bg-white/[0.14] font-semibold text-[#E2D7B5]'
                      : 'border-white/10 bg-white/[0.05] text-[#EBF0EB] hover:bg-white/[0.1]'
                  }`}
                >
                  {tCategory(cat)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Rating Minimum */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#F5F2EB]/60">
            {t('explore.filterMinRating')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {RATING_OPTIONS.map((opt) => {
              const selected = minRating === opt.value
              const optLabel = opt.key === 'all' ? tCategory(ALL_CATEGORY) : opt.label
              return (
                <button
                  key={opt.value}
                  type="button"
                  tabIndex={filterOpen ? 0 : -1}
                  onClick={() => onFilterChange?.({ minRating: opt.value })}
                  className={`flex items-center justify-center gap-1 rounded-xl border py-1.5 text-[11.5px] not-italic tabular-nums font-medium transition-all duration-150 active:scale-[0.95] ${
                    selected
                      ? 'border-[#DFAA63]/45 bg-[#DFAA63]/15 font-semibold text-[#DFAA63]'
                      : 'border-[rgba(244,239,230,0.12)] bg-white/[0.05] text-[#F5F2EB] hover:bg-white/[0.1]'
                  }`}
                >
                  {opt.value > 0 && <StarIcon filled className="h-3 w-3 text-[#DFAA63]" />}
                  <span>{optLabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Radius Terdekat (WBS 1.3.6) */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F5F2EB]/60">
              {t('explore.filterRadius')}
            </p>
            {!hasUserLocation && (
              <span className="text-[10px] text-[#DFAA63]">{t('explore.filterNeedsGps')}</span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {RADIUS_VALUES.map((kmVal) => {
              const selected = radiusKm === kmVal
              const label =
                kmVal === 0
                  ? tCategory(ALL_CATEGORY)
                  : distanceUnit === 'mi'
                    ? `≤ ${(kmVal * 0.621371).toFixed(1)} mi`
                    : `≤ ${kmVal} km`
              return (
                <button
                  key={`rad-${kmVal}`}
                  type="button"
                  tabIndex={filterOpen ? 0 : -1}
                  onClick={() => {
                    if (kmVal > 0 && !hasUserLocation) {
                      onRequestLocation?.()
                    }
                    onRadiusChange?.(kmVal)
                  }}
                  className={`flex items-center justify-center rounded-xl border py-1.5 font-mono text-[11px] tabular-nums tracking-wide font-medium transition-all duration-150 active:scale-[0.95] ${
                    selected
                      ? 'border-[#DFAA63]/45 bg-[#DFAA63]/15 font-semibold text-[#DFAA63]'
                      : 'border-[rgba(244,239,230,0.12)] bg-white/[0.05] text-[#F5F2EB] hover:bg-white/[0.1]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preferensi Tambahan */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#F5F2EB]/60">
            {t('explore.filterPreferences')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              tabIndex={filterOpen ? 0 : -1}
              onClick={() => onFilterChange?.({ onlyPopular: !onlyPopular })}
              aria-pressed={onlyPopular}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 active:scale-[0.95] ${
                onlyPopular
                  ? 'border-[#DFAA63]/45 bg-[#DFAA63]/15 font-semibold text-[#DFAA63]'
                  : 'border-[rgba(244,239,230,0.12)] bg-white/[0.05] text-[#F5F2EB] hover:bg-white/[0.1]'
              }`}
            >
              {onlyPopular && <CheckIcon className="h-3 w-3 text-[#DFAA63]" />}
              <span>{t('explore.filterOnlyPopular')}</span>
            </button>

            <button
              type="button"
              tabIndex={filterOpen ? 0 : -1}
              onClick={() => onFilterChange?.({ onlyFavorites: !onlyFavorites })}
              aria-pressed={onlyFavorites}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 active:scale-[0.95] ${
                onlyFavorites
                  ? 'border-[#DFAA63]/45 bg-[#DFAA63]/15 font-semibold text-[#DFAA63]'
                  : 'border-[rgba(244,239,230,0.12)] bg-white/[0.05] text-[#F5F2EB] hover:bg-white/[0.1]'
              }`}
            >
              {onlyFavorites && <CheckIcon className="h-3 w-3 text-[#DFAA63]" />}
              <span>{t('explore.filterMyFavorites')}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3.5 flex items-center gap-2 border-t border-[rgba(244,239,230,0.14)] pt-2.5">
          <button
            type="button"
            tabIndex={filterOpen ? 0 : -1}
            disabled={!hasAnyFilter}
            onClick={() => onResetFilters?.()}
            className="apple-glass-pill min-h-[36px] rounded-xl px-3 text-[12px] font-semibold text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.12] active:scale-[0.95] disabled:opacity-45"
          >
            {t('common.reset')}
          </button>
          <button
            type="button"
            tabIndex={filterOpen ? 0 : -1}
            onClick={() => setOpenState(false)}
            className="apple-retro-cta min-h-[36px] flex-1 rounded-xl px-3 text-[12px] font-semibold active:scale-[0.97]"
          >
            {t('explore.filterShowCount', { count: resultCount })}
          </button>
        </div>
      </div>
    </div>
  )
}
