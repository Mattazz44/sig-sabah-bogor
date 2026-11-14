import { memo, useEffect, useRef, useState } from 'react'
import NotificationDrawer from '../ui/NotificationDrawer'
import SafeImage from '../ui/SafeImage'
import { BellIcon, CameraIcon, RefreshIcon, UserIcon, XIcon } from '../ui/VectorIcons'
import { apiFetch } from '../../utils/api'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'

function ActivitiesPage({
  tourists = [],
  favorites = [],
  recentSlugs = [],
  onSelectPlace,
  isLoggedIn,
  currentUser = null,
  onRequireLogin,
  onOpenProfile,
}) {
  const [subTab, setSubTab] = useState('Kamu')
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  const [feedState, setFeedState] = useState({
    loaded: false,
    my: [],
    community: [],
    error: false,
  })
  const [localPosts, setLocalPosts] = useState([])

  useEffect(() => {
    let isMounted = true
    apiFetch('/api/activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (!isMounted) return
        const rows = Array.isArray(json?.data) ? json.data : []
        const mapPost = (item) => ({
          id: item.id,
          userName: item.user_name,
          userAvatar: item.user_avatar,
          date: item.date,
          image: item.image,
          title: item.title,
          location: item.location,
          isOtherUser: item.is_other_user,
        })
        const my = isLoggedIn ? rows.filter((item) => !item.is_community).map(mapPost) : []
        const community = rows.filter((item) => item.is_community).map(mapPost)
        setFeedState({
          loaded: true,
          my,
          community,
          error: false,
        })
      })
      .catch(() => {
        if (!isMounted) return
        setFeedState({
          loaded: true,
          my: [],
          community: [],
          error: true,
        })
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, reloadTick])

  const [showPostModal, setShowPostModal] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [postLocation, setPostLocation] = useState('')
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null)

  const fileInputRef = useRef(null)
  const objectUrlsRef = useRef(new Set())

  useEffect(() => {
    const urls = objectUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  useEffect(() => {
    if (!showPostModal) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowPostModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPostModal])

  const myActivities = isLoggedIn ? [...localPosts, ...feedState.my] : []
  const communityActivities = [...localPosts, ...feedState.community]
  const currentFeed = subTab === 'Kamu' ? myActivities : communityActivities

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
    if (uploadedImagePreview && objectUrlsRef.current.has(uploadedImagePreview)) {
      URL.revokeObjectURL(uploadedImagePreview)
      objectUrlsRef.current.delete(uploadedImagePreview)
    }
    const previewUrl = URL.createObjectURL(file)
    objectUrlsRef.current.add(previewUrl)
    setUploadedImagePreview(previewUrl)
  }

  const handleClosePostModal = () => {
    if (uploadedImagePreview && objectUrlsRef.current.has(uploadedImagePreview)) {
      URL.revokeObjectURL(uploadedImagePreview)
      objectUrlsRef.current.delete(uploadedImagePreview)
    }
    setUploadedImagePreview(null)
    setShowPostModal(false)
  }

  const handlePostSubmit = (e) => {
    e.preventDefault()

    const titleText = postCaption.trim()
    const locText = postLocation.trim()
    if (!titleText || !locText) return

    const imgUrl = uploadedImagePreview || ''
    const authorName = currentUser?.name || 'Pengguna'

    const newPost = {
      id: `post-${Date.now()}`,
      userName: authorName,
      userAvatar: currentUser?.avatar || '',
      date: 'Baru saja',
      image: imgUrl,
      title: titleText,
      location: locText,
      isOtherUser: false,
    }

    setLocalPosts((prev) => [newPost, ...prev])

    apiFetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        title: titleText,
        location: locText,
        image: imgUrl,
        user_name: authorName,
        user_avatar: currentUser?.avatar || '',
        is_community: false,
      }),
    }).catch((err) => {
      console.warn('Gagal menyimpan postingan aktivitas ke server:', err)
    })

    setShowPostModal(false)
    setPostCaption('')
    setPostLocation('')
    setUploadedImagePreview(null)
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
        ) : !feedState.loaded ? (
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
        ) : feedState.error && currentFeed.length === 0 ? (
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
                    <button
                      type="button"
                      onClick={() => handleOpenAuthorProfile(post)}
                      title={`Lihat profil ${post.userName}`}
                      className="mb-2.5 flex w-fit items-center gap-3 rounded-xl py-1 pr-2 text-left transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
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
                        <span className="text-[13px] font-semibold leading-tight text-[#EBF0EB] group-hover:underline">
                          {post.userName}
                        </span>
                        <span className="mt-0.5 text-[11.5px] leading-tight text-[#C8D3C8]">
                          {post.date}
                        </span>
                      </span>
                    </button>

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

                    <div className="mt-2.5">
                      <h3 className="text-[13.5px] font-bold leading-snug text-[#EBF0EB]">
                        {post.title}
                      </h3>
                      <p className="mt-0.5 text-[12px] leading-tight text-[#C8D3C8]">
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

      {/* Modal Posting Foto Perjalanan */}
      {showPostModal && (
        <div
          id="modal-post-foto-overlay"
          onClick={handleClosePostModal}
          className="animate-backdrop-fade fixed inset-0 z-[1500] flex items-center justify-center bg-black/65 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-pop relative max-h-[90vh] w-full max-w-xs overflow-y-auto rounded-3xl border border-[#EBF0EB]/18 bg-[#1B251B] p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleClosePostModal}
              aria-label="Tutup modal posting foto"
              className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
            >
              <XIcon className="h-4 w-4" />
            </button>

            <h2
              id="post-modal-title"
              className="-mt-2 text-center text-[17px] font-bold tracking-tight text-[#EBF0EB]"
            >
              Posting foto perjalanan
            </h2>
            <p className="mt-1 text-center text-[12px] text-[#C8D3C8]">
              Bagikan pengalaman wisata Anda ke komunitas
            </p>

            <form onSubmit={handlePostSubmit} className="mt-4 flex flex-col gap-3">
              <div>
                <span className="mb-1.5 block text-[12px] font-semibold text-[#EBF0EB]">
                  Foto aktivitas
                </span>
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
                  className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EBF0EB]/25 bg-[#233020] p-3 text-center transition-colors hover:border-[#E2D7B5]"
                >
                  {uploadedImagePreview ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl shadow">
                      <img
                        src={uploadedImagePreview}
                        alt="Pratinjau foto aktivitas"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2 right-2 rounded-lg border border-[#EBF0EB]/20 bg-[#1B251B]/95 px-2.5 py-0.5 text-[10px] font-medium text-[#EBF0EB]">
                        Ganti foto
                      </span>
                    </div>
                  ) : (
                    <span className="flex flex-col items-center gap-2 py-3 text-[#E2D7B5]">
                      <CameraIcon className="h-7 w-7" />
                      <span className="text-[12.5px] font-semibold text-[#EBF0EB]">
                        Pilih foto dari perangkat
                      </span>
                      <span className="text-[11px] text-[#C8D3C8]">
                        Format JPG atau PNG
                      </span>
                    </span>
                  )}
                </button>
              </div>

              <div>
                <label
                  htmlFor="input-post-location"
                  className="mb-1.5 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Lokasi wisata
                </label>
                <input
                  id="input-post-location"
                  type="text"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="Contoh: Kebun Raya Bogor"
                  className="min-h-[44px] w-full rounded-xl border border-[#EBF0EB]/18 bg-[#121812] px-3.5 py-2 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] focus:border-[#E2D7B5]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="input-post-caption"
                  className="mb-1.5 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Cerita atau keterangan
                </label>
                <textarea
                  id="input-post-caption"
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Tuliskan pengalaman Anda di tempat ini..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#EBF0EB]/18 bg-[#121812] px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] focus:border-[#E2D7B5]"
                  required
                />
              </div>

              <button
                type="submit"
                id="btn-submit-post-foto"
                className="mt-2 min-h-[44px] w-full rounded-xl bg-[#EBF0EB] py-2.5 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
              >
                Bagikan ke komunitas
              </button>
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

export default memo(ActivitiesPage)
