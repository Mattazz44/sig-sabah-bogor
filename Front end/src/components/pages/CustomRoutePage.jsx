import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { apiFetch, getAuthToken } from '../../utils/api'
import { calculateDistanceKm } from '../../utils/distance'
import { pushAppNotification } from '../../utils/notifications'
import SafeImage from '../ui/SafeImage'
import GlassModal from '../ui/GlassModal'
import { getBogorFallbackPhoto } from '../../utils/imageHelper'
import { usePreferences } from '../../utils/preferences'
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronLeftIcon,
  MapIcon,
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
  const { t, tCategory, tDynamic, tDuration, formatDistanceUnit } = usePreferences()
  const prefersReduced = useReducedMotion()
  const [launchingRouteId, setLaunchingRouteId] = useState(null)
  const launchTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current)
    }
  }, [])
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
      pushAppNotification({
        type: 'route',
        title: t('routes.notifCreatedTitle', { title: titleText }),
        desc: t('routes.notifCreatedDesc', {
          count: chosenPlaces.length,
          distance: formatDistanceUnit(totalRoadKm),
        }),
      })
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
      pushAppNotification({
        type: 'success',
        title: t('routes.notifDeletedTitle'),
        desc: t('routes.notifDeletedDesc', { title: target.title }),
      })
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
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 136px)' }}
      className="animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-[#0E1310] text-[#F5F2EB] will-change-transform transform-gpu"
    >
      <div className="mx-auto w-full max-w-5xl px-5 pt-6 sm:px-6 lg:px-8">
        {/* Top Header: Single Compact Row with Back, Title, and Compact + Action */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              id="btn-back-custom-route"
              onClick={onBack}
              aria-label={t('routes.backAria')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17201B] text-[#F5F2EB] transition-colors duration-150 hover:bg-[#212D26] active:scale-[0.96]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-bold tracking-[-0.025em] text-[#F5F2EB] sm:text-[28px]">
                {t('routes.title')}
              </h1>
              <p className="mt-0.5 truncate text-[12.5px] text-[#A7B2AA]">
                {t('routes.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-add-custom-route"
            onClick={handleOpenCreateModal}
            aria-label={t('routes.createBtn')}
            className="inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-xl bg-[#1C2620] px-3.5 py-2 text-[13px] font-semibold text-[#F5F2EB] transition-colors duration-150 hover:bg-[#25322B] active:scale-[0.97]"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0 text-[#C5A868]"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="sm:hidden">{t('routes.createShortBtn')}</span>
            <span className="hidden sm:inline">{t('routes.createBtn')}</span>
          </button>
        </header>

        {/* Daftar Rute Custom: Borderless Editorial Cards with Timeline Connector */}
        {visibleCustomRoutes.length > 0 ? (
          <div
            className={`mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 ${
              visibleCustomRoutes.length >= 3 ? 'xl:grid-cols-3' : ''
            }`}
          >
            {visibleCustomRoutes.map((route) => {
              const displayTitle = tDynamic(route.title)
              const displayDesc = tDynamic(route.desc)
              return (
                <article
                  key={route.id}
                  id={`card-${route.id}`}
                  className="group flex min-w-0 flex-col rounded-2xl bg-[#151C18] p-5 transition-colors duration-150 hover:bg-[#19221D]"
                >
                  {/* Header Kartu Rute */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[17px] font-bold tracking-[-0.02em] leading-snug text-[#F5F2EB]">
                        {displayTitle}
                      </h2>
                      {displayDesc && (
                        <p className="mt-1 text-[12.5px] leading-relaxed text-[#A7B2AA]">
                          {displayDesc}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      id={`btn-delete-${route.id}`}
                      onClick={() => setRouteToDelete(route)}
                      aria-label={t('routes.deleteRouteAria', { title: displayTitle })}
                      title={t('routes.deleteRouteTitle')}
                      className="relative -mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#94A198] transition-colors duration-150 hover:bg-[#2D181C] hover:text-[#FCA5A5] active:scale-[0.94] before:absolute before:-inset-1"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  {/* Stepper Pemberhentian dengan Garis Penghubung Vertikal Progresif */}
                  <ol className="mt-4 border-t border-[#F2ECE1]/[0.07] pt-4">
                    {route.stops.map((stop, idx) => {
                      const isFirst = idx === 0
                      const isLast = idx === route.stops.length - 1
                      const hasNext = idx < route.stops.length - 1
                      const isLaunching = launchingRouteId === route.id
                      const stopDistText = /[\d.,]+\s*(km|m|mi)/i.test(String(stop.distance || ''))
                        ? formatDistanceUnit(stop.distance)
                        : tDynamic(stop.distance)

                      return (
                        <li
                          key={`${route.id}-stop-${idx}`}
                          className="relative flex items-stretch gap-3.5"
                        >
                          {/* Timeline Column: Number Node + Animated Progressive Connector Line */}
                          <div className="flex flex-col items-center">
                            <motion.span
                              initial={prefersReduced ? false : { scale: 0.72, opacity: 0.5 }}
                              whileInView={{ scale: 1, opacity: 1 }}
                              viewport={{ once: true, amount: 0.25 }}
                              animate={
                                isLaunching && !prefersReduced
                                  ? {
                                      scale: [1, 1.24, 1],
                                      transition: { duration: 0.34, delay: idx * 0.09 },
                                    }
                                  : undefined
                              }
                              transition={{
                                type: 'spring',
                                stiffness: 360,
                                damping: 24,
                                delay: idx * 0.08,
                              }}
                              className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                                isFirst
                                  ? 'bg-[#F2ECE1] text-[#141A14]'
                                  : isLast
                                    ? 'bg-[#C5A868] text-[#141A14]'
                                    : 'bg-[#222D26] text-[#F5F2EB]'
                              }`}
                            >
                              {idx + 1}
                            </motion.span>
                            {hasNext && (
                              <span
                                aria-hidden="true"
                                className="relative my-1 w-[2px] flex-1 min-h-[22px] overflow-hidden rounded-full bg-[#F2ECE1]/12"
                              >
                                <motion.span
                                  data-route-timeline-fill="true"
                                  initial={prefersReduced ? { scaleY: 1 } : { scaleY: 0 }}
                                  whileInView={{ scaleY: 1 }}
                                  viewport={{ once: true, amount: 0.25 }}
                                  animate={
                                    isLaunching && !prefersReduced
                                      ? { scaleY: [0, 1] }
                                      : undefined
                                  }
                                  transition={{
                                    duration: isLaunching ? 0.32 : 0.6,
                                    delay: isLaunching ? idx * 0.08 : 0.14 + idx * 0.12,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                  style={{ transformOrigin: 'top center' }}
                                  className={`absolute inset-0 rounded-full ${
                                    isLaunching
                                      ? 'bg-gradient-to-b from-[#F2ECE1] via-[#DFAA63] to-[#C5A868]'
                                      : 'bg-gradient-to-b from-[#F2ECE1]/60 via-[#C5A868]/65 to-[#C5A868]/85'
                                  }`}
                                />
                              </span>
                            )}
                          </div>

                          {/* Stop Name, Role & Leg Distance */}
                          <div
                            className={`flex min-w-0 flex-1 items-start justify-between gap-2.5 ${
                              hasNext ? 'pb-4' : 'pb-0'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold tracking-[-0.012em] leading-snug text-[#F5F2EB]">
                                {stop.name}
                              </p>
                              <span className="mt-0.5 block text-[12px] text-[#94A198]">
                                {tDynamic(stop.type)}
                              </span>
                            </div>
                            {stopDistText && (
                              <span className="shrink-0 pt-0.5 text-[12px] font-medium tabular-nums text-[#A7B2AA]">
                                {stopDistText}
                              </span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>

                  {/* Footer Rute: Jarak & Durasi Ringkas di Kiri, Tombol Start Journey Ramping di Kanan */}
                  <div className="mt-auto pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F2ECE1]/[0.07] pt-3.5">
                      <div className="flex min-w-0 items-center gap-1.5 text-[13px] tabular-nums text-[#A7B2AA]">
                        <span className="font-semibold text-[#F5F2EB]">
                          {formatDistanceUnit(route.totalDistance)}
                        </span>
                        <span aria-hidden="true" className="text-[#94A198]/65">•</span>
                        <span>{tDuration(route.totalDuration)}</span>
                      </div>

                      <button
                        type="button"
                        id={`btn-mulai-${route.id}`}
                        disabled={launchingRouteId === route.id}
                        onClick={() => {
                          if (!onStartCustomRoute || !route.places) return
                          const validPlaces = route.places.filter(Boolean)
                          if (prefersReduced) {
                            onStartCustomRoute(validPlaces)
                            return
                          }
                          setLaunchingRouteId(route.id)
                          if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current)
                          launchTimerRef.current = window.setTimeout(() => {
                            setLaunchingRouteId(null)
                            onStartCustomRoute(validPlaces)
                          }, 340)
                        }}
                        className="relative inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#F2ECE1] px-4 py-2 text-[13px] font-semibold text-[#141A14] transition-colors duration-150 hover:bg-[#E7DFD1] active:scale-[0.97] disabled:opacity-85 before:absolute before:-inset-y-0.5 before:inset-x-0"
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          className="shrink-0"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>{t('routes.startJourney')}</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-7 flex flex-col items-center justify-center rounded-2xl bg-[#151C18] px-6 py-12 text-center">
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C2520] text-[#C5A868]">
              <MapIcon className="h-6 w-6" />
            </div>
            <h3 className="text-[16px] font-bold tracking-[-0.015em] text-[#F5F2EB]">
              {t('routes.emptyTitle')}
            </h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#A7B2AA]">
              {t('routes.emptyDesc')}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-5 inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#F2ECE1] px-5 py-2 text-[13px] font-semibold text-[#141A14] transition-colors hover:bg-[#E7DFD1] active:scale-[0.97]"
            >
              <span>{t('routes.createBtn')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Form: "Rancang Rute Custom Baru" */}
      <GlassModal
        isOpen={showCreateRouteModal}
        onClose={() => setShowCreateRouteModal(false)}
        overlayId="modal-rancang-rute-overlay"
        modalId="modal-rancang-rute"
        closeButtonId="btn-close-rancang-rute"
        titleId="modal-rancang-rute-title"
        closeAriaLabel={t('routes.createModalCloseAria')}
        maxWidthClass="max-w-md"
      >
        <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C2520] text-[#C5A868]">
          <MapIcon className="h-6 w-6" />
        </div>

        <h3 id="modal-rancang-rute-title" className="text-center text-[19px] font-bold tracking-[-0.02em] text-[#F5F2EB]">
          {t('routes.createModalTitle')}
        </h3>
        <p className="mt-1 text-center text-[13px] text-[#A7B2AA]">
          {t('routes.createModalDesc')}
        </p>

        <form onSubmit={handleCreateRouteSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="input-new-route-title" className="mb-1.5 block text-[12.5px] font-medium text-[#F5F2EB]">
              {t('routes.routeNameLabel')}
            </label>
            <input
              type="text"
              id="input-new-route-title"
              value={newRouteTitle}
              onChange={(e) => setNewRouteTitle(e.target.value)}
              placeholder={t('routes.routeNamePlaceholder')}
              className="min-h-[44px] w-full rounded-xl bg-[#1B241F] px-3.5 py-2.5 text-[13.5px] text-[#F5F2EB] placeholder:text-[#94A198] transition-colors duration-150 focus:bg-[#212C26] focus:outline-2 focus:outline-[#C5A868]"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-medium text-[#F5F2EB]">
                {t('routes.chooseStopsLabel')}
              </p>
              {savedTouristSpots.length > 0 && (
                <span className="text-[11.5px] font-medium text-[#C5A868]">
                  {t('routes.savedSpotsCount', { count: savedTouristSpots.length })}
                </span>
              )}
            </div>

            <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
              {modalCandidates.map((place) => {
                const isChecked = selectedDestIds.includes(place.id)
                return (
                  <button
                    key={place.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => handleToggleDest(place.id)}
                    className={`flex min-h-[54px] w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition-colors duration-150 ${isChecked
                      ? 'bg-[#233028] ring-1 ring-[#C5A868]/60'
                      : 'bg-[#19221D] hover:bg-[#202B24]'
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
                        <p className="truncate text-[13.5px] font-semibold text-[#F5F2EB]">
                          {place.name}
                        </p>
                        <span className="block text-[11.5px] text-[#A7B2AA]">
                          {tCategory(place.category)}
                        </span>
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${isChecked
                        ? 'bg-[#F2ECE1] text-[#141A14]'
                        : 'bg-[#26322B] text-transparent'
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
              className="min-h-[44px] flex-1 rounded-xl bg-[#1D2721] py-2.5 text-[13.5px] font-semibold text-[#F5F2EB] transition-colors duration-150 hover:bg-[#26332C] active:scale-[0.98]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              id="btn-save-new-custom-route"
              disabled={selectedDestIds.length === 0}
              className="min-h-[44px] flex-1 rounded-xl bg-[#F2ECE1] py-2.5 text-[13.5px] font-semibold text-[#141A14] transition-colors duration-150 hover:bg-[#E7DFD1] active:scale-[0.98] disabled:opacity-50"
            >
              {t('routes.saveRouteBtn')}
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
        closeAriaLabel={t('routes.deleteModalCloseAria')}
        maxWidthClass="max-w-xs"
      >
        <div className="text-center">
          <div className="-mt-3 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D181C] text-[#FCA5A5]">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 id="modal-hapus-rute-title" className="text-[17px] font-bold text-[#F5F2EB]">
            {t('routes.deleteModalTitle')}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#A7B2AA]">
            {t('routes.deleteModalDesc', { title: tDynamic(routeToDelete?.title || '') })}
          </p>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setRouteToDelete(null)}
              className="min-h-[44px] flex-1 rounded-xl bg-[#1D2721] py-2.5 text-[13px] font-semibold text-[#F5F2EB] transition-colors hover:bg-[#26332C]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              id="btn-confirm-hapus-rute"
              onClick={confirmDeleteRoute}
              disabled={isDeletingRoute}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#3B1D24] py-2.5 text-[13px] font-bold text-rose-100 transition-colors hover:bg-[#4D242E] disabled:opacity-50"
            >
              {isDeletingRoute ? t('common.deleting') : t('common.deleteConfirm')}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}

export default memo(CustomRoutePage)
