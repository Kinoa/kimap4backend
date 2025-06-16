// src/functions/statsByCategory.js
import { db } from '../firestore.js';

/**
 * Ritorna un oggetto { category: count } per una città.
 * Usa count() per ciascuna categoria distinta per non scaricare doc.  :contentReference[oaicite:3]{index=3}
 */
const CATEGORIES = ['bar','restaurant','museum','shop','park'];

export async function statsByCategory({ city }) {
  const results = {};
  await Promise.all(CATEGORIES.map(async cat => {
    const snap = await db.collection('places')
                         .where('city','==',city)
                         .where('category','==',cat)
                         .where('wheelchair','==','yes')
                         .count().get();            // 1 read per categoria
    results[cat] = snap.data().count;
  }));
  return results;
}
