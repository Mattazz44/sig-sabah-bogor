import { CATEGORIES } from './categories'

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="mt-3.5 flex items-center gap-2.5">
      <span
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"
        aria-hidden="true"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-forest-900)"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M3 6h18M6 12h12M10 18h4" />
        </svg>
      </span>

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
              className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-xl px-3.5 text-[12px] font-semibold shadow-sm transition-colors duration-150 active:scale-[0.97] ${
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
    </div>
  )
}
