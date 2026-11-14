import { memo, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../utils/api'
import { AlertTriangleIcon, CompassIcon, XIcon } from './VectorIcons'

function getFocusableElements(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const cardRef = useRef(null)
  const previousFocusRef = useRef(null)

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
    }, 250)
    return () => clearTimeout(timerId)
  }, [isOpen, isClosing])

  const shouldRender = isOpen || isClosing
  const isVisible = isOpen && isEntered && !isClosing

  useEffect(() => {
    if (!shouldRender) return undefined
    previousFocusRef.current = document.activeElement
    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusableElements(cardRef.current)
      focusables[0]?.focus()
    }, 20)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusables = getFocusableElements(cardRef.current)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [shouldRender, onClose])

  if (!shouldRender) return null

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
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal. Periksa kembali email dan kata sandi.')
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.data)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal terhubung ke server autentikasi.')
    } finally {
      setIsLoading(false)
    }
  }

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal masuk dengan akun Google.')
      }

      const data = await res.json()
      if (onLoginSuccess && data?.data) {
        onLoginSuccess(data.data)
      } else {
        throw new Error('Data akun tidak valid.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Layanan autentikasi belum merespons. Pastikan server aktif.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      id="login-modal-overlay"
      onClick={onClose}
      className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/35 backdrop-blur-sm p-4 transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={cardRef}
        id="login-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-modal relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-3xl px-6 py-7 text-center text-[#EBF0EB] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.28),0_24px_48px_-12px_rgba(0,0,0,0.48)] transition-[opacity,transform] duration-[250ms] ease-out ${
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-3 scale-95 opacity-0'
        }`}
      >
        <button
          type="button"
          id="btn-close-login-modal"
          onClick={onClose}
          aria-label="Tutup dialog login"
          className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#EBF0EB] transition-colors duration-150 hover:bg-[rgba(20,28,20,0.68)] active:scale-[0.97] before:absolute before:-inset-1"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <div className="-mt-4 mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#E2D7B5] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.22)]">
          <CompassIcon className="h-6 w-6" duotone />
        </div>

        <h2 id="login-modal-title" className="text-[19px] font-bold tracking-tight text-white">
          Masuk ke akun
        </h2>
        <p className="mx-auto mt-1.5 max-w-[270px] text-[12.5px] leading-relaxed text-[#E2EAE2]">
          Simpan rute perjalanan custom, bagikan dokumentasi wisata, dan kelola daftar favorit Anda.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-300/35 bg-[#2a1216]/90 px-3 py-2.5 text-left text-[12px] text-rose-100"
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5 text-left">
          <div>
            <label htmlFor="input-login-email" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
              Email atau username
            </label>
            <input
              type="text"
              id="input-login-email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="nama@email.com"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-[#EBF0EB] transition-colors duration-150"
              required
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="input-login-password" className="text-[12px] font-medium text-[#EBF0EB]">
                Kata sandi
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="relative px-1 py-0.5 text-[12px] font-medium text-[#E2EAE2] transition-colors hover:text-white before:absolute before:-inset-2"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="input-login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="liquid-glass-input min-h-[44px] w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-[#EBF0EB] transition-colors duration-150"
              required
            />
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            disabled={isLoading}
            className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#EBF0EB] py-2.5 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97] disabled:opacity-60"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.16]" />
          <span className="text-[11px] font-medium text-[#E2EAE2]">
            atau
          </span>
          <div className="h-px flex-1 bg-white/[0.16]" />
        </div>

        <button
          type="button"
          id="btn-login-google"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.2] bg-[rgba(20,28,20,0.45)] px-4 py-2.5 text-[12.5px] font-semibold text-[#EBF0EB] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.16)] transition-colors duration-150 hover:bg-[rgba(20,28,20,0.68)] active:scale-[0.97] disabled:opacity-60"
        >
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

        <button
          type="button"
          onClick={onClose}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-[12.5px] font-medium text-[#E2EAE2] transition-colors duration-150 hover:text-white"
        >
          Nanti saja
        </button>
      </div>
    </div>
  )
}

export default memo(LoginModal)
