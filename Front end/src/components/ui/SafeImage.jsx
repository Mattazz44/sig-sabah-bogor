import { memo, useEffect, useState } from 'react'
import {
  DEFAULT_AVATAR_PLACEHOLDER,
  DEFAULT_IMAGE_PLACEHOLDER,
  getImageUrl,
  shouldUseNgrokFetch,
} from '../../utils/imageHelper'
import { CompassIcon, UserIcon } from './VectorIcons'

/**
 * Komponen gambar teroptimasi (60 FPS Mobile PWA):
 * 1. Shimmer skeleton loader selama proses fetch/loading (menghormati prefers-reduced-motion).
 * 2. Transisi fade-in halus (transition-opacity duration-300) saat gambar siap.
 * 3. Fallback gradient kaca estetik dengan ikon vektor halus bila URL foto kosong atau gagal dimuat.
 * 4. Bypass halaman peringatan ngrok via header 'ngrok-skip-browser-warning': 'true'.
 * 5. Pembersihan memori otomatis dengan URL.revokeObjectURL saat unmount.
 */
function isSvgPlaceholder(url) {
  return (
    !url ||
    url === DEFAULT_IMAGE_PLACEHOLDER ||
    url === DEFAULT_AVATAR_PLACEHOLDER ||
    url.startsWith('data:image/svg+xml')
  )
}

function SafeImage({
  src,
  alt = '',
  fallback = DEFAULT_IMAGE_PLACEHOLDER,
  className = '',
  imgClassName = '',
  fit = 'cover',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  width,
  height,
  onLoad,
  onError,
  ...rest
}) {
  const rawSrc = typeof src === 'string' ? src.trim() : ''
  const isEmptyOrPlaceholderSrc = isSvgPlaceholder(rawSrc)

  const resolvedFallbackUrl = isSvgPlaceholder(fallback)
    ? fallback
    : getImageUrl(fallback, DEFAULT_IMAGE_PLACEHOLDER)
  const hasPhotoFallback = !isSvgPlaceholder(resolvedFallbackUrl)

  const primaryUrl = isEmptyOrPlaceholderSrc
    ? resolvedFallbackUrl
    : getImageUrl(rawSrc, resolvedFallbackUrl)

  const [fetched, setFetched] = useState({ forUrl: null, objectUrl: null, failed: false })
  const [loadedUrl, setLoadedUrl] = useState(null)
  const [imgFailedFor, setImgFailedFor] = useState(null)

  const primaryFailed =
    (fetched.forUrl === primaryUrl && fetched.failed) ||
    (Boolean(fetched.forUrl === primaryUrl && fetched.objectUrl) &&
      imgFailedFor === fetched.objectUrl) ||
    imgFailedFor === primaryUrl

  const activeTargetUrl =
    primaryFailed && hasPhotoFallback && primaryUrl !== resolvedFallbackUrl
      ? resolvedFallbackUrl
      : primaryUrl

  const isInstantSource =
    isSvgPlaceholder(activeTargetUrl) ||
    activeTargetUrl.startsWith('data:') ||
    activeTargetUrl.startsWith('blob:')

  const useNgrokBlobFetch = !isInstantSource && shouldUseNgrokFetch(activeTargetUrl)

  useEffect(() => {
    if (!useNgrokBlobFetch) return undefined

    let isMounted = true
    let createdObjectUrl = null
    const controller = new AbortController()

    fetch(activeTargetUrl, {
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
        if (!blob || blob.size === 0 || (blob.type && !blob.type.startsWith('image/'))) {
          throw new Error(`Invalid image MIME/size: ${blob?.type || 'unknown'}`)
        }
        createdObjectUrl = URL.createObjectURL(blob)
        setFetched({ forUrl: activeTargetUrl, objectUrl: createdObjectUrl, failed: false })
      })
      .catch((err) => {
        if (!isMounted || err?.name === 'AbortError') return
        setFetched({ forUrl: activeTargetUrl, objectUrl: null, failed: true })
      })

    return () => {
      isMounted = false
      controller.abort()
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl)
      }
    }
  }, [activeTargetUrl, useNgrokBlobFetch])

  const hasFetchFailed =
    useNgrokBlobFetch && fetched.forUrl === activeTargetUrl && fetched.failed

  const displaySrc = !useNgrokBlobFetch
    ? activeTargetUrl
    : fetched.forUrl === activeTargetUrl && !fetched.failed
      ? fetched.objectUrl
      : null

  const showGlassFallback =
    isSvgPlaceholder(activeTargetUrl) ||
    hasFetchFailed ||
    (Boolean(displaySrc) && imgFailedFor === displaySrc)

  const isLoaded =
    showGlassFallback ||
    isInstantSource ||
    (Boolean(displaySrc) && loadedUrl === displaySrc)

  const effectiveLoading =
    isInstantSource || (displaySrc && displaySrc.startsWith('blob:')) ? 'eager' : loading

  const isContain = fit === 'contain'
  const isAvatarMode = fallback === DEFAULT_AVATAR_PLACEHOLDER

  // Pisahkan class ukuran/border untuk wrapper vs object-fit/scale/object-position untuk img
  const wrapperClasses = className
    .replace(/\b(group-hover|hover):scale-[^\s]+/g, '')
    .replace(/\bobject-(cover|contain|fill|none|scale-down|top|bottom|center|left|right|left-top|right-top|left-bottom|right-bottom)\b/g, '')
    .trim()

  const innerImageClasses = className
    .replace(/\bborder(?:-[^\s]+)?/g, '')
    .replace(/\baspect-[^\s]+/g, '')
    .trim()

  const combinedContainClasses = `${wrapperClasses} ${imgClassName}`
  const defaultMaxH = /\bmax-h-/.test(combinedContainClasses) ? '' : 'max-h-full'
  const defaultMaxW = /\bmax-w-/.test(combinedContainClasses) ? '' : 'max-w-full'

  const imageFitClasses = isContain
    ? `${defaultMaxH} ${defaultMaxW} w-auto h-auto object-contain object-center`.trim()
    : 'h-full w-full object-cover object-center'

  return (
    <div
      className={`relative overflow-hidden ${isContain ? 'flex items-center justify-center' : ''} ${wrapperClasses}`}
    >
      {showGlassFallback ? (
        <div
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className={`relative flex h-full w-full items-center justify-center overflow-hidden border border-white/[0.12] bg-gradient-to-br from-[#283526]/95 via-[#1C251C] to-[#141A14] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)] ${
            isAvatarMode ? 'rounded-full' : ''
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 -left-6 h-20 w-20 rounded-full bg-white/[0.06] blur-xl"
          />
          {isAvatarMode ? (
            <UserIcon className="h-[46%] w-[46%] max-h-7 max-w-7 text-[#EBF0EB]/70" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 text-[#E2D7B5]/60">
              <CompassIcon className="h-7 w-7" duotone />
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            aria-hidden="true"
            className={`pointer-events-none bg-white/[0.04] transition-opacity duration-300 ease-out ${
              !isLoaded ? 'shimmer-skeleton opacity-100' : 'opacity-0'
            } ${
              isContain
                ? isLoaded
                  ? 'hidden'
                  : 'h-56 w-72 sm:h-72 sm:w-96 rounded-2xl'
                : 'absolute inset-0 z-[1]'
            }`}
          />

          {displaySrc && (
            <img
              src={displaySrc}
              alt={alt}
              width={width}
              height={height}
              loading={effectiveLoading}
              decoding={decoding}
              fetchPriority={fetchPriority}
              onLoad={(e) => {
                setLoadedUrl(displaySrc)
                onLoad?.(e)
              }}
              onError={(e) => {
                setLoadedUrl(displaySrc)
                setImgFailedFor(displaySrc)
                onError?.(e)
              }}
              className={`${imageFitClasses} transition-opacity duration-300 ease-out ${
                isLoaded ? 'opacity-100' : isContain ? 'opacity-0 absolute pointer-events-none' : 'opacity-0'
              } ${isContain ? wrapperClasses.replace(/\bw-full\b|\bh-full\b/g, '') : innerImageClasses} ${imgClassName}`}
              {...rest}
            />
          )}
        </>
      )}
    </div>
  )
}

export default memo(SafeImage)
