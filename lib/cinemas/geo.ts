import type { GeoPoint } from "@/types/cinema"

const EARTH_RADIUS_KM = 6371

/** Centroides aproximados para resolver cidade a partir de lat/lng. */
export const CITY_CENTROIDS: Record<string, GeoPoint> = {
  "sao-paulo": { lat: -23.5505, lng: -46.6333 },
  "rio-de-janeiro": { lat: -22.9068, lng: -43.1729 },
  "belo-horizonte": { lat: -19.9167, lng: -43.9345 },
  brasilia: { lat: -15.8267, lng: -47.9218 },
  curitiba: { lat: -25.4284, lng: -49.2733 },
  "porto-alegre": { lat: -30.0346, lng: -51.2177 },
  salvador: { lat: -12.9714, lng: -38.5014 },
  fortaleza: { lat: -3.7172, lng: -38.5433 },
  recife: { lat: -8.0476, lng: -34.877 },
  manaus: { lat: -3.119, lng: -60.0217 },
  belem: { lat: -1.4558, lng: -48.4902 },
  goiania: { lat: -16.6869, lng: -49.2648 },
  campinas: { lat: -22.9099, lng: -47.0626 },
  "florianopolis": { lat: -27.5954, lng: -48.548 },
  "sao-luis": { lat: -2.5307, lng: -44.3068 },
  natal: { lat: -5.7945, lng: -35.211 },
  maceio: { lat: -9.6658, lng: -35.735 },
  "joao-pessoa": { lat: -7.1195, lng: -34.845 },
  teresina: { lat: -5.0892, lng: -42.8019 },
  cuiaba: { lat: -15.601, lng: -56.0974 },
  "campo-grande": { lat: -20.4697, lng: -54.6201 },
  vitoria: { lat: -20.3155, lng: -40.3128 },
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export function slugifyCityName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function nearestCitySlugFromCoords(lat: number, lng: number): string {
  let bestSlug = "sao-paulo"
  let bestDistance = Number.POSITIVE_INFINITY
  for (const [slug, point] of Object.entries(CITY_CENTROIDS)) {
    const distance = haversineKm({ lat, lng }, point)
    if (distance < bestDistance) {
      bestDistance = distance
      bestSlug = slug
    }
  }
  return bestSlug
}
