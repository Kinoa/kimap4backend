/******************************************************************
 * updateCities.js – aggiunge city, full_address, postal_code, country
 ******************************************************************/
import 'dotenv/config';
import fetch from 'node-fetch';
import pLimit from 'p-limit';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Firestore
initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
const db = getFirestore();

// 2. Helpers
const MAPS_KEY = process.env.MAPS_KEY;
const limit    = pLimit(10);                       // 10 req parallele ≈ 600 QPM :contentReference[oaicite:6]{index=6}

async function reverseGeocode(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}&result_type=street_address|plus_code`;
  const { status, results } = await (await fetch(url)).json();      // schemi & fields :contentReference[oaicite:7]{index=7}
  if (status !== 'OK' || !results.length) return null;

  const comp = results[0].address_components;
  const pick = (type) => comp.find(c => c.types.includes(type))?.long_name ?? null;

  return {
    full_address: results[0].formatted_address,
    street      : pick('route'),
    civic_number: pick('street_number'),
    city        : pick('locality') || pick('postal_town'),
    postal_code : pick('postal_code'),
    admin_area  : pick('administrative_area_level_1'),
    country     : pick('country')
  };
}

// 3. Batch update
async function updateAll() {
  const snap = await db.collection('places').get();
  console.log(`⚙️  Elaboro ${snap.size} documenti…`);

  let done = 0, skipped = 0;
  const tasks = snap.docs.map(doc => limit(async () => {
    if (doc.data().city) { skipped++; return; }
    const { _latitude:lat, _longitude:lng } = doc.data().coordinates;
    const addr = await reverseGeocode(lat,lng);
    if (addr) { await doc.ref.update(addr); done++; }
  }));

  await Promise.all(tasks);
  console.log(`✅ Fine. Aggiornati: ${done}, già completi: ${skipped}`);
}

updateAll().catch(e => { console.error(e); process.exit(1); });
