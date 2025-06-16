// src/functions/filterPlaces.js
import { db } from '../firestore.js';

export async function filterPlacesByFeatures({ city, tags }) {
  let q = db.collection('places')
            .where('city','==',city)
            .where('wheelchair','==','yes');

  tags.forEach(tag => { q = q.where('tags','array-contains',tag) });
  const snap = await q.limit(20).get();
  return snap.docs.map(d=>d.data());
}
