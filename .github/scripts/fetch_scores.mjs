import fs from 'fs';

async function fetchData() {
    const API_KEY = "8b8b29c474mshd383ae732d8331ap1b0325jsn05f8a83f75fa"; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189";

    try {
        console.log("Incepem colectarea datelor...");
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // --- 1. MECIURI (API RAPIDAPI) ---
        const res = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const json = await res.json();
        const allMatches = json.response?.matches || [];
        
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

        const past = processed.filter(m => m.ts < startOfToday).sort((a, b) => b.ts - a.ts).slice(0, 8);
        const today = processed.filter(m => m.ts >= startOfToday && m.ts < endOfToday).sort((a, b) => a.ts - b.ts);
        const future = processed.filter(m => m.ts >= endOfToday).sort((a, b) => a.ts - b.ts).slice(0, 8);

        // --- 2. CLASAMENT (FOTMOB JSON API - FĂRĂ SCRAPING) ---
        console.log("Preluare clasament prin API-ul intern FotMob...");
        
        // Folosim un User-Agent de browser real pentru a evita blocarea
        const fotmobRes = await fetch("https://www.fotmob.com/api/leagues?id=189&ccode3=ROU", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        
        const fotmobData = await fotmobRes.json();
        const tableData = fotmobData.table?.[0]?.data?.table?.all || [];
        
        const standings = tableData.map(s => ({
            rank: s.idx,
            name: s.name,
            pj: s.played,
            v: s.wins,
            e: s.draws,
            i: s.losses,
            gd: s.goalConDiff, // Golaveraj
            pts: s.pts
        }));

        console.log(`Am gasit ${standings.length} echipe in clasament.`);

        // --- 3. SALVARE ---
        const finalData = { 
            past, 
            today, 
            future, 
            standings, 
            updatedAt: new Date().toLocaleString('ro-RO') 
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log("Fisierul superliga.json a fost salvat cu succes.");

    } catch (e) {
        console.error("EROARE:", e.message);
    }
}

fetchData();
