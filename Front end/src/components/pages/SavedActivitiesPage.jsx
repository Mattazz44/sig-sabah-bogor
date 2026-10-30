import { memo, useEffect, useMemo, useState } from 'react'
import tourists from '../../data/tourists.json'
import CustomRoutePage from './CustomRoutePage'
import NotificationDrawer from '../ui/NotificationDrawer'

function SavedActivitiesPage({
  favorites = [],
  onSelectPlace,
  onStartCustomRoute,
  isLoggedIn = false,
  onRequireLogin,
  onOpenProfile,
}) {
  // SUB-VIEW STATE: null (grid folder) | 'recent' | 'favorites' | 'custom-route'
  const [activeFolderView, setActiveFolderView] = useState(null)
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)

  // 2. STATE MODAL "TAMBAH AKTIVITAS PERJALANAN BARU"
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')
  const [newActivityLocation, setNewActivityLocation] = useState('')

  // State daftar aktivitas tersimpan yang dibuat user
  const [userActivities, setUserActivities] = useState([])

  // Fetch daftar aktivitas dari API database HANYA JIKA LOGGED IN
  useEffect(() => {
    if (!isLoggedIn) return

    let isMounted = true
    fetch('/api/saved-activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (isMounted && Array.isArray(json?.data?.activities) && json.data.activities.length > 0) {
          setUserActivities(
            json.data.activities.map((a) => ({
              id: a.id,
              name: a.name,
              location: a.location,
              date: a.date_label || 'Baru saja',
            }))
          )
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat aktivitas tersimpan dari API, fallback ke default:', err)
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  const effectiveUserActivities = isLoggedIn ? userActivities : []

  // STATE DROPDOWN "URUTKAN"
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [sortOption, setSortOption] = useState('Terbaru')

  // 2. HANDLER TOMBOL TAMBAH (+):
  // Cek login -> jika false munculkan Log in page; jika true buka form "Tambah Aktivitas Perjalanan Baru"
  const handleAddPlusClick = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin()
    } else {
      setShowActivityModal(true)
    }
  }

  // SUBMIT FORM "TAMBAH AKTIVITAS PERJALANAN BARU"
  const handleActivitySubmit = (e) => {
    e.preventDefault()
    if (!newActivityName.trim() || !newActivityLocation.trim()) return

    const nameText = newActivityName.trim()
    const locText = newActivityLocation.trim()

    const newAct = {
      id: `act-${Date.now()}`,
      name: nameText,
      location: locText,
      date: 'Baru saja',
    }

    setUserActivities((prev) => [newAct, ...prev])

    // Kirim juga ke database backend
    fetch('/api/saved-activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: nameText,
        location: locText,
      }),
    }).catch((err) => {
      console.warn('Gagal menyimpan aktivitas ke server:', err)
    })

    setNewActivityName('')
    setNewActivityLocation('')
    setShowActivityModal(false)
  }

  // Filter dan sort places favorit berdasarkan opsi yang dipilih
  const favoritePlaces = useMemo(() => {
    const list = tourists.filter((t) => favorites.includes(t.slug))
    if (sortOption === 'Nama A-Z') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortOption === 'Terlama') {
      return [...list].reverse()
    }
    return list
  }, [favorites, sortOption])

  // Recently viewed preview items
  const recentPlaces = useMemo(() => [
    tourists.find((t) => t.slug === 'lawang-surya-kencana') || tourists[1],
    tourists.find((t) => t.slug === 'museum-peta') || tourists[3],
  ], [])

  // JIKA TAMPILAN AKTIF ADALAH RUTE CUSTOM
  if (activeFolderView === 'custom-route') {
    return (
      <CustomRoutePage
        onBack={() => setActiveFolderView(null)}
        onStartCustomRoute={onStartCustomRoute}
      />
    )
  }

  // 6. SUB-VIEW: DAFTAR TEMPAT WISATA "TERAKHIR DILIHAT" (LIST VIEW SEBELUM KE DETAIL)
  if (activeFolderView === 'recent') {
    return (
      <div className="h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-6 pb-28 max-w-md mx-auto overscroll-contain overflow-y-auto">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <button
            type="button"
            id="btn-back-recent-list"
            onClick={() => setActiveFolderView(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition text-white cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[19px] font-bold text-white tracking-tight">
              Terakhir Dilihat
            </h1>
            <p className="text-[11px] text-white/60">
              Daftar tempat wisata yang baru saja Anda buka
            </p>
          </div>
        </div>

        {/* List baris tempat wisata */}
        <div className="mt-5 flex flex-col gap-3.5">
          {recentPlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => onSelectPlace && onSelectPlace(place.slug)}
              className="flex items-center gap-3.5 rounded-2xl bg-forest-700/70 border border-white/10 p-3 shadow-md hover:bg-forest-700 hover:border-white/20 transition cursor-pointer active:scale-[0.99]"
            >
              <img
                src={place.image}
                alt={place.name}
                className="h-16 w-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-emerald-300">
                  {place.category}
                </span>
                <h3 className="text-[14px] font-bold text-white truncate">
                  {place.name}
                </h3>
                <p className="text-[11px] text-white/60 truncate mt-0.5">
                  ★ {place.rating} · {place.travelTime || '15 Menit'}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-emerald-600 transition"
              >
                →
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 6. SUB-VIEW: DAFTAR TEMPAT WISATA "FAVORIT" (LIST VIEW SEBELUM KE DETAIL)
  if (activeFolderView === 'favorites') {
    return (
      <div className="h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-6 pb-28 max-w-md mx-auto overscroll-contain overflow-y-auto">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <button
            type="button"
            id="btn-back-favorites-list"
            onClick={() => setActiveFolderView(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition text-white cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[19px] font-bold text-white tracking-tight">
              Tempat Wisata Favorit
            </h1>
            <p className="text-[11px] text-white/60">
              {favoritePlaces.length} tempat wisata favorit tersimpan
            </p>
          </div>
        </div>

        {favoritePlaces.length === 0 ? (
          <div className="mt-12 text-center text-white/60">
            <span className="text-4xl block mb-2">💚</span>
            <p className="text-[13px] font-semibold text-white">Belum Ada Wisata Favorit</p>
            <p className="text-[11px] mt-1 max-w-xs mx-auto">
              Simpan tempat wisata favoritmu dengan menekan ikon hati pada menu Explore!
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3.5">
            {favoritePlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => onSelectPlace && onSelectPlace(place.slug)}
                className="flex items-center gap-3.5 rounded-2xl bg-forest-700/70 border border-white/10 p-3 shadow-md hover:bg-forest-700 hover:border-white/20 transition cursor-pointer active:scale-[0.99]"
              >
                <img
                  src={place.image}
                  alt={place.name}
                  className="h-16 w-16 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-amber-300">
                    {place.category}
                  </span>
                  <h3 className="text-[14px] font-bold text-white truncate">
                    {place.name}
                  </h3>
                  <p className="text-[11px] text-white/60 truncate mt-0.5">
                    ★ {place.rating} · {place.distance}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-emerald-600 transition"
                >
                  →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // TAMPILAN UTAMA: GRID FOLDERS (Terakhir dilihat, Rute custom, Favorit)
  return (
    <div className="relative h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-7 pb-28 max-w-md mx-auto overscroll-contain overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Aktivitas Tersimpan
        </h1>
        <div className="flex items-center gap-2.5">
          {/* 2. TOMBOL TAMBAH (+): Gated dengan status isLoggedIn */}
          <button
            type="button"
            id="btn-add-activity"
            onClick={handleAddPlusClick}
            title="Tambah Aktivitas Perjalanan Baru"
            aria-label="Tambah aktivitas"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 bg-white/10 hover:bg-white/20 active:scale-95 transition cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* 5. TOMBOL NOTIFIKASI */}
          <button
            type="button"
            id="btn-notifikasi-saved"
            onClick={() => setShowNotificationDrawer(true)}
            title="Notifikasi"
            aria-label="Lihat notifikasi"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition cursor-pointer"
          >
            <svg
              width="18"
              height="18"
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

          {/* Profil Button */}
          <button
            type="button"
            id="btn-user-profile"
            onClick={() => {
              if (!isLoggedIn) {
                if (onRequireLogin) onRequireLogin()
              } else if (onOpenProfile) {
                onOpenProfile('self')
              }
            }}
            aria-label="Profil pengguna"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/90 transition hover:bg-white/10 active:scale-95 cursor-pointer overflow-hidden"
          >
            {isLoggedIn ? (
              <img
                src="/images/avatar-ambalingham.jpg"
                alt="Avatar"
                className="h-full w-full rounded-full object-cover"
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

      {/* DROPDOWN "URUTKAN" & FLOATING POPOVER MENU */}
      <div className="relative mt-4 inline-block">
        <button
          type="button"
          id="btn-sort-saved"
          onClick={() => setShowSortMenu((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-[11px] font-medium text-white transition hover:bg-white/30 cursor-pointer active:scale-95 shadow-sm"
        >
          <span>Urutkan: {sortOption}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showSortMenu && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowSortMenu(false)}
            />
            <div
              id="popover-sort-menu"
              className="absolute left-0 top-9 z-30 w-36 rounded-2xl bg-forest-700/95 backdrop-blur-md p-1.5 shadow-2xl border border-white/15 text-[11px] animate-in fade-in zoom-in-95 duration-150"
            >
              {['Terbaru', 'Terlama', 'Nama A-Z'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  id={`sort-option-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => {
                    setSortOption(opt)
                    setShowSortMenu(false)
                  }}
                  className={`w-full rounded-xl px-3 py-1.5 text-left transition cursor-pointer flex items-center justify-between ${
                    sortOption === opt
                      ? 'bg-white/20 font-bold text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt}</span>
                  {sortOption === opt && (
                    <span className="text-emerald-300 text-[10px]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Grid of Folders */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* 6. FOLDER 1: Terakhir dilihat (KLIK MEMBUKA DAFTAR LIST TERLEBIH DAHULU) */}
        <div
          role="button"
          tabIndex={0}
          id="folder-terakhir-dilihat"
          onClick={() => setActiveFolderView('recent')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveFolderView('recent')}
          className="group flex flex-col text-left cursor-pointer focus-visible:outline-none"
        >
          <div className="aspect-square w-full rounded-2xl bg-white/5 border border-white/10 p-2 grid grid-cols-2 gap-1.5 transition-transform duration-200 group-hover:scale-[1.02] shadow-sm">
            <img
              src={recentPlaces[0].image}
              alt={recentPlaces[0].name}
              className="h-full w-full rounded-lg object-cover"
            />
            <img
              src={recentPlaces[1].image}
              alt={recentPlaces[1].name}
              className="h-full w-full rounded-lg object-cover"
            />
            <div className="h-full w-full rounded-lg bg-white/10" />
            <div className="h-full w-full rounded-lg bg-white/10" />
          </div>
          <h3 className="mt-2.5 text-[14px] font-semibold text-white group-hover:text-amber-200 transition-colors flex items-center justify-between">
            <span>Terakhir dilihat</span>
            <span className="text-white/40 group-hover:text-white transition">→</span>
          </h3>
          <p className="text-[11px] text-white/60">2 tempat wisata</p>
        </div>

        {/* FOLDER 2: Rute custom (MEMBUKA DAFTAR LIST RUTE CUSTOM) */}
        <div
          role="button"
          tabIndex={0}
          id="folder-rute-custom"
          onClick={() => {
            if (!isLoggedIn) {
              if (onRequireLogin) onRequireLogin()
            } else {
              setActiveFolderView('custom-route')
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!isLoggedIn) {
                if (onRequireLogin) onRequireLogin()
              } else {
                setActiveFolderView('custom-route')
              }
            }
          }}
          className="group flex flex-col text-left cursor-pointer focus-visible:outline-none"
        >
          <div className="aspect-square w-full rounded-2xl bg-white/5 border border-white/10 p-2 grid grid-cols-2 gap-1.5 transition-transform duration-200 group-hover:scale-[1.02] group-hover:border-emerald-400/40 shadow-sm relative overflow-hidden">
            <div className="h-full w-full rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-[16px]">🗺️</span>
            </div>
            <div className="h-full w-full rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-[16px]">📍</span>
            </div>
            <div className="h-full w-full rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-[16px]">🚩</span>
            </div>
            <div className="h-full w-full rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-[16px]">🧭</span>
            </div>

            <div className="absolute inset-x-2 bottom-2 rounded-lg bg-forest-900/90 py-1 text-center backdrop-blur-sm border border-white/10">
              <span className="text-[9px] font-semibold text-emerald-300">
                {isLoggedIn ? '2 Rute Tersedia' : 'Perlu Login'}
              </span>
            </div>
          </div>
          <h3 className="mt-2.5 text-[14px] font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
            <span>Rute custom</span>
            <span className="text-white/40 group-hover:text-white transition">→</span>
          </h3>
          <p className="text-[11px] text-white/60">
            {isLoggedIn ? '2 rute perjalanan' : 'Masuk untuk akses'}
          </p>
        </div>

        {/* 6. FOLDER 3: Favorit (KLIK MEMBUKA DAFTAR LIST WISATA FAVORIT TERLEBIH DAHULU) */}
        <div
          role="button"
          tabIndex={0}
          id="folder-favorit"
          onClick={() => setActiveFolderView('favorites')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveFolderView('favorites')}
          className="group flex flex-col text-left cursor-pointer focus-visible:outline-none"
        >
          <div className="aspect-square w-full rounded-2xl bg-white/5 border border-white/10 p-2 grid grid-cols-2 gap-1.5 transition-transform duration-200 group-hover:scale-[1.02] shadow-sm">
            {favoritePlaces.slice(0, 4).map((place) => (
              <img
                key={place.id}
                src={place.image}
                alt={place.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ))}
            {Array.from({ length: Math.max(0, 4 - favoritePlaces.length) }).map((_, i) => (
              <div key={i} className="h-full w-full rounded-lg bg-white/10" />
            ))}
          </div>
          <h3 className="mt-2.5 text-[14px] font-semibold text-white group-hover:text-amber-200 transition-colors flex items-center justify-between">
            <span>Favorit</span>
            <span className="text-white/40 group-hover:text-white transition">→</span>
          </h3>
          <p className="text-[11px] text-white/60">{favoritePlaces.length} tempat wisata</p>
        </div>
      </div>

      {/* SECTION: AKTIVITAS PERJALANAN USER (HANYA DITAMPILKAN JIKA SUDAH LOGIN) */}
      {!isLoggedIn ? (
        <div className="mt-8 rounded-2xl bg-forest-700/40 border border-white/10 p-5 text-center">
          <p className="text-[12px] text-white/70">
            Masuk untuk menyimpan catatan perjalanan dan mengakses riwayat aktivitas wisata Anda.
          </p>
          <button
            type="button"
            onClick={onRequireLogin}
            className="mt-3.5 inline-block rounded-xl bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 px-5 py-2 text-[12px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30"
          >
            Masuk ke Akun
          </button>
        </div>
      ) : effectiveUserActivities.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-white tracking-tight">
              Aktivitas Perjalanan Saya
            </h3>
            <span className="text-[11px] text-white/60">
              {effectiveUserActivities.length} tercatat
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {effectiveUserActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between rounded-2xl bg-forest-700/60 border border-white/10 px-4 py-3"
              >
                <div>
                  <h4 className="text-[13px] font-bold text-white">{act.name}</h4>
                  <p className="text-[11px] text-emerald-300 mt-0.5">
                    📍 {act.location}
                  </p>
                </div>
                <span className="text-[10px] text-white/50">{act.date}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl bg-forest-700/40 border border-white/10 p-4 text-center">
          <p className="text-[11px] text-white/60">
            Belum ada aktivitas perjalanan tersimpan. Klik tombol (+) di atas untuk menambahkan.
          </p>
        </div>
      )}

      {/* 2. MODAL FORM: "TAMBAH AKTIVITAS PERJALANAN BARU" */}
      {showActivityModal && (
        <div
          id="modal-tambah-aktivitas-overlay"
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            id="modal-tambah-aktivitas"
            className="relative w-full max-w-xs rounded-3xl bg-forest-900 border border-white/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              id="btn-close-activity-modal"
              onClick={() => setShowActivityModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xl shadow-inner">
              ✨
            </div>

            <h3 className="text-[18px] font-bold text-white tracking-tight text-center">
              Tambah Aktivitas Perjalanan Baru
            </h3>
            <p className="text-[11px] text-white/60 text-center mt-1">
              Catat dan simpan rencana aktivitas wisata Anda
            </p>

            <form onSubmit={handleActivitySubmit} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1">
                  Nama Aktivitas
                </label>
                <input
                  type="text"
                  id="input-activity-name"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  placeholder="Contoh: Bersepeda di Kebun Raya"
                  className="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3 py-2 text-[12px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1">
                  Lokasi Wisata
                </label>
                <input
                  type="text"
                  id="input-activity-location"
                  value={newActivityLocation}
                  onChange={(e) => setNewActivityLocation(e.target.value)}
                  placeholder="Contoh: Kebun Raya Bogor"
                  className="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3 py-2 text-[12px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 py-2.5 text-[12px] font-semibold text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-activity"
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-2.5 text-[12px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DRAWER NOTIFIKASI */}
      <NotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
      />
    </div>
  )
}

export default memo(SavedActivitiesPage)
