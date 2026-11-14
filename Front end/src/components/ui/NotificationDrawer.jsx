import { memo, useEffect } from 'react'
import {
  BellIcon,
  CameraIcon,
  CompassIcon,
  HeartIcon,
  StarIcon,
  XIcon,
} from './VectorIcons'

const NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'heart',
    title: 'Ambalingham menyukai rute custom kamu',
    desc: 'Tur Edukasi: Museum of Zoology ➔ Museum PETA',
    time: '5 menit yang lalu',
    unread: true,
  },
  {
    id: 'notif-2',
    type: 'camera',
    title: 'Aktivitas baru telah dibagikan di komunitas',
    desc: 'Kirk hasibuan mengunggah foto baru di Curug Cikuluwung',
    time: '1 jam yang lalu',
    unread: true,
  },
  {
    id: 'notif-3',
    type: 'compass',
    title: 'Rute baru siap dijelajahi!',
    desc: 'Rute Kuliner Surya Kencana kini memiliki 4 titik kuliner rekomendasi',
    time: 'Kemarin',
    unread: false,
  },
  {
    id: 'notif-4',
    type: 'star',
    title: 'Ulasan baru ditambahkan',
    desc: 'Museum PETA mendapat 12 ulasan baru hari ini',
    time: '2 hari lalu',
    unread: false,
  },
]

const ICON_MAP = {
  heart: {
    Icon: HeartIcon,
    badgeClass: 'bg-rose-500/15 border-rose-400/25 text-rose-300',
  },
  camera: {
    Icon: CameraIcon,
    badgeClass: 'bg-emerald-500/15 border-emerald-400/25 text-emerald-300',
  },
  compass: {
    Icon: CompassIcon,
    badgeClass: 'bg-sky-500/15 border-sky-400/25 text-sky-300',
  },
  star: {
    Icon: StarIcon,
    badgeClass: 'bg-amber-500/15 border-amber-400/25 text-amber-300',
  },
}

function NotificationDrawer({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      id="notification-overlay"
      className="fixed inset-0 z-[2000] flex items-start justify-center p-4 bg-black/65 backdrop-blur-sm animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        id="notification-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-[#253320] border border-white/10 p-5 shadow-2xl text-white mt-12 animate-modal-pop"
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/25 text-emerald-300">
              <BellIcon className="h-4 w-4" />
            </span>
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/10 text-white/80 hover:bg-white/20 hover:text-white active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* List Notifikasi */}
        <div className="mt-3 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto overscroll-contain pr-1">
          {NOTIFICATIONS.map((item) => {
            const config = ICON_MAP[item.type] || ICON_MAP.compass
            const IconComponent = config.Icon

            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-2xl p-3 border transition-colors ${
                  item.unread
                    ? 'bg-[#1d2818]/90 border-emerald-500/30 shadow-sm'
                    : 'bg-white/[0.04] border-white/10 opacity-85 hover:opacity-100'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${config.badgeClass}`}
                >
                  <IconComponent className="h-4 w-4" />
                </span>
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
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-1 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(NotificationDrawer)
