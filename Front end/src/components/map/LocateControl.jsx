import { useState } from 'react'
import { useMapLibre } from './mapContext'

export default function LocateControl({
  userPosition,
  status,
  onRequestLocation,
  is3D = true,
  onToggle3D,
  showBoundary = true,
  onToggleBoundary,
  clusteringEnabled = true,
  onToggleClustering,
}) {
  const { map } = useMapLibre()
  const [isLocating, setIsLocating] = useState(false)

  const handleLocateClick = (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (userPosition && Array.isArray(userPosition) && userPosition.length >= 2) {
      if (map) {
        map.flyTo({
          center: [Number(userPosition[1]), Number(userPosition[0])],
          zoom: 16,
          pitch: map.getPitch(),
          duration: 1100,
        })
      }
      return
    }

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
    <div
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
      className="fixed right-4 !pointer-events-auto z-[450] flex flex-col items-end gap-2.5"
    >
      {/* Toggle Tampilan Peta 2D (pitch: 0) / 3D (pitch: 55) */}
      {onToggle3D && (
        <button
          type="button"
          id="btn-toggle-3d"
          aria-pressed={is3D}
          aria-label={is3D ? 'Beralih ke tampilan datar 2D' : 'Beralih ke tampilan miring 3D'}
          title={is3D ? 'Mode 3D Aktif (Klik untuk 2D Datar)' : 'Mode 2D Aktif (Klik untuk 3D Miring)'}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggle3D()
          }}
          className={`apple-glass-pill group relative flex h-11 w-11 flex-col items-center justify-center rounded-2xl transition-all duration-150 ease-out hover:bg-[#1C241C]/90 active:scale-[0.97] cursor-pointer ${
            is3D
              ? 'text-[#DFAA63] border-[rgba(244,239,230,0.28)]'
              : 'text-[#F5F2EB]/75 hover:text-[#F5F2EB]'
          }`}
        >
          <span className="font-mono text-[12px] font-bold tracking-wide leading-none transition-transform duration-200 group-hover:scale-105">
            {is3D ? '3D' : '2D'}
          </span>
        </button>
      )}

      {/* Toggle Batas Wilayah Kota Bogor */}
      {onToggleBoundary && (
        <button
          type="button"
          id="btn-toggle-boundary"
          aria-pressed={showBoundary}
          aria-label={showBoundary ? 'Sembunyikan Batas Wilayah Kota Bogor' : 'Tampilkan Batas Wilayah Kota Bogor'}
          title={showBoundary ? 'Batas Wilayah Kota Bogor: Aktif (Klik untuk nonaktifkan)' : 'Batas Wilayah Kota Bogor: Nonaktif (Klik untuk aktifkan)'}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleBoundary()
          }}
          className={`apple-glass-pill group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 ease-out hover:bg-[#1C241C]/90 active:scale-[0.97] cursor-pointer ${
            showBoundary
              ? 'text-[#DFAA63] border-[rgba(244,239,230,0.28)]'
              : 'text-[#F5F2EB]/75 hover:text-[#F5F2EB]'
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

      {/* Toggle Marker Clustering */}
      {onToggleClustering && (
        <button
          type="button"
          id="btn-toggle-clustering"
          aria-pressed={clusteringEnabled}
          aria-label={clusteringEnabled ? 'Nonaktifkan Pengelompokan Marker (Cluster)' : 'Aktifkan Pengelompokan Marker (Cluster)'}
          title={clusteringEnabled ? 'Marker Clustering: Aktif (Klik untuk nonaktifkan)' : 'Marker Clustering: Nonaktif (Klik untuk aktifkan)'}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleClustering()
          }}
          className={`apple-glass-pill group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 ease-out hover:bg-[#1C241C]/90 active:scale-[0.97] cursor-pointer ${
            clusteringEnabled
              ? 'text-[#DFAA63] border-[rgba(244,239,230,0.28)]'
              : 'text-[#F5F2EB]/75 hover:text-[#F5F2EB]'
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
        className={`apple-glass-pill group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-150 ease-out hover:bg-[#1C241C]/90 active:scale-[0.97] cursor-pointer ${
          isGranted
            ? 'text-[#F5F2EB] border-[rgba(244,239,230,0.28)]'
            : isDenied
            ? 'text-rose-300'
            : 'text-[#F5F2EB]'
        }`}
      >
        {isRequesting ? (
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
              isGranted ? 'text-[#EBF0EB]' : isDenied ? 'text-rose-400' : 'text-[#EBF0EB]'
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

        {isGranted && (
          <span
            className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full border border-[#141A14] bg-[#DFAA63]"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  )
}
