import { memo } from 'react'

function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  if (!isOpen) return null

  return (
    <div
      id="login-modal-overlay"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="login-modal-card"
        className="relative w-full max-w-xs rounded-3xl bg-forest-900 border border-white/20 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Tombol Close X */}
        <button
          type="button"
          id="btn-close-login-modal"
          onClick={onClose}
          aria-label="Tutup modal login"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
        >
          ✕
        </button>

        {/* Icon Banner */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-700/80 border border-white/15 text-2xl shadow-inner">
          🗺️
        </div>

        {/* Judul & Deskripsi */}
        <h2 className="text-[19px] font-bold text-white tracking-tight">
          Log in page
        </h2>
        <p className="mt-1.5 text-[12px] text-white/70 leading-relaxed">
          Masuk ke akun Anda untuk menyimpan rute custom, posting foto perjalanan, dan terhubung dengan komunitas Bogor.
        </p>

        {/* Tombol "Masuk dengan Google" */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            id="btn-login-google"
            onClick={onLoginSuccess}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-[13px] font-bold text-gray-800 shadow-lg hover:bg-gray-100 active:scale-95 transition cursor-pointer border border-gray-200"
          >
            {/* Google Colored G Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-white/50 hover:text-white/80 transition cursor-pointer py-1"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(LoginModal)
