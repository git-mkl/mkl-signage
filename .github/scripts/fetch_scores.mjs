import fs from 'fs';
import * as cheerio from 'cheerio';

async function fetchData() {
    const API_KEY = "8b8b29c474mshd383ae732d8331ap1b0325jsn05f8a83f75fa"; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189";

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // --- PART 1: MECIURI DIN API ---
        const res = await fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const json = await res.json();
        const allMatches = json.response?.matches || [];
        const now = new Date().getTime();

        const processed = allMatches.map(m => ({
            home: { name: m.home.name, score: m.home.score ?? "-" },
            away: { name: m.away.name, score: m.away.score ?? "-" },
            status: m.status.finished ? "FT" : (m.status.started ? "LIVE" : "NS"),
            ts: new Date(m.status.utcTime).getTime(),
            time: new Date(m.status.utcTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(m.status.utcTime).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })
        }));

        const past = processed.filter(m => m.status === "FT").sort((a,b) => b.ts - a.ts).slice(0, 6);
        const today = processed.filter(m => m.ts >= (now - 86400000) && m.ts <= (now + 86400000) && m.status !== "FT");
        const future = processed.filter(m => m.ts > (now + 86400000)).sort((a,b) => a.ts - b.ts).slice(0, 6);

        // --- PART 2: CLASAMENT PRIN SCRAPING (FOTMOB) ---
        console.log("Scraping FotMob pentru clasament...");
        const fotmobRes = await fetch("https://www.fotmob.com/leagues/189/table/liga-i");
        const html = await fotmobRes.text();
        const $ = cheerio.load(html);
        
        const standings = [];
        // Selectorul de mai jos caută rândurile din tabelul de clasament FotMob
        $('table tr').each((i, el) => {
            if (i === 0) return; // Sărim peste header
            const cols = $(el).find('td');
            if (cols.length >= 8) {
                standings.push({
                    rank: $(cols[0]).text().trim(),
                    name: $(cols[1]).find('span').first().text().trim() || $(cols[1]).text().trim(),
                    pj: $(cols[2]).text().trim(),
                    v: $(cols[3]).text().trim(),
                    e: $(cols[4]).text().trim(),
                    i: $(cols[5]).text().trim(),
                    gd: $(cols[7]).text().trim(),
                    pts: $(cols[8]).text().trim()
                });
            }
        });

        fs.writeFileSync('data/superliga.json', JSON.stringify({ past, today, future, standings, updatedAt: new Date().toISOString() }, null, 2));
        console.log("Date salvate! Clasament extras: " + standings.length + " echipe.");

    } catch (e) { console.error("Eroare: ", e); }
}
fetchData();
