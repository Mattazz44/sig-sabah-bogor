import { memo, useEffect, useMemo, useState } from 'react'
import CustomRoutePage from './CustomRoutePage'
import NotificationDrawer from '../ui/NotificationDrawer'
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
  XIcon,
} from '../ui/VectorIcons'

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

  const [savedState, setSavedState] = useState({
    loaded: false,
    activities: [],
    customRoutesCount: null,
  })
  const [localActivities, setLocalActivities] = useState([])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    let isMounted = true
    apiFetch('/api/saved-activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (!isMounted || !json?.data) return
        const mapped = Array.isArray(json.data.activities)
          ? json.data.activities.map((a) => ({
              id: a.id,
              tourist_spot_id: a.tourist_spot_id,
              spot_slug: a.spot_slug,
              name: a.name,
              location: a.location,
              date: a.date_label || 'Baru saja',
            }))
          : []
        const routesLen = Array.isArray(json.data.custom_routes)
          ? json.data.custom_routes.length
          : 0
        setSavedState({
          loaded: true,
          activities: mapped,
          customRoutesCount: routesLen,
        })
      })
      .catch(() => {
        if (isMounted) {
          setSavedState((prev) => ({ ...prev, loaded: true }))
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!showActivityModal) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowActivityModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showActivityModal])

  const effectiveUserActivities = useMemo(() => {
    if (!isLoggedIn) return []
    const serverIds = new Set(savedState.activities.map((a) => a.id))
    return [...localActivities.filter((a) => !serverIds.has(a.id)), ...savedState.activities]
  }, [isLoggedIn, localActivities, savedState.activities])

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

    setLocalActivities((prev) => [newAct, ...prev])

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
    return []
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
        className="animate-tab-enter mx-auto h-full min-h-0 w-full max-w-md overflow-y-auto overscroll-contain overscroll-y-contain bg-forest-900 px-5 pt-6 text-[#EBF0EB]"
      >
        <div className="flex items-center gap-3 border-b border-[#EBF0EB]/12 pb-4">
          <button
            type="button"
            id="btn-back-recent-list"
            onClick={() => setActiveFolderView(null)}
            aria-label="Kembali ke aktivitas tersimpan"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-[#EBF0EB]">
              Terakhir dilihat
            </h1>
            <p className="text-[12px] text-[#C8D3C8]">
              Destinasi yang baru saja Anda buka
            </p>
          </div>
        </div>

        {recentPlaces.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020] p-6 text-center">
            <p className="text-[14px] font-semibold text-[#EBF0EB]">Belum ada riwayat kunjungan</p>
            <p className="mt-1 text-[12px] text-[#C8D3C8]">
              Buka salah satu destinasi wisata di tab Explore untuk mencatat riwayat.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3.5">
            {recentPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelectPlace && onSelectPlace(place.slug)}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-3 text-left shadow-sm transition-colors duration-150 hover:border-[#EBF0EB]/24 hover:bg-[#2B3B28] active:scale-[0.98]"
              >
                <SafeImage
                  src={place.image}
                  alt={place.name}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-emerald-200">
                    {place.category}
                  </span>
                  <h2 className="truncate text-[14px] font-bold text-[#EBF0EB]">
                    {place.name}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-[#C8D3C8]">
                    <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span className="tabular-nums text-[#EBF0EB]">
                      {Number(place.rating || 0).toFixed(1)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{place.travelTime || place.distance || place.category}</span>
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#EBF0EB]/16 bg-[#253320] text-[#EBF0EB]">
                  <ChevronRightIcon className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (activeFolderView === 'favorites') {
    return (
      <div
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
        className="animate-tab-enter mx-auto h-full min-h-0 w-full max-w-md overflow-y-auto overscroll-contain overscroll-y-contain bg-forest-900 px-5 pt-6 text-[#EBF0EB]"
      >
        <div className="flex items-center gap-3 border-b border-[#EBF0EB]/12 pb-4">
          <button
            type="button"
            id="btn-back-favorites-list"
            onClick={() => setActiveFolderView(null)}
            aria-label="Kembali ke aktivitas tersimpan"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-[#EBF0EB]">
              Tempat wisata favorit
            </h1>
            <p className="text-[12px] text-[#C8D3C8] tabular-nums">
              {favoritePlaces.length} destinasi tersimpan
            </p>
          </div>
        </div>

        {favoritePlaces.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#EBF0EB]/15 bg-[#253320] text-[#E2D7B5]">
              <HeartIcon className="h-7 w-7" />
            </div>
            <p className="text-[14px] font-semibold text-[#EBF0EB]">Belum ada wisata favorit</p>
            <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-[#C8D3C8]">
              Simpan destinasi favorit dengan menekan ikon hati pada tab Explore.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3.5">
            {favoritePlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelectPlace && onSelectPlace(place.slug)}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-3 text-left shadow-sm transition-colors duration-150 hover:border-[#EBF0EB]/24 hover:bg-[#2B3B28] active:scale-[0.98]"
              >
                <SafeImage
                  src={place.image}
                  alt={place.name}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-[#E2D7B5]">
                    {place.category}
                  </span>
                  <h2 className="truncate text-[14px] font-bold text-[#EBF0EB]">
                    {place.name}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-[#C8D3C8]">
                    <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span className="tabular-nums text-[#EBF0EB]">
                      {Number(place.rating || 0).toFixed(1)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{place.distance || place.category}</span>
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#EBF0EB]/16 bg-[#253320] text-[#EBF0EB]">
                  <ChevronRightIcon className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter relative mx-auto h-full min-h-0 w-full max-w-md overflow-y-auto overscroll-contain overscroll-y-contain bg-forest-900 px-5 pt-6 text-[#EBF0EB]"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[22px] font-bold tracking-tight text-[#EBF0EB]">
          Aktivitas Tersimpan
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-add-activity"
            onClick={handleAddPlusClick}
            title="Tambah aktivitas perjalanan baru"
            aria-label="Tambah aktivitas"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
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
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
          >
            <BellIcon className="h-4.5 w-4.5" />
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
            aria-label={isLoggedIn ? 'Buka profil pengguna' : 'Masuk ke akun'}
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
          >
            {isLoggedIn ? (
              <SafeImage
                src={currentUser?.avatar}
                fallback={DEFAULT_AVATAR_PLACEHOLDER}
                alt={currentUser?.name || 'Foto profil'}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <UserIcon className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      {!isLoggedIn ? (
        <div className="mt-8 rounded-2xl border border-[#EBF0EB]/14 bg-[#253320] p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#EBF0EB]/15 bg-[#1B261B] text-[#E2D7B5]">
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
          <h2 className="text-[16px] font-bold text-[#EBF0EB]">Koleksi dan rute tersimpan</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-[#C8D3C8]">
            Masuk untuk mengelola daftar destinasi favorit, rute custom, dan catatan rencana perjalanan Anda.
          </p>
          <button
            type="button"
            onClick={onRequireLogin}
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#EBF0EB] px-6 py-2.5 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
          >
            Masuk ke akun
          </button>
        </div>
      ) : (
        <>
          {/* Dropdown Urutkan */}
          <div className="relative mt-4 inline-block">
            <button
              type="button"
              id="btn-sort-saved"
              aria-expanded={showSortMenu}
              aria-haspopup="menu"
              onClick={() => setShowSortMenu((prev) => !prev)}
              className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] px-3.5 py-1.5 text-[12px] font-medium text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
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
                <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                <div
                  id="popover-sort-menu"
                  role="menu"
                  aria-label="Opsi pengurutan"
                  className="absolute left-0 top-11 z-30 w-40 rounded-2xl border border-[#EBF0EB]/18 bg-[#1B251B] p-1.5 text-[12px] shadow-2xl animate-modal-pop"
                >
                  {['Terbaru', 'Terlama', 'Nama A-Z'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sortOption === opt}
                      id={`sort-option-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        setSortOption(opt)
                        setShowSortMenu(false)
                      }}
                      className={`flex min-h-[38px] w-full items-center justify-between rounded-xl px-3 py-1.5 text-left transition-colors ${
                        sortOption === opt
                          ? 'bg-[#2E4028] font-bold text-[#EBF0EB]'
                          : 'text-[#C8D3C8] hover:bg-[#253320] hover:text-[#EBF0EB]'
                      }`}
                    >
                      <span>{opt}</span>
                      {sortOption === opt && <CheckIcon className="h-3.5 w-3.5 text-[#E2D7B5]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Grid Folders */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            {/* Folder 1: Terakhir dilihat */}
            <button
              type="button"
              id="folder-terakhir-dilihat"
              onClick={() => setActiveFolderView('recent')}
              className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
            >
              <div className="grid aspect-square w-full grid-cols-2 gap-1.5 rounded-2xl border border-[#EBF0EB]/14 bg-[#233020] p-2 shadow-sm transition-colors group-hover:border-[#EBF0EB]/28">
                {recentPlaces.slice(0, 4).map((rp) => (
                  <SafeImage
                    key={rp.id}
                    src={rp.image}
                    alt={rp.name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ))}
                {Array.from({ length: Math.max(0, 4 - recentPlaces.slice(0, 4).length) }).map(
                  (_, i) => (
                    <div key={i} className="h-full w-full rounded-lg bg-[#2E3E2A]" />
                  ),
                )}
              </div>
              <span className="mt-2.5 flex items-center justify-between text-[14px] font-semibold text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                <span>Terakhir dilihat</span>
                <ChevronRightIcon className="h-4 w-4 text-[#C8D3C8] transition-colors group-hover:text-[#EBF0EB]" />
              </span>
              <span className="text-[12px] text-[#C8D3C8] tabular-nums">
                {recentPlaces.length} destinasi
              </span>
            </button>

            {/* Folder 2: Rute custom */}
            <button
              type="button"
              id="folder-rute-custom"
              onClick={() => setActiveFolderView('custom-route')}
              className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
            >
              <div className="relative grid aspect-square w-full grid-cols-2 gap-1.5 overflow-hidden rounded-2xl border border-[#EBF0EB]/14 bg-[#233020] p-2 shadow-sm transition-colors group-hover:border-emerald-400/45">
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-[#EBF0EB]/10 bg-[#1B261B] text-emerald-300">
                  <MapIcon className="h-5 w-5" />
                </div>
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-[#EBF0EB]/10 bg-[#1B261B] text-amber-300">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-[#EBF0EB]/10 bg-[#1B261B] text-emerald-200">
                  <FlagIcon className="h-5 w-5" />
                </div>
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-[#EBF0EB]/10 bg-[#1B261B] text-[#EBF0EB]">
                  <CompassIcon className="h-5 w-5" />
                </div>

                <div className="absolute inset-x-2 bottom-2 rounded-lg border border-[#EBF0EB]/14 bg-[#182118] py-1 text-center">
                  <span className="text-[10px] font-semibold text-emerald-200 tabular-nums">
                    {savedState.customRoutesCount === null
                      ? 'Kelola rute'
                      : `${savedState.customRoutesCount} rute tersedia`}
                  </span>
                </div>
              </div>
              <span className="mt-2.5 flex items-center justify-between text-[14px] font-semibold text-[#EBF0EB] transition-colors group-hover:text-emerald-200">
                <span>Rute custom</span>
                <ChevronRightIcon className="h-4 w-4 text-[#C8D3C8] transition-colors group-hover:text-[#EBF0EB]" />
              </span>
              <span className="text-[12px] text-[#C8D3C8] tabular-nums">
                {savedState.customRoutesCount === null
                  ? 'Rute multi-titik'
                  : `${savedState.customRoutesCount} rute perjalanan`}
              </span>
            </button>

            {/* Folder 3: Favorit */}
            <button
              type="button"
              id="folder-favorit"
              onClick={() => setActiveFolderView('favorites')}
              className="group flex flex-col text-left transition-transform duration-150 active:scale-[0.98]"
            >
              <div className="grid aspect-square w-full grid-cols-2 gap-1.5 rounded-2xl border border-[#EBF0EB]/14 bg-[#233020] p-2 shadow-sm transition-colors group-hover:border-[#EBF0EB]/28">
                {favoritePlaces.slice(0, 4).map((place) => (
                  <SafeImage
                    key={place.id}
                    src={place.image}
                    alt={place.name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ))}
                {Array.from({ length: Math.max(0, 4 - favoritePlaces.slice(0, 4).length) }).map(
                  (_, i) => (
                    <div key={i} className="h-full w-full rounded-lg bg-[#2E3E2A]" />
                  ),
                )}
              </div>
              <span className="mt-2.5 flex items-center justify-between text-[14px] font-semibold text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                <span>Favorit</span>
                <ChevronRightIcon className="h-4 w-4 text-[#C8D3C8] transition-colors group-hover:text-[#EBF0EB]" />
              </span>
              <span className="text-[12px] text-[#C8D3C8] tabular-nums">
                {favoritePlaces.length} destinasi
              </span>
            </button>
          </div>

          {/* Section Aktivitas Perjalanan Saya */}
          {!savedState.loaded ? (
            <div className="mt-7 h-20 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020]" />
          ) : effectiveUserActivities.length > 0 ? (
            <section className="mt-7" aria-labelledby="saved-activities-heading">
              <div className="mb-3 flex items-center justify-between">
                <h2
                  id="saved-activities-heading"
                  className="text-[14px] font-bold tracking-tight text-[#EBF0EB]"
                >
                  Catatan perjalanan saya
                </h2>
                <span className="text-[12px] text-[#C8D3C8] tabular-nums">
                  {effectiveUserActivities.length} tercatat
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {effectiveUserActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-bold text-[#EBF0EB]">{act.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-emerald-200">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{act.location}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-[#C8D3C8]">{act.date}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="mt-7 rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-4 text-center">
              <p className="text-[12.5px] text-[#C8D3C8]">
                Belum ada catatan aktivitas tersimpan. Ketuk tombol + di atas untuk menambahkan.
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal Tambah Aktivitas Perjalanan Baru */}
      {showActivityModal && (
        <div
          id="modal-tambah-aktivitas-overlay"
          onClick={() => setShowActivityModal(false)}
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/65 p-4 animate-backdrop-fade"
        >
          <div
            id="modal-tambah-aktivitas"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-activity-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-3xl border border-[#EBF0EB]/18 bg-[#1B251B] p-6 shadow-2xl animate-modal-pop"
          >
            <button
              type="button"
              id="btn-close-activity-modal"
              onClick={() => setShowActivityModal(false)}
              aria-label="Tutup dialog aktivitas"
              className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
            >
              <XIcon className="h-4 w-4" />
            </button>

            <div className="-mt-4 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#EBF0EB]/15 bg-[#253320] text-[#E2D7B5]">
              <FlagIcon className="h-6 w-6" />
            </div>

            <h2
              id="add-activity-modal-title"
              className="text-center text-[18px] font-bold tracking-tight text-[#EBF0EB]"
            >
              Tambah aktivitas baru
            </h2>
            <p className="mt-1 text-center text-[12px] text-[#C8D3C8]">
              Catat rencana perjalanan wisata Anda
            </p>

            <form onSubmit={handleActivitySubmit} className="mt-4 flex flex-col gap-3">
              <div>
                <label
                  htmlFor="input-activity-name"
                  className="mb-1.5 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Nama aktivitas
                </label>
                <input
                  type="text"
                  id="input-activity-name"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  placeholder="Contoh: Bersepeda di Kebun Raya"
                  className="min-h-[44px] w-full rounded-xl border border-[#EBF0EB]/18 bg-[#121812] px-3.5 py-2 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] transition-colors focus:border-[#E2D7B5]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="input-activity-location"
                  className="mb-1.5 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Lokasi wisata
                </label>
                <input
                  type="text"
                  id="input-activity-location"
                  value={newActivityLocation}
                  onChange={(e) => setNewActivityLocation(e.target.value)}
                  placeholder="Contoh: Kebun Raya Bogor"
                  className="min-h-[44px] w-full rounded-xl border border-[#EBF0EB]/18 bg-[#121812] px-3.5 py-2 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] transition-colors focus:border-[#E2D7B5]"
                  required
                />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="min-h-[44px] flex-1 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] py-2.5 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-activity"
                  className="min-h-[44px] flex-1 rounded-xl bg-[#EBF0EB] py-2.5 text-[12.5px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
