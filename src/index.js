import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid'; // <-- 1. IMPORTIAMO UUID per creare ID unici
import { chat } from './orchestrator.js';

const app = express();
app.use(cors());
app.use(express.json());

// rate-limit base: 60 richieste/min IP → evita abuso
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

// --- 2. IL NOSTRO "GUARDAROBA" PER LE CHAT ---
// Una Map per conservare la cronologia di ogni sessione.
// Chiave: sessionId (stringa)
// Valore: history (array di messaggi)
const chatSessions = new Map();
// -----------------------------------------

app.post('/chat', async (req, res) => {
  try {
    // --- 3. GESTIONE DELLA SESSIONE ---
    const { question, sessionId } = req.body;

    // Se il client non ci fornisce un ID, ne creiamo uno nuovo.
    // Altrimenti, usiamo quello che ci ha dato.
    const currentSessionId = sessionId || uuidv4();

    // Recuperiamo la cronologia di questa sessione. Se non esiste, iniziamo con un array vuoto.
    const history = chatSessions.get(currentSessionId) || [];
    // ------------------------------------

    // --- 4. CHIAMATA ALLA FUNZIONE CHAT ---
    // Passiamo sia la domanda che la cronologia specifica di questo utente.
    const answer = await chat(question, history);
    // -------------------------------------

    // --- 5. AGGIORNAMENTO E RISPOSTA ---
    // La funzione 'chat' ha modificato l'array 'history'. Noi lo salviamo.
    chatSessions.set(currentSessionId, history);

    // Restituiamo la risposta e l'ID della sessione, in modo che il client
    // possa usarlo per la prossima richiesta.
    res.json({ answer, sessionId: currentSessionId });
    // ------------------------------------

  } catch (err) {
    console.error(err);
    res.status(500).send('Errore interno');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Kimap GPT pronto su http://localhost:${PORT}/chat`));