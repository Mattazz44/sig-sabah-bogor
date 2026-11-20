import { useLocation, useNavigate } from 'react-router-dom'
import SafeImage from '../ui/SafeImage'
import { ChevronLeftIcon, StarIcon } from '../ui/VectorIcons'

export default function TouristDetail({ place }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Use history back when we came from inside the app so filter + scroll state feel native;
  // fall back to "/" for fresh deep links.
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'))

  return (
    <article className="px-5 pt-2">
      <button
        type="button"
        id="detail-back"
        onClick={goBack}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#EBF0EB]/18 bg-[#EBF0EB]/[0.08] px-3.5 py-1.5 text-[12px] font-semibold text-[#EBF0EB] transition-colors duration-150 hover:bg-[#EBF0EB]/[0.15] active:scale-[0.97]"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Kembali ke daftar
      </button>

      {place ? (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-2xl">
            <SafeImage
              src={place.image}
              alt={place.name}
              loading="eager"
              fetchPriority="high"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>

          <h2 id="detail-name" className="mt-4 text-[20px] font-semibold tracking-tight text-[#F5F2EB]">
            {place.name}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span className="apple-glass-pill rounded-full px-3 py-1 font-semibold text-[#DFAA63]">
              {place.category}
            </span>
            <div className="flex items-center gap-1 font-medium text-[#F5F2EB]">
              <StarIcon filled className="h-3.5 w-3.5 text-[#DFAA63]" />
              <span className="font-mono tabular-nums tracking-wide">{Number(place.rating || 0).toFixed(1)}</span>
            </div>
            {place.distance && (
              <>
                <span className="text-[#F5F2EB]/40" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums tracking-wide text-[#F5F2EB]/65">{place.distance}</span>
              </>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.06] p-3.5">
            <h3 className="text-[12px] font-semibold text-white/60">
              Alamat
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-[#EBF0EB]/90">{place.address}</p>
          </div>

          <div className="mt-3 rounded-2xl border border-white/12 bg-white/[0.06] p-3.5">
            <h3 className="text-[12px] font-semibold text-white/60">
              Tentang destinasi
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-[#EBF0EB]/90">{place.description}</p>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-[#C8D3C8]">Tempat wisata tidak ditemukan.</p>
        </div>
      )}
    </article>
  )
}
