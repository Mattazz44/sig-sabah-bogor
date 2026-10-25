# Tourist Data Specification

Source file: `src/data/tourists.json` — an array of tourist spot objects.

## 1. Object Schema

| Field         | Type                         | Required | Notes                                                        |
| ------------- | ---------------------------- | -------- | ------------------------------------------------------------ |
| `id`          | number                       | yes      | Unique numeric ID.                                           |
| `slug`        | string                       | yes      | URL-safe, unique. Used by route `/place/:slug`.              |
| `name`        | string                       | yes      | Display name.                                                |
| `category`    | string (enum)                | yes      | One of: `"Alam & Curug"`, `"Kuliner"`, `"Edukasi & Budaya"`. |
| `description` | string                       | yes      | Short description (1–3 sentences).                           |
| `address`     | string                       | yes      | Human-readable address.                                      |
| `distance`    | string                       | no       | Display distance (e.g. `"1 km dari posisi kamu"`).           |
| `rating`      | number                       | yes      | 0.0 – 5.0, one decimal.                                      |
| `image`       | string                       | yes      | Path relative to `public/` (e.g. `/images/kopi-daong.jpg`).  |
| `coordinates` | `{ lat: number, lng: number }` | yes    | WGS84 decimal degrees. `lat` first, `lng` second.            |
| `isPopular`   | boolean                      | no       | Flag for featured "Populer dengan turis" card.               |

## 2. Example

```json
{
  "id": 1,
  "slug": "taman-peranginan",
  "name": "Taman Peranginan",
  "category": "Alam & Curug",
  "description": "Taman kota bersejarah di ketinggian tebing Jalan Jenderal Sudirman dengan pemandangan Sungai Ciliwung dan udara sejuk khas Bogor.",
  "address": "Jl. Jend. Sudirman No.1, Sempur, Kecamatan Bogor Tengah, Kota Bogor",
  "distance": "1 km dari posisi kamu",
  "rating": 4.6,
  "image": "/images/taman-peranginan.jpg",
  "coordinates": { "lat": -6.5885, "lng": 106.7978 }
}
```

## 3. Filter Categories (UI order)

`["Semua", "Alam & Curug", "Kuliner", "Edukasi & Budaya"]` — `"Semua"` is a UI-only value meaning "no filter".
