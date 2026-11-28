/**
 * Menghitung jarak geodesic (rumus Haversine) antara dua titik koordinat dalam kilometer.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null
  }

  const R = 6371 // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Format jarak ke teks human-readable.
 * Mendukung bahasa (id/en) dan satuan (km/mi).
 */
export function formatDistance(distanceKm, options = {}) {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(Number(distanceKm))) {
    return null
  }
  const numericKm = Number(distanceKm)
  if (!Number.isFinite(numericKm) || numericKm < 0) return null

  const { unit = 'km', language = 'id' } = options
  const suffix = language === 'en' ? 'from you' : 'dari posisi kamu'

  if (unit === 'mi') {
    const miles = numericKm * 0.621371
    const formatted = miles < 10 ? miles.toFixed(1) : Math.round(miles)
    return `${formatted} mi ${suffix}`
  }

  if (numericKm < 1) {
    const meters = Math.round(numericKm * 1000)
    return `${meters} m ${suffix}`
  }
  const formatted = numericKm < 10 ? numericKm.toFixed(1) : Math.round(numericKm)
  return `${formatted} km ${suffix}`
}

/**
 * Format jarak ringkas untuk mini-card popup peta.
 * Contoh: "650 m", "3.2 km", "2.1 mi"
 */
export function formatShortDistance(distanceKm, options = {}) {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(Number(distanceKm))) {
    return null
  }
  const numericKm = Number(distanceKm)
  if (!Number.isFinite(numericKm) || numericKm < 0) {
    return null
  }
  const { unit = 'km' } = options
  if (unit === 'mi') {
    const miles = numericKm * 0.621371
    const formatted = miles < 100 ? miles.toFixed(1) : Math.round(miles)
    return `${formatted} mi`
  }
  if (numericKm < 1) {
    const meters = Math.max(10, Math.round(numericKm * 1000))
    return `${meters} m`
  }
  const formatted = numericKm < 100 ? numericKm.toFixed(1) : Math.round(numericKm)
  return `${formatted} km`
}

/**
 * Menghitung estimasi waktu tempuh berkendara (mobil / motor) di kondisi lalu lintas kota Bogor.
 */
export function formatTravelTime(distanceKm, options = {}) {
  const { language = 'id' } = options
  const minLabel = language === 'en' ? 'min' : 'Menit'
  const hrLabel = language === 'en' ? 'hr' : 'Jam'

  if (distanceKm === null || distanceKm === undefined || Number.isNaN(Number(distanceKm))) {
    return `15 ${minLabel}`
  }

  const roadDistanceKm = Number(distanceKm) * 1.35
  const minutes = Math.round((roadDistanceKm / 25) * 60) + 2

  if (minutes < 3) {
    return `3 ${minLabel}`
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remMinutes = minutes % 60
    return remMinutes > 0
      ? `${hours} ${hrLabel} ${remMinutes} ${minLabel}`
      : `${hours} ${hrLabel}`
  }
  return `${minutes} ${minLabel}`
}

/**
 * Memperkaya objek tempat wisata dengan jarak dan waktu tempuh dinamis berdasarkan koordinat user.
 */
export function enrichTouristWithUserLocation(place, userPosition, options = {}) {
  if (!place) return place
  if (!userPosition || !Array.isArray(userPosition) || userPosition.length < 2) {
    return {
      ...place,
      distanceKm: null,
      distance: null,
      shortDistance: null,
      travelTime: null,
    }
  }

  const [userLat, userLng] = userPosition
  const destLat = place.coordinates?.lat ?? place.latitude
  const destLng = place.coordinates?.lng ?? place.longitude

  if (destLat === undefined || destLng === undefined) {
    return place
  }

  const distKm = calculateDistanceKm(userLat, userLng, destLat, destLng)
  if (distKm === null) return place

  return {
    ...place,
    distanceKm: distKm,
    distance: formatDistance(distKm, options),
    shortDistance: formatShortDistance(distKm, options),
    travelTime: formatTravelTime(distKm, options),
  }
}
