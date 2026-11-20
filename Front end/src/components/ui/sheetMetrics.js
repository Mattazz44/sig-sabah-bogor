// Pure layout metrics for the bottom sheet, shared by the sheet and the map (no Leaflet here).

export const PEEK_RATIO = 0.21 // Mode minimal (peek): handle + search bar aman di atas dock
export const PEEK_MIN = 160
export const HALF_RATIO = 0.38 // Posisi awal/default di mobile (~38vh agar peta di atas tetap lega)
export const HALF_MIN = 250
export const NAV_HEIGHT = 82 // Floating Liquid Glass Dock height + bottom margin offset
export const DESKTOP_BREAKPOINT = 768
export const SHEET_DESKTOP_LEFT = 12

export function getDesktopSidebarWidth(viewportWidth) {
  if (viewportWidth >= 1280) return 400
  if (viewportWidth >= 1024) return 375
  return 320
}

export const getPeekHeight = (viewportHeight) =>
  Math.min(viewportHeight, Math.max(PEEK_MIN, Math.round(viewportHeight * PEEK_RATIO)))

export const getHalfHeight = (viewportHeight) =>
  Math.min(viewportHeight, Math.max(HALF_MIN, Math.round(viewportHeight * HALF_RATIO)))

/**
 * Pixel offset [x, y] to shift the map center so a focused point lands in the
 * part of the map that is NOT covered by the (collapsed) sheet.
 */
export function getMapFocusOffset() {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w >= DESKTOP_BREAKPOINT) {
    return [-(SHEET_DESKTOP_LEFT + getDesktopSidebarWidth(w)) / 2, 0]
  }
  // Shift map focus up so markers land cleanly in the top 62% visible area above default 38vh sheet
  return [0, getHalfHeight(h) / 2 - NAV_HEIGHT / 2]
}
