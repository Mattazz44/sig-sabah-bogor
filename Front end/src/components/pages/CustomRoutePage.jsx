import { memo, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../utils/api'
import SafeImage from '../ui/SafeImage'
import { DEFAULT_AVATAR_PLACEHOLDER } from '../../utils/imageHelper'
import {
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  MapIcon,
  MapPinIcon,
  XIcon,
} from '../ui/VectorIcons'

<<<<<<< HEAD
function CustomRoutePage({
  tourists = [],
  favorites = [],
  userActivities = [],
  currentUser = null,
  onBack,
  onStartCustomRoute,
}) {
  // Destinasi bawaan yang diambil dari daftar tempat wisata backend
  const museumZoologi = tourists.find((t) => t.slug === 'museum-zoologi-bogor') || {
    id: 10,
    slug: 'museum-zoologi-bogor',
    name: 'Museum of zoology - Bogor Tengah',
    coordinates: { lat: -6.6014, lng: 106.7972 },
    image: '',
    travelTime: '7 Menit',
    distance: '2.5 KM',
  }

  const museumPeta = tourists.find((t) => t.slug === 'museum-peta') || {
    id: 4,
    slug: 'museum-peta',
    name: 'Museum PETA - Bogor Kota',
    coordinates: { lat: -6.5855, lng: 106.7947 },
    image: '',
    travelTime: '8 Menit',
    distance: '3 KM',
  }

  // Tempat wisata yang sudah di-save / disukai oleh pengguna:
  // 1. Dari daftar favorites (disukai lewat ikon bookmark di detail wisata & for-you)
  // 2. Dari daftar aktivitas / tempat tersimpan user di database (userActivities)
  const savedTouristSpots = useMemo(() => {
    if (!Array.isArray(tourists) || tourists.length === 0) return []

    const favSlugs = new Set(favorites || [])
    const savedSlugs = new Set()
    const savedNames = new Set()

    if (Array.isArray(userActivities)) {
      userActivities.forEach((act) => {
        if (act.spot_slug) savedSlugs.add(act.spot_slug)
        if (act.slug) savedSlugs.add(act.slug)
        if (act.name) savedNames.add(act.name.toLowerCase().trim())
        if (act.location) savedNames.add(act.location.toLowerCase().trim())
      })
    }

    return tourists.filter((place) => {
      if (favSlugs.has(place.slug) || favSlugs.has(String(place.id))) return true
      if (savedSlugs.has(place.slug) || savedSlugs.has(String(place.id))) return true
      if (savedNames.has(place.name.toLowerCase().trim())) return true
      for (const name of savedNames) {
        if (name && (place.name.toLowerCase().includes(name) || name.includes(place.name.toLowerCase()))) {
          return true
        }
      }
      return false
    })
  }, [tourists, favorites, userActivities])

  // 3. STATE DAFTAR RUTE CUSTOM (Dapat Ditambahkan Dinamis)
  const [customRoutesList, setCustomRoutesList] = useState([
    {
=======
function buildFallbackRoutes(tourists) {
  if (!Array.isArray(tourists) || tourists.length === 0) return []
  const museumZoologi = tourists.find((t) => t.slug === 'museum-zoologi-bogor')
  const museumPeta = tourists.find((t) => t.slug === 'museum-peta')
  const routes = []

  if (museumZoologi && museumPeta) {
    routes.push({
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
      id: 'cr-museum',
      title: 'Tur Edukasi: Museum of Zoology ke Museum PETA',
      desc: 'Rute sejarah dan edukasi di pusat Kota Bogor',
      isPrimary: true,
      stops: [
        {
          name: museumZoologi.name,
          type: 'Transit pertama',
          distance: museumZoologi.distance || 'Titik 1',
          place: museumZoologi,
        },
        {
          name: museumPeta.name,
          type: 'Destinasi akhir',
          distance: museumPeta.distance || 'Titik 2',
          place: museumPeta,
        },
      ],
      totalDistance:
        museumZoologi.distance || museumPeta.distance || `${tourists.length > 1 ? '2 titik' : '1 titik'}`,
      totalDuration: museumPeta.travelTime || 'Sesuai rute peta',
      places: [museumZoologi, museumPeta],
    })
  }

  return routes
}

function CustomRoutePage({ tourists = [], currentUser = null, onBack, onStartCustomRoute }) {
  const [routesState, setRoutesState] = useState(() => ({
    loaded: false,
    items: buildFallbackRoutes(tourists),
    error: false,
  }))

  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false)
  const [newRouteTitle, setNewRouteTitle] = useState('')
  const [selectedDestIds, setSelectedDestIds] = useState(() =>
    tourists.slice(0, 2).map((t) => t.id).filter(Boolean),
  )

  useEffect(() => {
    let isMounted = true
    apiFetch('/api/saved-activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (!isMounted) return
        if (Array.isArray(json?.data?.custom_routes)) {
          const mapped = json.data.custom_routes.map((cr) => {
            const stops = Array.isArray(cr.stops) ? cr.stops : []
            const places = stops.map((s) => s.place).filter(Boolean)
            return {
              id: cr.slug || `cr-${cr.id}`,
              title: String(cr.title || '').replace(/\s*➔\s*/g, ' ke '),
              desc: cr.desc || '',
              isPrimary: Boolean(cr.is_primary),
              stops,
              totalDistance: cr.total_distance || `${stops.length} titik`,
              totalDuration: cr.total_duration || 'Sesuai rute peta',
              places: places.length > 0 ? places : tourists.slice(0, 1),
            }
          })
          setRoutesState({ loaded: true, items: mapped, error: false })
        } else {
          setRoutesState((prev) => ({ ...prev, loaded: true, error: false }))
        }
      })
      .catch(() => {
        if (!isMounted) return
        setRoutesState((prev) => ({
          loaded: true,
          items: prev.items.length > 0 ? prev.items : buildFallbackRoutes(tourists),
          error: true,
        }))
      })

    return () => {
      isMounted = false
    }
  }, [tourists])

<<<<<<< HEAD
  // 3. STATE MODAL "RANCANG RUTE CUSTOM BARU"
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false)
  const [newRouteTitle, setNewRouteTitle] = useState('')
  const [selectedDestIds, setSelectedDestIds] = useState([])

  const handleOpenCreateModal = () => {
    if (savedTouristSpots.length >= 2) {
      setSelectedDestIds([savedTouristSpots[0].id, savedTouristSpots[1].id])
    } else if (savedTouristSpots.length === 1) {
      setSelectedDestIds([savedTouristSpots[0].id])
    } else {
      setSelectedDestIds([])
=======
  useEffect(() => {
    if (!showCreateRouteModal) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowCreateRouteModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCreateRouteModal])

  const openCreateModal = () => {
    if (selectedDestIds.length === 0 && tourists.length > 0) {
      setSelectedDestIds(tourists.slice(0, 2).map((t) => t.id).filter(Boolean))
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
    }
    setShowCreateRouteModal(true)
  }

  const handleToggleDest = (id) => {
    setSelectedDestIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id],
    )
  }

  const handleCreateRouteSubmit = (e) => {
    e.preventDefault()
    if (!newRouteTitle.trim() || selectedDestIds.length === 0) return

<<<<<<< HEAD
    const chosenPlaces = savedTouristSpots.filter((t) => selectedDestIds.includes(t.id))
=======
    const chosenPlaces = tourists.filter((t) => selectedDestIds.includes(t.id))
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
    if (chosenPlaces.length === 0) return

    const stopsFormatted = chosenPlaces.map((p, idx) => ({
      name: p.name,
      type:
        idx === 0
          ? 'Titik awal'
          : idx === chosenPlaces.length - 1
            ? 'Destinasi akhir'
            : `Transit ${idx}`,
      distance: p.distance || p.category,
      place: p,
    }))

    const newRoute = {
      id: `cr-${Date.now()}`,
      title: newRouteTitle.trim(),
      desc: 'Rute custom buatan Anda',
      isPrimary: false,
      stops: stopsFormatted,
      totalDistance: `${chosenPlaces.length} destinasi`,
      totalDuration: 'Dihitung di peta',
      places: chosenPlaces,
    }

    setRoutesState((prev) => ({
      ...prev,
      items: [newRoute, ...prev.items],
    }))

    apiFetch('/api/custom-routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        title: newRouteTitle.trim(),
        place_ids: selectedDestIds,
      }),
    }).catch((err) => {
      console.warn('Gagal menyimpan rute custom ke server:', err)
    })

    setNewRouteTitle('')
<<<<<<< HEAD
    setSelectedDestIds([])
=======
    setSelectedDestIds(tourists.slice(0, 2).map((t) => t.id).filter(Boolean))
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
    setShowCreateRouteModal(false)
  }

  const customRoutesList = routesState.items

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter mx-auto h-full min-h-0 w-full max-w-md overflow-y-auto overscroll-contain overscroll-y-contain bg-forest-900 px-5 pt-6 text-[#EBF0EB]"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            id="btn-back-custom-route"
            onClick={onBack}
            aria-label="Kembali ke aktivitas tersimpan"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-bold leading-tight tracking-tight text-[#EBF0EB]">
              Rute Custom
            </h1>
            <p className="text-[12px] text-[#C8D3C8]">
              Rute perjalanan tersimpan Anda
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-add-custom-route"
<<<<<<< HEAD
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3 py-1.5 text-[11px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30"
=======
          onClick={openCreateModal}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] px-3.5 py-2 text-[12px] font-semibold text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
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
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Buat rute</span>
        </button>
      </div>

      {/* Ringkasan Akun Terhubung */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] px-4 py-3">
        <div className="flex items-center gap-3">
          <SafeImage
            src={currentUser?.avatar}
            fallback={DEFAULT_AVATAR_PLACEHOLDER}
            alt="Foto profil pengguna"
            className="h-10 w-10 shrink-0 rounded-full border border-emerald-400/60 object-cover"
          />
          <div>
<<<<<<< HEAD
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-white">{currentUser?.name || 'Pengguna'}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 border border-emerald-400/30">
                Terhubung
=======
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#EBF0EB]">
                {currentUser?.name || 'Pengguna'}
              </span>
              <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                Aktif
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[#C8D3C8] tabular-nums">
              {!routesState.loaded
                ? 'Memuat daftar rute...'
                : `${customRoutesList.length} rute tersimpan`}
            </p>
          </div>
        </div>
      </div>

      {/* Daftar Rute Custom */}
      {!routesState.loaded && customRoutesList.length === 0 ? (
        <div className="mt-6 space-y-4">
          {[1, 2].map((skeleton) => (
            <div
              key={skeleton}
              className="h-44 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020]"
            />
          ))}
        </div>
      ) : customRoutesList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-6 text-center">
          <p className="text-[14px] font-semibold text-[#EBF0EB]">Belum ada rute custom</p>
          <p className="mt-1 text-[12px] text-[#C8D3C8]">
            Susun beberapa destinasi favorit dalam satu perjalanan menggunakan tombol Buat rute.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {customRoutesList.map((route) => (
            <article
              key={route.id}
              id={`card-${route.id}`}
              className={`flex flex-col rounded-2xl p-4 shadow-md transition-colors duration-150 ${
                route.isPrimary
                  ? 'border-2 border-emerald-400/45 bg-[#253422]'
                  : 'border border-[#EBF0EB]/12 bg-[#233020]'
              }`}
            >
              {/* Header Rute */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {route.isPrimary && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"
                        aria-hidden="true"
                      />
                    )}
                    <h2 className="text-[15px] font-bold text-[#EBF0EB]">{route.title}</h2>
                  </div>
                  {route.desc && (
                    <span className="mt-0.5 block text-[12px] text-[#C8D3C8]">{route.desc}</span>
                  )}
                </div>
                <span className="shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-200">
                  {route.stops.length} tujuan
                </span>
              </div>

              {/* Stepper Titik Lokasi */}
              <div className="my-3 flex flex-col gap-2.5 border-y border-[#EBF0EB]/12 py-3">
                {route.stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#161E16] shadow-sm ${
                        idx === 0
                          ? 'bg-emerald-300'
                          : idx === route.stops.length - 1
                            ? 'bg-rose-300'
                            : 'bg-[#E2D7B5]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[12px]">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-bold text-[#EBF0EB]">{stop.name}</span>
                        <span className="text-[11px] text-emerald-200">{stop.type}</span>
                      </div>
                      <span className="shrink-0 text-[11px] text-[#C8D3C8]">{stop.distance}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Rute */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 text-[12px] text-[#EBF0EB]">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-200">
                    <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{route.totalDistance}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#C8D3C8]">
                    <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{route.totalDuration}</span>
                  </span>
                </div>

                <button
                  type="button"
                  id={`btn-mulai-${route.id}`}
                  onClick={() => {
                    if (onStartCustomRoute && route.places) {
                      onStartCustomRoute(route.places.filter(Boolean))
                    }
                  }}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#EBF0EB] px-4 py-2 text-[12.5px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
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
                  <span>Mulai perjalanan</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Form Rancang Rute Custom Baru */}
      {showCreateRouteModal && (
        <div
          id="modal-rancang-rute-overlay"
          onClick={() => setShowCreateRouteModal(false)}
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/65 p-4 animate-backdrop-fade"
        >
          <div
            id="modal-rancang-rute"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-route-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-[#EBF0EB]/18 bg-[#1B251B] p-6 shadow-2xl animate-modal-pop"
          >
            <button
              type="button"
              id="btn-close-rancang-rute"
              onClick={() => setShowCreateRouteModal(false)}
              aria-label="Tutup dialog buat rute"
              className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97] before:absolute before:-inset-1"
            >
              <XIcon className="h-4 w-4" />
            </button>

            <div className="-mt-4 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#EBF0EB]/15 bg-[#253320] text-[#E2D7B5]">
              <MapIcon className="h-6 w-6" />
            </div>

            <h2
              id="create-route-modal-title"
              className="text-center text-[18px] font-bold tracking-tight text-[#EBF0EB]"
            >
              Rancang rute custom baru
            </h2>
            <p className="mt-1 text-center text-[12px] text-[#C8D3C8]">
              Pilih destinasi wisata untuk rute perjalanan Anda
            </p>

            <form onSubmit={handleCreateRouteSubmit} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label
                  htmlFor="input-new-route-title"
                  className="mb-1.5 block text-[12px] font-semibold text-[#EBF0EB]"
                >
                  Nama rute
                </label>
                <input
                  type="text"
                  id="input-new-route-title"
                  value={newRouteTitle}
                  onChange={(e) => setNewRouteTitle(e.target.value)}
                  placeholder="Contoh: Tur Budaya & Kebun Raya"
                  className="min-h-[44px] w-full rounded-xl border border-[#EBF0EB]/18 bg-[#121812] px-3.5 py-2 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] transition-colors focus:border-[#E2D7B5]"
                  required
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className="text-[11px] font-semibold text-white/80 block mb-1.5 flex items-center justify-between">
                  <span>Pilih Destinasi Singgah:</span>
                  <span className="text-[10px] text-emerald-300 font-normal">
                    {savedTouristSpots.length} Tempat Tersimpan
                  </span>
                </label>

                {savedTouristSpots.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {savedTouristSpots.map((place) => {
                      const isChecked = selectedDestIds.includes(place.id)
                      return (
                        <div
                          key={place.id}
                          onClick={() => handleToggleDest(place.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-600/25 border-emerald-400/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <SafeImage
                              src={place.image}
                              alt={place.name}
                              className="h-9 w-9 rounded-lg object-cover shrink-0"
                            />
                            <div className="truncate text-left">
                              <p className="text-[12px] font-bold text-white truncate">
                                {place.name}
                              </p>
                              <span className="text-[10px] text-white/60">
                                {place.category}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'border-white/30 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/20 p-4 text-center bg-white/5">
                    <p className="text-[12px] text-white/80 font-medium">
                      Belum ada tempat wisata yang disimpan / disukai.
                    </p>
                    <p className="text-[10px] text-white/50 mt-1">
                      Silakan simpan tempat wisata terlebih dahulu melalui tombol simpan/suka untuk dapat merancang rute perjalanan.
                    </p>
                  </div>
                )}
=======
                <p className="mb-1.5 block text-[12px] font-semibold text-[#EBF0EB]">
                  Pilih destinasi singgah:
                </p>
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                  {tourists.slice(0, 7).map((place) => {
                    const isChecked = selectedDestIds.includes(place.id)
                    return (
                      <button
                        key={place.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        onClick={() => handleToggleDest(place.id)}
                        className={`flex min-h-[52px] w-full items-center justify-between rounded-xl border p-2.5 text-left transition-colors ${
                          isChecked
                            ? 'border-emerald-400/50 bg-[#253B27]'
                            : 'border-[#EBF0EB]/12 bg-[#233020] hover:bg-[#2B3B28]'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <SafeImage
                            src={place.image}
                            alt={place.name}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-bold text-[#EBF0EB]">
                              {place.name}
                            </p>
                            <span className="block text-[11px] text-[#C8D3C8]">
                              {place.category}
                            </span>
                          </div>
                        </div>

                        <span
                          aria-hidden="true"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            isChecked
                              ? 'border-emerald-300 bg-emerald-400 text-[#161E16]'
                              : 'border-[#EBF0EB]/35 text-transparent'
                          }`}
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    )
                  })}
                </div>
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRouteModal(false)}
                  className="min-h-[44px] flex-1 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] py-2.5 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-new-custom-route"
<<<<<<< HEAD
                  disabled={savedTouristSpots.length === 0 || selectedDestIds.length === 0}
                  className={`flex-1 rounded-xl py-2.5 text-[12px] font-bold text-white shadow-md transition cursor-pointer border ${
                    savedTouristSpots.length === 0 || selectedDestIds.length === 0
                      ? 'bg-gray-600/50 border-gray-500/30 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 border-emerald-400/30'
                  }`}
=======
                  disabled={selectedDestIds.length === 0}
                  className="min-h-[44px] flex-1 rounded-xl bg-[#EBF0EB] py-2.5 text-[12.5px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97] disabled:opacity-50"
>>>>>>> 36503365f261623debceee820c5b8b217c5b1085
                >
                  Simpan rute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(CustomRoutePage)
