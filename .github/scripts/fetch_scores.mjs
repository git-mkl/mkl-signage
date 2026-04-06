import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY; // Schimbă în GitHub Secrets dacă e cazul
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 
        'x-rapidapi-key': API_KEY, 
        'x-rapidapi-host': HOST, 
        'Content-Type': 'application/json' 
    };
    const LEAGUE_ID = "189"; // ID-ul pentru SuperLiga în acest API

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Preluare Meciuri (Live + Programate)
        const res = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const json = await res.json();
        const matchesRaw = json.response?.matches || [];

        const processedMatches = matchesRaw.map(m => ({
            id: m.id,
            timestamp: Math.floor(new Date(m.status.utcTime).getTime() / 1000),
            status: m.status.finished ? 'FT' : (m.status.started ? 'LIVE' : 'NS'),
            home: { name: m.home.name, score: m.home.score },
            away: { name: m.away.name, score: m.away.score },
            timeStr: new Date(m.status.utcTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        })).slice(0, 15);

        // 2. Preluare Clasament
        const stdRes = await fetch(`https://${HOST}/football-get-standing-all?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        const standings = (stdJson.response?.standings?.[0]?.table?.all || []).map(s => ({
            rank: s.idx || s.rank,
            team: s.name,
            pj: s.p,
            gd: s.gd,
            pts: s.pts
        }));

        const finalData = { 
            matches: processedMatches, 
            standings, 
            updatedAt: new Date().toISOString() 
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log("Sync SuperLiga 2026 complet!");
    } catch (e) {
        console.error("Eroare la culegere:", e.message);
    }
}
fetchData();
