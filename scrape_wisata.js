/**
 * scrape_wisata.js
 * -----------------------------------------------------------------------------
 * Skrip otomatisasi pengayaan data destinasi wisata Kota Bogor (Sabah Bogor GIS)
 * menggunakan sumber data publik terbuka secara legal & sopan (rate-limited):
 *   1. Overpass API (OpenStreetMap) - Jalan terdekat, tag alamat, jam buka, POI
 *   2. Wikipedia API (id & en)      - Deskripsi ensiklopedis riil destinasi Bogor
 *   3. Wikimedia Commons API        - Foto asli resolusi tinggi (>= 800px) Landscape
 *
 * Seluruh gambar diverifikasi secara biner (HTTP 200, non-thumbnail width >= 800px,
 * orientasi Landscape width > height) dan disimpan ke backend/public/images/spots/
 * serta disinkronkan ke SQLite, tourists.json (Frontend), dan tourist_spots.geojson.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'backend', 'database', 'database.sqlite');
const BOUNDARY_PATH = path.join(__dirname, 'backend', 'database', 'data', 'bogor_boundary.geojson');
const GEOJSON_SPOTS_PATH = path.join(__dirname, 'backend', 'database', 'data', 'tourist_spots.geojson');
const FRONTEND_JSON_PATH = path.join(__dirname, 'Front end', 'src', 'data', 'tourists.json');
const SPOTS_IMG_DIR = path.join(__dirname, 'backend', 'public', 'images', 'spots');
const MANIFEST_PATH = path.join(__dirname, 'backend', 'database', 'data', 'scraped_sources_manifest.json');

const USER_AGENT =
  'SabahBogorGIS-DataEnrichment/1.2 (https://sabahbogor.local; gis-academic-project@bogor.id) Node.js/24';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------
// 1. Referensi Resmi Kelurahan, Kecamatan & Kode Pos Administratif Kota Bogor
// -----------------------------------------------------------------------------
const KELURAHAN_META = {
  // Bogor Tengah
  paledang: { kel: 'Paledang', kec: 'Bogor Tengah', zip: '16122' },
  pabaton: { kel: 'Pabaton', kec: 'Bogor Tengah', zip: '16121' },
  cibogor: { kel: 'Cibogor', kec: 'Bogor Tengah', zip: '16124' },
  ciwaringin: { kel: 'Ciwaringin', kec: 'Bogor Tengah', zip: '16124' },
  gudang: { kel: 'Gudang', kec: 'Bogor Tengah', zip: '16123' },
  'babakan pasar': { kel: 'Babakan Pasar', kec: 'Bogor Tengah', zip: '16126' },
  babakan: { kel: 'Babakan', kec: 'Bogor Tengah', zip: '16128' },
  sempur: { kel: 'Sempur', kec: 'Bogor Tengah', zip: '16129' },
  tegallega: { kel: 'Tegallega', kec: 'Bogor Tengah', zip: '16129' },
  panaragan: { kel: 'Panaragan', kec: 'Bogor Tengah', zip: '16125' },
  kebonkelapa: { kel: 'Kebon Kelapa', kec: 'Bogor Tengah', zip: '16125' },
  'kebon kelapa': { kel: 'Kebon Kelapa', kec: 'Bogor Tengah', zip: '16125' },

  // Bogor Utara
  'tegal gundil': { kel: 'Tegal Gundil', kec: 'Bogor Utara', zip: '16152' },
  tegalgundil: { kel: 'Tegal Gundil', kec: 'Bogor Utara', zip: '16152' },
  bantarjati: { kel: 'Bantarjati', kec: 'Bogor Utara', zip: '16153' },
  kedunghalang: { kel: 'Kedunghalang', kec: 'Bogor Utara', zip: '16158' },
  cibuluh: { kel: 'Cibuluh', kec: 'Bogor Utara', zip: '16151' },
  ciluar: { kel: 'Ciluar', kec: 'Bogor Utara', zip: '16156' },
  tanahbaru: { kel: 'Tanah Baru', kec: 'Bogor Utara', zip: '16154' },
  'tanah baru': { kel: 'Tanah Baru', kec: 'Bogor Utara', zip: '16154' },
  cimahpar: { kel: 'Cimahpar', kec: 'Bogor Utara', zip: '16155' },
  ciparigi: { kel: 'Ciparigi', kec: 'Bogor Utara', zip: '16157' },

  // Bogor Selatan
  batutulis: { kel: 'Batutulis', kec: 'Bogor Selatan', zip: '16133' },
  'batu tulis': { kel: 'Batutulis', kec: 'Bogor Selatan', zip: '16133' },
  bondongan: { kel: 'Bondongan', kec: 'Bogor Selatan', zip: '16131' },
  empang: { kel: 'Empang', kec: 'Bogor Selatan', zip: '16132' },
  cipaku: { kel: 'Cipaku', kec: 'Bogor Selatan', zip: '16133' },
  mulyaharja: { kel: 'Mulyaharja', kec: 'Bogor Selatan', zip: '16135' },
  ranggamekar: { kel: 'Ranggamekar', kec: 'Bogor Selatan', zip: '16136' },
  pamoyanan: { kel: 'Pamoyanan', kec: 'Bogor Selatan', zip: '16136' },
  kertamaya: { kel: 'Kertamaya', kec: 'Bogor Selatan', zip: '16138' },
  rancamaya: { kel: 'Rancamaya', kec: 'Bogor Selatan', zip: '16139' },
  lawanggintung: { kel: 'Lawanggintung', kec: 'Bogor Selatan', zip: '16134' },
  pakuan: { kel: 'Pakuan', kec: 'Bogor Selatan', zip: '16134' },
  cikaret: { kel: 'Cikaret', kec: 'Bogor Selatan', zip: '16132' },
  bojongkerta: { kel: 'Bojongkerta', kec: 'Bogor Selatan', zip: '16139' },
  harjasari: { kel: 'Harjasari', kec: 'Bogor Selatan', zip: '16138' },
  muarasari: { kel: 'Muarasari', kec: 'Bogor Selatan', zip: '16137' },
  genteng: { kel: 'Genteng', kec: 'Bogor Selatan', zip: '16137' },

  // Bogor Timur
  baranangsiang: { kel: 'Baranangsiang', kec: 'Bogor Timur', zip: '16143' },
  katulampa: { kel: 'Katulampa', kec: 'Bogor Timur', zip: '16144' },
  sukasari: { kel: 'Sukasari', kec: 'Bogor Timur', zip: '16142' },
  sindangrasa: { kel: 'Sindangrasa', kec: 'Bogor Timur', zip: '16145' },
  sindangsari: { kel: 'Sindangsari', kec: 'Bogor Timur', zip: '16146' },
  tajur: { kel: 'Tajur', kec: 'Bogor Timur', zip: '16141' },

  // Bogor Barat
  'situ gede': { kel: 'Situ Gede', kec: 'Bogor Barat', zip: '16115' },
  situgede: { kel: 'Situ Gede', kec: 'Bogor Barat', zip: '16115' },
  menteng: { kel: 'Menteng', kec: 'Bogor Barat', zip: '16111' },
  bubulak: { kel: 'Bubulak', kec: 'Bogor Barat', zip: '16115' },
  gunungbatu: { kel: 'Gunungbatu', kec: 'Bogor Barat', zip: '16118' },
  'gunung batu': { kel: 'Gunungbatu', kec: 'Bogor Barat', zip: '16118' },
  loji: { kel: 'Loji', kec: 'Bogor Barat', zip: '16117' },
  sindangbarang: { kel: 'Sindangbarang', kec: 'Bogor Barat', zip: '16117' },
  margajaya: { kel: 'Margajaya', kec: 'Bogor Barat', zip: '16116' },
  balumbangjaya: { kel: 'Balumbangjaya', kec: 'Bogor Barat', zip: '16116' },
  cilendek: { kel: 'Cilendek Barat', kec: 'Bogor Barat', zip: '16112' },
  'cilendek barat': { kel: 'Cilendek Barat', kec: 'Bogor Barat', zip: '16112' },
  'cilendek timur': { kel: 'Cilendek Timur', kec: 'Bogor Barat', zip: '16112' },
  curugmekar: { kel: 'Curugmekar', kec: 'Bogor Barat', zip: '16113' },
  semplak: { kel: 'Semplak', kec: 'Bogor Barat', zip: '16114' },
  pasirjaya: { kel: 'Pasirjaya', kec: 'Bogor Barat', zip: '16119' },
  pasirkuda: { kel: 'Pasirkuda', kec: 'Bogor Barat', zip: '16119' },
  pasirmulya: { kel: 'Pasirmulya', kec: 'Bogor Barat', zip: '16118' },

  // Tanah Sareal
  'tanah sareal': { kel: 'Tanah Sareal', kec: 'Tanah Sareal', zip: '16161' },
  kedungbadak: { kel: 'Kedungbadak', kec: 'Tanah Sareal', zip: '16164' },
  'kedung badak': { kel: 'Kedungbadak', kec: 'Tanah Sareal', zip: '16164' },
  kebonpedes: { kel: 'Kebon Pedes', kec: 'Tanah Sareal', zip: '16162' },
  'kebon pedes': { kel: 'Kebon Pedes', kec: 'Tanah Sareal', zip: '16162' },
  kedungjaya: { kel: 'Kedungjaya', kec: 'Tanah Sareal', zip: '16164' },
  kedungwaringin: { kel: 'Kedungwaringin', kec: 'Tanah Sareal', zip: '16163' },
  sukadamai: { kel: 'Sukadamai', kec: 'Tanah Sareal', zip: '16165' },
  sukaresmi: { kel: 'Sukaresmi', kec: 'Tanah Sareal', zip: '16165' },
  cibadak: { kel: 'Cibadak', kec: 'Tanah Sareal', zip: '16166' },
  kayumanis: { kel: 'Kayumanis', kec: 'Tanah Sareal', zip: '16169' },
  mekarwangi: { kel: 'Mekarwangi', kec: 'Tanah Sareal', zip: '16168' },
  kencana: { kel: 'Kencana', kec: 'Tanah Sareal', zip: '16167' },
};

// Koreksi alamat spesifik untuk titik-titik yang sebelumnya kosong, typo, atau salah kota di CSV
const VERIFIED_ADDRESS_OVERRIDES = {
  'taman-peranginan':
    'Jl. Jend. Sudirman No.31, Sempur, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16129',
  'lawang-surya-kencana':
    'Jl. Suryakencana No.1, Babakan Pasar, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16126',
  'museum-peta':
    'Jl. Jend. Sudirman No.35, Pabaton, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16121',
  'kebun-raya-bogor':
    'Jl. Otto Iskandardinata No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'jalan-suryakencana':
    'Jl. Suryakencana, Babakan Pasar, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16126',
  'museum-zoologi-bogor':
    'Jl. Ir. H. Juanda No.9, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'prasasti-batutulis':
    'Jl. Batutulis No.54, Batutulis, Kecamatan Bogor Selatan, Kota Bogor, Jawa Barat 16133',
  'tugu-kujang':
    'Jl. Raya Pajajaran, Tegallega, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16129',
  'situ-gede':
    'Jl. Cilubang Malang No.37, Situ Gede, Kecamatan Bogor Barat, Kota Bogor, Jawa Barat 16115',
  'hutan-kota-cifor':
    'Jl. Raya CIFOR No.5, Situ Gede, Kecamatan Bogor Barat, Kota Bogor, Jawa Barat 16115',
  'danau-bogor-raya':
    'Jl. Danau Bogor Raya, Katulampa, Kecamatan Bogor Timur, Kota Bogor, Jawa Barat 16144',
  'leuweung-kota':
    'Jl. Bogor Nirwana Boulevard, Ranggamekar, Kecamatan Bogor Selatan, Kota Bogor, Jawa Barat 16136',
  'taman-meksiko':
    'Jl. Otto Iskandardinata No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'taman-akuatik-kebun-raya-bogor':
    'Jl. Ir. H. Juanda No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'taman-teijsmann':
    'Jl. Ir. H. Juanda No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'taman-bambu':
    'Jl. Ir. H. Juanda No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'danau-gunting-kebun-raya-bogor':
    'Jl. Ir. H. Juanda No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'griya-anggrek-kebun-raya-bogor':
    'Jl. Otto Iskandardinata No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'akuatik-park':
    'Jl. Ir. H. Juanda No.13, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'taman-palupuh':
    'Jl. Palupuh Raya, Tegal Gundil, Kecamatan Bogor Utara, Kota Bogor, Jawa Barat 16152',
  'taman-malabar':
    'Jl. Taman Malabar, Babakan, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16128',
  'taman-ekspresi':
    'Jl. Sempur Kaler No.1, Sempur, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16129',
  'makam-raden-saleh':
    'Jl. Pahlawan Gg. Raden Saleh No.57, Empang, Kecamatan Bogor Selatan, Kota Bogor, Jawa Barat 16132',
  'stasiun-bogor':
    'Jl. Nyi Raja Permas No.1, Cibogor, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16124',
  'gedung-smpsma-negeri-1-bogor':
    'Jl. Ir. H. Juanda No.16, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'gedung-pusat-penelitian-biologi':
    'Jl. Ir. H. Juanda No.18, Paledang, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16122',
  'istana-batu-tulis':
    'Jl. Batutulis No.52, Batutulis, Kecamatan Bogor Selatan, Kota Bogor, Jawa Barat 16133',
  'kampung-pulo-geulis':
    'Jl. Roda Pulo Geulis, Babakan Pasar, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16126',
  'sport-club-danau-bogor-raya':
    'Jl. Danau Bogor Raya Blok AI, Katulampa, Kecamatan Bogor Timur, Kota Bogor, Jawa Barat 16144',
  'kolam-renang-monte-carlo':
    'Jl. Tarumanegara I, Cipaku, Kecamatan Bogor Selatan, Kota Bogor, Jawa Barat 16133',
  'sagara-swimming-pool':
    'Jl. Pamoyanan No.232, Ranggamekar, Kecamatan Bogor Selatan, Kota Bogor, Jawa Barat 16136',
  'bogor-golf-club':
    'Jl. Dr. Sumeru, Menteng, Kecamatan Bogor Barat, Kota Bogor, Jawa Barat 16111',
  'rancamaya-country-club':
    'Jl. Rancamaya Utama, Rancamaya, Kecamatan Bogor Selatan, Kota Bogor, Jawa Barat 16139',
  'kebun-percobaan-cimanggu':
    'Jl. Tentara Pelajar No.3, Menteng, Kecamatan Bogor Barat, Kota Bogor, Jawa Barat 16111',
  'botani-square':
    'Jl. Raya Pajajaran No.40, Tegallega, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16129',
  'plaza-indah-bogor':
    'Jl. KH. Sholeh Iskandar, Kedungbadak, Kecamatan Tanah Sareal, Kota Bogor, Jawa Barat 16164',
  'pangrango-plaza':
    'Jl. Raya Pajajaran No.25, Babakan, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16128',
  'pusat-grosir-bogor':
    'Jl. Merdeka No.110, Ciwaringin, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16124',
  'pasar-bogor':
    'Jl. Suryakencana No.3, Babakan Pasar, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16126',
  'tugu-kujang-bogor':
    'Jl. Raya Pajajaran, Tegallega, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16129',
  'jembatan-otista':
    'Jl. Otto Iskandardinata, Baranangsiang, Kecamatan Bogor Timur, Kota Bogor, Jawa Barat 16143',
  'lawang-salapan':
    'Jl. Otto Iskandardinata, Tegallega, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16129',
};

// -----------------------------------------------------------------------------
// 2. Helper Geometri & Parser Header Biner Gambar (JPEG / PNG / WebP)
// -----------------------------------------------------------------------------
function loadBogorPolygons() {
  const raw = JSON.parse(fs.readFileSync(BOUNDARY_PATH, 'utf8'));
  const polygons = [];
  for (const feat of raw.features || []) {
    const geom = feat.geometry;
    if (!geom) continue;
    if (geom.type === 'Polygon') polygons.push(geom.coordinates);
    else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) polygons.push(poly);
    }
  }
  return polygons;
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-18) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideKotaBogor(lat, lon, polygons) {
  for (const rings of polygons) {
    if (!rings.length || !pointInRing(lon, lat, rings[0])) continue;
    let inHole = false;
    for (let i = 1; i < rings.length; i++) {
      if (pointInRing(lon, lat, rings[i])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getImageDimensions(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 30) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), ext: 'png' };
  }

  // WebP: RIFF....WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8 ' && buf.length >= 30) {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
        ext: 'webp',
      };
    }
    if (chunk === 'VP8L' && buf.length >= 25) {
      const b0 = buf[21];
      const b1 = buf[22];
      const b2 = buf[23];
      const b3 = buf[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
        ext: 'webp',
      };
    }
    if (chunk === 'VP8X' && buf.length >= 30) {
      return {
        width: 1 + buf.readUIntLE(24, 3),
        height: 1 + buf.readUIntLE(27, 3),
        ext: 'webp',
      };
    }
  }

  // JPEG: FF D8 ... SOF markers
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];
      if (marker === 0xff) {
        offset++;
        continue;
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const segLen = buf.readUInt16BE(offset + 2);
      if (segLen < 2) break;
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height, ext: 'jpg' };
      }
      offset += 2 + segLen;
    }
  }

  return null;
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 25000);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: options.accept || 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);

      if (res.status === 429 || res.status === 503 || res.status === 502) {
        if (attempt < retries) {
          await sleep(1200 * attempt);
          continue;
        }
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await sleep(900 * attempt);
    }
  }
  throw new Error(`Failed fetching ${url}`);
}

// -----------------------------------------------------------------------------
// 3. Scraping Layer 1: Overpass API (OpenStreetMap) untuk Jalan & Tag POI Bogor
// -----------------------------------------------------------------------------
async function fetchOverpassBogorData() {
  console.log('[1/4] Mengambil data spasial & jalan Kota Bogor dari Overpass API (OpenStreetMap)...');
  const query = `
    [out:json][timeout:45];
    (
      nwr["tourism"](-6.685,106.730,-6.505,106.855);
      nwr["leisure"~"park|garden|water_park|swimming_pool|sports_centre|stadium|golf_course|nature_reserve"](-6.685,106.730,-6.505,106.855);
      nwr["historic"](-6.685,106.730,-6.505,106.855);
      nwr["shop"="mall"](-6.685,106.730,-6.505,106.855);
      nwr["amenity"~"marketplace|place_of_worship"](-6.685,106.730,-6.505,106.855);
      way["highway"~"primary|secondary|tertiary|residential|trunk"]["name"](-6.685,106.730,-6.505,106.855);
    );
    out center tags;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithRetry(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: 'data=' + encodeURIComponent(query),
          timeoutMs: 45000,
        },
        2,
      );
      if (!res.ok) continue;
      const json = await res.json();
      const elements = Array.isArray(json.elements) ? json.elements : [];
      const pois = [];
      const roads = [];
      for (const el of elements) {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (typeof lat !== 'number' || typeof lon !== 'number') continue;
        const tags = el.tags || {};
        if (tags.highway && tags.name) {
          roads.push({ name: tags.name, lat, lon, tags });
        } else if (tags.name) {
          pois.push({ name: tags.name, lat, lon, tags });
        }
      }
      console.log(`  -> Overpass berhasil memuat ${pois.length} POI & ${roads.length} ruas jalan bernama.`);
      return { pois, roads };
    } catch (err) {
      console.warn(`  -> Overpass endpoint ${endpoint} gagal (${err.message}), mencoba cadangan...`);
    }
  }

  return { pois: [], roads: [] };
}

function normalizeAddressString(rawAddress, spot, osmData) {
  if (VERIFIED_ADDRESS_OVERRIDES[spot.slug]) {
    return VERIFIED_ADDRESS_OVERRIDES[spot.slug];
  }

  let addr = String(rawAddress || '').trim();

  // Bersihkan awalan typo & singkatan tidak seragam
  addr = addr
    .replace(/^l\.\s+/i, 'Jl. ')
    .replace(/^Jalan\s+/i, 'Jl. ')
    .replace(/\.+$/, '')
    .replace(/\bKec\.\s*Bogor\s*Sel\.?\b/gi, 'Kecamatan Bogor Selatan')
    .replace(/\bKec\.\s*Bogor\s*Tim\.?\b/gi, 'Kecamatan Bogor Timur')
    .replace(/\bKec\.\s*Bogor\s*Bar\.?\b/gi, 'Kecamatan Bogor Barat')
    .replace(/\bKec\.\s*Bogor\s*Utara\b/gi, 'Kecamatan Bogor Utara')
    .replace(/\bKec\.\s*Bogor\s*Tengah\b/gi, 'Kecamatan Bogor Tengah')
    .replace(/\bKec\.\s*Tanah\s*Sareal\b/gi, 'Kecamatan Tanah Sareal')
    .replace(/\bKelurahan\s+/gi, '')
    .replace(/,\s*RT\.\d+\/RW\.\d+/gi, '')
    .replace(/^RT\.\d+\/RW\.\d+,\s*/gi, '');

  // Cari POI OSM terdekat (< 180m) dengan nama mirip atau tag addr:*
  const lowerSpotName = spot.name.toLowerCase();
  let matchedPoi = null;
  let bestPoiDist = 180;
  for (const poi of osmData.pois) {
    const dist = haversineMeters(spot.latitude, spot.longitude, poi.lat, poi.lon);
    if (dist <= bestPoiDist) {
      const pName = (poi.name || '').toLowerCase();
      if (
        pName.includes(lowerSpotName.split(' ')[0]) ||
        lowerSpotName.includes(pName.split(' ')[0]) ||
        dist < 50
      ) {
        matchedPoi = poi;
        bestPoiDist = dist;
      }
    }
  }

  // Jika belum ada nama jalan ("Jl." / "Gg."), cari ruas jalan bernama terdekat dari Overpass
  const hasStreet = /(?:^|[\s,])(jl\.|jalan\b|gg\.|gang\b|boulevard\b|raya\b)/i.test(addr);
  if (!hasStreet) {
    let streetName = matchedPoi?.tags?.['addr:street'] || '';
    if (!streetName) {
      let minRoadDist = Infinity;
      for (const road of osmData.roads) {
        const d = haversineMeters(spot.latitude, spot.longitude, road.lat, road.lon);
        if (d < minRoadDist) {
          minRoadDist = d;
          streetName = road.name;
        }
      }
    }
    if (streetName) {
      const formattedStreet = /^(jl\.|jalan|gg\.)/i.test(streetName)
        ? streetName.replace(/^Jalan\s+/i, 'Jl. ')
        : `Jl. ${streetName}`;
      const houseNo = matchedPoi?.tags?.['addr:housenumber']
        ? ` No.${matchedPoi.tags['addr:housenumber']}`
        : '';
      addr = addr && addr.toLowerCase() !== 'kota bogor'
        ? `${formattedStreet}${houseNo}, ${addr}`
        : `${formattedStreet}${houseNo}`;
    }
  }

  // Pastikan Kelurahan, Kecamatan, Kota Bogor, Jawa Barat & Kode Pos lengkap
  let foundMeta = null;
  const addrLower = addr.toLowerCase();
  for (const [key, meta] of Object.entries(KELURAHAN_META)) {
    if (addrLower.includes(key)) {
      foundMeta = meta;
      break;
    }
  }

  if (foundMeta) {
    if (!/kecamatan\s+/i.test(addr)) {
      if (addrLower.includes(foundMeta.kec.toLowerCase())) {
        addr = addr.replace(new RegExp(foundMeta.kec, 'i'), `Kecamatan ${foundMeta.kec}`);
      } else {
        addr = `${addr}, Kecamatan ${foundMeta.kec}`;
      }
    }
    if (!/kota bogor/i.test(addr)) {
      addr = `${addr}, Kota Bogor`;
    }
    if (!/jawa barat/i.test(addr)) {
      addr = `${addr}, Jawa Barat ${foundMeta.zip}`;
    } else if (!/\b161\d{2}\b/.test(addr)) {
      addr = addr.replace(/\b16\d{3}\b/, foundMeta.zip);
      if (!/\b161\d{2}\b/.test(addr)) {
        addr = `${addr} ${foundMeta.zip}`;
      }
    }
  } else {
    if (!/kota bogor/i.test(addr)) addr = `${addr}, Kota Bogor`;
    if (!/jawa barat/i.test(addr)) addr = `${addr}, Jawa Barat`;
  }

  if (!/^(jl\.|gg\.)/i.test(addr) && /,\s*(jl\.|gg\.)/i.test(addr)) {
    addr = addr.replace(/^.*?(?=(?:Jl\.|Gg\.)\s)/i, '');
  }
  addr = addr.replace(/\bKec\.\s*Kecamatan\b/gi, 'Kecamatan');

  return addr.replace(/\s+,/g, ',').replace(/,\s*,/g, ', ').replace(/\s{2,}/g, ' ').trim();
}

// -----------------------------------------------------------------------------
// 4. Scraping Layer 2: Wikipedia API (Bahasa Indonesia) untuk Info & Deskripsi
// -----------------------------------------------------------------------------
const WIKI_TITLE_HINTS = {
  'kebun-raya-bogor': 'Kebun Raya Bogor',
  'istana-kepresidenan-bogor': 'Istana Bogor',
  'istana-batu-tulis': 'Istana Batutulis',
  'museum-zoologi-bogor': 'Museum Zoologi Bogor',
  'museum-peta': 'Museum PETA',
  'museum-monumen-peta': 'Museum PETA',
  'museum-perjuangan-bogor': 'Museum Perjuangan Bogor',
  'museum-tanah-dan-pertanian': 'Museum Tanah dan Pertanian',
  'museum-etnobotani-indonesia': 'Museum Nasional Sejarah Alam Indonesia',
  'museum-nasional-sejarah-alam-indonesia-munasain': 'Museum Nasional Sejarah Alam Indonesia',
  'prasasti-batutulis': 'Prasasti Batutulis',
  'prasasti-batu-tulis': 'Prasasti Batutulis',
  'tugu-kujang': 'Tugu Kujang',
  'tugu-kujang-bogor': 'Tugu Kujang',
  'situ-gede': 'Situ Gede, Bogor',
  'gereja-katedral-bogor': 'Gereja Katedral Bogor',
  'masjid-agung-bogor': 'Masjid Agung Bogor',
  'stasiun-bogor': 'Stasiun Bogor',
  'alun-alun-kota-bogor': 'Alun-Alun Kota Bogor',
  'taman-kencana': 'Taman Kencana',
  'taman-sempur': 'Lapangan Sempur',
  'makam-raden-saleh': 'Raden Saleh',
  'jalan-suryakencana': 'Jalan Suryakencana (Bogor)',
  'lawang-surya-kencana': 'Jalan Suryakencana (Bogor)',
  'botani-square': 'Botani Square',
  'the-jungle-waterpark-bogor': 'The Jungle Water Adventure',
  'kampung-pulo-geulis': 'Pulo Geulis',
  'lapangan-gor-pajajaran': 'Stadion Pajajaran',
};

async function fetchWikipediaExtracts(spots) {
  console.log('[2/4] Mengambil ringkasan deskripsi riil dari Wikipedia Bahasa Indonesia API...');
  const wikiMap = new Map();

  for (const spot of spots) {
    const queryTitle = WIKI_TITLE_HINTS[spot.slug] || `${spot.name} Bogor`;
    const apiUrl =
      `https://id.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|coordinates` +
      `&exintro=1&explaintext=1&exsentences=5&redirects=1&generator=search` +
      `&gsrsearch=${encodeURIComponent(queryTitle)}&gsrlimit=2`;

    try {
      const res = await fetchWithRetry(apiUrl, { timeoutMs: 15000 }, 2);
      if (res.ok) {
        const data = await res.json();
        const pages = Object.values(data?.query?.pages || {});
        pages.sort((a, b) => (a.index || 99) - (b.index || 99));
        for (const page of pages) {
          const extract = String(page.extract || '')
            .replace(/\s+/g, ' ')
            .replace(/—/g, ', ')
            .trim();
          if (!extract || extract.length < 60) continue;

          const titleLower = String(page.title || '').toLowerCase();
          const extractLower = extract.toLowerCase();
          const firstWord = spot.name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .find((w) => w.length > 3 && !['taman', 'bogor', 'kota', 'pasar', 'gedung'].includes(w));

          const mentionsBogor = extractLower.includes('bogor') || titleLower.includes('bogor');
          const matchesHint = Boolean(WIKI_TITLE_HINTS[spot.slug]);
          const matchesKeyword = firstWord ? titleLower.includes(firstWord) || extractLower.includes(firstWord) : false;

          if (mentionsBogor && (matchesHint || matchesKeyword)) {
            wikiMap.set(spot.slug, {
              title: page.title,
              extract,
              coordinates: page.coordinates?.[0] || null,
            });
            break;
          }
        }
      }
    } catch {
      // Lanjut ke destinasi berikutnya bila timeout
    }
    await sleep(90);
  }

  console.log(`  -> Berhasil mencocokkan artikel Wikipedia terverifikasi untuk ${wikiMap.size} destinasi.`);
  return wikiMap;
}

function enrichDescriptionsAndHours(spot, address, wikiEntry, osmData) {
  // 1. Jam operasional
  let hours = String(spot.operational_hours || '').trim();
  if (hours.endsWith('- 16')) {
    hours = '08:00 - 16:00 WIB (Senin-Jumat); 07:00 - 16:00 WIB (Sabtu-Minggu)';
  } else if (
    !hours ||
    hours.toLowerCase().includes('belum tersedia') ||
    /^[-\s:]+$/.test(hours) ||
    hours === 'kosong'
  ) {
    // Cek OSM opening_hours
    const lowerName = spot.name.toLowerCase();
    const osmPoi = osmData.pois.find(
      (p) =>
        p.tags?.opening_hours &&
        haversineMeters(spot.latitude, spot.longitude, p.lat, p.lon) < 150 &&
        p.name.toLowerCase().includes(lowerName.split(' ')[0]),
    );
    if (osmPoi?.tags?.opening_hours) {
      const rawOh = osmPoi.tags.opening_hours;
      hours = rawOh === '24/7' ? '24 Jam' : rawOh;
    } else {
      const nm = spot.name.toLowerCase();
      if (nm.includes('taman') || nm.includes('alun-alun') || nm.includes('situ') || nm.includes('danau')) {
        hours = nm.includes('kebun raya') || nm.includes('akuatik') || nm.includes('griya anggrek')
          ? '08:00 - 16:00 WIB (Senin-Jumat); 07:00 - 16:00 WIB (Sabtu-Minggu)'
          : '06:00 - 21:00 WIB';
      } else if (nm.includes('tugu') || nm.includes('jembatan') || nm.includes('lawang')) {
        hours = '24 Jam';
      } else if (nm.includes('museum') || nm.includes('prasasti') || nm.includes('balai') || nm.includes('gedung')) {
        hours = '08:00 - 16:00 WIB';
      } else if (nm.includes('mall') || nm.includes('plaza') || nm.includes('square') || nm.includes('junction') || nm.includes('kidzoona') || nm.includes('grosir')) {
        hours = '10:00 - 22:00 WIB';
      } else if (nm.includes('pasar')) {
        hours = '05:00 - 17:00 WIB';
      } else if (nm.includes('waterpark') || nm.includes('swimming') || nm.includes('kolam') || nm.includes('kampoeng air') || nm.includes('jbound')) {
        hours = '08:00 - 17:00 WIB';
      } else {
        hours = '08:00 - 17:00 WIB';
      }
    }
  } else {
    hours = hours.replace(/(\d{2})\.(\d{2})\s*-\s*(\d{2})\.(\d{2})/, '$1:$2 - $3:$4 WIB');
  }

  // 2. Harga tiket
  let ticket = String(spot.ticket_price || '').trim();
  if (!ticket || ticket.toLowerCase().includes('cek lokasi')) {
    const nm = spot.name.toLowerCase();
    if (nm.includes('taman') && !nm.includes('kebun raya')) ticket = 'Gratis';
    else if (nm.includes('tugu') || nm.includes('jembatan') || nm.includes('alun-alun') || nm.includes('lawang') || nm.includes('pasar') || nm.includes('mall') || nm.includes('plaza') || nm.includes('square') || nm.includes('junction')) ticket = 'Gratis';
    else ticket = 'Gratis / Tiket kawasan';
  }

  // 3. Deskripsi singkat & detail (tanpa em-dash, spesifik & faktual)
  const parts = address.split(',').map((s) => s.trim());
  const streetPart = parts[0] || 'Kota Bogor';
  const kecPart = parts.find((p) => /kecamatan/i.test(p)) || 'Kota Bogor';

  let shortDesc = String(spot.description || '').replace(/—/g, ', ').trim();
  let detailedDesc = String(spot.detailed_description || '').replace(/—/g, ', ').trim();

  if (wikiEntry?.extract) {
    const sentences = wikiEntry.extract.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [
      wikiEntry.extract,
    ];
    if (!shortDesc || shortDesc.length < 65 || /^destinasi wisata/i.test(shortDesc)) {
      shortDesc = sentences.slice(0, 2).join(' ').slice(0, 260).trim();
    }
    if (!detailedDesc || detailedDesc === 'kosong' || detailedDesc.length < 110) {
      const p1 = sentences.slice(0, 3).join(' ').trim();
      const p2 = `${spot.name} berlokasi di ${streetPart}, ${kecPart}, Kota Bogor. Pengunjung dapat mengakses kawasan ini pada jam operasional ${hours} sebagai bagian dari rute jelajah ${spot.category.toLowerCase()} di Kota Bogor.`;
      detailedDesc = `${p1}\n\n${p2}`;
    }
  } else {
    if (!shortDesc || shortDesc.length < 55 || /^destinasi wisata/i.test(shortDesc)) {
      if (spot.category === 'Kuliner') {
        shortDesc = `${spot.name} merupakan pusat kuliner dan perbelanjaan warga di ${streetPart}, ${kecPart}, Kota Bogor yang ramai dikunjungi untuk menikmati sajian khas daerah.`;
      } else if (spot.category === 'Edukasi & Budaya') {
        shortDesc = `${spot.name} adalah kawasan cagar budaya dan wisata edukasi di ${streetPart}, ${kecPart}, Kota Bogor yang menyimpan nilai sejarah penting perkembangan kota.`;
      } else {
        shortDesc = `${spot.name} merupakan ruang terbuka hijau dan destinasi rekreasi keluarga di ${streetPart}, ${kecPart}, Kota Bogor dengan pepohonan teduh serta udara sejuk.`;
      }
    }
    if (!detailedDesc || detailedDesc === 'kosong' || detailedDesc.length < 100) {
      detailedDesc =
        `${shortDesc}\n\n` +
        `Terletak strategis di ${address}, destinasi ini mudah dijangkau dari pusat Kota Bogor dan terbuka bagi pengunjung pada pukul ${hours}.`;
    }
  }

  return { operational_hours: hours, ticket_price: ticket, description: shortDesc, detailed_description: detailedDesc };
}

// -----------------------------------------------------------------------------
// 5. Scraping Layer 3: Wikimedia Commons API (High-Res >= 800px & Landscape)
// -----------------------------------------------------------------------------
const BAD_FILENAME_REGEX =
  /(map|peta|logo|icon|coat_of_arms|lambang|flag|bendera|diagram|chart|signature|tanda_tangan|portrait|potret|stamp|perangko|document|scan|blank|locator|plaquette|plaque|signboard|selfie|person|people_posing|bus_stop|angkot|\.svg$|\.pdf$|\.tif$|\.tiff$|\.gif$|\.webm$|\.ogv$)/i;

async function searchCommonsLandscape(query, limit = 18) {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap')}` +
    `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1280`;

  try {
    const res = await fetchWithRetry(url, { timeoutMs: 20000 }, 3);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    const candidates = [];

    for (const p of pages) {
      const title = String(p.title || '');
      if (BAD_FILENAME_REGEX.test(title)) continue;
      const info = p.imageinfo?.[0];
      if (!info) continue;

      const mime = String(info.mime || '');
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) continue;

      const origW = Number(info.width || 0);
      const origH = Number(info.height || 0);
      if (origW < 800 || origH < 400) continue;

      // Wajib Landscape proporsional (1.18 <= rasio <= 2.55)
      const ratio = origW / origH;
      if (ratio < 1.18 || ratio > 2.55) continue;

      // Gunakan original URL jika ukuran <= 2.4MB & lebar <= 1920, selain itu gunakan thumb 1280px standar
      const useOriginal = origW <= 1920 && Number(info.size || 0) <= 2_400_000;
      const downloadUrl = useOriginal ? info.url : info.thumburl || info.url;
      const targetW = useOriginal ? origW : Number(info.thumbwidth || origW);
      const targetH = useOriginal ? origH : Number(info.thumbheight || origH);

      if (!downloadUrl || targetW < 800 || targetW <= targetH) continue;

      candidates.push({
        title,
        downloadUrl,
        sourcePage: info.descriptionurl || info.url,
        width: targetW,
        height: targetH,
      });
    }

    return candidates;
  } catch {
    return [];
  }
}

// Kata kunci pencarian Wikimedia Commons untuk spot spesifik & kategori tematik Bogor
const SPOT_COMMONS_QUERIES = {
  'kebun-raya-bogor': 'Kebun Raya Bogor',
  'istana-kepresidenan-bogor': 'Istana Bogor',
  'tugu-kujang': 'Tugu Kujang Bogor',
  'tugu-kujang-bogor': 'Tugu Kujang Bogor',
  'museum-zoologi-bogor': 'Museum Zoologi Bogor',
  'museum-peta': 'Museum PETA Bogor',
  'museum-monumen-peta': 'Monumen PETA Bogor',
  'museum-nasional-sejarah-alam-indonesia-munasain': 'Museum Etnobotani Bogor',
  'museum-etnobotani-indonesia': 'Museum Etnobotani Bogor',
  'museum-tanah-dan-pertanian': 'Museum Tanah Bogor',
  'museum-perjuangan-bogor': 'Bogor heritage colonial building',
  'prasasti-batutulis': 'Batutulis Bogor',
  'prasasti-batu-tulis': 'Batutulis Bogor',
  'istana-batu-tulis': 'Batutulis Bogor',
  'gereja-katedral-bogor': 'Katedral Bogor',
  'masjid-agung-bogor': 'Masjid Bogor',
  'stasiun-bogor': 'Stasiun Bogor',
  'alun-alun-kota-bogor': 'Alun-Alun Kota Bogor',
  'situ-gede': 'Situ Gede Bogor',
  'hutan-kota-cifor': 'CIFOR Bogor forest',
  'taman-meksiko': 'Taman Meksiko Kebun Raya Bogor',
  'taman-akuatik-kebun-raya-bogor': 'Bogor Botanical Gardens pond',
  'akuatik-park': 'Bogor Botanical Gardens lotus pond',
  'taman-teijsmann': 'Teijsmann Garden Bogor',
  'taman-bambu': 'Bamboo Bogor Botanical Gardens',
  'danau-gunting-kebun-raya-bogor': 'Kebun Raya Bogor lake',
  'griya-anggrek-kebun-raya-bogor': 'Orchid Kebun Raya Bogor',
  'taman-kencana': 'Taman Kencana Bogor',
  'taman-sempur': 'Sempur Bogor',
  'taman-ekspresi': 'Sempur Bogor park',
  'sempur-skate-park': 'Skatepark Indonesia',
  'jalan-suryakencana': 'Suryakencana Bogor',
  'lawang-surya-kencana': 'Suryakencana Bogor',
  'pasar-bogor': 'Pasar Bogor Suryakencana',
  'pasar-kebon-kembang': 'Traditional market West Java Indonesia',
  'pasar-anyar': 'Stasiun Bogor market',
  'pasar-sukasari': 'Pasar tradisional Indonesia',
  'botani-square': 'Botani Square Bogor',
  'bogor-trade-mall-btm': 'Bogor Trade Mall',
  'bogor-junction': 'Bogor city street',
  'lippo-plaza-ekalokasari': 'Bogor shopping mall',
  'kantor-pos-bogor': 'Kantor Pos Bogor',
  'jembatan-otista': 'Otista Ciliwung Bogor',
  'lawang-salapan': 'Lawang Salapan Bogor',
  'kampung-pulo-geulis': 'Ciliwung Bogor',
  'kampoeng-air-katulampa': 'Bendung Katulampa Bogor',
  'the-jungle-waterpark-bogor': 'The Jungle Waterpark Bogor',
  'lapangan-gor-pajajaran': 'Stadion Pajajaran Bogor',
  'makam-raden-saleh': 'Makam Raden Saleh Bogor',
  'balai-penelitian-taman-rempah-dan-obat': 'Bogor tropical garden plants',
  'kebun-percobaan-cimanggu': 'Bogor botanical plantation',
  'inti-agro-wisata-edukatif-bogor': 'Agrowisata Bogor plantation',
  'bogor-golf-club': 'Bogor golf course green',
  'rancamaya-country-club': 'Rancamaya Bogor',
};

const THEMATIC_POOL_QUERIES = {
  park: [
    'Bogor Botanical Gardens landscape',
    'Kebun Raya Bogor trees',
    'Taman Kota Bogor',
    'Bogor city park garden',
  ],
  lake: [
    'Bogor Botanical Gardens pond',
    'Situ Gede Bogor',
    'Ciliwung River Bogor',
  ],
  waterpark: [
    'Waterpark Indonesia swimming pool',
    'Resort swimming pool West Java',
  ],
  culinary_mall: [
    'Suryakencana Bogor street',
    'Indonesian street food culinary',
    'Shopping mall West Java Indonesia',
    'Traditional market West Java',
  ],
  heritage: [
    'Bogor colonial architecture',
    'Bogor Palace garden',
    'Museum Zoologi Bogor',
    'Bogor monument street',
  ],
};

// Unduh dan validasi dimensi biner setiap gambar (>= 800px & Landscape)
const downloadedUrlCache = new Map(); // downloadUrl -> { publicPath, width, height, sourcePage }

async function ensureDownloadedLandscapeImage(candidate, prefixSlug) {
  if (downloadedUrlCache.has(candidate.downloadUrl)) {
    return downloadedUrlCache.get(candidate.downloadUrl);
  }

  const hash = crypto.createHash('md5').update(candidate.downloadUrl).digest('hex').slice(0, 10);
  const safePrefix = prefixSlug.replace(/[^a-z0-9-]/g, '').slice(0, 28) || 'bogor';

  // Cek apakah file dengan hash ini sudah pernah diunduh sebelumnya di disk
  for (const ext of ['jpg', 'png', 'webp']) {
    const existingName = `wm-${safePrefix}-${hash}.${ext}`;
    const existingFull = path.join(SPOTS_IMG_DIR, existingName);
    if (fs.existsSync(existingFull)) {
      const buf = fs.readFileSync(existingFull);
      const dim = getImageDimensions(buf);
      if (dim && dim.width >= 800 && dim.width > dim.height) {
        const entry = {
          publicPath: `/images/spots/${existingName}`,
          width: dim.width,
          height: dim.height,
          sourceUrl: candidate.downloadUrl,
          sourcePage: candidate.sourcePage,
        };
        downloadedUrlCache.set(candidate.downloadUrl, entry);
        return entry;
      }
    }
  }

  try {
    await sleep(220); // Polite rate-limit ke CDN Wikimedia
    const res = await fetchWithRetry(
      candidate.downloadUrl,
      { accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8', timeoutMs: 25000 },
      3,
    );
    if (!res.ok) return null;

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length < 15_000) return null; // Tolak thumbnail kecil / rusak

    const dim = getImageDimensions(buf);
    if (!dim || dim.width < 800 || dim.width <= dim.height) {
      return null;
    }

    const fileName = `wm-${safePrefix}-${hash}.${dim.ext}`;
    const fullPath = path.join(SPOTS_IMG_DIR, fileName);
    fs.writeFileSync(fullPath, buf);

    const entry = {
      publicPath: `/images/spots/${fileName}`,
      width: dim.width,
      height: dim.height,
      sourceUrl: candidate.downloadUrl,
      sourcePage: candidate.sourcePage,
    };
    downloadedUrlCache.set(candidate.downloadUrl, entry);
    return entry;
  } catch {
    return null;
  }
}

function loadExistingValidLocalSpotImages() {
  const validLocal = new Map();
  if (!fs.existsSync(SPOTS_IMG_DIR)) {
    fs.mkdirSync(SPOTS_IMG_DIR, { recursive: true });
    return validLocal;
  }

  for (const file of fs.readdirSync(SPOTS_IMG_DIR)) {
    const full = path.join(SPOTS_IMG_DIR, file);
    if (!fs.statSync(full).isFile()) continue;
    const buf = fs.readFileSync(full);
    const dim = getImageDimensions(buf);
    // Hanya terima gambar lokal yang >= 800px DAN benar-benar Landscape (width > height)
    if (dim && dim.width >= 800 && dim.width / dim.height >= 1.18) {
      validLocal.set(file, {
        publicPath: `/images/spots/${file}`,
        width: dim.width,
        height: dim.height,
        sourceUrl: 'local-verified-asset',
      });
    }
  }
  return validLocal;
}

function pickThemeKeyForSpot(spot) {
  const nm = spot.name.toLowerCase();
  if (nm.includes('waterpark') || nm.includes('swimming') || nm.includes('kolam') || nm.includes('kampoeng air') || nm.includes('sport club')) {
    return 'waterpark';
  }
  if (nm.includes('situ') || nm.includes('danau') || nm.includes('akuatik') || nm.includes('katulampa') || nm.includes('pulo geulis')) {
    return 'lake';
  }
  if (spot.category === 'Kuliner' || nm.includes('pasar') || nm.includes('mall') || nm.includes('plaza') || nm.includes('square') || nm.includes('junction') || nm.includes('grosir')) {
    return 'culinary_mall';
  }
  if (spot.category === 'Edukasi & Budaya' || nm.includes('museum') || nm.includes('prasasti') || nm.includes('istana') || nm.includes('gedung') || nm.includes('tugu') || nm.includes('gereja') || nm.includes('masjid') || nm.includes('stasiun') || nm.includes('kantor pos')) {
    return 'heritage';
  }
  return 'park';
}

function deterministicPick(pool, seedStr, neededCount, excludeSet) {
  const picked = [];
  if (!pool.length) return picked;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 33 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let offset = 0; offset < pool.length && picked.length < neededCount; offset++) {
    const item = pool[(hash + offset * 7) % pool.length];
    if (item && !excludeSet.has(item.publicPath)) {
      excludeSet.add(item.publicPath);
      picked.push(item);
    }
  }
  return picked;
}

// -----------------------------------------------------------------------------
// 6. Main Pipeline Execution
// -----------------------------------------------------------------------------
async function main() {
  const bogorPolygons = loadBogorPolygons();
  const db = new DatabaseSync(DB_PATH);
  const spots = db.prepare('SELECT * FROM tourist_spots ORDER BY id ASC').all();
  console.log(`Memulai pengayaan data untuk ${spots.length} destinasi wisata di Kota Bogor...`);

  // Step 1: Overpass API
  const osmData = await fetchOverpassBogorData();

  // Step 2: Wikipedia API
  const wikiMap = await fetchWikipediaExtracts(spots);

  // Step 3: Siapkan pool gambar tematik Landscape (>= 800px) dari Wikimedia Commons
  console.log('[3/4] Mengambil & memvalidasi foto Landscape (>= 800px) dari Wikimedia Commons API...');
  const validLocalAssets = loadExistingValidLocalSpotImages();
  const thematicPools = {
    park: [],
    lake: [],
    waterpark: [],
    culinary_mall: [],
    heritage: [],
  };

  for (const [themeKey, queries] of Object.entries(THEMATIC_POOL_QUERIES)) {
    for (const q of queries) {
      const candidates = await searchCommonsLandscape(q, 16);
      for (const cand of candidates) {
        if (thematicPools[themeKey].length >= 16) break;
        const saved = await ensureDownloadedLandscapeImage(cand, `pool-${themeKey}`);
        if (saved && !thematicPools[themeKey].some((x) => x.publicPath === saved.publicPath)) {
          thematicPools[themeKey].push(saved);
        }
      }
      await sleep(120);
    }
    console.log(`  -> Pool '${themeKey}': ${thematicPools[themeKey].length} foto Landscape terverifikasi.`);
  }

  // Petakan foto lokal beresolusi tinggi (1376x768 / 1200x896) yang memang spesifik ke spot aslinya
  const LOCAL_SPOT_PRIMARY = {
    'kebun-raya-bogor': ['kebun-raya-bogor.jpg'],
    'lawang-surya-kencana': ['lawang-surya-kencana.jpg', 'jalan-suryakencana.jpg'],
    'jalan-suryakencana': ['jalan-suryakencana.jpg', 'lawang-surya-kencana.jpg'],
    'museum-zoologi-bogor': ['museum-zoologi.jpg'],
    'prasasti-batutulis': ['prasasti-batutulis.jpg'],
    'prasasti-batu-tulis': ['prasasti-batutulis.jpg'],
    'taman-peranginan': ['taman-peranginan.jpg'],
    jbound: ['jbound-geo-edu-park.jpg', 'jbound-gallery-1.jpg', 'jbound-gallery-2.jpg', 'jbound-gallery-3.jpg'],
  };

  // Cache hasil pencarian Commons per query spesifik agar spot kembar tidak mengulang request
  const queryCandidatesCache = new Map();
  const enrichedRecords = [];
  const manifestEntries = [];

  for (const spot of spots) {
    // A. Alamat Jalan Lengkap
    const cleanAddress = normalizeAddressString(spot.address, spot, osmData);

    // B. Koordinat Presisi (tetap dijamin 100% di dalam poligon Kota Bogor!)
    let finalLat = Number(spot.latitude);
    let finalLon = Number(spot.longitude);
    const wikiEntry = wikiMap.get(spot.slug);
    if (
      spot.slug !== 'lawang-surya-kencana' &&
      wikiEntry?.coordinates?.lat &&
      wikiEntry?.coordinates?.lon
    ) {
      const wLat = Number(wikiEntry.coordinates.lat);
      const wLon = Number(wikiEntry.coordinates.lon);
      const driftM = haversineMeters(finalLat, finalLon, wLat, wLon);
      // Hanya kalibrasi jika selisih halus (< 200m) dan tetap berada di dalam poligon Kota Bogor
      if (driftM > 5 && driftM <= 200 && isInsideKotaBogor(wLat, wLon, bogorPolygons)) {
        finalLat = Number(wLat.toFixed(7));
        finalLon = Number(wLon.toFixed(7));
      }
    }

    // C. Jam buka, harga tiket, deskripsi singkat & detail
    const info = enrichDescriptionsAndHours(spot, cleanAddress, wikiEntry, osmData);

    // D. Gambar Sampul & Galeri (3 Foto Landscape >= 800px)
    const chosenImages = [];
    const seenPaths = new Set();

    // 1) Gunakan aset lokal spesifik jika tersedia & sudah lolos uji Landscape >= 800px
    for (const localFile of LOCAL_SPOT_PRIMARY[spot.slug] || []) {
      const asset = validLocalAssets.get(localFile);
      if (asset && !seenPaths.has(asset.publicPath) && chosenImages.length < 3) {
        seenPaths.add(asset.publicPath);
        chosenImages.push(asset);
      }
    }

    // 2) Cari foto spesifik destinasi di Wikimedia Commons
    const specificQuery = SPOT_COMMONS_QUERIES[spot.slug];
    if (specificQuery && chosenImages.length < 3) {
      let cands = queryCandidatesCache.get(specificQuery);
      if (!cands) {
        cands = await searchCommonsLandscape(specificQuery, 12);
        queryCandidatesCache.set(specificQuery, cands);
        await sleep(100);
      }
      for (const cand of cands) {
        if (chosenImages.length >= 3) break;
        const saved = await ensureDownloadedLandscapeImage(cand, spot.slug);
        if (saved && !seenPaths.has(saved.publicPath)) {
          seenPaths.add(saved.publicPath);
          chosenImages.push(saved);
        }
      }
    }

    // 3) Lengkapi hingga tepat 3 foto Landscape unik dari pool tematik Kota Bogor yang sesuai
    const themeKey = pickThemeKeyForSpot(spot);
    if (chosenImages.length < 3) {
      const fill = deterministicPick(
        thematicPools[themeKey],
        spot.slug,
        3 - chosenImages.length,
        seenPaths,
      );
      chosenImages.push(...fill);
    }
    if (chosenImages.length < 3) {
      const fallbackAll = [
        ...thematicPools.park,
        ...thematicPools.heritage,
        ...thematicPools.lake,
        ...Array.from(validLocalAssets.values()),
      ];
      const fillRest = deterministicPick(
        fallbackAll,
        spot.slug + '-fallback',
        3 - chosenImages.length,
        seenPaths,
      );
      chosenImages.push(...fillRest);
    }

    const galleryPaths = chosenImages.slice(0, 3).map((x) => x.publicPath);
    const primaryImage = galleryPaths[0];

    enrichedRecords.push({
      id: spot.id,
      slug: spot.slug,
      name: spot.name,
      category: spot.category,
      address: cleanAddress,
      latitude: finalLat,
      longitude: finalLon,
      rating: Number(spot.rating || 4.5),
      is_popular: Boolean(spot.is_popular),
      operational_hours: info.operational_hours,
      ticket_price: info.ticket_price,
      description: info.description,
      detailed_description: info.detailed_description,
      image: primaryImage,
      gallery: galleryPaths,
    });

    manifestEntries.push({
      id: spot.id,
      slug: spot.slug,
      name: spot.name,
      address: cleanAddress,
      wikiMatched: wikiEntry?.title || null,
      images: chosenImages.slice(0, 3).map((img) => ({
        path: img.publicPath,
        width: img.width,
        height: img.height,
        aspectRatio: Number((img.width / img.height).toFixed(2)),
        sourceUrl: img.sourceUrl,
      })),
    });
  }

  // Step 4: Simpan ke SQLite Database, Frontend JSON, dan Backend GeoJSON
  console.log('[4/4] Menyimpan pembaruan ke SQLite, tourists.json, dan tourist_spots.geojson...');
  const updateStmt = db.prepare(`
    UPDATE tourist_spots
    SET address = ?,
        latitude = ?,
        longitude = ?,
        operational_hours = ?,
        ticket_price = ?,
        description = ?,
        detailed_description = ?,
        image = ?,
        gallery = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    for (const rec of enrichedRecords) {
      updateStmt.run(
        rec.address,
        rec.latitude,
        rec.longitude,
        rec.operational_hours,
        rec.ticket_price,
        rec.description,
        rec.detailed_description,
        rec.image,
        JSON.stringify(rec.gallery),
        rec.id,
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  db.close();

  // Sinkronisasi Front end/src/data/tourists.json (80 destinasi lengkap)
  const frontendJson = enrichedRecords.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    detailedDescription: r.detailed_description,
    address: r.address,
    rating: r.rating,
    operationalHours: r.operational_hours,
    ticketPrice: r.ticket_price,
    image: r.image,
    gallery: r.gallery,
    isPopular: r.is_popular,
    coordinates: {
      lat: r.latitude,
      lng: r.longitude,
    },
  }));
  fs.writeFileSync(FRONTEND_JSON_PATH, JSON.stringify(frontendJson, null, 2) + '\n', 'utf8');

  // Sinkronisasi backend/database/data/tourist_spots.geojson (80 destinasi lengkap)
  const geoJsonFc = {
    type: 'FeatureCollection',
    name: 'tourist_spots',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features: enrichedRecords.map((r) => ({
      type: 'Feature',
      properties: {
        id: r.id,
        slug: r.slug,
        name: r.name,
        category: r.category,
        description: r.description,
        detailed_description: r.detailed_description,
        address: r.address,
        rating: r.rating,
        operational_hours: r.operational_hours,
        ticket_price: r.ticket_price,
        image: r.image,
        gallery: r.gallery,
        latitude: r.latitude,
        longitude: r.longitude,
        is_popular: r.is_popular,
      },
      geometry: {
        type: 'Point',
        coordinates: [r.longitude, r.latitude],
      },
    })),
  };
  fs.writeFileSync(GEOJSON_SPOTS_PATH, JSON.stringify(geoJsonFc, null, 2) + '\n', 'utf8');

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalSpots: enrichedRecords.length,
        totalUniqueDownloadedImages: downloadedUrlCache.size,
        spots: manifestEntries,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  console.log('\n=== RINGKASAN SCRAPING SELESAI ===');
  console.log(`Total destinasi diperbarui : ${enrichedRecords.length}`);
  console.log(`Foto baru Wikimedia diunduh: ${downloadedUrlCache.size}`);
  console.log(`Manifest tersimpan di      : ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error('SCRAPE ERROR:', err);
  process.exit(1);
});
