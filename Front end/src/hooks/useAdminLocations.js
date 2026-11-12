import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sig_wisata_admin_locations'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function useAdminLocations() {
  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
    } catch {
      // ignore storage quota errors
    }
  }, [locations])

  const addLocation = useCallback((formData) => {
    const newEntry = {
      id: Date.now(),
      slug: slugify(formData.name) || `lokasi-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      ticketPrice: Number(formData.ticketPrice) || 0,
      address: formData.address.trim(),
      description: formData.description.trim(),
      operational: {
        open: formData.openTime.trim() || '08:00',
        close: formData.closeTime.trim() || '17:00',
        days: formData.days,
      },
      coordinates: {
        lat: Number(Number(formData.lat).toFixed(4)),
        lng: Number(Number(formData.lng).toFixed(4)),
      },
      rating: 4.5,
      image: formData.image || getImageUrl('/images/'),
      createdAt: new Date().toISOString(),
    }

    setLocations((prev) => [newEntry, ...prev])
    return newEntry
  }, [])

  const removeLocation = useCallback((id) => {
    setLocations((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearLocations = useCallback(() => {
    setLocations([])
  }, [])

  const copyJsonToClipboard = useCallback(async () => {
    const jsonString = JSON.stringify(locations, null, 2)
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(jsonString)
      return true
    }
    return false
  }, [locations])

  return {
    locations,
    addLocation,
    removeLocation,
    clearLocations,
    copyJsonToClipboard,
  }
}

