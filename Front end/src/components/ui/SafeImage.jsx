import { memo, useEffect, useState } from 'react'
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  handleImageError,
} from '../../utils/imageHelper'

/**
 * Komponen gambar teroptimasi (60 FPS Mobile PWA):
 * 1. Shimmer Skeleton Loader (animate-pulse + shimmer-skeleton) selama proses fetch/loading.
 * 2. Transisi fade-in halus (transition-opacity duration-300 opacity-100) saat gambar siap.
 * 3. Atribut HTML loading="lazy" dan decoding="async" untuk mencegah main-thread jank.
 * 4. Bypass halaman peringatan ngrok via fetch header 'ngrok-skip-browser-warning': 'true'.
 * 5. Pembersihan memori otomatis dengan URL.revokeObjectURL saat komponen unmount.
 */
function SafeImage({
  src,
  alt = '',
  fallback = DEFAULT_IMAGE_PLACEHOLDER,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...rest
}) {
  const resolvedUrl = getImageUrl(src, fallback)
  const isInstantSource =
    resolvedUrl.startsWith('data:') || resolvedUrl.startsWith('blob:')

  const [displaySrc, setDisplaySrc] = useState(() =>
    isInstantSource ? resolvedUrl : null,
  )
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true
    let createdObjectUrl = null
    const controller = new AbortController()

    if (!src || isInstantSource) {
      setDisplaySrc(resolvedUrl)
      setIsLoaded(true)
      return () => {
        isMounted = false
      }
    }

    setIsLoaded(false)

    fetch(resolvedUrl, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          throw new Error('Unexpected HTML response instead of image')
        }
        return res.blob()
      })
      .then((blob) => {
        if (!isMounted) return
        createdObjectUrl = URL.createObjectURL(blob)
        setDisplaySrc(createdObjectUrl)
      })
      .catch((err) => {
        if (!isMounted || err?.name === 'AbortError') return
        // Fallback ke URL langsung atau placeholder jika fetch gagal
        setDisplaySrc(resolvedUrl || fallback)
      })

    return () => {
      isMounted = false
      controller.abort()
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
      }
    }
  }, [src, resolvedUrl, fallback, isInstantSource])

  // Pisahkan class efek hover scale agar berada di elemen <img> sementara ukuran berada di wrapper
  const wrapperClasses = className
    .replace(/\b(group-hover|hover):scale-[^\s]+/g, '')
    .trim()

  return (
    <div className={`relative overflow-hidden ${wrapperClasses}`}>
      {/* Shimmer Skeleton Loader selama gambar sedang di-fetch / di-decode */}
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] animate-pulse shimmer-skeleton bg-[#384931]"
        />
      )}

      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            setIsLoaded(true)
            if (onError) {
              onError(e)
            } else {
              handleImageError(e, fallback)
            }
          }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  )
}

export default memo(SafeImage)

