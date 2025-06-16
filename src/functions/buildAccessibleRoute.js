// src/functions/buildAccessibleRoute.js
import { findAccessiblePlacesNear } from './findNear.js';

/**
 * Crea un itinerario (max 6 tappe) partendo da lat/lng.
 * Algoritmo: nearest-neighbour heuristics (O(n²) — sufficiente per 5-6 punti)  :contentReference[oaicite:2]{index=2}.
 */
export async function buildAccessibleRoute({
  start_lat, start_lng, city, category = 'bar', stops = 5, radius_km = 1
}) {
  // 1) recupera candidate place
  const points = await findAccessiblePlacesNear({
    category, lat: start_lat, lng: start_lng,
    radius_km, limit: 20
  });

  if (!points.length) return { route: [] };

  // 2) nearest-neighbour greedy
  const route = [];
  let cur = { lat: start_lat, lng: start_lng };
  const dist = (a, b) =>
    Math.hypot(a.lat - b.lat, a.lng - b.lng);     // piano cartesiano ≈ ok per piccoli raggi

  while (route.length < stops && points.length) {
    points.sort((a, b) => dist(cur, a) - dist(cur, b));
    const next = points.shift();
    route.push({
      id: next.id,
      name: next.name,
      lat: next.latitude,
      lng: next.longitude,
      distance_km: next.distance_km
    });
    cur = { lat: next.latitude, lng: next.longitude };
  }
  return { route };
}
