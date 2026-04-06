import fs from 'fs';

async function fetchData() {
    const API_KEY = "8b8b29c474mshd383ae732d8331ap1b0325jsn05f8a83f75fa"; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189";

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        const res = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const json = await res.json();
        const allMatches = json.response?.matches || [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = startOfToday + 86400000;

        const processed = allMatches.map(m => {
            const utc = new Date(m.status.utcTime).getTime();
            return {
                home: { name: m.home.name, score: m.home.score ?? "-" },
                away: { name: m.away.name, score: m.away.score ?? "-" },
                status: m.status.finished ? "FT" : (m.status.started ? "LIVE" : "NS"),
                date: new Date(m.status.utcTime).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' }),
                time: new Date(m.status.utcTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                ts: utc
            };
        });

        // 1. Meciuri trecute (6 cele mai recente înainte de azi)
        const past = processed.filter(m => m.ts < startOfToday)
            .sort((a, b) => b.ts - a.ts).slice(0, 6);

        // 2. Meciuri de AZI
        const today = processed.filter(m => m.ts >= startOfToday && m.ts < endOfToday)
            .sort((a, b) => a.ts - b.ts);

        // 3. Meciuri viitoare (6 după ziua de azi)
        const future = processed.filter(m => m.ts >= endOfToday)
            .sort((a, b) => a.ts - b.ts).slice(0, 6);

        // Clasament
        const stdRes = await fetch(`https://${HOST}/football-get-standing-all?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        const standings = (stdJson.response?.standings?.[0]?.table?.all || []).map(s => ({
            rank: s.idx || s.rank,
            name: s.name,
            pj: s.p,
            pts: s.pts
        }));

        fs.writeFileSync('data/superliga.json', JSON.stringify({ past, today, future, standings }, null, 2));
    } catch (e) { console.error(e); }
}
fetchData();
