import { memo, useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { usePreferences } from '../../utils/preferences'

const DEFAULT_THRESHOLD_PX = 250

/**
 * Tombol melayang "Kembali ke atas" yang reusable untuk kontainer overflow-y-auto
 * maupun window scroll, tampil halus saat jarak scroll melewati threshold (250px).
 */
function ScrollToTopButton({
  scrollContainerRef,
  className = 'fixed bottom-24 right-4 z-40',
  threshold = DEFAULT_THRESHOLD_PX,
  hidden = false,
  ariaLabel,
}) {
  const { t } = usePreferences()
  const resolvedAriaLabel = ariaLabel || t('common.scrollToTop')
  const [scrolledPast, setScrolledPast] = useState(false)

  useEffect(() => {
    const usesContainerRef = Boolean(scrollContainerRef)
    const targetEl = usesContainerRef ? scrollContainerRef.current : window
    if (!targetEl) return undefined

    const readScrollTop = () => {
      if (usesContainerRef) {
        return scrollContainerRef.current?.scrollTop ?? 0
      }
      return window.scrollY || document.documentElement.scrollTop || 0
    }

    const handleScroll = () => {
      setScrolledPast(readScrollTop() > threshold)
    }

    handleScroll()
    targetEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      targetEl.removeEventListener('scroll', handleScroll)
    }
  }, [scrollContainerRef, threshold])

  const isVisible = !hidden && scrolledPast

  const handleScrollToTop = (e) => {
    e.stopPropagation()
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const behavior = prefersReduced ? 'auto' : 'smooth'

    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior })
      return
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior })
    }
  }

  return (
    <button
      type="button"
      data-scroll-top-btn="true"
      data-visible={isVisible ? 'true' : 'false'}
      data-no-sheet-drag="true"
      aria-label={resolvedAriaLabel}
      aria-hidden={!isVisible}
      title={resolvedAriaLabel}
      tabIndex={isVisible ? 0 : -1}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleScrollToTop}
      className={`${className} flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#2c352d]/90 p-3 text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:bg-[#3a463b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DFAA63] active:scale-95 ${
        isVisible
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-3 scale-90 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
    </button>
  )
}

export default memo(ScrollToTopButton)
