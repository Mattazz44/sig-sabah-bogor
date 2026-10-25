import { useLocation, useNavigate } from 'react-router-dom'

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
        className="flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/20 active:scale-95"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Kembali ke Daftar
      </button>

      {place ? (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-[24px]">
            <img
              src={place.image}
              alt={place.name}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>

          <h2 id="detail-name" className="mt-4 text-[20px] font-bold tracking-tight text-white">
            {place.name}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-forest-900">
              {place.category}
            </span>
            <div className="flex items-center gap-1 font-medium text-white/90">
              <span className="text-amber-400">★</span>
              <span>{place.rating.toFixed(1)}</span>
            </div>
            {place.distance && (
              <>
                <span className="text-white/40">·</span>
                <span className="text-white/70">{place.distance}</span>
              </>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-white/5 p-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Alamat
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-white/85">{place.address}</p>
          </div>

          <div className="mt-3 rounded-2xl bg-white/5 p-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Tentang Destinasi
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-white/85">{place.description}</p>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-white/70">Tempat wisata tidak ditemukan.</p>
        </div>
      )}
    </article>
  )
}
