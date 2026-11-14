import { memo, useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLocationPickerMap from '../map/AdminLocationPickerMap'
import SafeImage from '../ui/SafeImage'
import { useAdminLocations } from '../../hooks/useAdminLocations'
import { CheckIcon, ChevronLeftIcon } from '../ui/VectorIcons'

const CATEGORY_OPTIONS = [
  { value: 'Alam & Curug', label: 'Alam' },
  { value: 'Kuliner', label: 'Kuliner' },
  { value: 'Edukasi & Budaya', label: 'Edukasi & Budaya' },
]

const DAY_OPTIONS = [
  'Setiap hari',
  'Senin - Jumat',
  'Sabtu - Minggu',
  'Selasa - Minggu',
]

const INITIAL_FORM = {
  name: '',
  category: 'Alam & Curug',
  ticketPrice: '',
  address: '',
  description: '',
  openTime: '',
  closeTime: '',
  days: 'Setiap hari',
  lat: -6.5971,
  lng: 106.806,
  image: '',
}

function AdminPage() {
  const [activeTab, setActiveTab] = useState('tambah')
  const [form, setForm] = useState(INITIAL_FORM)
  const [errorMsg, setErrorMsg] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  const { locations, addLocation, removeLocation, copyJsonToClipboard } =
    useAdminLocations()

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errorMsg) setErrorMsg('')
  }

  const handlePickCoordinate = useCallback(({ lat, lng }) => {
    setForm((prev) => ({
      ...prev,
      lat,
      lng,
    }))
  }, [])

  const processPhotoFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, image: reader.result }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    processPhotoFile(file)
  }

  const handleDropPhoto = (e) => {
    e.preventDefault()
    setIsDraggingPhoto(false)
    const file = e.dataTransfer.files?.[0]
    processPhotoFile(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setErrorMsg('Nama tempat wisata wajib diisi.')
      return
    }
    if (!form.address.trim()) {
      setErrorMsg('Alamat tempat wisata wajib diisi.')
      return
    }
    if (
      form.lat === '' ||
      form.lng === '' ||
      Number.isNaN(Number(form.lat)) ||
      Number.isNaN(Number(form.lng))
    ) {
      setErrorMsg('Ketuk peta untuk menentukan koordinat lokasi.')
      return
    }

    addLocation(form)
    setForm(INITIAL_FORM)
    setErrorMsg('')
    setActiveTab('daftar')
  }

  const handleCopyJson = async () => {
    const ok = await copyJsonToClipboard()
    if (ok) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const inputBaseClass =
    'min-h-[44px] w-full rounded-xl bg-[#202C1E] border border-[#EBF0EB]/16 px-3.5 py-2.5 text-[13px] text-[#EBF0EB] placeholder:text-[#98A698] focus:border-[#E2D7B5] transition-colors'
  const labelBaseClass = 'block text-[12px] font-medium text-[#C8D3C8] mb-1.5'

  return (
    <div className="h-dvh w-full overflow-y-auto overscroll-contain bg-[#2c3b26] text-[#EBF0EB]">
      <div className="mx-auto w-full max-w-md px-6 pt-8 pb-16">
        {/* Header Admin */}
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-[#C8D3C8]">Admin</p>
            <h1 className="mt-0.5 text-[20px] font-bold tracking-tight text-[#EBF0EB]">
              Wisata Bogor
            </h1>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] px-3.5 py-1.5 text-[12px] font-semibold text-[#EBF0EB] transition-colors hover:bg-[#31442B]"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Peta utama</span>
          </Link>
        </header>

        {/* Top Tab Navigation */}
        <div
          role="tablist"
          aria-label="Navigasi admin"
          className="mt-6 flex items-center gap-6 border-b border-[#EBF0EB]/15"
        >
          <button
            type="button"
            role="tab"
            id="tab-tambah-lokasi"
            aria-selected={activeTab === 'tambah'}
            onClick={() => setActiveTab('tambah')}
            className={`relative min-h-[42px] pb-2.5 text-[13.5px] transition-colors ${
              activeTab === 'tambah'
                ? 'font-semibold text-[#EBF0EB]'
                : 'font-normal text-[#C8D3C8] hover:text-[#EBF0EB]'
            }`}
          >
            <span>Tambah lokasi</span>
            {activeTab === 'tambah' && (
              <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-[#EBF0EB]" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="tab-daftar-lokasi"
            aria-selected={activeTab === 'daftar'}
            onClick={() => setActiveTab('daftar')}
            className={`relative min-h-[42px] pb-2.5 text-[13.5px] transition-colors ${
              activeTab === 'daftar'
                ? 'font-semibold text-[#EBF0EB]'
                : 'font-normal text-[#C8D3C8] hover:text-[#EBF0EB]'
            }`}
          >
            <span>Daftar ({locations.length})</span>
            {activeTab === 'daftar' && (
              <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-[#EBF0EB]" />
            )}
          </button>
        </div>

        {/* TAB 1: TAMBAH LOKASI */}
        {activeTab === 'tambah' ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-7" noValidate>
            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-rose-400/35 bg-[#2a1216] px-3.5 py-2.5 text-[12px] text-rose-100"
              >
                {errorMsg}
              </div>
            )}

            {/* 1. Bagian Informasi */}
            <section className="space-y-3.5">
              <h2 className="text-[13px] font-bold tracking-tight text-[#EBF0EB]">
                Informasi lokasi
              </h2>

              <div>
                <label htmlFor="admin-name" className={labelBaseClass}>
                  Nama tempat wisata
                </label>
                <input
                  id="admin-name"
                  type="text"
                  value={form.name}
                  onChange={handleFieldChange('name')}
                  placeholder="Contoh: Kebun Raya Bogor"
                  className={inputBaseClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-category" className={labelBaseClass}>
                    Kategori
                  </label>
                  <div className="relative">
                    <select
                      id="admin-category"
                      value={form.category}
                      onChange={handleFieldChange('category')}
                      className={`${inputBaseClass} appearance-none pr-8`}
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-[#202C1E] text-[#EBF0EB]"
                        >
                          {opt.label}
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
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C8D3C8]"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-ticket" className={labelBaseClass}>
                    Harga tiket (Rp)
                  </label>
                  <input
                    id="admin-ticket"
                    type="number"
                    min="0"
                    value={form.ticketPrice}
                    onChange={handleFieldChange('ticketPrice')}
                    placeholder="50000"
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-address" className={labelBaseClass}>
                  Alamat
                </label>
                <input
                  id="admin-address"
                  type="text"
                  value={form.address}
                  onChange={handleFieldChange('address')}
                  placeholder="Bogor, Jawa Barat"
                  className={inputBaseClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="admin-description" className={labelBaseClass}>
                  Deskripsi
                </label>
                <textarea
                  id="admin-description"
                  rows={3}
                  value={form.description}
                  onChange={handleFieldChange('description')}
                  placeholder="Tulis deskripsi singkat lokasi"
                  className={`${inputBaseClass} resize-none`}
                />
              </div>
            </section>

            {/* 2. Bagian Operasional */}
            <section className="space-y-3.5">
              <h2 className="text-[13px] font-bold tracking-tight text-[#EBF0EB]">
                Jam operasional
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-open" className={labelBaseClass}>
                    Jam buka
                  </label>
                  <input
                    id="admin-open"
                    type="text"
                    value={form.openTime}
                    onChange={handleFieldChange('openTime')}
                    placeholder="08:00"
                    className={inputBaseClass}
                  />
                </div>

                <div>
                  <label htmlFor="admin-close" className={labelBaseClass}>
                    Jam tutup
                  </label>
                  <input
                    id="admin-close"
                    type="text"
                    value={form.closeTime}
                    onChange={handleFieldChange('closeTime')}
                    placeholder="17:00"
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-days" className={labelBaseClass}>
                  Hari buka
                </label>
                <div className="relative">
                  <select
                    id="admin-days"
                    value={form.days}
                    onChange={handleFieldChange('days')}
                    className={`${inputBaseClass} appearance-none pr-8`}
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={day} className="bg-[#202C1E] text-[#EBF0EB]">
                        {day}
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
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C8D3C8]"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </section>

            {/* 3. Bagian Lokasi */}
            <section className="space-y-3.5">
              <div>
                <h2 className="text-[13px] font-bold tracking-tight text-[#EBF0EB]">
                  Titik koordinat
                </h2>
                <p className="mt-1 text-[12px] text-[#C8D3C8]">
                  Ketuk peta di bawah untuk menetapkan pin lokasi
                </p>
              </div>

              <AdminLocationPickerMap
                lat={form.lat}
                lng={form.lng}
                onPickCoordinate={handlePickCoordinate}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-lat" className={labelBaseClass}>
                    Latitude
                  </label>
                  <input
                    id="admin-lat"
                    type="number"
                    step="0.0001"
                    value={form.lat}
                    onChange={handleFieldChange('lat')}
                    placeholder="-6.5971"
                    className={inputBaseClass}
                  />
                </div>

                <div>
                  <label htmlFor="admin-lng" className={labelBaseClass}>
                    Longitude
                  </label>
                  <input
                    id="admin-lng"
                    type="number"
                    step="0.0001"
                    value={form.lng}
                    onChange={handleFieldChange('lng')}
                    placeholder="106.8060"
                    className={inputBaseClass}
                  />
                </div>
              </div>
            </section>

            {/* 4. Bagian Foto */}
            <section className="space-y-2">
              <span className="block text-[13px] font-bold tracking-tight text-[#EBF0EB]">
                Foto lokasi
              </span>

              <input
                ref={fileInputRef}
                id="admin-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              <button
                type="button"
                aria-label="Unggah foto lokasi"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingPhoto(true)
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={handleDropPhoto}
                className={`relative flex min-h-[176px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                  isDraggingPhoto
                    ? 'border-[#E2D7B5] bg-[#2B3C28]'
                    : 'border-[#EBF0EB]/22 bg-[#202C1E] hover:border-[#E2D7B5]/60 hover:bg-[#253320]'
                }`}
              >
                {form.image ? (
                  <>
                    <img
                      src={form.image}
                      alt="Pratinjau foto lokasi"
                      className="h-44 w-full object-cover"
                    />
                    <span className="absolute right-2.5 bottom-2.5 rounded-lg border border-[#EBF0EB]/20 bg-[#1B251B]/95 px-2.5 py-1 text-[11px] font-medium text-[#EBF0EB]">
                      Ganti foto
                    </span>
                  </>
                ) : (
                  <span className="text-[12.5px] font-medium text-[#C8D3C8]">
                    Pilih atau seret foto ke sini
                  </span>
                )}
              </button>
            </section>

            {/* Tombol Simpan Lokasi */}
            <div className="flex justify-center pt-3">
              <button
                type="submit"
                id="btn-simpan-lokasi"
                className="min-h-[44px] rounded-xl bg-[#EBF0EB] px-9 py-2.5 text-[13px] font-semibold text-[#161E16] shadow-sm transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
              >
                Simpan lokasi
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: DAFTAR */
          <section className="mt-8">
            {locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[13px] text-[#C8D3C8]">Belum ada lokasi tersimpan</p>
                <button
                  type="button"
                  id="btn-salin-json-empty"
                  onClick={handleCopyJson}
                  className="mt-6 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] px-4 text-[12px] font-medium text-[#EBF0EB] transition-colors hover:bg-[#31442B]"
                >
                  {copySuccess ? 'Tersalin ke clipboard' : 'Salin data JSON'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-[#C8D3C8] tabular-nums">
                    {locations.length} lokasi tersimpan di perangkat
                  </p>
                  <button
                    type="button"
                    id="btn-salin-json"
                    onClick={handleCopyJson}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#EBF0EB]/18 bg-[#253320] px-3 text-[12px] font-medium text-[#EBF0EB] transition-colors hover:bg-[#31442B]"
                  >
                    {copySuccess ? (
                      <>
                        <CheckIcon className="h-3.5 w-3.5 text-[#E2D7B5]" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <span>Salin JSON</span>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  {locations.map((loc) => (
                    <article
                      key={loc.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#EBF0EB]/14 bg-[#233020] p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <SafeImage
                          src={loc.image}
                          alt={loc.name}
                          className="h-12 w-12 shrink-0 rounded-lg bg-[#1C2719] object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-[13px] font-semibold text-[#EBF0EB]">
                            {loc.name}
                          </h3>
                          <p className="truncate text-[11.5px] text-[#C8D3C8]">
                            {loc.category} · Rp{' '}
                            {Number(loc.ticketPrice || 0).toLocaleString('id-ID')}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-[#B8C5B8] tabular-nums">
                            {loc.coordinates.lat}, {loc.coordinates.lng}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLocation(loc.id)}
                        title="Hapus lokasi"
                        className="min-h-[38px] shrink-0 rounded-lg border border-rose-300/25 bg-[#3B1D24] px-3 py-1.5 text-[12px] font-medium text-rose-100 transition-colors duration-150 hover:bg-[#49242D] active:scale-[0.97]"
                      >
                        Hapus
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default memo(AdminPage)
