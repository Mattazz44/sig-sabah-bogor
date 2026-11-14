import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sig_wisata_favorites'
const DEFAULT_FAVORITES = [
  'museum-zoologi-bogor',
  'museum-peta',
  'lawang-surya-kencana',
  'tugu-kujang',
]

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Gabungkan tempat tersimpan awal agar rute custom bawaan akun memiliki destinasi yang valid
          return Array.from(new Set([...parsed, ...DEFAULT_FAVORITES]))
        }
      }
      return DEFAULT_FAVORITES
    } catch {
      return DEFAULT_FAVORITES
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // ignore
    }
  }, [favorites])

  const toggleFavorite = (slug) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const isFavorite = (slug) => favorites.includes(slug)

  return { favorites, toggleFavorite, isFavorite }
}
