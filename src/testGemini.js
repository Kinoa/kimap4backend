// playgroundGemini.js
import { gemini } from './gemini.js';

async function runPlaygroundTest() {
  try {
    const request = {
      contents: [{
        role: 'user',
        parts: [{ text: 'Chi ha dipinto la Primavera di Botticelli? Rispondi in italiano.' }]
      }]
    };

    console.log("==========================================================");
    console.log("Eseguo lo script con la nuova struttura a due file...");
    console.log("\nInvio della domanda:", request.contents[0].parts[0].text);
    
    // 1. Esegui la chiamata e salva il risultato
    const result = await gemini.generateContent(request);
    
    // 2. Estrai l'oggetto 'response' dal risultato
    const response = result.response;

    // 3. Controlla e stampa la risposta testuale (ora funziona)
    if (response && response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
      const text = response.candidates[0].content.parts[0].text;
      
      console.log('\n--- ✅ SUCCESSO! ✅ ---');
      console.log(`Risposta dal modello:`, text);
      console.log('-----------------------\n');

    } else {
      console.error("\n--- ❌ ERRORE DI RISPOSTA ❌ ---");
      console.error("La risposta non ha il formato atteso:", JSON.stringify(response, null, 2));
      console.error("------------------------------\n");
    }

  } catch (error) {
    console.error("\n--- ❌ ERRORE ❌ ---");
    console.error("L'errore ricevuto è:", error.message);
    console.error("---------------------\n");
  }
}

runPlaygroundTest();

