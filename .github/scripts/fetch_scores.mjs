import fs from 'fs';
import * as cheerio from 'cheerio';

async function fetchData() {
    const API_KEY = "8b8b29c474mshd383ae732d8331ap1b0325jsn05f8a83f75fa"; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST };
    const LEAGUE_ID = "189"; // SuperLiga Romania

    try {
        console.log("Incepem colectarea datelor...");
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // --- 1. COLECTARE MECIURI (API) ---
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

        // Filtrare pe categorii pentru layout-ul cu 3 coloane
        const past = processed.filter(m => m.ts < startOfToday)
            .sort((a, b) => b.ts - a.ts).slice(0, 8);

        const today = processed.filter(m => m.ts >= startOfToday && m.ts < endOfToday)
            .sort((a, b) => a.ts - b.ts);

        const future = processed.filter(m => m.ts >= endOfToday)
            .sort((a, b) => a.ts - b.ts).slice(0, 8);


        // --- 2. COLECTARE CLASAMENT (SCRAPING FOTMOB) ---
        console.log("Scraping FotMob pentru clasament complet...");
        const fotmobRes = await fetch("https://www.fotmob.com/leagues/189/table/liga-i");
        const html = await fotmobRes.text();
        const $ = cheerio.load(html);
        
        const standings = [];
        // Selector specific pentru structura tabelului FotMob
        $('.css-1768jmo-TableContainer table tr').each((i, el) => {
            const cols = $(el).find('td');
            if (cols.length >= 8) {
                standings.push({
                    rank: $(cols[0]).text().trim(),
                    name: $(cols[1]).find('span').first().text().trim() || $(cols[1]).text().trim(),
                    pj: $(cols[2]).text().trim(), // Meciuri Jucate
                    v: $(cols[3]).text().trim(),  // Victorii
                    e: $(cols[4]).text().trim(),  // Egaluri
                    i: $(cols[5]).text().trim(),  // Infrangeri
                    gd: $(cols[7]).text().trim(), // Golaveraj
                    pts: $(cols[8]).text().trim() // Puncte
                });
            }
        });

        // Daca scraping-ul a esuat, punem un mesaj de eroare in log
        if (standings.length === 0) {
            console.warn("Atentie: Nu am putut extrage datele din tabelul FotMob. Verifica selectorii CSS.");
        }

        // --- 3. SALVARE FINALA ---
        const finalData = { 
            past, 
            today, 
            future, 
            standings, 
            updatedAt: new Date().toLocaleString('ro-RO') 
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log(`Succes! Salvați: ${processed.length} meciuri și ${standings.length} echipe.`);

    } catch (e) {
        console.error("EROARE FETCH/SCRAPE:", e.message);
        // Salvam un JSON minim sa nu crape interfata TV
        fs.writeFileSync('data/superliga.json', JSON.stringify({ 
            past: [], today: [], future: [], standings: [], error: e.message 
        }));
    }
}

fetchData();
