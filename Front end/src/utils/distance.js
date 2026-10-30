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
 * Contoh: "800 m dari posisi kamu" atau "4.2 km dari posisi kamu"
 */
export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return null
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000)
    return `${meters} m dari posisi kamu`
  }
  const formatted = distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)
  return `${formatted} km dari posisi kamu`
}

/**
 * Menghitung estimasi waktu tempuh berkendara (mobil / motor) di kondisi lalu lintas kota Bogor.
 * Asumsi:
 * - Faktor kelokan jalan (winding factor / detour index): 1.35x dari garis lurus udara
 * - Kecepatan rata-rata berkendara dalam kota: ~25-30 km/jam (~0.45 km/menit)
 * - Buffer lampu merah & start: ~2-3 menit
 */
export function formatTravelTime(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '15 Menit'
  }

  // Jarak perkiraan rute jalan
  const roadDistanceKm = distanceKm * 1.35
  // Kecepatan rata-rata kota Bogor: 25 km/jam
  const minutes = Math.round((roadDistanceKm / 25) * 60) + 2

  if (minutes < 3) {
    return '3 Menit'
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remMinutes = minutes % 60
    return remMinutes > 0 ? `${hours} Jam ${remMinutes} Menit` : `${hours} Jam`
  }
  return `${minutes} Menit`
}

/**
 * Memperkaya objek tempat wisata dengan jarak dan waktu tempuh dinamis berdasarkan koordinat user.
 */
export function enrichTouristWithUserLocation(place, userPosition) {
  if (!place) return place
  if (!userPosition || !Array.isArray(userPosition) || userPosition.length < 2) {
    // Jika lokasi GPS pengguna belum tersedia/belum diizinkan, jangan berikan estimasi jarak palsu
    return {
      ...place,
      distanceKm: null,
      distance: null,
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
    distance: formatDistance(distKm),
    travelTime: formatTravelTime(distKm),
  }
}

