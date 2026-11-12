import { memo, useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLocationPickerMap from '../map/AdminLocationPickerMap'
import { useAdminLocations } from '../../hooks/useAdminLocations'
import { getImageUrl, handleImageError } from '../../utils/imageHelper'

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
  const [activeTab, setActiveTab] = useState('tambah') // 'tambah' | 'daftar'
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
    if (form.lat === '' || form.lng === '' || Number.isNaN(Number(form.lat)) || Number.isNaN(Number(form.lng))) {
      setErrorMsg('Silakan ketuk peta untuk menentukan titik koordinat lokasi.')
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
    'w-full rounded-lg bg-[#384931] border border-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition'
  const labelBaseClass = 'block text-[11px] font-medium text-white/60 mb-1.5'

  return (
    <div className="h-dvh w-full overflow-y-auto overscroll-contain bg-[#2c3b26] text-white">
      <div className="mx-auto w-full max-w-md px-6 pt-8 pb-16">
        {/* Header Admin */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-white/55">Admin</p>
            <h1 className="mt-0.5 text-[20px] font-bold tracking-tight text-white">
              Wisata Bogor
            </h1>
          </div>
          <Link
            to="/"
            className="rounded-full bg-white/10 hover:bg-white/15 px-3 py-1 text-[11px] font-medium text-white/80 transition"
          >
            ← Peta Utama
          </Link>
        </header>

        {/* Top Tab Navigation */}
        <nav
          aria-label="Navigasi Admin"
          className="mt-6 flex items-center gap-6 border-b border-white/15"
        >
          <button
            type="button"
            id="tab-tambah-lokasi"
            onClick={() => setActiveTab('tambah')}
            className={`relative pb-2.5 text-[13px] transition cursor-pointer ${
              activeTab === 'tambah'
                ? 'font-semibold text-white'
                : 'font-normal text-white/50 hover:text-white/80'
            }`}
          >
            <span>Tambah lokasi</span>
            {activeTab === 'tambah' && (
              <span className="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white rounded-full" />
            )}
          </button>

          <button
            type="button"
            id="tab-daftar-lokasi"
            onClick={() => setActiveTab('daftar')}
            className={`relative pb-2.5 text-[13px] transition cursor-pointer ${
              activeTab === 'daftar'
                ? 'font-semibold text-white'
                : 'font-normal text-white/50 hover:text-white/80'
            }`}
          >
            <span>Daftar ({locations.length})</span>
            {activeTab === 'daftar' && (
              <span className="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white rounded-full" />
            )}
          </button>
        </nav>

        {/* TAB 1: TAMBAH LOKASI */}
        {activeTab === 'tambah' ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-7" noValidate>
            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg bg-rose-500/20 border border-rose-400/40 px-3.5 py-2.5 text-[12px] text-rose-200"
              >
                {errorMsg}
              </div>
            )}

            {/* 1. Bagian Informasi */}
            <section className="space-y-3.5">
              <h2 className="text-[12px] font-bold tracking-wide text-white">
                Informasi
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
                  placeholder="Jbound Geo Edu Park"
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
                      className={`${inputBaseClass} appearance-none pr-8 cursor-pointer`}
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-[#2c3b26] text-white"
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
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
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
                    placeholder="75000"
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
                  placeholder="Tulis deskripsi singkat"
                  className={`${inputBaseClass} resize-none`}
                />
              </div>
            </section>

            {/* 2. Bagian Operasional */}
            <section className="space-y-3.5">
              <h2 className="text-[12px] font-bold tracking-wide text-white">
                Operasional
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-open" className={labelBaseClass}>
                    Buka
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
                    Tutup
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
                  Hari
                </label>
                <div className="relative">
                  <select
                    id="admin-days"
                    value={form.days}
                    onChange={handleFieldChange('days')}
                    className={`${inputBaseClass} appearance-none pr-8 cursor-pointer`}
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={day} className="bg-[#2c3b26] text-white">
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
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </section>

            {/* 3. Bagian Lokasi (Peta Interaktif) */}
            <section className="space-y-3.5">
              <div>
                <h2 className="text-[12px] font-bold tracking-wide text-white">
                  Lokasi
                </h2>
                <p className="mt-1 text-[11px] text-white/55">
                  Ketuk peta untuk menaruh titik
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
              <h2 className="text-[12px] font-bold tracking-wide text-white">
                Foto
              </h2>

              <input
                ref={fileInputRef}
                id="admin-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingPhoto(true)
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={handleDropPhoto}
                className={`relative flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border transition cursor-pointer ${
                  isDraggingPhoto
                    ? 'border-amber-300/60 bg-[#3f5237]'
                    : 'border-white/10 bg-[#384931] hover:bg-[#3e5036]'
                }`}
              >
                {/* Crosshair subtle divider lines like mockup */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/5" />
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/5" />

                {form.image ? (
                  <>
                    <img
                      src={form.image}
                      alt="Pratinjau foto lokasi"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-xs">
                      Ganti foto
                    </span>
                  </>
                ) : (
                  <span className="z-10 text-[12px] font-medium text-white/50">
                    Tambah foto
                  </span>
                )}
              </div>
            </section>

            {/* Tombol Aksi Simpan Lokasi */}
            <div className="pt-3 flex justify-center">
              <button
                type="submit"
                id="btn-simpan-lokasi"
                className="rounded-full bg-[#8c785c] hover:bg-[#9b8669] active:scale-95 px-9 py-2.5 text-[12px] font-semibold text-white shadow-md transition cursor-pointer"
              >
                Simpan lokasi
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: DAFTAR (jumlah_data) */
          <section className="mt-10">
            {locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[12px] text-white/55">Belum ada lokasi</p>
                <button
                  type="button"
                  id="btn-salin-json-empty"
                  onClick={handleCopyJson}
                  className="mt-7 text-[11px] text-white/55 underline underline-offset-4 hover:text-white transition cursor-pointer"
                >
                  {copySuccess ? 'Tersalin ke clipboard!' : 'Salin data (JSON)'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/60">
                    {locations.length} lokasi tersimpan di LocalStorage
                  </p>
                  <button
                    type="button"
                    id="btn-salin-json"
                    onClick={handleCopyJson}
                    className="text-[11px] font-medium text-white/75 underline underline-offset-4 hover:text-white transition cursor-pointer"
                  >
                    {copySuccess ? '✓ Tersalin (JSON)' : 'Salin data (JSON)'}
                  </button>
                </div>

                <div className="space-y-3">
                  {locations.map((loc) => (
                    <article
                      key={loc.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#384931] border border-white/10 p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getImageUrl(loc.image)}
                          alt={loc.name}
                          onError={handleImageError}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover bg-black/20"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-[13px] font-semibold text-white">
                            {loc.name}
                          </h3>
                          <p className="truncate text-[11px] text-white/60">
                            {loc.category} · Rp{' '}
                            {Number(loc.ticketPrice || 0).toLocaleString('id-ID')}
                          </p>
                          <p className="text-[10px] text-white/45 font-mono mt-0.5">
                            {loc.coordinates.lat}, {loc.coordinates.lng}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLocation(loc.id)}
                        title="Hapus lokasi"
                        className="shrink-0 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 px-2.5 py-1.5 text-[11px] font-medium text-rose-200 transition cursor-pointer"
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

