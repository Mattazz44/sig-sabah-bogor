import { useEffect, useState } from 'react'

export function useFavorites(userKey = 'guest') {
  const storageKey = `sig_wisata_favorites_${userKey}`

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
      return []
    } catch {
      return []
    }
  })

  // Sinkronisasi saat userKey berubah (misal login akun baru atau ganti akun)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setFavorites(parsed)
          return
        }
      }
      setFavorites([])
    } catch {
      setFavorites([])
    }
  }, [storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites))
    } catch {
      // ignore
    }
  }, [favorites, storageKey])

  const toggleFavorite = (slug) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const isFavorite = (slug) => favorites.includes(slug)

  return { favorites, toggleFavorite, isFavorite }
}
