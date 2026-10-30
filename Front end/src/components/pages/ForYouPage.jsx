import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEFAULT_RECOMMENDED_ITEMS = [
  {
    id: 'tugu-kujang',
    slug: 'tugu-kujang',
    name: 'Tugu Kujang - Bogor Kota',
    location: 'Bogor, jawa barat',
    rating: '4.4',
    image: '/images/tugu-kujang.jpg',
  },
  {
    id: 'museum-zoologi',
    slug: 'museum-zoologi-bogor',
    name: 'Museum of zoology - Bogor Tengah',
    location: 'Bogor, jawa barat',
    rating: '4.7',
    image: '/images/museum-zoologi.jpg',
  },
  {
    id: 'museum-peta',
    slug: 'museum-peta',
    name: 'Museum PETA - Bogor Kota',
    location: 'Bogor, jawa barat',
    rating: '4.6',
    image: '/images/museum-peta.jpg',
  },
]

const DEFAULT_CONTINUE_ITEM = {
  id: 'museum-peta-continue',
  slug: 'museum-peta',
  name: 'Museum PETA - Bogor Kota',
  location: 'Bogor, jawa barat',
  rating: '4.6',
  image: '/images/museum-peta.jpg',
}

function ForYouPage({
  favorites = [],
  toggleFavorite,
  isFavorite,
  onSelectPlace,
  isLoggedIn = false,
  onRequireLogin,
  onOpenProfile,
}) {
  const navigate = useNavigate()
  const [recommendedItems, setRecommendedItems] = useState([])
  const [continueItem, setContinueItem] = useState(null)

  // Fetch data rekomendasi 'Untuk Anda' dari Backend API HANYA JIKA LOGGED IN
  useEffect(() => {
    if (!isLoggedIn) return

    let isMounted = true
    fetch('/api/for-you')
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((json) => {
        if (isMounted && json?.data) {
          if (Array.isArray(json.data.recommended)) {
            setRecommendedItems(json.data.recommended)
          }
          if (json.data.continue_item) {
            setContinueItem(json.data.continue_item)
          }
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat rekomendasi Untuk Anda dari API, fallback ke default:', err)
        if (isMounted) {
          setRecommendedItems(DEFAULT_RECOMMENDED_ITEMS)
          setContinueItem(DEFAULT_CONTINUE_ITEM)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  const effectiveRecommended = isLoggedIn ? recommendedItems : []
  const effectiveContinue = isLoggedIn ? continueItem : null

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
        className="group flex items-center justify-between gap-3 py-3 transition"
      >
        <button
          type="button"
          onClick={() => handleCardClick(item.slug)}
          className="flex flex-1 cursor-pointer items-center gap-3.5 text-left focus-visible:outline-none"
        >
          <img
            src={item.image}
            alt={item.name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm transition group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-semibold text-white group-hover:text-amber-200 transition-colors">
              {item.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-white/60">{item.location}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              <span className="text-amber-400">★</span>
              <span className="font-medium text-white/80">{item.rating}</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          aria-label={`Favoritkan ${item.name}`}
          onClick={() => toggleFavorite && toggleFavorite(item.slug)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            favoriteActive
              ? 'text-rose-400 hover:text-rose-300'
              : 'text-white/65 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={favoriteActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-7 pb-28 max-w-md mx-auto overscroll-contain overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold tracking-tight text-white">Untuk Kamu</h1>
        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              if (onRequireLogin) onRequireLogin()
            } else if (onOpenProfile) {
              onOpenProfile('self')
            }
          }}
          aria-label="Profil pengguna"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/90 transition hover:bg-white/10 active:scale-95 cursor-pointer overflow-hidden"
        >
          {isLoggedIn ? (
            <img
              src="/images/avatar-ambalingham.jpg"
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              width="18"
              height="18"
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

      {!isLoggedIn ? (
        /* Empty State Jika Pengguna Belum Login */
        <div className="mt-14 flex flex-col items-center justify-center text-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-forest-700/60 border border-white/15 text-3xl shadow-inner mb-4">
            ✨
          </div>
          <h2 className="text-[17px] font-bold text-white tracking-tight">
            Rekomendasi Spesial Untuk Anda
          </h2>
          <p className="mt-2 text-[12px] text-white/60 max-w-xs leading-relaxed">
            Masuk dengan akun Anda untuk melihat kurasi tempat wisata berdasarkan aktivitas, riwayat perjalanan, dan preferensi Anda.
          </p>
          <button
            type="button"
            onClick={onRequireLogin}
            className="mt-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-6 py-3 text-[13px] font-bold text-white shadow-lg transition cursor-pointer border border-emerald-400/30"
          >
            Masuk ke Akun
          </button>
        </div>
      ) : (
        <>
          {/* Section 1: Berdasarkan aktivitas terakhir kamu */}
          <div className="mt-6">
            <h2 className="text-[14px] font-bold tracking-tight text-white">
              Berdasarkan aktivitas terakhir kamu
            </h2>
            <p className="mt-0.5 text-[11px] text-white/60">
              Beberapa tempat yang kami rekomendasikan
            </p>

            <div className="mt-3 flex flex-col divide-y divide-white/10">
              {effectiveRecommended.map((item) => renderItem(item))}
            </div>
          </div>

          {/* Section 2: Lanjutkan Perjalanan ? */}
          <div className="mt-6">
            <h2 className="text-[14px] font-bold tracking-tight text-white">
              Lanjutkan Perjalanan ?
            </h2>
            <p className="mt-0.5 text-[11px] text-white/60">Terakhir dilihat</p>

            <div className="mt-3 flex flex-col divide-y divide-white/10">
              {effectiveContinue && renderItem(effectiveContinue)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default memo(ForYouPage)
