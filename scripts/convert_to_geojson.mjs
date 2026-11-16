import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CSV_PATH = path.join(ROOT, 'scripts', 'raw_wisata_axel.csv')
const BOUNDARY_PATH = path.join(ROOT, 'backend', 'database', 'data', 'bogor_boundary.geojson')
const OUT_GEOJSON = path.join(ROOT, 'backend', 'database', 'data', 'tourist_spots.geojson')
const OUT_REPORT = path.join(ROOT, 'scripts', 'laporan_seleksi_data.csv')

// 1. Parser CSV standar (mendukung tanda kutip dan koma di dalam kolom)
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field.trim())
      field = ''
    } else if (ch === '\r' && next === '\n') {
      row.push(field.trim())
      rows.push(row)
      row = []
      field = ''
      i++
    } else if (ch === '\n' || ch === '\r') {
      row.push(field.trim())
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim())
    rows.push(row)
  }
  return rows
}

// 2. Normalisasi koordinat (memperbaiki format Excel tanpa titik desimal seperti -6605556 -> -6.605556)
function parseCoordinate(raw, isLat) {
  if (!raw || raw === '-' || raw === 'null') return null
  const cleaned = raw.replace(/\s+/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null

  let num = Number(cleaned)
  if (Number.isNaN(num)) return null

  if (isLat && Math.abs(num) > 90) {
    // Contoh: -6605556 -> -6.605556
    const sign = num < 0 ? '-' : ''
    const digits = cleaned.replace('-', '').replace('.', '')
    num = Number(`${sign}${digits.slice(0, 1)}.${digits.slice(1)}`)
  } else if (!isLat && Math.abs(num) > 180) {
    // Contoh: 106804194 -> 106.804194
    const digits = cleaned.replace('.', '')
    num = Number(`${digits.slice(0, 3)}.${digits.slice(3)}`)
  }

  // Validasi rentang geografis kasar Jabodetabek/Bogor
  if (isLat && (num < -7.2 || num > -6.0)) return null
  if (!isLat && (num < 106.2 || num > 107.2)) return null
  return Number(num.toFixed(7))
}

// 3. Point-in-Polygon (Ray Casting) terhadap batas resmi Kota Bogor
function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function isInsideKotaBogor(lon, lat, boundaryGeo) {
  for (const feature of boundaryGeo.features ?? []) {
    const geom = feature.geometry
    if (!geom) continue
    if (geom.type === 'Polygon') {
      if (pointInRing(lon, lat, geom.coordinates[0])) return true
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        if (pointInRing(lon, lat, poly[0])) return true
      }
    }
  }
  return false
}

// 4. Mapping kategori ke 3 kategori standar aplikasi
function mapCategory(rawCategory) {
  const c = (rawCategory || '').trim()
  if (['Wisata Alam', 'Ruang Publik', 'Rekreasi Keluarga', 'Agrowisata', 'Alam & Curug'].includes(c)) {
    return 'Alam & Curug'
  }
  if (['Kuliner', 'Belanja', 'Sentra Kuliner'].includes(c)) {
    return 'Kuliner'
  }
  return 'Edukasi & Budaya'
}

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function formatHours(open, close) {
  const o = open && open !== '-' ? open.replace(/:00$/, '') : ''
  const c = close && close !== '-' ? close.replace(/:00$/, '') : ''
  if (o.toLowerCase() === '24 jam') return '24 Jam'
  if (o && c) return `${o} - ${c}`
  if (o) return `Mulai ${o}`
  return 'Jam operasional belum tersedia'
}

// Muat boundary & geojson lama (untuk mempertahankan foto lokal jika slug cocok)
const boundaryGeo = JSON.parse(fs.readFileSync(BOUNDARY_PATH, 'utf8'))
const existingBySlug = new Map()
if (fs.existsSync(OUT_GEOJSON)) {
  const existing = JSON.parse(fs.readFileSync(OUT_GEOJSON, 'utf8'))
  for (const f of existing.features ?? []) {
    if (f.properties?.slug) existingBySlug.set(f.properties.slug, f.properties)
  }
}

const rawText = fs.readFileSync(CSV_PATH, 'utf8')
const rows = parseCsv(rawText)
const headers = rows[0]
const idx = Object.fromEntries(headers.map((h, i) => [h, i]))

const validFeatures = []
const reportRows = [['No', 'Nama Objek Wisata', 'Kategori Asli', 'Status', 'Alasan']]
const seenSlugs = new Set()

for (let r = 1; r < rows.length; r++) {
  const cols = rows[r]
  const name = cols[idx['Nama Objek Wisata']] || ''
  const rawCat = cols[idx['Kategori']] || ''
  if (!name || name === 'Field' || name === 'Sumber' || name === 'Kategori') break

  const kota = (cols[idx['Kota']] || '').toLowerCase()
  const lat = parseCoordinate(cols[idx['Latitude']], true)
  const lon = parseCoordinate(cols[idx['Longitude']], false)
  const address = cols[idx['Alamat Lengkap']] || ''
  const kel = cols[idx['Kelurahan']] || ''
  const kec = cols[idx['Kecamatan']] || ''
  const fullAddress = address || [kel, kec, 'Kota Bogor'].filter(Boolean).join(', ')

  let rejectReason = ''
  if (kota.includes('kabupaten')) {
    rejectReason = 'Di luar scope wilayah (Kabupaten Bogor)'
  } else if (lat === null || lon === null) {
    rejectReason = 'Koordinat Latitude/Longitude kosong atau tidak valid'
  } else if (!isInsideKotaBogor(lon, lat, boundaryGeo)) {
    rejectReason = 'Titik koordinat berada di luar batas poligon Kota Bogor'
  } else if (!address && !kel && !kec) {
    rejectReason = 'Informasi lokasi/alamat tidak lengkap'
  }

  const slug = toSlug(name)
  if (!rejectReason && seenSlugs.has(slug)) {
    rejectReason = 'Duplikat nama objek wisata'
  }

  if (rejectReason) {
    reportRows.push([r, name, rawCat, 'DITOLAK', rejectReason])
    continue
  }

  seenSlugs.add(slug)
  const prev = existingBySlug.get(slug)
  const category = mapCategory(rawCat)
  const desc = cols[idx['Deskripsi Ringkas']] || prev?.description || `${name} merupakan destinasi ${rawCat.toLowerCase()} di ${kec || 'Kota Bogor'}.`
  const open = cols[idx['Jam Buka']] || ''
  const close = cols[idx['Jam Tutup']] || ''
  const htm = cols[idx['HTM Lokal']] || prev?.ticket_price || 'Gratis / Cek lokasi'

  validFeatures.push({
    type: 'Feature',
    properties: {
      id: validFeatures.length + 1,
      slug,
      name,
      category,
      description: desc,
      detailed_description: prev?.detailed_description || desc,
      address: fullAddress,
      rating: prev?.rating ?? 4.5,
      operational_hours: formatHours(open, close),
      ticket_price: htm,
      image: prev?.image || '/images/spots/kebun-raya-bogor.jpg',
      gallery: prev?.gallery || ['/images/spots/kebun-raya-bogor.jpg'],
      latitude: lat,
      longitude: lon,
      is_popular: prev?.is_popular ?? (validFeatures.length < 5),
    },
    geometry: {
      type: 'Point',
      coordinates: [lon, lat],
    },
  })

  reportRows.push([r, name, rawCat, 'LAYAK', `Lolos seleksi -> ${category} (${lat}, ${lon})`])
}

const outGeoJson = {
  type: 'FeatureCollection',
  name: 'tourist_spots',
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  features: validFeatures,
}

fs.writeFileSync(OUT_GEOJSON, JSON.stringify(outGeoJson, null, 2), 'utf8')
fs.writeFileSync(
  OUT_REPORT,
  reportRows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'),
  'utf8',
)

console.log(`Total baris diproses : ${reportRows.length - 1}`)
console.log(`Layak (GeoJSON)      : ${validFeatures.length}`)
console.log(`Ditolak              : ${reportRows.length - 1 - validFeatures.length}`)
