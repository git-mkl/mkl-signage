import fs from 'fs';

async function fetchMatches() {
    const API_KEY = process.env.RAPIDAPI_KEY; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const url = 'https://free-api-live-football-data.p.rapidapi.com/football-get-all-matches-by-league?leagueid=189';
    
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': HOST,
            'Content-Type': 'application/json'
        }
    };

    try {
        console.log("--- FETCH MATCHES (RapidAPI) ---");
        const res = await fetch(url, options);
        const response = await res.json();

        const allMatches = response.response?.matches || [];
        if (allMatches.length === 0) {
            console.log("Response primit dar matches este gol.");
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

        let currentJSON = {};
        if (fs.existsSync('data/superliga.json')) {
            currentJSON = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
        }

        const finalOutput = { ...currentJSON, ...matchData, updatedAt: new Date().toLocaleString('ro-RO') };
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalOutput, null, 2));
        
        console.log(`Succes: ${allMatches.length} meciuri salvate.`);
    } catch (e) { console.error("Eroare:", e.message); }
}
fetchMatches();
