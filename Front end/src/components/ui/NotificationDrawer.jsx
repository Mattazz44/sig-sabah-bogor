import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SabahMascot from './SabahMascot'
import {
  BellIcon,
  CheckIcon,
  HeartIcon,
  RouteWaypointsIcon,
  UserIcon,
  XIcon,
} from './VectorIcons'
import {
  ALLOWED_NOTIFICATION_TYPES,
  NOTIFICATIONS_UPDATED_EVENT,
  formatNotificationTime,
  getAppNotifications,
} from '../../utils/notifications'

const READ_STORAGE_KEY = 'sabah_read_notifications_v1'

const ICON_MAP = {
  success: {
    Icon: CheckIcon,
    badgeClass: 'border-emerald-300/25 bg-[#1B3426] text-emerald-200',
  },
  route: {
    Icon: RouteWaypointsIcon,
    badgeClass: 'border-[#DFAA63]/35 bg-[#332A1B] text-[#DFAA63]',
  },
  social: {
    Icon: UserIcon,
    badgeClass: 'border-sky-300/25 bg-[#1C2C38] text-sky-200',
  },
  favorite: {
    Icon: HeartIcon,
    badgeClass: 'border-rose-300/25 bg-[#3B1D24] text-rose-200',
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
  onSelectPlace,
  items = null,
}) {
  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [isEntered, setIsEntered] = useState(isOpen)
  const [storedNotifications, setStoredNotifications] = useState(() => getAppNotifications())
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

  useEffect(() => {
    const syncNotifications = () => setStoredNotifications(getAppNotifications())
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, syncNotifications)
    window.addEventListener('storage', syncNotifications)
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, syncNotifications)
      window.removeEventListener('storage', syncNotifications)
    }
  }, [])

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setIsClosing(false)
      setIsEntered(false)
      setStoredNotifications(getAppNotifications())
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
    if (Array.isArray(items)) {
      return items.filter((item) => item && ALLOWED_NOTIFICATION_TYPES.has(item.type))
    }

    const list = []
    const seenFavoriteSlugs = new Set()

    storedNotifications.forEach((entry) => {
      if (!ALLOWED_NOTIFICATION_TYPES.has(entry.type)) return
      if (entry.type === 'favorite' && entry.slug) {
        if (!favorites.includes(entry.slug)) return
        seenFavoriteSlugs.add(entry.slug)
      }
      list.push({
        id: entry.id,
        type: entry.type,
        slug: entry.slug || null,
        title: entry.title,
        desc: entry.desc,
        time: entry.time || formatNotificationTime(entry.createdAt),
      })
    })

    // Pastikan destinasi favorit yang sudah tersimpan sebelumnya tetap muncul sebagai notifikasi Tersimpan
    favorites.forEach((slug) => {
      if (seenFavoriteSlugs.has(slug)) return
      const place = tourists.find((t) => t.slug === slug)
      if (!place) return
      seenFavoriteSlugs.add(slug)
      list.push({
        id: `fav-${slug}`,
        type: 'favorite',
        slug,
        title: `${place.name} disimpan ke Tersimpan`,
        desc: `${place.category || 'Destinasi wisata'} di Bogor masuk daftar tersimpan Anda.`,
        time: 'Tersimpan',
      })
    })

    return list.slice(0, 20)
  }, [items, storedNotifications, favorites, tourists])

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

  const modalContent = (
    <div
      id="notification-overlay"
      onClick={onClose}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
      }}
      className={`fixed inset-x-0 top-0 bottom-0 z-[2000] flex items-start justify-center bg-black/40 px-4 pb-24 backdrop-blur-sm transition-opacity duration-200 ease-out ${
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
        className={`relative flex max-h-[calc(100dvh-120px)] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-[rgba(244,239,230,0.18)] bg-[linear-gradient(180deg,rgba(30,43,32,0.92)_0%,rgba(19,27,20,0.94)_100%)] text-[#F5F2EB] shadow-[inset_0_1px_0_0_rgba(244,239,230,0.24),inset_0_-1px_0_0_rgba(0,0,0,0.4),0_28px_60px_-14px_rgba(0,0,0,0.68)] backdrop-blur-2xl transition-[opacity,transform] duration-200 ease-out ${
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2.5 scale-[0.96] opacity-0'
        }`}
      >
        {/* Header Drawer */}
        <div
          id="notification-header"
          className="flex shrink-0 items-center justify-between border-b border-white/[0.09] bg-white/[0.02] px-5 pt-4 pb-3.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] text-[#DFAA63]">
              <BellIcon className="h-4 w-4" />
            </span>
            <h2
              id="notification-drawer-title"
              className="text-[17px] font-semibold tracking-tight text-[#F5F2EB]"
            >
              Notifikasi
            </h2>
            <span
              id="notification-count-badge"
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums tracking-wide ${
                unreadIds.length > 0
                  ? 'border-[#C5A868]/40 bg-[#C5A868]/15 text-[#DFAA63]'
                  : 'border-[#76937A]/30 bg-white/[0.06] text-[#F5F2EB]/70'
              }`}
            >
              {unreadIds.length} Baru
            </span>
          </div>

          <button
            type="button"
            id="btn-close-notification"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="apple-glass-pill relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#F5F2EB] transition-colors duration-150 hover:bg-white/[0.12] active:scale-[0.97] before:absolute before:-inset-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* List Notifikasi (scrollable secara internal, item terbawah tidak terpotong) */}
        <div
          id="notification-list"
          className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pt-4 pb-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {notifications.length > 0 ? (
            notifications.map((item) => {
              const config = ICON_MAP[item.type] || ICON_MAP.success
              const IconComponent = config.Icon
              const isUnread = !readIds.includes(item.id)

              return (
                <button
                  key={item.id}
                  type="button"
                  data-notification-type={item.type}
                  onClick={() => {
                    markAsRead(item.id)
                    if (item.slug && onSelectPlace) {
                      onClose?.()
                      onSelectPlace(item.slug)
                    }
                  }}
                  className={`flex w-full shrink-0 items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-150 active:scale-[0.985] ${
                    isUnread
                      ? 'border-white/[0.16] bg-white/[0.065] shadow-[inset_0_1px_0_0_rgba(244,239,230,0.12)] hover:border-white/[0.24] hover:bg-white/[0.1]'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/[0.18] hover:bg-white/[0.08]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${config.badgeClass}`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold leading-snug tracking-tight text-[#F5F2EB]">
                        {item.title}
                      </p>
                      <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
                        <span className="whitespace-nowrap font-mono text-[10.5px] tabular-nums tracking-wide text-[#F5F2EB]/55">
                          {item.time}
                        </span>
                        {isUnread && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-[#C5A868]"
                            aria-label="Belum dibaca"
                          />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#F5F2EB]/70">
                      {item.desc}
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center px-2 py-7 text-center">
              <SabahMascot
                variant="default"
                size="md"
                animate
                className="mb-4"
              />
              <p className="text-[15px] font-semibold tracking-tight text-[#F5F2EB]">
                Belum ada pembaruan
              </p>
              <p className="mt-1.5 max-w-[260px] text-[12.5px] leading-relaxed text-[#F5F2EB]/65">
                Notifikasi akan muncul saat Anda menyimpan destinasi favorit, membuat rute custom, berinteraksi sosial, atau menyelesaikan aksi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          id="notification-footer"
          className="flex shrink-0 items-center gap-2.5 border-t border-white/[0.09] bg-black/[0.16] px-5 py-3.5"
        >
          {unreadIds.length > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="apple-glass-pill flex min-h-[42px] flex-1 items-center justify-center rounded-xl px-3 py-2 text-[12px] font-semibold text-[#DFAA63] transition-all duration-150 hover:bg-white/[0.12] active:scale-[0.98]"
            >
              Tandai dibaca
            </button>
          )}
          <button
            type="button"
            id="btn-footer-close-notification"
            onClick={onClose}
            className="apple-retro-cta flex min-h-[42px] flex-1 items-center justify-center rounded-xl px-4 py-2 text-[12.5px] font-semibold shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45)] transition-all duration-150 hover:bg-[#E7DFD1] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.55)] active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}

export default memo(NotificationDrawer)
