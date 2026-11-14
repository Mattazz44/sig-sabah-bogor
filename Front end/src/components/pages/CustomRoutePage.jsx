import { memo, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../utils/api'
import SafeImage from '../ui/SafeImage'
import GlassModal from '../ui/GlassModal'
import { DEFAULT_AVATAR_PLACEHOLDER } from '../../utils/imageHelper'
import {
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  MapIcon,
  MapPinIcon,
} from '../ui/VectorIcons'

function CustomRoutePage({
  tourists = [],
  favorites = [],
  userActivities = [],
  currentUser = null,
  onBack,
  onStartCustomRoute,
}) {
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

  const [customRoutesList, setCustomRoutesList] = useState([
    {
      id: 'cr-museum',
      title: 'Tur Edukasi: Museum of Zoology ke Museum PETA',
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
              stops,
              totalDistance: cr.total_distance || '3.0 KM',
              totalDuration: cr.total_duration || '10 Menit',
              places: places.length > 0 ? places : [tourists[0]].filter(Boolean),
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

  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false)
  const [newRouteTitle, setNewRouteTitle] = useState('')
  const [selectedDestIds, setSelectedDestIds] = useState([])

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

  const handleToggleDest = (id) => {
    setSelectedDestIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id],
    )
  }

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

  const modalCandidates = savedTouristSpots.length > 0 ? savedTouristSpots : tourists.slice(0, 10)

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu bg-forest-900 text-[#EBF0EB]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              id="btn-back-custom-route"
              onClick={onBack}
              aria-label="Kembali ke aktivitas tersimpan"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-[#233020] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-bold tracking-tight text-[#EBF0EB] sm:text-[24px]">
                Rute Custom
              </h1>
              <p className="truncate text-[12.5px] text-[#C8D3C8]">
                Rute perjalanan tersimpan akun Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-add-custom-route"
            onClick={handleOpenCreateModal}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.14] bg-[#233020] px-4 py-2 text-[13px] font-semibold text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#2E3E2A] active:scale-[0.97]"
          >
            <span aria-hidden="true" className="text-[15px] leading-none font-bold text-[#E2D7B5]">+</span>
            <span>Buat Rute</span>
          </button>
        </header>

        {/* Info Status Akun Terhubung */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.14] bg-[#233020] px-4 py-3.5 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <SafeImage
              src={currentUser?.avatar}
              fallback={DEFAULT_AVATAR_PLACEHOLDER}
              alt={currentUser?.name ? `Foto profil ${currentUser.name}` : 'Foto profil pengguna'}
              className="h-11 w-11 shrink-0 rounded-full border border-white/[0.2] object-cover"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[14px] font-bold text-[#EBF0EB]">
                  {currentUser?.name || 'Pengguna'}
                </span>
                <span className="rounded-lg border border-white/[0.14] bg-[#1B261B] px-2.5 py-0.5 text-[11px] font-semibold text-[#E2D7B5]">
                  Terhubung
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[#C8D3C8]">
                {customRoutesList.length} rute perjalanan aktif tersimpan
              </p>
            </div>
          </div>
        </div>

        {/* Grid Daftar Rute Custom */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customRoutesList.map((route) => (
            <article
              key={route.id}
              id={`card-${route.id}`}
              className="group flex min-w-0 flex-col rounded-2xl border border-white/[0.14] bg-[#233020] p-4 shadow-sm transition-colors duration-150 hover:border-white/[0.28] sm:p-5"
            >
              {/* Header Rute */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  {route.isPrimary && (
                    <span className="mb-1.5 inline-block rounded-md border border-[#E2D7B5]/30 bg-[#1B261B] px-2 py-0.5 text-[10.5px] font-semibold text-[#E2D7B5]">
                      Rute Utama
                    </span>
                  )}
                  <h2 className="text-[15px] font-bold leading-snug text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
                    {route.title}
                  </h2>
                  {route.desc && (
                    <p className="mt-1 text-[12px] text-[#C8D3C8]">{route.desc}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-lg border border-white/[0.14] bg-[#1B261B] px-2.5 py-1 text-[11px] font-semibold text-[#E2D7B5]">
                  {route.stops.length} Tujuan
                </span>
              </div>

              {/* Stepper Titik Lokasi */}
              <div className="my-4 flex flex-col gap-3 border-y border-white/[0.1] py-3.5">
                {route.stops.map((stop, idx) => {
                  const isEdgeStop = idx === 0 || idx === route.stops.length - 1
                  return (
                    <div key={`${route.id}-stop-${idx}`} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isEdgeStop
                            ? 'bg-[#E2D7B5] text-[#161E16]'
                            : 'border border-white/[0.22] bg-[#1B261B] text-[#EBF0EB]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[12.5px]">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#EBF0EB]">{stop.name}</p>
                          <span className="block text-[11px] text-[#C8D3C8]">{stop.type}</span>
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-[#C8D3C8]">
                          {stop.distance}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer Rute */}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#C8D3C8]">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#E2D7B5]">
                    <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="tabular-nums">{route.totalDistance}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5 shrink-0 text-[#C8D3C8]" />
                    <span className="tabular-nums">{route.totalDuration}</span>
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
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#EBF0EB] px-4 py-2 text-[12.5px] font-bold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98] sm:w-auto"
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
                  <span>Mulai Perjalanan</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Modal Form: "Rancang Rute Custom Baru" (Liquid Glass) */}
      <GlassModal
        isOpen={showCreateRouteModal}
        onClose={() => setShowCreateRouteModal(false)}
        overlayId="modal-rancang-rute-overlay"
        modalId="modal-rancang-rute"
        closeButtonId="btn-close-rancang-rute"
        titleId="modal-rancang-rute-title"
        closeAriaLabel="Tutup modal rancang rute custom"
        maxWidthClass="max-w-md"
      >
        <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#E2D7B5] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.22)]">
          <MapIcon className="h-6 w-6" />
        </div>

        <h3 id="modal-rancang-rute-title" className="text-center text-[19px] font-bold tracking-tight text-white">
          Rancang Rute Custom Baru
        </h3>
        <p className="mt-1 text-center text-[12.5px] text-[#E2EAE2]">
          Pilih destinasi wisata untuk menyusun rute perjalanan Anda
        </p>

        <form onSubmit={handleCreateRouteSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="input-new-route-title" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
              Nama Rute
            </label>
            <input
              type="text"
              id="input-new-route-title"
              value={newRouteTitle}
              onChange={(e) => setNewRouteTitle(e.target.value)}
              placeholder="Contoh: Tur Budaya & Kebun Raya"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#C8D3C8] transition-colors duration-150"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12px] font-medium text-[#EBF0EB]">
                Pilih destinasi singgah:
              </p>
              {savedTouristSpots.length > 0 && (
                <span className="text-[11px] font-medium text-[#E2D7B5]">
                  {savedTouristSpots.length} tempat tersimpan
                </span>
              )}
            </div>

            <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
              {modalCandidates.map((place) => {
                const isChecked = selectedDestIds.includes(place.id)
                return (
                  <button
                    key={place.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => handleToggleDest(place.id)}
                    className={`flex min-h-[54px] w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-colors duration-150 ${
                      isChecked
                        ? 'border-[#E2D7B5]/70 bg-white/[0.14]'
                        : 'border-white/[0.14] bg-white/[0.06] hover:bg-white/[0.1]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <SafeImage
                        src={place.image}
                        alt={place.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#EBF0EB]">
                          {place.name}
                        </p>
                        <span className="block text-[11px] text-[#C8D3C8]">
                          {place.category}
                        </span>
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isChecked
                          ? 'border-[#EBF0EB] bg-[#EBF0EB] text-[#161E16]'
                          : 'border-white/[0.3] bg-white/[0.04] text-transparent'
                      }`}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowCreateRouteModal(false)}
              className="min-h-[44px] flex-1 rounded-xl border border-white/[0.14] bg-white/[0.06] py-2.5 text-[13px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-white/[0.12] active:scale-[0.98]"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-new-custom-route"
              disabled={selectedDestIds.length === 0}
              className="min-h-[44px] flex-1 rounded-xl bg-[#EBF0EB] py-2.5 text-[13px] font-bold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98] disabled:opacity-50"
            >
              Simpan Rute
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  )
}

export default memo(CustomRoutePage)
