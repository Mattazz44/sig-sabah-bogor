import { XIcon } from './VectorIcons'

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full">
      <label
        htmlFor="search-input"
        className="flex min-h-[44px] w-full items-center gap-2.5 rounded-2xl bg-white px-3.5 shadow-sm transition focus-within:ring-2 focus-within:ring-[#E2D7B5]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2c3b26"
          strokeWidth="2.3"
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
          placeholder="Cari destinasi wisata di Bogor"
          className="w-full bg-transparent text-left text-[13px] font-normal text-forest-900 placeholder:text-left placeholder:text-[#4B584B] focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Hapus pencarian"
            className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E4EAE4] text-forest-900 transition-colors hover:bg-[#D2DCD2] before:absolute before:-inset-1.5"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
    </div>
  )
}
