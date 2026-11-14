import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_CATEGORY, CATEGORIES } from './categories'
import { CheckIcon, StarIcon, XIcon } from './VectorIcons'

const RATING_OPTIONS = [
  { label: 'Semua', value: 0 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
]

export default function CategoryFilter({
  active,
  onChange,
  minRating = 0,
  onlyPopular = false,
  onlyFavorites = false,
  onFilterChange,
  onResetFilters,
  resultCount = 0,
  isOpen,
  onToggleOpen,
  onClose,
}) {
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
    (minRating > 0 ? 1 : 0) + (onlyPopular ? 1 : 0) + (onlyFavorites ? 1 : 0)
  const hasAnyFilter = active !== ALL_CATEGORY || activeAdvancedCount > 0

  return (
    <div ref={containerRef} className="relative z-40 mt-3.5 flex items-center gap-2.5">
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
            ? `Filter destinasi (${activeAdvancedCount} filter aktif)`
            : 'Buka filter destinasi lanjutan'
        }
        title="Filter destinasi lanjutan"
        className={`relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border shadow-sm transition-all duration-150 active:scale-[0.95] before:absolute before:-inset-1 ${
          filterOpen || activeAdvancedCount > 0
            ? 'border-[#E2D7B5]/60 bg-[#253320] text-[#E2D7B5]'
            : 'border-transparent bg-white text-forest-900 hover:bg-[#EBF0EB]'
        }`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 6h18M6 12h12M10 18h4" />
        </svg>
        {activeAdvancedCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E2D7B5] px-1 text-[10px] font-bold text-[#161E16]"
          >
            {activeAdvancedCount}
          </span>
        )}
      </button>

      <div
        role="tablist"
        aria-label="Filter kategori"
        className="no-scrollbar flex gap-2 overflow-x-auto py-0.5"
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
              className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-xl px-3.5 text-[12px] font-semibold shadow-sm transition-all duration-150 active:scale-[0.95] ${
                isActive
                  ? 'border border-[#EBF0EB]/20 bg-[#253320] text-[#EBF0EB] hover:bg-[#2F4128]'
                  : 'bg-white text-forest-900 hover:bg-[#EBF0EB]'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Floating Popover Filter Lanjutan (Liquid Glass gelap, z-[700]) */}
      <div
        id="advanced-filter-popover"
        role="dialog"
        aria-label="Filter destinasi lanjutan"
        aria-hidden={!filterOpen}
        data-no-sheet-drag
        onPointerDown={(e) => e.stopPropagation()}
        className={`absolute top-full left-0 z-[700] mt-2 w-[min(312px,calc(100vw-2.5rem))] origin-top-left rounded-2xl border border-white/15 bg-[#141C14]/85 p-3.5 text-[#EBF0EB] shadow-xl backdrop-blur-xl transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          filterOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <p className="text-[13px] font-bold tracking-tight text-[#EBF0EB]">Filter Destinasi</p>
          <button
            type="button"
            tabIndex={filterOpen ? 0 : -1}
            onClick={() => setOpenState(false)}
            aria-label="Tutup panel filter"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#C8D3C8] transition-colors hover:bg-white/[0.14] hover:text-[#EBF0EB] active:scale-[0.95]"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Kategori Cepat */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#C8D3C8]">
            Kategori
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
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Rating Minimum */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#C8D3C8]">
            Rating Minimum
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {RATING_OPTIONS.map((opt) => {
              const selected = minRating === opt.value
              return (
                <button
                  key={opt.label}
                  type="button"
                  tabIndex={filterOpen ? 0 : -1}
                  onClick={() => onFilterChange?.({ minRating: opt.value })}
                  className={`flex items-center justify-center gap-1 rounded-xl border py-1.5 text-[11.5px] font-medium transition-all duration-150 active:scale-[0.95] ${
                    selected
                      ? 'border-[#E2D7B5]/45 bg-white/[0.14] font-semibold text-[#E2D7B5]'
                      : 'border-white/10 bg-white/[0.05] text-[#EBF0EB] hover:bg-white/[0.1]'
                  }`}
                >
                  {opt.value > 0 && <StarIcon filled className="h-3 w-3 text-amber-300" />}
                  <span>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Preferensi Tambahan */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#C8D3C8]">
            Preferensi
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              tabIndex={filterOpen ? 0 : -1}
              onClick={() => onFilterChange?.({ onlyPopular: !onlyPopular })}
              aria-pressed={onlyPopular}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 active:scale-[0.95] ${
                onlyPopular
                  ? 'border-[#E2D7B5]/45 bg-white/[0.14] font-semibold text-[#E2D7B5]'
                  : 'border-white/10 bg-white/[0.05] text-[#EBF0EB] hover:bg-white/[0.1]'
              }`}
            >
              {onlyPopular && <CheckIcon className="h-3 w-3 text-[#E2D7B5]" />}
              <span>Hanya Populer</span>
            </button>

            <button
              type="button"
              tabIndex={filterOpen ? 0 : -1}
              onClick={() => onFilterChange?.({ onlyFavorites: !onlyFavorites })}
              aria-pressed={onlyFavorites}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 active:scale-[0.95] ${
                onlyFavorites
                  ? 'border-[#E2D7B5]/45 bg-white/[0.14] font-semibold text-[#E2D7B5]'
                  : 'border-white/10 bg-white/[0.05] text-[#EBF0EB] hover:bg-white/[0.1]'
              }`}
            >
              {onlyFavorites && <CheckIcon className="h-3 w-3 text-[#E2D7B5]" />}
              <span>Favorit Saya</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3.5 flex items-center gap-2 pt-2.5 border-t border-white/10">
          <button
            type="button"
            tabIndex={filterOpen ? 0 : -1}
            disabled={!hasAnyFilter}
            onClick={() => onResetFilters?.()}
            className="min-h-[36px] rounded-xl border border-white/12 bg-white/[0.06] px-3 text-[12px] font-semibold text-[#EBF0EB] transition-all duration-150 hover:bg-white/[0.12] active:scale-[0.95] disabled:opacity-45"
          >
            Reset
          </button>
          <button
            type="button"
            tabIndex={filterOpen ? 0 : -1}
            onClick={() => setOpenState(false)}
            className="min-h-[36px] flex-1 rounded-xl bg-[#EBF0EB] px-3 text-[12px] font-bold text-[#161E16] shadow-sm transition-all duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
          >
            Tampilkan ({resultCount})
          </button>
        </div>
      </div>
    </div>
  )
}
