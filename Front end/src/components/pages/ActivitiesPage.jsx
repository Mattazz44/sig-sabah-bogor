import { memo, useEffect, useRef, useState } from 'react'
import NotificationDrawer from '../ui/NotificationDrawer'
import SafeImage from '../ui/SafeImage'
import { BellIcon, CameraIcon, RefreshIcon, UserIcon, XIcon } from '../ui/VectorIcons'
import { apiFetch } from '../../utils/api'
import { compressImage } from '../../utils/imageCompressor'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'

function ActivitiesPage({
  tourists = [],
  favorites = [],
  recentSlugs = [],
  onSelectPlace,
  isLoggedIn = false,
  currentUser = null,
  onRequireLogin,
  onOpenProfile,
}) {
  const [subTab, setSubTab] = useState('Kamu')
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  const [myActivities, setMyActivities] = useState([])
  const [communityActivities, setCommunityActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [showPostModal, setShowPostModal] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [postLocation, setPostLocation] = useState('')
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [isPosting, setIsPosting] = useState(false)
  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fileInputRef = useRef(null)

  // Fetch daftar postingan aktivitas dari API database
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    apiFetch('/api/activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (!isMounted) return
        if (Array.isArray(json?.data) && json.data.length > 0) {
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

          if (isLoggedIn) {
            setMyActivities(allMapped.filter((p) => !p.isOtherUser))
          } else {
            setMyActivities([])
          }

          setCommunityActivities(allMapped)
        } else {
          setMyActivities([])
          setCommunityActivities([])
        }
        setHasError(false)
      })
      .catch((err) => {
        console.warn('Gagal memuat aktivitas dari database:', err)
        if (isMounted) {
          setHasError(true)
          setMyActivities([])
          setCommunityActivities([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, currentUser, reloadTick])

  const handleClosePostModal = () => {
    setUploadedImagePreview(null)
    setSelectedImageFile(null)
    setPostCaption('')
    setPostLocation('')
    setShowPostModal(false)
  }

  // Escape key listener untuk modal
  useEffect(() => {
    if (!showPostModal && !postToDelete) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (postToDelete) setPostToDelete(null)
        else if (showPostModal) handleClosePostModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPostModal, postToDelete])

  const currentFeed = subTab === 'Kamu' ? myActivities : communityActivities

  // Fungsi konfirmasi hapus postingan aktivitas sendiri
  const confirmDeletePost = async () => {
    if (!postToDelete) return
    const id = postToDelete
    setIsDeleting(true)

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

  const handleCreatePostClick = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin()
    } else {
      setShowPostModal(true)
    }
  }

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setUploadedImagePreview(previewUrl)
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault()

    const titleText = postCaption.trim()
    const locText = postLocation.trim()
    const tempLocalPreview = uploadedImagePreview || null

    if (!titleText || !locText) return

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
          setMyActivities((prev) => prev.map((p) => (p.id === tempId ? savedPost : p)))
          setCommunityActivities((prev) => prev.map((p) => (p.id === tempId ? savedPost : p)))
        }
      }
    } catch (err) {
      console.warn('Gagal menyimpan postingan aktivitas ke server:', err)
    } finally {
      setIsPosting(false)
      setPostCaption('')
      setPostLocation('')
      setUploadedImagePreview(null)
      setSelectedImageFile(null)
    }
  }

  const handleOpenAuthorProfile = (post) => {
    if (!onOpenProfile) return
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

  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setSubTab((prev) => (prev === 'Kamu' ? 'Komunitas' : 'Kamu'))
    }
  }

  return (
    <div className="animate-tab-enter relative mx-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-forest-900 text-[#EBF0EB]">
      {/* Header & Sub-Tab */}
      <header className="z-10 shrink-0 bg-forest-900 px-5 pt-6 pb-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[22px] font-bold tracking-tight text-[#EBF0EB]">
            Aktivitas
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-tambah-foto-aktivitas"
              onClick={handleCreatePostClick}
              title="Posting foto aktivitas perjalanan"
              aria-label="Posting foto perjalanan"
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] px-3.5 py-1.5 text-[12px] font-semibold text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
            >
              <CameraIcon className="h-4 w-4" />
              <span>Posting</span>
            </button>

            <button
              type="button"
              id="btn-notifikasi-aktivitas"
              onClick={() => setShowNotificationDrawer(true)}
              title="Lihat notifikasi"
              aria-label="Notifikasi aktivitas"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
            >
              <BellIcon className="h-4.5 w-4.5" />
            </button>

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
              aria-label={isLoggedIn ? 'Buka profil pengguna' : 'Masuk ke akun'}
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
            >
              {isLoggedIn ? (
                <SafeImage
                  src={currentUser?.avatar}
                  fallback={DEFAULT_AVATAR_PLACEHOLDER}
                  alt={currentUser?.name || 'Profil pengguna'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigasi */}
        <div
          role="tablist"
          aria-label="Filter aktivitas"
          onKeyDown={handleTabKeyDown}
          className="mt-3.5 flex items-center gap-8 border-b border-[#EBF0EB]/18"
        >
          <button
            type="button"
            role="tab"
            id="subtab-kamu"
            onClick={() => setSubTab('Kamu')}
            aria-selected={subTab === 'Kamu'}
            aria-controls="feed-list-container"
            className={`relative min-h-[40px] pb-2.5 text-[14px] transition-colors ${
              subTab === 'Kamu'
                ? 'font-bold text-[#EBF0EB]'
                : 'font-medium text-[#C8D3C8] hover:text-[#EBF0EB]'
            }`}
          >
            <span>Kamu</span>
            {subTab === 'Kamu' && (
              <span className="absolute inset-x-0 bottom-[-1px] h-[2.5px] rounded-full bg-[#EBF0EB]" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="subtab-komunitas"
            onClick={() => setSubTab('Komunitas')}
            aria-selected={subTab === 'Komunitas'}
            aria-controls="feed-list-container"
            className={`relative min-h-[40px] pb-2.5 text-[14px] transition-colors ${
              subTab === 'Komunitas'
                ? 'font-bold text-[#EBF0EB]'
                : 'font-medium text-[#C8D3C8] hover:text-[#EBF0EB]'
            }`}
          >
            <span>Komunitas</span>
            {subTab === 'Komunitas' && (
              <span className="absolute inset-x-0 bottom-[-1px] h-[2.5px] rounded-full bg-[#EBF0EB]" />
            )}
          </button>
        </div>
      </header>

      {/* Feed List Container */}
      <section
        id="feed-list-container"
        aria-label="Daftar postingan aktivitas"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
        className="flex-1 overflow-y-auto overscroll-contain overscroll-y-contain will-change-transform transform-gpu px-5 pt-4"
      >
        {subTab === 'Kamu' && !isLoggedIn ? (
          <div key="empty-kamu" className="animate-tab-enter mt-12 flex flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#EBF0EB]/16 bg-[#253320] text-[#E2D7B5] shadow-md">
              <CameraIcon className="h-9 w-9" />
            </div>
            <h2 className="text-[17px] font-bold tracking-tight text-[#EBF0EB]">
              Aktivitas perjalanan Anda
            </h2>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[#C8D3C8]">
              Masuk untuk melihat dan membagikan dokumentasi perjalanan wisata pribadi Anda di Bogor.
            </p>
            <button
              type="button"
              onClick={onRequireLogin}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#EBF0EB] px-6 py-2.5 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
            >
              Masuk ke akun
            </button>
          </div>
        ) : isLoading && currentFeed.length === 0 ? (
          <div className="mt-4 flex flex-col gap-5" aria-live="polite">
            {[1, 2].map((skeleton) => (
              <div
                key={skeleton}
                className="overflow-hidden rounded-2xl border border-[#EBF0EB]/10 bg-[#233020] p-3.5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#2E3E2A]" />
                  <div className="h-3.5 w-32 rounded bg-[#2E3E2A]" />
                </div>
                <div className="aspect-[16/10] w-full rounded-xl bg-[#1C2719]" />
              </div>
            ))}
          </div>
        ) : hasError && currentFeed.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-rose-400/25 bg-[#2a1216] p-5 text-center">
            <p className="text-[14px] font-semibold text-[#EBF0EB]">
              Aktivitas belum bisa dimuat
            </p>
            <p className="mt-1 text-[12px] text-rose-100/85">
              Periksa sambungan ke server backend lalu coba muat ulang.
            </p>
            <button
              type="button"
              onClick={() => setReloadTick((prev) => prev + 1)}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/12 px-4 text-[12px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#EBF0EB]/20"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              <span>Muat ulang</span>
            </button>
          </div>
        ) : (
          <div key={subTab} className="animate-tab-enter">
            <h2 className="mb-4 text-[13.5px] font-semibold tracking-tight text-[#EBF0EB]">
              {subTab === 'Kamu'
                ? `${myActivities.length} aktivitas Anda bulan ini`
                : 'Temukan aktivitas komunitas di sini'}
            </h2>

            {currentFeed.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-6 text-center">
                <p className="text-[13px] text-[#C8D3C8]">
                  {subTab === 'Kamu'
                    ? 'Belum ada aktivitas yang Anda unggah. Ketuk tombol Posting di atas untuk membagikan pengalaman.'
                    : 'Belum ada postingan komunitas saat ini.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {currentFeed.map((post) => (
                  <article key={post.id} className="group flex flex-col text-left">
                    {/* Header Post: Author, Date, and Delete Button */}
                    <div className="mb-2.5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorProfile(post)}
                        title={`Lihat profil ${post.userName}`}
                        className="flex w-fit items-center gap-3 rounded-xl py-1 pr-2 text-left transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
                      >
                        <SafeImage
                          src={post.userAvatar}
                          fallback={DEFAULT_AVATAR_PLACEHOLDER}
                          alt={post.userName}
                          className="h-9 w-9 shrink-0 rounded-full border border-[#EBF0EB]/20 object-cover shadow-sm"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="flex flex-col justify-center">
                          <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-[#EBF0EB] group-hover:underline">
                            <span>{post.userName}</span>
                            {post.isOtherUser && (
                              <span className="text-[10px] font-normal text-emerald-300">
                                (Lihat profil)
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 text-[11.5px] leading-tight text-[#C8D3C8]">
                            {post.date}
                          </span>
                        </span>
                      </button>

                      {/* Tombol Hapus Postingan Sendiri */}
                      {(!post.isOtherUser ||
                        (currentUser &&
                          ((post.userId && Number(post.userId) === Number(currentUser.id)) ||
                            post.userName === currentUser.name))) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPostToDelete(post.id)
                          }}
                          title="Hapus aktivitas saya"
                          aria-label="Hapus aktivitas ini"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-red-400 active:scale-95"
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
                            aria-hidden="true"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Gambar Postingan */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#EBF0EB]/12 bg-[#1C2719] shadow-sm">
                      <SafeImage
                        src={post.image}
                        fallback={DEFAULT_IMAGE_PLACEHOLDER}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Konten Keterangan */}
                    <div className="mt-2.5">
                      <h3 className="text-[13.5px] font-bold leading-snug text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                        {post.title}
                      </h3>
                      <p className="mt-0.5 text-[11.5px] leading-tight text-[#C8D3C8]">
                        {post.location}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal Form: Posting Foto Perjalanan */}
      {showPostModal && (
        <div
          id="modal-post-foto-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-post-foto-title"
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative max-h-[90vh] w-full max-w-xs overflow-y-auto rounded-3xl border border-[#EBF0EB]/20 bg-[#161E16] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={handleClosePostModal}
              aria-label="Tutup modal posting"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#EBF0EB]/20 bg-[#253320] text-[#EBF0EB] transition-colors hover:bg-[#31442B]"
            >
              <XIcon className="h-4 w-4" />
            </button>

            <h3
              id="modal-post-foto-title"
              className="text-center text-[17px] font-bold tracking-tight text-[#EBF0EB]"
            >
              Posting Foto Perjalanan
            </h3>
            <p className="mt-1 text-center text-[12px] text-[#C8D3C8]">
              Bagikan pengalaman wisatamu ke komunitas
            </p>

            <form onSubmit={handlePostSubmit} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label
                  htmlFor="input-file-activity-photo"
                  className="mb-1 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Foto Aktivitas
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="input-file-activity-photo"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <div
                  id="dropzone-activity-photo"
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EBF0EB]/25 bg-[#233020] p-3 text-center transition-colors hover:border-emerald-400 focus:border-emerald-400 focus:outline-none"
                >
                  {uploadedImagePreview ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl shadow">
                      <img
                        src={uploadedImagePreview}
                        alt="Preview Foto"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2 right-2 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
                        Ganti Foto
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <CameraIcon className="h-7 w-7 text-[#E2D7B5]" />
                      <p className="text-[12px] font-bold text-[#EBF0EB]">
                        Pilih foto dari galeri
                      </p>
                      <p className="text-[10.5px] text-[#C8D3C8]">
                        Ketuk untuk unggah gambar JPG/PNG
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-post-location"
                  className="mb-1 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Lokasi Wisata
                </label>
                <input
                  type="text"
                  id="input-post-location"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="Misal: Curug Cikuluwung"
                  className="w-full rounded-xl border border-[#EBF0EB]/18 bg-[#121812] px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] focus:border-[#E2D7B5] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="input-post-caption"
                  className="mb-1 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Cerita / Keterangan
                </label>
                <textarea
                  id="input-post-caption"
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Tuliskan pengalaman seru di tempat ini..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#EBF0EB]/18 bg-[#121812] px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] focus:border-[#E2D7B5] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                id="btn-submit-post-foto"
                disabled={isPosting}
                className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#EBF0EB] py-2.5 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97] disabled:opacity-60"
              >
                {isPosting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#161E16] border-t-transparent" />
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

      {/* Modal Konfirmasi Hapus Aktivitas */}
      {postToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
          className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xs rounded-3xl border border-[#EBF0EB]/20 bg-[#161E16] p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20 text-red-400">
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 id="modal-delete-title" className="text-[16px] font-bold text-[#EBF0EB]">
              Hapus Aktivitas?
            </h3>
            <p className="mt-1 text-[12px] text-[#C8D3C8]">
              Postingan aktivitas ini akan dihapus secara permanen.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="min-h-[40px] flex-1 rounded-xl border border-[#EBF0EB]/20 bg-[#253320] py-2 text-[12px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#31442B]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                disabled={isDeleting}
                className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2 text-[12px] font-bold text-white shadow transition-colors hover:bg-red-500 disabled:opacity-60"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Notifikasi */}
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

export default memo(ActivitiesPage)
