import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Konfigurasi terpusat aset maskot Rusa Tutul Sabah Bogor & karakter gerak
 * untuk seluruh status feedback halaman Admin.
 */
export const ADMIN_FEEDBACK_CONFIG = {
  'save-success': {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-happy.svg',
    mascotAlt: 'Maskot Rusa Tutul bahagia setelah perubahan tersimpan',
    motionPreset: 'bounce',
    tone: 'success',
    title: 'Perubahan berhasil disimpan!',
    defaultDetail: 'Data destinasi wisata telah diperbarui di database.',
    duration: 3000,
  },
  'filter-unsaved': {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-confused.svg',
    mascotAlt: 'Maskot Rusa Tutul mengingatkan filter belum disimpan',
    motionPreset: 'shake',
    tone: 'warning',
    title: 'Filter tidak disimpan',
    defaultDetail: 'Perubahan pencarian atau kategori belum disimpan.',
    duration: 6000,
  },
  'delete-success': {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-default.svg',
    mascotAlt: 'Maskot Rusa Tutul setelah data wisata berhasil dihapus',
    motionPreset: 'fade',
    tone: 'neutral',
    title: 'Data wisata berhasil dihapus.',
    defaultDetail: 'Destinasi telah dihapus dari daftar wisata Kota Bogor.',
    duration: 3000,
  },
  'confirm-logout': {
    mode: 'modal',
    mascotAsset: '/assets/mascot/mascot-goodbye.svg',
    mascotAlt: 'Maskot Rusa Tutul melambaikan tangan perpisahan',
    motionPreset: 'wave',
    tone: 'logout',
    title: 'Kamu yakin ingin keluar dari halaman Admin?',
    defaultDetail:
      'Sesi administrator Anda akan diakhiri dan Anda perlu masuk kembali untuk mengelola data wisata.',
    confirmLabel: 'Ya, Keluar',
    busyLabel: 'Keluar...',
    cancelLabel: 'Batal',
  },
  'confirm-delete-wisata': {
    mode: 'modal',
    mascotAsset: '/assets/mascot/mascot-confused.svg',
    mascotAlt: 'Maskot Rusa Tutul memperingatkan penghapusan data wisata',
    motionPreset: 'caution',
    tone: 'danger',
    title: 'Hapus data wisata ini?',
    defaultDetail:
      'Yakin ingin menghapus data wisata ini? Tindakan ini tidak bisa dibatalkan.',
    confirmLabel: 'Hapus Data',
    busyLabel: 'Menghapus...',
    cancelLabel: 'Batal',
  },
  error: {
    mode: 'toast',
    mascotAsset: '/assets/mascot/mascot-confused.svg',
    mascotAlt: 'Maskot Rusa Tutul menampilkan peringatan kesalahan',
    motionPreset: 'shake',
    tone: 'danger',
    title: 'Terjadi kesalahan',
    defaultDetail: 'Permintaan tidak dapat diproses. Silakan coba lagi.',
    duration: 4500,
  },
}

/**
 * Hook tunggal non-stacking untuk mengendalikan Toast & Modal Konfirmasi Admin.
 * Setiap panggilan baru langsung menggantikan notifikasi sebelumnya agar tidak menumpuk.
 */
export function useAdminMascotFeedback() {
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
        title: options.title ?? config.title,
        detail: options.detail ?? config.defaultDetail,
        itemName: options.itemName ?? null,
        confirmLabel: options.confirmLabel ?? config.confirmLabel ?? 'Lanjutkan',
        busyLabel: options.busyLabel ?? config.busyLabel ?? 'Memproses...',
        cancelLabel: options.cancelLabel ?? config.cancelLabel ?? 'Batal',
        saveLabel: options.saveLabel ?? 'Simpan Ulang',
        duration: options.duration ?? config.duration ?? 0,
        onConfirm: options.onConfirm ?? null,
        onSaveFilter: options.onSaveFilter ?? null,
      })
    },
    [clearAutoTimer],
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
