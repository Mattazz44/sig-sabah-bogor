export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full">
      <label
        htmlFor="search-input"
        className="flex h-10 w-full items-center gap-3 rounded-full bg-white px-4 shadow-sm transition hover:shadow focus-within:ring-2 focus-within:ring-white/50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#737373"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="search-input"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Temukan tempat wisata terdekat"
          className="w-full bg-transparent text-[13px] font-normal text-forest-900 outline-none placeholder:text-neutral-500 placeholder:text-center text-center pr-2"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Hapus pencarian"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </label>
    </div>
  )
}
