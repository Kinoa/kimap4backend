// src/testDB.js
import 'dotenv/config';
import { db } from './firestore.js';      // la tua inizializzazione unica

async function run() {
  try {
    /* --- leggo un documento per prova --- */
    const firstSnap = await db.collection('places').limit(1).get();
    if (firstSnap.empty) {
      console.log('⚠️  La collection "places" è vuota.');
    } else {
      console.log('✅ Primo doc:', firstSnap.docs[0].data());
    }

    /* --- conteggio efficiente con aggregazione --- */
    const countSnap = await db.collection('places').count().get();   // <- NEW
    console.log('Totale documenti:', countSnap.data().count);

  } catch (err) {
    console.error('❌ Errore Firestore:', err);
  } finally {
    process.exit();
  }
}

run();
