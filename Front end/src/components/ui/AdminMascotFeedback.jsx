import { memo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ADMIN_FEEDBACK_CONFIG } from '../../hooks/useAdminMascotFeedback'
import { AlertTriangleIcon, XIcon } from './VectorIcons'

const TOAST_TONE_STYLES = {
  success: {
    card: 'border-emerald-300/30 bg-gradient-to-br from-[#1A2B1F]/96 to-[#131C15]/96',
    mascotFrame: 'border-emerald-300/25 bg-[#1E3324]',
    accentText: 'text-emerald-200',
    progress: 'bg-emerald-300/70',
  },
  warning: {
    card: 'border-[#DFAA63]/38 bg-gradient-to-br from-[#2A2316]/96 to-[#161914]/96',
    mascotFrame: 'border-[#DFAA63]/30 bg-[#312819]',
    accentText: 'text-[#DFAA63]',
    progress: 'bg-[#DFAA63]/75',
  },
  neutral: {
    card: 'border-[#76937A]/35 bg-gradient-to-br from-[#1B251E]/96 to-[#131915]/96',
    mascotFrame: 'border-[#76937A]/28 bg-[#212E24]',
    accentText: 'text-[#A9C2AD]',
    progress: 'bg-[#76937A]/75',
  },
  danger: {
    card: 'border-rose-300/30 bg-gradient-to-br from-[#2B171B]/96 to-[#161415]/96',
    mascotFrame: 'border-rose-300/25 bg-[#361D23]',
    accentText: 'text-rose-200',
    progress: 'bg-rose-300/70',
  },
}

function getMascotMotion(preset, reduceMotion) {
  if (reduceMotion) {
    return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
  }

  switch (preset) {
    case 'bounce':
      return {
        initial: { scale: 0.86, y: 8, opacity: 0 },
        animate: { scale: [0.86, 1.07, 0.98, 1], y: [8, -5, 1, 0], opacity: 1 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      }
    case 'shake':
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1, x: [0, -4, 4, -2.5, 2, 0], rotate: [0, -3, 3, -1.5, 0] },
        transition: { duration: 0.55, ease: 'easeInOut' },
      }
    case 'caution':
      return {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1, x: [0, -5, 5, -3, 2, 0] },
        transition: { duration: 0.52, ease: 'easeInOut' },
      }
    case 'wave':
      return {
        initial: { opacity: 0, scale: 0.9, rotate: -6 },
        animate: { opacity: 1, scale: 1, rotate: [0, -4, 4, -2, 0] },
        transition: { duration: 0.65, ease: 'easeInOut' },
      }
    case 'fade':
    default:
      return {
        initial: { opacity: 0, y: 6, scale: 0.94 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
      }
  }
}

/**
 * Komponen terpadu sistem Toast Otomatis & Modal Konfirmasi berbasis animasi maskot
 * untuk seluruh aksi utama halaman Admin (Simpan, Filter, Hapus Wisata, Logout).
 */
function AdminMascotFeedback({
  feedback,
  isBusy = false,
  onDismiss,
  onConfirm,
  onSaveFilter,
  onPauseChange,
}) {
  const reduceMotion = useReducedMotion()
  const cancelBtnRef = useRef(null)

  useEffect(() => {
    if (!feedback) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) {
        onDismiss?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [feedback, isBusy, onDismiss])

  useEffect(() => {
    if (feedback?.mode === 'modal') {
      const raf = window.requestAnimationFrame(() => {
        cancelBtnRef.current?.focus()
      })
      return () => window.cancelAnimationFrame(raf)
    }
    return undefined
  }, [feedback])

  if (typeof document === 'undefined') return null

  const config = feedback ? ADMIN_FEEDBACK_CONFIG[feedback.type] : null
  const isToast = feedback?.mode === 'toast' && config
  const isModal = feedback?.mode === 'modal' && config
  const toneStyle = TOAST_TONE_STYLES[config?.tone || 'neutral'] || TOAST_TONE_STYLES.neutral
  const mascotAnim = getMascotMotion(config?.motionPreset, reduceMotion)

  return createPortal(
    <>
      {/* 1. MODE TOAST (Non-stacking single slot, aman di atas navbar) */}
      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[900] mx-auto max-w-[420px] sm:left-auto sm:right-5 sm:mx-0 sm:w-[400px]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <AnimatePresence mode="wait">
          {isToast && (
            <motion.div
              key={feedback.id}
              id="admin-mascot-toast"
              data-feedback-type={feedback.type}
              role={config.tone === 'danger' || config.tone === 'warning' ? 'alert' : 'status'}
              aria-live="polite"
              onMouseEnter={() => onPauseChange?.(true)}
              onMouseLeave={() => onPauseChange?.(false)}
              onFocus={() => onPauseChange?.(true)}
              onBlur={() => onPauseChange?.(false)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-3.5 text-[#F5F2EB] shadow-[0_18px_38px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl ${toneStyle.card}`}
            >
              <div className="flex items-start gap-3">
                {/* Frame Maskot */}
                <motion.div
                  {...mascotAnim}
                  className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${toneStyle.mascotFrame}`}
                >
                  <img
                    src={config.mascotAsset}
                    alt={config.mascotAlt}
                    width={56}
                    height={56}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-contain p-0.5"
                  />
                </motion.div>

                {/* Teks & Aksi Opsional */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-[13.5px] font-bold leading-snug tracking-tight ${toneStyle.accentText}`}>
                    {feedback.title}
                  </p>
                  {feedback.detail && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#F5F2EB]/78">
                      {feedback.detail}
                    </p>
                  )}

                  {feedback.type === 'filter-unsaved' && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {feedback.onSaveFilter && (
                        <button
                          type="button"
                          onClick={onSaveFilter}
                          className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-[#DFAA63]/45 bg-[#DFAA63]/18 px-3 text-[12px] font-semibold text-[#F5E6C8] transition-colors hover:bg-[#DFAA63]/28 active:scale-[0.98]"
                        >
                          {feedback.saveLabel || 'Simpan Ulang'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onDismiss}
                        className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 text-[12px] font-medium text-[#F5F2EB]/80 transition-colors hover:bg-white/[0.12] hover:text-[#F5F2EB] active:scale-[0.98]"
                      >
                        Tutup
                      </button>
                    </div>
                  )}
                </div>

                {/* Tombol Tutup */}
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label="Tutup notifikasi"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#F5F2EB]/65 transition-colors hover:bg-white/[0.1] hover:text-[#F5F2EB]"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Indikator Durasi Auto-Dismiss */}
              {feedback.duration > 0 && !reduceMotion && (
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[2.5px] bg-white/[0.06]"
                >
                  <motion.div
                    key={`progress-${feedback.id}`}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: feedback.duration / 1000, ease: 'linear' }}
                    style={{ transformOrigin: 'left center' }}
                    className={`h-full w-full ${toneStyle.progress}`}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. MODE MODAL KONFIRMASI (Logout & Hapus Data Wisata) */}
      <AnimatePresence>
        {isModal && (
          <motion.div
            key={`backdrop-${feedback.id}`}
            id="admin-mascot-modal-backdrop"
            data-feedback-type={feedback.type}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
            onClick={() => !isBusy && onDismiss?.()}
            className="fixed inset-0 z-[950] flex items-center justify-center bg-black/62 px-4 py-6 backdrop-blur-md"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-mascot-modal-title"
              aria-describedby="admin-mascot-modal-desc"
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-[400px] overflow-y-auto rounded-3xl border p-6 text-center text-[#F5F2EB] shadow-[0_26px_54px_-16px_rgba(0,0,0,0.68)] backdrop-blur-2xl ${
                config.tone === 'danger'
                  ? 'border-rose-300/28 bg-gradient-to-b from-[#23181A]/96 to-[#141714]/98'
                  : 'border-white/16 bg-gradient-to-b from-[#1B241C]/96 to-[#121813]/98'
              }`}
            >
              {/* Maskot Ekspresi Modal */}
              <div className="relative mx-auto mb-4 flex justify-center">
                <motion.div
                  {...mascotAnim}
                  className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border ${
                    config.tone === 'danger'
                      ? 'border-rose-300/28 bg-[#2E1B1F]'
                      : 'border-[#76937A]/28 bg-[#1E2B20]'
                  }`}
                >
                  <img
                    src={config.mascotAsset}
                    alt={config.mascotAlt}
                    width={96}
                    height={96}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-contain p-1"
                  />
                </motion.div>

                {config.tone === 'danger' && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 right-[calc(50%-3.2rem)] flex h-7 w-7 items-center justify-center rounded-full border border-rose-300/40 bg-[#4A1C24] text-rose-200 shadow-sm"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <h2
                id="admin-mascot-modal-title"
                className="text-[17.5px] font-bold leading-snug tracking-tight text-[#F5F2EB]"
              >
                {feedback.title}
              </h2>

              {feedback.itemName && (
                <div className="mt-2.5 inline-flex max-w-full items-center rounded-xl border border-white/12 bg-white/[0.05] px-3 py-1 text-[12.5px] font-semibold text-[#F2ECE1]">
                  <span className="truncate">{feedback.itemName}</span>
                </div>
              )}

              <p
                id="admin-mascot-modal-desc"
                className="mt-2.5 text-[13px] leading-relaxed text-[#F5F2EB]/72"
              >
                {feedback.detail}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  ref={cancelBtnRef}
                  type="button"
                  disabled={isBusy}
                  onClick={onDismiss}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/16 bg-white/[0.06] px-4 text-[13px] font-semibold text-[#F5F2EB] transition-colors hover:bg-white/[0.12] active:scale-[0.98] disabled:opacity-50"
                >
                  {feedback.cancelLabel}
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onConfirm}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-[13px] font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 ${
                    config.tone === 'danger'
                      ? 'border-rose-300/35 bg-[#9E2B37] text-white hover:bg-[#B53442]'
                      : 'border-[#DFAA63]/35 bg-[#3D2428] text-rose-100 hover:bg-[#502C32]'
                  }`}
                >
                  {isBusy ? feedback.busyLabel : feedback.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  )
}

export default memo(AdminMascotFeedback)
