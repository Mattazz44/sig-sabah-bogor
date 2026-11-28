import { memo, useEffect, useRef, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import SabahMascot from '../ui/SabahMascot'
import GlassModal from '../ui/GlassModal'
import ProfileSettingsSheet from '../ui/ProfileSettingsSheet'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'
import { apiFetch, getAuthToken } from '../../utils/api'
import { compressImage } from '../../utils/imageCompressor'
import { pushAppNotification } from '../../utils/notifications'
import { usePreferences } from '../../utils/preferences'
import {
  AlertTriangleIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  CompassIcon,
  EditIcon,
  MapPinIcon,
  RouteWaypointsIcon,
  SettingsIcon,
} from '../ui/VectorIcons'

function buildFollowStorageKey(viewerId, identifier) {
  return `follow_${viewerId || 'guest'}_${identifier}`
}

function readCachedFollow(viewerId, identifier) {
  if (!identifier || !viewerId || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(buildFollowStorageKey(viewerId, identifier)) === 'true'
  } catch {
    return false
  }
}

function ProfilePage({
  user = 'self',
  tourists = [],
  onBack,
  onLogout,
  onStartCustomRoute,
  onUpdateUser,
  currentUser = null,
  isLoggedIn = false,
  onRequireLogin,
}) {
  const { t, tDynamic, formatDistanceUnit } = usePreferences()
  const isSelf = user === 'self' || Boolean(user?.isSelf)

  const targetIdentifier = isSelf
    ? currentUser?.username || currentUser?.id || currentUser?.name || ''
    : user?.username || user?.id || user?.name || ''

  const viewerId = currentUser?.id || null
  const initialName = isSelf ? currentUser?.name || '' : user?.name || ''
  const initialAvatar = isSelf ? currentUser?.avatar : user?.avatar
  const initialEmail = isSelf ? currentUser?.email || '' : null
  const initialBio = isSelf ? currentUser?.bio || user?.bio || '' : user?.bio || ''

  const [prevProfileKey, setPrevProfileKey] = useState(`${targetIdentifier}|${isSelf}|${viewerId}`)
  const currentProfileKey = `${targetIdentifier}|${isSelf}|${viewerId}`

  const [profileName, setProfileName] = useState(initialName)
  const [profileAvatar, setProfileAvatar] = useState(initialAvatar)
  const [profileEmail, setProfileEmail] = useState(initialEmail)
  const [profileBio, setProfileBio] = useState(initialBio)

  const [isFollowing, setIsFollowing] = useState(() => readCachedFollow(viewerId, targetIdentifier))
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [routesCount, setRoutesCount] = useState(0)
  const [userActivities, setUserActivities] = useState([])
  const [loadedKey, setLoadedKey] = useState('')

  const [isUploading, setIsUploading] = useState(false)
  const [localAvatar, setLocalAvatar] = useState(null)
  const [toast, setToast] = useState(null)
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [settingsState, setSettingsState] = useState({ open: false, section: 'menu' })

  const fileInputRef = useRef(null)
  const toastTimerRef = useRef(null)

  if (currentProfileKey !== prevProfileKey) {
    setPrevProfileKey(currentProfileKey)
    setProfileName(initialName)
    setProfileAvatar(initialAvatar)
    setProfileEmail(initialEmail)
    setProfileBio(initialBio)
    setLocalAvatar(null)
    setIsFollowing(readCachedFollow(viewerId, targetIdentifier))
  }

  const requestKey = `${targetIdentifier}|${currentUser?.email || ''}|${isSelf}`
  const isLoadingActivities = Boolean(targetIdentifier) && loadedKey !== requestKey

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = (message, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, isError })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const confirmDeleteActivity = async () => {
    if (!postToDelete) return
    const id = postToDelete
    const prevActivities = userActivities
    setIsDeleting(true)

    setUserActivities((prev) => prev.filter((a) => a.id !== id))
    setPostToDelete(null)

    try {
      const res = await apiFetch(`/api/activities/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast(t('toast.activityDeleted'))
      } else {
        setUserActivities(prevActivities)
        showToast(t('toast.activityDeleteFailed'), true)
      }
    } catch (err) {
      console.warn('Gagal menghapus aktivitas:', err)
      setUserActivities(prevActivities)
      showToast(t('toast.activityDeleteFailed'), true)
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch profil lengkap, statistik follower, dan aktivitas nyata dari database
  useEffect(() => {
    if (!targetIdentifier) {
      return undefined
    }

    let isMounted = true
    const targetParam = encodeURIComponent(targetIdentifier)

    apiFetch(`/api/users/${targetParam}`)
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat data profil')
        return res.json()
      })
      .then((json) => {
        if (!isMounted || !json?.data) return
        const d = json.data

        if (d.name) setProfileName(d.name)
        if (d.avatar) setProfileAvatar(d.avatar)
        if (typeof d.bio === 'string') setProfileBio(d.bio)
        if (isSelf && d.email) setProfileEmail(d.email)

        if (typeof d.followers_count === 'number') {
          setFollowersCount(d.followers_count)
        }
        const serverFollowState = Boolean(d.is_following)
        setIsFollowing(serverFollowState)
        if (viewerId) {
          try {
            window.localStorage.setItem(
              buildFollowStorageKey(viewerId, targetIdentifier),
              String(serverFollowState),
            )
          } catch {
            // abaikan
          }
        }

        if (typeof d.following_count === 'number') {
          setFollowingCount(d.following_count)
        }

        if (typeof d.routes_count === 'number') {
          setRoutesCount(d.routes_count)
        }

        if (Array.isArray(d.activities)) {
          setUserActivities(d.activities)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat profil dinamis:', err)
        apiFetch('/api/activities')
          .then((r) => r.json())
          .then((actJson) => {
            if (!isMounted || !Array.isArray(actJson?.data)) return
            const matched = actJson.data.filter(
              (p) => p.user_name === initialName || p.userName === initialName,
            )
            setUserActivities(matched)
          })
          .catch(() => {})
      })
      .finally(() => {
        if (isMounted) setLoadedKey(requestKey)
      })

    return () => {
      isMounted = false
    }
  }, [requestKey, targetIdentifier, viewerId, currentUser?.email, isSelf, initialName])

  const handleToggleFollow = async () => {
    if (!isLoggedIn || !getAuthToken()) {
      if (onRequireLogin) {
        onRequireLogin()
      } else {
        showToast(t('toast.loginToFollow'), true)
      }
      return
    }

    const prevState = isFollowing
    const prevCount = followersCount
    const nextState = !prevState
    const nextCount = nextState ? prevCount + 1 : Math.max(0, prevCount - 1)

    setIsFollowing(nextState)
    setFollowersCount(nextCount)
    try {
      window.localStorage.setItem(buildFollowStorageKey(viewerId, targetIdentifier), String(nextState))
    } catch {
      // abaikan
    }

    try {
      const res = await apiFetch(`/api/users/${encodeURIComponent(targetIdentifier)}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const json = await res.json()
      if (typeof json?.followers_count === 'number') {
        setFollowersCount(json.followers_count)
      }
      if (typeof json?.is_following === 'boolean') {
        setIsFollowing(json.is_following)
        try {
          window.localStorage.setItem(
            buildFollowStorageKey(viewerId, targetIdentifier),
            String(json.is_following),
          )
        } catch {
          // abaikan
        }
      }

      if (nextState) {
        pushAppNotification({
          type: 'social',
          title: t('profile.followNotifTitle', { name: profileName }),
          desc: t('profile.followNotifDesc', { name: profileName }),
        })
      }

      showToast(
        nextState
          ? t('toast.followSuccess', { name: profileName })
          : t('toast.unfollowSuccess', { name: profileName }),
      )
    } catch (err) {
      console.warn('Gagal sinkronisasi status follow ke server:', err)
      setIsFollowing(prevState)
      setFollowersCount(prevCount)
      try {
        window.localStorage.setItem(buildFollowStorageKey(viewerId, targetIdentifier), String(prevState))
      } catch {
        // abaikan
      }
      showToast(t('toast.followFailed'), true)
    }
  }

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast(t('toast.invalidImageType'), true)
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast(t('toast.avatarTooLarge'), true)
      return
    }

    const prevAvatar = profileAvatar
    const previewUrl = URL.createObjectURL(file)
    setLocalAvatar(previewUrl)
    setProfileAvatar(previewUrl)
    setIsUploading(true)

    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.82,
      })

      const formData = new FormData()
      formData.append('avatar', compressedFile)

      const res = await apiFetch('/api/auth/update-avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || `Gagal unggah foto (HTTP ${res.status})`)
      }

      const json = await res.json()
      if (json?.data?.avatar) {
        setLocalAvatar(json.data.avatar)
        setProfileAvatar(json.data.avatar)
        if (onUpdateUser) {
          onUpdateUser(json.data)
        }
        pushAppNotification({
          type: 'success',
          title: t('profile.avatarNotifTitle'),
          desc: t('profile.avatarNotifDesc'),
        })
        showToast(t('toast.avatarUpdated'))
      } else {
        throw new Error('Respon server tidak valid')
      }
    } catch (err) {
      console.error('Gagal mengganti foto profil:', err)
      setLocalAvatar(null)
      setProfileAvatar(prevAvatar)
      showToast(err.message || t('toast.avatarFailed'), true)
    } finally {
      URL.revokeObjectURL(previewUrl)
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleProfileSaved = (updatedData) => {
    if (updatedData?.name) setProfileName(updatedData.name)
    if (typeof updatedData?.bio === 'string') setProfileBio(updatedData.bio)
    if (onUpdateUser && updatedData) {
      onUpdateUser({
        ...(currentUser || {}),
        ...updatedData,
      })
    }
  }

  const [userCustomRoutes, setUserCustomRoutes] = useState([])

  useEffect(() => {
    if (!isSelf) return undefined
    let isMounted = true
    const uid = currentUser?.id
    if (!uid || !getAuthToken()) {
      return undefined
    }

    apiFetch('/api/saved-activities')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted || !json?.data) return
        if (Array.isArray(json.data.custom_routes)) {
          const byId = new Map()
          const bySlug = new Map()
          tourists.forEach((item) => {
            if (item?.id) byId.set(Number(item.id), item)
            if (item?.slug) bySlug.set(item.slug, item)
          })
          const mapped = json.data.custom_routes.map((cr) => {
            const stops = Array.isArray(cr.stops) ? cr.stops : []
            const places = stops
              .map((s) => {
                const rawPlace = s.place
                if (!rawPlace) return null
                const matched =
                  (rawPlace.id && byId.get(Number(rawPlace.id))) ||
                  (rawPlace.slug && bySlug.get(rawPlace.slug)) ||
                  null
                return matched
                  ? {
                      ...matched,
                      ...rawPlace,
                      rating: rawPlace.rating ?? matched.rating,
                      category: rawPlace.category || matched.category,
                      image: rawPlace.image || matched.image,
                    }
                  : rawPlace
              })
              .filter(Boolean)
            return {
              id: cr.slug || `cr-${cr.id}`,
              title: cr.title,
              distance: cr.total_distance || '0 KM',
              summary: cr.desc || '',
              stopsCount: stops.length,
              places,
            }
          })
          setUserCustomRoutes(mapped)
          setRoutesCount(mapped.length)
        } else {
          setUserCustomRoutes([])
          setRoutesCount(0)
        }
      })
      .catch(() => {
        if (isMounted) setUserCustomRoutes([])
      })

    return () => {
      isMounted = false
    }
  }, [isSelf, currentUser?.id, tourists])

  const savedMyRoutes = currentUser?.id && getAuthToken() ? userCustomRoutes : []
  const activeAvatar = localAvatar || profileAvatar
  const displayBio = profileBio?.trim() ? tDynamic(profileBio.trim()) : t('profile.defaultBio')

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-[#0E1310] text-[#F5F2EB] will-change-transform transform-gpu"
    >
      {/* Toast Notifikasi Sukses / Gagal */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 top-5 z-[2100] mx-auto max-w-sm animate-tab-enter"
        >
          <div
            className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-[12.5px] font-medium shadow-xl backdrop-blur-xl ${
              toast.isError
                ? 'border-rose-300/30 bg-[#2A1418]/95 text-rose-100'
                : 'border-[#F2ECE1]/12 bg-[#161F19]/95 text-[#F5F2EB]'
            }`}
          >
            <span className="shrink-0">
              {toast.isError ? (
                <AlertTriangleIcon className="h-4 w-4 text-rose-300" />
              ) : (
                <CheckIcon className="h-4 w-4 text-[#8FB596]" />
              )}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-5 pt-6 sm:px-6 lg:px-8">
        {/* 1. Header Atas Sejajar: Judul di Kiri, Ikon Gear Pengaturan di Kanan (Tanpa Pil < Kembali) */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {!isSelf && onBack && (
              <button
                type="button"
                id="btn-back-profile"
                onClick={onBack}
                aria-label={t('profile.backAria')}
                className="-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#F5F2EB]/80 transition-colors hover:bg-white/[0.08] hover:text-[#F5F2EB] active:scale-[0.96]"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}
            <h1 className="truncate text-[24px] font-bold tracking-[-0.025em] text-[#F5F2EB] sm:text-[28px]">
              {isSelf ? t('profile.titleSelf') : t('profile.titleOther')}
            </h1>
          </div>

          {isSelf && (
            <button
              type="button"
              id="btn-open-settings"
              onClick={() => setSettingsState({ open: true, section: 'menu' })}
              aria-label={t('profile.openSettingsAria')}
              title={t('settings.title')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F2ECE1]/10 bg-[#161E19] text-[#F5F2EB]/85 transition-colors duration-150 hover:border-[#F2ECE1]/20 hover:bg-[#1E2822] hover:text-[#F5F2EB] active:scale-[0.96]"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          )}
        </header>

        {/* Layout Responsif: Identitas Profil Seamless (Kiri) + Konten Rute / Aktivitas (Kanan) */}
        <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          {/* 2. Bagian Profil & Statistik (Menyatu dengan Background, Tanpa Kotak Besar) */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <section
              aria-label={t('profile.titleSelf')}
              className="flex flex-col items-center text-center"
            >
              {/* Foto Profil dengan Badge Kamera Kecil */}
              <div className="relative h-24 w-24">
                <SafeImage
                  src={activeAvatar}
                  fallback={DEFAULT_AVATAR_PLACEHOLDER}
                  alt={profileName || t('profile.defaultUser')}
                  className="h-24 w-24 rounded-full object-cover object-top ring-2 ring-[#C5A868]/60 ring-offset-4 ring-offset-[#0E1310]"
                  imgClassName="object-cover object-top"
                />

                {isSelf && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <button
                      type="button"
                      id="btn-upload-avatar"
                      title={t('profile.changeAvatarAria')}
                      aria-label={t('profile.changeAvatarAria')}
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -right-1 -bottom-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#0E1310] bg-[#1F2B23] text-[#F5F2EB] shadow-md transition-colors duration-150 hover:bg-[#2B3B30] active:scale-[0.95] disabled:opacity-60 before:absolute before:-inset-1.5"
                    >
                      {isUploading ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#F5F2EB] border-t-transparent" />
                      ) : (
                        <CameraIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Nama & Email */}
              <h2 className="mt-4 text-[21px] font-bold tracking-[-0.02em] text-[#F5F2EB]">
                {profileName || t('profile.defaultUser')}
              </h2>

              {isSelf && profileEmail && (
                <p className="mt-0.5 text-[13px] font-medium text-[#F5F2EB]/50">
                  {profileEmail}
                </p>
              )}

              {/* Bio Singkat */}
              <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-[#F5F2EB]/68">
                {displayBio}
              </p>

              {/* Tombol Sekunder Edit Profil (Self) atau Follow (Explorer Lain) */}
              {isSelf ? (
                <button
                  type="button"
                  id="btn-edit-profile-hero"
                  onClick={() => setSettingsState({ open: true, section: 'edit-profile' })}
                  className="mt-4 inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#F2ECE1]/14 bg-[#161E19] px-5 py-2 text-[13px] font-semibold text-[#F5F2EB]/90 transition-colors duration-150 hover:border-[#F2ECE1]/24 hover:bg-[#1E2822] hover:text-[#F5F2EB] active:scale-[0.98]"
                >
                  <EditIcon className="h-3.5 w-3.5 text-[#C5A868]" />
                  <span>{t('profile.editProfile')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-follow-user"
                  onClick={handleToggleFollow}
                  className={`mt-4 inline-flex min-h-[44px] w-full max-w-[240px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                    isFollowing
                      ? 'border border-[#F2ECE1]/14 bg-[#161E19] text-[#F5F2EB] hover:bg-[#1E2822]'
                      : 'apple-retro-cta'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-[#C5A868]" />
                      <span>{t('profile.following')}</span>
                    </>
                  ) : (
                    <span>{t('profile.followAction')}</span>
                  )}
                </button>
              )}

              {/* Bar Statistik Ramping dengan Garis Pemisah Vertikal Tipis (Tanpa Kotak Berlapis) */}
              <div
                id="profile-stats-bar"
                className="mt-6 grid w-full max-w-sm grid-cols-3 divide-x divide-[#F2ECE1]/[0.1] border-y border-[#F2ECE1]/[0.08] py-3.5"
              >
                <div className="flex flex-col items-center px-2">
                  <span className="text-[18px] font-bold leading-none tabular-nums tracking-[-0.02em] text-[#F5F2EB]">
                    {routesCount}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-medium text-[#F5F2EB]/50">
                    {t('profile.statRoutes')}
                  </span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-[18px] font-bold leading-none tabular-nums tracking-[-0.02em] text-[#F5F2EB]">
                    {followersCount}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-medium text-[#F5F2EB]/50">
                    {t('profile.statFollowers')}
                  </span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-[18px] font-bold leading-none tabular-nums tracking-[-0.02em] text-[#F5F2EB]">
                    {followingCount}
                  </span>
                  <span className="mt-1.5 text-[11.5px] font-medium text-[#F5F2EB]/50">
                    {t('profile.statFollowing')}
                  </span>
                </div>
              </div>
            </section>
          </aside>

          {/* 3. Kolom Kanan: Rute Saya atau Aktivitas Penjelajah */}
          <div className="lg:col-span-7 xl:col-span-8">
            {isSelf ? (
              <section aria-labelledby="my-routes-heading">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2
                      id="my-routes-heading"
                      className="text-[19px] font-bold tracking-[-0.02em] text-[#F5F2EB]"
                    >
                      {t('profile.myRoutesTitle')}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[#F5F2EB]/55">
                      {t('profile.myRoutesSubtitle')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#18221B] px-3 py-1 font-mono text-[11.5px] font-semibold tabular-nums text-[#C5A868]">
                    {t('profile.savedRoutesCount', { count: savedMyRoutes.length })}
                  </span>
                </div>

                {savedMyRoutes.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {savedMyRoutes.map((route) => {
                      const canStartRoute = Boolean(onStartCustomRoute && route.places.length > 0)
                      const formattedDistance = formatDistanceUnit(route.distance)
                      return (
                        <article
                          key={route.id}
                          data-route-card
                          className="flex h-full min-w-0 flex-col rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#161D19] p-4 transition-colors duration-200 hover:border-[#8FB596]/30 sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#F5F2EB]">
                              {tDynamic(route.title)}
                            </h3>
                            <span
                              data-route-distance
                              className="shrink-0 rounded-lg bg-[#202B24] px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-[#C5A868]"
                            >
                              {formattedDistance}
                            </span>
                          </div>

                          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                            {route.summary ? tDynamic(route.summary) : t('profile.routeDefaultSummary')}
                          </p>

                          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-[#8FB596]">
                            <RouteWaypointsIcon className="h-4 w-4 shrink-0" />
                            <span>{t('profile.stopsCount', { count: route.stopsCount })}</span>
                          </div>

                          <div className="mt-auto pt-4">
                            <button
                              type="button"
                              disabled={!canStartRoute}
                              onClick={() => canStartRoute && onStartCustomRoute(route.places)}
                              className="apple-retro-cta flex h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold active:scale-[0.98] disabled:opacity-50"
                            >
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
                              >
                                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                              </svg>
                              <span>{t('profile.startRoute')}</span>
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#161D19] px-5 py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E2822] text-[#C5A868]">
                      <RouteWaypointsIcon className="h-6 w-6" />
                    </div>
                    <p className="text-[14.5px] font-semibold tracking-tight text-[#F5F2EB]">
                      {t('profile.emptyRoutesTitle')}
                    </p>
                    <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-[#F5F2EB]/55">
                      {t('profile.emptyRoutesDesc')}
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <section aria-labelledby="explorer-activities-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id="explorer-activities-heading"
                    className="text-[19px] font-bold tracking-[-0.02em] text-[#F5F2EB]"
                  >
                    {t('profile.recentActivities', { name: profileName })}
                  </h2>
                  {userActivities.length > 0 && (
                    <span className="shrink-0 text-[12px] font-medium text-[#F5F2EB]/55">
                      {t('profile.activitiesCount', { count: userActivities.length })}
                    </span>
                  )}
                </div>

                {isLoadingActivities ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-[#F2ECE1]/[0.06] bg-[#161D19] p-4"
                      >
                        <div className="aspect-[16/10] w-full rounded-xl bg-white/[0.04]" />
                        <div className="mt-3 h-4 w-3/4 rounded bg-white/[0.08]" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.05]" />
                      </div>
                    ))}
                  </div>
                ) : userActivities.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {userActivities.map((act) => (
                      <article
                        key={act.id}
                        className="flex flex-col rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#161D19] p-4 transition-colors duration-200 hover:border-[#8FB596]/30"
                      >
                        {act.image && (
                          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#111713]">
                            <SafeImage
                              src={act.image}
                              fallback={DEFAULT_IMAGE_PLACEHOLDER}
                              alt={act.title || t('activities.title')}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                        )}
                        <div className="mt-3 flex flex-1 flex-col">
                          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-[#F5F2EB]/50">
                            <span className="font-mono tabular-nums tracking-wide">
                              {act.date ? tDynamic(act.date) : t('profile.justNow')}
                            </span>
                            <div className="flex items-center gap-2">
                              {act.location && (
                                <span className="inline-flex max-w-[160px] items-center gap-1 truncate font-medium text-[#C5A868]">
                                  <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{act.location}</span>
                                </span>
                              )}
                              {isSelf && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPostToDelete(act.id)
                                  }}
                                  title={t('profile.deleteActivityAria')}
                                  aria-label={t('profile.deleteActivityAria')}
                                  className="rounded-lg p-1 text-white/60 transition-colors hover:text-rose-300"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
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
                          </div>
                          <h3 className="text-[14px] font-semibold leading-snug tracking-tight text-[#F5F2EB]">
                            {act.title}
                          </h3>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-[#F2ECE1]/[0.07] bg-[#161D19] px-5 py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E2822] text-[#C5A868]">
                      <CompassIcon className="h-6 w-6" duotone />
                    </div>
                    <p className="text-[14.5px] font-semibold tracking-tight text-[#F5F2EB]">
                      {t('profile.emptyActivitiesTitle')}
                    </p>
                    <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-[#F5F2EB]/55">
                      {t('profile.emptyActivitiesDesc', { name: profileName })}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* 4. Drawer / Sheet Pengaturan Lengkap (Bahasa, Akun, Navigasi, Zona Bahaya) */}
      {isSelf && (
        <ProfileSettingsSheet
          isOpen={settingsState.open}
          initialSection={settingsState.section}
          onClose={() => setSettingsState((prev) => ({ ...prev, open: false }))}
          profileName={profileName}
          profileBio={profileBio}
          onProfileSaved={handleProfileSaved}
          onRequestLogout={onLogout ? () => setShowLogoutModal(true) : null}
          onNotify={(msg, isErr) => showToast(msg, isErr)}
        />
      )}

      {/* Modal Konfirmasi Hapus Aktivitas */}
      <GlassModal
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        overlayId="modal-hapus-aktivitas-overlay"
        modalId="modal-hapus-aktivitas"
        closeButtonId="btn-close-hapus-aktivitas"
        titleId="modal-hapus-aktivitas-title"
        closeAriaLabel={t('common.close')}
        maxWidthClass="max-w-xs"
      >
        <div className="text-center">
          <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/25 bg-[#3B1D24]/70 text-rose-200">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 id="modal-hapus-aktivitas-title" className="text-[17px] font-bold text-[#F5F2EB]">
            {t('profile.deleteModalTitle')}
          </h3>
          <p className="mt-1.5 text-[12.5px] text-[#F5F2EB]/65">
            {t('profile.deleteModalDesc')}
          </p>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setPostToDelete(null)}
              className="min-h-[44px] flex-1 rounded-xl border border-white/[0.14] bg-white/[0.06] py-2.5 text-[12.5px] font-semibold text-[#F5F2EB] transition-colors hover:bg-white/[0.12]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={confirmDeleteActivity}
              disabled={isDeleting}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-300/25 bg-[#3B1D24] py-2.5 text-[12.5px] font-bold text-rose-100 transition-colors hover:bg-[#4D242E] disabled:opacity-50"
            >
              {isDeleting ? t('profile.deleting') : t('profile.deleteConfirm')}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Modal Konfirmasi Keluar dari Akun (Dipicu dari Settings -> Zona Bahaya) */}
      <GlassModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        overlayId="modal-konfirmasi-logout-overlay"
        modalId="modal-konfirmasi-logout"
        closeButtonId="btn-close-logout-modal"
        titleId="modal-logout-title"
        closeAriaLabel={t('common.close')}
        maxWidthClass="max-w-sm"
      >
        <div className="text-center">
          <div className="-mt-3 mb-3.5 flex justify-center">
            <SabahMascot variant="goodbye" size="md" />
          </div>

          <h3 id="modal-logout-title" className="text-[19px] font-semibold tracking-tight text-[#F5F2EB]">
            {t('profile.logoutModalTitle')}
          </h3>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-[#F5F2EB]/65">
            {t('profile.logoutModalDesc')}
          </p>

          <div className="mt-6 flex items-center gap-2.5">
            <button
              type="button"
              id="btn-cancel-logout"
              onClick={() => setShowLogoutModal(false)}
              className="min-h-[44px] flex-1 rounded-xl border border-[rgba(244,239,230,0.18)] bg-white/[0.06] py-2.5 text-[13px] font-semibold text-[#F5F2EB] transition-colors duration-150 hover:bg-white/[0.12] active:scale-[0.98]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              id="btn-confirm-logout"
              onClick={() => {
                setShowLogoutModal(false)
                onLogout?.()
              }}
              className="min-h-[44px] flex-1 rounded-xl border border-rose-300/30 bg-[#3B1D24] py-2.5 text-[13px] font-bold text-rose-100 transition-colors duration-150 hover:bg-[#4F252F] hover:text-white active:scale-[0.98]"
            >
              {t('profile.logoutConfirm')}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}

export default memo(ProfilePage)
