import { memo, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../utils/api'
import SafeImage from '../ui/SafeImage'
import { DEFAULT_AVATAR_PLACEHOLDER } from '../../utils/imageHelper'
import { CheckIcon } from '../ui/VectorIcons'

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
      id: 'cr-museum',
      title: 'Tur Edukasi: Museum of Zoology ➔ Museum PETA',
      desc: 'Rute Favorit Edukasi & Sejarah Bogor',
      isPrimary: true,
      stops: [
        { name: 'Museum of zoology - Bogor Tengah', type: 'Transit Pertama', distance: '2.5 KM', place: museumZoologi },
        { name: 'Museum PETA - Bogor Kota', type: 'Destinasi Akhir', distance: '3.0 KM', place: museumPeta },
      ],
      totalDistance: '5.4 KM',
      totalDuration: '15 Menit',
      places: [museumZoologi, museumPeta],
    },
    {
      id: 'cr-kuliner',
      title: 'Kuliner Legendaris Suryakencana',
      desc: 'Dibuat 1 minggu lalu',
      isPrimary: false,
      stops: [
        { name: 'Lawang Surya Kencana', type: 'Titik Kunjungan', distance: '3.0 KM', place: tourists.find((t) => t.slug === 'lawang-surya-kencana') },
      ],
      totalDistance: '3.0 KM',
      totalDuration: '10 Menit',
      places: [tourists.find((t) => t.slug === 'lawang-surya-kencana') || tourists[0]].filter(Boolean),
    },
  ])

  // Fetch rute custom dari database backend
  useEffect(() => {
    let isMounted = true
    apiFetch('/api/saved-activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (isMounted && Array.isArray(json?.data?.custom_routes) && json.data.custom_routes.length > 0) {
          const mapped = json.data.custom_routes.map((cr) => {
            const stops = Array.isArray(cr.stops) ? cr.stops : []
            const places = stops.map((s) => s.place).filter(Boolean)
            return {
              id: cr.slug || `cr-${cr.id}`,
              title: cr.title,
              desc: cr.desc || '',
              isPrimary: Boolean(cr.is_primary),
              stops: stops,
              totalDistance: cr.total_distance || '3.0 KM',
              totalDuration: cr.total_duration || '10 Menit',
              places: places.length > 0 ? places : [tourists[0]],
            }
          })
          setCustomRoutesList(mapped)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat rute custom dari API, fallback ke default:', err)
      })

    return () => {
      isMounted = false
    }
  }, [tourists])

  // 3. STATE MODAL "RANCANG RUTE CUSTOM BARU"
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false)
  const [newRouteTitle, setNewRouteTitle] = useState('')
  const [selectedDestIds, setSelectedDestIds] = useState([])

  useEffect(() => {
    if (!showCreateRouteModal) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowCreateRouteModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCreateRouteModal])

  const handleOpenCreateModal = () => {
    const pool = savedTouristSpots.length > 0 ? savedTouristSpots : tourists
    if (pool.length >= 2) {
      setSelectedDestIds([pool[0].id, pool[1].id].filter(Boolean))
    } else if (pool.length === 1) {
      setSelectedDestIds([pool[0].id].filter(Boolean))
    } else {
      setSelectedDestIds([])
    }
    setShowCreateRouteModal(true)
  }

  // Toggle pilihan destinasi di modal
  const handleToggleDest = (id) => {
    setSelectedDestIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id],
    )
  }

  // SUBMIT FORM "RANCANG RUTE CUSTOM BARU"
  const handleCreateRouteSubmit = (e) => {
    e.preventDefault()
    if (!newRouteTitle.trim() || selectedDestIds.length === 0) return

    const pool = savedTouristSpots.length > 0 ? savedTouristSpots : tourists
    const chosenPlaces = pool.filter((t) => selectedDestIds.includes(t.id))
    if (chosenPlaces.length === 0) return

    const stopsFormatted = chosenPlaces.map((p, idx) => ({
      name: p.name,
      type: idx === 0 ? 'Titik Awal' : idx === chosenPlaces.length - 1 ? 'Destinasi Akhir' : `Transit ${idx}`,
      distance: p.distance || '2.5 KM',
      place: p,
    }))

    const newRoute = {
      id: `cr-${Date.now()}`,
      title: newRouteTitle.trim(),
      desc: 'Rute baru dibuat oleh Anda',
      isPrimary: false,
      stops: stopsFormatted,
      totalDistance: `${(chosenPlaces.length * 2.8).toFixed(1)} KM`,
      totalDuration: `${chosenPlaces.length * 8} Menit`,
      places: chosenPlaces,
    }

    setCustomRoutesList((prev) => [newRoute, ...prev])

    // Simpan ke database backend
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
    setSelectedDestIds([])
    setShowCreateRouteModal(false)
  }

  return (
    <div className="h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-7 pb-28 max-w-md mx-auto overscroll-contain overscroll-y-contain will-change-transform transform-gpu overflow-y-auto">
      {/* Top Header with Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-back-custom-route"
            onClick={onBack}
            aria-label="Kembali ke aktivitas tersimpan"
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
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-white leading-tight">
              Rute Custom
            </h1>
            <p className="text-[11px] text-white/60">
              Rute perjalanan tersimpan akun Anda
            </p>
          </div>
        </div>

        {/* 3. TOMBOL "+ Buat Rute" (AKTIF KLIK UNTUK MEMUNCULKAN MODAL RANCANG RUTE) */}
        <button
          type="button"
          id="btn-add-custom-route"
          onClick={handleOpenCreateModal}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] px-3.5 py-2 text-[12px] font-semibold text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
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
          <span>+ Buat Rute</span>
        </button>
      </div>

      {/* Info Status Akun Terhubung */}
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-forest-700/60 border border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <SafeImage
            src={currentUser?.avatar}
            fallback={DEFAULT_AVATAR_PLACEHOLDER}
            alt="Foto profil pengguna"
            className="h-10 w-10 shrink-0 rounded-full object-cover border border-emerald-400"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#EBF0EB]">
                {currentUser?.name || 'Pengguna'}
              </span>
              <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                Terhubung
              </span>
            </div>
            <p className="text-[11px] text-white/60">
              {customRoutesList.length} Rute Aktif Tersimpan
            </p>
          </div>
        </div>
      </div>

      {/* DAFTAR LIST RUTE CUSTOM */}
      <div className="mt-6 flex flex-col gap-5">
        {customRoutesList.map((route) => (
          <article
            key={route.id}
            id={`card-${route.id}`}
            className={`group flex flex-col rounded-2xl p-4 shadow-md active:scale-[0.98] transition-transform duration-150 ${route.isPrimary
              ? 'bg-forest-700/80 border-2 border-emerald-500/40 hover:border-emerald-400'
              : 'bg-forest-700/60 border border-white/10 hover:border-white/20'
              }`}
          >
            {/* Header Rute */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {route.isPrimary && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <h3 className="text-[15px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {route.title}
                  </h3>
                </div>
                <span className="text-[11px] text-white/50 mt-0.5 block">
                  {route.desc}
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 shrink-0">
                {route.stops.length} Tujuan Wisata
              </span>
            </div>

            {/* Stepper Titik Lokasi */}
            <div className="my-3 flex flex-col gap-2.5 border-y border-white/10 py-3">
              {route.stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${idx === 0
                      ? 'bg-emerald-500'
                      : idx === route.stops.length - 1
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                      }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex flex-1 items-center justify-between text-[12px]">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-white truncate">{stop.name}</span>
                      <span className="text-[10px] text-emerald-300">{stop.type}</span>
                    </div>
                    <span className="text-[10px] text-white/50 shrink-0">{stop.distance}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Rute: Jarak, Durasi, & Tombol Mulai Perjalanan */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-[11px] text-white/80">
                <span className="font-semibold text-emerald-300">📍 Total: {route.totalDistance}</span>
                <span>⏱ Total: {route.totalDuration}</span>
              </div>

              {/* TOMBOL "MULAI PERJALANAN" */}
              <button
                type="button"
                id={`btn-mulai-${route.id}`}
                onClick={() => {
                  if (onStartCustomRoute && route.places) {
                    onStartCustomRoute(route.places.filter(Boolean))
                  }
                }}
                className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-4 py-2 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] transition cursor-pointer border border-emerald-400/30"
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
                >
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                <span>Mulai Perjalanan</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* 3. MODAL FORM: "RANCANG RUTE CUSTOM BARU" */}
      {showCreateRouteModal && (
        <div
          id="modal-rancang-rute-overlay"
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            id="modal-rancang-rute"
            className="relative w-full max-w-sm rounded-3xl bg-forest-900 border border-white/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              id="btn-close-rancang-rute"
              onClick={() => setShowCreateRouteModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xl shadow-inner">
              🗺️
            </div>

            <h3 className="text-[18px] font-bold text-white tracking-tight text-center">
              Rancang Rute Custom Baru
            </h3>
            <p className="text-[11px] text-white/60 text-center mt-1">
              Pilih destinasi wisata untuk rute perjalanan Anda
            </p>

            <form onSubmit={handleCreateRouteSubmit} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1">
                  Nama Rute
                </label>
                <input
                  type="text"
                  id="input-new-route-title"
                  value={newRouteTitle}
                  onChange={(e) => setNewRouteTitle(e.target.value)}
                  placeholder="Contoh: Tur Budaya & Kebun Raya"
                  className="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3 py-2 text-[12px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="block text-[12px] font-semibold text-[#EBF0EB]">
                    Pilih destinasi singgah:
                  </p>
                  {savedTouristSpots.length > 0 && (
                    <span className="text-[10px] font-medium text-emerald-300">
                      {savedTouristSpots.length} tempat tersimpan
                    </span>
                  )}
                </div>
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                  {(savedTouristSpots.length > 0 ? savedTouristSpots : tourists.slice(0, 10)).map((place) => {
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
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRouteModal(false)}
                  className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 py-2.5 text-[12px] font-semibold text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-new-custom-route"
                  disabled={selectedDestIds.length === 0}
                  className="min-h-[44px] flex-1 rounded-xl bg-[#EBF0EB] py-2.5 text-[12.5px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97] disabled:opacity-50"
                >
                  Simpan Rute
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
