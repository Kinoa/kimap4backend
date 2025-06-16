// src/functions/yearlyGrowth.js
import { db } from '../firestore.js';

/**
 * Richiede di aver storicizzato i tesseramenti dei luoghi accessibili
 * in 'places_history' con campo year e count. Es.: {city:'Firenze',year:2024,count:420}
 */
export async function yearlyGrowth({ city, from_year, to_year }) {
  const snap = await db.collection('places_history')
                       .where('city','==',city)
                       .where('year','>=',from_year)
                       .where('year','<=',to_year)
                       .orderBy('year').get();
  return snap.docs.map(d=>d.data());  // array {year,count}
}
