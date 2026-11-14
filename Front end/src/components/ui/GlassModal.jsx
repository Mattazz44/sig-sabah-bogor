import { useEffect, useRef, useState } from 'react'
import { XIcon } from './VectorIcons'

function getFocusableElements(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

/**
 * Dialog modal bergaya Liquid Glass konsisten dengan LoginModal dan NotificationDrawer.
 * Menyediakan animasi masuk/keluar 60fps, Escape key, klik luar overlay, dan fokus aksesibel.
 */
export default function GlassModal({
  isOpen,
  onClose,
  overlayId,
  modalId,
  closeButtonId,
  titleId,
  closeAriaLabel = 'Tutup dialog',
  maxWidthClass = 'max-w-sm',
  children,
}) {
  const cardRef = useRef(null)
  const previousFocusRef = useRef(null)

  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [isEntered, setIsEntered] = useState(isOpen)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setIsClosing(false)
      setIsEntered(false)
    } else {
      setIsClosing(true)
    }
  }

  useEffect(() => {
    if (isOpen) {
      let nestedRafId = 0
      const rafId = requestAnimationFrame(() => {
        nestedRafId = requestAnimationFrame(() => {
          setIsEntered(true)
        })
      })
      return () => {
        cancelAnimationFrame(rafId)
        cancelAnimationFrame(nestedRafId)
      }
    }

    if (!isClosing) return undefined
    const timerId = setTimeout(() => {
      setIsClosing(false)
      setIsEntered(false)
    }, 240)
    return () => clearTimeout(timerId)
  }, [isOpen, isClosing])

  const shouldRender = isOpen || isClosing
  const isVisible = isOpen && isEntered && !isClosing

  useEffect(() => {
    if (!shouldRender) return undefined
    previousFocusRef.current = document.activeElement
    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusableElements(cardRef.current)
      focusables[0]?.focus()
    }, 20)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusables = getFocusableElements(cardRef.current)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [shouldRender, onClose])

  if (!shouldRender) return null

  return (
    <div
      id={overlayId}
      onClick={onClose}
      className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/45 p-4 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={cardRef}
        id={modalId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-modal relative max-h-[90vh] w-full ${maxWidthClass} overflow-y-auto overscroll-contain rounded-3xl p-6 text-[#EBF0EB] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.28),0_24px_48px_-12px_rgba(0,0,0,0.48)] transition-[opacity,transform] duration-[240ms] ease-out motion-reduce:transition-none ${
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-3 scale-95 opacity-0'
        }`}
      >
        <button
          type="button"
          id={closeButtonId}
          onClick={onClose}
          aria-label={closeAriaLabel}
          className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.2] bg-[rgba(20,28,20,0.45)] text-[#EBF0EB] transition-colors duration-150 hover:bg-[rgba(20,28,20,0.68)] active:scale-[0.97] before:absolute before:-inset-1"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {children}
      </div>
    </div>
  )
}

