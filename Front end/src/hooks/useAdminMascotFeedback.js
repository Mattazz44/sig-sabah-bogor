import { useCallback, useEffect, useRef, useState } from 'react'
import { usePreferences } from '../utils/preferences'

/**
 * Konfigurasi terpusat aset maskot Rusa Tutul Sabah Bogor & karakter gerak
 * untuk seluruh status feedback halaman Admin.
 */
export const ADMIN_FEEDBACK_CONFIG = {
  'save-success': {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-happy.svg',
    mascotAltKey: 'mascot.happy',
    motionPreset: 'bounce',
    tone: 'success',
    titleKey: 'admin.feedback.saveSuccessTitle',
    detailKey: 'admin.feedback.saveSuccessDesc',
    duration: 3000,
  },
  'filter-unsaved': {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-confused.svg',
    mascotAltKey: 'mascot.confused',
    motionPreset: 'shake',
    tone: 'warning',
    titleKey: 'admin.feedback.filterUnsavedTitle',
    detailKey: 'admin.feedback.filterUnsavedDesc',
    duration: 6000,
  },
  'delete-success': {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-default.svg',
    mascotAltKey: 'mascot.default',
    motionPreset: 'fade',
    tone: 'neutral',
    titleKey: 'admin.feedback.deleteSuccessTitle',
    detailKey: 'admin.feedback.deleteSuccessDesc',
    duration: 3000,
  },
  'confirm-logout': {
    mode: 'modal',
    mascotAsset: '/assets/mascot/mascot-goodbye.svg',
    mascotAltKey: 'mascot.goodbye',
    motionPreset: 'wave',
    tone: 'logout',
    titleKey: 'admin.feedback.logoutTitle',
    detailKey: 'admin.feedback.logoutDesc',
    confirmKey: 'admin.feedback.logoutConfirm',
    busyKey: 'admin.feedback.logoutBusy',
    cancelKey: 'common.cancel',
  },
  'confirm-delete-wisata': {
    mode: 'modal',
    mascotAsset: '/assets/mascot/mascot-confused.svg',
    mascotAltKey: 'mascot.confused',
    motionPreset: 'caution',
    tone: 'danger',
    titleKey: 'admin.feedback.deleteTitle',
    detailKey: 'admin.feedback.deleteDesc',
    confirmKey: 'admin.feedback.deleteConfirm',
    busyKey: 'common.deleting',
    cancelKey: 'common.cancel',
  },
  error: {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-confused.svg',
    mascotAltKey: 'mascot.confused',
    motionPreset: 'shake',
    tone: 'danger',
    titleKey: 'admin.feedback.errorTitle',
    detailKey: 'admin.feedback.errorDesc',
    duration: 4500,
  },
}

/**
 * Hook tunggal non-stacking untuk mengendalikan Toast & Modal Konfirmasi Admin.
 * Setiap panggilan baru langsung menggantikan notifikasi sebelumnya agar tidak menumpuk.
 */
export function useAdminMascotFeedback() {
  const { t } = usePreferences()
  const [feedback, setFeedback] = useState(null)
  const [isBusy, setIsBusy] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  const clearAutoTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const dismissFeedback = useCallback(() => {
    clearAutoTimer()
    setIsBusy(false)
    setIsPaused(false)
    setFeedback(null)
  }, [clearAutoTimer])

  const triggerFeedback = useCallback(
    (type, options = {}) => {
      const config = ADMIN_FEEDBACK_CONFIG[type]
      if (!config) return
      clearAutoTimer()
      setIsBusy(false)
      setIsPaused(false)
      setFeedback({
        id: `${type}-${Date.now()}`,
        type,
        mode: config.mode,
        title: options.title ?? t(config.titleKey),
        detail: options.detail ?? t(config.detailKey),
        itemName: options.itemName ?? null,
        confirmLabel: options.confirmLabel ?? (config.confirmKey ? t(config.confirmKey) : t('common.continue')),
        busyLabel: options.busyLabel ?? (config.busyKey ? t(config.busyKey) : t('common.processing')),
        cancelLabel: options.cancelLabel ?? (config.cancelKey ? t(config.cancelKey) : t('common.cancel')),
        saveLabel: options.saveLabel ?? t('admin.feedback.saveAgain'),
        duration: options.duration ?? config.duration ?? 0,
        onConfirm: options.onConfirm ?? null,
        onSaveFilter: options.onSaveFilter ?? null,
      })
    },
    [clearAutoTimer, t],
  )

  useEffect(() => {
    clearAutoTimer()
    if (!feedback || feedback.mode !== 'toast' || !feedback.duration || isPaused) {
      return undefined
    }
    timerRef.current = window.setTimeout(() => {
      setFeedback(null)
    }, feedback.duration)

    return clearAutoTimer
  }, [feedback, isPaused, clearAutoTimer])

  const handleConfirm = useCallback(async () => {
    if (!feedback?.onConfirm || isBusy) return
    try {
      setIsBusy(true)
      const activeId = feedback.id
      await feedback.onConfirm()
      setFeedback((current) => (current?.id === activeId ? null : current))
    } finally {
      setIsBusy(false)
    }
  }, [feedback, isBusy])

  const handleSaveFilter = useCallback(async () => {
    if (!feedback?.onSaveFilter || isBusy) return
    const activeId = feedback.id
    await feedback.onSaveFilter()
    setFeedback((current) => (current?.id === activeId ? null : current))
  }, [feedback, isBusy])

  const showSaveSuccess = useCallback(
    (detail) => triggerFeedback('save-success', { detail }),
    [triggerFeedback],
  )

  const showFilterUnsaved = useCallback(
    (options = {}) => triggerFeedback('filter-unsaved', options),
    [triggerFeedback],
  )

  const showDeleteSuccess = useCallback(
    (detail) => triggerFeedback('delete-success', { detail }),
    [triggerFeedback],
  )

  const showError = useCallback(
    (title, detail) => triggerFeedback('error', { title, detail }),
    [triggerFeedback],
  )

  const confirmLogout = useCallback(
    (options = {}) => triggerFeedback('confirm-logout', options),
    [triggerFeedback],
  )

  const confirmDeleteWisata = useCallback(
    (options = {}) => triggerFeedback('confirm-delete-wisata', options),
    [triggerFeedback],
  )

  return {
    feedback,
    isBusy,
    setIsPaused,
    triggerFeedback,
    dismissFeedback,
    handleConfirm,
    handleSaveFilter,
    showSaveSuccess,
    showFilterUnsaved,
    showDeleteSuccess,
    showError,
    confirmLogout,
    confirmDeleteWisata,
  }
}
