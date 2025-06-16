// src/functions/searchPlaces.js
import { db } from '../firestore.js';

// Cerca su name_insensitive (pre-salvato lowercase); uso base, per FTS reale vedi Algolia.
export async function searchPlaces({ text, limit = 10 }) {
  const t = text.toLowerCase();
  const snap = await db.collection('places')
                       .where('name_insensitive','>=',t)
                       .where('name_insensitive','<=',t+'\uf8ff')
                       .limit(limit).get();
  return snap.docs.map(d=>d.data());
}
