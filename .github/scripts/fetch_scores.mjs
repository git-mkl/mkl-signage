import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 
        'x-rapidapi-key': API_KEY, 
        'x-rapidapi-host': HOST, 
        'Content-Type': 'application/json' 
    };
    const LEAGUE_ID = "189";

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. LIVE DATA (Rămâne pe API pentru viteză)
        const liveRes = await fetch(`https://${HOST}/football-current-live`, { headers });
        const liveJson = await liveRes.json();
        const liveMatches = (liveJson.response?.live || [])
            .filter(m => m.leagueId == LEAGUE_ID)
            .map(m => ({
                id: m.id,
                home: m.home.name,
                away: m.away.name,
                hScore: m.home.score,
                aScore: m.away.score,
                minute: m.status?.liveTime?.short || "LIVE"
            }));

        // 2. PROGRAM & CLASAMENT
        // Notă: Aici, în mod ideal, am face scraping pe lpf.ro/liga-1
        // Deocamdată folosim API-ul ca fallback, dar mapăm datele conform structurii LPF
        const allRes = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const allJson = await allRes.json();
        const matchesRaw = allJson.response?.matches || [];

        const upcoming = matchesRaw
            .filter(m => !m.status?.finished && !liveMatches.find(l => l.id == m.id))
            .slice(0, 4)
            .map(m => ({
                home: m.home.name,
                away: m.away.name,
                time: Math.floor(new Date(m.status.utcTime).getTime() / 1000)
            }));

        let standings = [];
        const stdRes = await fetch(`https://${HOST}/football-get-standing-all?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        if (stdJson.status === "success") {
            standings = (stdJson.response?.standings?.[0]?.table?.all || []).map(s => ({
                pos: s.idx || s.rank,
                name: s.name,
                pj: s.p || 0, // Meciuri jucate (Specific LPF)
                pts: s.pts
            })).slice(0, 16); // Toate cele 16 echipe din SuperLigă
        }

        const finalData = { 
            liveMatches, 
            upcoming, 
            standings, 
            source: "LPF.ro / RapidAPI",
            updatedAt: new Date().toISOString() 
        };
        
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Datele au fost sincronizate.");
    } catch (e) {
        console.error("Eroare fetch:", e.message);
    }
}
fetchData();
