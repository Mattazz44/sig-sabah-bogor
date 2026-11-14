import { memo, useEffect, useMemo, useState } from 'react'
import CustomRoutePage from './CustomRoutePage'
import NotificationDrawer from '../ui/NotificationDrawer'
import GlassModal from '../ui/GlassModal'
import SafeImage from '../ui/SafeImage'
import { apiFetch } from '../../utils/api'
import { DEFAULT_AVATAR_PLACEHOLDER } from '../../utils/imageHelper'
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
  return (
    <button
      type="button"
      onClick={() => onSelect?.(place)}
      className="group flex min-w-0 items-center gap-3.5 rounded-2xl border border-white/[0.14] bg-[#233020] p-3.5 text-left shadow-sm transition-colors duration-150 hover:border-white/[0.28] hover:bg-[#2A3A27] active:scale-[0.99]"
    >
      <SafeImage
        src={place.image}
        alt={place.name}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        {place.category && (
          <span className="block truncate text-[11px] font-semibold text-[#E2D7B5]">
            {place.category}
          </span>
        )}
        <h3 className="mt-0.5 truncate text-[14px] font-bold text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
          {place.name}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-[#C8D3C8]">
          <span className="inline-flex items-center gap-1 font-medium tabular-nums text-[#EBF0EB]">
            <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            {Number(place.rating || 0).toFixed(1)}
          </span>
          {secondaryMeta && (
            <>
              <span aria-hidden="true" className="text-[#C8D3C8]/50">·</span>
              <span className="truncate">{secondaryMeta}</span>
            </>
          )}
        </div>
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-[#1B261B] text-[#EBF0EB] transition-colors group-hover:bg-[#EBF0EB] group-hover:text-[#161E16]">
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
  const [customRoutesCount, setCustomRoutesCount] = useState(2)

  useEffect(() => {
    if (!isLoggedIn) return undefined

    let isMounted = true
    apiFetch('/api/saved-activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (isMounted && json?.data) {
          if (Array.isArray(json.data.activities) && json.data.activities.length > 0) {
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
          }
          if (Array.isArray(json.data.custom_routes)) {
            setCustomRoutesCount(json.data.custom_routes.length)
          }
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat aktivitas tersimpan dari API, fallback ke default:', err)
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

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

  const handleActivitySubmit = (e) => {
    e.preventDefault()
    if (!newActivityName.trim() || !newActivityLocation.trim()) return

    const nameText = newActivityName.trim()
    const locText = newActivityLocation.trim()

    const newAct = {
      id: `act-${Date.now()}`,
      name: nameText,
      location: locText,
      date: 'Baru saja',
    }

    setUserActivities((prev) => [newAct, ...prev])

    apiFetch('/api/saved-activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: nameText,
        location: locText,
      }),
    }).catch((err) => {
      console.warn('Gagal menyimpan aktivitas ke server:', err)
    })

    setNewActivityName('')
    setNewActivityLocation('')
    setShowActivityModal(false)
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
        className="animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu bg-forest-900 text-[#EBF0EB]"
      >
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <header className="flex items-center gap-3 border-b border-white/[0.12] pb-4">
            <button
              type="button"
              id="btn-back-recent-list"
              onClick={() => setActiveFolderView(null)}
              aria-label="Kembali ke daftar folder tersimpan"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[21px] font-bold tracking-tight text-[#EBF0EB] sm:text-[24px]">
                Terakhir Dilihat
              </h1>
              <p className="text-[12.5px] text-[#C8D3C8]">
                Daftar tempat wisata yang baru saja Anda buka
              </p>
            </div>
          </header>

          {recentPlaces.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-white/[0.14] bg-[#233020] p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.14] bg-[#1B261B] text-[#E2D7B5]">
                <CompassIcon className="h-7 w-7" duotone />
              </div>
              <p className="text-[14px] font-bold text-[#EBF0EB]">Belum Ada Riwayat Dilihat</p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-[#C8D3C8]">
                Jelajahi destinasi di peta Explore untuk menyimpan jejak tempat yang pernah Anda lihat.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPlaces.map((place) => (
                <SavedPlaceCard
                  key={place.id || place.slug}
                  place={place}
                  secondaryMeta={place.travelTime || place.distance || 'Bogor'}
                  onSelect={onSelectPlace}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (activeFolderView === 'favorites') {
    return (
      <div
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
        className="animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu bg-forest-900 text-[#EBF0EB]"
      >
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <header className="flex items-center gap-3 border-b border-white/[0.12] pb-4">
            <button
              type="button"
              id="btn-back-favorites-list"
              onClick={() => setActiveFolderView(null)}
              aria-label="Kembali ke daftar folder tersimpan"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[21px] font-bold tracking-tight text-[#EBF0EB] sm:text-[24px]">
                Tempat Wisata Favorit
              </h1>
              <p className="text-[12.5px] text-[#C8D3C8]">
                {favoritePlaces.length} tempat wisata favorit tersimpan
              </p>
            </div>
          </header>

          {favoritePlaces.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-white/[0.14] bg-[#233020] p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.14] bg-[#1B261B] text-[#E2D7B5]">
                <HeartIcon className="h-7 w-7" />
              </div>
              <p className="text-[14px] font-bold text-[#EBF0EB]">Belum Ada Wisata Favorit</p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-[#C8D3C8]">
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
      className="animate-tab-enter relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu bg-forest-900 text-[#EBF0EB]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[24px] font-bold tracking-tight text-[#EBF0EB] sm:text-[26px]">
              Aktivitas Tersimpan
            </h1>
            <p className="mt-0.5 truncate text-[12.5px] text-[#C8D3C8]">
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.14] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.14] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
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
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/[0.2] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
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
          <section className="mt-8 rounded-3xl border border-white/[0.14] bg-[#233020] p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.14] bg-[#1B261B] text-[#E2D7B5]">
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
            <h2 className="text-[17px] font-bold text-[#EBF0EB]">Album & Koleksi Tersimpan</h2>
            <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[#C8D3C8]">
              Masuk untuk melihat dan menyimpan tempat wisata favorit, rute custom, serta catatan aktivitas perjalanan Anda.
            </p>
            <button
              type="button"
              onClick={onRequireLogin}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#EBF0EB] px-6 py-2.5 text-[13px] font-bold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98]"
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
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/[0.14] bg-[#233020] px-4 py-1.5 text-[12.5px] font-semibold text-[#EBF0EB] shadow-sm transition-colors hover:bg-[#2E3E2A] active:scale-[0.98]"
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
                    className="absolute left-0 top-11 z-30 w-44 rounded-2xl border border-white/[0.18] bg-[#1B261B] p-1.5 text-[12px] shadow-2xl"
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
                            ? 'bg-white/[0.14] font-bold text-[#EBF0EB]'
                            : 'text-[#C8D3C8] hover:bg-white/[0.08] hover:text-[#EBF0EB]'
                        }`}
                      >
                        <span>{opt}</span>
                        {sortOption === opt && (
                          <CheckIcon className="h-3.5 w-3.5 shrink-0 text-[#E2D7B5]" />
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
                <div className="grid aspect-square w-full grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.14] bg-[#233020] p-2.5 shadow-sm transition-colors duration-150 group-hover:border-white/[0.28]">
                  {recentPlaces.length > 0 ? (
                    recentPlaces.slice(0, 4).map((rp) => (
                      <SafeImage
                        key={rp.id}
                        src={rp.image}
                        alt={rp.name}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ))
                  ) : (
                    <div className="col-span-2 flex h-full items-center justify-center text-[11px] text-[#C8D3C8]">
                      Belum ada data
                    </div>
                  )}
                  {Array.from({ length: Math.max(0, 4 - recentPlaces.slice(0, 4).length) }).map((_, i) => (
                    <div key={i} className="h-full w-full rounded-lg bg-[#1B261B]" />
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14.5px] font-semibold text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                      Terakhir dilihat
                    </h2>
                    <p className="text-[12px] text-[#C8D3C8]">{recentPlaces.length} tempat wisata</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#C8D3C8] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#EBF0EB]" />
                </div>
              </button>

              {/* Folder 2: Rute custom */}
              <button
                type="button"
                id="folder-rute-custom"
                onClick={() => setActiveFolderView('custom-route')}
                className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="relative grid aspect-square w-full grid-cols-2 gap-1.5 overflow-hidden rounded-2xl border border-white/[0.14] bg-[#233020] p-2.5 shadow-sm transition-colors duration-150 group-hover:border-white/[0.28]">
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/[0.08] bg-[#1B261B] text-[#EBF0EB]">
                    <MapIcon className="h-6 w-6" />
                  </div>
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/[0.08] bg-[#1B261B] text-[#E2D7B5]">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/[0.08] bg-[#1B261B] text-[#E2D7B5]">
                    <FlagIcon className="h-6 w-6" />
                  </div>
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/[0.08] bg-[#1B261B] text-[#EBF0EB]">
                    <CompassIcon className="h-6 w-6" duotone />
                  </div>

                  <div className="absolute inset-x-2.5 bottom-2.5 rounded-lg border border-white/[0.14] bg-[#161E16]/90 py-1 text-center">
                    <span className="text-[11px] font-semibold text-[#E2D7B5]">
                      {customRoutesCount} Rute Tersedia
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14.5px] font-semibold text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                      Rute custom
                    </h2>
                    <p className="text-[12px] text-[#C8D3C8]">
                      {customRoutesCount} rute perjalanan
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#C8D3C8] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#EBF0EB]" />
                </div>
              </button>

              {/* Folder 3: Favorit */}
              <button
                type="button"
                id="folder-favorit"
                onClick={() => setActiveFolderView('favorites')}
                className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="grid aspect-square w-full grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.14] bg-[#233020] p-2.5 shadow-sm transition-colors duration-150 group-hover:border-white/[0.28]">
                  {favoritePlaces.slice(0, 4).map((place) => (
                    <SafeImage
                      key={place.id}
                      src={place.image}
                      alt={place.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ))}
                  {Array.from({ length: Math.max(0, 4 - favoritePlaces.slice(0, 4).length) }).map((_, i) => (
                    <div key={i} className="h-full w-full rounded-lg bg-[#1B261B]" />
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[14.5px] font-semibold text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                      Favorit
                    </h2>
                    <p className="text-[12px] text-[#C8D3C8]">
                      {favoritePlaces.length} tempat wisata
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#C8D3C8] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#EBF0EB]" />
                </div>
              </button>
            </div>

            {/* Section: Aktivitas Perjalanan Saya */}
            <section className="mt-8" aria-labelledby="user-activities-heading">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="user-activities-heading"
                  className="text-[16px] font-bold tracking-tight text-[#EBF0EB]"
                >
                  Aktivitas Perjalanan Saya
                </h2>
                {effectiveUserActivities.length > 0 && (
                  <span className="text-[12px] text-[#C8D3C8]">
                    {effectiveUserActivities.length} tercatat
                  </span>
                )}
              </div>

              {effectiveUserActivities.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {effectiveUserActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/[0.14] bg-[#233020] p-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-bold text-[#EBF0EB]">{act.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#E2D7B5]">
                          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{act.location}</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-[#C8D3C8]">{act.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/[0.14] bg-[#233020] p-5 text-center">
                  <p className="text-[13px] text-[#C8D3C8]">
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
        <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#E2D7B5] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.22)]">
          <CompassIcon className="h-6 w-6" duotone />
        </div>

        <h3 id="modal-activity-title" className="text-center text-[19px] font-bold tracking-tight text-white">
          Tambah Aktivitas Perjalanan Baru
        </h3>
        <p className="mt-1 text-center text-[12.5px] text-[#E2EAE2]">
          Catat dan simpan rencana aktivitas wisata Anda
        </p>

        <form onSubmit={handleActivitySubmit} className="mt-5 flex flex-col gap-3.5">
          <div>
            <label htmlFor="input-activity-name" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
              Nama Aktivitas
            </label>
            <input
              type="text"
              id="input-activity-name"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              placeholder="Contoh: Bersepeda di Kebun Raya"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#C8D3C8] transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label htmlFor="input-activity-location" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
              Lokasi Wisata
            </label>
            <input
              type="text"
              id="input-activity-location"
              value={newActivityLocation}
              onChange={(e) => setNewActivityLocation(e.target.value)}
              placeholder="Contoh: Kebun Raya Bogor"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#C8D3C8] transition-colors duration-150"
              required
            />
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowActivityModal(false)}
              className="min-h-[44px] flex-1 rounded-xl border border-white/[0.14] bg-white/[0.06] py-2.5 text-[13px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-white/[0.12] active:scale-[0.98]"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-activity"
              className="min-h-[44px] flex-1 rounded-xl bg-[#EBF0EB] py-2.5 text-[13px] font-bold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98]"
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
