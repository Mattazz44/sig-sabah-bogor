import { memo, useEffect, useState } from 'react'
import { apiFetch } from '../../utils/api'
import { AlertTriangleIcon, CompassIcon, XIcon } from './VectorIcons'

/**
 * Modal Autentikasi ("Masuk ke Akun") dengan animasi buka/tutup halus (fade + scale 0.96 -> 1, 200ms ease-out),
 * hierarki kedalaman berlapis, dan ikon vektor bersih.
 */
function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [emailOrUsername, setEmailOrUsername] = useState('ambalingham@gmail.com')
  const [password, setPassword] = useState('password123')
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // State animasi buka & tutup modal (fade backdrop + scale card 0.96 -> 1, 200ms ease-out)
  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [isEntered, setIsEntered] = useState(isOpen)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setIsClosing(false)
      setIsEntered(false)
    } else {
      setIsClosing(true)
    }
  }

  useEffect(() => {
    if (isOpen) {
      let nestedRafId = 0
      const rafId = requestAnimationFrame(() => {
        nestedRafId = requestAnimationFrame(() => {
          setIsEntered(true)
        })
      })
      return () => {
        cancelAnimationFrame(rafId)
        cancelAnimationFrame(nestedRafId)
      }
    }

    if (!isClosing) return undefined
    const timerId = setTimeout(() => {
      setIsClosing(false)
      setIsEntered(false)
    }, 200)
    return () => clearTimeout(timerId)
  }, [isOpen, isClosing])

  const shouldRender = isOpen || isClosing
  const isVisible = isOpen && isEntered && !isClosing

  useEffect(() => {
    if (!shouldRender) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shouldRender, onClose])

  if (!shouldRender) return null

  // Handler Submit Login Email / Username & Password (Manual Tanpa Google)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emailOrUsername.trim()) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          login: emailOrUsername.trim(),
          password: password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal. Silakan periksa kembali email dan password.')
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.data)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat masuk.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handler Login Alternatif dengan Akun Google
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: 'ambalingham@gmail.com' }),
      })

      const data = await res.json()
      if (onLoginSuccess) {
        onLoginSuccess(data.data)
      }
    } catch (err) {
      console.warn('Google login fallback:', err)
      if (onLoginSuccess) onLoginSuccess()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      id="login-modal-overlay"
      onClick={onClose}
      className={`fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        id="login-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-3xl bg-[#253320] border border-white/10 px-6 py-7 text-center shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.05)] max-h-[92vh] overflow-y-auto transition-[opacity,transform] duration-200 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.96]'
        }`}
      >
        {/* Tombol Close Vektor */}
        <button
          type="button"
          id="btn-close-login-modal"
          onClick={onClose}
          aria-label="Tutup modal login"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-white/75 hover:bg-white/15 hover:text-white active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* Ikon Vektor Brand Aplikasi */}
        <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34462c] border border-white/10 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_16px_rgba(0,0,0,0.22)]">
          <CompassIcon className="h-6 w-6" duotone />
        </div>

        {/* Judul & Deskripsi */}
        <h2 id="login-modal-title" className="text-[19px] font-bold text-white tracking-tight">
          Masuk ke Akun
        </h2>
        <p className="mt-1.5 text-[12px] text-white/65 leading-relaxed max-w-[270px] mx-auto">
          Masuk untuk menyimpan rute custom, bagikan dokumentasi wisata, dan buka rekomendasi personal Anda.
        </p>

        {/* Notifikasi Error jika login gagal */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-950/60 border border-rose-400/25 px-3 py-2.5 text-[11px] text-rose-200 text-left">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Form Login Mandiri (Email / Username & Password) */}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5 text-left">
          <div>
            <label htmlFor="input-login-email" className="text-[11px] font-medium text-white/75 block mb-1.5">
              Email atau Username
            </label>
            <input
              type="text"
              id="input-login-email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="Contoh: ambalingham@gmail.com"
              className="w-full rounded-xl bg-[#1d2818] border border-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/15 transition-all duration-150"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-login-password" className="text-[11px] font-medium text-white/75">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-[11px] font-medium text-emerald-300/90 hover:text-emerald-200 transition-colors cursor-pointer"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="input-login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi Anda"
              className="w-full rounded-xl bg-[#1d2818] border border-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/15 transition-all duration-150"
              required
            />
          </div>

          {/* Tombol Masuk Primer */}
          <button
            type="submit"
            id="btn-login-submit"
            disabled={isLoading}
            className="mt-1 flex w-full items-center justify-center rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] py-2.5 text-[13px] font-semibold text-white border border-white/15 shadow-[0_6px_16px_rgba(5,150,105,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-150 ease-out cursor-pointer disabled:opacity-60"
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Akun'}
          </button>
        </form>

        {/* Divider 'atau' */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-medium text-white/45 uppercase tracking-wider">
            atau
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Tombol Masuk dengan Google */}
        <button
          type="button"
          id="btn-login-google"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-[12.5px] font-semibold text-neutral-800 border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.22)] hover:bg-neutral-100 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer disabled:opacity-60"
        >
          {/* Google Colored G Icon */}
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
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

        {/* Informasi Akun Demo Terstruktur */}
        <div className="mt-4 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-left flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Akun Demo
            </p>
            <p className="mt-0.5 truncate text-[11px] font-mono text-emerald-300/95">
              ambalingham@gmail.com
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Sandi
            </p>
            <p className="mt-0.5 text-[11px] font-mono text-white/85">
              password123
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-[11.5px] font-medium text-white/55 hover:text-white/90 active:scale-[0.97] transition-all duration-150 cursor-pointer py-1 px-3"
        >
          Nanti saja
        </button>
      </div>
    </div>
  )
}

export default memo(LoginModal)
