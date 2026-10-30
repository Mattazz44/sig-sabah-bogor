// Pure layout metrics for the bottom sheet, shared by the sheet and the map (no Leaflet here).

export const PEEK_RATIO = 0.44 // Collapsed sheet covers ~44% of the screen bottom (shows search, categories, and top of first card)
export const PEEK_MIN = 340
export const NAV_HEIGHT = 60
export const DESKTOP_BREAKPOINT = 768
export const SHEET_DESKTOP_LEFT = 24
export const SHEET_DESKTOP_WIDTH = 420

export const getPeekHeight = (viewportHeight) =>
  Math.min(viewportHeight, Math.max(PEEK_MIN, Math.round(viewportHeight * PEEK_RATIO)))

/**
 * Pixel offset [x, y] to shift the map center so a focused point lands in the
 * part of the map that is NOT covered by the (collapsed) sheet.
 */
export function getMapFocusOffset() {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w >= DESKTOP_BREAKPOINT) return [-(SHEET_DESKTOP_LEFT + SHEET_DESKTOP_WIDTH) / 2, 0]
  // Shift map focus up so markers land in top 56% visible area above bottom sheet
  return [0, getPeekHeight(h) / 2 - NAV_HEIGHT / 2]
}
