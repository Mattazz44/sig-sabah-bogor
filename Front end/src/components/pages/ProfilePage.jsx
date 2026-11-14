import { memo, useEffect, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import { apiFetch } from '../../utils/api'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../../utils/imageHelper'
import { CheckIcon, ChevronLeftIcon } from '../ui/VectorIcons'

function ProfilePage({
  user = 'self',
  tourists = [],
  favorites = [],
  recentSlugs = [],
  onBack,
  onLogout,
  onStartCustomRoute,
}) {
  const isSelf = user === 'self' || Boolean(user?.isSelf)
  const [isFollowing, setIsFollowing] = useState(false)

  const profileName = isSelf ? user?.name || 'Pengguna' : user?.name || 'Penjelajah Bogor'
  const profileAvatar = user?.avatar
  const profileEmail = isSelf ? user?.email || null : null

  const [profileState, setProfileState] = useState({
    loaded: false,
    routes: [],
    posts: [],
  })

  useEffect(() => {
    let isMounted = true

    if (isSelf) {
      apiFetch('/api/saved-activities')
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!isMounted) return
          const mappedRoutes = Array.isArray(json?.data?.custom_routes)
            ? json.data.custom_routes.map((cr) => {
                const stops = Array.isArray(cr.stops) ? cr.stops : []
                const places = stops.map((s) => s.place).filter(Boolean)
                return {
                  id: cr.slug || `cr-${cr.id}`,
                  title: String(cr.title || '').replace(/\s*➔\s*/g, ' ke '),
                  desc: cr.desc || `${stops.length} titik singgah`,
                  totalDistance: cr.total_distance || `${stops.length} titik`,
                  places: places.length > 0 ? places : tourists.slice(0, 1),
                }
              })
            : []
          setProfileState({ loaded: true, routes: mappedRoutes, posts: [] })
        })
        .catch(() => {
          if (isMounted) setProfileState({ loaded: true, routes: [], posts: [] })
        })
    } else {
      apiFetch('/api/activities')
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!isMounted) return
          const rows = Array.isArray(json?.data) ? json.data : []
          const matching = rows
            .filter(
              (item) =>
                item.user_name &&
                item.user_name.toLowerCase() === profileName.toLowerCase(),
            )
            .map((item) => ({
              id: item.id,
              title: item.title,
              location: item.location,
              image: item.image,
              date: item.date,
            }))
          setProfileState({ loaded: true, routes: [], posts: matching })
        })
        .catch(() => {
          if (isMounted) setProfileState({ loaded: true, routes: [], posts: [] })
        })
    }

    return () => {
      isMounted = false
    }
  }, [isSelf, profileName, tourists])

  return (
    <div
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}
      className="animate-tab-enter relative mx-auto h-full min-h-0 w-full max-w-md overflow-y-auto overscroll-contain overscroll-y-contain bg-forest-900 px-5 pt-6 text-[#EBF0EB]"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="btn-back-profile"
          onClick={onBack}
          aria-label="Kembali"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] transition-colors duration-150 hover:bg-[#31442B] active:scale-[0.97]"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <h1 className="text-[17px] font-bold tracking-tight text-[#EBF0EB]">
          {isSelf ? 'Profil saya' : 'Profil penjelajah'}
        </h1>

        {isSelf ? (
          <button
            type="button"
            id="btn-logout-icon"
            onClick={onLogout}
            title="Keluar dari akun"
            aria-label="Keluar dari akun"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBF0EB]/18 bg-[#253320] text-rose-200 transition-colors duration-150 hover:bg-[#3B1D24] hover:text-rose-100 active:scale-[0.97]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        ) : (
          <div className="h-11 w-11" aria-hidden="true" />
        )}
      </div>

      {/* Header Identitas */}
      <div className="mt-6 flex flex-col items-center text-center">
        <SafeImage
          src={profileAvatar}
          fallback={DEFAULT_AVATAR_PLACEHOLDER}
          alt={profileName}
          className="h-24 w-24 rounded-full border-4 border-emerald-400/40 object-cover shadow-md"
        />

        <h2 className="mt-3 text-[20px] font-bold tracking-tight text-[#EBF0EB]">
          {profileName}
        </h2>

        {isSelf && profileEmail && (
          <p className="mt-0.5 text-[12px] font-medium text-[#C8D3C8]">{profileEmail}</p>
        )}

        <span className="mt-2 rounded-lg border border-[#EBF0EB]/14 bg-[#253320] px-3 py-1 text-[11px] font-semibold text-emerald-200">
          {isSelf ? 'Akun penjelajah' : 'Komunitas Sabah Bogor'}
        </span>

        {!isSelf && (
          <button
            type="button"
            id="btn-follow-user"
            aria-pressed={isFollowing}
            onClick={() => setIsFollowing((prev) => !prev)}
            className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-[12.5px] font-semibold shadow-sm transition-colors duration-150 active:scale-[0.97] ${
              isFollowing
                ? 'border border-[#EBF0EB]/18 bg-[#253320] text-[#EBF0EB] hover:bg-[#31442B]'
                : 'bg-[#EBF0EB] text-[#161E16] hover:bg-[#DCE4DC]'
            }`}
          >
            {isFollowing ? (
              <>
                <span>Mengikuti</span>
                <CheckIcon className="h-3.5 w-3.5 text-emerald-300" />
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Ikuti perjalanan</span>
              </>
            )}
          </button>
        )}

        {/* Ringkasan Statistik Riil */}
        <div className="mt-6 flex w-full max-w-xs items-center justify-around rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] px-3 py-3">
          {isSelf ? (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-bold tabular-nums text-[#EBF0EB]">
                  {favorites.length}
                </span>
                <span className="text-[11px] text-[#C8D3C8]">Favorit</span>
              </div>
              <div className="h-6 w-px bg-[#EBF0EB]/12" aria-hidden="true" />
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-bold tabular-nums text-[#EBF0EB]">
                  {recentSlugs.length}
                </span>
                <span className="text-[11px] text-[#C8D3C8]">Dilihat</span>
              </div>
              <div className="h-6 w-px bg-[#EBF0EB]/12" aria-hidden="true" />
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-bold tabular-nums text-[#EBF0EB]">
                  {profileState.loaded ? profileState.routes.length : '-'}
                </span>
                <span className="text-[11px] text-[#C8D3C8]">Rute custom</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-bold tabular-nums text-[#EBF0EB]">
                  {profileState.loaded ? profileState.posts.length : '-'}
                </span>
                <span className="text-[11px] text-[#C8D3C8]">Aktivitas</span>
              </div>
              <div className="h-6 w-px bg-[#EBF0EB]/12" aria-hidden="true" />
              <div className="flex flex-col items-center">
                <span className="text-[14px] font-bold text-[#E2D7B5]">
                  {isFollowing ? 'Mengikuti' : 'Aktif'}
                </span>
                <span className="text-[11px] text-[#C8D3C8]">Status</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Konten Rute / Aktivitas */}
      <div className="mt-8">
        {isSelf ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-bold tracking-tight text-[#EBF0EB]">
                Rute saya
              </h3>
              <span className="text-[12px] text-[#C8D3C8] tabular-nums">
                {profileState.loaded ? `${profileState.routes.length} rute tersimpan` : 'Memuat...'}
              </span>
            </div>

            {!profileState.loaded ? (
              <div className="h-28 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020]" />
            ) : profileState.routes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {profileState.routes.map((route) => (
                  <div
                    key={route.id}
                    className="flex flex-col rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-3.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-[#EBF0EB]">{route.title}</span>
                      <span className="shrink-0 rounded-lg border border-emerald-400/25 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                        {route.totalDistance}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#C8D3C8]">{route.desc}</p>
                    {onStartCustomRoute && route.places?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onStartCustomRoute(route.places)}
                        className="mt-3 flex min-h-[42px] items-center justify-center rounded-xl bg-[#EBF0EB] py-2 text-[12px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
                      >
                        Mulai navigasi rute
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-4 text-center">
                <p className="text-[12.5px] text-[#C8D3C8]">
                  Belum ada rute custom tersimpan di akun Anda.
                </p>
              </div>
            )}

            <div className="mt-8 border-t border-[#EBF0EB]/12 pt-4">
              <button
                type="button"
                id="btn-logout-profile"
                onClick={onLogout}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-[#3B1D24] py-3 text-[13px] font-semibold text-rose-100 shadow-sm transition-colors duration-150 hover:bg-[#49242D] active:scale-[0.97]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Keluar dari akun</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-3 text-[14px] font-bold tracking-tight text-[#EBF0EB]">
              Aktivitas terkini {profileName}
            </h3>
            {!profileState.loaded ? (
              <div className="h-44 rounded-2xl border border-[#EBF0EB]/10 bg-[#233020]" />
            ) : profileState.posts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {profileState.posts.map((post) => (
                  <article
                    key={post.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-3 shadow-sm"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#1C2719]">
                      <SafeImage
                        src={post.image}
                        fallback={DEFAULT_IMAGE_PLACEHOLDER}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h4 className="mt-2.5 text-[13.5px] font-bold text-[#EBF0EB]">{post.title}</h4>
                    <p className="mt-0.5 text-[12px] text-[#C8D3C8]">
                      {post.location}
                      {post.date ? ` · ${post.date}` : ''}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] p-4 text-center">
                <p className="text-[12.5px] text-[#C8D3C8]">
                  Belum ada postingan publik dari {profileName}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ProfilePage)
