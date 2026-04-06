import fs from 'fs';

async function fetchMatches() {
    const API_KEY = process.env.RAPIDAPI_KEY; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const url = 'https://free-api-live-football-data.p.rapidapi.com/football-get-all-matches-by-league?leagueid=189';
    
    try {
        const res = await fetch(url, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST }
        });
        const response = await res.json();
        const allMatches = response.response?.matches || [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = startOfToday + 86400000;

        const processed = allMatches.map(m => ({
            home: { 
                name: m.home.name, 
                score: m.home.score ?? "-", 
                id: m.home.id // Salvăm ID-ul pentru logo
            },
            away: { 
                name: m.away.name, 
                score: m.away.score ?? "-", 
                id: m.away.id // Salvăm ID-ul pentru logo
            },
            status: m.status.finished ? "FT" : (m.status.started ? "LIVE" : "NS"),
            date: new Date(m.status.utcTime).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }),
            time: new Date(m.status.utcTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
            ts: new Date(m.status.utcTime).getTime()
        }));

        const matchData = {
            past: processed.filter(m => m.ts < startOfToday).sort((a, b) => b.ts - a.ts).slice(0, 8),
            today: processed.filter(m => m.ts >= startOfToday && m.ts < endOfToday).sort((a, b) => a.ts - b.ts),
            future: processed.filter(m => m.ts >= endOfToday).sort((a, b) => a.ts - b.ts).slice(0, 8)
        };

        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(matchData, null, 2));
        console.log("Succes: Meciuri procesate cu ID-uri.");
    } catch (e) { console.error("Eroare:", e.message); }
}
fetchMatches();
