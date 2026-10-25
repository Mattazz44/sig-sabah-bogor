import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sig_wisata_favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : ['tugu-kujang']
    } catch {
      return ['tugu-kujang']
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
