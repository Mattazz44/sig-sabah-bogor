import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sig_wisata_recently_viewed'
const MAX_RECENT = 10

export function useRecentlyViewed() {
  const [recentSlugs, setRecentSlugs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSlugs))
    } catch {
      // ignore
    }
  }, [recentSlugs])

  const addRecentlyViewed = useCallback((slug) => {
    if (!slug) return
    setRecentSlugs((prev) => {
      const filtered = prev.filter((s) => s !== slug)
      return [slug, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  return { recentSlugs, addRecentlyViewed }
}

