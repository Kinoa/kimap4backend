// src/tools.js
// ===================================================================
//  TOOL DEFINITIONS for Gemini 2.0 Flash  (function-calling / tools)
//  Ogni oggetto descrive: name, description, JSON-Schema dei parametri
// ===================================================================

export const TOOLS = [
  // -----------------------------------------------------------------
  //  A - Conteggio luoghi accessibili in una città (facolt. categoria)
  // -----------------------------------------------------------------
  {
    name: 'count_accessible_places',
    description:
      'Conta i luoghi con wheelchair=yes in una città; opzionalmente filtra per categoria (bar, restaurant, museum …).',
    parameters: {
      type: 'object',
      properties: {
        city:     { type: 'string' },
        category: {
          type: 'string',
          enum: ['bar', 'restaurant', 'museum', 'shop', 'park']
        }
      },
      required: ['city']
    }
  },

  // -----------------------------------------------------------------
  //  B - Ricerca nei dintorni di lat/lng entro un raggio
  // -----------------------------------------------------------------
  {
    name: 'find_accessible_places_near',
    description:
      'Restituisce luoghi accessibili di una data categoria entro un raggio (km) da coordinate lat/lng.',
    parameters: {
      type: 'object',
      properties: {
        category:  { type: 'string' },
        lat:       { type: 'number' },
        lng:       { type: 'number' },
        radius_km: { type: 'number', default: 0.5 },
        limit:     { type: 'number', default: 5 }
      },
      required: ['category', 'lat', 'lng']
    }
  },

  // -----------------------------------------------------------------
  //  C - Ricerca full-text sul nome dei luoghi
  // -----------------------------------------------------------------
  {
    name: 'search_places',
    description:
      'Ricerca testuale (case-insensitive) sui nomi dei luoghi, max 10 risultati.',
    parameters: {
      type: 'object',
      properties: {
        text:  { type: 'string' },
        limit: { type: 'number', default: 10 }
      },
      required: ['text']
    }
  },

  // -----------------------------------------------------------------
  //  D - Top-N città per numero di luoghi accessibili
  // -----------------------------------------------------------------
  {
    name: 'top_cities_by_accessibility',
    description: 'Elenca le città con il maggior numero di luoghi accessibili.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 5 }
      }
    }
  },

  // -----------------------------------------------------------------
  //  E - Confronto conteggi fra due città
  // -----------------------------------------------------------------
  {
    name: 'compare_city_counts',
    description:
      'Confronta quante strutture accessibili esistono fra due città.',
    parameters: {
      type: 'object',
      properties: {
        cityA: { type: 'string' },
        cityB: { type: 'string' }
      },
      required: ['cityA', 'cityB']
    }
  },

  // -----------------------------------------------------------------
  //  F - Luoghi più popolari (views, rating) in una città
  // -----------------------------------------------------------------
  {
    name: 'top_places',
    description:
      'Restituisce i luoghi più popolari (views o rating) in una città.',
    parameters: {
      type: 'object',
      properties: {
        city:  { type: 'string' },
        sort:  { type: 'string', enum: ['views', 'rating'], default: 'views' },
        limit: { type: 'number', default: 10 }
      },
      required: ['city']
    }
  },

  // -----------------------------------------------------------------
  //  G - Filtra luoghi per tag/feature accessibilità
  // -----------------------------------------------------------------
  {
    name: 'filter_places_by_features',
    description:
      'Restituisce luoghi accessibili che possiedono tutti i tag specificati (es. rampa, bagno_adattato).',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['city', 'tags']
    }
  },

  // -----------------------------------------------------------------
  //  H - Segnalazione problema / aggiornamento accessibilità
  // -----------------------------------------------------------------
  {
    name: 'submit_accessibility_report',
    description:
      'Permette all’utente di inviare una segnalazione o aggiornamento su un luogo accessibile.',
    parameters: {
      type: 'object',
      properties: {
        place_id: { type: 'string' },
        note:     { type: 'string' },
        user:     { type: 'string' }
      },
      required: ['place_id', 'note']
    }
  },

  


  // -----------------------------------------------------------------
  //  K - Itinerario accessibile (fino a 6 tappe) intorno a un punto
  // -----------------------------------------------------------------
  {
    name: 'build_accessible_route',
    description:
      'Costruisce un breve itinerario accessibile (max 6 tappe) vicino a un punto di partenza.',
    parameters: {
      type: 'object',
      properties: {
        start_lat: { type: 'number' },
        start_lng: { type: 'number' },
        city:      { type: 'string' },
        category:  { type: 'string', default: 'bar' },
        stops:     { type: 'number', default: 5 },
        radius_km: { type: 'number', default: 1 }
      },
      required: ['start_lat', 'start_lng', 'city']
    }
  },

  // -----------------------------------------------------------------
  //  L - Statistiche per categoria in una città
  // -----------------------------------------------------------------
  {
    name: 'stats_by_category',
    description:
      'Ritorna il conteggio di luoghi accessibili per ogni categoria in una città.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' }
      },
      required: ['city']
    }
  },

  // -----------------------------------------------------------------
  //  M - Percentuale di ciascuna categoria sul totale accessibile
  // -----------------------------------------------------------------
  {
    name: 'percentage_by_category',
    description:
      'Restituisce la percentuale di bar, ristoranti, musei, ecc. sul totale dei luoghi accessibili in una città.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' }
      },
      required: ['city']
    }
  },

  // -----------------------------------------------------------------
  //  N - Crescita annuale (trend) dei luoghi accessibili
  // -----------------------------------------------------------------
  {
    name: 'yearly_growth',
    description:
      'Mostra l’andamento anno-su-anno del numero di luoghi accessibili in una città.',
    parameters: {
      type: 'object',
      properties: {
        city:      { type: 'string' },
        from_year: { type: 'number' },
        to_year:   { type: 'number' }
      },
      required: ['city', 'from_year', 'to_year']
    }
  },

  {
  name: 'geocode_place_name',
  description: 'Converte un toponimo in latitudine e longitudine (reverse).',
  parameters: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text']
  }
},

];
