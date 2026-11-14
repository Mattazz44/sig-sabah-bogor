import { memo, useEffect, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import { ChevronLeftIcon, HeartIcon, ShareIcon, StarIcon } from '../ui/VectorIcons'

function TouristDetailPage({
  place,
  onBack,
  onStartNavigation,
  isFavorite,
  toggleFavorite,
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  if (!place) return null

  const favoriteActive = isFavorite ? isFavorite(place.slug) : false

  const handleShare = async () => {
    const shareData = {
      title: place.name,
      text: `${place.name} - Rekomendasi wisata di Bogor`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // Pengguna membatalkan dialog bagikan bawaan
      }
    } else {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(window.location.href)
        }
        setCopied(true)
      } catch {
        // Abaikan jika akses clipboard ditolak
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

  const descriptionText = place.detailedDescription || place.description || ''
  const paragraphs = descriptionText.split('\n\n').filter(Boolean)

  const rawGallery =
    Array.isArray(place.gallery) && place.gallery.length > 0 ? place.gallery : [place.image]
  const galleryImages = [...new Set(rawGallery.filter(Boolean))]

  return (
    <div
      id="tourist-detail-page"
      className="relative mx-auto h-full w-full max-w-md overflow-y-auto overscroll-contain overscroll-y-contain bg-forest-900 pb-40 text-[#EBF0EB]"
    >
      <div className="animate-tab-enter">
        {/* 1. Hero Foto Destinasi (Eager + High Priority) */}
        <section className="relative h-[340px] w-full shrink-0 overflow-hidden">
          <SafeImage
            src={place.image}
            alt={place.name}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 via-black/35 to-transparent" />

          {/* Top Action Bar */}
          <div className="absolute inset-x-0 top-5 z-10 flex items-center justify-between px-4">
            <button
              type="button"
              id="detail-back-button"
              aria-label="Kembali ke peta"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBF0EB]/20 bg-[#1B261B]/92 text-[#EBF0EB] shadow-md transition-colors duration-150 hover:bg-[#253320] active:scale-[0.97]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                id="detail-share-button"
                aria-label="Bagikan tempat ini"
                onClick={handleShare}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBF0EB]/20 bg-[#1B261B]/92 text-[#EBF0EB] shadow-md transition-colors duration-150 hover:bg-[#253320] active:scale-[0.97]"
              >
                <ShareIcon className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                id="detail-favorite-button"
                aria-pressed={favoriteActive}
                aria-label={favoriteActive ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                onClick={() => toggleFavorite && toggleFavorite(place.slug)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition-colors duration-150 active:scale-[0.97] ${
                  favoriteActive
                    ? 'border-rose-300/35 bg-[#3B1D24]/92 text-rose-200 hover:bg-[#49242D]'
                    : 'border-[#EBF0EB]/20 bg-[#1B261B]/92 text-[#EBF0EB] hover:bg-[#253320]'
                }`}
              >
                <HeartIcon filled={favoriteActive} className="h-5 w-5" />
              </button>
            </div>
          </div>

          {copied && (
            <div
              role="status"
              aria-live="polite"
              className="absolute top-[70px] right-4 z-20 rounded-xl border border-[#EBF0EB]/20 bg-[#1B261B] px-3 py-1.5 text-[12px] font-medium text-[#EBF0EB] shadow-md"
            >
              Tautan tersalin
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-forest-900 via-forest-900/80 to-transparent" />

          <div className="absolute inset-x-0 bottom-3 z-10 px-5">
            <h1
              id="detail-title"
              className="text-[23px] font-bold leading-tight tracking-tight text-[#EBF0EB]"
            >
              {place.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#EBF0EB]">
              <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span className="font-semibold tabular-nums">{Number(place.rating || 0).toFixed(1)}</span>
              <span className="text-[#9AA89A]" aria-hidden="true">·</span>
              <span className="text-[#C8D3C8]">{place.distance || place.category}</span>
            </div>
          </div>
        </section>

        {/* 2. Ringkasan Informasi Operasional */}
        <section
          aria-label="Informasi singkat tempat wisata"
          className="mx-5 my-4 grid grid-cols-3 divide-x divide-[#EBF0EB]/15 rounded-2xl border border-[#EBF0EB]/12 bg-[#233020] py-3.5 shadow-sm"
        >
          <div className="flex flex-col items-center justify-center px-2 text-center">
            <span className="text-[11px] font-medium text-[#C8D3C8]">Jam buka</span>
            <span className="mt-1 text-[13px] font-bold tracking-tight text-[#EBF0EB]">
              {place.operationalHours || 'Belum tersedia'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-2 text-center">
            <span className="text-[11px] font-medium text-[#C8D3C8]">Tiket masuk</span>
            <span className="mt-1 text-[13px] font-bold tracking-tight text-[#EBF0EB]">
              {place.ticketPrice || 'Cek di lokasi'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-2 text-center">
            <span className="text-[11px] font-medium text-[#C8D3C8]">Estimasi tiba</span>
            <span className="mt-1 text-[13px] font-bold tracking-tight text-[#EBF0EB]">
              {place.travelTime || 'Aktifkan GPS'}
            </span>
          </div>
        </section>

        {/* 3. Deskripsi Destinasi */}
        {paragraphs.length > 0 && (
          <section className="px-5 py-2">
            <div className="space-y-3 text-[13px] font-normal leading-relaxed text-[#EBF0EB]/90">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* 4. Galeri Foto Tempat Wisata */}
        {galleryImages.length > 0 && (
          <section className="mt-5 px-5">
            <h2 className="text-[15px] font-bold tracking-tight text-[#EBF0EB]">Foto lokasi</h2>

            {galleryImages.length === 1 ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#EBF0EB]/12 shadow-sm">
                <SafeImage
                  src={galleryImages[0]}
                  alt={`${place.name} tampak lokasi`}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="relative mt-3.5 pb-2">
                {galleryImages.map((imgUrl, index) => {
                  const alignmentClass =
                    index === 0
                      ? 'w-[60%] shadow-sm'
                      : index % 2 === 1
                        ? '-mt-12 ml-auto w-[60%] shadow-md'
                        : '-mt-10 w-[60%] shadow-sm'
                  return (
                    <div
                      key={`${imgUrl}-${index}`}
                      className={`overflow-hidden rounded-2xl border border-[#EBF0EB]/12 transition-transform duration-200 hover:scale-[1.02] ${alignmentClass}`}
                    >
                      <SafeImage
                        src={imgUrl}
                        alt={`${place.name} foto ${index + 1}`}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* 5. Tombol Mulai Perjalanan di atas Floating Dock */}
      <button
        type="button"
        id="btn-mulai-perjalanan"
        onClick={handleStartJourney}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 94px)' }}
        className="fixed left-1/2 z-40 flex min-h-[44px] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#EBF0EB] px-6 py-2.5 text-[13px] font-semibold text-[#161E16] shadow-md transition-colors duration-150 hover:bg-[#DCE4DC] active:scale-[0.97]"
      >
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
        <span>Mulai perjalanan</span>
      </button>
    </div>
  )
}

export default memo(TouristDetailPage)
