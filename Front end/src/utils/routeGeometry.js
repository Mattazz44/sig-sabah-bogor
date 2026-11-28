import { calculateDistanceKm } from './distance.js'

// Jarak minimum (meter) agar segmen penghubung jalan -> pin ditampilkan sebagai
// garis putus-putus jalan kaki (last-mile connector), bukan disambung garis padat.
export const LAST_MILE_DASH_THRESHOLD_METERS = 12
const COORD_EPSILON_DEG = 1e-6

function isValidLngLat(coord) {
  return (
    Array.isArray(coord) &&
    coord.length >= 2 &&
    Number.isFinite(Number(coord[0])) &&
    Number.isFinite(Number(coord[1]))
  )
}

function normalizeLngLat(coord) {
  return [Number(coord[0]), Number(coord[1])]
}

export function areCoordsEqual(a, b) {
  if (!isValidLngLat(a) || !isValidLngLat(b)) return false
  return (
    Math.abs(Number(a[0]) - Number(b[0])) <= COORD_EPSILON_DEG &&
    Math.abs(Number(a[1]) - Number(b[1])) <= COORD_EPSILON_DEG
  )
}

export function distanceMetersLngLat(a, b) {
  if (!isValidLngLat(a) || !isValidLngLat(b)) return 0
  if (areCoordsEqual(a, b)) return 0
  const km = calculateDistanceKm(Number(a[1]), Number(a[0]), Number(b[1]), Number(b[0]))
  return Number.isFinite(km) ? km * 1000 : 0
}

function findNearestCoordOnPolyline(polyline, target) {
  if (!Array.isArray(polyline) || polyline.length === 0 || !isValidLngLat(target)) {
    return null
  }
  let bestCoord = polyline[0]
  let bestDist = distanceMetersLngLat(polyline[0], target)
  let bestIndex = 0

  for (let i = 1; i < polyline.length; i += 1) {
    const d = distanceMetersLngLat(polyline[i], target)
    if (d < bestDist) {
      bestDist = d
      bestCoord = polyline[i]
      bestIndex = i
    }
  }

  return { coord: bestCoord, distanceMeters: bestDist, index: bestIndex }
}

function dedupeSequentialCoords(coords) {
  const result = []
  for (const raw of coords) {
    if (!isValidLngLat(raw)) continue
    const pt = normalizeLngLat(raw)
    if (result.length === 0 || !areCoordsEqual(result[result.length - 1], pt)) {
      result.push(pt)
    }
  }
  return result
}

/**
 * Menghubungkan polyline hasil routing API (yang berhenti di pinggir jalan / road-snapped)
 * ke koordinat asli origin & pin tujuan wisata:
 * - Selisih <= 12m: titik asli langsung disambung ke polyline biru padat.
 * - Selisih > 12m (mis. destinasi di dalam taman seperti Taman Meksiko):
 *   polyline padat berhenti di tepi jalan dan disambung garis putus-putus biru
 *   (last-mile walking connector) tepat menuju koordinat pin asli.
 */
export function buildConnectedRouteGeometry(rawRoadCoords, waypointsLngLat = []) {
  const cleanWaypoints = dedupeSequentialCoords(waypointsLngLat)
  const cleanRoad = dedupeSequentialCoords(rawRoadCoords)

  if (cleanRoad.length < 2) {
    const fallback = cleanWaypoints.length >= 2 ? cleanWaypoints : cleanRoad
    return {
      roadCoords: fallback,
      originConnector: null,
      destConnector: null,
      intermediateConnectors: [],
      fullPathCoords: fallback,
    }
  }

  if (cleanWaypoints.length < 2) {
    return {
      roadCoords: cleanRoad,
      originConnector: null,
      destConnector: null,
      intermediateConnectors: [],
      fullPathCoords: cleanRoad,
    }
  }

  const roadCoords = [...cleanRoad]
  const exactOrigin = cleanWaypoints[0]
  const exactDest = cleanWaypoints[cleanWaypoints.length - 1]

  let originConnector = null
  let destConnector = null
  const intermediateConnectors = []

  // 1. Sambungkan pangkal rute ke koordinat origin (user / titik awal) asli
  const startGapMeters = distanceMetersLngLat(exactOrigin, roadCoords[0])
  if (startGapMeters > LAST_MILE_DASH_THRESHOLD_METERS) {
    originConnector = [exactOrigin, roadCoords[0]]
  } else if (!areCoordsEqual(exactOrigin, roadCoords[0])) {
    roadCoords.unshift(exactOrigin)
  }

  // 2. Sambungkan ujung akhir rute ke koordinat pin destinasi asli
  const endGapMeters = distanceMetersLngLat(roadCoords[roadCoords.length - 1], exactDest)
  if (endGapMeters > LAST_MILE_DASH_THRESHOLD_METERS) {
    destConnector = [roadCoords[roadCoords.length - 1], exactDest]
  } else if (!areCoordsEqual(roadCoords[roadCoords.length - 1], exactDest)) {
    roadCoords.push(exactDest)
  }

  // 3. Untuk rute custom multi-titik, sambungkan juga pin transit yang berada di luar badan jalan
  if (cleanWaypoints.length > 2) {
    for (let i = 1; i < cleanWaypoints.length - 1; i += 1) {
      const stopCoord = cleanWaypoints[i]
      const nearest = findNearestCoordOnPolyline(roadCoords, stopCoord)
      if (nearest && nearest.distanceMeters > LAST_MILE_DASH_THRESHOLD_METERS) {
        intermediateConnectors.push([nearest.coord, stopCoord])
      }
    }
  }

  // Jalur kontinu lengkap (exactOrigin -> road -> exactDest) untuk fitBounds & ikon peluncur rute
  const fullPathCoords = dedupeSequentialCoords([
    exactOrigin,
    ...roadCoords,
    exactDest,
  ])

  return {
    roadCoords,
    originConnector,
    destConnector,
    intermediateConnectors,
    fullPathCoords,
  }
}

/** Hitung jarak kumulatif tiap titik agar animasi garis meluncur konstan tanpa tersendat. */
export function buildCumulativePath(coords) {
  if (!Array.isArray(coords) || coords.length === 0) {
    return { coords: [], cumDist: [], totalDist: 0 }
  }
  const cumDist = [0]
  let running = 0
  for (let i = 1; i < coords.length; i += 1) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const seg = Math.hypot(lng2 - lng1, lat2 - lat1)
    running += seg
    cumDist.push(running)
  }
  return { coords, cumDist, totalDist: running }
}

export function sliceCoordsAtProgress(pathData, progress) {
  const { coords, cumDist, totalDist } = pathData
  if (coords.length <= 2 || totalDist <= 0 || progress >= 1) {
    return coords
  }
  if (progress <= 0) {
    return [coords[0], coords[0]]
  }

  const targetDist = totalDist * progress
  const sliced = [coords[0]]

  for (let i = 1; i < coords.length; i += 1) {
    if (cumDist[i] <= targetDist) {
      sliced.push(coords[i])
    } else {
      const prevDist = cumDist[i - 1]
      const segDist = cumDist[i] - prevDist
      const frac = segDist > 0 ? (targetDist - prevDist) / segDist : 0
      const [lng1, lat1] = coords[i - 1]
      const [lng2, lat2] = coords[i]
      sliced.push([lng1 + (lng2 - lng1) * frac, lat1 + (lat2 - lat1) * frac])
      break
    }
  }

  return sliced.length >= 2 ? sliced : [coords[0], coords[0]]
}

export function sliceTwoPointSegment(segment, progress) {
  if (!Array.isArray(segment) || segment.length < 2) return null
  const clamped = Math.min(1, Math.max(0, progress))
  if (clamped <= 0) return null
  if (clamped >= 1) return segment
  const [lng1, lat1] = segment[0]
  const [lng2, lat2] = segment[1]
  return [
    [lng1, lat1],
    [lng1 + (lng2 - lng1) * clamped, lat1 + (lat2 - lat1) * clamped],
  ]
}

export function samplePointAndBearing(pathData, progress) {
  const { coords, cumDist, totalDist } = pathData
  if (!coords || coords.length === 0) return null
  if (coords.length === 1 || totalDist <= 0) {
    return { lngLat: coords[0], bearingDeg: 0 }
  }

  const clamped = Math.min(1, Math.max(0, progress))
  const targetDist = totalDist * clamped

  for (let i = 1; i < coords.length; i += 1) {
    if (cumDist[i] >= targetDist || i === coords.length - 1) {
      const prevDist = cumDist[i - 1]
      const segDist = cumDist[i] - prevDist
      const frac = segDist > 0 ? Math.min(1, Math.max(0, (targetDist - prevDist) / segDist)) : 0
      const [lng1, lat1] = coords[i - 1]
      const [lng2, lat2] = coords[i]
      const lng = lng1 + (lng2 - lng1) * frac
      const lat = lat1 + (lat2 - lat1) * frac
      const bearingDeg = Math.atan2(lng2 - lng1, lat2 - lat1) * (180 / Math.PI)
      return { lngLat: [lng, lat], bearingDeg }
    }
  }

  return { lngLat: coords[coords.length - 1], bearingDeg: 0 }
}
