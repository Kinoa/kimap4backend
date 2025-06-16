// src/functions/countAccessible.js
import { db } from '../firestore.js';

export async function countAccessiblePlaces({ city, category }) {
  // Filtro base: wheelchair=yes + city obbligatoria
  let q = db.collection('places')
            .where('city', '==', city)
            .where('wheelchair', '==', 'yes');

  // (opzionale) filtra per categoria: bar, restaurant, museum …
  if (category) q = q.where('category', '==', category);

  // Aggregazione lato server → 1 read anche su migliaia di doc
  const snap = await q.count().get();      // Admin SDK v13+
  return { count: snap.data().count };
}

