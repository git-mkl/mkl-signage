import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189";

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Preluare Meciuri
        const res = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const json = await res.json();
        const allMatches = json.response?.matches || [];

        const processed = allMatches.map(m => ({
            id: m.id,
            home: { name: m.home.name, score: m.home.score ?? 0 },
            away: { name: m.away.name, score: m.away.score ?? 0 },
            status: m.status.finished ? 'FT' : (m.status.started ? 'LIVE' : 'NS'),
            time: new Date(m.status.utcTime).toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'}),
            date: new Date(m.status.utcTime).toLocaleDateString('ro-RO', {day: 'numeric', month: 'short'}),
            ts: new Date(m.status.utcTime).getTime()
        }));

        const now = Date.now();
        const live = processed.filter(m => m.status === 'LIVE');
        const recent = processed.filter(m => m.status === 'FT').sort((a,b) => b.ts - a.ts).slice(0, 4);
        const upcoming = processed.filter(m => m.status === 'NS').sort((a,b) => a.ts - b.ts).slice(0, 6);

        // 2. Preluare Clasament
        const stdRes = await fetch(`https://${HOST}/football-get-standing-all?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        const standings = (stdJson.response?.standings?.[0]?.table?.all || []).map(s => ({
            pos: s.rank || s.idx,
            name: s.name,
            pj: s.p,
            v: s.w, e: s.d, i: s.l,
            gd: s.gd,
            pts: s.pts
        }));

        fs.writeFileSync('data/superliga.json', JSON.stringify({ live, recent, upcoming, standings, updatedAt: new Date().toISOString() }, null, 2));
        console.log("Fetch completat.");
    } catch (e) { console.error(e); }
}
fetchData();
