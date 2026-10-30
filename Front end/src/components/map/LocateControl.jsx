import { useState } from 'react'
import { useMap } from 'react-leaflet'

export default function LocateControl({
  userPosition,
  status,
  onRequestLocation,
  showBoundary = true,
  onToggleBoundary,
  clusteringEnabled = true,
  onToggleClustering,
}) {
  const map = useMap()
  const [isLocating, setIsLocating] = useState(false)

  const handleLocateClick = (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (userPosition && Array.isArray(userPosition) && userPosition.length >= 2) {
      // Pengguna sudah mengizinkan & lokasi tersedia -> Geser kamera peta ke posisi pengguna
      map.flyTo(userPosition, 16, {
        animate: true,
        duration: 1.2,
      })
      return
    }

    // Jika belum ada posisi, picu permintaan lokasi GPS
    setIsLocating(true)
    if (onRequestLocation) {
      onRequestLocation()
    }
    setTimeout(() => {
      setIsLocating(false)
    }, 2500)
  }

  const isGranted = Boolean(userPosition)
  const isDenied = status === 'denied'
  const isRequesting = status === 'requesting' || isLocating

  let tooltipText = 'Tampilkan lokasi Anda'
  if (isDenied) tooltipText = 'Izin lokasi ditolak di browser'
  else if (isGranted) tooltipText = 'Pusatkan ke lokasi Anda'

  return (
    <div className="leaflet-bottom leaflet-right mb-24 mr-4 !pointer-events-auto z-[450] flex flex-col items-end gap-2.5">
      {/* Toggle Batas Wilayah Kota Bogor (WBS 1.2.7) */}
      {onToggleBoundary && (
        <button
          type="button"
          id="btn-toggle-boundary"
          aria-label={showBoundary ? 'Sembunyikan Batas Wilayah Kota Bogor' : 'Tampilkan Batas Wilayah Kota Bogor'}
          title={showBoundary ? 'Batas Wilayah Kota Bogor: Aktif (Klik untuk nonaktifkan)' : 'Batas Wilayah Kota Bogor: Nonaktif (Klik untuk aktifkan)'}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleBoundary()
          }}
          className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl shadow-xl backdrop-blur-md transition-all duration-200 active:scale-90 cursor-pointer border ${
            showBoundary
              ? 'bg-emerald-700/95 text-white border-emerald-400/50 hover:bg-emerald-600'
              : 'bg-forest-900/85 text-white/60 border-white/15 hover:bg-forest-800/95 hover:text-white'
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:scale-110"
          >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
        </button>
      )}

      {/* Toggle Marker Clustering (WBS 1.4.1) */}
      {onToggleClustering && (
        <button
          type="button"
          id="btn-toggle-clustering"
          aria-label={clusteringEnabled ? 'Nonaktifkan Pengelompokan Marker (Cluster)' : 'Aktifkan Pengelompokan Marker (Cluster)'}
          title={clusteringEnabled ? 'Marker Clustering: Aktif (Klik untuk nonaktifkan)' : 'Marker Clustering: Nonaktif (Klik untuk aktifkan)'}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleClustering()
          }}
          className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl shadow-xl backdrop-blur-md transition-all duration-200 active:scale-90 cursor-pointer border ${
            clusteringEnabled
              ? 'bg-emerald-700/95 text-white border-emerald-400/50 hover:bg-emerald-600'
              : 'bg-forest-900/85 text-white/60 border-white/15 hover:bg-forest-800/95 hover:text-white'
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:scale-110"
          >
            <circle cx="9" cy="9" r="5" />
            <circle cx="16" cy="15" r="5" />
            <path d="M8 9h2" />
            <path d="M9 8v2" />
          </svg>
        </button>
      )}

      <button
        type="button"
        id="btn-show-my-location"
        aria-label={tooltipText}
        title={tooltipText}
        onClick={handleLocateClick}
        className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl backdrop-blur-md transition-all duration-200 active:scale-90 cursor-pointer border ${
          isGranted
            ? 'bg-blue-600 text-white border-blue-400/40 hover:bg-blue-500 shadow-blue-900/40'
            : isDenied
            ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 hover:bg-rose-900/90'
            : 'bg-forest-900/90 text-white hover:bg-forest-800/95 border-white/20'
        }`}
      >
        {isRequesting ? (
          // Spinner animasi loading
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          // Ikon GPS Crosshair ala Google Maps
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 group-hover:scale-110 ${
              isGranted ? 'text-white' : isDenied ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
            {isGranted && <circle cx="12" cy="12" r="2.5" fill="currentColor" />}
          </svg>
        )}

        {/* Pulse effect saat lokasi aktif */}
        {isGranted && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        )}
      </button>
    </div>
  )
}

