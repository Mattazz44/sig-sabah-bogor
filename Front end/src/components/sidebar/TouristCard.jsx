import { memo, useEffect, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import { CheckIcon, HeartIcon, ShareIcon, StarIcon } from '../ui/VectorIcons'

function formatLocationLabel(address) {
  if (!address || typeof address !== 'string') return 'Bogor, Jawa Barat'
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
  }
  return parts[0] || 'Bogor, Jawa Barat'
}

function TouristCard({ place, onSelect, saved = false, onToggleFavorite }) {
  const [copied, setCopied] = useState(false)
  const displayLocation = formatLocationLabel(place.address)

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/place/${place.slug}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${place.name} - Sabah Bogor`,
          text: `Lihat destinasi ${place.name} di Sabah Bogor`,
          url: shareUrl,
        })
        return
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      }
      setCopied(true)
    } catch {
      // Abaikan jika pengguna membatalkan dialog bagikan bawaan
    }
  }

  return (
    <article className="group relative">
      <div className="relative overflow-hidden rounded-2xl border border-[#EBF0EB]/10 bg-[#233020] shadow-sm">
        <button
          type="button"
          id={`card-${place.slug}`}
          onClick={() => onSelect(place.slug)}
          className="block w-full text-left transition-transform duration-150 active:scale-[0.99]"
        >
          <SafeImage
            src={place.image}
            alt={place.name}
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="p-3.5">
            <h3 className="text-[15px] font-semibold tracking-tight text-[#EBF0EB]">{place.name}</h3>
            <p className="mt-0.5 text-[12px] text-[#C8D3C8]">{displayLocation}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#EBF0EB]/90">
              <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span className="font-semibold text-[#EBF0EB] tabular-nums">
                {Number(place.rating || 0).toFixed(1)}
              </span>
              <span className="text-[#9AA89A]" aria-hidden="true">·</span>
              <span className="text-[#C8D3C8]">{place.distance || place.category}</span>
            </div>
          </div>
        </button>

        {/* Tombol aksi non-bersarang di pojok kanan atas */}
        <div className="pointer-events-auto absolute top-2.5 right-2.5 z-[2] flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label={copied ? `Tautan ${place.name} tersalin` : `Bagikan ${place.name}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#EBF0EB]/20 bg-[#1B261B]/92 text-[#EBF0EB] shadow-sm transition-colors duration-150 hover:bg-[#253320] active:scale-[0.96] before:absolute before:-inset-1"
          >
            {copied ? <CheckIcon className="h-4 w-4 text-[#E2D7B5]" /> : <ShareIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite?.(place.slug)}
            aria-pressed={saved}
            aria-label={saved ? `Hapus ${place.name} dari favorit` : `Simpan ${place.name} ke favorit`}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors duration-150 active:scale-[0.96] before:absolute before:-inset-1 ${
              saved
                ? 'border-rose-300/35 bg-[#3B1D24]/92 text-rose-200 hover:bg-[#49242D]'
                : 'border-[#EBF0EB]/20 bg-[#1B261B]/92 text-[#EBF0EB] hover:bg-[#253320]'
            }`}
          >
            <HeartIcon filled={saved} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default memo(TouristCard)
