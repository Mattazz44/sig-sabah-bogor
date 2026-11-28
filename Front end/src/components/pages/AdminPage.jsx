import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLocationPickerMap from '../map/AdminLocationPickerMap'
import SafeImage from '../ui/SafeImage'
import SabahMascot from '../ui/SabahMascot'
import AdminMascotFeedback from '../ui/AdminMascotFeedback'
import { useAdminLocations } from '../../hooks/useAdminLocations'
import { useAdminMascotFeedback } from '../../hooks/useAdminMascotFeedback'
import { clearAuthStorage } from '../../utils/api'
import { compressImage } from '../../utils/imageCompressor'
import { getImageUrl } from '../../utils/imageHelper'
import { usePreferences } from '../../utils/preferences'
import {
  AlertTriangleIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  MapPinIcon,
  RefreshIcon,
  StarIcon,
  XIcon,
} from '../ui/VectorIcons'

const ADMIN_SAVED_FILTER_KEY = 'sabah_admin_saved_filter_v1'

function loadSavedAdminFilter() {
  if (typeof window === 'undefined') {
    return { query: '', category: 'Semua' }
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_SAVED_FILTER_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object') {
      return {
        query: typeof parsed.query === 'string' ? parsed.query : '',
        category: typeof parsed.category === 'string' && parsed.category ? parsed.category : 'Semua',
      }
    }
  } catch {
    // Abaikan kegagalan membaca storage lokal
  }
  return { query: '', category: 'Semua' }
}

const BASE_CATEGORIES = ['Alam & Curug', 'Kuliner', 'Edukasi & Budaya']

const WEEKDAYS = [
  { id: 'Senin', short: 'Sen' },
  { id: 'Selasa', short: 'Sel' },
  { id: 'Rabu', short: 'Rab' },
  { id: 'Kamis', short: 'Kam' },
  { id: 'Jumat', short: 'Jum' },
  { id: 'Sabtu', short: 'Sab' },
  { id: 'Minggu', short: 'Min' },
]

const ALL_DAY_IDS = WEEKDAYS.map((d) => d.id)

const INITIAL_FORM = {
  name: '',
  category: 'Alam & Curug',
  ticketPrice: '',
  rating: '4.5',
  isPopular: false,
  address: '',
  description: '',
  detailedDescription: '',
  openTime: '08:00',
  closeTime: '17:00',
  is24Hours: false,
  selectedDays: ALL_DAY_IDS,
  lat: -6.5971,
  lng: 106.806,
}

const glassCardClass =
  'rounded-2xl border border-white/15 bg-[#141C14]/55 p-5 sm:p-6 backdrop-blur-xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18)]'

const glassInputClass =
  'min-h-[44px] w-full rounded-xl border border-white/[0.15] bg-white/[0.06] px-3.5 py-2.5 text-[13.5px] text-[#EBF0EB] placeholder:text-[#98A698] transition-colors duration-150 focus:border-[#EBF0EB]/50 focus:bg-white/[0.09] focus:outline-none'

const labelBaseClass = 'mb-1.5 block text-[12px] font-medium text-[#C8D3C8]'

function formatSelectedDays(selectedDays) {
  const ordered = ALL_DAY_IDS.filter((day) => selectedDays.includes(day))
  if (ordered.length === 0 || ordered.length === 7) return 'Setiap hari'

  const indices = ordered.map((d) => ALL_DAY_IDS.indexOf(d))
  const isContiguous = indices.every((val, i) => i === 0 || val === indices[i - 1] + 1)
  if (isContiguous && indices.length >= 2) {
    return `${ordered[0]} - ${ordered[ordered.length - 1]}`
  }

  return ordered.join(', ')
}

function buildOperationalHoursString(form) {
  const dayLabel = formatSelectedDays(form.selectedDays)
  if (form.is24Hours) {
    return dayLabel === 'Setiap hari' ? '24 Jam' : `${dayLabel} · 24 Jam`
  }
  const open = (form.openTime || '08:00').trim()
  const close = (form.closeTime || '17:00').trim()
  const timeRange = `${open} - ${close}`
  return dayLabel === 'Setiap hari' ? timeRange : `${dayLabel} · ${timeRange}`
}

function parseOperationalHours(rawText) {
  const text = (rawText || '').trim()
  if (!text || text === '- - -') {
    return {
      openTime: '08:00',
      closeTime: '17:00',
      is24Hours: false,
      selectedDays: ALL_DAY_IDS,
    }
  }

  const lower = text.toLowerCase()
  const is24Hours = lower.includes('24 jam')

  // Ekstrak waktu buka & tutup (contoh 08:00 - 17:00 atau 07.00-22.00)
  const timeMatches = text.match(/\b(\d{1,2})[:.](\d{2})\b/g) || []
  const normalizeTime = (raw) => {
    const [h, m] = raw.replace('.', ':').split(':')
    return `${h.padStart(2, '0')}:${m}`
  }

  const openTime = timeMatches[0] ? normalizeTime(timeMatches[0]) : '08:00'
  const closeTime = timeMatches[1] ? normalizeTime(timeMatches[1]) : '17:00'

  // Ekstrak hari operasional jika ada penanda hari di string
  let selectedDays = ALL_DAY_IDS
  if (lower.includes('senin - jumat') || lower.includes('senin-jumat')) {
    selectedDays = ALL_DAY_IDS.slice(0, 5)
  } else if (lower.includes('sabtu - minggu') || lower.includes('sabtu-minggu')) {
    selectedDays = ALL_DAY_IDS.slice(5)
  } else {
    const rangeMatch = text.match(
      /(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\s*-\s*(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)/i,
    )
    if (rangeMatch) {
      const startIdx = ALL_DAY_IDS.findIndex((d) => d.toLowerCase() === rangeMatch[1].toLowerCase())
      const endIdx = ALL_DAY_IDS.findIndex((d) => d.toLowerCase() === rangeMatch[2].toLowerCase())
      if (startIdx >= 0 && endIdx >= startIdx) {
        selectedDays = ALL_DAY_IDS.slice(startIdx, endIdx + 1)
      }
    } else {
      const matchedDays = ALL_DAY_IDS.filter((day) => lower.includes(day.toLowerCase()))
      if (matchedDays.length > 0) {
        selectedDays = matchedDays
      }
    }
  }

  return { openTime, closeTime, is24Hours, selectedDays }
}

function formatTicketDisplay(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return 'Gratis'
  }
  const str = String(value).trim()
  if (/^\d+$/.test(str)) {
    const num = Number(str)
    return num === 0 ? 'Gratis' : `Rp ${num.toLocaleString('id-ID')}`
  }
  return str
}

function AdminPage({ onLocationsMutated, onLogout }) {
  const { t, tCategory, tTicket, tHours } = usePreferences()
  const [activeTab, setActiveTab] = useState('tambah')
  const [editingSpot, setEditingSpot] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [photoItems, setPhotoItems] = useState([])
  const [formError, setFormError] = useState('')
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
  const [savedFilter, setSavedFilter] = useState(() => loadSavedAdminFilter())
  const [searchQuery, setSearchQuery] = useState(() => loadSavedAdminFilter().query)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(
    () => loadSavedAdminFilter().category,
  )

  const fileInputRef = useRef(null)
  const pageScrollRef = useRef(null)
  const createdBlobUrlsRef = useRef(new Set())

  const {
    locations,
    isLoading,
    isSubmitting,
    deletingId,
    error: fetchError,
    refreshLocations,
    createLocation,
    updateLocation,
    removeLocation,
  } = useAdminLocations({ onMutated: onLocationsMutated })

  const {
    feedback,
    isBusy: isFeedbackBusy,
    setIsPaused: setFeedbackPaused,
    dismissFeedback,
    handleConfirm: handleFeedbackConfirm,
    handleSaveFilter: handleFeedbackSaveFilter,
    showSaveSuccess,
    showFilterUnsaved,
    showDeleteSuccess,
    showError,
    confirmLogout,
    confirmDeleteWisata,
  } = useAdminMascotFeedback()

  const isFilterUnsaved =
    searchQuery.trim() !== savedFilter.query || selectedCategoryFilter !== savedFilter.category

  const handleSaveFilter = useCallback(() => {
    const nextFilter = {
      query: searchQuery.trim(),
      category: selectedCategoryFilter,
    }
    try {
      window.localStorage.setItem(ADMIN_SAVED_FILTER_KEY, JSON.stringify(nextFilter))
    } catch {
      // Abaikan kegagalan storage pada mode privat
    }
    setSavedFilter(nextFilter)
    showSaveSuccess(t('admin.filterSavedMsg'))
  }, [searchQuery, selectedCategoryFilter, showSaveSuccess, t])

  const handleSwitchTab = useCallback(
    (nextTab) => {
      if (activeTab === 'daftar' && nextTab !== 'daftar' && isFilterUnsaved) {
        showFilterUnsaved({
          detail: t('admin.filterUnsavedTab'),
          onSaveFilter: handleSaveFilter,
        })
      }
      setActiveTab(nextTab)
    },
    [activeTab, isFilterUnsaved, showFilterUnsaved, handleSaveFilter, t],
  )

  const handleRefreshList = useCallback(() => {
    if (isFilterUnsaved) {
      showFilterUnsaved({
        detail: t('admin.filterUnsavedRefresh'),
        onSaveFilter: handleSaveFilter,
      })
    }
    refreshLocations()
  }, [isFilterUnsaved, showFilterUnsaved, handleSaveFilter, refreshLocations, t])

  const revokeUnusedBlobs = useCallback((items) => {
    const activePreviews = new Set(items.map((item) => item.previewUrl))
    for (const blobUrl of Array.from(createdBlobUrlsRef.current)) {
      if (!activePreviews.has(blobUrl)) {
        URL.revokeObjectURL(blobUrl)
        createdBlobUrlsRef.current.delete(blobUrl)
      }
    }
  }, [])

  useEffect(() => {
    const blobSet = createdBlobUrlsRef.current
    return () => {
      for (const blobUrl of blobSet) {
        URL.revokeObjectURL(blobUrl)
      }
      blobSet.clear()
    }
  }, [])

  const categoryOptions = useMemo(() => {
    const set = new Set(BASE_CATEGORIES)
    for (const loc of locations) {
      if (loc.category) set.add(loc.category)
    }
    return Array.from(set)
  }, [locations])

  const categoryCounts = useMemo(() => {
    const counts = { Semua: locations.length }
    for (const cat of categoryOptions) {
      counts[cat] = locations.filter((loc) => loc.category === cat).length
    }
    return counts
  }, [locations, categoryOptions])

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return locations.filter((loc) => {
      const matchCategory =
        selectedCategoryFilter === 'Semua' || loc.category === selectedCategoryFilter
      if (!matchCategory) return false
      if (!q) return true
      return (
        loc.name?.toLowerCase().includes(q) ||
        loc.category?.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q)
      )
    })
  }, [locations, searchQuery, selectedCategoryFilter])

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formError) setFormError('')
  }

  const handleToggleDay = (dayId) => {
    setForm((prev) => {
      const exists = prev.selectedDays.includes(dayId)
      if (exists && prev.selectedDays.length === 1) {
        return prev
      }
      const nextDays = exists
        ? prev.selectedDays.filter((d) => d !== dayId)
        : ALL_DAY_IDS.filter((d) => prev.selectedDays.includes(d) || d === dayId)
      return { ...prev, selectedDays: nextDays }
    })
  }

  const handlePickCoordinate = useCallback(({ lat, lng }) => {
    setForm((prev) => ({ ...prev, lat, lng }))
    setFormError('')
  }, [])

  const processPhotoFiles = useCallback(async (fileList) => {
    const validFiles = Array.from(fileList || []).filter(
      (file) => file && file.type && file.type.startsWith('image/'),
    )
    if (validFiles.length === 0) return

    const processedItems = await Promise.all(
      validFiles.map(async (file, idx) => {
        const compressed = await compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.82,
        })
        const previewUrl = URL.createObjectURL(compressed)
        createdBlobUrlsRef.current.add(previewUrl)
        return {
          id: `new_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
          kind: 'new',
          file: compressed,
          previewUrl,
          name: compressed.name || file.name,
        }
      }),
    )

    setPhotoItems((prev) => [...prev, ...processedItems])
  }, [])

  const handlePhotoInputChange = (e) => {
    processPhotoFiles(e.target.files)
    e.target.value = ''
  }

  const handleDropPhoto = (e) => {
    e.preventDefault()
    setIsDraggingPhoto(false)
    processPhotoFiles(e.dataTransfer.files)
  }

  const handleRemovePhoto = (targetId) => {
    setPhotoItems((prev) => {
      const next = prev.filter((item) => item.id !== targetId)
      revokeUnusedBlobs(next)
      return next
    })
  }

  const handleSetPrimaryPhoto = (targetId) => {
    setPhotoItems((prev) => {
      const target = prev.find((item) => item.id === targetId)
      if (!target) return prev
      return [target, ...prev.filter((item) => item.id !== targetId)]
    })
  }

  const resetFormState = useCallback(() => {
    setEditingSpot(null)
    setForm(INITIAL_FORM)
    setFormError('')
    setPhotoItems([])
    revokeUnusedBlobs([])
  }, [revokeUnusedBlobs])

  const handleStartEdit = (spot) => {
    const parsedHours = parseOperationalHours(spot.operationalHours)
    const rawPaths =
      Array.isArray(spot.rawGallery) && spot.rawGallery.length > 0
        ? spot.rawGallery
        : spot.rawImage
          ? [spot.rawImage]
          : []

    const nextPhotos = rawPaths.map((rawPath, idx) => ({
      id: `existing_${spot.id}_${idx}`,
      kind: 'existing',
      rawPath,
      previewUrl: getImageUrl(rawPath),
      name: rawPath.split('/').pop() || `Foto ${idx + 1}`,
    }))

    revokeUnusedBlobs(nextPhotos)
    setPhotoItems(nextPhotos)
    setEditingSpot(spot)
    setForm({
      name: spot.name || '',
      category: spot.category || 'Alam & Curug',
      ticketPrice:
        spot.ticketPrice && spot.ticketPrice !== 'Gratis' ? String(spot.ticketPrice) : '',
      rating: spot.rating !== undefined && spot.rating !== null ? String(spot.rating) : '4.5',
      isPopular: Boolean(spot.isPopular),
      address: spot.address || '',
      description: spot.description || '',
      detailedDescription: spot.detailedDescription || '',
      openTime: parsedHours.openTime,
      closeTime: parsedHours.closeTime,
      is24Hours: parsedHours.is24Hours,
      selectedDays: parsedHours.selectedDays,
      lat: Number(spot.coordinates?.lat ?? -6.5971),
      lng: Number(spot.coordinates?.lng ?? 106.806),
    })
    setFormError('')
    setActiveTab('tambah')
    pageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setFormError(t('admin.errNameRequired'))
      return
    }
    if (!form.address.trim()) {
      setFormError(t('admin.errAddressRequired'))
      return
    }
    const latNum = Number(form.lat)
    const lngNum = Number(form.lng)
    if (
      form.lat === '' ||
      form.lng === '' ||
      !Number.isFinite(latNum) ||
      !Number.isFinite(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      setFormError(t('admin.errInvalidCoords'))
      return
    }

    const operationalHours = buildOperationalHoursString(form)
    const payload = {
      name: form.name,
      category: form.category,
      ticketPrice: form.ticketPrice,
      rating: form.rating,
      isPopular: form.isPopular,
      address: form.address,
      description: form.description,
      detailedDescription: editingSpot ? form.detailedDescription || form.description : form.description,
      operationalHours,
      lat: latNum,
      lng: lngNum,
      photoItems,
    }

    try {
      setFormError('')
      if (editingSpot) {
        const result = await updateLocation(editingSpot.id, payload)
        showSaveSuccess(result.message)
      } else {
        const result = await createLocation(payload)
        showSaveSuccess(result.message)
      }
      resetFormState()
      setActiveTab('daftar')
      pageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const msg = err?.message || t('admin.errSaveGeneric')
      setFormError(msg)
      showError(t('admin.errSaveTitle'), msg)
    }
  }

  const handleRequestDelete = useCallback(
    (spot) => {
      confirmDeleteWisata({
        itemName: spot.name,
        onConfirm: async () => {
          try {
            const msg = await removeLocation(spot.id)
            if (editingSpot?.id === spot.id) {
              resetFormState()
            }
            showDeleteSuccess(msg || t('admin.deletedDetail', { name: spot.name }))
          } catch (err) {
            showError(t('admin.errDeleteTitle'), err?.message || t('admin.errDeleteGeneric'))
          }
        },
      })
    },
    [confirmDeleteWisata, removeLocation, editingSpot, resetFormState, showDeleteSuccess, showError, t],
  )

  const handleRequestLogout = useCallback(() => {
    confirmLogout({
      onConfirm: async () => {
        if (typeof onLogout === 'function') {
          await onLogout()
          return
        }
        clearAuthStorage()
        window.location.assign('/login')
      },
    })
  }, [confirmLogout, onLogout])

  return (
    <div
      ref={pageScrollRef}
      className="relative h-dvh w-full overflow-y-auto overflow-x-hidden overscroll-contain bg-[#2c3b26] text-[#EBF0EB]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 12% 10%, rgba(79, 95, 59, 0.36) 0%, transparent 45%), radial-gradient(circle at 88% 85%, rgba(20, 28, 20, 0.6) 0%, transparent 50%)',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8 lg:px-8">
        {/* Header Admin */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-[60px] w-[60px] sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(244,239,230,0.2)] bg-[#1E2B20] p-0 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18),0_10px_24px_-6px_rgba(0,0,0,0.5)]">
              <SabahMascot variant="admin" size="sm" className="h-full w-full scale-[1.18]" />
            </div>
            <div>
              <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#EBF0EB]">
                {t('admin.title')}
              </h1>
              <p className="text-[12.5px] text-[#C8D3C8]">
                {t('admin.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex min-h-[40px] items-center rounded-xl border border-white/15 bg-[#141C14]/55 px-3.5 text-[12px] font-medium tabular-nums text-[#C8D3C8] backdrop-blur-md">
              {isLoading ? t('admin.loadingDb') : t('admin.dbCount', { count: locations.length })}
            </span>

            <Link
              to="/"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/18 bg-[#141C14]/65 px-3.5 py-2 text-[12.5px] font-semibold text-[#EBF0EB] backdrop-blur-md transition-colors hover:border-white/30 hover:bg-[#1E2B1E] active:scale-[0.98]"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>{t('admin.mainMap')}</span>
            </Link>

            <button
              type="button"
              id="btn-admin-logout"
              onClick={handleRequestLogout}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-300/25 bg-[#3A1B22]/85 px-3.5 py-2 text-[12.5px] font-semibold text-rose-100 backdrop-blur-md transition-colors hover:bg-[#49222B] active:scale-[0.98]"
            >
              <span>{t('admin.logout')}</span>
            </button>
          </div>
        </header>

        {/* Tab Switcher Liquid Glass */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={t('admin.navAria')}
            className="relative grid w-full max-w-sm grid-cols-2 rounded-2xl border border-white/15 bg-[#141C14]/55 p-1 backdrop-blur-xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.16)]"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl border border-white/25 bg-white/[0.14] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.28)] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                activeTab === 'daftar' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />

            <button
              type="button"
              role="tab"
              id="tab-tambah-lokasi"
              aria-selected={activeTab === 'tambah'}
              onClick={() => handleSwitchTab('tambah')}
              className={`relative z-10 min-h-[42px] rounded-xl px-4 text-[13px] transition-colors duration-150 ${
                activeTab === 'tambah'
                  ? 'font-semibold text-[#EBF0EB]'
                  : 'font-medium text-[#C8D3C8] hover:text-[#EBF0EB]'
              }`}
            >
              {editingSpot ? t('admin.tabEdit') : t('admin.tabAdd')}
            </button>

            <button
              type="button"
              role="tab"
              id="tab-daftar-lokasi"
              aria-selected={activeTab === 'daftar'}
              onClick={() => handleSwitchTab('daftar')}
              className={`relative z-10 min-h-[42px] rounded-xl px-4 text-[13px] tabular-nums transition-colors duration-150 ${
                activeTab === 'daftar'
                  ? 'font-semibold text-[#EBF0EB]'
                  : 'font-medium text-[#C8D3C8] hover:text-[#EBF0EB]'
              }`}
            >
              {t('admin.tabList', { count: locations.length })}
            </button>
          </div>

          {editingSpot && activeTab === 'tambah' && (
            <div className="flex items-center gap-2 rounded-xl border border-[#E2D7B5]/35 bg-[#141C14]/65 px-3.5 py-2 text-[12px] backdrop-blur-md">
              <span className="text-[#E2D7B5]">
                {t('admin.editingNotice')} <strong className="font-semibold text-[#EBF0EB]">{editingSpot.name}</strong>
              </span>
              <button
                type="button"
                onClick={resetFormState}
                className="ml-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#EBF0EB] transition-colors hover:bg-white/20"
              >
                {t('admin.cancelEdit')}
              </button>
            </div>
          )}
        </div>

        {/* PANEL TAB 1: TAMBAH / EDIT LOKASI (2 KOLOM DESKTOP) */}
        {activeTab === 'tambah' ? (
          <form
            key="panel-tambah"
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 animate-fade-enter space-y-6"
          >
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-rose-400/35 bg-[#2a1216]/90 px-4 py-3 text-[13px] text-rose-100 backdrop-blur-md"
              >
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* KOLOM KIRI (7 KOLOM): Informasi Lokasi & Jam Operasional */}
              <div className="space-y-6 lg:col-span-7">
                {/* Kartu Informasi Lokasi */}
                <section className={glassCardClass} aria-labelledby="heading-info-lokasi">
                  <h2 id="heading-info-lokasi" className="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                    {t('admin.infoHeading')}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#C8D3C8]">
                    {t('admin.infoDesc')}
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="admin-name" className={labelBaseClass}>
                        {t('admin.nameLabel')}
                      </label>
                      <input
                        id="admin-name"
                        type="text"
                        value={form.name}
                        onChange={handleFieldChange('name')}
                        placeholder={t('admin.namePlaceholder')}
                        className={glassInputClass}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-category" className={labelBaseClass}>
                          {t('admin.categoryLabel')}
                        </label>
                        <div className="relative">
                          <select
                            id="admin-category"
                            value={form.category}
                            onChange={handleFieldChange('category')}
                            className={`${glassInputClass} appearance-none pr-9`}
                          >
                            {categoryOptions.map((cat) => (
                              <option
                                key={cat}
                                value={cat}
                                className="bg-[#1B261B] text-[#EBF0EB]"
                              >
                                {tCategory(cat)}
                              </option>
                            ))}
                          </select>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C8D3C8]"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="admin-ticket" className={labelBaseClass}>
                          {t('admin.ticketLabel')}
                        </label>
                        <input
                          id="admin-ticket"
                          type="text"
                          value={form.ticketPrice}
                          onChange={handleFieldChange('ticketPrice')}
                          placeholder={t('admin.ticketPlaceholder')}
                          className={glassInputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-rating" className={labelBaseClass}>
                          {t('admin.ratingLabel')}
                        </label>
                        <input
                          id="admin-rating"
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={form.rating}
                          onChange={handleFieldChange('rating')}
                          placeholder="4.5"
                          className={`${glassInputClass} tabular-nums`}
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <span className={labelBaseClass}>{t('admin.visibilityLabel')}</span>
                        <label
                          htmlFor="admin-popular"
                          className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.15] bg-white/[0.06] px-3.5 py-2 transition-colors hover:bg-white/[0.09]"
                        >
                          <span className="text-[13px] font-medium text-[#EBF0EB]">
                            {t('admin.markPopular')}
                          </span>
                          <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                            <input
                              id="admin-popular"
                              type="checkbox"
                              checked={form.isPopular}
                              onChange={handleFieldChange('isPopular')}
                              className="peer sr-only"
                            />
                            <span className="h-5 w-5 rounded-md border border-white/25 bg-white/[0.06] transition-colors peer-checked:border-[#EBF0EB] peer-checked:bg-[#EBF0EB] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#EBF0EB]" />
                            <CheckIcon className="pointer-events-none absolute h-3.5 w-3.5 text-[#161E16] opacity-0 transition-opacity peer-checked:opacity-100" />
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="admin-address" className={labelBaseClass}>
                        {t('admin.addressLabel')}
                      </label>
                      <input
                        id="admin-address"
                        type="text"
                        value={form.address}
                        onChange={handleFieldChange('address')}
                        placeholder={t('admin.addressPlaceholder')}
                        className={glassInputClass}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-description" className={labelBaseClass}>
                        {t('admin.descLabel')}
                      </label>
                      <textarea
                        id="admin-description"
                        rows={4}
                        value={form.description}
                        onChange={handleFieldChange('description')}
                        placeholder={t('admin.descPlaceholder')}
                        className={`${glassInputClass} resize-y`}
                      />
                    </div>
                  </div>
                </section>

                {/* Kartu Jam Operasional */}
                <section className={glassCardClass} aria-labelledby="heading-jam-operasional">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-[#E2D7B5]" />
                      <h2 id="heading-jam-operasional" className="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                        {t('admin.hoursHeading')}
                      </h2>
                    </div>

                    <button
                      type="button"
                      aria-pressed={form.is24Hours}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, is24Hours: !prev.is24Hours }))
                      }
                      className={`min-h-[34px] rounded-xl border px-3 text-[12px] font-medium transition-colors ${
                        form.is24Hours
                          ? 'border-[#EBF0EB] bg-[#EBF0EB] text-[#161E16]'
                          : 'border-white/15 bg-white/[0.06] text-[#C8D3C8] hover:text-[#EBF0EB]'
                      }`}
                    >
                      {t('admin.open24h')}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="admin-open" className={labelBaseClass}>
                        {t('admin.openTime')}
                      </label>
                      <input
                        id="admin-open"
                        type="time"
                        disabled={form.is24Hours}
                        value={form.openTime}
                        onChange={handleFieldChange('openTime')}
                        className={`${glassInputClass} [color-scheme:dark] disabled:opacity-45`}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-close" className={labelBaseClass}>
                        {t('admin.closeTime')}
                      </label>
                      <input
                        id="admin-close"
                        type="time"
                        disabled={form.is24Hours}
                        value={form.closeTime}
                        onChange={handleFieldChange('closeTime')}
                        className={`${glassInputClass} [color-scheme:dark] disabled:opacity-45`}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-[#C8D3C8]">
                        {t('admin.openDaysLabel')}
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, selectedDays: ALL_DAY_IDS }))
                          }
                          className="rounded-lg px-2 py-1 font-medium text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-[#EBF0EB]"
                        >
                          {t('admin.daily')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              selectedDays: ALL_DAY_IDS.slice(0, 5),
                            }))
                          }
                          className="rounded-lg px-2 py-1 font-medium text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-[#EBF0EB]"
                        >
                          {t('admin.weekdays')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              selectedDays: ALL_DAY_IDS.slice(5),
                            }))
                          }
                          className="rounded-lg px-2 py-1 font-medium text-[#C8D3C8] transition-colors hover:bg-white/10 hover:text-[#EBF0EB]"
                        >
                          {t('admin.weekends')}
                        </button>
                      </div>
                    </div>

                    <div
                      role="group"
                      aria-label={t('admin.selectDaysAria')}
                      className="grid grid-cols-4 gap-2 sm:grid-cols-7"
                    >
                      {WEEKDAYS.map((day) => {
                        const isSelected = form.selectedDays.includes(day.id)
                        return (
                          <button
                            key={day.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleToggleDay(day.id)}
                            title={t(`admin.day.${day.id}`)}
                            className={`flex min-h-[42px] items-center justify-center rounded-xl border px-2 text-[12.5px] font-semibold transition-colors duration-150 active:scale-[0.97] ${
                              isSelected
                                ? 'border-[#EBF0EB] bg-[#EBF0EB] text-[#161E16] shadow-sm'
                                : 'border-white/15 bg-white/[0.06] text-[#C8D3C8] hover:border-white/30 hover:text-[#EBF0EB]'
                            }`}
                          >
                            {t(`admin.day.${day.id}`)}
                          </button>
                        )
                      })}
                    </div>

                    <p className="mt-2.5 text-[12px] text-[#C8D3C8]">
                      {t('admin.savedFormat')}{' '}
                      <span className="font-medium text-[#EBF0EB]">
                        {tHours(buildOperationalHoursString(form))}
                      </span>
                    </p>
                  </div>
                </section>
              </div>

              {/* KOLOM KANAN (5 KOLOM): Titik Koordinat & Foto Lokasi Multi-Upload */}
              <div className="space-y-6 lg:col-span-5">
                {/* Kartu Titik Koordinat */}
                <section className={glassCardClass} aria-labelledby="heading-koordinat">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-[#E2D7B5]" />
                    <h2 id="heading-koordinat" className="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                      {t('admin.coordHeading')}
                    </h2>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[#C8D3C8]">
                    {t('admin.coordDesc')}
                  </p>

                  <div className="mt-4">
                    <AdminLocationPickerMap
                      lat={form.lat}
                      lng={form.lng}
                      onPickCoordinate={handlePickCoordinate}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="admin-lat" className={labelBaseClass}>
                        Latitude
                      </label>
                      <input
                        id="admin-lat"
                        type="number"
                        step="any"
                        value={form.lat}
                        onChange={handleFieldChange('lat')}
                        placeholder="-6.5971"
                        className={`${glassInputClass} font-mono tabular-nums`}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-lng" className={labelBaseClass}>
                        Longitude
                      </label>
                      <input
                        id="admin-lng"
                        type="number"
                        step="any"
                        value={form.lng}
                        onChange={handleFieldChange('lng')}
                        placeholder="106.8060"
                        className={`${glassInputClass} font-mono tabular-nums`}
                      />
                    </div>
                  </div>
                </section>

                {/* Kartu Foto Lokasi (Multi-Upload) */}
                <section className={glassCardClass} aria-labelledby="heading-foto-lokasi">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CameraIcon className="h-4 w-4 text-[#E2D7B5]" />
                      <h2 id="heading-foto-lokasi" className="text-[15px] font-bold tracking-tight text-[#EBF0EB]">
                        {t('admin.photosHeading')}
                      </h2>
                    </div>
                    <span className="text-[12px] font-medium tabular-nums text-[#C8D3C8]">
                      {t('admin.photosCount', { count: photoItems.length })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[#C8D3C8]">
                    {t('admin.photosDesc')}
                  </p>

                  <input
                    ref={fileInputRef}
                    id="admin-photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoInputChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    aria-label={t('admin.photosDropAria')}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingPhoto(true)
                    }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={handleDropPhoto}
                    className={`mt-4 flex min-h-[136px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                      isDraggingPhoto
                        ? 'border-[#E2D7B5] bg-white/[0.12]'
                        : 'border-white/20 bg-white/[0.04] hover:border-white/40 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#141C14]/70 text-[#E2D7B5]">
                      <CameraIcon className="h-5 w-5" />
                    </span>
                    <span className="text-[13px] font-medium text-[#EBF0EB]">
                      {t('admin.photosDropTitle')}
                    </span>
                    <span className="text-[11.5px] text-[#C8D3C8]">
                      {t('admin.photosDropHint')}
                    </span>
                  </button>

                  {photoItems.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {photoItems.map((item, idx) => {
                        const isPrimary = idx === 0
                        return (
                          <div
                            key={item.id}
                            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/15 bg-[#1B261B]"
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.name || `${t('admin.photosHeading')} ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />

                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                            {isPrimary ? (
                              <span className="absolute top-2 left-2 rounded-md border border-white/25 bg-[#141C14]/85 px-2 py-0.5 text-[10px] font-semibold text-[#E2D7B5] backdrop-blur-sm">
                                {t('admin.primaryBadge')}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryPhoto(item.id)}
                                className="absolute bottom-2 left-2 rounded-md border border-white/25 bg-[#141C14]/85 px-2 py-0.5 text-[10px] font-medium text-[#EBF0EB] backdrop-blur-sm transition-colors hover:bg-[#233020]"
                              >
                                {t('admin.setPrimaryBtn')}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(item.id)}
                              aria-label={t('admin.removePhotoAria', { index: idx + 1 })}
                              className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-[#141C14]/85 text-[#EBF0EB] backdrop-blur-sm transition-colors hover:bg-rose-500/80"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Footer Aksi Form */}
            <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-white/12 pt-5 sm:flex-row sm:items-center">
              {(editingSpot || form.name || form.address || photoItems.length > 0) && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={resetFormState}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/18 bg-[#141C14]/65 px-5 py-2.5 text-[13.5px] font-medium text-[#C8D3C8] backdrop-blur-md transition-colors hover:border-white/30 hover:text-[#EBF0EB] disabled:opacity-50"
                >
                  {editingSpot ? t('admin.cancelEdit') : t('admin.resetForm')}
                </button>
              )}

              <button
                type="submit"
                id="btn-simpan-lokasi"
                disabled={isSubmitting}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#EBF0EB] px-8 py-3 text-[14px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting && <RefreshIcon className="h-4 w-4 animate-spin" />}
                <span>
                  {isSubmitting
                    ? t('common.saving')
                    : editingSpot
                      ? t('common.saveChanges')
                      : t('admin.saveLocation')}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* PANEL TAB 2: DAFTAR WISATA TERHUBUNG DATABASE */
          <section key="panel-daftar" className="mt-6 animate-fade-enter space-y-5">
            {/* Toolbar Pencarian & Filter */}
            <div className={`${glassCardClass} space-y-4`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <input
                    type="search"
                    id="admin-search-spots"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('admin.searchPlaceholder')}
                    className={`${glassInputClass} pl-10 pr-9`}
                  />
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#C8D3C8]"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={t('explore.clearSearchAria')}
                      className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#C8D3C8] hover:bg-white/10 hover:text-[#EBF0EB]"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    id="btn-save-admin-filter"
                    onClick={handleSaveFilter}
                    className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 text-[13px] font-semibold transition-colors active:scale-[0.98] ${
                      isFilterUnsaved
                        ? 'border-[#DFAA63]/45 bg-[#DFAA63]/18 text-[#F5E6C8] hover:bg-[#DFAA63]/28'
                        : 'border-white/15 bg-white/[0.05] text-[#C8D3C8] hover:bg-white/[0.1] hover:text-[#EBF0EB]'
                    }`}
                  >
                    <span>{t('admin.saveFilter')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshList}
                    disabled={isLoading}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-white/18 bg-white/[0.06] px-4 text-[13px] font-medium text-[#EBF0EB] transition-colors hover:bg-white/[0.12] active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{t('common.reload')}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {['Semua', ...categoryOptions].map((cat) => {
                  const active = selectedCategoryFilter === cat
                  const count = categoryCounts[cat] ?? 0
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`min-h-[36px] rounded-xl border px-3.5 text-[12px] font-semibold tabular-nums transition-colors ${
                        active
                          ? 'border-[#EBF0EB] bg-[#EBF0EB] text-[#161E16]'
                          : 'border-white/15 bg-white/[0.05] text-[#C8D3C8] hover:border-white/30 hover:text-[#EBF0EB]'
                      }`}
                    >
                      {tCategory(cat)} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* State Loading / Error / Empty / Grid Kartu Wisata */}
            {fetchError ? (
              <div className={`${glassCardClass} flex flex-col items-center py-10 text-center`}>
                <AlertTriangleIcon className="h-8 w-8 text-rose-300" />
                <p className="mt-3 text-[14px] font-semibold text-[#EBF0EB]">
                  {t('admin.loadErrorTitle')}
                </p>
                <p className="mt-1 max-w-md text-[12.5px] text-[#C8D3C8]">{fetchError}</p>
                <button
                  type="button"
                  onClick={refreshLocations}
                  className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#EBF0EB] px-5 text-[13px] font-semibold text-[#161E16] hover:bg-[#DCE4DC]"
                >
                  <RefreshIcon className="h-4 w-4" />
                  <span>{t('common.retry')}</span>
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-2xl border border-white/12 bg-[#141C14]/45 p-4"
                  >
                    <div className="shimmer-skeleton aspect-[16/10] w-full rounded-xl" />
                    <div className="mt-4 h-4 w-2/3 rounded bg-white/10" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <div className="h-10 rounded-xl bg-white/10" />
                      <div className="h-10 rounded-xl bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className={`${glassCardClass} flex flex-col items-center py-12 text-center`}>
                <p className="text-[14px] font-semibold text-[#EBF0EB]">
                  {locations.length === 0
                    ? t('admin.emptyDbTitle')
                    : t('admin.emptyFilterTitle')}
                </p>
                <p className="mt-1 text-[12.5px] text-[#C8D3C8]">
                  {locations.length === 0
                    ? t('admin.emptyDbDesc')
                    : t('admin.emptyFilterDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (locations.length === 0) {
                      setActiveTab('tambah')
                    } else {
                      setSearchQuery('')
                      setSelectedCategoryFilter('Semua')
                    }
                  }}
                  className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-[#EBF0EB] px-5 text-[13px] font-semibold text-[#161E16] hover:bg-[#DCE4DC]"
                >
                  {locations.length === 0 ? t('admin.addFirstBtn') : t('common.resetFilter')}
                </button>
              </div>
            ) : (
              <>
                <p className="text-[12.5px] font-medium tabular-nums text-[#C8D3C8]">
                  {t('admin.showingCount', {
                    shown: filteredLocations.length,
                    total: locations.length,
                  })}
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredLocations.map((loc) => (
                    <article
                      key={loc.id}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-[#141C14]/55 backdrop-blur-xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.16)] transition-colors duration-150 hover:border-white/25"
                    >
                      <div>
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1B261B]">
                          <SafeImage
                            src={loc.image}
                            alt={loc.name}
                            width={480}
                            height={300}
                            className="h-full w-full object-cover object-center"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />

                          <span className="absolute top-2.5 left-2.5 rounded-lg border border-white/20 bg-[#141C14]/80 px-2.5 py-1 text-[11px] font-semibold text-[#EBF0EB] backdrop-blur-md">
                            {tCategory(loc.category)}
                          </span>

                          {loc.isPopular && (
                            <span className="absolute top-2.5 right-2.5 rounded-lg border border-[#E2D7B5]/40 bg-[#141C14]/80 px-2 py-0.5 text-[10.5px] font-semibold text-[#E2D7B5] backdrop-blur-md">
                              {t('admin.popularBadge')}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-1 text-[14.5px] font-bold tracking-tight text-[#EBF0EB]">
                              {loc.name}
                            </h3>
                            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold tabular-nums text-[#EBF0EB]">
                              <StarIcon filled className="h-3.5 w-3.5 text-amber-300" />
                              {Number(loc.rating || 0).toFixed(1)}
                            </span>
                          </div>

                          <p className="text-[12.5px] font-medium text-[#E2D7B5]">
                            {tTicket(formatTicketDisplay(loc.ticketPrice))}
                          </p>

                          <p className="line-clamp-2 min-h-[36px] text-[12px] leading-relaxed text-[#C8D3C8]">
                            {loc.address || t('admin.addressMissing')}
                          </p>

                          <p className="font-mono text-[11px] tabular-nums text-[#9AA89A]">
                            {Number(loc.coordinates.lat).toFixed(5)},{' '}
                            {Number(loc.coordinates.lng).toFixed(5)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 border-t border-white/10 p-4 pt-3">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(loc)}
                          className="min-h-[42px] rounded-xl border border-white/18 bg-white/[0.07] px-3 text-[12.5px] font-semibold text-[#EBF0EB] transition-colors hover:bg-white/[0.15] active:scale-[0.98]"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === loc.id}
                          onClick={() => handleRequestDelete(loc)}
                          className="min-h-[42px] rounded-xl border border-rose-300/25 bg-[#3B1D24]/80 px-3 text-[12.5px] font-semibold text-rose-100 transition-colors hover:bg-[#49242D] active:scale-[0.98] disabled:opacity-50"
                        >
                          {deletingId === loc.id ? t('common.deleting') : t('common.delete')}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* Komponen Terpadu Notifikasi Toast & Modal Konfirmasi Maskot Admin */}
      <AdminMascotFeedback
        feedback={feedback}
        isBusy={isFeedbackBusy}
        onDismiss={dismissFeedback}
        onConfirm={handleFeedbackConfirm}
        onSaveFilter={handleFeedbackSaveFilter}
        onPauseChange={setFeedbackPaused}
      />
    </div>
  )
}

export default memo(AdminPage)
