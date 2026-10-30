// Pure UI constants shared by sidebar and map (no Leaflet imports here).

export const ALL_CATEGORY = 'Semua'

export const CATEGORIES = [ALL_CATEGORY, 'Alam & Curug', 'Kuliner', 'Edukasi & Budaya']

export const CATEGORY_COLORS = {
  'Alam & Curug': 'var(--color-pin-alam)',
  Kuliner: 'var(--color-pin-kuliner)',
  'Edukasi & Budaya': 'var(--color-pin-edukasi)',
}

// White glyphs drawn in a 24x24 viewBox, used inside map pins.
export const CATEGORY_GLYPHS = {
  'Alam & Curug':
    '<path fill="#fff" d="M12 2 5 12h4l-3.5 5h13L15 12h4L12 2Z"/><rect fill="#fff" x="10.75" y="17" width="2.5" height="5" rx="1"/>',
  Kuliner:
    '<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v7a3 3 0 0 0 6 0V2M9 2v20"/><path d="M18 22V2c-2.2 1.6-3 5-3 9h3"/></g>',
  'Edukasi & Budaya':
    '<path fill="#fff" d="M12 2 2 8v2h20V8L12 2Z"/><rect fill="#fff" x="4" y="11" width="2.6" height="7"/><rect fill="#fff" x="10.7" y="11" width="2.6" height="7"/><rect fill="#fff" x="17.4" y="11" width="2.6" height="7"/><rect fill="#fff" x="2" y="19" width="20" height="3"/>',
}
