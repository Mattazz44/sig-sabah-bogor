import { memo, useEffect, useMemo, useRef, useState } from 'react'
import CustomRoutePage from './CustomRoutePage'
import NotificationDrawer from '../ui/NotificationDrawer'
import GlassModal from '../ui/GlassModal'
import SafeImage from '../ui/SafeImage'
import SabahMascot from '../ui/SabahMascot'
import InteractivePhotoStack from '../ui/InteractivePhotoStack'
import ScrollToTopButton from '../ui/ScrollToTopButton'
import { apiFetch, getAuthToken } from '../../utils/api'
import { pushAppNotification } from '../../utils/notifications'
import { DEFAULT_AVATAR_PLACEHOLDER, getBogorFallbackPhoto } from '../../utils/imageHelper'
import { usePreferences } from '../../utils/preferences'
import {
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CompassIcon,
  HeartIcon,
  MapIcon,
  MapPinIcon,
  StarIcon,
  UserIcon,
} from '../ui/VectorIcons'

const SAVED_SORT_OPTIONS = [
  { key: 'Terbaru', labelKey: 'saved.sortLatest' },
  { key: 'Terlama', labelKey: 'saved.sortOldest' },
  { key: 'Nama A-Z', labelKey: 'saved.sortNameAZ' },
]

function SavedPlaceRow({ place, secondaryMeta, onSelect }) {
  const { tCategory } = usePreferences()
  const photoFallback = getBogorFallbackPhoto(place)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(place)}
      className="group flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left transition-colors duration-150 hover:bg-[#1C2520] active:bg-[#222D27]"
    >
      <div className="h-13 w-13 shrink-0 overflow-hidden rounded-xl bg-[#1C2520]">
        <SafeImage
          src={place.image || photoFallback}
          fallback={photoFallback}
          alt={place.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        {place.category && (
          <span className="block truncate text-[11.5px] font-medium text-[#C5A868]">
            {tCategory(place.category)}
          </span>
        )}
        <h2 className="mt-0.5 truncate text-[15px] font-semibold tracking-[-0.015em] text-[#F5F2EB] transition-colors group-hover:text-white">
          {place.name}
        </h2>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#A7B2AA]">
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#F5F2EB]">
            <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#C5A868]" />
            {Number(place.rating || 0).toFixed(1)}
          </span>
          {secondaryMeta && (
            <>
              <span aria-hidden="true" className="text-[#94A198]/60">•</span>
              <span className="truncate tabular-nums">{secondaryMeta}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#94A198] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
    </button>
  )
}

function MicroThumbStack({ places }) {
  if (!Array.isArray(places) || places.length === 0) return null
  const thumbs = places.slice(0, 2)

  return (
    <div className="flex shrink-0 items-center -space-x-2" aria-hidden="true">
      {thumbs.map((place, index) => {
        const fallback = getBogorFallbackPhoto(place)
        return (
          <div
            key={place.id || place.slug || index}
            className="h-8 w-8 overflow-hidden rounded-lg bg-[#1C2520] ring-2 ring-[#151C18]"
          >
            <SafeImage
              src={place.image || fallback}
              fallback={fallback}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </div>
        )
      })}
    </div>
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
  const { t, tDynamic } = usePreferences()
  const [activeFolderView, setActiveFolderView] = useState(null)
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)
  const mainScrollRef = useRef(null)
  const recentScrollRef = useRef(null)
  const favoritesScrollRef = useRef(null)

  const [showActivityModal, setShowActivityModal] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')
  const [newActivityLocation, setNewActivityLocation] = useState('')

  const [userActivities, setUserActivities] = useState([])
  const [customRoutesCount, setCustomRoutesCount] = useState(0)

  const [showSortMenu, setShowSortMenu] = useState(false)
  const [sortOption, setSortOption] = useState('Terbaru')

  useEffect(() => {
    if (!isLoggedIn || !getAuthToken() || activeFolderView !== null) {
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
  }, [isLoggedIn, currentUser?.id, activeFolderView])

  const effectiveUserActivities = useMemo(() => {
    if (!isLoggedIn) return []
    if (sortOption === 'Nama A-Z') {
      return [...userActivities].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    if (sortOption === 'Terlama') {
      return [...userActivities].reverse()
    }
    return userActivities
  }, [isLoggedIn, userActivities, sortOption])

  const effectiveCustomRoutesCount = isLoggedIn ? customRoutesCount : 0

  const handleDeleteSavedActivity = async (activityId) => {
    const prevActivities = userActivities
    setUserActivities((prev) => prev.filter((a) => a.id !== activityId))
    try {
      const res = await apiFetch(`/api/saved-activities/${activityId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      console.warn('Gagal menghapus aktivitas tersimpan:', err)
      setUserActivities(prevActivities)
    }
  }

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
      pushAppNotification({
        type: 'success',
        title: t('saved.notifSavedTitle'),
        desc: t('saved.notifSavedDesc', { name: nameText, location: locText }),
      })
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

  const formatPlacesCount = (count) =>
    t(count === 1 ? 'saved.spotsCountSingle' : 'saved.spotsCount', { count })

  const formatRoutesCount = (count) =>
    t(count === 1 ? 'saved.routesCountSingle' : 'saved.routesCount', { count })

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
      <div className="relative h-full min-h-0 w-full">
        <div
          ref={recentScrollRef}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 136px)' }}
          className="animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-[#0E1310] text-[#F5F2EB] will-change-transform transform-gpu"
        >
          <div className="mx-auto w-full max-w-4xl px-5 pt-6 sm:px-6 lg:px-8">
            <header className="flex items-center gap-3 pb-4">
              <button
                type="button"
                id="btn-back-recent-list"
                onClick={() => setActiveFolderView(null)}
                aria-label={t('saved.backToFoldersAria')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17201B] text-[#F5F2EB] transition-colors duration-150 hover:bg-[#212D26] active:scale-[0.96]"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[24px] font-bold tracking-[-0.025em] text-[#F5F2EB] sm:text-[28px]">
                  {t('saved.recentHeader')}
                </h1>
                <p className="mt-0.5 text-[13px] text-[#A7B2AA]">
                  {t('saved.recentSubtitle')}
                </p>
              </div>
            </header>

            {recentPlaces.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-[#151C18] px-6 py-10 text-center">
                <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C2520] text-[#C5A868]">
                  <CompassIcon className="h-6 w-6" duotone />
                </div>
                <p className="text-[15px] font-semibold text-[#F5F2EB]">{t('saved.recentEmptyTitle')}</p>
                <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-[#A7B2AA]">
                  {t('saved.recentEmptyDesc')}
                </p>
              </div>
            ) : (
              <div className="mt-2 space-y-7">
                {recentPlaces.length >= 2 && (
                  <InteractivePhotoStack
                    idPrefix="recent-stack"
                    places={recentPlaces}
                    heading={t('motion.stackRecentHeading')}
                    subtitle={t('motion.stackRecentHint')}
                    onOpenDetail={onSelectPlace}
                  />
                )}
                <ul className="divide-y divide-[#F2ECE1]/[0.07] overflow-hidden rounded-2xl bg-[#151C18]">
                  {recentPlaces.map((place) => (
                    <li key={place.id || place.slug}>
                      <SavedPlaceRow
                        place={place}
                        secondaryMeta={place.travelTime || place.distance || 'Bogor'}
                        onSelect={onSelectPlace}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <ScrollToTopButton
          scrollContainerRef={recentScrollRef}
          className="absolute right-4 bottom-24 z-40 sm:right-6"
        />
      </div>
    )
  }

  if (activeFolderView === 'favorites') {
    return (
      <div className="relative h-full min-h-0 w-full">
        <div
          ref={favoritesScrollRef}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 136px)' }}
          className="animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-[#0E1310] text-[#F5F2EB] will-change-transform transform-gpu"
        >
          <div className="mx-auto w-full max-w-4xl px-5 pt-6 sm:px-6 lg:px-8">
            <header className="flex items-center gap-3 pb-4">
              <button
                type="button"
                id="btn-back-favorites-list"
                onClick={() => setActiveFolderView(null)}
                aria-label={t('saved.backToFoldersAria')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17201B] text-[#F5F2EB] transition-colors duration-150 hover:bg-[#212D26] active:scale-[0.96]"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[24px] font-bold tracking-[-0.025em] text-[#F5F2EB] sm:text-[28px]">
                  {t('saved.favoritesHeader')}
                </h1>
                <p className="mt-0.5 text-[13px] text-[#A7B2AA]">
                  {t('saved.favoritesSubtitle', { count: favoritePlaces.length })}
                </p>
              </div>
            </header>

            {favoritePlaces.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-[#151C18] px-6 py-10 text-center">
                <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C2520] text-[#C5A868]">
                  <HeartIcon className="h-6 w-6" />
                </div>
                <p className="text-[15px] font-semibold text-[#F5F2EB]">{t('saved.favoritesEmptyTitle')}</p>
                <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-[#A7B2AA]">
                  {t('saved.favoritesEmptyDesc')}
                </p>
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-[#F2ECE1]/[0.07] overflow-hidden rounded-2xl bg-[#151C18]">
                {favoritePlaces.map((place) => (
                  <li key={place.id || place.slug}>
                    <SavedPlaceRow
                      place={place}
                      secondaryMeta={place.distance || place.travelTime || 'Bogor'}
                      onSelect={onSelectPlace}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <ScrollToTopButton
          scrollContainerRef={favoritesScrollRef}
          className="absolute right-4 bottom-24 z-40 sm:right-6"
        />
      </div>
    )
  }

  const currentSortLabel = t(
    SAVED_SORT_OPTIONS.find((opt) => opt.key === sortOption)?.labelKey || 'saved.sortLatest',
  )

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        ref={mainScrollRef}
        id="saved-scroll-container"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 136px)' }}
        className="animate-tab-enter relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-[#0E1310] text-[#F5F2EB] will-change-transform transform-gpu"
      >
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 sm:px-6 lg:px-8">
          {/* Top Header */}
          <header className="flex items-start justify-between gap-3 sm:items-center">
            <div className="min-w-0">
              <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#F5F2EB] sm:text-[32px]">
                {t('saved.title')}
              </h1>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#A7B2AA]">
                {t('saved.subtitle')}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                id="btn-add-activity"
                onClick={handleAddPlusClick}
                title={t('saved.addActivityTitle')}
                aria-label={t('saved.addActivityAria')}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#17201B] text-[#F5F2EB] transition-colors duration-150 hover:bg-[#222E27] active:scale-[0.96]"
              >
                <svg
                  width="19"
                  height="19"
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
                title={t('saved.notifTitle')}
                aria-label={t('saved.notifAria')}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#17201B] text-[#F5F2EB] transition-colors duration-150 hover:bg-[#222E27] active:scale-[0.96]"
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
                aria-label={isLoggedIn ? t('saved.profileAria') : t('foryou.signInAria')}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#17201B] text-[#F5F2EB] transition-colors duration-150 hover:bg-[#222E27] active:scale-[0.96]"
              >
                {isLoggedIn ? (
                  <SafeImage
                    src={currentUser?.avatar}
                    fallback={DEFAULT_AVATAR_PLACEHOLDER}
                    alt={currentUser?.name || 'Avatar'}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </header>

          {!isLoggedIn ? (
            <section className="mt-8 rounded-2xl bg-[#151C18] px-6 py-9 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C2520] text-[#C5A868]">
                <svg
                  width="22"
                  height="22"
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
              <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#F5F2EB]">
                {t('saved.guestTitle')}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[#A7B2AA]">
                {t('saved.guestDesc')}
              </p>
              <button
                type="button"
                onClick={onRequireLogin}
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#F2ECE1] px-6 py-2.5 text-[13.5px] font-semibold text-[#141A14] transition-colors duration-150 hover:bg-[#E7DFD1] active:scale-[0.98]"
              >
                {t('saved.guestCta')}
              </button>
            </section>
          ) : (
            <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-8">
              {/* Koleksi Utama: Clean iOS Grouped List Rows (Borderless Surface Hierarchy) */}
              <section
                aria-labelledby="saved-collections-heading"
                className="lg:col-span-5"
              >
                <h2
                  id="saved-collections-heading"
                  className="mb-2.5 px-1 text-[13px] font-semibold tracking-tight text-[#A7B2AA]"
                >
                  {t('saved.collectionsHeading')}
                </h2>

                <div className="divide-y divide-[#F2ECE1]/[0.07] overflow-hidden rounded-2xl bg-[#151C18]">
                  {/* Row 1: Terakhir dilihat */}
                  <button
                    type="button"
                    id="folder-terakhir-dilihat"
                    onClick={() => setActiveFolderView('recent')}
                    className="group flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#1C2520] active:bg-[#222D27]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D2721] text-[#8FB596]"
                    >
                      <CompassIcon className="h-5 w-5" duotone />
                    </span>
                    <div className="min-w-0 flex-1">
                      {recentPlaces.length > 0 ? (
                        <>
                          <span className="block truncate text-[15px] font-semibold tracking-[-0.015em] text-[#F5F2EB]">
                            {t('saved.folderRecentTitle')}
                          </span>
                          <span className="mt-0.5 block truncate text-[12.5px] tabular-nums text-[#A7B2AA]">
                            {formatPlacesCount(recentPlaces.length)}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 truncate text-[15px] font-semibold tracking-[-0.015em] text-[#F5F2EB]">
                          <span className="truncate">{t('saved.folderRecentTitle')}</span>
                          <span aria-hidden="true" className="text-[#94A198]/70">•</span>
                          <span className="shrink-0 text-[13px] font-normal tabular-nums text-[#A7B2AA]">
                            {formatPlacesCount(0)}
                          </span>
                        </span>
                      )}
                    </div>
                    <MicroThumbStack places={recentPlaces} />
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#94A198] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
                  </button>

                  {/* Row 2: Rute custom */}
                  <button
                    type="button"
                    id="folder-rute-custom"
                    onClick={() => setActiveFolderView('custom-route')}
                    className="group flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#1C2520] active:bg-[#222D27]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D2721] text-[#C5A868]"
                    >
                      <MapIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold tracking-[-0.015em] text-[#F5F2EB]">
                        {t('saved.folderRoutesTitle')}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] tabular-nums text-[#A7B2AA]">
                        {formatRoutesCount(effectiveCustomRoutesCount)}
                      </span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#94A198] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
                  </button>

                  {/* Row 3: Favorit (Ringkas tanpa kotak kosong jika 0 places) */}
                  <button
                    type="button"
                    id="folder-favorit"
                    onClick={() => setActiveFolderView('favorites')}
                    className="group flex min-h-[60px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#1C2520] active:bg-[#222D27]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D2721] text-[#E39B8F]"
                    >
                      <HeartIcon className="h-5 w-5" filled={favoritePlaces.length > 0} />
                    </span>
                    <div className="min-w-0 flex-1">
                      {favoritePlaces.length > 0 ? (
                        <>
                          <span className="block truncate text-[15px] font-semibold tracking-[-0.015em] text-[#F5F2EB]">
                            {t('saved.folderFavoritesTitle')}
                          </span>
                          <span className="mt-0.5 block truncate text-[12.5px] tabular-nums text-[#A7B2AA]">
                            {formatPlacesCount(favoritePlaces.length)}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 truncate text-[15px] font-semibold tracking-[-0.015em] text-[#F5F2EB]">
                          <span className="truncate">{t('saved.folderFavoritesTitle')}</span>
                          <span aria-hidden="true" className="text-[#94A198]/70">•</span>
                          <span className="shrink-0 text-[13px] font-normal tabular-nums text-[#A7B2AA]">
                            {formatPlacesCount(0)}
                          </span>
                        </span>
                      )}
                    </div>
                    <MicroThumbStack places={favoritePlaces} />
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#94A198] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F2EB]" />
                  </button>
                </div>
              </section>

              {/* Section: Aktivitas Perjalanan Saya (Borderless Clean List) */}
              <section
                className="lg:col-span-7"
                aria-labelledby="user-activities-heading"
              >
                <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h2
                      id="user-activities-heading"
                      className="truncate text-[18px] font-bold tracking-[-0.02em] text-[#F5F2EB]"
                    >
                      {t('saved.myActivitiesHeading')}
                    </h2>
                    {effectiveUserActivities.length > 0 && (
                      <span className="shrink-0 text-[12.5px] tabular-nums text-[#94A198]">
                        {t('saved.recordedCount', { count: effectiveUserActivities.length })}
                      </span>
                    )}
                  </div>

                  {/* Subtle Borderless Sort Control */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      id="btn-sort-saved"
                      onClick={() => setShowSortMenu((prev) => !prev)}
                      aria-expanded={showSortMenu}
                      aria-haspopup="menu"
                      className="relative inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#151C18] px-3 py-1.5 text-[12.5px] font-medium text-[#A7B2AA] transition-colors duration-150 hover:bg-[#1C2520] hover:text-[#F5F2EB] active:scale-[0.98] before:absolute before:-inset-y-1 before:inset-x-0"
                    >
                      <span>{t('saved.sortPrefix', { option: currentSortLabel })}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
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
                          role="menu"
                          className="absolute right-0 top-11 z-30 w-44 rounded-2xl bg-[#1A231E] p-1.5 text-[12.5px] shadow-[0_18px_40px_-8px_rgba(0,0,0,0.65)] ring-1 ring-[#F2ECE1]/[0.08]"
                        >
                          {SAVED_SORT_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              role="menuitemradio"
                              aria-checked={sortOption === opt.key}
                              id={`sort-option-${opt.key.replace(/\s+/g, '-').toLowerCase()}`}
                              onClick={() => {
                                setSortOption(opt.key)
                                setShowSortMenu(false)
                              }}
                              className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-1.5 text-left transition-colors ${sortOption === opt.key
                                ? 'bg-[#243029] font-semibold text-[#C5A868]'
                                : 'text-[#F5F2EB]/80 hover:bg-[#222D26] hover:text-[#F5F2EB]'
                                }`}
                            >
                              <span>{t(opt.labelKey)}</span>
                              {sortOption === opt.key && (
                                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-[#C5A868]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {effectiveUserActivities.length > 0 ? (
                  <ul className="divide-y divide-[#F2ECE1]/[0.07] overflow-hidden rounded-2xl bg-[#151C18]">
                    {effectiveUserActivities.map((act) => (
                      <li
                        key={act.id}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-[#19221D]"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[14.5px] font-semibold tracking-[-0.012em] text-[#F5F2EB]">
                            {act.name}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#A7B2AA]">
                            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[#8FB596]" />
                            <span className="truncate">{act.location}</span>
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[12px] tabular-nums text-[#94A198]">
                            {tDynamic(act.date)}
                          </span>
                          {typeof act.id === 'number' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedActivity(act.id)}
                              aria-label={t('saved.deleteActivityAria', { name: act.name })}
                              title={t('saved.deleteActivityTitle')}
                              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#94A198] transition-colors duration-150 hover:bg-[#2D181C] hover:text-[#FCA5A5] active:scale-[0.94] before:absolute before:-inset-1.5"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-2xl bg-[#151C18] px-5 py-7 text-center">
                    <p className="text-[13.5px] leading-relaxed text-[#A7B2AA]">
                      {t('saved.myActivitiesEmpty')}
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Modal Form: "Tambah Aktivitas Perjalanan Baru" */}
        <GlassModal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          overlayId="modal-tambah-aktivitas-overlay"
          modalId="modal-tambah-aktivitas"
          closeButtonId="btn-close-activity-modal"
          titleId="modal-activity-title"
          closeAriaLabel={t('saved.modalCloseAria')}
          maxWidthClass="max-w-sm"
        >
          <div className="-mt-3 mb-3 flex justify-center">
            <SabahMascot variant="happy" size="modal" interactive />
          </div>

          <h3 id="modal-activity-title" className="text-center text-[19px] font-bold tracking-[-0.02em] text-[#F5F2EB]">
            {t('saved.modalTitle')}
          </h3>
          <p className="mt-1 text-center text-[13px] text-[#A7B2AA]">
            {t('saved.modalDesc')}
          </p>

          <form onSubmit={handleActivitySubmit} className="mt-5 flex flex-col gap-3.5">
            <div>
              <label htmlFor="input-activity-name" className="mb-1.5 block text-[12.5px] font-medium text-[#F5F2EB]">
                {t('saved.activityNameLabel')}
              </label>
              <input
                type="text"
                id="input-activity-name"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                placeholder={t('saved.activityNamePlaceholder')}
                className="min-h-[44px] w-full rounded-xl bg-[#1B241F] px-3.5 py-2.5 text-[13.5px] text-[#F5F2EB] placeholder:text-[#94A198] transition-colors duration-150 focus:bg-[#212C26] focus:outline-2 focus:outline-[#C5A868]"
                required
              />
            </div>

            <div>
              <label htmlFor="input-activity-location" className="mb-1.5 block text-[12.5px] font-medium text-[#F5F2EB]">
                {t('saved.activityLocationLabel')}
              </label>
              <input
                type="text"
                id="input-activity-location"
                value={newActivityLocation}
                onChange={(e) => setNewActivityLocation(e.target.value)}
                placeholder={t('saved.activityLocationPlaceholder')}
                className="min-h-[44px] w-full rounded-xl bg-[#1B241F] px-3.5 py-2.5 text-[13.5px] text-[#F5F2EB] placeholder:text-[#94A198] transition-colors duration-150 focus:bg-[#212C26] focus:outline-2 focus:outline-[#C5A868]"
                required
              />
            </div>

            <div className="mt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="min-h-[44px] flex-1 rounded-xl bg-[#1D2721] py-2.5 text-[13.5px] font-semibold text-[#F5F2EB] transition-colors duration-150 hover:bg-[#26332C] active:scale-[0.98]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                id="btn-save-activity"
                className="min-h-[44px] flex-1 rounded-xl bg-[#F2ECE1] py-2.5 text-[13.5px] font-semibold text-[#141A14] transition-colors duration-150 hover:bg-[#E7DFD1] active:scale-[0.98]"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </GlassModal>

        <NotificationDrawer
          isOpen={showNotificationDrawer}
          onClose={() => setShowNotificationDrawer(false)}
          tourists={tourists}
          favorites={favorites}
          onSelectPlace={onSelectPlace}
        />
      </div>

      <ScrollToTopButton
        scrollContainerRef={mainScrollRef}
        className="absolute right-4 bottom-24 z-40 sm:right-6"
      />
    </div>
  )
}

export default memo(SavedActivitiesPage)
