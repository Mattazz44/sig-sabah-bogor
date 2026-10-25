import { memo, useState } from 'react'

function TouristDetailPage({
  place,
  onBack,
  onStartNavigation,
  isFavorite,
  toggleFavorite,
}) {
  const [copied, setCopied] = useState(false)

  if (!place) return null

  const favoriteActive = isFavorite ? isFavorite(place.slug) : false

  const handleShare = async () => {
    const shareData = {
      title: place.name,
      text: `${place.name} - Rekomendasi wisata di Bogor!`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // clipboard fallback
      }
    }
  }

  const handleStartJourney = () => {
    if (onStartNavigation) {
      onStartNavigation(place)
    } else {
      const lat = place.coordinates?.lat ?? -6.6115
      const lng = place.coordinates?.lng ?? 106.7725
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      window.open(mapsUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Format description into paragraphs
  const descriptionText = place.detailedDescription || place.description
  const paragraphs = descriptionText.split('\n\n').filter(Boolean)

  const galleryImages =
    place.gallery && place.gallery.length >= 3
      ? place.gallery
      : [place.image, place.image, place.image]

  return (
    <div
      id="tourist-detail-page"
      className="relative h-full w-full max-w-md mx-auto bg-forest-900 text-white overflow-y-auto overscroll-contain pb-32"
    >
      {/* 1. Hero Section (Atas) with Full-Width Background Photo */}
      <section className="relative h-[340px] w-full shrink-0 overflow-hidden">
        <img
          src={place.image}
          alt={place.name}
          className="h-full w-full object-cover"
        />

        {/* Top Dark Gradient for action buttons */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />

        {/* Top Action Bar: Back (Left), Share & Favorite (Right) */}
        <div className="absolute top-5 inset-x-0 px-4 flex items-center justify-between z-10">
          {/* Back Button */}
          <button
            type="button"
            id="detail-back-button"
            aria-label="Kembali ke peta"
            onClick={onBack}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55 active:scale-95"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Share Button */}
            <button
              type="button"
              id="detail-share-button"
              aria-label="Bagikan tempat ini"
              onClick={handleShare}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55 active:scale-95"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            {/* Favorite Button */}
            <button
              type="button"
              id="detail-favorite-button"
              aria-label={favoriteActive ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              onClick={() => toggleFavorite && toggleFavorite(place.slug)}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/35 backdrop-blur-md transition hover:bg-black/55 active:scale-95 ${
                favoriteActive ? 'text-rose-400' : 'text-white'
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={favoriteActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Copied Feedback Toast */}
        {copied && (
          <div className="absolute top-16 right-4 z-20 rounded-full bg-black/80 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            Tautan tersalin!
          </div>
        )}

        {/* Bottom Dark Gradient for Title & Rating readability */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-forest-900 via-forest-900/70 to-transparent" />

        {/* Title & Rating overlay at the bottom of hero */}
        <div className="absolute inset-x-0 bottom-3 px-5 z-10">
          <h1
            id="detail-title"
            className="text-[23px] font-bold tracking-tight text-white drop-shadow-md leading-tight"
          >
            {place.name}
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-white/90 drop-shadow">
            <span className="text-amber-400">★</span>
            <span className="font-semibold text-white">{place.rating.toFixed(1)}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/80">{place.distance || '16 km dari posisi kamu'}</span>
          </div>
        </div>
      </section>

      {/* 2. Quick Info Row (3 Kolom Dipisahkan Garis Vertikal Tipis) */}
      <section
        aria-label="Informasi singkat tempat wisata"
        className="mx-5 my-4 grid grid-cols-3 divide-x divide-white/15 rounded-2xl bg-white/[0.04] py-3.5 border border-white/10 shadow-sm"
      >
        {/* Kolom 1: Waktu Operasional */}
        <div className="flex flex-col items-center justify-center px-2 text-center">
          <span className="text-[11px] font-medium text-white/60">Waktu Operasional</span>
          <span className="mt-1 text-[13px] font-bold text-white tracking-tight">
            {place.operationalHours || '08.00-19.00'}
          </span>
        </div>

        {/* Kolom 2: Harga Tiket */}
        <div className="flex flex-col items-center justify-center px-2 text-center">
          <span className="text-[11px] font-medium text-white/60">Harga Tiket</span>
          <span className="mt-1 text-[13px] font-bold text-white tracking-tight">
            {place.ticketPrice || 'Rp175.000/pax'}
          </span>
        </div>

        {/* Kolom 3: Waktu ke destinasi */}
        <div className="flex flex-col items-center justify-center px-2 text-center">
          <span className="text-[11px] font-medium text-white/60">Waktu ke destinasi</span>
          <span className="mt-1 text-[13px] font-bold text-white tracking-tight">
            {place.travelTime || '20 Menit'}
          </span>
        </div>
      </section>

      {/* 3. Description Teks (Rapi, Lembut Sesuai Desain Figma) */}
      <section className="px-5 py-2">
        <div className="space-y-3 text-[13px] leading-relaxed text-white/80 font-normal">
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </section>

      {/* 4. Foto Tempat Wisata (Galeri Estetik Berujung Tumpul / Rounded) */}
      <section className="mt-5 px-5">
        <h2 className="text-[15px] font-bold tracking-tight text-white">Foto Tempat Wisata</h2>

        {/* Aesthetic Staggered Photo Collage Matching Figma */}
        <div className="relative mt-3.5 pb-2">
          {/* Foto 1: Kiri Atas */}
          <div className="w-[56%] overflow-hidden rounded-[26px] shadow-md border border-white/10 transition-transform duration-200 hover:scale-[1.02]">
            <img
              src={galleryImages[0]}
              alt={`${place.name} foto 1`}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Foto 2: Kanan Tengah (Staggered Offset) */}
          <div className="-mt-16 ml-auto w-[56%] overflow-hidden rounded-[26px] shadow-lg border border-white/10 transition-transform duration-200 hover:scale-[1.02]">
            <img
              src={galleryImages[1]}
              alt={`${place.name} foto 2`}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Foto 3: Kiri Bawah */}
          <div className="-mt-14 w-[56%] overflow-hidden rounded-[26px] shadow-md border border-white/10 transition-transform duration-200 hover:scale-[1.02]">
            <img
              src={galleryImages[2]}
              alt={`${place.name} foto 3`}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* 5. Tombol Navigasi Melayang ("Mulai Perjalanan" Google Maps External) */}
      <div className="fixed bottom-[74px] inset-x-0 flex justify-center z-[550] pointer-events-none">
        <button
          type="button"
          id="btn-mulai-perjalanan"
          onClick={handleStartJourney}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#7a6649] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_24px_rgba(0,0,0,0.45)] transition hover:bg-[#887353] active:scale-95 cursor-pointer border border-white/15"
        >
          {/* Compass / Paper Airplane Navigation Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <span>Mulai Perjalanan</span>
        </button>
      </div>
    </div>
  )
}

export default memo(TouristDetailPage)
