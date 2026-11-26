import { memo, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { apiFetch, buildApiUrl, setAuthToken, setStoredUser } from '../../utils/api'
import {
  AlertTriangleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  XIcon,
} from './VectorIcons'

const INTRO_EASE = [0.22, 1, 0.36, 1]

function SabahLogoIntro({ reducedMotion }) {
  if (reducedMotion) {
    return (
      <div className="relative mx-auto -mt-3 mb-4 flex h-20 w-20 items-center justify-center">
        <div
          id="login-brand-logo-wrap"
          className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.18] bg-[#161D15] p-1.5 shadow-[0_14px_30px_-8px_rgba(78,138,54,0.42),0_4px_12px_rgba(0,0,0,0.45)]"
        >
          <img
            id="login-brand-logo"
            src="/SABAH.png"
            alt="Logo Sabah Bogor"
            className="h-full w-full rounded-xl object-contain"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto -mt-3 mb-4 flex h-20 w-20 items-center justify-center">
      {/* Glow pulse latar belakang yang menyala lembut selama ~2.35 detik */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.65 }}
        animate={{
          opacity: [0, 0.72, 0.28],
          scale: [0.65, 1.24, 1.04],
        }}
        transition={{ duration: 2.35, times: [0, 0.48, 1], ease: INTRO_EASE }}
        className="pointer-events-none absolute -inset-3 rounded-3xl blur-xl"
        style={{
          background:
            'radial-gradient(circle, rgba(122,184,74,0.52) 0%, rgba(223,170,99,0.28) 52%, transparent 74%)',
        }}
      />

      {/* Wadah emblem logo utama */}
      <motion.div
        id="login-brand-logo-wrap"
        initial={{ opacity: 0, scale: 0.76, rotate: -4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.05, ease: INTRO_EASE }}
        className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.18] bg-[#161D15] p-1.5 shadow-[0_14px_32px_-8px_rgba(78,138,54,0.46),0_4px_12px_rgba(0,0,0,0.45)]"
      >
        {/* Fase 1 (0 - 1.85s): Trace jalur S peta & pin lokasi secara perlahan sebelum membentuk logo SABAH */}
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 64 64"
          fill="none"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 1, 0] }}
          transition={{ duration: 1.85, times: [0, 0.62, 1], ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full p-2.5"
        >
          {/* Garis jalur S menyerupai lengkungan jalan logo SABAH */}
          <motion.path
            d="M8 52 C24 44, 34 38, 30 28 C26 18, 34 12, 54 6"
            stroke="#F5F2EB"
            strokeWidth="4.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.15, ease: INTRO_EASE }}
          />
          {/* Pin peta kiri-atas muncul serempak */}
          <motion.g
            initial={{ opacity: 0, y: -8, scale: 0.58 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.38, duration: 0.65, ease: INTRO_EASE }}
            style={{ transformOrigin: '19px 21px' }}
          >
            <path
              d="M19 10 C14.6 10 11 13.4 11 17.8 C11 23.2 19 30.5 19 30.5 C19 30.5 27 23.2 27 17.8 C27 13.4 23.4 10 19 10 Z"
              fill="#DFAA63"
            />
            <circle cx="19" cy="17.8" r="3" fill="#161D15" />
          </motion.g>
          {/* Cincin radar halus di sekitar pin */}
          <motion.circle
            cx="19"
            cy="18"
            r="9"
            stroke="#8AC757"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0.55, 1.35, 1.55] }}
            transition={{ delay: 0.52, duration: 0.95, ease: 'easeOut' }}
            style={{ transformOrigin: '19px 18px' }}
          />
        </motion.svg>

        {/* Fase 2 (0.92s - 2.30s): Logo SABAH.png terbentuk penuh secara halus */}
        <motion.img
          id="login-brand-logo"
          src="/SABAH.png"
          alt="Logo Sabah Bogor"
          initial={{ opacity: 0, scale: 0.82, filter: 'blur(5px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.92, duration: 1.38, ease: INTRO_EASE }}
          className="relative z-0 h-full w-full rounded-xl object-contain"
        />

        {/* Kilauan cahaya diagonal (specular sheen) menyelesaikan intro di ~2.40s */}
        <motion.span
          aria-hidden="true"
          initial={{ x: '-140%', opacity: 0 }}
          animate={{ x: '140%', opacity: [0, 0.85, 0] }}
          transition={{ delay: 1.55, duration: 0.85, ease: INTRO_EASE }}
          className="pointer-events-none absolute inset-y-0 -left-6 z-20 w-10 -skew-x-20 bg-gradient-to-r from-transparent via-white/45 to-transparent"
        />
      </motion.div>
    </div>
  )
}

function getFocusableElements(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const prefersReducedMotion = useReducedMotion()
  const [authMode, setAuthMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const cardRef = useRef(null)
  const previousFocusRef = useRef(null)

  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [isEntered, setIsEntered] = useState(isOpen)
  const [openCycle, setOpenCycle] = useState(0)
  const [hasSwitchedMode, setHasSwitchedMode] = useState(false)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setIsClosing(false)
      setIsEntered(false)
      setErrorMessage(null)
      setHasSwitchedMode(false)
      setOpenCycle((prev) => prev + 1)
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

  const isRegisterMode = authMode === 'register'

  const handleSwitchMode = (nextMode) => {
    setHasSwitchedMode(true)
    setAuthMode(nextMode)
    setErrorMessage(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isRegisterMode) {
      if (fullName.trim().length < 2) {
        setErrorMessage('Nama lengkap minimal 2 karakter.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim())) {
        setErrorMessage('Masukkan alamat email yang valid.')
        return
      }
      if (password.length < 6) {
        setErrorMessage('Kata sandi minimal 6 karakter.')
        return
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi belum cocok.')
        return
      }
    } else {
      if (!emailOrUsername.trim()) {
        setErrorMessage('Masukkan email atau username Anda.')
        return
      }
      if (!password) {
        setErrorMessage('Masukkan kata sandi Anda.')
        return
      }
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegisterMode
        ? {
            name: fullName.trim(),
            email: registerEmail.trim(),
            password,
            password_confirmation: confirmPassword,
          }
        : {
            login: emailOrUsername.trim(),
            password,
          }

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        const firstValidationError = data?.errors
          ? Object.values(data.errors).flat()[0]
          : null
        throw new Error(
          firstValidationError ||
            data?.message ||
            (isRegisterMode
              ? 'Pendaftaran gagal. Periksa kembali data yang dimasukkan.'
              : 'Login gagal. Periksa kembali email dan kata sandi.'),
        )
      }

      const authToken = data?.token || data?.data?.token
      if (!data?.data || !authToken) {
        throw new Error('Respons autentikasi server tidak menyertakan token yang valid.')
      }

      setAuthToken(authToken)
      setStoredUser(data.data)
      setPassword('')
      setConfirmPassword('')

      if (onLoginSuccess) {
        onLoginSuccess(data.data, authToken)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal terhubung ke server autentikasi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setIsLoading(true)
    setErrorMessage(null)
    const originParam =
      typeof window !== 'undefined' ? `?origin=${encodeURIComponent(window.location.origin)}` : ''
    window.location.href = buildApiUrl(`/api/auth/google/redirect${originParam}`)
  }

  return (
    <div
      id="login-modal-overlay"
      onClick={onClose}
      className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-200 ease-out ${
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
        className={`liquid-glass-modal relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-3xl px-6 py-7 text-center text-[#F5F2EB] transition-[opacity,transform] duration-[250ms] ease-out ${
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-3 scale-95 opacity-0'
        }`}
      >
        <button
          type="button"
          id="btn-close-login-modal"
          onClick={onClose}
          aria-label={isRegisterMode ? 'Tutup dialog pendaftaran' : 'Tutup dialog login'}
          className="apple-glass-pill relative ml-auto flex h-9 w-9 items-center justify-center rounded-full text-[#F5F2EB] transition-all duration-150 hover:bg-white/[0.12] active:scale-[0.97] before:absolute before:-inset-1"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <SabahLogoIntro key={`logo-intro-${openCycle}`} reducedMotion={Boolean(prefersReducedMotion)} />

        <div key={`${openCycle}-${authMode}`}>
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { delay: hasSwitchedMode ? 0.06 : 1.55, duration: 0.52, ease: INTRO_EASE }
            }
          >
            <h2 id="login-modal-title" className="text-[20px] font-semibold tracking-tight text-[#F5F2EB]">
              {isRegisterMode ? 'Buat akun baru' : 'Masuk ke akun'}
            </h2>
            <p className="mx-auto mt-1.5 max-w-[285px] text-[12.5px] leading-relaxed text-[#F5F2EB]/65">
              {isRegisterMode
                ? 'Daftar akun Sabah Bogor untuk menyimpan rute perjalanan, favorit, dan dokumentasi wisata Anda.'
                : 'Simpan rute perjalanan custom, bagikan dokumentasi wisata, dan kelola daftar favorit Anda.'}
            </p>
          </motion.div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-300/35 bg-[#2a1216]/90 px-3 py-2.5 text-left text-[12px] text-rose-100"
            >
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { delay: hasSwitchedMode ? 0.14 : 1.72, duration: 0.56, ease: INTRO_EASE }
            }
            className="mt-5 flex flex-col gap-3 text-left"
            noValidate
          >
            {isRegisterMode ? (
              <>
                <div>
                  <label htmlFor="input-register-name" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
                    Nama Lengkap
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon
                      className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      id="input-register-name"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                      className="liquid-glass-input min-h-[44px] w-full rounded-xl py-2.5 pr-3.5 pl-10 text-[13px] text-white placeholder:text-white/40 transition-colors duration-150"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-register-email" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <MailIcon
                      className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      id="input-register-email"
                      autoComplete="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="liquid-glass-input min-h-[44px] w-full rounded-xl py-2.5 pr-3.5 pl-10 text-[13px] text-white placeholder:text-white/40 transition-colors duration-150"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-register-password" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
                    Kata Sandi
                  </label>
                  <div className="relative flex items-center">
                    <LockIcon
                      className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45"
                      aria-hidden="true"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-register-password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="liquid-glass-input min-h-[44px] w-full rounded-xl py-2.5 pr-11 pl-10 text-[13px] text-white placeholder:text-white/40 transition-colors duration-150"
                      required
                    />
                    <button
                      type="button"
                      id="btn-toggle-register-password"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-0.5 flex h-10 w-10 items-center justify-center rounded-xl text-white/55 transition-colors hover:text-white"
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-register-confirm-password"
                    className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]"
                  >
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative flex items-center">
                    <LockIcon
                      className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45"
                      aria-hidden="true"
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="input-register-confirm-password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="liquid-glass-input min-h-[44px] w-full rounded-xl py-2.5 pr-11 pl-10 text-[13px] text-white placeholder:text-white/40 transition-colors duration-150"
                      required
                    />
                    <button
                      type="button"
                      id="btn-toggle-register-confirm-password"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? 'Sembunyikan konfirmasi kata sandi'
                          : 'Tampilkan konfirmasi kata sandi'
                      }
                      className="absolute right-0.5 flex h-10 w-10 items-center justify-center rounded-xl text-white/55 transition-colors hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="input-login-email" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
                    Email atau username
                  </label>
                  <div className="relative flex items-center">
                    <MailIcon
                      className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      id="input-login-email"
                      autoComplete="username"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="nama@email.com"
                      className="liquid-glass-input min-h-[44px] w-full rounded-xl py-2.5 pr-3.5 pl-10 text-[13px] text-white placeholder:text-white/40 transition-colors duration-150"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-login-password" className="mb-1.5 block text-[12px] font-medium text-[#EBF0EB]">
                    Kata sandi
                  </label>
                  <div className="relative flex items-center">
                    <LockIcon
                      className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/45"
                      aria-hidden="true"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-login-password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="liquid-glass-input min-h-[44px] w-full rounded-xl py-2.5 pr-11 pl-10 text-[13px] text-white placeholder:text-white/40 transition-colors duration-150"
                      required
                    />
                    <button
                      type="button"
                      id="btn-toggle-login-password"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-0.5 flex h-10 w-10 items-center justify-center rounded-xl text-white/55 transition-colors hover:text-white"
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              id={isRegisterMode ? 'btn-register-submit' : 'btn-login-submit'}
              disabled={isLoading}
              className="apple-retro-cta mt-1.5 flex min-h-[44px] w-full items-center justify-center rounded-xl py-2.5 text-[13px] font-semibold active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? 'Memproses...' : isRegisterMode ? 'Daftar Akun' : 'Masuk'}
            </button>
          </motion.form>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { delay: hasSwitchedMode ? 0.2 : 1.9, duration: 0.54, ease: INTRO_EASE }
            }
          >
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgba(244,239,230,0.16)]" />
              <span className="text-[11px] font-medium text-[#F5F2EB]/55">atau</span>
              <div className="h-px flex-1 bg-[rgba(244,239,230,0.16)]" />
            </div>

            <button
              type="button"
              id="btn-login-google"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="apple-glass-card apple-glass-card-hover flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-[#F5F2EB] active:scale-[0.98] disabled:opacity-60"
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
              <span>{isRegisterMode ? 'Daftar dengan Google' : 'Masuk dengan Google'}</span>
            </button>

            <button
              type="button"
              id={isRegisterMode ? 'btn-switch-to-login' : 'btn-switch-to-register'}
              onClick={() => handleSwitchMode(isRegisterMode ? 'login' : 'register')}
              className="mt-3.5 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-3 text-[12.5px] text-[#F5F2EB]/70 transition-colors duration-150 hover:text-[#F5F2EB] active:scale-[0.98]"
            >
              <span>{isRegisterMode ? 'Sudah punya akun?' : 'Belum punya akun?'}</span>
              <span className="font-semibold text-[#DFAA63]">
                {isRegisterMode ? 'Masuk' : 'Daftar sekarang'}
              </span>
            </button>
          </motion.div>
        </div>

        <motion.button
          key={`dismiss-${openCycle}`}
          type="button"
          onClick={onClose}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { delay: 2.02, duration: 0.45, ease: INTRO_EASE }
          }
          className="mt-1 inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 text-[12px] font-medium text-white/55 transition-colors duration-150 hover:text-white/90"
        >
          Nanti saja
        </motion.button>
      </div>
    </div>
  )
}

export default memo(LoginModal)
