// src/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

// --- 1. IMPORTA I MODULI PRINCIPALI E FIRESTORE ---
import { chat } from './orchestrator.js';
import { db } from './firestore.js'; // <-- Importiamo l'istanza di Firestore configurata

const app = express();
app.use(cors());
app.use(express.json());

app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));

// --- 2. DEFINIAMO LA COLLEZIONE SU FIRESTORE ---
// Invece di una Map in memoria, ora puntiamo a una collezione su Firestore.
// Se non esiste, verrà creata automaticamente alla prima scrittura.
const chatCollection = db.collection('chat_sessions');
// ------------------------------------------------

app.post('/chat', async (req, res) => {
  try {
    // --- 3. GESTIONE DELLA SESSIONE ---
    const { question, sessionId } = req.body;
    const currentSessionId = sessionId || uuidv4();

    // Otteniamo un riferimento al documento specifico per questa sessione.
    const sessionDocRef = chatCollection.doc(currentSessionId);

    // Recuperiamo il documento da Firestore.
    const docSnapshot = await sessionDocRef.get();

    // Se il documento esiste, prendiamo la cronologia, altrimenti partiamo da zero.
    const history = docSnapshot.exists ? docSnapshot.data().history : [];
    // ------------------------------------

    // --- 4. CHIAMATA ALLA FUNZIONE CHAT ---
    // Passiamo sia la domanda che la cronologia recuperata da Firestore.
    // La funzione 'chat' aggiungerà la domanda dell'utente alla cronologia.
    const answer = await chat(question, history);
    // -------------------------------------

    // --- 5. AGGIUNTA DELLA RISPOSTA ALLA CRONOLOGIA ---
    // La funzione `chat` ha già aggiunto la domanda alla cronologia.
    // Ora aggiungiamo esplicitamente anche la risposta del modello.
    // Questo è il passaggio chiave per rendere la conversazione persistente.
    history.push({
      role: 'model',
      parts: [{ text: answer }],
    });
    // ----------------------------------------------------

    // --- 6. SALVATAGGIO PERMANENTE SU FIRESTORE ---
    // Ora salviamo la cronologia aggiornata, che include sia la domanda che la risposta.
    await sessionDocRef.set({ history: history }, { merge: true });
    // ---------------------------------------------

    // Restituiamo la risposta e l'ID della sessione.
    res.json({ answer, sessionId: currentSessionId });

  } catch (err) {
    console.error("Errore nell'endpoint /chat:", err);
    res.status(500).send('Errore interno del server');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Kimap GPT pronto su http://localhost:${PORT}/chat`));
