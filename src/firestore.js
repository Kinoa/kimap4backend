// src/firestore.js
import 'dotenv/config'; // Per caricare .env in locale
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Controlla l'ambiente
if (process.env.K_SERVICE) {
  /***************************************/
  /*** LOGICA PER L'AMBIENTE DI PRODUZIONE ***/
  /***************************************/
  console.log('Rilevato ambiente di PRODUZIONE. Inizializzazione automatica.');
  initializeApp();

} else {
  /***************************************/
  /*** LOGICA PER L'AMBIENTE LOCALE/TEST ***/
  /***************************************/
  console.log('Rilevato ambiente di SVILUPPO/TEST. Inizializzazione tramite file di chiave.');

  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saPath) {
    throw new Error('Sei in ambiente locale ma GOOGLE_APPLICATION_CREDENTIALS non è definito.');
  }

  // Questo blocco è il tuo codice originale per caricare il file
  const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
}

// L'esportazione rimane la stessa
export const db = getFirestore();