import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import { getImageUrl } from '../utils/imageHelper'

function normalizeSpot(item) {
  const rawGallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : []
  const rawImage = item.image || rawGallery[0] || ''

  return {
    ...item,
    ticketPrice: item.ticketPrice ?? item.ticket_price ?? 'Gratis',
    operationalHours: item.operationalHours ?? item.operational_hours ?? '',
    detailedDescription: item.detailedDescription ?? item.detailed_description ?? '',
    isPopular: Boolean(item.isPopular ?? item.is_popular),
    coordinates: {
      lat: Number(item.coordinates?.lat ?? item.latitude ?? -6.5971),
      lng: Number(item.coordinates?.lng ?? item.longitude ?? 106.806),
    },
    rawImage,
    rawGallery: rawGallery.length > 0 ? rawGallery : rawImage ? [rawImage] : [],
    image: rawImage ? getImageUrl(rawImage) : '',
    gallery: rawGallery.map((path) => getImageUrl(path)),
  }
}

function buildSpotFormData(payload) {
  const formData = new FormData()
  formData.append('name', (payload.name || '').trim())
  formData.append('category', payload.category || 'Alam & Curug')
  formData.append('latitude', String(Number(payload.lat)))
  formData.append('longitude', String(Number(payload.lng)))
  formData.append('address', (payload.address || '').trim())
  formData.append('description', (payload.description || '').trim())

  if (payload.detailedDescription !== undefined) {
    formData.append('detailed_description', (payload.detailedDescription || '').trim())
  }

  formData.append('operational_hours', (payload.operationalHours || '').trim())
  formData.append('ticket_price', (payload.ticketPrice || '').trim() || 'Gratis')
  formData.append('rating', String(Number(payload.rating) || 4.5))
  formData.append('is_popular', payload.isPopular ? '1' : '0')

  const photoOrder = []
  let newFileIdx = 0
  for (const item of payload.photoItems || []) {
    if (item.kind === 'new' && item.file) {
      formData.append('photos[]', item.file)
      photoOrder.push({ fileId: `new_${newFileIdx}` })
      newFileIdx += 1
    } else if (item.kind === 'existing' && item.rawPath) {
      photoOrder.push({ src: item.rawPath })
    }
  }
  formData.append('photo_order', JSON.stringify(photoOrder))

  return formData
}

async function parseErrorMessage(response, fallbackMessage) {
  try {
    const json = await response.json()
    if (json?.errors && typeof json.errors === 'object') {
      const firstError = Object.values(json.errors).flat()[0]
      if (firstError) return firstError
    }
    if (json?.message) return json.message
  } catch {
    // Abaikan error parsing non-JSON
  }
  return fallbackMessage
}

export function useAdminLocations({ onMutated } = {}) {
  const [locations, setLocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  const fetchAllSpots = useCallback(async () => {
    const res = await apiFetch('/api/tourists')
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, `Gagal memuat data (${res.status})`))
    }
    const json = await res.json()
    const rows = Array.isArray(json?.data) ? json.data : []
    // Tampilkan data terbaru di urutan atas tanpa mengubah urutan API explore
    return [...rows].reverse().map(normalizeSpot)
  }, [])

  const refreshLocations = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const normalized = await fetchAllSpots()
      setLocations(normalized)
    } catch (err) {
      setError(err?.message || 'Tidak dapat terhubung ke server Laravel untuk memuat daftar wisata.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchAllSpots])

  useEffect(() => {
    let isMounted = true
    fetchAllSpots()
      .then((normalized) => {
        if (isMounted) {
          setLocations(normalized)
          setError('')
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err?.message || 'Tidak dapat terhubung ke server Laravel untuk memuat daftar wisata.',
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [fetchAllSpots])

  const createLocation = useCallback(
    async (payload) => {
      setIsSubmitting(true)
      try {
        const formData = buildSpotFormData(payload)
        const res = await apiFetch('/api/tourists', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, 'Gagal menyimpan lokasi baru ke database.'))
        }
        const json = await res.json()
        const created = json?.data ? normalizeSpot(json.data) : null
        if (created) {
          setLocations((prev) => [created, ...prev])
        } else {
          await refreshLocations()
        }
        onMutated?.()
        return { spot: created, message: json?.message || 'Lokasi berhasil disimpan ke database.' }
      } finally {
        setIsSubmitting(false)
      }
    },
    [onMutated, refreshLocations],
  )

  const updateLocation = useCallback(
    async (id, payload) => {
      setIsSubmitting(true)
      try {
        const formData = buildSpotFormData(payload)
        formData.append('_method', 'PUT')
        const res = await apiFetch(`/api/tourists/${id}`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, 'Gagal memperbarui lokasi wisata.'))
        }
        const json = await res.json()
        const updated = json?.data ? normalizeSpot(json.data) : null
        if (updated) {
          setLocations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        } else {
          await refreshLocations()
        }
        onMutated?.()
        return { spot: updated, message: json?.message || 'Perubahan lokasi berhasil disimpan.' }
      } finally {
        setIsSubmitting(false)
      }
    },
    [onMutated, refreshLocations],
  )

  const removeLocation = useCallback(
    async (id) => {
      setDeletingId(id)
      try {
        const res = await apiFetch(`/api/tourists/${id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, 'Gagal menghapus lokasi dari database.'))
        }
        const json = await res.json().catch(() => ({}))
        setLocations((prev) => prev.filter((item) => item.id !== id))
        onMutated?.()
        return json?.message || 'Lokasi wisata berhasil dihapus.'
      } finally {
        setDeletingId(null)
      }
    },
    [onMutated],
  )

  return {
    locations,
    isLoading,
    isSubmitting,
    deletingId,
    error,
    refreshLocations,
    createLocation,
    updateLocation,
    removeLocation,
  }
}
