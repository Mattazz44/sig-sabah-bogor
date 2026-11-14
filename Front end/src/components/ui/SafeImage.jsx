import { memo, useEffect, useState } from 'react'
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  handleImageError,
} from '../../utils/imageHelper'

/**
 * Komponen gambar teroptimasi (60 FPS Mobile PWA):
 * 1. Shimmer skeleton loader selama proses fetch/loading (menghormati prefers-reduced-motion).
 * 2. Transisi fade-in halus (transition-opacity duration-300) saat gambar siap.
 * 3. Mendukung loading, decoding, fetchPriority, serta ukuran eksplisit untuk mencegah CLS.
 * 4. Bypass halaman peringatan ngrok via header 'ngrok-skip-browser-warning': 'true'.
 * 5. Pembersihan memori otomatis dengan URL.revokeObjectURL saat unmount.
 */
function SafeImage({
  src,
  alt = '',
  fallback = DEFAULT_IMAGE_PLACEHOLDER,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  width,
  height,
  onError,
  ...rest
}) {
  const resolvedUrl = getImageUrl(src, fallback)
  const isInstantSource =
    !src || resolvedUrl.startsWith('data:') || resolvedUrl.startsWith('blob:')

  const [fetched, setFetched] = useState({ forUrl: null, objectUrl: null })
  const [loadedUrl, setLoadedUrl] = useState(null)

  useEffect(() => {
    if (isInstantSource) return undefined

    let isMounted = true
    let createdObjectUrl = null
    const controller = new AbortController()

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
        setFetched({ forUrl: resolvedUrl, objectUrl: createdObjectUrl })
      })
      .catch((err) => {
        if (!isMounted || err?.name === 'AbortError') return
        setFetched({ forUrl: resolvedUrl, objectUrl: resolvedUrl || fallback })
      })

    return () => {
      isMounted = false
      controller.abort()
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
      }
    }
  }, [resolvedUrl, fallback, isInstantSource])

  const displaySrc = isInstantSource
    ? resolvedUrl
    : fetched.forUrl === resolvedUrl
      ? fetched.objectUrl
      : null

  const isLoaded = isInstantSource || (Boolean(displaySrc) && loadedUrl === displaySrc)

  // Pisahkan class efek hover scale agar berada di elemen <img> sementara ukuran berada di wrapper
  const wrapperClasses = className
    .replace(/\b(group-hover|hover):scale-[^\s]+/g, '')
    .trim()

  return (
    <div className={`relative overflow-hidden ${wrapperClasses}`}>
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] shimmer-skeleton bg-[#384931]"
        />
      )}

      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          onLoad={() => setLoadedUrl(displaySrc)}
          onError={(e) => {
            setLoadedUrl(displaySrc)
            if (onError) {
              onError(e)
            } else {
              handleImageError(e, fallback)
            }
          }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
          {...rest}
        />
      )}
    </div>
  )
}

export default memo(SafeImage)
