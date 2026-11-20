import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import SafeImage from '../ui/SafeImage'
import {
  CompassIcon,
  HeartIcon,
  MapPinIcon,
  RefreshIcon,
  RouteWaypointsIcon,
  StarIcon,
  UserIcon,
} from '../ui/VectorIcons'
import { DEFAULT_AVATAR_PLACEHOLDER } from '../../utils/imageHelper'

function formatDistanceLabel(place) {
  if (typeof place?.distanceKm === 'number' && Number.isFinite(place.distanceKm)) {
    if (place.distanceKm < 1) {
      return `${Math.max(50, Math.round(place.distanceKm * 1000))} m`
    }
    return `${place.distanceKm.toFixed(1)} km`
  }
  if (place?.travelTime && place.travelTime !== 'Aktifkan GPS') {
    return place.travelTime
  }
  return null
}

function buildCuratedSelection(tourists, limit = 6) {
  if (!Array.isArray(tourists) || tourists.length === 0) return []
  const sorted = [...tourists].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
  const seenCategories = new Set()
  const picked = []
  const overflow = []

  for (const place of sorted) {
    const cat = place.category || 'Lainnya'
    if (!seenCategories.has(cat) && picked.length < limit) {
      seenCategories.add(cat)
      picked.push(place)
    } else {
      overflow.push(place)
    }
  }

  for (const place of overflow) {
    if (picked.length >= limit) break
    picked.push(place)
  }

  return picked
}

function enrichRecommendationItem(rawItem, touristBySlug) {
  if (!rawItem) return null
  const matched = rawItem.slug ? touristBySlug.get(rawItem.slug) : null
  if (!matched) return rawItem
  return {
    ...matched,
    ...rawItem,
    address: matched.address || rawItem.location,
    rating: matched.rating ?? rawItem.rating,
    image: matched.image || rawItem.image,
    distanceKm: matched.distanceKm,
    travelTime: matched.travelTime,
    category: matched.category,
    lat: matched.lat,
    lng: matched.lng,
  }
}

function DestinationCard({
  place,
  favoriteActive,
  onToggleFavorite,
  onOpenDetail,
  onStartNavigation,
}) {
  const distanceLabel = formatDistanceLabel(place)
  const displayRating = Number(place.rating || 0).toFixed(1)
  const displayLocation = place.address || place.location || 'Bogor, Jawa Barat'

  return (
    <article className="apple-glass-card apple-glass-card-hover group relative flex min-w-0 flex-col overflow-hidden rounded-2xl">
      {/* Tombol favorit terpisah di luar button detail agar semantic HTML tetap valid */}
      <button
        type="button"
        aria-pressed={favoriteActive}
        aria-label={favoriteActive ? `Hapus ${place.name} dari favorit` : `Simpan ${place.name} ke favorit`}
        onClick={() => onToggleFavorite?.(place.slug)}
        className={`apple-glass-pill absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full transition-all duration-150 active:scale-[0.95] ${
          favoriteActive
            ? 'border-rose-300/35 bg-[#3B1D24]/85 text-rose-300 hover:bg-[#49242D]'
            : 'text-[#EBF0EB] hover:bg-white/[0.16]'
        }`}
      >
        <HeartIcon filled={favoriteActive} className="h-5 w-5" />
      </button>

      {/* Area gambar dan ringkasan tempat yang bisa diklik menuju detail */}
      <button
        type="button"
        onClick={() => onOpenDetail(place)}
        className="flex flex-1 flex-col text-left transition-transform duration-150 active:scale-[0.99]"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#182117]">
          <SafeImage
            src={place.image}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#161E16]/75 via-[#161E16]/25 to-transparent"
          />
          {place.category && (
            <span className="apple-glass-pill absolute bottom-2.5 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight text-[#EBF0EB]">
              {place.category}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 pb-3">
          <h3 className="line-clamp-1 text-[15px] font-semibold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#DFAA63]">
            {place.name}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#F5F2EB]/60">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[#F5F2EB]/55" aria-hidden="true" />
            <span className="line-clamp-1 min-w-0">{displayLocation}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className="inline-flex items-center gap-1 font-mono font-semibold tabular-nums tracking-wide text-[#F5F2EB]">
              <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" aria-hidden="true" />
              {displayRating}
            </span>
            {distanceLabel && (
              <span className="inline-flex items-center gap-1 text-[#DFAA63]">
                <span aria-hidden="true" className="text-[#F5F2EB]/35">•</span>
                <span className="font-mono font-medium tabular-nums tracking-wide">{distanceLabel} dari Anda</span>
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Baris aksi cepat */}
      <div className="mt-auto flex items-center gap-2 border-t border-[rgba(244,239,230,0.12)] px-4 py-3">
        <button
          type="button"
          onClick={() => onOpenDetail(place)}
          className="apple-glass-pill flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-3 text-[12.5px] font-semibold text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.12] active:scale-[0.98]"
        >
          Lihat detail
        </button>
        {onStartNavigation && (
          <button
            type="button"
            onClick={() => onStartNavigation(place)}
            aria-label={`Mulai rute cepat ke ${place.name}`}
            className="apple-retro-cta inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-semibold active:scale-[0.98]"
          >
            <RouteWaypointsIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Rute</span>
          </button>
        )}
      </div>
    </article>
  )
}

function ForYouPage({
  tourists = [],
  isLoading: isLoadingTourists = false,
  isBackendError = false,
  onRetryBackend,
  favorites = [],
  toggleFavorite,
  isFavorite,
  recentSlugs = [],
  onSelectPlace,
  onStartNavigation,
  isLoggedIn = false,
  currentUser = null,
  onRequireLogin,
  onOpenProfile,
}) {
  const navigate = useNavigate()
  const [reloadTick, setReloadTick] = useState(0)
  const requestKey = isLoggedIn
    ? `${favorites.join(',')}|${recentSlugs.join(',')}|${tourists.length}|${reloadTick}`
    : 'guest'

  const [recState, setRecState] = useState({
    key: '',
    recommended: [],
    continueItem: null,
    error: false,
  })

  useEffect(() => {
    if (!isLoggedIn) return undefined

    let isMounted = true
    const favParam = encodeURIComponent(favorites.join(','))
    const recentParam = encodeURIComponent(recentSlugs.join(','))
    const url = `/api/for-you?favorites=${favParam}&recent=${recentParam}`

    apiFetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (!isMounted) return
        setRecState({
          key: requestKey,
          recommended: Array.isArray(json?.data?.recommended) ? json.data.recommended : [],
          continueItem: json?.data?.continue_item ?? null,
          error: false,
        })
      })
      .catch(() => {
        if (!isMounted) return
        if (Array.isArray(tourists) && tourists.length > 0) {
          const lastPlace =
            recentSlugs.length > 0
              ? tourists.find((t) => t.slug === recentSlugs[0]) || tourists[0]
              : tourists[0]

          const continueEntry = {
            id: `continue-${lastPlace.slug}`,
            slug: lastPlace.slug,
            name: lastPlace.name,
            location: lastPlace.address || 'Bogor, Jawa Barat',
            rating: Number(lastPlace.rating || 0).toFixed(1),
            image: lastPlace.image,
          }

          const recList = tourists
            .filter((t) => t.slug !== lastPlace.slug)
            .slice(0, 6)
            .map((t) => ({
              id: t.slug,
              slug: t.slug,
              name: t.name,
              location: t.address || 'Bogor, Jawa Barat',
              rating: Number(t.rating || 0).toFixed(1),
              image: t.image,
            }))

          setRecState({
            key: requestKey,
            recommended: recList,
            continueItem: continueEntry,
            error: false,
          })
        } else {
          setRecState({
            key: requestKey,
            recommended: [],
            continueItem: null,
            error: true,
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, favorites, recentSlugs, tourists, requestKey])

  const curatedBogorPlaces = useMemo(() => buildCuratedSelection(tourists, 6), [tourists])

  const touristBySlug = useMemo(() => {
    const map = new Map()
    for (const item of tourists) {
      if (item?.slug) map.set(item.slug, item)
    }
    return map
  }, [tourists])

  const isFetching = isLoggedIn && recState.key !== requestKey
  const enrichedRecommended = useMemo(
    () =>
      (isLoggedIn ? recState.recommended : [])
        .map((item) => enrichRecommendationItem(item, touristBySlug))
        .filter(Boolean),
    [isLoggedIn, recState.recommended, touristBySlug],
  )

  const effectiveContinue = useMemo(
    () =>
      isLoggedIn && recState.continueItem
        ? enrichRecommendationItem(recState.continueItem, touristBySlug)
        : null,
    [isLoggedIn, recState.continueItem, touristBySlug],
  )

  const displayedPersonalized =
    enrichedRecommended.length > 0 ? enrichedRecommended : curatedBogorPlaces

  const usingCuratedFallbackForLoggedIn =
    isLoggedIn && !isFetching && enrichedRecommended.length === 0 && curatedBogorPlaces.length > 0

  const handleCardOpen = (place) => {
    if (onSelectPlace) {
      onSelectPlace(place)
    } else if (place?.slug) {
      navigate(`/place/${place.slug}`)
    }
  }

  const handleQuickRoute = (place) => {
    if (onStartNavigation) {
      onStartNavigation(place)
    } else {
      handleCardOpen(place)
    }
  }

  const checkFavorite = (slug) =>
    isFavorite ? isFavorite(slug) : favorites.includes(slug)

  const renderSkeletonGrid = () => (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="apple-glass-card overflow-hidden rounded-2xl"
        >
          <div className="aspect-[16/10] w-full bg-white/[0.04]" />
          <div className="space-y-2.5 p-4">
            <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
            <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
            <div className="mt-3 h-10 w-full rounded-xl bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="apple-canopy-bg animate-tab-enter h-full min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain will-change-transform transform-gpu text-[#EBF0EB]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top Header */}
        <header className="flex items-start justify-between gap-4 sm:items-center">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[30px]">
              Untuk Anda
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-[#F5F2EB]/60">
              {isLoggedIn
                ? `Dipersonalisasi untuk ${currentUser?.name || 'perjalanan Anda'}`
                : 'Kurasi tempat wisata unggulan di sekitar Bogor'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                if (onRequireLogin) onRequireLogin()
              } else if (onOpenProfile) {
                onOpenProfile('self')
              }
            }}
            aria-label={isLoggedIn ? 'Buka profil pengguna' : 'Masuk ke akun'}
            className="apple-glass-pill flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.14] active:scale-[0.97]"
          >
            {isLoggedIn ? (
              <SafeImage
                src={currentUser?.avatar}
                fallback={DEFAULT_AVATAR_PLACEHOLDER}
                alt={currentUser?.name || 'Foto profil'}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-5 w-5" />
            )}
          </button>
        </header>

        {!isLoggedIn ? (
          <div className="mt-6 space-y-8">
            {/* Banner Ajakan Login Liquid Glass */}
            <section
              aria-labelledby="guest-invite-title"
              className="apple-glass-card relative overflow-hidden rounded-3xl p-5 sm:p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="apple-glass-pill flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-[#DFAA63]">
                    <CompassIcon className="h-6 w-6" duotone />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="guest-invite-title"
                      className="text-[17px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[18px]"
                    >
                      Simpan rute dan personalisasi rekomendasi Anda
                    </h2>
                    <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#F5F2EB]/65">
                      Masuk ke akun Sabah Bogor untuk menyelaraskan tempat favorit, melanjutkan tempat terakhir dilihat, dan menyusun urutan rekomendasi sesuai minat Anda.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onRequireLogin}
                  className="apple-retro-cta inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-[13px] font-semibold active:scale-[0.98]"
                >
                  Masuk ke akun
                </button>
              </div>
            </section>

            {/* Kurasi Rekomendasi Pilihan untuk Pengunjung */}
            <section aria-labelledby="curated-bogor-heading">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2
                    id="curated-bogor-heading"
                    className="text-[17px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[18px]"
                  >
                    Rekomendasi Pilihan di Bogor
                  </h2>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                    Destinasi terpopuler yang siap dikunjungi atau langsung diarahkan di peta
                  </p>
                </div>
              </div>

              {isLoadingTourists && curatedBogorPlaces.length === 0 ? (
                renderSkeletonGrid()
              ) : isBackendError && curatedBogorPlaces.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-rose-400/25 bg-[#2a1216] p-5 text-center">
                  <p className="text-[14px] font-semibold text-[#EBF0EB]">
                    Daftar rekomendasi belum bisa dimuat
                  </p>
                  <p className="mt-1 text-[12.5px] text-rose-100/85">
                    Periksa sambungan ke server backend lalu coba muat ulang.
                  </p>
                  <button
                    type="button"
                    onClick={() => onRetryBackend && onRetryBackend()}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/12 px-4 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#EBF0EB]/20"
                  >
                    <RefreshIcon className="h-3.5 w-3.5" />
                    <span>Coba lagi</span>
                  </button>
                </div>
              ) : curatedBogorPlaces.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {curatedBogorPlaces.map((place) => (
                    <DestinationCard
                      key={place.slug}
                      place={place}
                      favoriteActive={checkFavorite(place.slug)}
                      onToggleFavorite={toggleFavorite}
                      onOpenDetail={handleCardOpen}
                      onStartNavigation={onStartNavigation ? handleQuickRoute : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="apple-glass-card mt-4 rounded-2xl p-5 text-[13px] text-white/65">
                  Belum ada destinasi yang tersedia untuk ditampilkan.
                </p>
              )}
            </section>
          </div>
        ) : (isLoadingTourists || isFetching) && displayedPersonalized.length === 0 ? (
          renderSkeletonGrid()
        ) : (recState.error || isBackendError) && displayedPersonalized.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-rose-400/25 bg-[#2a1216] p-5 text-center">
            <p className="text-[14px] font-semibold text-[#EBF0EB]">
              Rekomendasi belum bisa dimuat
            </p>
            <p className="mt-1 text-[12.5px] text-rose-100/85">
              Periksa sambungan ke server backend lalu coba muat ulang.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onRetryBackend) onRetryBackend()
                setReloadTick((prev) => prev + 1)
              }}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/12 px-4 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#EBF0EB]/20"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              <span>Coba lagi</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {effectiveContinue && (
              <section aria-labelledby="continue-heading">
                <h2
                  id="continue-heading"
                  className="text-[16px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[17px]"
                >
                  Lanjutkan perjalanan
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[#F5F2EB]/60">Destinasi terakhir yang Anda buka</p>

                <article className="apple-glass-card apple-glass-card-hover mt-3 overflow-hidden rounded-2xl sm:flex sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => handleCardOpen(effectiveContinue)}
                    className="flex flex-1 flex-col text-left transition-transform duration-150 active:scale-[0.99] sm:flex-row sm:items-center"
                  >
                    <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-[#141A14] sm:aspect-auto sm:h-36 sm:w-52">
                      <SafeImage
                        src={effectiveContinue.image}
                        alt={effectiveContinue.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[#DFAA63]">
                        Terakhir dilihat
                      </span>
                      <h3 className="mt-1 line-clamp-1 text-[16px] font-semibold tracking-tight text-[#F5F2EB]">
                        {effectiveContinue.name}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-[12.5px] text-[#F5F2EB]/65">
                        {effectiveContinue.address || effectiveContinue.location || 'Bogor, Jawa Barat'}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold tabular-nums tracking-wide text-[#F5F2EB]">
                          <StarIcon filled className="h-3.5 w-3.5 text-[#DFAA63]" aria-hidden="true" />
                          {Number(effectiveContinue.rating || 0).toFixed(1)}
                        </span>
                        {formatDistanceLabel(effectiveContinue) && (
                          <span className="font-mono font-medium tabular-nums tracking-wide text-[#DFAA63]">
                            {formatDistanceLabel(effectiveContinue)} dari Anda
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center justify-end gap-2 border-t border-[rgba(244,239,230,0.12)] p-3 sm:border-t-0 sm:border-l sm:px-4">
                    <button
                      type="button"
                      aria-pressed={checkFavorite(effectiveContinue.slug)}
                      aria-label={
                        checkFavorite(effectiveContinue.slug)
                          ? `Hapus ${effectiveContinue.name} dari favorit`
                          : `Simpan ${effectiveContinue.name} ke favorit`
                      }
                      onClick={() => toggleFavorite && toggleFavorite(effectiveContinue.slug)}
                      className={`apple-retro-bevel flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-150 active:scale-[0.96] ${
                        checkFavorite(effectiveContinue.slug)
                          ? 'border-rose-300/35 bg-[#3B1D24]/75 text-rose-300'
                          : 'border-[rgba(244,239,230,0.16)] bg-white/[0.06] text-[#F5F2EB] hover:bg-white/[0.12]'
                      }`}
                    >
                      <HeartIcon filled={checkFavorite(effectiveContinue.slug)} className="h-5 w-5" />
                    </button>
                    {onStartNavigation && (
                      <button
                        type="button"
                        onClick={() => handleQuickRoute(effectiveContinue)}
                        className="apple-retro-cta inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 text-[12.5px] font-semibold active:scale-[0.98]"
                      >
                        <RouteWaypointsIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Lanjutkan rute</span>
                      </button>
                    )}
                  </div>
                </article>
              </section>
            )}

            <section aria-labelledby="rec-heading">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2
                    id="rec-heading"
                    className="text-[17px] font-semibold tracking-tight text-[#F5F2EB] sm:text-[18px]"
                  >
                    Berdasarkan Minat & Riwayatmu
                  </h2>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#F5F2EB]/60">
                    {usingCuratedFallbackForLoggedIn
                      ? 'Menampilkan destinasi unggulan di Bogor selagi riwayat perjalanan Anda terkumpul'
                      : 'Disusun dari tempat favorit, aktivitas, dan riwayat penelusuran Anda'}
                  </p>
                </div>
              </div>

              {displayedPersonalized.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedPersonalized.map((item) => (
                    <DestinationCard
                      key={item.id || item.slug}
                      place={item}
                      favoriteActive={checkFavorite(item.slug)}
                      onToggleFavorite={toggleFavorite}
                      onOpenDetail={handleCardOpen}
                      onStartNavigation={onStartNavigation ? handleQuickRoute : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="apple-glass-card mt-4 rounded-2xl p-5 text-[13px] text-white/65">
                  Belum ada rekomendasi tersedia saat ini.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ForYouPage)
