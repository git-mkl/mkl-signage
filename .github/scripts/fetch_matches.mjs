import fs from 'fs';

async function fetchMatches() {
    // Folosim variabila de mediu pentru securitate sau string-ul tau direct daca preferi
    const API_KEY = process.env.RAPIDAPI_KEY || '8b8b29c474mshd383ae732d8331ap1b0325jsn05f8a83f75fa'; 
    
    // Configurația replicată după $.ajax(settings)
    const url = 'https://free-api-live-football-data.p.rapidapi.com/football-get-all-matches-by-league?leagueid=189';
    
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
            'Content-Type': 'application/json' // Adăugat conform setărilor tale
        }
    };

    try {
        console.log("--- START FETCH MATCHES (jQuery Logic Replication) ---");
        
        const res = await fetch(url, options);
        const response = await res.json();

        // Verificăm dacă am primit eroare de subscripție
        if (response.message && response.message.includes("not subscribed")) {
            console.error("Eroare subscripție:", response.message);
            return;
        }

        const allMatches = response.response?.matches || [];
        
        if (allMatches.length === 0) {
            console.log("Response primit dar matches este gol. Verifică structura:", JSON.stringify(response).substring(0, 100));
            return;
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = startOfToday + 86400000;

        const processed = allMatches.map(m => ({
            home: { name: m.home.name, score: m.home.score ?? "-" },
            away: { name: m.away.name, score: m.away.score ?? "-" },
            status: m.status.finished ? "FT" : (m.status.started ? "LIVE" : "NS"),
            date: new Date(m.status.utcTime).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' }),
            time: new Date(m.status.utcTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
            ts: new Date(m.status.utcTime).getTime()
        }));

        const matchData = {
            past: processed.filter(m => m.ts < startOfToday).sort((a, b) => b.ts - a.ts).slice(0, 8),
            today: processed.filter(m => m.ts >= startOfToday && m.ts < endOfToday).sort((a, b) => a.ts - b.ts),
            future: processed.filter(m => m.ts >= endOfToday).sort((a, b) => a.ts - b.ts).slice(0, 8)
        };

        // Citim JSON-ul existent pentru MERGE
        let currentJSON = {};
        if (fs.existsSync('data/superliga.json')) {
            currentJSON = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
        }

        const finalOutput = { 
            ...currentJSON, 
            ...matchData, 
            updatedAt: new Date().toLocaleString('ro-RO') 
        };
        
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalOutput, null, 2));
        
        console.log("Succes: " + allMatches.length + " meciuri procesate conform logicii jQuery.");

    } catch (e) {
        console.error("Eroare la execuție:", e.message);
    }
}

fetchMatches();
