import { memo, useEffect, useState } from 'react'
import SafeImage from '../ui/SafeImage'
import { getBogorFallbackPhoto } from '../../utils/imageHelper'
import { CheckIcon, HeartIcon, ShareIcon, StarIcon } from '../ui/VectorIcons'

function formatLocationLabel(address) {
  if (!address || typeof address !== 'string') return 'Kota Bogor, Jawa Barat'
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => Boolean(part) && !/^rt\.?\d+/i.test(part))
  if (parts.length >= 3) {
    const kec = parts.find((p) =>
      /kecamatan|bogor\s+(tengah|utara|selatan|timur|barat)|tanah\s+sareal/i.test(p),
    )
    const shortKec = kec ? kec.replace(/^Kecamatan\s+/i, 'Kec. ') : parts[2]
    return `${parts[0]}, ${parts[1]}, ${shortKec}`
  }
  if (parts.length === 2) {
    return `${parts[0]}, ${parts[1]}`
  }
  return parts[0] || 'Kota Bogor, Jawa Barat'
}

function TouristCard({
  place,
  onSelect,
  onHover,
  isSelected = false,
  isMapHovered = false,
  saved = false,
  onToggleFavorite,
}) {
  const [copied, setCopied] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const displayLocation = formatLocationLabel(place.address)
  const fallbackPhoto = getBogorFallbackPhoto(place)

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
    <article
      className="group relative"
      data-place-id={place.id}
      data-selected={isSelected ? 'true' : 'false'}
      data-map-hovered={isMapHovered ? 'true' : 'false'}
      data-pressed={isPressed ? 'true' : 'false'}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => {
        setIsPressed(false)
        onHover?.(null)
      }}
    >
      <div
        className={`relative rounded-2xl border p-2 transition-all duration-200 ease-out has-[>button:active]:scale-[0.98] ${
          isPressed ? 'scale-[0.98]' : ''
        } ${
          isSelected
            ? 'border-[#DFAA63]/65 bg-[#DFAA63]/[0.11] ring-1 ring-[#DFAA63]/45 shadow-[0_14px_30px_-8px_rgba(223,170,99,0.24),inset_0_1px_0_0_rgba(244,239,230,0.2)]'
            : isMapHovered
              ? '-translate-y-0.5 border-[#DFAA63]/45 bg-white/[0.06] ring-1 ring-[#DFAA63]/30 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.58)]'
              : 'border-transparent bg-transparent hover:-translate-y-0.5 hover:border-[#DFAA63]/35 hover:bg-white/[0.045] hover:ring-1 hover:ring-[#DFAA63]/25 hover:shadow-[0_14px_28px_-8px_rgba(0,0,0,0.52)]'
        }`}
      >
        <button
          type="button"
          id={`card-${place.slug}`}
          data-selected={isSelected ? 'true' : 'false'}
          aria-current={isSelected ? 'location' : undefined}
          onPointerDown={() => setIsPressed(true)}
          onPointerUp={() => setIsPressed(false)}
          onPointerCancel={() => setIsPressed(false)}
          onPointerLeave={() => setIsPressed(false)}
          onFocus={() => onHover?.(place.id)}
          onBlur={() => onHover?.(null)}
          onClick={() => onSelect?.(place)}
          className="relative z-[1] block w-full text-left active:scale-[0.98] transition-transform duration-150 ease-out"
        >
          <div
            className={`apple-retro-bevel relative aspect-[16/10] w-full overflow-hidden rounded-xl ring-1 shadow-md transition-all duration-200 ease-out ${
              isSelected
                ? 'ring-[#DFAA63]/55 shadow-lg'
                : isMapHovered
                  ? 'ring-[#DFAA63]/40 shadow-xl'
                  : 'ring-[rgba(244,239,230,0.14)] group-hover:ring-[rgba(223,170,99,0.35)] group-hover:shadow-xl'
            }`}
          >
            {/* Kilau specular glare diagonal pada media foto */}
            <span
              aria-hidden="true"
              className="card-specular-sheen pointer-events-none absolute -inset-4 z-[2]"
            />
            <SafeImage
              src={place.image || fallbackPhoto}
              fallback={fallbackPhoto}
              alt={place.name}
              width={640}
              height={400}
              loading="eager"
              decoding="async"
              className={`h-full w-full object-cover object-center transition-transform duration-200 ease-out ${
                isMapHovered ? 'scale-105' : 'group-hover:scale-105'
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent transition-opacity duration-200 ease-out ${
                isMapHovered ? 'opacity-45' : 'opacity-80 group-hover:opacity-45'
              }`}
            />
            {isSelected && (
              <span className="pointer-events-none absolute bottom-2 left-2 z-[3] inline-flex items-center rounded-full border border-[#DFAA63]/50 bg-[#111711]/85 px-2.5 py-0.5 text-[10px] font-semibold tracking-tight text-[#DFAA63] backdrop-blur-md shadow-sm">
                Aktif di peta
              </span>
            )}
          </div>

          <div className="px-0.5 pt-2.5 pb-0.5">
            <h3
              className={`text-[15.5px] font-semibold leading-snug tracking-tight transition-colors duration-200 ${
                isSelected || isMapHovered
                  ? 'text-[#DFAA63]'
                  : 'text-[#F5F2EB] group-hover:text-[#DFAA63]'
              }`}
            >
              {place.name}
            </h3>
            <p className="mt-0.5 truncate text-[12.5px] text-[#F5F2EB]/60">{displayLocation}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#F5F2EB]/80">
              <StarIcon filled className="h-3.5 w-3.5 shrink-0 text-[#DFAA63]" />
              <span className="font-semibold not-italic tabular-nums text-[#F5F2EB]">
                {Number(place.rating || 0).toFixed(1)}
              </span>
              <span className="text-[#F5F2EB]/35" aria-hidden="true">·</span>
              <span className="truncate text-[11.5px] not-italic tabular-nums text-[#F5F2EB]/65">
                {place.distance || place.category}
              </span>
            </div>
          </div>
        </button>

        {/* Tombol aksi Bagikan & Favorit dengan lingkaran kaca blur tipis */}
        <div
          data-no-sheet-drag
          className="pointer-events-auto absolute top-4 right-4 z-[3] flex items-center gap-2"
        >
          <button
            type="button"
            data-no-sheet-drag
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleShare}
            aria-label={copied ? `Tautan ${place.name} tersalin` : `Bagikan ${place.name}`}
            className="apple-retro-bevel relative flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(244,239,230,0.2)] bg-black/40 text-[#F5F2EB] backdrop-blur-md shadow-sm transition-all duration-150 hover:bg-black/55 active:scale-[0.95] before:absolute before:-inset-1"
          >
            {copied ? <CheckIcon className="h-4 w-4 text-[#DFAA63]" /> : <ShareIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            data-no-sheet-drag
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onToggleFavorite?.(place.slug)}
            aria-pressed={saved}
            aria-label={saved ? `Hapus ${place.name} dari favorit` : `Simpan ${place.name} ke favorit`}
            className={`apple-retro-bevel relative flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md shadow-sm transition-all duration-150 active:scale-[0.95] before:absolute before:-inset-1 ${
              saved
                ? 'border-rose-300/40 bg-rose-950/65 text-rose-200 hover:bg-rose-900/75'
                : 'border-[rgba(244,239,230,0.2)] bg-black/40 text-[#F5F2EB] hover:bg-black/55'
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
