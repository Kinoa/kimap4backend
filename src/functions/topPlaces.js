// src/functions/topPlaces.js
import { db } from '../firestore.js';

export async function topPlaces({ city, sort='views', limit=10 }) {
  const snap = await db.collection('places')
                       .where('city','==',city)
                       .orderBy(sort,'desc')
                       .limit(limit).get();
  return snap.docs.map(d=>d.data());
}
