import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import SafeImage from '../ui/SafeImage'
import {
  CompassIcon,
  HeartIcon,
  RefreshIcon,
  StarIcon,
  UserIcon,
} from '../ui/VectorIcons'
import { DEFAULT_AVATAR_PLACEHOLDER } from '../../utils/imageHelper'

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
            .slice(0, 4)
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

  const isFetching = isLoggedIn && recState.key !== requestKey
  const effectiveRecommended = isLoggedIn ? recState.recommended : []
  const effectiveContinue = isLoggedIn ? recState.continueItem : null

  const handleCardClick = (slug) => {
    if (onSelectPlace) {
      onSelectPlace(slug)
    } else {
      navigate(`/place/${slug}`)
    }
  }

  const renderItem = (item) => {
    const favoriteActive = isFavorite ? isFavorite(item.slug) : favorites.includes(item.slug)

    return (
      <div
        key={item.id}
        className="group flex items-center justify-between gap-3 py-3"
      >
        <button
          type="button"
          onClick={() => handleCardClick(item.slug)}
          className="flex flex-1 items-center gap-3.5 rounded-2xl p-1 text-left transition-colors duration-150 hover:bg-[#233020]/70 active:scale-[0.98]"
        >
          <SafeImage
            src={item.image}
            alt={item.name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13.5px] font-semibold text-[#EBF0EB] transition-colors group-hover:text-[#E2D7B5]">
              {item.name}
            </h3>
            <p className="mt-0.5 truncate text-[12px] text-[#C8D3C8]">{item.location}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[12px]">
              <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span className="font-medium tabular-nums text-[#EBF0EB]">{item.rating}</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={favoriteActive}
          aria-label={favoriteActive ? `Hapus ${item.name} dari favorit` : `Favoritkan ${item.name}`}
          onClick={() => toggleFavorite && toggleFavorite(item.slug)}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors before:absolute before:-inset-1 ${
            favoriteActive
              ? 'text-rose-300 hover:bg-[#3B1D24]/60'
              : 'text-[#C8D3C8] hover:bg-[#EBF0EB]/10 hover:text-[#EBF0EB]'
          }`}
        >
          <HeartIcon filled={favoriteActive} className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter mx-auto h-full min-h-0 w-full max-w-md overflow-y-auto overscroll-contain overscroll-y-contain will-change-transform transform-gpu bg-forest-900 px-5 pt-6 text-[#EBF0EB]"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold tracking-tight text-[#EBF0EB]">Untuk Anda</h1>
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
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#EBF0EB]/20 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#2F4128] active:scale-[0.97]"
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
      </div>

      {!isLoggedIn ? (
        <div className="mt-12 flex flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#EBF0EB]/16 bg-[#253320] text-[#E2D7B5] shadow-md">
            <CompassIcon className="h-9 w-9" duotone />
          </div>
          <h2 className="text-[17px] font-bold tracking-tight text-[#EBF0EB]">
            Rekomendasi untuk Anda
          </h2>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[#C8D3C8]">
            Masuk untuk melihat daftar destinasi yang disesuaikan dengan riwayat kunjungan dan tempat favorit Anda.
          </p>
          <button
            type="button"
            onClick={onRequireLogin}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#EBF0EB] px-6 py-2.5 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
          >
            Masuk ke akun
          </button>
        </div>
      ) : (isLoadingTourists || isFetching) && effectiveRecommended.length === 0 ? (
        <div className="mt-6 space-y-3" aria-live="polite">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex items-center gap-3.5 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020] p-3"
            >
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#1C2719]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-[#2E3E2A]" />
                <div className="h-3 w-1/2 rounded bg-[#2A3826]" />
              </div>
            </div>
          ))}
        </div>
      ) : (recState.error || isBackendError) && effectiveRecommended.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-rose-400/25 bg-[#2a1216] p-5 text-center">
          <p className="text-[14px] font-semibold text-[#EBF0EB]">
            Rekomendasi belum bisa dimuat
          </p>
          <p className="mt-1 text-[12px] text-rose-100/85">
            Periksa sambungan ke server backend lalu coba muat ulang.
          </p>
          <button
            type="button"
            onClick={() => {
              if (onRetryBackend) onRetryBackend()
              setReloadTick((prev) => prev + 1)
            }}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#EBF0EB]/20 bg-[#EBF0EB]/12 px-4 text-[12px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#EBF0EB]/20"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            <span>Coba lagi</span>
          </button>
        </div>
      ) : (
        <>
          <section className="mt-6" aria-labelledby="rec-heading">
            <h2 id="rec-heading" className="text-[14px] font-bold tracking-tight text-[#EBF0EB]">
              Rekomendasi destinasi
            </h2>
            <p className="mt-0.5 text-[12px] text-[#C8D3C8]">
              Disusun dari preferensi dan lokasi favorit Anda
            </p>

            {effectiveRecommended.length > 0 ? (
              <div className="mt-3 flex flex-col divide-y divide-[#EBF0EB]/10">
                {effectiveRecommended.map((item) => renderItem(item))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020] p-4 text-[12.5px] text-[#C8D3C8]">
                Belum ada rekomendasi tersedia saat ini.
              </p>
            )}
          </section>

          {effectiveContinue && (
            <section className="mt-6" aria-labelledby="continue-heading">
              <h2 id="continue-heading" className="text-[14px] font-bold tracking-tight text-[#EBF0EB]">
                Lanjutkan perjalanan
              </h2>
              <p className="mt-0.5 text-[12px] text-[#C8D3C8]">Terakhir dilihat</p>

              <div className="mt-3 flex flex-col divide-y divide-[#EBF0EB]/10">
                {renderItem(effectiveContinue)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default memo(ForYouPage)
