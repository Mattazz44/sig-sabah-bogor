const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ITEMS = [
  {
    id: 'explore',
    label: 'Explore',
    icon: (
      <g {...stroke} strokeWidth="2.4">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </g>
    ),
  },
  {
    id: 'untuk-anda',
    label: 'Untuk Anda',
    icon: (
      <g fill="currentColor">
        <circle cx="12" cy="7" r="4" />
        <path d="M3 20c0-3.3 4-6 9-6s9 2.7 9 6v1H3v-1Z" />
      </g>
    ),
  },
  {
    id: 'navigasi',
    label: 'Navigasi',
    icon: (
      <g {...stroke}>
        <path d="M21 3 3 10.5l7.5 3L14 21l7-18Z" />
      </g>
    ),
  },
  {
    id: 'tersimpan',
    label: 'Tersimpan',
    icon: (
      <g {...stroke}>
        <path d="M12 20s-7.5-4.6-9-9.2C2 7.4 4.3 4.5 7.5 4.5c1.9 0 3.4 1 4.5 2.6 1.1-1.6 2.6-2.6 4.5-2.6 3.2 0 5.5 2.9 4.5 6.3-1.5 4.6-9 9.2-9 9.2Z" />
      </g>
    ),
  },
  {
    id: 'aktivitas',
    label: 'Aktivitas',
    icon: (
      <g {...stroke}>
        <path d="M2 12h5l2-5 4 10 2-5h7" />
      </g>
    ),
  },
]

export default function BottomNav({ activeTab = 'Explore', setActiveTab, onTabChange }) {
  const handleItemClick = (label) => {
    if (setActiveTab) setActiveTab(label)
    if (onTabChange) onTabChange(label)
  }

  return (
    <nav
      id="bottom-navigation"
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-[600] w-full bg-forest-700 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex h-[60px] max-w-[480px] items-center justify-around px-2">
        {ITEMS.map((item) => {
          const isActive =
            activeTab === item.label ||
            activeTab.toLowerCase() === item.label.toLowerCase() ||
            (item.label === 'Tersimpan' && activeTab === 'Aktivitas Tersimpan')

          return (
            <li key={item.id} className="flex-1 text-center">
              <button
                id={`nav-${item.id}`}
                type="button"
                onClick={() => handleItemClick(item.label)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full cursor-pointer flex-col items-center justify-center py-1 transition-all ${
                  isActive ? 'opacity-100 font-bold' : 'opacity-65 hover:opacity-95 font-normal'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`transition-all duration-200 ${
                      isActive
                        ? 'text-white scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]'
                        : 'text-white/55'
                    }`}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                      {item.icon}
                    </svg>
                  </span>
                  <span
                    className={`transition-all duration-200 leading-none tracking-tight ${
                      isActive
                        ? 'text-[11px] font-bold text-white'
                        : 'text-[10px] font-normal text-white/55'
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* Active indicator dot */}
                  <span
                    className={`h-1 w-1 rounded-full bg-white transition-opacity duration-200 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
