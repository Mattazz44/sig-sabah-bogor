import { memo } from 'react'

const NOTIFICATIONS = [
  {
    id: 'notif-1',
    icon: '❤️',
    title: 'Ambalingham menyukai rute custom kamu',
    desc: 'Tur Edukasi: Museum of Zoology ➔ Museum PETA',
    time: '5 menit yang lalu',
    unread: true,
  },
  {
    id: 'notif-2',
    icon: '📸',
    title: 'Aktivitas baru telah dibagikan di komunitas',
    desc: 'Kirk hasibuan mengunggah foto baru di Curug Cikuluwung',
    time: '1 jam yang lalu',
    unread: true,
  },
  {
    id: 'notif-3',
    icon: '🧭',
    title: 'Rute baru siap dijelajahi!',
    desc: 'Rute Kuliner Surya Kencana kini memiliki 4 titik kuliner rekomendasi',
    time: 'Kemarin',
    unread: false,
  },
  {
    id: 'notif-4',
    icon: '⭐',
    title: 'Ulasan baru ditambahkan',
    desc: 'Museum PETA mendapat 12 ulasan baru hari ini',
    time: '2 hari lalu',
    unread: false,
  },
]

function NotificationDrawer({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div
      id="notification-overlay"
      className="fixed inset-0 z-[2000] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="notification-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-forest-900 border border-white/20 p-5 shadow-2xl text-white mt-12 animate-in zoom-in-95 duration-200"
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h2 className="text-[17px] font-bold text-white tracking-tight">
              Notifikasi
            </h2>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
              2 Baru
            </span>
          </div>

          <button
            type="button"
            id="btn-close-notification"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* List Notifikasi */}
        <div className="mt-3 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto overscroll-contain pr-1">
          {NOTIFICATIONS.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-2xl p-3 border transition ${
                item.unread
                  ? 'bg-forest-700/80 border-emerald-500/30 shadow-sm'
                  : 'bg-white/5 border-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5 line-clamp-2">
                  {item.desc}
                </p>
                <span className="text-[9px] text-emerald-300/80 mt-1 block">
                  {item.time}
                </span>
              </div>
              {item.unread && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(NotificationDrawer)
