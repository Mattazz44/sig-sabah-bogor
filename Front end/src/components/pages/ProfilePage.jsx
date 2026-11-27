import { memo, useEffect, useRef, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import SabahMascot from '../ui/SabahMascot'
import GlassModal from '../ui/GlassModal'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'
import { apiFetch, getAuthToken } from '../../utils/api'
import { compressImage } from '../../utils/imageCompressor'
import { pushAppNotification } from '../../utils/notifications'
import {
  AlertTriangleIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  CompassIcon,
  MapPinIcon,
  RouteWaypointsIcon,
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
  const isSelf = user === 'self' || Boolean(user?.isSelf)

  const targetIdentifier = isSelf
    ? currentUser?.username || currentUser?.id || currentUser?.name || ''
    : user?.username || user?.id || user?.name || ''

  const viewerId = currentUser?.id || null
  const initialName = isSelf ? (currentUser?.name || '') : (user?.name || '')
  const initialAvatar = isSelf ? currentUser?.avatar : user?.avatar
  const initialEmail = isSelf ? (currentUser?.email || '') : null
  const initialBio = user?.bio || ''

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
        showToast('Aktivitas berhasil dihapus.')
      } else {
        setUserActivities(prevActivities)
        showToast('Gagal menghapus aktivitas.', true)
      }
    } catch (err) {
      console.warn('Gagal menghapus aktivitas:', err)
      setUserActivities(prevActivities)
      showToast('Gagal menghapus aktivitas.', true)
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
        if (d.bio) setProfileBio(d.bio)
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
        showToast('Silakan masuk terlebih dahulu untuk mengikuti penjelajah.', true)
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
          title: `Mulai mengikuti ${profileName}`,
          desc: `Anda kini terhubung dengan ${profileName} di komunitas penjelajah Bogor.`,
        })
      }

      showToast(
        nextState
          ? `Berhasil mengikuti ${profileName}!`
          : `Batal mengikuti ${profileName}.`,
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
      showToast('Gagal memperbarui status follow.', true)
    }
  }

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG, WEBP).', true)
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('Ukuran foto profil maksimal 15 MB.', true)
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
          title: 'Foto profil berhasil diperbarui',
          desc: 'Perubahan foto profil akun Anda telah tersimpan.',
        })
        showToast('Foto profil berhasil diperbarui!')
      } else {
        throw new Error('Respon server tidak valid')
      }
    } catch (err) {
      console.error('Gagal mengganti foto profil:', err)
      setLocalAvatar(null)
      setProfileAvatar(prevAvatar)
      showToast(err.message || 'Gagal mengunggah foto profil. Silakan coba lagi.', true)
    } finally {
      URL.revokeObjectURL(previewUrl)
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const [userCustomRoutes, setUserCustomRoutes] = useState([])

  useEffect(() => {
    if (!isSelf) return
    let isMounted = true
    const uid = currentUser?.id
    if (!uid || !getAuthToken()) {
      setUserCustomRoutes([])
      return
    }

    apiFetch('/api/saved-activities')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted || !json?.data) return
        if (Array.isArray(json.data.custom_routes)) {
          const byId = new Map()
          const bySlug = new Map()
          tourists.forEach((t) => {
            if (t?.id) byId.set(Number(t.id), t)
            if (t?.slug) bySlug.set(t.slug, t)
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
              summary: cr.desc || 'Rute kustom buatan Anda',
              stopsLabel: `${stops.length} destinasi wisata`,
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

  const savedMyRoutes = userCustomRoutes

  const activeAvatar = localAvatar || profileAvatar

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="apple-canopy-bg animate-tab-enter relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu text-[#EBF0EB]"
    >
      {/* Toast Notifikasi Sukses / Gagal */}
      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 top-5 z-[2100] mx-auto max-w-sm animate-tab-enter"
        >
          <div
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[12.5px] font-medium shadow-xl border ${
              toast.isError
                ? 'border-rose-300/35 bg-[#2a1216]/95 text-rose-100'
                : 'apple-glass-card text-[#EBF0EB]'
            }`}
          >
            <span className="shrink-0 text-[#E2D7B5]">
              {toast.isError ? (
                <AlertTriangleIcon className="h-4 w-4 text-rose-300" />
              ) : (
                <CheckIcon className="h-4 w-4 text-[#E2D7B5]" />
              )}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top Bar Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              id="btn-back-profile"
              onClick={onBack}
              aria-label="Kembali ke halaman sebelumnya"
              className="apple-glass-pill inline-flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-4 w-4 shrink-0" />
              <span>Kembali</span>
            </button>
            <h1 className="truncate text-[24px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[28px]">
              {isSelf ? 'Profil Saya' : 'Profil Penjelajah'}
            </h1>
          </div>
        </header>

        {/* Responsive Multi-Column Layout: Sidebar Profil Kiri + Konten Utama Kanan */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Kolom Kiri: Kartu Identitas Pengguna Kaca Halus */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <section
              aria-label="Informasi profil pengguna"
              className="apple-glass-card flex flex-col items-center rounded-3xl p-6 text-center"
            >
              {/* Foto Profil dengan Tombol Ganti Foto Dark Glass */}
              <div className="relative h-24 w-24">
                <SafeImage
                  src={activeAvatar}
                  fallback={DEFAULT_AVATAR_PLACEHOLDER}
                  alt={profileName || 'Foto profil'}
                  className="h-24 w-24 rounded-full border-2 border-[#DFAA63]/60 object-cover object-top shadow-sm"
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
                      title="Ganti Foto Profil"
                      aria-label="Ganti Foto Profil"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -right-1 -bottom-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1C241C]/90 text-[#EBF0EB] shadow-md backdrop-blur-md transition-all duration-150 hover:bg-[#263226]/95 active:scale-[0.96] disabled:opacity-60 before:absolute before:-inset-1.5"
                    >
                      {isUploading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#EBF0EB] border-t-transparent" />
                      ) : (
                        <CameraIcon className="h-4 w-4" />
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Nama & Email */}
              <h2 className="mt-4 text-[20px] font-semibold tracking-tight text-[#EBF0EB]">
                {profileName || 'Pengguna'}
              </h2>

              {isSelf && profileEmail && (
                <p className="mt-0.5 text-[12.5px] font-medium text-white/60">
                  {profileEmail}
                </p>
              )}

              {profileBio && (
                <p className="mt-2.5 max-w-xs text-[12.5px] leading-relaxed text-white/65">
                  {profileBio}
                </p>
              )}

              {/* Badge Status */}
              <div className="mt-3">
                <span className="apple-retro-bevel inline-block rounded-full border border-[rgba(244,239,230,0.18)] bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-[#DFAA63]">
                  {isSelf ? 'Penjelajah Aktif' : 'Petualang Alam Bogor'}
                </span>
              </div>

              {/* Tombol Follow (Jika Melihat Profil Penjelajah Lain) */}
              {!isSelf && (
                <button
                  type="button"
                  id="btn-follow-user"
                  onClick={handleToggleFollow}
                  className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                    isFollowing
                      ? 'apple-glass-pill text-[#F5F2EB] hover:bg-white/[0.14]'
                      : 'apple-retro-cta'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-[#DFAA63]" />
                      <span>Mengikuti</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      <span>Ikuti Perjalanan</span>
                    </>
                  )}
                </button>
              )}

              {/* Statistik Profil */}
              <div className="apple-retro-bevel mt-5 grid w-full grid-cols-3 divide-x divide-[rgba(244,239,230,0.14)] rounded-2xl border border-[rgba(244,239,230,0.16)] bg-black/20 py-3">
                <div className="flex flex-col items-center px-2">
                  <span className="font-mono text-[16px] font-semibold tabular-nums tracking-wide text-[#F5F2EB]">
                    {routesCount}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#F5F2EB]/60">Rute Custom</span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="font-mono text-[16px] font-semibold tabular-nums tracking-wide text-[#F5F2EB]">
                    {followersCount}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#F5F2EB]/60">Pengikut</span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="font-mono text-[16px] font-semibold tabular-nums tracking-wide text-[#F5F2EB]">
                    {followingCount}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#F5F2EB]/60">Mengikuti</span>
                </div>
              </div>

              {/* Tombol Logout Tunggal di Dalam Kartu Profil */}
              {isSelf && onLogout && (
                <div className="mt-5 w-full border-t border-white/[0.1] pt-4">
                  <button
                    type="button"
                    id="btn-logout-profile"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-[#3B1D24]/60 px-4 py-2.5 text-[13px] font-semibold text-rose-200 transition-colors duration-150 hover:bg-[#4D242E] hover:text-white active:scale-[0.98]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              )}
            </section>
          </aside>

          {/* Kolom Kanan: Rute Saya atau Aktivitas Penjelajah */}
          <div className="lg:col-span-7 xl:col-span-8">
            {isSelf ? (
              <section aria-labelledby="my-routes-heading">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2
                      id="my-routes-heading"
                      className="text-[18px] font-semibold tracking-tight text-[#F5F2EB]"
                    >
                      Rute Saya
                    </h2>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                      Koleksi rute siap navigasi dari akun Anda
                    </p>
                  </div>
                  <span className="apple-glass-pill shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-semibold tabular-nums tracking-wide text-[#DFAA63]">
                    {savedMyRoutes.length} Rute Tersimpan
                  </span>
                </div>

                {/* Grid Kartu Rute Saya dengan Struktur & Tinggi Seragam */}
                {savedMyRoutes.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {savedMyRoutes.map((route) => {
                      const canStartRoute = Boolean(onStartCustomRoute && route.places.length > 0)
                      return (
                        <article
                          key={route.id}
                          className="apple-glass-card apple-glass-card-hover flex h-full min-w-0 flex-col rounded-3xl p-4 sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <h3 className="text-[15px] font-semibold tracking-tight leading-snug text-[#F5F2EB]">
                              {route.title}
                            </h3>
                            <span className="shrink-0 rounded-full border border-[rgba(244,239,230,0.16)] bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums tracking-wide text-[#DFAA63]">
                              {route.distance}
                            </span>
                          </div>

                          <p className="mt-2 text-[12.5px] leading-relaxed text-[#F5F2EB]/65">
                            {route.summary}
                          </p>

                          <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium text-[#DFAA63]">
                            <RouteWaypointsIcon className="h-4 w-4 shrink-0" />
                            <span>{route.stopsLabel}</span>
                          </div>

                          <div className="mt-auto pt-4">
                            <button
                              type="button"
                              disabled={!canStartRoute}
                              onClick={() => canStartRoute && onStartCustomRoute(route.places)}
                              className="apple-retro-cta flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold active:scale-[0.98] disabled:opacity-50"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                              </svg>
                              <span>Mulai Navigasi Rute</span>
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="apple-glass-card mt-4 flex flex-col items-center justify-center rounded-3xl px-4 py-10 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.14] bg-white/[0.06] text-[#E2D7B5]">
                      <RouteWaypointsIcon className="h-6 w-6" />
                    </div>
                    <p className="text-[14px] font-semibold tracking-tight text-[#EBF0EB]">
                      Belum Ada Rute Tersimpan
                    </p>
                    <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-white/60">
                      Anda belum memiliki rute kustom. Rancang rute perjalanan Anda di tab Rute Tersimpan.
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <section aria-labelledby="explorer-activities-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id="explorer-activities-heading"
                    className="text-[18px] font-bold tracking-tight text-[#EBF0EB]"
                  >
                    Aktivitas Terkini {profileName}
                  </h2>
                  {userActivities.length > 0 && (
                    <span className="shrink-0 text-[12px] text-[#C8D3C8]">
                      {userActivities.length} Aktivitas
                    </span>
                  )}
                </div>

                {isLoadingActivities ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="apple-glass-card rounded-2xl p-4"
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
                        className="apple-glass-card apple-glass-card-hover flex flex-col rounded-3xl p-4"
                      >
                        {act.image && (
                          <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#182117]">
                            <SafeImage
                              src={act.image}
                              fallback={DEFAULT_IMAGE_PLACEHOLDER}
                              alt={act.title || 'Aktivitas'}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                        )}
                        <div className="mt-3 flex flex-1 flex-col">
                          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-[#F5F2EB]/55">
                            <span className="font-mono tabular-nums tracking-wide">{act.date || 'Baru saja'}</span>
                            <div className="flex items-center gap-2">
                              {act.location && (
                                <span className="inline-flex max-w-[160px] items-center gap-1 truncate font-medium text-[#DFAA63]">
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
                                  title="Hapus aktivitas ini"
                                  aria-label="Hapus aktivitas ini"
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
                          <h3 className="text-[14px] font-semibold tracking-tight leading-snug text-[#EBF0EB]">
                            {act.title}
                          </h3>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="apple-glass-card mt-4 flex flex-col items-center justify-center rounded-3xl px-4 py-10 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.14] bg-white/[0.06] text-[#E2D7B5]">
                      <CompassIcon className="h-6 w-6" duotone />
                    </div>
                    <p className="text-[14px] font-semibold tracking-tight text-[#EBF0EB]">
                      Belum Ada Aktivitas Terkini
                    </p>
                    <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-white/60">
                      {profileName} belum membagikan momen perjalanan terbarunya.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Aktivitas */}
      <GlassModal
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        overlayId="modal-hapus-aktivitas-overlay"
        modalId="modal-hapus-aktivitas"
        closeButtonId="btn-close-hapus-aktivitas"
        titleId="modal-hapus-aktivitas-title"
        closeAriaLabel="Tutup konfirmasi hapus aktivitas"
        maxWidthClass="max-w-xs"
      >
        <div className="text-center">
          <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/25 bg-[#3B1D24]/70 text-rose-200">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 id="modal-hapus-aktivitas-title" className="text-[17px] font-bold text-[#EBF0EB]">
            Hapus Aktivitas?
          </h3>
          <p className="mt-1.5 text-[12.5px] text-[#C8D3C8]">
            Postingan aktivitas ini akan dihapus secara permanen.
          </p>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setPostToDelete(null)}
              className="min-h-[44px] flex-1 rounded-xl border border-white/[0.14] bg-white/[0.06] py-2.5 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors hover:bg-white/[0.12]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDeleteActivity}
              disabled={isDeleting}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-300/25 bg-[#3B1D24] py-2.5 text-[12.5px] font-bold text-rose-100 transition-colors hover:bg-[#4D242E] disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Modal Konfirmasi Keluar dari Akun (Liquid Glass + Maskot Goodbye) */}
      <GlassModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        overlayId="modal-konfirmasi-logout-overlay"
        modalId="modal-konfirmasi-logout"
        closeButtonId="btn-close-logout-modal"
        titleId="modal-logout-title"
        closeAriaLabel="Tutup konfirmasi keluar"
        maxWidthClass="max-w-sm"
      >
        <div className="text-center">
          <div className="-mt-3 mb-3.5 flex justify-center">
            <SabahMascot
              variant="goodbye"
              size="md"
              className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
            />
          </div>

          <h3 id="modal-logout-title" className="text-[19px] font-semibold tracking-tight text-[#F5F2EB]">
            Kamu yakin ingin logout?
          </h3>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-[#F5F2EB]/65">
            Rute tersimpan dan catatan perjalananmu akan tetap aman tersimpan di akun ini.
          </p>

          <div className="mt-6 flex items-center gap-2.5">
            <button
              type="button"
              id="btn-cancel-logout"
              onClick={() => setShowLogoutModal(false)}
              className="min-h-[44px] flex-1 rounded-xl border border-[rgba(244,239,230,0.18)] bg-white/[0.06] py-2.5 text-[13px] font-semibold text-[#F5F2EB] transition-colors duration-150 hover:bg-white/[0.12] active:scale-[0.98]"
            >
              Batal
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
              Ya, Keluar
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}

export default memo(ProfilePage)
