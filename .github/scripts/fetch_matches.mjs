import fs from 'fs';

async function fetchMatches() {
    const API_KEY = process.env.RAPIDAPI_KEY; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189";

    try {
        console.log("--- START FETCH MATCHES (Restored Logic) ---");
        const res = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const json = await res.json();
        
        // Logica veche care funcționa: căutăm meciurile oriunde ar fi în răspuns
        let allMatches = [];
        if (json.response && json.response.matches) {
            allMatches = json.response.matches;
        } else if (Array.isArray(json.response)) {
            allMatches = json.response;
        } else if (json.matches) {
            allMatches = json.matches;
        }

        if (allMatches.length === 0) {
            console.log("Eroare: Structura JSON s-a schimbat sau API-ul e gol:", JSON.stringify(json).substring(0, 200));
            return;
        }

        const now = new Date();
        // Setăm "azi" la miezul nopții pentru filtrare corectă
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = startOfToday + 86400000;

        const processed = allMatches.map(m => {
            // Verificăm diverse formate de timp pe care le-ar putea trimite API-ul
            const rawTime = m.status.utcTime || m.status.startTime || m.utcTime;
            const matchDate = new Date(rawTime);
            
            return {
                home: { name: m.home.name, score: m.home.score ?? "-" },
                away: { name: m.away.name, score: m.away.score ?? "-" },
                status: m.status.finished ? "FT" : (m.status.started ? "LIVE" : "NS"),
                date: matchDate.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' }),
                time: matchDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                ts: matchDate.getTime()
            };
        });

        // Filtrăm exact ca înainte de split
        const matchData = {
            past: processed.filter(m => m.ts < startOfToday).sort((a, b) => b.ts - a.ts).slice(0, 8),
            today: processed.filter(m => m.ts >= startOfToday && m.ts < endOfToday).sort((a, b) => a.ts - b.ts),
            future: processed.filter(m => m.ts >= endOfToday).sort((a, b) => a.ts - b.ts).slice(0, 8)
        };

        // Citim JSON-ul existent (pentru a păstra standings)
        let currentJSON = {};
        if (fs.existsSync('data/superliga.json')) {
            try {
                currentJSON = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
            } catch (e) {
                currentJSON = {};
            }
        }

        const finalOutput = { 
            ...currentJSON, 
            ...matchData, 
            updatedAt: new Date().toLocaleString('ro-RO') 
        };
        
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalOutput, null, 2));
        
        console.log("Succes: " + allMatches.length + " meciuri găsite, " + processed.length + " procesate.");
    } catch (e) {
        console.error("Eroare critică la meciuri:", e.message);
    }
}
fetchMatches();
