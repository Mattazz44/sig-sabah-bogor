import { CATEGORIES } from './categories'

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="mt-3.5 flex items-center gap-3">
      {/* Filter icon badge (as in Figma) */}
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
        aria-hidden="true"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-forest-900)"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M3 6h18M6 12h12M10 18h4" />
        </svg>
      </span>

      {/* Categories horizontal list */}
      <div
        role="tablist"
        aria-label="Filter kategori"
        className="no-scrollbar flex gap-2.5 overflow-x-auto py-0.5"
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat === active
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`filter-${cat.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              onClick={() => onChange(cat)}
              className={`h-7 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 text-[12px] font-semibold transition-all shadow-sm ${
                isActive
                  ? 'bg-forest-700 text-white ring-1 ring-white/40'
                  : 'bg-white text-forest-900 hover:bg-white/90 active:scale-95'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>
    </div>
  )
}
