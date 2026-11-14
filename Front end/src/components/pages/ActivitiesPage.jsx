import { memo, useEffect, useRef, useState } from 'react'
import NotificationDrawer from '../ui/NotificationDrawer'
import GlassModal from '../ui/GlassModal'
import SafeImage from '../ui/SafeImage'
import {
  AlertTriangleIcon,
  BellIcon,
  CameraIcon,
  CompassIcon,
  MapPinIcon,
  RefreshIcon,
  UserIcon,
} from '../ui/VectorIcons'
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
  const [loadedKey, setLoadedKey] = useState('')
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
  const requestKey = `${isLoggedIn}|${currentUser?.id || ''}|${currentUser?.name || ''}|${reloadTick}`
  const isLoading = loadedKey !== requestKey

  // Fetch daftar postingan aktivitas dari API database
  useEffect(() => {
    let isMounted = true

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
              currentUser &&
                ((item.user_id && currentUser.id && Number(item.user_id) === Number(currentUser.id)) ||
                  (item.user_name && currentUser.name && item.user_name === currentUser.name)),
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
          setLoadedKey(requestKey)
        }
      })

    return () => {
      isMounted = false
    }
  }, [requestKey, isLoggedIn, currentUser])

  const handleClosePostModal = () => {
    setUploadedImagePreview(null)
    setSelectedImageFile(null)
    setPostCaption('')
    setPostLocation('')
    setShowPostModal(false)
  }

  const currentFeed = subTab === 'Kamu' ? myActivities : communityActivities

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
    } else if (e.key === 'Home') {
      e.preventDefault()
      setSubTab('Kamu')
    } else if (e.key === 'End') {
      e.preventDefault()
      setSubTab('Komunitas')
    }
  }

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu bg-forest-900 text-[#EBF0EB]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Header: Judul & Aksi Notifikasi/Profil + Subjudul Penuh */}
        <header className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-[#EBF0EB] sm:text-[26px]">
              Aktivitas
            </h1>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                id="btn-notifikasi-aktivitas"
                onClick={() => setShowNotificationDrawer(true)}
                title="Lihat notifikasi"
                aria-label="Notifikasi aktivitas"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.14] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97] before:absolute before:-inset-0.5"
              >
                <BellIcon className="h-[18px] w-[18px]" />
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
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.2] bg-[#233020] text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97] before:absolute before:-inset-0.5"
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                  {isLoggedIn ? (
                    <SafeImage
                      src={currentUser?.avatar}
                      fallback={DEFAULT_AVATAR_PLACEHOLDER}
                      alt={currentUser?.name || 'Profil pengguna'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-[18px] w-[18px]" />
                  )}
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-white/60">
            Bagikan momen perjalanan wisata dan jelajahi cerita komunitas Bogor
          </p>
        </header>

        {/* Baris Kontrol: Compact Tab Switcher sejajar dengan Tombol + Post */}
        <div className="mt-4 flex items-center justify-between gap-2.5 sm:gap-3">
          <div
            role="tablist"
            aria-label="Filter aktivitas"
            onKeyDown={handleTabKeyDown}
            className="relative inline-grid h-9 w-fit max-w-[240px] grid-cols-2 items-center rounded-full border border-white/10 bg-white/[0.06] p-1"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{
                transform:
                  subTab === 'Komunitas'
                    ? 'translate3d(100%, 0, 0)'
                    : 'translate3d(0, 0, 0)',
              }}
            />

            <button
              type="button"
              role="tab"
              id="subtab-kamu"
              onClick={() => setSubTab('Kamu')}
              aria-selected={subTab === 'Kamu'}
              aria-controls="feed-list-container"
              className={`relative z-10 flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors duration-150 before:absolute before:-inset-y-2 before:inset-x-0 ${
                subTab === 'Kamu'
                  ? 'text-[#EBF0EB]'
                  : 'text-[#C8D3C8] hover:text-[#EBF0EB]'
              }`}
            >
              Kamu
            </button>

            <button
              type="button"
              role="tab"
              id="subtab-komunitas"
              onClick={() => setSubTab('Komunitas')}
              aria-selected={subTab === 'Komunitas'}
              aria-controls="feed-list-container"
              className={`relative z-10 flex h-7 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors duration-150 before:absolute before:-inset-y-2 before:inset-x-0 ${
                subTab === 'Komunitas'
                  ? 'text-[#EBF0EB]'
                  : 'text-[#C8D3C8] hover:text-[#EBF0EB]'
              }`}
            >
              Komunitas
            </button>
          </div>

          <button
            type="button"
            id="btn-tambah-foto-aktivitas"
            onClick={handleCreatePostClick}
            title="Posting foto aktivitas perjalanan"
            aria-label="Posting foto perjalanan"
            style={{
              backgroundColor: 'rgba(235, 240, 235, 0.08)',
              borderColor: 'rgba(235, 240, 235, 0.16)',
            }}
            className="relative inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[rgba(235,240,235,0.14)] active:scale-[0.97] before:absolute before:-inset-y-1 before:inset-x-0"
          >
            <CameraIcon className="h-3.5 w-3.5 text-[#E2D7B5]" />
            <span>+ Post</span>
          </button>
        </div>

        {/* Feed Section */}
        <section
          id="feed-list-container"
          aria-label="Daftar postingan aktivitas"
          className="mt-5"
        >
          {subTab === 'Kamu' && !isLoggedIn ? (
            <div
              key="empty-kamu"
              className="animate-tab-enter rounded-3xl border border-white/[0.14] bg-[#233020] px-6 py-12 text-center shadow-sm"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.14] bg-[#1B261B] text-[#E2D7B5] shadow-sm">
                <CameraIcon className="h-8 w-8" />
              </div>
              <h2 className="text-[18px] font-bold tracking-tight text-[#EBF0EB]">
                Aktivitas Perjalanan Anda
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[#C8D3C8]">
                Masuk untuk melihat dan membagikan dokumentasi perjalanan wisata pribadi Anda di Bogor.
              </p>
              <button
                type="button"
                onClick={onRequireLogin}
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#EBF0EB] px-6 py-2.5 text-[13px] font-bold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
              >
                Masuk ke akun
              </button>
            </div>
          ) : isLoading && currentFeed.length === 0 ? (
            <div
              className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
              aria-live="polite"
            >
              {[1, 2, 3].map((skeleton) => (
                <div
                  key={skeleton}
                  className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#233020] p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#2E3E2A]" />
                    <div className="h-3.5 w-32 rounded bg-[#2E3E2A]" />
                  </div>
                  <div className="aspect-[16/10] w-full rounded-xl bg-[#1B261B]" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-[#2E3E2A]" />
                </div>
              ))}
            </div>
          ) : hasError && currentFeed.length === 0 ? (
            <div className="rounded-2xl border border-rose-400/25 bg-[#2a1216] p-6 text-center">
              <p className="text-[15px] font-semibold text-[#EBF0EB]">
                Aktivitas belum bisa dimuat
              </p>
              <p className="mt-1 text-[12.5px] text-rose-100/85">
                Periksa sambungan ke server backend lalu coba muat ulang.
              </p>
              <button
                type="button"
                onClick={() => setReloadTick((prev) => prev + 1)}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.2] bg-white/[0.1] px-4 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors hover:bg-white/[0.18]"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                <span>Muat ulang</span>
              </button>
            </div>
          ) : (
            <div key={subTab} className="animate-tab-enter">
              <h2 className="mb-4 text-[14px] font-semibold tracking-tight text-[#C8D3C8]">
                {subTab === 'Kamu'
                  ? `${myActivities.length} aktivitas Anda bulan ini`
                  : `${communityActivities.length} cerita perjalanan komunitas`}
              </h2>

              {currentFeed.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.14] bg-[#233020] px-6 py-10 text-center">
                  <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.14] bg-[#1B261B] text-[#E2D7B5]">
                    {subTab === 'Kamu' ? (
                      <CameraIcon className="h-7 w-7" />
                    ) : (
                      <CompassIcon className="h-7 w-7" duotone />
                    )}
                  </div>
                  <p className="text-[15px] font-bold text-[#EBF0EB]">
                    {subTab === 'Kamu'
                      ? 'Belum Ada Postingan Aktivitas'
                      : 'Belum Ada Postingan Komunitas'}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-[#C8D3C8]">
                    {subTab === 'Kamu'
                      ? 'Ketuk tombol + Post di atas untuk membagikan pengalaman wisata pertama Anda.'
                      : 'Belum ada kiriman perjalanan dari komunitas saat ini.'}
                  </p>
                  {subTab === 'Kamu' && (
                    <button
                      type="button"
                      onClick={handleCreatePostClick}
                      className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#EBF0EB] px-5 py-2.5 text-[12.5px] font-bold text-[#161E16] shadow-sm transition-colors hover:bg-[#DCE4DC]"
                    >
                      <CameraIcon className="h-4 w-4" />
                      <span>Bagikan Foto Pertama</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {currentFeed.map((post) => {
                    const canDelete =
                      !post.isOtherUser ||
                      (currentUser &&
                        ((post.userId && Number(post.userId) === Number(currentUser.id)) ||
                          post.userName === currentUser.name))

                    return (
                      <article
                        key={post.id}
                        className="group flex h-full min-w-0 flex-col rounded-2xl border border-white/[0.14] bg-[#233020] p-3.5 text-left shadow-sm transition-colors duration-150 hover:border-white/[0.26] sm:p-4"
                      >
                        {/* Header Post: Author, Date, and Delete Button */}
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAuthorProfile(post)}
                            title={`Lihat profil ${post.userName}`}
                            className="flex min-w-0 items-center gap-2.5 rounded-xl py-0.5 pr-1 text-left transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
                          >
                            <SafeImage
                              src={post.userAvatar}
                              fallback={DEFAULT_AVATAR_PLACEHOLDER}
                              alt={post.userName}
                              className="h-9 w-9 shrink-0 rounded-full border border-white/[0.2] object-cover shadow-sm"
                              loading="lazy"
                              decoding="async"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-[#EBF0EB]">
                                <span className="truncate group-hover:underline">{post.userName}</span>
                                {post.isOtherUser && (
                                  <span className="shrink-0 text-[11px] font-medium text-[#E2D7B5]">
                                    (Lihat profil)
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-[#C8D3C8]">
                                {post.date}
                              </span>
                            </span>
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPostToDelete(post.id)
                              }}
                              title="Hapus aktivitas saya"
                              aria-label="Hapus aktivitas ini"
                              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#C8D3C8] transition-colors hover:bg-white/[0.08] hover:text-rose-300 active:scale-95 before:absolute before:-inset-1"
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
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/[0.1] bg-[#1B261B]">
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
                        <div className="mt-3 flex flex-1 flex-col">
                          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                            {post.title}
                          </h3>
                          <p className="mt-auto flex items-center gap-1.5 pt-2 text-[12px] text-[#C8D3C8]">
                            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[#E2D7B5]" />
                            <span className="truncate">{post.location}</span>
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal Form: "+ Post" / "Posting Foto Perjalanan" (Liquid Glass) */}
      <GlassModal
        isOpen={showPostModal}
        onClose={handleClosePostModal}
        overlayId="modal-post-foto-overlay"
        modalId="modal-post-foto"
        closeButtonId="btn-close-post-foto"
        titleId="modal-post-foto-title"
        closeAriaLabel="Tutup modal posting"
        maxWidthClass="max-w-md"
      >
        <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#E2D7B5] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.22)]">
          <CameraIcon className="h-6 w-6" />
        </div>

        <h3
          id="modal-post-foto-title"
          className="text-center text-[19px] font-bold tracking-tight text-white"
        >
          Posting Foto Perjalanan
        </h3>
        <p className="mt-1 text-center text-[12.5px] text-[#E2EAE2]">
          Bagikan pengalaman wisatamu ke komunitas Sabah Bogor
        </p>

        <form onSubmit={handlePostSubmit} className="mt-5 flex flex-col gap-3.5">
          <div>
            <label
              htmlFor="input-file-activity-photo"
              className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]"
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
            <button
              type="button"
              id="dropzone-activity-photo"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.16] bg-white/[0.06] p-3 text-center transition-colors duration-150 hover:border-[#E2D7B5]/70 hover:bg-white/[0.1]"
            >
              {uploadedImagePreview ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
                  <img
                    src={uploadedImagePreview}
                    alt="Preview Foto"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2 right-2 rounded-lg border border-white/[0.2] bg-[#161E16]/85 px-2.5 py-1 text-[11px] font-semibold text-[#EBF0EB]">
                    Ganti Foto
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-3">
                  <CameraIcon className="h-7 w-7 text-[#E2D7B5]" />
                  <span className="text-[13px] font-bold text-[#EBF0EB]">
                    Pilih foto dari galeri
                  </span>
                  <span className="text-[11.5px] text-[#C8D3C8]">
                    Ketuk untuk unggah gambar JPG/PNG
                  </span>
                </div>
              )}
            </button>
          </div>

          <div>
            <label
              htmlFor="input-post-location"
              className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]"
            >
              Lokasi Wisata
            </label>
            <input
              type="text"
              id="input-post-location"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              placeholder="Misal: Curug Cikuluwung"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#C8D3C8] transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label
              htmlFor="input-post-caption"
              className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]"
            >
              Cerita / Keterangan
            </label>
            <textarea
              id="input-post-caption"
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder="Tuliskan pengalaman seru di tempat ini..."
              rows={3}
              className="liquid-glass-input w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#C8D3C8] transition-colors duration-150"
              required
            />
          </div>

          <button
            type="submit"
            id="btn-submit-post-foto"
            disabled={isPosting}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#EBF0EB] py-2.5 text-[13px] font-bold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98] disabled:opacity-60"
          >
            {isPosting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#161E16] border-t-transparent" />
                <span>Mengunggah & Mengompresi...</span>
              </>
            ) : (
              'Bagikan ke Komunitas'
            )}
          </button>
        </form>
      </GlassModal>

      {/* Modal Konfirmasi Hapus Aktivitas (Liquid Glass) */}
      <GlassModal
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        overlayId="modal-delete-post-overlay"
        modalId="modal-delete-post"
        closeButtonId="btn-close-delete-post"
        titleId="modal-delete-title"
        closeAriaLabel="Tutup konfirmasi hapus aktivitas"
        maxWidthClass="max-w-xs"
      >
        <div className="text-center">
          <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/25 bg-[#3B1D24]/70 text-rose-200">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 id="modal-delete-title" className="text-[17px] font-bold text-[#EBF0EB]">
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
              onClick={confirmDeletePost}
              disabled={isDeleting}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-300/25 bg-[#3B1D24] py-2.5 text-[12.5px] font-bold text-rose-100 transition-colors hover:bg-[#4D242E] disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </GlassModal>

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
