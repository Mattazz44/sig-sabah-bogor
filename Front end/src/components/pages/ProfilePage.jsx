import { memo, useEffect, useRef, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'
import { apiFetch } from '../../utils/api'
import { compressImage } from '../../utils/imageCompressor'

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

  // Target identifier akun yang sedang dilihat
  const targetIdentifier = isSelf
    ? currentUser?.username || currentUser?.name || ''
    : user?.username || user?.name || ''

  // Data profil dinamis dari server
  const [profileName, setProfileName] = useState(() => (isSelf ? (currentUser?.name || '') : user?.name || ''))
  const [profileAvatar, setProfileAvatar] = useState(() => (isSelf ? currentUser?.avatar : user?.avatar))
  const [profileEmail, setProfileEmail] = useState(() => (isSelf ? (currentUser?.email || '') : null))
  const [profileBio, setProfileBio] = useState(() => user?.bio || '')

  // Follow & Stats dinamis (murni dari database)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [routesCount, setRoutesCount] = useState(0)
  const [userActivities, setUserActivities] = useState([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [localAvatar, setLocalAvatar] = useState(null)
  const [toast, setToast] = useState(null)
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef(null)

  const showToast = (message, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  // Fungsi konfirmasi hapus aktivitas di profil sendiri
  const confirmDeleteActivity = async () => {
    if (!postToDelete) return
    const id = postToDelete
    setIsDeleting(true)

    // Optimistic removal
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

  // 1. Fetch profil lengkap, data follower, dan aktivitas pengguna nyata dari database
  useEffect(() => {
    let isMounted = true
    setIsLoadingActivities(true)

    // Cek cache localStorage untuk status follow instan
    const cachedFollow = localStorage.getItem(`follow_${targetIdentifier}`)
    if (cachedFollow !== null) {
      setIsFollowing(cachedFollow === 'true')
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
        if (d.avatar && !localAvatar) setProfileAvatar(d.avatar)
        if (d.bio) setProfileBio(d.bio)
        if (isSelf && d.email) setProfileEmail(d.email)

        if (typeof d.followers_count === 'number') {
          let count = d.followers_count
          if (cachedFollow !== null) {
            const isCachedFollow = cachedFollow === 'true'
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
        // Fallback jika API profil gagal: coba cari di feed aktivitas
        apiFetch('/api/activities')
          .then((r) => r.json())
          .then((actJson) => {
            if (!isMounted || !Array.isArray(actJson?.data)) return
            const matched = actJson.data.filter(
              (p) => p.user_name === profileName || p.userName === profileName
            )
            setUserActivities(matched)
          })
          .catch(() => {})
      })
      .finally(() => {
        if (isMounted) setIsLoadingActivities(false)
      })

    return () => {
      isMounted = false
    }
  }, [targetIdentifier, currentUser?.email, isSelf, localAvatar, profileName])

  // 2. Fungsi Toggle Follow (Ikuti / Batal Ikuti) Dinamis
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

    // Optimistic UI Update
    setIsFollowing(nextState)
    setFollowersCount(nextCount)
    localStorage.setItem(`follow_${targetIdentifier}`, String(nextState))

    showToast(
      nextState
        ? `Berhasil mengikuti ${profileName}!`
        : `Batal mengikuti ${profileName}.`
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
          localStorage.setItem(`follow_${targetIdentifier}`, String(json.is_following))
        }
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi status follow ke server:', err)
    }
  }

  // 3. Upload & Kompresi Foto Profil Pengguna
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

    // Tampilkan pratinjau instan
    const previewUrl = URL.createObjectURL(file)
    setLocalAvatar(previewUrl)
    setProfileAvatar(previewUrl)
    setIsUploading(true)

    try {
      // Kompresi foto profil di client (maksimal 600x600 px, kualitas 82%)
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

  // Destinasi sampel untuk Rute Saya
  const museumZoologi = tourists.find((t) => t.slug === 'museum-zoologi-bogor')
  const museumPeta = tourists.find((t) => t.slug === 'museum-peta')

  const activeAvatar = localAvatar || profileAvatar

  return (
    <div className="relative h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-6 pb-28 max-w-md mx-auto overscroll-contain overscroll-y-contain will-change-transform transform-gpu overflow-y-auto">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="btn-back-profile"
          onClick={onBack}
          aria-label="Kembali"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition text-white cursor-pointer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h1 className="text-[17px] font-bold tracking-tight text-white">
          {isSelf ? 'Profil Saya' : 'Profil Penjelajah'}
        </h1>

        {/* 4. TOMBOL LOGOUT ATAS (Hanya pada Akun Sendiri) */}
        {isSelf ? (
          <button
            type="button"
            id="btn-logout-icon"
            onClick={onLogout}
            title="Keluar dari Akun"
            aria-label="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 hover:text-white transition active:scale-95 cursor-pointer border border-rose-500/30"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Toast Notifikasi Sukses / Gagal */}
      {toast && (
        <div
          role="status"
          className="fixed top-5 inset-x-5 z-50 max-w-xs mx-auto animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-xl text-[12px] font-medium backdrop-blur-md ${
              toast.isError
                ? 'bg-rose-950/95 text-rose-200 border border-rose-500/40'
                : 'bg-emerald-950/95 text-emerald-200 border border-emerald-500/40'
            }`}
          >
            <span>{toast.isError ? '⚠️' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Profil Header Card */}
      <div className="mt-6 flex flex-col items-center text-center">
        {/* Foto Profil Besar dengan Tombol Ganti Foto */}
        <div className="relative group">
          <SafeImage
            src={activeAvatar}
            fallback={DEFAULT_AVATAR_PLACEHOLDER}
            alt={profileName}
            className="h-24 w-24 rounded-full object-cover border-4 border-emerald-500/40 shadow-md"
          />
          <span className="absolute bottom-1 right-1 z-[2] flex h-4 w-4 rounded-full bg-emerald-400 border-2 border-forest-900" />

          {/* Tombol Kamera Ubah Foto Profil (Khusus Akun Sendiri) */}
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
                className="absolute -bottom-1 -right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#8c785c] hover:bg-[#9d8869] active:scale-95 text-white border-2 border-forest-900 shadow-lg transition cursor-pointer"
              >
                {isUploading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>

        {/* Nama Pengguna */}
        <h2 className="mt-3 text-[20px] font-bold text-white tracking-tight">
          {profileName}
        </h2>

        {/* Email Pengguna (Hanya Tampil Jika Akun Sendiri) */}
        {isSelf && profileEmail && (
          <p className="text-[12px] text-white/60 font-medium mt-0.5">
            {profileEmail}
          </p>
        )}

        {/* Bio Pengguna */}
        {profileBio && (
          <p className="mt-1 text-[11px] text-white/65 max-w-xs leading-relaxed px-2">
            {profileBio}
          </p>
        )}

        {/* Badge & Deskripsi */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="rounded-full bg-forest-700/80 px-3 py-0.5 text-[10px] font-semibold text-emerald-300 border border-white/10">
            {isSelf ? 'Penjelajah Aktif' : 'Petualang Alam Bogor'}
          </span>
        </div>

        {/* 3. TOMBOL "IKUTI PERJALANAN" (Hanya pada Akun Orang Lain) */}
        {!isSelf && (
          <button
            type="button"
            id="btn-follow-user"
            onClick={handleToggleFollow}
            className={`mt-4 flex items-center gap-2 rounded-full px-5 py-2 text-[12px] font-bold transition shadow-md cursor-pointer active:scale-95 border ${
              isFollowing
                ? 'bg-white/15 text-white/90 border-white/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/30'
            }`}
          >
            {isFollowing ? (
              <>
                <span>Mengikuti</span>
                <span className="text-emerald-300">✓</span>
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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

        {/* Quick Stats Row (Dinamis Sesuai Data Real Server) */}
        <div className="mt-6 flex w-full max-w-xs items-center justify-around rounded-2xl bg-forest-700/50 border border-white/10 py-3 px-2">
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-white">{routesCount}</span>
            <span className="text-[10px] text-white/60">Rute Custom</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-white">{followersCount}</span>
            <span className="text-[10px] text-white/60">Pengikut</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-white">{followingCount}</span>
            <span className="text-[10px] text-white/60">Mengikuti</span>
          </div>
        </div>
      </div>

      {/* SECTION CONTENT: Rute Saya vs Aktivitas Pengguna */}
      <div className="mt-8">
        {isSelf ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-white tracking-tight">
                Rute Saya
              </h3>
              <span className="text-[11px] text-white/60">2 Rute Tersimpan</span>
            </div>

            {/* Rute 1 */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col rounded-2xl bg-forest-700/70 border border-white/10 p-3.5 shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white">
                    Museum of Zoology ➔ Museum PETA
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    5.4 KM
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  2 titik singgah edukasi sejarah Bogor
                </p>
                {onStartCustomRoute && museumZoologi && museumPeta && (
                  <button
                    type="button"
                    onClick={() => onStartCustomRoute([museumZoologi, museumPeta])}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-1.5 text-[11px] font-bold text-white transition cursor-pointer"
                  >
                    <span>Mulai Navigasi Rute</span>
                  </button>
                )}
              </div>

              {/* Rute 2 */}
              <div className="flex flex-col rounded-2xl bg-forest-700/70 border border-white/10 p-3.5 shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white">
                    Kuliner Surya Kencana
                  </span>
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/20">
                    3.0 KM
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  Pusat kuliner legendaris Bogor
                </p>
              </div>
            </div>

            {/* 4. TOMBOL LOGOUT BAWAH DI PROFIL AKUN SENDIRI */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <button
                type="button"
                id="btn-logout-profile"
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600/90 hover:bg-rose-600 active:scale-95 py-3 text-[13px] font-bold text-white shadow-lg transition cursor-pointer border border-rose-400/30"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-white tracking-tight">
                Aktivitas Terkini {profileName}
              </h3>
              {userActivities.length > 0 && (
                <span className="text-[11px] text-white/60">
                  {userActivities.length} Aktivitas
                </span>
              )}
            </div>

            {isLoadingActivities ? (
              <div className="flex flex-col gap-3">
                <div className="h-44 w-full rounded-2xl bg-forest-700/50 animate-pulse border border-white/5" />
              </div>
            ) : userActivities.length > 0 ? (
              <div className="flex flex-col gap-3">
                {userActivities.map((act) => (
                  <article
                    key={act.id}
                    className="flex flex-col rounded-2xl bg-forest-700/70 border border-white/10 p-3.5 shadow-sm overflow-hidden active:scale-[0.98] transition-transform duration-150"
                  >
                    {act.image && (
                      <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-black/20">
                        <SafeImage
                          src={act.image}
                          fallback={DEFAULT_IMAGE_PLACEHOLDER}
                          alt={act.title || 'Aktivitas'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                        <span>{act.date || 'Baru saja'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-medium truncate max-w-[150px]">
                            {act.location}
                          </span>
                          {isSelf && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPostToDelete(act.id)
                              }}
                              title="Hapus aktivitas ini"
                              className="text-white/40 hover:text-red-400 p-0.5 transition cursor-pointer"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="text-[13px] font-bold text-white leading-snug">
                        {act.title}
                      </h4>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl bg-forest-700/40 border border-white/10 text-center">
                <span className="text-3xl mb-1.5">🏕️</span>
                <p className="text-[12px] font-bold text-white">Belum Ada Aktivitas Terkini</p>
                <p className="text-[10px] text-white/50 mt-0.5 max-w-[200px]">
                  {profileName} belum membagikan momen perjalanan terbarunya.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL KONFIRMASI HAPUS AKTIVITAS */}
      {postToDelete && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xs rounded-3xl bg-forest-900 border border-white/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-3 border border-red-500/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="text-[16px] font-bold text-white">Hapus Aktivitas?</h3>
            <p className="text-[12px] text-white/60 mt-1">
              Postingan aktivitas ini akan dihapus secara permanen.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 py-2.5 text-[12px] font-semibold text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteActivity}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-[12px] font-bold text-white transition cursor-pointer shadow flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(ProfilePage)
