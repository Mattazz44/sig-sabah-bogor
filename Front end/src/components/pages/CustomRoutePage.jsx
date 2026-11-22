import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, getAuthToken } from '../../utils/api'
import { calculateDistanceKm } from '../../utils/distance'
import SafeImage from '../ui/SafeImage'
import GlassModal from '../ui/GlassModal'
import { DEFAULT_AVATAR_PLACEHOLDER, getBogorFallbackPhoto } from '../../utils/imageHelper'
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  MapIcon,
  MapPinIcon,
} from '../ui/VectorIcons'

function enrichRoutePlace(rawPlace, touristById, touristBySlug) {
  if (!rawPlace) return null
  const matched =
    (rawPlace.id && touristById.get(Number(rawPlace.id))) ||
    (rawPlace.slug && touristBySlug.get(rawPlace.slug)) ||
    null
  if (!matched) return rawPlace
  return {
    ...matched,
    ...rawPlace,
    rating: rawPlace.rating ?? matched.rating,
    category: rawPlace.category || matched.category,
    address: rawPlace.address || matched.address,
    image: rawPlace.image || matched.image,
    coordinates: rawPlace.coordinates || matched.coordinates,
  }
}

function CustomRoutePage({
  tourists = [],
  favorites = [],
  userActivities = [],
  currentUser = null,
  onBack,
  onStartCustomRoute,
}) {
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

  const [customRoutesList, setCustomRoutesList] = useState([])
  const [routeToDelete, setRouteToDelete] = useState(null)
  const [isDeletingRoute, setIsDeletingRoute] = useState(false)
  const hasAuth = Boolean(currentUser?.id && getAuthToken())

  const { touristById, touristBySlug } = useMemo(() => {
    const byId = new Map()
    const bySlug = new Map()
    if (Array.isArray(tourists)) {
      tourists.forEach((t) => {
        if (t?.id) byId.set(Number(t.id), t)
        if (t?.slug) bySlug.set(t.slug, t)
      })
    }
    return { touristById: byId, touristBySlug: bySlug }
  }, [tourists])

  const hydrateRoute = useCallback(
    (cr) => {
      const stops = Array.isArray(cr.stops) ? cr.stops : []
      const places = stops
        .map((s) => enrichRoutePlace(s.place, touristById, touristBySlug))
        .filter(Boolean)
      return {
        id: cr.slug || `cr-${cr.id}`,
        dbId: cr.id,
        title: cr.title,
        desc: cr.desc || '',
        isPrimary: Boolean(cr.is_primary),
        stops,
        totalDistance: cr.total_distance || '3.0 KM',
        totalDuration: cr.total_duration || '10 Menit',
        places: places.length > 0 ? places : [tourists[0]].filter(Boolean),
      }
    },
    [touristById, touristBySlug, tourists],
  )

  useEffect(() => {
    if (!hasAuth) {
      return undefined
    }

    let isMounted = true

    apiFetch('/api/saved-activities')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (!isMounted) return
        if (Array.isArray(json?.data?.custom_routes)) {
          setCustomRoutesList(json.data.custom_routes.map(hydrateRoute))
        } else {
          setCustomRoutesList([])
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat rute custom dari API:', err)
        if (isMounted) setCustomRoutesList([])
      })

    return () => {
      isMounted = false
    }
  }, [hasAuth, hydrateRoute])

  const visibleCustomRoutes = hasAuth ? customRoutesList : []

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

  const handleCreateRouteSubmit = async (e) => {
    e.preventDefault()
    if (!newRouteTitle.trim() || selectedDestIds.length === 0) return

    const pool = savedTouristSpots.length > 0 ? savedTouristSpots : tourists
    const poolById = new Map(pool.map((t) => [t.id, t]))
    const chosenPlaces = selectedDestIds.map((id) => poolById.get(id)).filter(Boolean)
    if (chosenPlaces.length === 0) return

    let totalRoadKm = 0
    const stopsFormatted = chosenPlaces.map((p, idx) => {
      const lat = Number(p.coordinates?.lat ?? p.latitude)
      const lng = Number(p.coordinates?.lng ?? p.longitude)
      let legLabel = 'Titik awal'
      if (idx === 0) {
        if (chosenPlaces.length === 1 && Number.isFinite(lat) && Number.isFinite(lng)) {
          const km = Math.max(0.2, (calculateDistanceKm(-6.598, 106.805, lat, lng) ?? 1.5) * 1.35)
          totalRoadKm += km
          legLabel = `${km.toFixed(1)} KM`
        }
      } else {
        const prev = chosenPlaces[idx - 1]
        const prevLat = Number(prev.coordinates?.lat ?? prev.latitude)
        const prevLng = Number(prev.coordinates?.lng ?? prev.longitude)
        const km = Math.max(
          0.2,
          (calculateDistanceKm(prevLat, prevLng, lat, lng) ?? 1.5) * 1.35,
        )
        totalRoadKm += km
        legLabel = `${km.toFixed(1)} KM`
      }
      return {
        name: p.name,
        type: idx === 0 ? 'Titik Awal' : idx === chosenPlaces.length - 1 ? 'Destinasi Akhir' : `Transit ${idx}`,
        distance: legLabel,
        place: p,
      }
    })

    const totalMinutes = Math.max(3, Math.round((totalRoadKm / 25) * 60) + 2)
    const tempId = `cr-${Date.now()}`
    const titleText = newRouteTitle.trim()
    const destIdsSnapshot = [...selectedDestIds]

    const newRoute = {
      id: tempId,
      title: titleText,
      desc: 'Rute baru dibuat oleh Anda',
      isPrimary: false,
      stops: stopsFormatted,
      totalDistance: `${totalRoadKm.toFixed(1)} KM`,
      totalDuration: `${totalMinutes} Menit`,
      places: chosenPlaces,
    }

    const prevRoutes = customRoutesList
    setCustomRoutesList((prev) => [newRoute, ...prev])
    setNewRouteTitle('')
    setSelectedDestIds([])
    setShowCreateRouteModal(false)

    try {
      const res = await apiFetch('/api/custom-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title: titleText,
          place_ids: destIdsSnapshot,
        }),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json().catch(() => null)
      if (json?.data) {
        setCustomRoutesList((prev) =>
          prev.map((item) => (item.id === tempId ? hydrateRoute(json.data) : item)),
        )
      }
    } catch (err) {
      console.warn('Gagal menyimpan rute custom ke server:', err)
      setCustomRoutesList(prevRoutes)
    }
  }

  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return
    const target = routeToDelete
    const prevRoutes = customRoutesList
    setIsDeletingRoute(true)
    setCustomRoutesList((prev) => prev.filter((r) => r.id !== target.id))
    setRouteToDelete(null)

    try {
      const res = await apiFetch(`/api/custom-routes/${encodeURIComponent(target.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      console.warn('Gagal menghapus rute custom:', err)
      setCustomRoutesList(prevRoutes)
    } finally {
      setIsDeletingRoute(false)
    }
  }

  const modalCandidates = savedTouristSpots.length > 0 ? savedTouristSpots : tourists.slice(0, 10)

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="apple-canopy-bg animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu text-[#EBF0EB]"
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
              className="apple-glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#EBF0EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[28px]">
                Rute Custom
              </h1>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                Rute perjalanan tersimpan akun Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-add-custom-route"
            onClick={handleOpenCreateModal}
            className="apple-glass-pill inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.98]"
          >
            <span aria-hidden="true" className="text-[15px] leading-none font-bold text-[#DFAA63]">+</span>
            <span>Buat Rute</span>
          </button>
        </header>

        {/* Info Status Akun Terhubung */}
        <div className="apple-glass-card mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <SafeImage
              src={currentUser?.avatar}
              fallback={DEFAULT_AVATAR_PLACEHOLDER}
              alt={currentUser?.name ? `Foto profil ${currentUser.name}` : 'Foto profil pengguna'}
              className="h-11 w-11 shrink-0 rounded-full border border-[rgba(244,239,230,0.24)] object-cover object-top"
              imgClassName="object-cover object-top"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[14px] font-semibold tracking-tight text-[#F5F2EB]">
                  {currentUser?.name || 'Pengguna'}
                </span>
                <span className="apple-retro-bevel rounded-full border border-[rgba(244,239,230,0.16)] bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-[#DFAA63]">
                  Terhubung
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[11.5px] tabular-nums tracking-wide text-[#F5F2EB]/60">
                {visibleCustomRoutes.length} rute perjalanan aktif tersimpan
              </p>
            </div>
          </div>
        </div>

        {/* Grid Daftar Rute Custom */}
        {visibleCustomRoutes.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleCustomRoutes.map((route) => (
              <article
                key={route.id}
                id={`card-${route.id}`}
                className="apple-glass-card apple-glass-card-hover group flex min-w-0 flex-col rounded-3xl p-4 sm:p-5"
              >
                {/* Header Rute */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    {route.isPrimary && (
                      <span className="mb-1.5 inline-block rounded-full border border-[#DFAA63]/35 bg-[#DFAA63]/12 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#DFAA63]">
                        Rute Utama
                      </span>
                    )}
                    <h2 className="text-[15.5px] font-semibold tracking-tight leading-snug text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
                      {route.title}
                    </h2>
                    {route.desc && (
                      <p className="mt-1 text-[12px] leading-relaxed text-[#F5F2EB]/60">{route.desc}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full border border-[rgba(244,239,230,0.16)] bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums tracking-wide text-[#DFAA63]">
                      {route.stops.length} Tujuan
                    </span>
                    <button
                      type="button"
                      id={`btn-delete-${route.id}`}
                      onClick={() => setRouteToDelete(route)}
                      aria-label={`Hapus rute ${route.title}`}
                      title="Hapus rute"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-[#C8D3C8] transition-colors hover:bg-[#3B1D24]/70 hover:text-rose-200 active:scale-95"
                    >
                      <svg
                        width="13"
                        height="13"
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
                    </button>
                  </div>
                </div>

                {/* Stepper Titik Lokasi */}
                <div className="my-4 flex flex-col gap-3 border-y border-[rgba(244,239,230,0.12)] py-3.5">
                  {route.stops.map((stop, idx) => {
                    const isEdgeStop = idx === 0 || idx === route.stops.length - 1
                    return (
                      <div key={`${route.id}-stop-${idx}`} className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                            isEdgeStop
                              ? 'bg-[#F2ECE1] text-[#141A14]'
                              : 'border border-[rgba(244,239,230,0.22)] bg-white/[0.06] text-[#F5F2EB]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[12.5px]">
                          <div className="min-w-0">
                            <p className="truncate font-semibold tracking-tight text-[#F5F2EB]">{stop.name}</p>
                            <span className="block text-[11px] text-[#F5F2EB]/60">{stop.type}</span>
                          </div>
                          <span className="shrink-0 font-mono text-[11px] tabular-nums tracking-wide text-[#F5F2EB]/65">
                            {stop.distance}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer Rute */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#F5F2EB]/65">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#DFAA63] tabular-nums tracking-wide">
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{route.totalDistance}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums tracking-wide">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-[#F5F2EB]/60" />
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
                    className="apple-retro-cta inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-semibold active:scale-[0.98] sm:w-auto"
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
        ) : (
          <div className="apple-glass-card mt-8 flex flex-col items-center justify-center rounded-3xl px-4 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.14] bg-white/[0.06] text-[#E2D7B5]">
              <MapIcon className="h-6 w-6" />
            </div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[#EBF0EB]">
              Belum Ada Rute Custom
            </h3>
            <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-white/60">
              Anda belum memiliki rute custom. Klik tombol &quot;Buat Rute&quot; di atas untuk merangkai perjalanan dari tempat wisata tersimpan Anda.
            </p>
          </div>
        )}
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
                        src={place.image || getBogorFallbackPhoto(place)}
                        fallback={getBogorFallbackPhoto(place)}
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
                          ? 'border-[#F2ECE1] bg-[#F2ECE1] text-[#141A14]'
                          : 'border-[rgba(244,239,230,0.28)] bg-white/[0.04] text-transparent'
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
              className="apple-retro-cta min-h-[44px] flex-1 rounded-xl py-2.5 text-[13px] font-semibold active:scale-[0.98] disabled:opacity-50"
            >
              Simpan Rute
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Modal Konfirmasi Hapus Rute Custom */}
      <GlassModal
        isOpen={Boolean(routeToDelete)}
        onClose={() => setRouteToDelete(null)}
        overlayId="modal-hapus-rute-overlay"
        modalId="modal-hapus-rute"
        closeButtonId="btn-close-hapus-rute"
        titleId="modal-hapus-rute-title"
        closeAriaLabel="Tutup konfirmasi hapus rute"
        maxWidthClass="max-w-xs"
      >
        <div className="text-center">
          <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/25 bg-[#3B1D24]/70 text-rose-200">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 id="modal-hapus-rute-title" className="text-[17px] font-bold text-[#EBF0EB]">
            Hapus Rute Custom?
          </h3>
          <p className="mt-1.5 text-[12.5px] text-[#C8D3C8]">
            Rute &quot;{routeToDelete?.title}&quot; akan dihapus permanen dari daftar rute Anda.
          </p>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setRouteToDelete(null)}
              className="min-h-[44px] flex-1 rounded-xl border border-white/[0.14] bg-white/[0.06] py-2.5 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors hover:bg-white/[0.12]"
            >
              Batal
            </button>
            <button
              type="button"
              id="btn-confirm-hapus-rute"
              onClick={confirmDeleteRoute}
              disabled={isDeletingRoute}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-rose-300/25 bg-[#3B1D24] py-2.5 text-[12.5px] font-bold text-rose-100 transition-colors hover:bg-[#4D242E] disabled:opacity-50"
            >
              {isDeletingRoute ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}

export default memo(CustomRoutePage)
