import { memo, useState } from 'react'
import NotificationDrawer from '../ui/NotificationDrawer'

const DEFAULT_MY_ACTIVITIES = [
  {
    id: 'my-1',
    userName: 'Ambalingham',
    userAvatar: '/images/avatar-ambalingham.jpg',
    date: '1 sep',
    image: '/images/curug-cikuluwung.jpg',
    title: 'Perjalanan alam ke curug cikuluwung',
    location: 'Curug cikuluwung - Bogor selatan',
  },
  {
    id: 'my-2',
    userName: 'Ambalingham',
    userAvatar: '/images/avatar-ambalingham.jpg',
    date: '1 sep',
    image: '/images/curug-cikuluwung.jpg',
    title: 'Perjalanan alam ke curug cikuluwung',
    location: 'Curug cikuluwung - Bogor selatan',
  },
]

const DEFAULT_COMMUNITY_ACTIVITIES = [
  {
    id: 'com-1',
    userName: 'Kirk hasibuan',
    userAvatar: '/images/avatar-kirk.jpg',
    date: '1 sep',
    image: '/images/curug-cikuluwung.jpg',
    title: 'Perjalanan alam ke curug cikuluwung',
    location: 'Curug cikuluwung - Bogor selatan',
    isOtherUser: true,
  },
  {
    id: 'com-2',
    userName: 'Ambalingham',
    userAvatar: '/images/avatar-ambalingham.jpg',
    date: '1 sep',
    image: '/images/curug-cikuluwung.jpg',
    title: 'Perjalanan alam ke curug cikuluwung',
    location: 'Curug cikuluwung - Bogor selatan',
    isOtherUser: false,
  },
  {
    id: 'com-3',
    userName: 'Sarah Melati',
    userAvatar: '/images/avatar-ambalingham.jpg',
    date: '28 agt',
    image: '/images/curug-leuwi-hejo.jpg',
    title: 'Eksplorasi jernihnya Curug Leuwi Hejo',
    location: 'Curug Leuwi Hejo - Babakan Madang, Bogor',
    isOtherUser: true,
  },
]

function ActivitiesPage({ isLoggedIn, onRequireLogin, onOpenProfile }) {
  // SUB-TAB NAVIGATION: 'Kamu' vs 'Komunitas'
  const [subTab, setSubTab] = useState('Kamu')

  // 5. STATE NOTIFIKASI DRAWER
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)

  // 4. STATE POSTING FOTO DENGAN SIMULASI FILE UPLOAD
  const [myActivities, setMyActivities] = useState(DEFAULT_MY_ACTIVITIES)
  const [communityActivities, setCommunityActivities] = useState(DEFAULT_COMMUNITY_ACTIVITIES)

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

    const newPost = {
      id: `post-${Date.now()}`,
      userName: 'Ambalingham',
      userAvatar: '/images/avatar-ambalingham.jpg',
      date: 'Baru saja',
      image: uploadedImagePreview || '/images/curug-cikuluwung.jpg',
      title: postCaption.trim() || 'Perjalanan seru di alam Bogor',
      location: postLocation.trim() || 'Curug Cikuluwung',
      isOtherUser: false,
    }

    setMyActivities((prev) => [newPost, ...prev])
    setCommunityActivities((prev) => [newPost, ...prev])

    setShowPostModal(false)
    setPostCaption('')
    setUploadedImagePreview(null)
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
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 overflow-hidden bg-forest-700 hover:ring-2 hover:ring-white/40 active:scale-95 transition cursor-pointer shadow-sm"
            >
              <img
                src="/images/avatar-ambalingham.jpg"
                alt="Profil pengguna"
                className="h-full w-full object-cover"
              />
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
        className="flex-1 overflow-y-auto px-5 pt-4 pb-28 overscroll-contain"
      >
        <h2 className="text-[13px] font-semibold text-white/90 mb-4 tracking-tight">
          {subTab === 'Kamu'
            ? `${myActivities.length} Aktivitas Kamu Bulan Ini`
            : 'Temukan aktivitas lainnya disini'}
        </h2>

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
                    if (post.userName === 'Kirk hasibuan') {
                      onOpenProfile({
                        isSelf: false,
                        name: 'Kirk hasibuan',
                        avatar: post.userAvatar,
                      })
                    } else if (post.userName === 'Ambalingham') {
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
                className="flex items-center gap-3 mb-2.5 cursor-pointer hover:opacity-90 transition active:scale-[0.99] w-fit"
                title={`Lihat profil ${post.userName}`}
              >
                <img
                  src={post.userAvatar}
                  alt={post.userName}
                  className="h-9 w-9 rounded-full object-cover border border-white/20 shadow-sm"
                  loading="lazy"
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
              <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[20px] bg-black/20 shadow-md border border-white/10">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
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
                className="mt-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-2.5 text-[12px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30"
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
