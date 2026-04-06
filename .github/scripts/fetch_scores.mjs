import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189"; // SuperLiga Romania

    try {
        console.log("Incepem fetch-ul de date...");
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Fetch Meciuri
        const res = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const json = await res.json();
        
        console.log("Status Raspuns Meciuri:", json.status);
        const allMatches = json.response?.matches || [];
        console.log(`Am gasit ${allMatches.length} meciuri in total.`);

        const processed = allMatches.map(m => ({
            id: m.id,
            home: { name: m.home?.name || "Necunoscut", score: m.home?.score ?? "-" },
            away: { name: m.away?.name || "Necunoscut", score: m.away?.score ?? "-" },
            status: m.status?.finished ? 'FT' : (m.status?.started ? 'LIVE' : 'NS'),
            time: new Date(m.status?.utcTime).toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'}),
            date: new Date(m.status?.utcTime).toLocaleDateString('ro-RO', {day: 'numeric', month: 'short'}),
            ts: new Date(m.status?.utcTime).getTime()
        }));

        const live = processed.filter(m => m.status === 'LIVE');
        const recent = processed.filter(m => m.status === 'FT').sort((a,b) => b.ts - a.ts).slice(0, 4);
        const upcoming = processed.filter(m => m.status === 'NS').sort((a,b) => a.ts - b.ts).slice(0, 6);

        // 2. Fetch Clasament
        console.log("Cerem clasamentul...");
        const stdRes = await fetch(`https://${HOST}/football-get-standing-all?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        const standingsRaw = stdJson.response?.standings?.[0]?.table?.all || [];
        console.log(`Am gasit ${standingsRaw.length} echipe in clasament.`);

        const standings = standingsRaw.map(s => ({
            pos: s.rank || s.idx,
            name: s.name,
            pj: s.p || 0,
            gd: s.gd ?? 0,
            pts: s.pts || 0
        }));

        const finalData = { live, recent, upcoming, standings, updatedAt: new Date().toISOString() };
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log("Fisierul superliga.json a fost scris cu succes.");

    } catch (e) {
        console.error("EROARE CRITICA:", e.message);
    }
}
fetchData();
