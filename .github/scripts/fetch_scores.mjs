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

        // 1. Preluare meciuri LIVE
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

        // 2. Preluare program complet
        const allRes = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const allJson = await allRes.json();
        const matchesRaw = allJson.response?.matches || [];

        const upcoming = matchesRaw
            .filter(m => !m.status?.finished && !liveMatches.find(l => l.id == m.id))
            .slice(0, 4) // Luăm 4: unul pentru Hero (dacă nu e live) și 3 pentru bottom
            .map(m => ({
                home: m.home.name,
                away: m.away.name,
                time: Math.floor(new Date(m.status.utcTime).getTime() / 1000)
            }));

        // 3. Preluare Clasament
        let standings = [];
        try {
            const stdRes = await fetch(`https://${HOST}/football-get-standing-all?leagueid=${LEAGUE_ID}`, { headers });
            const stdJson = await stdRes.json();
            if (stdJson.status === "success") {
                standings = (stdJson.response?.standings?.[0]?.table?.all || []).slice(0, 10).map(s => ({
                    pos: s.idx || s.rank,
                    name: s.name,
                    pts: s.pts
                }));
            }
        } catch (e) { console.log("Standings failed, skipping."); }

        const finalData = { 
            liveMatches, 
            upcoming, 
            standings, 
            updatedAt: new Date().toISOString() 
        };
        
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("JSON actualizat cu succes.");
    } catch (e) {
        console.error("Eroare generală:", e.message);
    }
}
fetchData();
