import fs from 'fs';

async function fetchStandings() {
    try {
        console.log("--- START FETCH STANDINGS (FotMob JSON) ---");
        // User-Agent pentru a evita blocarea de catre FotMob
        const res = await fetch("https://www.fotmob.com/api/leagues?id=189&ccode3=ROU", {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
        });
        
        const fotmobData = await res.json();
        const tableData = fotmobData.table?.[0]?.data?.table?.all || [];
        
        const standings = tableData.map(s => ({
            rank: s.idx,
            name: s.name,
            pj: s.played,
            v: s.wins,
            e: s.draws,
            i: s.losses,
            gd: s.goalConDiff,
            pts: s.pts
        }));

        // Merge logic
        let currentJSON = { past: [], today: [], future: [] };
        if (fs.existsSync('data/superliga.json')) {
            currentJSON = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
        }

        const finalOutput = { ...currentJSON, standings: standings, updatedAt: new Date().toLocaleString('ro-RO') };
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalOutput, null, 2));
        
        console.log(`Succes: Clasament actualizat cu ${standings.length} echipe.`);
    } catch (e) {
        console.error("Eroare la clasament:", e.message);
    }
}
fetchStandings();
