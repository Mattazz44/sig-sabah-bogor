import { XIcon } from './VectorIcons'

export default function SearchBar({ value, onChange, onSubmit }) {
  return (
    <div className="relative w-full">
      <label
        htmlFor="search-input"
        className="relative flex h-10 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.1] px-3 text-white transition-colors duration-150 hover:bg-white/[0.14] focus-within:border-white/25 focus-within:bg-white/[0.14] focus-within:ring-2 focus-within:ring-[#E2D7B5]/45 before:absolute before:-inset-y-0.5 before:inset-x-0 before:pointer-events-none"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-white/55"
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit?.()
            }
          }}
          placeholder="Cari destinasi wisata di Bogor"
          className="w-full bg-transparent text-left text-[13px] font-normal text-white placeholder:text-left placeholder:text-white/50 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Hapus pencarian"
            className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/25 hover:text-white active:scale-[0.95] before:absolute before:-inset-2"
          >
            <XIcon className="h-3 w-3" />
          </button>
        )}
      </label>
    </div>
  )
}
