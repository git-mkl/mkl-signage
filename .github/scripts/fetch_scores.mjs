import fs from 'fs';

async function fetchData() {
    const API_KEY = "8b8b29c474mshd383ae732d8331ap1b0325jsn05f8a83f75fa"; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189";

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Preluare MECIURI
        const matchesRes = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const matchesJson = await matchesRes.json();
        const allMatches = matchesJson.response?.matches || [];

        const processedMatches = allMatches.map(m => ({
            home: { name: m.home.name, score: m.home.score ?? "-" },
            away: { name: m.away.name, score: m.away.score ?? "-" },
            status: m.status.finished ? "Finalizat" : (m.status.started ? "LIVE" : "Programat"),
            date: new Date(m.status.utcTime).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' }),
            time: new Date(m.status.utcTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
            ts: new Date(m.status.utcTime).getTime()
        }));

        // 2. Preluare CLASAMENT
        const stdRes = await fetch(`https://${HOST}/football-get-standing-all?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        const table = stdJson.response?.standings?.[0]?.table?.all || [];

        const standings = table.map(s => ({
            rank: s.idx || s.rank,
            name: s.name,
            mj: s.p, // Meciuri Jucate
            v: s.w,  // Victorii
            e: s.d,  // Egaluri
            i: s.l,  // Înfrângeri
            gd: s.gd, // Golaveraj
            pct: s.pts // Puncte
        }));

        const finalData = {
            matches: processedMatches.sort((a,b) => a.ts - b.ts).slice(0, 12),
            standings: standings,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log("Date salvate cu succes!");
    } catch (e) { console.error(e); }
}
fetchData();
