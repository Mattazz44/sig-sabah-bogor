import { memo, useState } from 'react'
import tourists from '../../data/tourists.json'

function CustomRoutePage({ onBack, onStartCustomRoute }) {
  // Destinasi bawaan: Museum of Zoology & Museum PETA
  const museumZoologi = tourists.find((t) => t.slug === 'museum-zoologi-bogor') || {
    id: 10,
    slug: 'museum-zoologi-bogor',
    name: 'Museum of zoology - Bogor Tengah',
    coordinates: { lat: -6.6014, lng: 106.7972 },
    image: '/images/museum-zoologi.jpg',
    travelTime: '7 Menit',
    distance: '2.5 KM',
  }

  const museumPeta = tourists.find((t) => t.slug === 'museum-peta') || {
    id: 4,
    slug: 'museum-peta',
    name: 'Museum PETA - Bogor Kota',
    coordinates: { lat: -6.5855, lng: 106.7947 },
    image: '/images/museum-peta.jpg',
    travelTime: '8 Menit',
    distance: '3 KM',
  }

  // 3. STATE DAFTAR RUTE CUSTOM (Dapat Ditambahkan Dinamis)
  const [customRoutesList, setCustomRoutesList] = useState([
    {
      id: 'cr-museum',
      title: 'Tur Edukasi: Museum of Zoology ➔ Museum PETA',
      desc: 'Rute Favorit Edukasi & Sejarah Bogor',
      isPrimary: true,
      stops: [
        { name: 'Museum of zoology - Bogor Tengah', type: 'Transit Pertama', distance: '2.5 KM', place: museumZoologi },
        { name: 'Museum PETA - Bogor Kota', type: 'Destinasi Akhir', distance: '3.0 KM', place: museumPeta },
      ],
      totalDistance: '5.4 KM',
      totalDuration: '15 Menit',
      places: [museumZoologi, museumPeta],
    },
    {
      id: 'cr-kuliner',
      title: 'Kuliner Legendaris Suryakencana',
      desc: 'Dibuat 1 minggu lalu',
      isPrimary: false,
      stops: [
        { name: 'Lawang Surya Kencana', type: 'Titik Kunjungan', distance: '3.0 KM', place: tourists.find((t) => t.slug === 'lawang-surya-kencana') },
      ],
      totalDistance: '3.0 KM',
      totalDuration: '10 Menit',
      places: [tourists.find((t) => t.slug === 'lawang-surya-kencana') || tourists[1]],
    },
  ])

  // 3. STATE MODAL "RANCANG RUTE CUSTOM BARU"
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false)
  const [newRouteTitle, setNewRouteTitle] = useState('')
  const [selectedDestIds, setSelectedDestIds] = useState([tourists[0]?.id, tourists[1]?.id])

  // Toggle pilihan destinasi di modal
  const handleToggleDest = (id) => {
    setSelectedDestIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id],
    )
  }

  // SUBMIT FORM "RANCANG RUTE CUSTOM BARU"
  const handleCreateRouteSubmit = (e) => {
    e.preventDefault()
    if (!newRouteTitle.trim() || selectedDestIds.length === 0) return

    const chosenPlaces = tourists.filter((t) => selectedDestIds.includes(t.id))
    const stopsFormatted = chosenPlaces.map((p, idx) => ({
      name: p.name,
      type: idx === 0 ? 'Titik Awal' : idx === chosenPlaces.length - 1 ? 'Destinasi Akhir' : `Transit ${idx}`,
      distance: p.distance || '2.5 KM',
      place: p,
    }))

    const newRoute = {
      id: `cr-${Date.now()}`,
      title: newRouteTitle.trim(),
      desc: 'Rute baru dibuat oleh Anda',
      isPrimary: false,
      stops: stopsFormatted,
      totalDistance: `${(chosenPlaces.length * 2.8).toFixed(1)} KM`,
      totalDuration: `${chosenPlaces.length * 8} Menit`,
      places: chosenPlaces,
    }

    setCustomRoutesList((prev) => [newRoute, ...prev])
    setNewRouteTitle('')
    setSelectedDestIds([tourists[0]?.id, tourists[1]?.id])
    setShowCreateRouteModal(false)
  }

  return (
    <div className="h-full min-h-screen w-full bg-forest-900 text-white px-5 pt-7 pb-28 max-w-md mx-auto overscroll-contain overflow-y-auto">
      {/* Top Header with Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-back-custom-route"
            onClick={onBack}
            aria-label="Kembali ke aktivitas tersimpan"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition text-white cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-white leading-tight">
              Rute Custom
            </h1>
            <p className="text-[11px] text-white/60">
              Rute perjalanan tersimpan akun Anda
            </p>
          </div>
        </div>

        {/* 3. TOMBOL "+ Buat Rute" (AKTIF KLIK UNTUK MEMUNCULKAN MODAL RANCANG RUTE) */}
        <button
          type="button"
          id="btn-add-custom-route"
          onClick={() => setShowCreateRouteModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3 py-1.5 text-[11px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Buat Rute</span>
        </button>
      </div>

      {/* Info Status Akun Terhubung */}
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-forest-700/60 border border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/images/avatar-ambalingham.jpg"
            alt="Foto profil pengguna"
            className="h-10 w-10 rounded-full object-cover border border-emerald-400"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-white">Ambalingham</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 border border-emerald-400/30">
                Terhubung
              </span>
            </div>
            <p className="text-[11px] text-white/60">
              {customRoutesList.length} Rute Aktif Tersimpan
            </p>
          </div>
        </div>
      </div>

      {/* DAFTAR LIST RUTE CUSTOM */}
      <div className="mt-6 flex flex-col gap-5">
        {customRoutesList.map((route) => (
          <article
            key={route.id}
            id={`card-${route.id}`}
            className={`group flex flex-col rounded-2xl p-4 shadow-xl transition ${
              route.isPrimary
                ? 'bg-forest-700/80 border-2 border-emerald-500/40 hover:border-emerald-400'
                : 'bg-forest-700/60 border border-white/10 hover:border-white/20'
            }`}
          >
            {/* Header Rute */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {route.isPrimary && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <h3 className="text-[15px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {route.title}
                  </h3>
                </div>
                <span className="text-[11px] text-white/50 mt-0.5 block">
                  {route.desc}
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 shrink-0">
                {route.stops.length} Tujuan Wisata
              </span>
            </div>

            {/* Stepper Titik Lokasi */}
            <div className="my-3 flex flex-col gap-2.5 border-y border-white/10 py-3">
              {route.stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${
                      idx === 0
                        ? 'bg-emerald-500'
                        : idx === route.stops.length - 1
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex flex-1 items-center justify-between text-[12px]">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-white truncate">{stop.name}</span>
                      <span className="text-[10px] text-emerald-300">{stop.type}</span>
                    </div>
                    <span className="text-[10px] text-white/50 shrink-0">{stop.distance}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Rute: Jarak, Durasi, & Tombol Mulai Perjalanan */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-[11px] text-white/80">
                <span className="font-semibold text-emerald-300">📍 Total: {route.totalDistance}</span>
                <span>⏱ Total: {route.totalDuration}</span>
              </div>

              {/* TOMBOL "MULAI PERJALANAN" */}
              <button
                type="button"
                id={`btn-mulai-${route.id}`}
                onClick={() => {
                  if (onStartCustomRoute && route.places) {
                    onStartCustomRoute(route.places.filter(Boolean))
                  }
                }}
                className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-4 py-2 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] transition cursor-pointer border border-emerald-400/30"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                <span>Mulai Perjalanan</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* 3. MODAL FORM: "RANCANG RUTE CUSTOM BARU" */}
      {showCreateRouteModal && (
        <div
          id="modal-rancang-rute-overlay"
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            id="modal-rancang-rute"
            className="relative w-full max-w-sm rounded-3xl bg-forest-900 border border-white/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              id="btn-close-rancang-rute"
              onClick={() => setShowCreateRouteModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xl shadow-inner">
              🗺️
            </div>

            <h3 className="text-[18px] font-bold text-white tracking-tight text-center">
              Rancang Rute Custom Baru
            </h3>
            <p className="text-[11px] text-white/60 text-center mt-1">
              Pilih destinasi wisata untuk rute perjalanan Anda
            </p>

            <form onSubmit={handleCreateRouteSubmit} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1">
                  Nama Rute
                </label>
                <input
                  type="text"
                  id="input-new-route-title"
                  value={newRouteTitle}
                  onChange={(e) => setNewRouteTitle(e.target.value)}
                  placeholder="Contoh: Tur Budaya & Kebun Raya"
                  className="w-full rounded-xl bg-forest-700/80 border border-white/20 px-3 py-2 text-[12px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/80 block mb-1.5">
                  Pilih Destinasi Singgah (Pilih 2 atau lebih):
                </label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {tourists.slice(0, 7).map((place) => {
                    const isChecked = selectedDestIds.includes(place.id)
                    return (
                      <div
                        key={place.id}
                        onClick={() => handleToggleDest(place.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600/25 border-emerald-400/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={place.image}
                            alt={place.name}
                            className="h-9 w-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="truncate text-left">
                            <p className="text-[12px] font-bold text-white truncate">
                              {place.name}
                            </p>
                            <span className="text-[10px] text-white/60">
                              {place.category}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-white'
                              : 'border-white/30 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRouteModal(false)}
                  className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 py-2.5 text-[12px] font-semibold text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-new-custom-route"
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-2.5 text-[12px] font-bold text-white shadow-md transition cursor-pointer border border-emerald-400/30"
                >
                  Simpan Rute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(CustomRoutePage)
