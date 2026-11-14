import { memo, useEffect, useState } from 'react'
import NotificationDrawer from '../ui/NotificationDrawer'
import SafeImage from '../ui/SafeImage'
import { apiFetch } from '../../utils/api'
import { compressImage } from '../../utils/imageCompressor'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'

function ActivitiesPage({ isLoggedIn, currentUser = null, onRequireLogin, onOpenProfile }) {
  // SUB-TAB NAVIGATION: 'Kamu' vs 'Komunitas'
  const [subTab, setSubTab] = useState('Kamu')

  // 5. STATE NOTIFIKASI DRAWER
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)

  // 4. STATE POSTING FOTO DENGAN SIMULASI FILE UPLOAD
  const [myActivities, setMyActivities] = useState([])
  const [communityActivities, setCommunityActivities] = useState([])

  // Fetch daftar postingan aktivitas dari API database
  useEffect(() => {
    let isMounted = true
    apiFetch('/api/activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (isMounted && Array.isArray(json?.data) && json.data.length > 0) {
          const mapPost = (item) => {
            const isMine = Boolean(
              currentUser && (
                (item.user_id && currentUser.id && Number(item.user_id) === Number(currentUser.id)) ||
                (item.user_name && currentUser.name && item.user_name === currentUser.name)
              )
            )
            return {
              id: item.id,
              userId: item.user_id,
              userName: item.user_name,
              userAvatar: item.user_avatar,
              date: item.date,
              image: item.image,
              title: item.title,
              location: item.location,
              isOtherUser: !isMine,
            }
          }

          const allMapped = json.data.map(mapPost)

          // Aktivitas Kamu HANYA ada jika pengguna sedang logged in
          if (isLoggedIn) {
            setMyActivities(allMapped.filter((p) => !p.isOtherUser))
          } else {
            setMyActivities([])
          }

          // Aktivitas Komunitas menampilkan seluruh aktivitas komunitas publik
          setCommunityActivities(allMapped)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat aktivitas dari database:', err)
        if (isMounted) {
          setMyActivities([])
          setCommunityActivities([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, currentUser?.id, currentUser?.name])

  const [showPostModal, setShowPostModal] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [postLocation, setPostLocation] = useState('')
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [isPosting, setIsPosting] = useState(false)
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentFeed = subTab === 'Kamu' ? myActivities : communityActivities

  // Fungsi konfirmasi hapus postingan aktivitas sendiri
  const confirmDeletePost = async () => {
    if (!postToDelete) return
    const id = postToDelete
    setIsDeleting(true)

    // Optimistic removal
    setMyActivities((prev) => prev.filter((p) => p.id !== id))
    setCommunityActivities((prev) => prev.filter((p) => p.id !== id))
    setPostToDelete(null)

    try {
      await apiFetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id,
          user_name: currentUser?.name,
        }),
      })
    } catch (err) {
      console.warn('Gagal menghapus postingan:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Cek status isLoggedIn sebelum membuka form posting foto
  const handleCreatePostClick = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin()
    } else {
      setShowPostModal(true)
    }
  }

  // Handle upload foto dari input file HP
  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setUploadedImagePreview(previewUrl)
    }
  }

  // Submit posting foto ke feed
  const handlePostSubmit = async (e) => {
    e.preventDefault()

    const titleText = postCaption.trim()
    const locText = postLocation.trim()
    const tempLocalPreview = uploadedImagePreview || null

    if (!titleText || !locText) {
      return
    }

    setIsPosting(true)

    const tempId = `post-${Date.now()}`
    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())

    const optimisticPost = {
      id: tempId,
      userId: currentUser?.id,
      userName: currentUser?.name || 'Pengguna',
      userAvatar: currentUser?.avatar || '',
      date: todayFormatted,
      image: tempLocalPreview,
      title: titleText,
      location: locText,
      isOtherUser: false,
    }

    setMyActivities((prev) => [optimisticPost, ...prev])
    setCommunityActivities((prev) => [optimisticPost, ...prev])
    setShowPostModal(false)

    try {
      const formData = new FormData()
      formData.append('title', titleText)
      formData.append('location', locText)
      formData.append('date', todayFormatted)
      if (currentUser?.id) {
        formData.append('user_id', String(currentUser.id))
      }
      if (currentUser?.email) {
        formData.append('user_email', currentUser.email)
      }
      formData.append('user_name', currentUser?.name || 'Pengguna')
      formData.append('user_avatar', currentUser?.avatar || '')

      if (selectedImageFile) {
        // Kompresi foto sebelum diunggah ke backend
        const compressed = await compressImage(selectedImageFile, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.82,
        })
        formData.append('image', compressed)
      }

      const res = await apiFetch('/api/activities', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const json = await res.json()
        if (json?.data) {
          const savedPost = {
            id: json.data.id || tempId,
            userId: json.data.user_id || currentUser?.id,
            userName: json.data.user_name || json.data.userName,
            userAvatar: json.data.user_avatar || json.data.userAvatar,
            date: json.data.date || todayFormatted,
            image: json.data.image,
            title: json.data.title,
            location: json.data.location,
            isOtherUser: false,
          }
          // Perbarui postingan dengan path image nyata yang disimpan di server (/images/activities/...)
          setMyActivities((prev) => prev.map((p) => (p.id === tempId ? savedPost : p)))
          setCommunityActivities((prev) => prev.map((p) => (p.id === tempId ? savedPost : p)))
        }
      }
    } catch (err) {
      console.warn('Gagal menyimpan postingan aktivitas ke server:', err)
    } finally {
      setIsPosting(false)
      setPostCaption('')
      setUploadedImagePreview(null)
      setSelectedImageFile(null)
    }
  }

  return (
    <div className="relative h-full w-full bg-forest-900 text-white flex flex-col overflow-hidden max-w-md mx-auto select-none">
      {/* HEADER & SUB-TAB NAVIGATION TERKUNCI DI ATAS */}
      <header className="shrink-0 px-5 pt-6 pb-0 bg-forest-900 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Aktivitas
          </h1>

          <div className="flex items-center gap-2.5">
            {/* TOMBOL POSTING FOTO AKTIVITAS */}
            <button
              type="button"
              id="btn-tambah-foto-aktivitas"
              onClick={handleCreatePostClick}
              title="Posting foto aktivitas perjalanan"
              aria-label="Posting foto perjalanan"
              className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 px-3 py-1.5 text-[11px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30"
            >
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
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>+ Post</span>
            </button>

            {/* 5. TOMBOL NOTIFIKASI AKTIF (BELL ICON) */}
            <button
              type="button"
              id="btn-notifikasi-aktivitas"
              onClick={() => setShowNotificationDrawer(true)}
              title="Lihat Notifikasi"
              aria-label="Notifikasi aktivitas"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition cursor-pointer"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* Profile Avatar Badge */}
            <button
              type="button"
              id="btn-profile-aktivitas"
              onClick={() => {
                if (!isLoggedIn) {
                  if (onRequireLogin) onRequireLogin()
                } else if (onOpenProfile) {
                  onOpenProfile('self')
                }
              }}
              aria-label="Profil pengguna"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 overflow-hidden bg-forest-700 hover:ring-2 hover:ring-white/40 active:scale-[0.98] transition-transform duration-150 cursor-pointer shadow-sm text-white/90"
            >
              {isLoggedIn ? (
                <SafeImage
                  src={currentUser?.avatar}
                  fallback={DEFAULT_AVATAR_PLACEHOLDER}
                  alt={currentUser?.name || 'Profil pengguna'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* SUB-TAB NAVIGATION */}
        <nav
          aria-label="Sub navigasi aktivitas"
          className="flex items-center gap-8 mt-3.5 border-b border-white/20"
        >
          <button
            type="button"
            id="subtab-kamu"
            onClick={() => setSubTab('Kamu')}
            aria-selected={subTab === 'Kamu'}
            className={`relative pb-2.5 text-[14px] transition-colors cursor-pointer ${
              subTab === 'Kamu'
                ? 'font-bold text-white'
                : 'font-normal text-white/60 hover:text-white/90'
            }`}
          >
            <span>Kamu</span>
            {subTab === 'Kamu' && (
              <span className="absolute bottom-[-1px] inset-x-0 h-[2.5px] bg-white rounded-full shadow-[0_1px_4px_rgba(255,255,255,0.4)]" />
            )}
          </button>

          <button
            type="button"
            id="subtab-komunitas"
            onClick={() => setSubTab('Komunitas')}
            aria-selected={subTab === 'Komunitas'}
            className={`relative pb-2.5 text-[14px] transition-colors cursor-pointer ${
              subTab === 'Komunitas'
                ? 'font-bold text-white'
                : 'font-normal text-white/60 hover:text-white/90'
            }`}
          >
            <span>Komunitas</span>
            {subTab === 'Komunitas' && (
              <span className="absolute bottom-[-1px] inset-x-0 h-[2.5px] bg-white rounded-full shadow-[0_1px_4px_rgba(255,255,255,0.4)]" />
            )}
          </button>
        </nav>
      </header>

      {/* FEED LIST CONTAINER */}
      <section
        id="feed-list-container"
        aria-label="Daftar post aktivitas"
        className="flex-1 overflow-y-auto px-5 pt-4 pb-28 overscroll-contain overscroll-y-contain will-change-transform transform-gpu"
      >
        {subTab === 'Kamu' && !isLoggedIn ? (
          /* Empty State Tab Kamu jika Pengguna Belum Login */
          <div className="mt-14 flex flex-col items-center justify-center text-center px-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-forest-700/60 border border-white/15 text-3xl shadow-inner mb-4">
              📸
            </div>
            <h2 className="text-[17px] font-bold text-white tracking-tight">
              Aktivitas Perjalanan Kamu
            </h2>
            <p className="mt-2 text-[12px] text-white/60 max-w-xs leading-relaxed">
              Masuk dengan akun Anda untuk melihat dan membagikan dokumentasi aktivitas wisata pribadi Anda di Bogor.
            </p>
            <button
              type="button"
              onClick={onRequireLogin}
              className="mt-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-6 py-3 text-[13px] font-bold text-white shadow-lg transition cursor-pointer border border-emerald-400/30"
            >
              Masuk ke Akun
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-[13px] font-semibold text-white/90 mb-4 tracking-tight">
              {subTab === 'Kamu'
                ? `${myActivities.length} Aktivitas Kamu Bulan Ini`
                : 'Temukan aktivitas lainnya disini'}
            </h2>

            {currentFeed.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-forest-700/40 border border-white/10 p-6 text-center">
                <p className="text-[12px] text-white/60">
                  {subTab === 'Kamu'
                    ? 'Belum ada aktivitas yang Anda unggah. Klik tombol + Post di atas untuk berbagi cerita perjalanan Anda!'
                    : 'Belum ada postingan komunitas saat ini.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {currentFeed.map((post) => (
                  <article
                    key={post.id}
                    className="flex flex-col text-left group"
                  >
                    {/* Header Post: Avatar, nama, tanggal & Tombol Hapus */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (onOpenProfile) {
                            if (currentUser && post.userName === currentUser.name) {
                              onOpenProfile('self')
                            } else {
                              onOpenProfile({
                                isSelf: false,
                                name: post.userName,
                                avatar: post.userAvatar,
                              })
                            }
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && onOpenProfile && onOpenProfile('self')}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-transform duration-150"
                        title={`Lihat profil ${post.userName}`}
                      >
                        <SafeImage
                          src={post.userAvatar}
                          fallback={DEFAULT_AVATAR_PLACEHOLDER}
                          alt={post.userName}
                          className="h-9 w-9 shrink-0 rounded-full object-cover border border-white/20 shadow-sm"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="flex flex-col justify-center">
                          <span className="text-[13px] font-semibold text-white leading-tight hover:underline flex items-center gap-1.5">
                            <span>{post.userName}</span>
                            {post.isOtherUser && (
                              <span className="text-[10px] text-emerald-300 font-normal">
                                (Lihat profil)
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-white/60 leading-tight mt-0.5">
                            {post.date}
                          </span>
                        </div>
                      </div>

                      {/* Tombol Hapus Postingan Sendiri */}
                      {(!post.isOtherUser || (currentUser && ((post.userId && Number(post.userId) === Number(currentUser.id)) || post.userName === currentUser.name))) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPostToDelete(post.id)
                          }}
                          title="Hapus aktivitas saya"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-red-400 hover:bg-white/10 active:scale-95 transition cursor-pointer"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Gambar Utama Tempat Wisata */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[20px] bg-black/20 shadow-sm border border-white/10 active:scale-[0.98] transition-transform duration-150">
                      <SafeImage
                        src={post.image}
                        fallback={DEFAULT_IMAGE_PLACEHOLDER}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Deskripsi Post */}
                    <div className="mt-2.5">
                      <h3 className="text-[13px] font-bold text-white leading-snug group-hover:text-amber-200 transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-white/60 leading-tight">
                        {post.location}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* 4. MODAL FORM: "POSTING FOTO PERJALANAN" DENGAN DROPZONE UPLOAD FOTO HP */}
      {showPostModal && (
        <div
          id="modal-post-foto-overlay"
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xs rounded-3xl bg-forest-900 border border-white/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowPostModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-[17px] font-bold text-white tracking-tight text-center">
              Posting Foto Perjalanan
            </h3>
            <p className="text-[11px] text-white/60 text-center mt-1">
              Bagikan pengalaman wisatamu ke komunitas
            </p>

            <form onSubmit={handlePostSubmit} className="mt-4 flex flex-col gap-3">
              {/* 4. FIELD SIMULASI FILE UPLOAD / DROPZONE AREA */}
              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1">
                  Foto Aktivitas
                </label>
                <input
                  type="file"
                  id="input-file-activity-photo"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <div
                  id="dropzone-activity-photo"
                  onClick={() => document.getElementById('input-file-activity-photo')?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-white/25 hover:border-emerald-400 rounded-2xl p-3 bg-white/5 cursor-pointer transition text-center"
                >
                  {uploadedImagePreview ? (
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow">
                      <img
                        src={uploadedImagePreview}
                        alt="Preview Foto"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2 right-2 rounded-full bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[9px] text-white border border-white/20">
                        Ganti Foto
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <span className="text-3xl">📷</span>
                      <p className="text-[12px] font-bold text-white">
                        Pilih foto dari galeri HP
                      </p>
                      <p className="text-[10px] text-white/50">
                        Klik area ini untuk unggah gambar JPG/PNG
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1">
                  Lokasi Wisata
                </label>
                <input
                  type="text"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="Misal: Curug Cikuluwung"
                  className="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3 py-2 text-[12px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1">
                  Cerita / Keterangan
                </label>
                <textarea
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Tuliskan pengalaman seru di tempat ini..."
                  rows={3}
                  className="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3 py-2 text-[12px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                id="btn-submit-post-foto"
                disabled={isPosting}
                className="mt-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 py-2.5 text-[12px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30 flex items-center justify-center gap-2"
              >
                {isPosting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Mengunggah & Mengompresi...</span>
                  </>
                ) : (
                  'Bagikan ke Komunitas'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

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
                onClick={confirmDeletePost}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-[12px] font-bold text-white transition cursor-pointer shadow flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL / DRAWER NOTIFIKASI */}
      <NotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
      />
    </div>
  )
}

export default memo(ActivitiesPage)
