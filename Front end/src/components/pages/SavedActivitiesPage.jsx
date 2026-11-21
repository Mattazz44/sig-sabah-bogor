import { memo, useEffect, useMemo, useState } from 'react'
import CustomRoutePage from './CustomRoutePage'
import NotificationDrawer from '../ui/NotificationDrawer'
import GlassModal from '../ui/GlassModal'
import SafeImage from '../ui/SafeImage'
import { apiFetch, getAuthToken } from '../../utils/api'
import { DEFAULT_AVATAR_PLACEHOLDER, getBogorFallbackPhoto } from '../../utils/imageHelper'
import {
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CompassIcon,
  FlagIcon,
  HeartIcon,
  MapIcon,
  MapPinIcon,
  StarIcon,
  UserIcon,
} from '../ui/VectorIcons'

function SavedPlaceCard({ place, secondaryMeta, onSelect }) {
  const photoFallback = getBogorFallbackPhoto(place)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(place)}
      className="apple-glass-card apple-glass-card-hover group flex min-w-0 items-center gap-3.5 rounded-2xl p-3.5 text-left active:scale-[0.98]"
    >
      <SafeImage
        src={place.image || photoFallback}
        fallback={photoFallback}
        alt={place.name}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        {place.category && (
          <span className="block truncate text-[11px] font-semibold text-[#DFAA63]">
            {place.category}
          </span>
        )}
        <h3 className="mt-0.5 truncate text-[14px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
          {place.name}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-[#F5F2EB]/60">
          <span className="inline-flex items-center gap-1 font-semibold not-italic tabular-nums text-[#F5F2EB]">
            <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />
            {Number(place.rating || 0).toFixed(1)}
          </span>
          {secondaryMeta && (
            <>
              <span aria-hidden="true" className="text-[#F5F2EB]/35">·</span>
              <span className="truncate not-italic tabular-nums">{secondaryMeta}</span>
            </>
          )}
        </div>
      </div>
      <span className="apple-retro-bevel flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(244,239,230,0.16)] bg-white/[0.06] text-[#F5F2EB] transition-colors group-hover:bg-[#F2ECE1] group-hover:text-[#141A14]">
        <ChevronRightIcon className="h-4 w-4" />
      </span>
    </button>
  )
}

function SavedActivitiesPage({
  tourists = [],
  favorites = [],
  recentSlugs = [],
  onSelectPlace,
  onStartCustomRoute,
  isLoggedIn = false,
  currentUser = null,
  onRequireLogin,
  onOpenProfile,
}) {
  const [activeFolderView, setActiveFolderView] = useState(null)
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)

  const [showActivityModal, setShowActivityModal] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')
  const [newActivityLocation, setNewActivityLocation] = useState('')

  const [userActivities, setUserActivities] = useState([])
  const [customRoutesCount, setCustomRoutesCount] = useState(0)

  useEffect(() => {
    if (!isLoggedIn || !getAuthToken()) {
      setUserActivities([])
      setCustomRoutesCount(0)
      return undefined
    }

    let isMounted = true

    apiFetch('/api/saved-activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (isMounted && json?.data) {
          if (Array.isArray(json.data.activities)) {
            setUserActivities(
              json.data.activities.map((a) => ({
                id: a.id,
                tourist_spot_id: a.tourist_spot_id,
                spot_slug: a.spot_slug,
                name: a.name,
                location: a.location,
                date: a.date_label || 'Baru saja',
              })),
            )
          } else {
            setUserActivities([])
          }
          if (Array.isArray(json.data.custom_routes)) {
            setCustomRoutesCount(json.data.custom_routes.length)
          } else {
            setCustomRoutesCount(0)
          }
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat aktivitas tersimpan dari API:', err)
        if (isMounted) {
          setUserActivities([])
          setCustomRoutesCount(0)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, currentUser?.id])

  const effectiveUserActivities = isLoggedIn ? userActivities : []

  const [showSortMenu, setShowSortMenu] = useState(false)
  const [sortOption, setSortOption] = useState('Terbaru')

  const handleAddPlusClick = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin()
    } else {
      setShowActivityModal(true)
    }
  }

  const handleActivitySubmit = async (e) => {
    e.preventDefault()
    if (!newActivityName.trim() || !newActivityLocation.trim()) return

    const nameText = newActivityName.trim()
    const locText = newActivityLocation.trim()
    const tempId = `act-${Date.now()}`

    const newAct = {
      id: tempId,
      name: nameText,
      location: locText,
      date: 'Baru saja',
    }

    const prevActivities = userActivities
    setUserActivities((prev) => [newAct, ...prev])
    setNewActivityName('')
    setNewActivityLocation('')
    setShowActivityModal(false)

    try {
      const res = await apiFetch('/api/saved-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: nameText,
          location: locText,
        }),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json().catch(() => null)
      if (json?.data?.id) {
        setUserActivities((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  id: json.data.id,
                  tourist_spot_id: json.data.tourist_spot_id,
                  spot_slug: json.data.spot_slug,
                  name: json.data.name,
                  location: json.data.location,
                  date: json.data.date_label || 'Baru saja',
                }
              : item,
          ),
        )
      }
    } catch (err) {
      console.warn('Gagal menyimpan aktivitas ke server:', err)
      setUserActivities(prevActivities)
    }
  }

  const favoritePlaces = useMemo(() => {
    const list = tourists.filter((t) => favorites.includes(t.slug))
    if (sortOption === 'Nama A-Z') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortOption === 'Terlama') {
      return [...list].reverse()
    }
    return list
  }, [tourists, favorites, sortOption])

  const recentPlaces = useMemo(() => {
    if (!Array.isArray(tourists) || tourists.length === 0) return []
    if (Array.isArray(recentSlugs) && recentSlugs.length > 0) {
      return recentSlugs
        .map((slug) => tourists.find((t) => t.slug === slug))
        .filter(Boolean)
    }
    return tourists.slice(0, 2)
  }, [tourists, recentSlugs])

  if (activeFolderView === 'custom-route') {
    return (
      <CustomRoutePage
        tourists={tourists}
        favorites={favorites}
        userActivities={effectiveUserActivities}
        currentUser={currentUser}
        onBack={() => setActiveFolderView(null)}
        onStartCustomRoute={onStartCustomRoute}
      />
    )
  }

  if (activeFolderView === 'recent') {
    return (
      <div
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
        className="apple-canopy-bg bg-[#111711] animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu text-[#F5F2EB]"
      >
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <header className="flex items-center gap-3 border-b border-[rgba(244,239,230,0.14)] pb-4">
            <button
              type="button"
              id="btn-back-recent-list"
              onClick={() => setActiveFolderView(null)}
              aria-label="Kembali ke daftar folder tersimpan"
              className="apple-glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[26px]">
                Terakhir Dilihat
              </h1>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                Daftar tempat wisata yang baru saja Anda buka
              </p>
            </div>
          </header>

          {recentPlaces.length === 0 ? (
            <div className="apple-glass-card mt-10 rounded-3xl p-8 text-center">
              <div className="apple-glass-pill mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-[#DFAA63]">
                <CompassIcon className="h-7 w-7" duotone />
              </div>
              <p className="text-[14px] font-semibold text-[#F5F2EB]">Belum Ada Riwayat Dilihat</p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                Jelajahi destinasi di peta Explore untuk menyimpan jejak tempat yang pernah Anda lihat.
              </p>
            </div>
          ) : (
            <ul className="apple-glass-card mt-5 divide-y divide-[rgba(244,239,230,0.14)] overflow-hidden rounded-3xl border-[rgba(244,239,230,0.14)]">
              {recentPlaces.map((place) => {
                const photoFallback = getBogorFallbackPhoto(place)
                const secondaryMeta = place.travelTime || place.distance || 'Bogor'
                return (
                  <li key={place.id || place.slug}>
                    <button
                      type="button"
                      onClick={() => onSelectPlace?.(place)}
                      className="group flex min-h-[68px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-white/[0.06] active:bg-white/[0.1] sm:px-5"
                    >
                      <div className="apple-retro-bevel h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-[rgba(244,239,230,0.16)]">
                        <SafeImage
                          src={place.image || photoFallback}
                          fallback={photoFallback}
                          alt={place.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {place.category && (
                          <span className="block truncate text-[11px] font-semibold text-[#DFAA63]">
                            {place.category}
                          </span>
                        )}
                        <h2 className="mt-0.5 truncate text-[14.5px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
                          {place.name}
                        </h2>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#F5F2EB]/60">
                          <span className="inline-flex items-center gap-1 font-semibold not-italic tabular-nums text-[#F5F2EB]">
                            <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />
                            {Number(place.rating || 0).toFixed(1)}
                          </span>
                          {secondaryMeta && (
                            <>
                              <span aria-hidden="true" className="text-[#F5F2EB]/35">·</span>
                              <span className="truncate not-italic tabular-nums">
                                {secondaryMeta}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/40 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    )
  }

  if (activeFolderView === 'favorites') {
    return (
      <div
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
        className="apple-canopy-bg bg-[#111711] animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu text-[#F5F2EB]"
      >
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <header className="flex items-center gap-3 border-b border-[rgba(244,239,230,0.14)] pb-4">
            <button
              type="button"
              id="btn-back-favorites-list"
              onClick={() => setActiveFolderView(null)}
              aria-label="Kembali ke daftar folder tersimpan"
              className="apple-glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[26px]">
                Tempat Wisata Favorit
              </h1>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                <span className="not-italic tabular-nums">{favoritePlaces.length}</span> tempat wisata favorit tersimpan
              </p>
            </div>
          </header>

          {favoritePlaces.length === 0 ? (
            <div className="apple-glass-card mt-10 rounded-3xl p-8 text-center">
              <div className="apple-glass-pill mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-[#DFAA63]">
                <HeartIcon className="h-7 w-7" />
              </div>
              <p className="text-[14px] font-semibold text-[#F5F2EB]">Belum Ada Wisata Favorit</p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                Simpan tempat wisata favoritmu dengan menekan ikon hati pada menu Explore.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoritePlaces.map((place) => (
                <SavedPlaceCard
                  key={place.id || place.slug}
                  place={place}
                  secondaryMeta={place.distance || place.travelTime || 'Bogor'}
                  onSelect={onSelectPlace}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="apple-canopy-bg bg-[#111711] animate-tab-enter relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu text-[#F5F2EB]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top Header */}
        <header className="flex items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[30px]">
              Aktivitas Tersimpan
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-[#F5F2EB]/60">
              Koleksi destinasi favorit, rute custom, dan catatan perjalanan Anda
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              id="btn-add-activity"
              onClick={handleAddPlusClick}
              title="Tambah Aktivitas Perjalanan Baru"
              aria-label="Tambah aktivitas"
              className="apple-glass-pill flex h-11 w-11 items-center justify-center rounded-full text-[#EBF0EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <button
              type="button"
              id="btn-notifikasi-saved"
              onClick={() => setShowNotificationDrawer(true)}
              title="Notifikasi"
              aria-label="Lihat notifikasi"
              className="apple-glass-pill flex h-11 w-11 items-center justify-center rounded-full text-[#EBF0EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <BellIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              id="btn-user-profile"
              onClick={() => {
                if (!isLoggedIn) {
                  if (onRequireLogin) onRequireLogin()
                } else if (onOpenProfile) {
                  onOpenProfile('self')
                }
              }}
              aria-label={isLoggedIn ? 'Profil pengguna' : 'Masuk ke akun'}
              className="apple-glass-pill flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-[#EBF0EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
            >
              {isLoggedIn ? (
                <SafeImage
                  src={currentUser?.avatar}
                  fallback={DEFAULT_AVATAR_PLACEHOLDER}
                  alt={currentUser?.name || 'Avatar'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {!isLoggedIn ? (
          <section className="apple-glass-card mt-8 rounded-3xl p-6 text-center sm:p-8">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.14] bg-white/[0.06] text-[#E2D7B5]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold tracking-tight text-[#F5F2EB]">Album & Koleksi Tersimpan</h2>
            <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[#F5F2EB]/65">
              Masuk untuk melihat dan menyimpan tempat wisata favorit, rute custom, serta catatan aktivitas perjalanan Anda.
            </p>
            <button
              type="button"
              onClick={onRequireLogin}
              className="apple-retro-cta mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-2.5 text-[13px] font-semibold active:scale-[0.98]"
            >
              Masuk ke Akun
            </button>
          </section>
        ) : (
          <>
            {/* Sort Dropdown */}
            <div className="relative mt-5 inline-block">
              <button
                type="button"
                id="btn-sort-saved"
                onClick={() => setShowSortMenu((prev) => !prev)}
                className="apple-glass-pill inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] font-semibold text-[#F5F2EB] transition-all hover:bg-white/[0.12] active:scale-[0.98]"
              >
                <span>Urutkan: {sortOption}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div
                    id="popover-sort-menu"
                    className="liquid-glass-modal absolute left-0 top-12 z-30 w-44 rounded-2xl p-1.5 text-[12px]"
                  >
                    {['Terbaru', 'Terlama', 'Nama A-Z'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        id={`sort-option-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => {
                          setSortOption(opt)
                          setShowSortMenu(false)
                        }}
                        className={`flex min-h-[38px] w-full items-center justify-between rounded-xl px-3 py-1.5 text-left transition-colors ${
                          sortOption === opt
                            ? 'bg-[#DFAA63]/15 font-semibold text-[#DFAA63]'
                            : 'text-[#F5F2EB]/75 hover:bg-white/[0.08] hover:text-[#F5F2EB]'
                        }`}
                      >
                        <span>{opt}</span>
                        {sortOption === opt && (
                          <CheckIcon className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Grid Koleksi Folder */}
            <div className="mt-5 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {/* Folder 1: Terakhir dilihat */}
              <button
                type="button"
                id="folder-terakhir-dilihat"
                onClick={() => setActiveFolderView('recent')}
                className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="apple-glass-card apple-glass-card-hover grid aspect-square w-full grid-cols-2 gap-1.5 rounded-3xl p-2.5">
                  {recentPlaces.slice(0, 4).map((rp) => {
                    const thumbFallback = getBogorFallbackPhoto(rp)
                    return (
                      <SafeImage
                        key={rp.id || rp.slug}
                        src={rp.image || thumbFallback}
                        fallback={thumbFallback}
                        alt={rp.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    )
                  })}
                  {Array.from({ length: Math.max(0, 4 - recentPlaces.slice(0, 4).length) }).map((_, i) => (
                    <div
                      key={i}
                      className="flex h-full w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
                    >
                      <CompassIcon className="h-4 w-4 text-white/25" />
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14.5px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
                      Terakhir dilihat
                    </h2>
                    <p className="text-[11.5px] not-italic tabular-nums text-[#F5F2EB]/60">{recentPlaces.length} tempat wisata</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/45 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
                </div>
              </button>

              {/* Folder 2: Rute custom */}
              <button
                type="button"
                id="folder-rute-custom"
                onClick={() => setActiveFolderView('custom-route')}
                className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="apple-glass-card apple-glass-card-hover relative grid aspect-square w-full grid-cols-2 gap-1.5 overflow-hidden rounded-3xl p-2.5">
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-[rgba(244,239,230,0.1)] bg-white/[0.05] text-[#F5F2EB]">
                    <MapIcon className="h-6 w-6" />
                  </div>
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-[rgba(244,239,230,0.1)] bg-white/[0.05] text-[#DFAA63]">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-[rgba(244,239,230,0.1)] bg-white/[0.05] text-[#DFAA63]">
                    <FlagIcon className="h-6 w-6" />
                  </div>
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-[rgba(244,239,230,0.1)] bg-white/[0.05] text-[#F5F2EB]">
                    <CompassIcon className="h-6 w-6" duotone />
                  </div>

                  <div className="apple-glass-pill absolute inset-x-2.5 bottom-2.5 rounded-xl py-1 text-center">
                    <span className="text-[11px] font-semibold not-italic tabular-nums text-[#DFAA63]">
                      {customRoutesCount} Rute Tersedia
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14.5px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
                      Rute custom
                    </h2>
                    <p className="text-[11.5px] not-italic tabular-nums text-[#F5F2EB]/60">
                      {customRoutesCount} rute perjalanan
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/45 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
                </div>
              </button>

              {/* Folder 3: Favorit */}
              <button
                type="button"
                id="folder-favorit"
                onClick={() => setActiveFolderView('favorites')}
                className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="apple-glass-card apple-glass-card-hover grid aspect-square w-full grid-cols-2 gap-1.5 rounded-3xl p-2.5">
                  {favoritePlaces.slice(0, 4).map((place) => {
                    const thumbFallback = getBogorFallbackPhoto(place)
                    return (
                      <SafeImage
                        key={place.id || place.slug}
                        src={place.image || thumbFallback}
                        fallback={thumbFallback}
                        alt={place.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    )
                  })}
                  {Array.from({ length: Math.max(0, 4 - favoritePlaces.slice(0, 4).length) }).map((_, i) => (
                    <div
                      key={i}
                      className="flex h-full w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
                    >
                      <HeartIcon className="h-4 w-4 text-white/25" />
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14.5px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
                      Favorit
                    </h2>
                    <p className="text-[11.5px] not-italic tabular-nums text-[#F5F2EB]/60">
                      {favoritePlaces.length} tempat wisata
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#F5F2EB]/45 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
                </div>
              </button>
            </div>

            {/* Section: Aktivitas Perjalanan Saya */}
            <section className="mt-8" aria-labelledby="user-activities-heading">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="user-activities-heading"
                  className="text-[17px] font-semibold tracking-tight text-[#EBF0EB]"
                >
                  Aktivitas Perjalanan Saya
                </h2>
                {effectiveUserActivities.length > 0 && (
                  <span className="text-[12px] text-white/60 tabular-nums">
                    {effectiveUserActivities.length} tercatat
                  </span>
                )}
              </div>

              {effectiveUserActivities.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {effectiveUserActivities.map((act) => (
                    <div
                      key={act.id}
                      className="apple-glass-card apple-glass-card-hover flex items-start justify-between gap-3 rounded-2xl p-4"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-semibold tracking-tight text-[#EBF0EB]">{act.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#E2D7B5]">
                          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{act.location}</span>
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums tracking-wide text-[#F5F2EB]/55">{act.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="apple-glass-card mt-4 rounded-2xl p-5 text-center">
                  <p className="text-[13px] leading-relaxed text-[#F5F2EB]/65">
                    Belum ada aktivitas perjalanan tersimpan. Klik tombol tambah (+) di atas untuk menambahkan.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Modal Form: "Tambah Aktivitas Perjalanan Baru" (Liquid Glass) */}
      <GlassModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        overlayId="modal-tambah-aktivitas-overlay"
        modalId="modal-tambah-aktivitas"
        closeButtonId="btn-close-activity-modal"
        titleId="modal-activity-title"
        closeAriaLabel="Tutup modal tambah aktivitas"
        maxWidthClass="max-w-sm"
      >
        <div className="apple-glass-pill -mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl text-[#DFAA63]">
          <CompassIcon className="h-6 w-6" duotone />
        </div>

        <h3 id="modal-activity-title" className="text-center text-[19px] font-semibold tracking-tight text-[#F5F2EB]">
          Tambah Aktivitas Perjalanan Baru
        </h3>
        <p className="mt-1 text-center text-[12.5px] text-[#F5F2EB]/65">
          Catat dan simpan rencana aktivitas wisata Anda
        </p>

        <form onSubmit={handleActivitySubmit} className="mt-5 flex flex-col gap-3.5">
          <div>
            <label htmlFor="input-activity-name" className="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]">
              Nama Aktivitas
            </label>
            <input
              type="text"
              id="input-activity-name"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              placeholder="Contoh: Bersepeda di Kebun Raya"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-[#F5F2EB] placeholder:text-[#F5F2EB]/40 transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label htmlFor="input-activity-location" className="mb-1.5 block text-[12px] font-medium text-[#F5F2EB]">
              Lokasi Wisata
            </label>
            <input
              type="text"
              id="input-activity-location"
              value={newActivityLocation}
              onChange={(e) => setNewActivityLocation(e.target.value)}
              placeholder="Contoh: Kebun Raya Bogor"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-[#F5F2EB] placeholder:text-[#F5F2EB]/40 transition-colors duration-150"
              required
            />
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowActivityModal(false)}
              className="apple-glass-pill min-h-[44px] flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-[#F5F2EB] transition-colors duration-150 hover:bg-white/[0.12] active:scale-[0.98]"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-activity"
              className="apple-retro-cta min-h-[44px] flex-1 rounded-xl py-2.5 text-[13px] font-semibold active:scale-[0.98]"
            >
              Simpan
            </button>
          </div>
        </form>
      </GlassModal>

      <NotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        tourists={tourists}
        favorites={favorites}
        recentSlugs={recentSlugs}
        onSelectPlace={onSelectPlace}
      />
    </div>
  )
}

export default memo(SavedActivitiesPage)
