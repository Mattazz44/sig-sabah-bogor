import { memo, useState } from 'react'
import tourists from '../../data/tourists.json'

function ProfilePage({ user = 'self', onBack, onLogout, onStartCustomRoute }) {
  const isSelf = user === 'self' || Boolean(user?.isSelf)
  const [isFollowing, setIsFollowing] = useState(false)

  // Data profil
  const profileName = isSelf ? 'Ambalingham' : user?.name || 'Kirk hasibuan'
  const profileAvatar = isSelf
    ? '/images/avatar-ambalingham.jpg'
    : user?.avatar || '/images/avatar-kirk.jpg'
  const profileEmail = isSelf ? 'ambalingham@gmail.com' : null // Tanpa email jika profil orang lain

  // Destinasi sampel untuk Rute Saya
  const museumZoologi = tourists.find((t) => t.slug === 'museum-zoologi-bogor')
  const museumPeta = tourists.find((t) => t.slug === 'museum-peta')

  return (
    <div className="relative h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-6 pb-28 max-w-md mx-auto overscroll-contain overflow-y-auto">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="btn-back-profile"
          onClick={onBack}
          aria-label="Kembali"
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

        <h1 className="text-[17px] font-bold tracking-tight text-white">
          {isSelf ? 'Profil Saya' : 'Profil Penjelajah'}
        </h1>

        {/* 4. TOMBOL LOGOUT ATAS (Hanya pada Akun Sendiri) */}
        {isSelf ? (
          <button
            type="button"
            id="btn-logout-icon"
            onClick={onLogout}
            title="Keluar dari Akun"
            aria-label="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 hover:text-white transition active:scale-95 cursor-pointer border border-rose-500/30"
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
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Profil Header Card */}
      <div className="mt-6 flex flex-col items-center text-center">
        {/* Foto Profil Besar */}
        <div className="relative">
          <img
            src={profileAvatar}
            alt={profileName}
            className="h-24 w-24 rounded-full object-cover border-4 border-emerald-500/40 shadow-xl"
          />
          <span className="absolute bottom-1 right-1 flex h-4 w-4 rounded-full bg-emerald-400 border-2 border-forest-900" />
        </div>

        {/* Nama Pengguna */}
        <h2 className="mt-3 text-[20px] font-bold text-white tracking-tight">
          {profileName}
        </h2>

        {/* Email Pengguna (Hanya Tampil Jika Akun Sendiri) */}
        {isSelf && profileEmail && (
          <p className="text-[12px] text-white/60 font-medium mt-0.5">
            {profileEmail}
          </p>
        )}

        {/* Badge & Deskripsi */}
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-forest-700/80 px-3 py-0.5 text-[10px] font-semibold text-emerald-300 border border-white/10">
            {isSelf ? 'Penjelajah Aktif' : 'Petualang Alam Bogor'}
          </span>
        </div>

        {/* 3. TOMBOL "IKUTI PERJALANAN" (Hanya pada Akun Orang Lain) */}
        {!isSelf && (
          <button
            type="button"
            id="btn-follow-user"
            onClick={() => setIsFollowing((prev) => !prev)}
            className={`mt-4 flex items-center gap-2 rounded-full px-5 py-2 text-[12px] font-bold transition shadow-md cursor-pointer active:scale-95 border ${
              isFollowing
                ? 'bg-white/15 text-white/90 border-white/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/30'
            }`}
          >
            {isFollowing ? (
              <>
                <span>Mengikuti</span>
                <span className="text-emerald-300">✓</span>
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Ikuti Perjalanan</span>
              </>
            )}
          </button>
        )}

        {/* Quick Stats Row */}
        <div className="mt-6 flex w-full max-w-xs items-center justify-around rounded-2xl bg-forest-700/50 border border-white/10 py-3 px-2">
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-white">2</span>
            <span className="text-[10px] text-white/60">Rute Custom</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-white">128</span>
            <span className="text-[10px] text-white/60">Pengikut</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-white">45</span>
            <span className="text-[10px] text-white/60">Mengikuti</span>
          </div>
        </div>
      </div>

      {/* SECTION CONTENT: Rute Saya vs Aktivitas Pengguna */}
      <div className="mt-8">
        {isSelf ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-white tracking-tight">
                Rute Saya
              </h3>
              <span className="text-[11px] text-white/60">2 Rute Tersimpan</span>
            </div>

            {/* Rute 1 */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col rounded-2xl bg-forest-700/70 border border-white/10 p-3.5 shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white">
                    Museum of Zoology ➔ Museum PETA
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    5.4 KM
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  2 titik singgah edukasi sejarah Bogor
                </p>
                {onStartCustomRoute && museumZoologi && museumPeta && (
                  <button
                    type="button"
                    onClick={() => onStartCustomRoute([museumZoologi, museumPeta])}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-1.5 text-[11px] font-bold text-white transition cursor-pointer"
                  >
                    <span>Mulai Navigasi Rute</span>
                  </button>
                )}
              </div>

              {/* Rute 2 */}
              <div className="flex flex-col rounded-2xl bg-forest-700/70 border border-white/10 p-3.5 shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white">
                    Kuliner Surya Kencana
                  </span>
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/20">
                    3.0 KM
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">
                  Pusat kuliner legendaris Bogor
                </p>
              </div>
            </div>

            {/* 4. TOMBOL LOGOUT BAWAH DI PROFIL AKUN SENDIRI */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <button
                type="button"
                id="btn-logout-profile"
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600/90 hover:bg-rose-600 active:scale-95 py-3 text-[13px] font-bold text-white shadow-lg transition cursor-pointer border border-rose-400/30"
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
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-[14px] font-bold text-white tracking-tight mb-3">
              Aktivitas Terkini {profileName}
            </h3>
            <article className="flex flex-col rounded-2xl bg-forest-700/70 border border-white/10 p-3 shadow overflow-hidden">
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-black/20">
                <img
                  src="/images/curug-cikuluwung.jpg"
                  alt="Curug Cikuluwung"
                  className="h-full w-full object-cover"
                />
              </div>
              <h4 className="mt-2 text-[13px] font-bold text-white">
                Perjalanan alam ke curug cikuluwung
              </h4>
              <p className="text-[11px] text-white/60">
                Curug cikuluwung - Bogor selatan
              </p>
            </article>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ProfilePage)
