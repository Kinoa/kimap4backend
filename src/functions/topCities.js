// src/functions/topCities.js
import { db } from '../firestore.js';

// Richiede una collection 'city_stats' popolata da trigger o batch ETL.
export async function topCities({ limit = 5 }) {
  const snap = await db.collection('city_stats')
                       .orderBy('accessible_count','desc')
                       .limit(limit).get();
  return snap.docs.map(d => d.data());
}
