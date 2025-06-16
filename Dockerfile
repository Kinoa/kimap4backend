# --- FASE 1: Scelta dell'Immagine di Base ---
# Usiamo un'immagine ufficiale di Node.js. La versione "slim" è più leggera
# e adatta alla produzione perché non contiene strumenti di sviluppo superflui.
# Scegli una versione specifica (es. 20) per garantire build riproducibili.
FROM node:20-slim

# --- FASE 2: Preparazione dell'Ambiente ---
# Imposta la cartella di lavoro all'interno del container. Tutti i comandi
# successivi verranno eseguiti a partire da questo percorso.
WORKDIR /usr/src/app

# --- FASE 3: Installazione delle Dipendenze (in modo ottimizzato) ---
# Copia solo i file package.json e package-lock.json.
# Il `*` assicura che vengano presi entrambi se esistono.
# Questa è un'ottimizzazione cruciale: Docker creerà un "layer" in cache
# per le dipendenze. Questo layer verrà riutilizzato finché non modifichi
# package.json o package-lock.json, rendendo le build successive molto più veloci.
COPY package*.json ./

# Installa SOLO le dipendenze di produzione. Il flag `--omit=dev` esclude
# i pacchetti che usi solo per lo sviluppo (es. nodemon, jest),
# rendendo l'immagine finale più leggera e sicura.
RUN npm install --omit=dev

# --- FASE 4: Aggiunta del Codice Sorgente ---
# Ora che le dipendenze sono installate, copia tutto il resto del codice
# del tuo progetto nella cartella di lavoro. Questo includerà la cartella 'src'.
COPY . .

# --- FASE 5: Esposizione della Porta ---
# Documenta la porta su cui la tua applicazione ascolterà le connessioni.
# NOTA: La tua app Node.js DEVE ascoltare sulla porta specificata dalla
# variabile d'ambiente PORT (es. process.env.PORT || 3000).
# Cloud Run, ad esempio, usa questa variabile per comunicare con il container.
# La imposterai a 3000 come da tuo file .env, ma è buona norma esporla.
EXPOSE 3000

# --- FASE 6: Comando di Avvio ---
# Specifica il comando che avvierà la tua applicazione quando il container parte.
# Il percorso deve includere 'src/' perché il tuo file di avvio è in quella sottocartella.
CMD [ "node", "src/index.js" ]
