import { memo } from 'react'

/**
 * Maskot Rusa Tutul Sabah Bogor (Axis axis) — diakses terpusat dari aset statis
 * Front end/public/assets/mascot/ (/assets/mascot/mascot-*.svg & .png).
 *
 * Varian tersedia:
 * - 'default'      : /assets/mascot/mascot-default.svg
 * - 'confused'     : /assets/mascot/mascot-confused.svg
 * - 'taking-photo' : /assets/mascot/mascot-taking-photo.svg
 * - 'happy'        : /assets/mascot/mascot-happy.svg
 * - 'goodbye'      : /assets/mascot/mascot-goodbye.svg
 * - 'admin'        : /assets/mascot/mascot-admin.svg
 */
const SIZE_CLASSES = {
  sm: 'h-14 w-14',
  modal: 'h-20 w-20',
  md: 'h-24 w-24',
  lg: 'h-28 w-28',
}

const MASCOT_ASSETS = {
  default: {
    svg: '/assets/mascot/mascot-default.svg',
    png: '/assets/mascot/mascot-default.png',
    label: 'Maskot Rusa Tutul Sabah Bogor',
  },
  confused: {
    svg: '/assets/mascot/mascot-confused.svg',
    png: '/assets/mascot/mascot-confused.png',
    label: 'Maskot Rusa Tutul Sabah Bogor membawa kamera sambil bertanya',
  },
  'taking-photo': {
    svg: '/assets/mascot/mascot-taking-photo.svg',
    png: '/assets/mascot/mascot-taking-photo.png',
    label: 'Maskot Rusa Tutul Sabah Bogor sedang memotret',
  },
  happy: {
    svg: '/assets/mascot/mascot-happy.svg',
    png: '/assets/mascot/mascot-happy.png',
    label: 'Maskot Rusa Tutul Sabah Bogor bahagia memegang peta lipat',
  },
  goodbye: {
    svg: '/assets/mascot/mascot-goodbye.svg',
    png: '/assets/mascot/mascot-goodbye.png',
    label: 'Maskot Rusa Tutul Sabah Bogor melambaikan tangan perpisahan',
  },
  admin: {
    svg: '/assets/mascot/mascot-admin.svg',
    png: '/assets/mascot/mascot-admin.png',
    label: 'Maskot Rusa Tutul Admin Sabah Bogor memeriksa daftar wisata',
  },
}

function SabahMascot({
  variant = 'default',
  size = 'md',
  animate,
  format = 'svg',
  className = '',
  label,
}) {
  const resolvedVariant = MASCOT_ASSETS[variant] ? variant : 'default'
  const asset = MASCOT_ASSETS[resolvedVariant]
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md
  const shouldAnimate = animate ?? resolvedVariant !== 'default'
  const src = format === 'png' ? asset.png : asset.svg
  const altText = label || asset.label

  const wrapperAnimClass = shouldAnimate
    ? resolvedVariant === 'happy'
      ? 'sabah-mascot-happy-hop'
      : resolvedVariant === 'taking-photo'
        ? 'sabah-mascot-focus-lean'
        : resolvedVariant === 'default'
          ? 'sabah-mascot-float'
          : ''
    : ''

  return (
    <div
      data-mascot-variant={resolvedVariant}
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${sizeClass} ${wrapperAnimClass} ${className}`}
    >
      <img
        src={src}
        alt={altText}
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
        draggable={false}
        className="h-full w-full object-contain"
      />
    </div>
  )
}

export default memo(SabahMascot)
