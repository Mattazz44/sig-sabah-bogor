import { memo, useEffect, useMemo, useRef, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import GlassModal from '../ui/GlassModal'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'
import { apiFetch } from '../../utils/api'
import { compressImage } from '../../utils/imageCompressor'
import {
  AlertTriangleIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  CompassIcon,
  MapPinIcon,
  RouteWaypointsIcon,
} from '../ui/VectorIcons'

function readCachedFollow(identifier) {
  if (!identifier || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(`follow_${identifier}`) === 'true'
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
    ? currentUser?.username || currentUser?.name || ''
    : user?.username || user?.name || ''

  const initialName = isSelf ? (currentUser?.name || '') : (user?.name || '')
  const initialAvatar = isSelf ? currentUser?.avatar : user?.avatar
  const initialEmail = isSelf ? (currentUser?.email || '') : null
  const initialBio = user?.bio || ''

  const [prevProfileKey, setPrevProfileKey] = useState(`${targetIdentifier}|${isSelf}`)
  const currentProfileKey = `${targetIdentifier}|${isSelf}`

  const [profileName, setProfileName] = useState(initialName)
  const [profileAvatar, setProfileAvatar] = useState(initialAvatar)
  const [profileEmail, setProfileEmail] = useState(initialEmail)
  const [profileBio, setProfileBio] = useState(initialBio)

  const [isFollowing, setIsFollowing] = useState(() => readCachedFollow(targetIdentifier))
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

  const fileInputRef = useRef(null)
  const toastTimerRef = useRef(null)

  if (currentProfileKey !== prevProfileKey) {
    setPrevProfileKey(currentProfileKey)
    setProfileName(initialName)
    setProfileAvatar(initialAvatar)
    setProfileEmail(initialEmail)
    setProfileBio(initialBio)
    setLocalAvatar(null)
    setIsFollowing(readCachedFollow(targetIdentifier))
  }

  const requestKey = `${targetIdentifier}|${currentUser?.email || ''}|${isSelf}`
  const isLoadingActivities = loadedKey !== requestKey

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
    setIsDeleting(true)

    setUserActivities((prev) => prev.filter((a) => a.id !== id))
    setPostToDelete(null)

    try {
      const res = await apiFetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id,
          user_name: currentUser?.name,
        }),
      })
      if (res.ok) {
        showToast('Aktivitas berhasil dihapus.')
      } else {
        showToast('Gagal menghapus aktivitas.', true)
      }
    } catch (err) {
      console.warn('Gagal menghapus aktivitas:', err)
      showToast('Gagal menghapus aktivitas.', true)
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch profil lengkap, statistik follower, dan aktivitas nyata dari database
  useEffect(() => {
    let isMounted = true
    let cachedFollowRaw = null
    try {
      cachedFollowRaw = window.localStorage.getItem(`follow_${targetIdentifier}`)
    } catch {
      cachedFollowRaw = null
    }

    const currentEmailParam = encodeURIComponent(currentUser?.email || '')
    const targetParam = encodeURIComponent(targetIdentifier)

    apiFetch(`/api/users/${targetParam}?current_user_email=${currentEmailParam}`)
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
          let count = d.followers_count
          if (cachedFollowRaw !== null) {
            const isCachedFollow = cachedFollowRaw === 'true'
            setIsFollowing(isCachedFollow)
            if (isCachedFollow && !d.is_following) count += 1
            if (!isCachedFollow && d.is_following) count = Math.max(0, count - 1)
          } else {
            setIsFollowing(Boolean(d.is_following))
          }
          setFollowersCount(count)
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
  }, [requestKey, targetIdentifier, currentUser?.email, isSelf, initialName])

  const handleToggleFollow = async () => {
    if (!isLoggedIn) {
      if (onRequireLogin) {
        onRequireLogin()
      } else {
        showToast('Silakan masuk terlebih dahulu untuk mengikuti penjelajah.', true)
      }
      return
    }

    const nextState = !isFollowing
    const nextCount = nextState ? followersCount + 1 : Math.max(0, followersCount - 1)

    setIsFollowing(nextState)
    setFollowersCount(nextCount)
    try {
      window.localStorage.setItem(`follow_${targetIdentifier}`, String(nextState))
    } catch {
      // abaikan
    }

    showToast(
      nextState
        ? `Berhasil mengikuti ${profileName}!`
        : `Batal mengikuti ${profileName}.`,
    )

    try {
      const res = await apiFetch(`/api/users/${encodeURIComponent(targetIdentifier)}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_user_id: currentUser?.id,
          current_user_email: currentUser?.email,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        if (typeof json?.followers_count === 'number') {
          setFollowersCount(json.followers_count)
        }
        if (typeof json?.is_following === 'boolean') {
          setIsFollowing(json.is_following)
          try {
            window.localStorage.setItem(`follow_${targetIdentifier}`, String(json.is_following))
          } catch {
            // abaikan
          }
        }
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi status follow ke server:', err)
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
      if (user?.id) {
        formData.append('user_id', user.id)
      }
      if (user?.email) {
        formData.append('email', user.email)
      }

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
        showToast('Foto profil berhasil diperbarui!')
      } else {
        throw new Error('Respon server tidak valid')
      }
    } catch (err) {
      console.error('Gagal mengganti foto profil:', err)
      setLocalAvatar(null)
      showToast(err.message || 'Gagal mengunggah foto profil. Silakan coba lagi.', true)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const savedMyRoutes = useMemo(() => {
    const museumZoologi = tourists.find((t) => t.slug === 'museum-zoologi-bogor')
    const museumPeta = tourists.find((t) => t.slug === 'museum-peta')
    const suryaKencana =
      tourists.find((t) => t.slug === 'lawang-surya-kencana') ||
      tourists.find((t) => t.name?.toLowerCase().includes('surya kencana')) ||
      tourists[0]

    return [
      {
        id: 'profile-route-edukasi',
        title: 'Museum of Zoology → Museum PETA',
        distance: '5.4 KM',
        summary: '2 titik singgah edukasi sejarah Bogor',
        stopsLabel: '2 destinasi wisata',
        places: [museumZoologi, museumPeta].filter(Boolean),
      },
      {
        id: 'profile-route-kuliner',
        title: 'Kuliner Surya Kencana',
        distance: '3.0 KM',
        summary: 'Pusat kuliner legendaris Bogor',
        stopsLabel: '1 destinasi wisata',
        places: [suryaKencana].filter(Boolean),
      },
    ]
  }, [tourists])

  const activeAvatar = localAvatar || profileAvatar

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu bg-forest-900 text-[#EBF0EB]"
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
                ? 'border-rose-300/35 bg-[#2a1216] text-rose-100'
                : 'border-white/[0.18] bg-[#1B261B] text-[#EBF0EB]'
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
              aria-label="Kembali"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="truncate text-[22px] font-bold tracking-tight text-[#EBF0EB] sm:text-[24px]">
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
              className="flex flex-col items-center rounded-3xl border border-white/[0.18] bg-[#233020]/70 p-6 text-center shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18),0_16px_36px_-12px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            >
              {/* Foto Profil dengan Tombol Ganti Foto Monokrom */}
              <div className="relative h-24 w-24">
                <SafeImage
                  src={activeAvatar}
                  fallback={DEFAULT_AVATAR_PLACEHOLDER}
                  alt={profileName || 'Foto profil'}
                  className="h-24 w-24 rounded-full border-2 border-[#E2D7B5]/55 object-cover shadow-sm"
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
                      className="absolute -right-1 -bottom-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.24] bg-[#1B261B] text-[#EBF0EB] shadow-md transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.96] disabled:opacity-60 before:absolute before:-inset-1.5"
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
              <h2 className="mt-4 text-[20px] font-bold tracking-tight text-[#EBF0EB]">
                {profileName || 'Pengguna'}
              </h2>

              {isSelf && profileEmail && (
                <p className="mt-0.5 text-[12.5px] font-medium text-[#C8D3C8]">
                  {profileEmail}
                </p>
              )}

              {profileBio && (
                <p className="mt-2.5 max-w-xs text-[12.5px] leading-relaxed text-[#C8D3C8]">
                  {profileBio}
                </p>
              )}

              {/* Badge Status */}
              <div className="mt-3">
                <span className="inline-block rounded-lg border border-white/[0.14] bg-[#1B261B] px-3 py-1 text-[11px] font-semibold text-[#E2D7B5]">
                  {isSelf ? 'Penjelajah Aktif' : 'Petualang Alam Bogor'}
                </span>
              </div>

              {/* Tombol Follow (Jika Melihat Profil Penjelajah Lain) */}
              {!isSelf && (
                <button
                  type="button"
                  id="btn-follow-user"
                  onClick={handleToggleFollow}
                  className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-colors duration-150 active:scale-[0.98] ${
                    isFollowing
                      ? 'border border-white/[0.2] bg-white/[0.1] text-[#EBF0EB] hover:bg-white/[0.16]'
                      : 'bg-[#EBF0EB] text-[#161E16] shadow-sm hover:bg-[#DCE4DC]'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-[#E2D7B5]" />
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
              <div className="mt-5 grid w-full grid-cols-3 divide-x divide-white/[0.12] rounded-2xl border border-white/[0.14] bg-[#1B261B]/80 py-3">
                <div className="flex flex-col items-center px-2">
                  <span className="text-[16px] font-bold tabular-nums text-[#EBF0EB]">
                    {routesCount}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#C8D3C8]">Rute Custom</span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-[16px] font-bold tabular-nums text-[#EBF0EB]">
                    {followersCount}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#C8D3C8]">Pengikut</span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-[16px] font-bold tabular-nums text-[#EBF0EB]">
                    {followingCount}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#C8D3C8]">Mengikuti</span>
                </div>
              </div>

              {/* Tombol Logout Tunggal di Dalam Kartu Profil */}
              {isSelf && onLogout && (
                <div className="mt-5 w-full border-t border-white/[0.1] pt-4">
                  <button
                    type="button"
                    id="btn-logout-profile"
                    onClick={onLogout}
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
                      className="text-[18px] font-bold tracking-tight text-[#EBF0EB]"
                    >
                      Rute Saya
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-[#C8D3C8]">
                      Koleksi rute siap navigasi dari akun Anda
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/[0.14] bg-[#233020] px-2.5 py-1 text-[11px] font-semibold text-[#C8D3C8]">
                    {savedMyRoutes.length} Rute Tersimpan
                  </span>
                </div>

                {/* Grid Kartu Rute Saya dengan Struktur & Tinggi Seragam */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {savedMyRoutes.map((route) => {
                    const canStartRoute = Boolean(onStartCustomRoute && route.places.length > 0)
                    return (
                      <article
                        key={route.id}
                        className="flex h-full min-w-0 flex-col rounded-2xl border border-white/[0.14] bg-[#233020] p-4 shadow-sm transition-colors duration-150 hover:border-white/[0.26] sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <h3 className="text-[15px] font-bold leading-snug text-[#EBF0EB]">
                            {route.title}
                          </h3>
                          <span className="shrink-0 rounded-lg border border-white/[0.14] bg-[#1B261B] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#EBF0EB]">
                            {route.distance}
                          </span>
                        </div>

                        <p className="mt-2 text-[12.5px] leading-relaxed text-[#C8D3C8]">
                          {route.summary}
                        </p>

                        <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium text-[#E2D7B5]">
                          <RouteWaypointsIcon className="h-4 w-4 shrink-0" />
                          <span>{route.stopsLabel}</span>
                        </div>

                        <div className="mt-auto pt-4">
                          <button
                            type="button"
                            disabled={!canStartRoute}
                            onClick={() => canStartRoute && onStartCustomRoute(route.places)}
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#EBF0EB] px-4 py-2.5 text-[12.5px] font-bold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98] disabled:opacity-50"
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
                        className="rounded-2xl border border-white/[0.12] bg-[#233020] p-4"
                      >
                        <div className="aspect-[16/10] w-full rounded-xl bg-[#1B261B]" />
                        <div className="mt-3 h-4 w-3/4 rounded bg-[#2E3E2A]" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-[#2A3826]" />
                      </div>
                    ))}
                  </div>
                ) : userActivities.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {userActivities.map((act) => (
                      <article
                        key={act.id}
                        className="flex flex-col rounded-2xl border border-white/[0.14] bg-[#233020] p-4 shadow-sm"
                      >
                        {act.image && (
                          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#1B261B]">
                            <SafeImage
                              src={act.image}
                              fallback={DEFAULT_IMAGE_PLACEHOLDER}
                              alt={act.title || 'Aktivitas'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="mt-3 flex flex-1 flex-col">
                          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-[#C8D3C8]">
                            <span>{act.date || 'Baru saja'}</span>
                            <div className="flex items-center gap-2">
                              {act.location && (
                                <span className="inline-flex max-w-[160px] items-center gap-1 truncate font-medium text-[#E2D7B5]">
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
                                  className="rounded-lg p-1 text-[#C8D3C8] transition-colors hover:text-rose-300"
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
                          <h3 className="text-[14px] font-bold leading-snug text-[#EBF0EB]">
                            {act.title}
                          </h3>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-white/[0.14] bg-[#233020] px-4 py-10 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.14] bg-[#1B261B] text-[#E2D7B5]">
                      <CompassIcon className="h-6 w-6" duotone />
                    </div>
                    <p className="text-[14px] font-bold text-[#EBF0EB]">
                      Belum Ada Aktivitas Terkini
                    </p>
                    <p className="mt-1 max-w-xs text-[12.5px] text-[#C8D3C8]">
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
    </div>
  )
}

export default memo(ProfilePage)
