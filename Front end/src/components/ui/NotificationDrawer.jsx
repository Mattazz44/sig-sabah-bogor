import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  BellIcon,
  CompassIcon,
  HeartIcon,
  MapPinIcon,
  XIcon,
} from './VectorIcons'

const READ_STORAGE_KEY = 'sabah_read_notifications_v1'

const ICON_MAP = {
  heart: {
    Icon: HeartIcon,
    badgeClass: 'border-rose-300/25 bg-[#3B1D24] text-rose-200',
  },
  recent: {
    Icon: MapPinIcon,
    badgeClass: 'border-[#EBF0EB]/20 bg-[#253320] text-[#E2D7B5]',
  },
  compass: {
    Icon: CompassIcon,
    badgeClass: 'border-[#EBF0EB]/20 bg-[#253320] text-[#EBF0EB]',
  },
}

function getFocusableElements(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function NotificationDrawer({
  isOpen,
  onClose,
  tourists = [],
  favorites = [],
  recentSlugs = [],
  onSelectPlace,
  items = null,
}) {
  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [isEntered, setIsEntered] = useState(isOpen)
  const cardRef = useRef(null)
  const previousFocusRef = useRef(null)

  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = window.localStorage.getItem(READ_STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setIsClosing(false)
      setIsEntered(false)
    } else {
      setIsClosing(true)
    }
  }

  useEffect(() => {
    if (isOpen) {
      let nestedRafId = 0
      const rafId = requestAnimationFrame(() => {
        nestedRafId = requestAnimationFrame(() => {
          setIsEntered(true)
        })
      })
      return () => {
        cancelAnimationFrame(rafId)
        cancelAnimationFrame(nestedRafId)
      }
    }

    if (!isClosing) return undefined
    const timerId = setTimeout(() => {
      setIsClosing(false)
      setIsEntered(false)
    }, 220)
    return () => clearTimeout(timerId)
  }, [isOpen, isClosing])

  const shouldRender = isOpen || isClosing
  const isVisible = isOpen && isEntered && !isClosing

  useEffect(() => {
    if (!shouldRender) return undefined
    previousFocusRef.current = document.activeElement
    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusableElements(cardRef.current)
      focusables[0]?.focus()
    }, 20)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (e.key === 'Tab') {
        const focusables = getFocusableElements(cardRef.current)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [shouldRender, onClose])

  const notifications = useMemo(() => {
    if (Array.isArray(items)) return items
    const list = []

    favorites.forEach((slug) => {
      const place = tourists.find((t) => t.slug === slug)
      if (!place) return
      list.push({
        id: `fav-${slug}`,
        type: 'heart',
        slug,
        title: `${place.name} tersimpan di favorit`,
        desc: `${place.category} di kawasan Bogor siap dikunjungi.`,
        time: 'Tersimpan',
      })
    })

    recentSlugs.forEach((slug) => {
      const place = tourists.find((t) => t.slug === slug)
      if (!place || favorites.includes(slug)) return
      list.push({
        id: `recent-${slug}`,
        type: 'recent',
        slug,
        title: `Baru dilihat: ${place.name}`,
        desc: `Ketuk untuk membuka kembali detail dan rute menuju lokasi.`,
        time: 'Riwayat jelajah',
      })
    })

    return list.slice(0, 8)
  }, [items, favorites, recentSlugs, tourists])

  const unreadIds = useMemo(
    () => notifications.filter((item) => !readIds.includes(item.id)).map((item) => item.id),
    [notifications, readIds],
  )

  const persistReadIds = (nextIds) => {
    setReadIds(nextIds)
    try {
      window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(nextIds))
    } catch {
      // Abaikan kegagalan storage pada mode privat
    }
  }

  const markAsRead = (id) => {
    if (readIds.includes(id)) return
    persistReadIds([...readIds, id])
  }

  const markAllAsRead = () => {
    const merged = [...new Set([...readIds, ...notifications.map((n) => n.id)])]
    persistReadIds(merged)
  }

  if (!shouldRender) return null

  return (
    <div
      id="notification-overlay"
      onClick={onClose}
      className={`fixed inset-0 z-[2000] flex items-start justify-center bg-black/35 backdrop-blur-sm px-4 pt-12 pb-6 transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={cardRef}
        id="notification-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-modal relative flex max-h-[calc(100dvh-4.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl text-[#EBF0EB] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.28),0_24px_48px_-12px_rgba(0,0,0,0.48)] transition-[opacity,transform] duration-200 ease-out ${
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2.5 scale-[0.96] opacity-0'
        }`}
      >
        {/* Header Drawer */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.14] px-5 pt-5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#EBF0EB]">
              <BellIcon className="h-4 w-4" />
            </span>
            <h2
              id="notification-drawer-title"
              className="text-[17px] font-bold tracking-tight text-white"
            >
              Notifikasi
            </h2>
            {unreadIds.length > 0 && (
              <span className="rounded-lg border border-[#E2D7B5]/35 bg-[rgba(20,28,20,0.5)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#E2D7B5]">
                {unreadIds.length} belum dibaca
              </span>
            )}
          </div>

          <button
            type="button"
            id="btn-close-notification"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#EBF0EB] transition-colors duration-150 hover:bg-[rgba(20,28,20,0.68)] active:scale-[0.97] before:absolute before:-inset-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* List Notifikasi */}
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 py-4">
          {notifications.length > 0 ? (
            notifications.map((item) => {
              const config = ICON_MAP[item.type] || ICON_MAP.compass
              const IconComponent = config.Icon
              const isUnread = !readIds.includes(item.id)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    markAsRead(item.id)
                    if (item.slug && onSelectPlace) {
                      onClose?.()
                      onSelectPlace(item.slug)
                    }
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-150 ${
                    isUnread
                      ? 'border-white/[0.2] bg-[rgba(20,28,20,0.45)] hover:bg-[rgba(20,28,20,0.62)]'
                      : 'border-white/[0.12] bg-[rgba(20,28,20,0.32)] opacity-90 hover:opacity-100'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${config.badgeClass}`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-snug text-[#EBF0EB]">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#D5E0D5]">
                      {item.desc}
                    </p>
                    <span className="mt-1.5 block text-[11px] text-[#E2EAE2]">
                      {item.time}
                    </span>
                  </div>
                  {isUnread && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E2D7B5]"
                      aria-label="Belum dibaca"
                    />
                  )}
                </button>
              )
            })
          ) : (
            <div className="py-8 text-center">
              <p className="text-[14px] font-semibold text-white">
                Belum ada pembaruan
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#E2EAE2]">
                Simpan destinasi favorit atau buka detail wisata di peta untuk melihat ringkasan aktivitas Anda.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.14] px-5 py-3.5">
          {unreadIds.length > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] px-3 py-2 text-[12px] font-semibold text-[#E2D7B5] transition-colors duration-150 hover:bg-[rgba(20,28,20,0.68)] active:scale-[0.97]"
            >
              Tandai dibaca
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] px-3 py-2 text-[12px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[rgba(20,28,20,0.68)] active:scale-[0.97]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(NotificationDrawer)
