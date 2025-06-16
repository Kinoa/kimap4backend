// src/orchestrator.js  (VERSIONE FINALE E CORRETTA)
import { gemini } from './gemini.js';
import { TOOLS } from './tools.js';
import { KIMAP_SYS } from './prompt.js';
import {
    countAccessiblePlaces,
    findAccessiblePlacesNear,
    searchPlaces,
    topCities,
    compareCityCounts,
    topPlaces,
    filterPlacesByFeatures,
    submitAccessibilityReport,
    buildAccessibleRoute,
    statsByCategory,
    percentageByCategory,
    yearlyGrowth,
    geocodePlaceName
} from './functions/index.js'; // importa tutte le funzioni

const FN = {
    count_accessible_places: countAccessiblePlaces,
    find_accessible_places_near: findAccessiblePlacesNear,
    search_places: searchPlaces,
    top_cities_by_accessibility: topCities,
    compare_city_counts: compareCityCounts,
    top_places: topPlaces,
    filter_places_by_features: filterPlacesByFeatures,
    submit_accessibility_report: submitAccessibilityReport,
    build_accessible_route: buildAccessibleRoute,
    stats_by_category: statsByCategory,
    percentage_by_category: percentageByCategory,
    yearly_growth: yearlyGrowth,
    geocode_place_name: geocodePlaceName
};

export async function chat(question, history = []) {
    if (!question || typeof question !== 'string') {
        throw new Error('La domanda deve essere una stringa non vuota.');
    } else if (question.length > 1000) {
        throw new Error('La domanda è troppo lunga, massimo 1000 caratteri.');
    } else {
        console.log('💬 Domanda:', question);
    }
    history.push({ role: 'user', parts: [{ text: question }] });

    while (true) {
        const res = await gemini.generateContent({
            contents: history,
            tools: [{ functionDeclarations: TOOLS }],
            systemInstruction: KIMAP_SYS
        });

        /* ---------- 1. Estrai il candidato ---------- */
        const candidate = res.response?.candidates?.[0];
        if (!candidate) {
            console.error('‼️ Nessun candidato nella risposta di Gemini');
            return 'Spiacente, non riesco a rispondere ora.';
        }

        const part0 = candidate.content?.parts?.[0];

        /* ---------- 2. Gemini chiede una funzione ---------- */
        if (part0?.functionCall) {
            history.push({
                role: 'model',
                parts: [{
                    functionCall: {
                        name: part0.functionCall.name,
                        args: part0.functionCall.args
                    }
                }]
            });

            const { name, args } = part0.functionCall;
            const fn = FN[name];

            if (!fn) {
                console.error(`Funzione "${name}" non implementata`);
                return 'Spiacente, funzione non disponibile.';
            }

            let data;
            try { data = await fn(args || {}); }
            catch (err) {
                console.error('Errore nella funzione:', err);
                data = { error: err.message || 'Errore durante l\'esecuzione della funzione.' };
            }

            // ✨ LA CORREZIONE DEFINITIVA È QUI ✨
            // 1. La chiave corretta è "response".
            // 2. Il suo valore deve SEMPRE essere un oggetto. Se la nostra funzione
            //    restituisce un array, lo "impacchettiamo" in un oggetto.
            const responsePayload = { result: data };

            history.push({
                role: 'function',
                parts: [{
                    functionResponse: {
                        name,
                        response: responsePayload
                    }
                }]
            });

            continue;
        }

        /* ---------- 3. Risposta finale di testo ---------- */
        if (!part0?.text) {
            console.error('‼️ Nessun testo nella risposta finale');
            return 'Spiacente, non ho trovato una risposta.';
        }

        const answer = part0.text;
        console.log('📥 Risposta:', answer);
        return answer;
    }
}