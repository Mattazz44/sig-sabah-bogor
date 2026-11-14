import { memo, useEffect, useState } from 'react'
import NotificationDrawer from '../ui/NotificationDrawer'
import SafeImage from '../ui/SafeImage'
import { BellIcon, CameraIcon, XIcon } from '../ui/VectorIcons'
import { apiFetch } from '../../utils/api'
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
          const my = json.data.filter((item) => !item.is_community)
          const com = json.data.filter((item) => item.is_community)
          
          // Aktivitas Kamu HANYA ada jika pengguna sedang logged in
          if (isLoggedIn && my.length > 0) {
            setMyActivities(my.map((m) => ({
              id: m.id,
              userName: m.user_name,
              userAvatar: m.user_avatar,
              date: m.date,
              image: m.image,
              title: m.title,
              location: m.location,
              isOtherUser: m.is_other_user,
            })))
          } else if (!isLoggedIn) {
            setMyActivities([])
          }

          // Aktivitas Komunitas tetap bisa dilihat publik
          if (com.length > 0) {
            setCommunityActivities(com.map((c) => ({
              id: c.id,
              userName: c.user_name,
              userAvatar: c.user_avatar,
              date: c.date,
              image: c.image,
              title: c.title,
              location: c.location,
              isOtherUser: c.is_other_user,
            })))
          }
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
  }, [isLoggedIn])

  const [showPostModal, setShowPostModal] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [postLocation, setPostLocation] = useState('Curug Cikuluwung')
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null)

  const currentFeed = subTab === 'Kamu' ? myActivities : communityActivities

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
      const previewUrl = URL.createObjectURL(file)
      setUploadedImagePreview(previewUrl)
    }
  }

  // Submit posting foto ke feed
  const handlePostSubmit = (e) => {
    e.preventDefault()

    const titleText = postCaption.trim() || 'Perjalanan seru di alam Bogor'
    const locText = postLocation.trim() || 'Curug Cikuluwung'
    const imgUrl = uploadedImagePreview || ''

    const newPost = {
      id: `post-${Date.now()}`,
      userName: currentUser?.name || 'Ambalingham',
      userAvatar: currentUser?.avatar || '',
      date: 'Baru saja',
      image: imgUrl,
      title: titleText,
      location: locText,
      isOtherUser: false,
    }

    setMyActivities((prev) => [newPost, ...prev])
    setCommunityActivities((prev) => [newPost, ...prev])

    // Simpan juga ke database backend
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
        user_name: currentUser?.name || 'Ambalingham',
        user_avatar: currentUser?.avatar || '',
        is_community: false,
      }),
    }).catch((err) => {
      console.warn('Gagal menyimpan postingan aktivitas ke server:', err)
    })

    setShowPostModal(false)
    setPostCaption('')
    setUploadedImagePreview(null)
  }

  return (
    <div className="animate-tab-enter relative h-full w-full bg-forest-900 text-white flex flex-col overflow-hidden max-w-md mx-auto select-none">
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
              className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 active:scale-[0.97] px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-150 ease-out cursor-pointer border border-white/15"
            >
              <CameraIcon className="h-3.5 w-3.5" />
              <span>+ Post</span>
            </button>

            {/* 5. TOMBOL NOTIFIKASI AKTIF (BELL ICON) */}
            <button
              type="button"
              id="btn-notifikasi-aktivitas"
              onClick={() => setShowNotificationDrawer(true)}
              title="Lihat Notifikasi"
              aria-label="Notifikasi aktivitas"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer"
            >
              <BellIcon className="h-[19px] w-[19px]" />
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
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 overflow-hidden bg-forest-700 hover:ring-2 hover:ring-white/30 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer shadow-sm text-white/90"
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
          <div key="empty-kamu" className="animate-tab-enter mt-12 flex flex-col items-center justify-center text-center px-4">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#34462c]/80 border border-white/10 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(0,0,0,0.22)]">
              <CameraIcon className="h-9 w-9" />
            </div>
            <h2 className="text-[17px] font-bold text-white tracking-tight">
              Aktivitas Perjalanan Kamu
            </h2>
            <p className="mt-2 text-[12.5px] text-white/65 max-w-xs leading-relaxed">
              Masuk dengan akun Anda untuk melihat dan membagikan dokumentasi aktivitas wisata pribadi Anda di Bogor.
            </p>
            <button
              type="button"
              onClick={onRequireLogin}
              className="mt-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] px-6 py-3 text-[13px] font-semibold text-white border border-white/15 shadow-[0_6px_16px_rgba(5,150,105,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-150 ease-out cursor-pointer"
            >
              Masuk ke Akun
            </button>
          </div>
        ) : (
          <div key={subTab} className="animate-tab-enter">
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
                    {/* Header Post: Avatar, nama, tanggal */}
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
                      className="flex items-center gap-3 mb-2.5 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-transform duration-150 w-fit"
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
                          {post.userName === 'Kirk hasibuan' && (
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
          </div>
        )}
      </section>

      {/* 4. MODAL FORM: "POSTING FOTO PERJALANAN" DENGAN DROPZONE UPLOAD FOTO HP */}
      {showPostModal && (
        <div
          id="modal-post-foto-overlay"
          onClick={() => setShowPostModal(false)}
          className="animate-backdrop-fade fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-pop relative w-full max-w-xs rounded-3xl bg-[#253320] border border-white/10 p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setShowPostModal(false)}
              aria-label="Tutup modal posting foto"
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/15 active:scale-[0.97] transition-all duration-150 cursor-pointer"
            >
              <XIcon className="h-3.5 w-3.5" />
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
                    <div className="flex flex-col items-center gap-2 py-3 text-emerald-300">
                      <CameraIcon className="h-7 w-7" />
                      <p className="text-[12px] font-semibold text-white">
                        Pilih foto dari galeri HP
                      </p>
                      <p className="text-[10px] text-white/55">
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
                className="mt-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] py-2.5 text-[12px] font-semibold text-white shadow-[0_6px_16px_rgba(5,150,105,0.28)] transition-all duration-150 ease-out cursor-pointer border border-white/15"
              >
                Bagikan ke Komunitas
              </button>
            </form>
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
