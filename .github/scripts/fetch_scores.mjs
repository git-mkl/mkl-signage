import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };
    const TOURNAMENT_ID = 48; // SuperLiga Romania

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        console.log("Căutăm sezoanele pentru SuperLiga...");
        const seasonRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/seasons`, { headers });
        const seasonJson = await seasonRes.json();

        if (!seasonJson?.seasons?.length) {
            throw new Error("API-ul nu a returnat niciun sezon pentru ID 48.");
        }
        
        // Luăm cel mai recent sezon (primul din listă)
        const currentSeasonId = seasonJson.seasons[0].id;
        console.log(`Sezon detectat: ${seasonJson.seasons[0].name} (ID: ${currentSeasonId})`);

        // 1. Clasament
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/standings/total`, { headers });
        const stdJson = await stdRes.json();
        const standings = stdJson?.standings?.[0]?.rows || [];

        // 2. Meciuri (Următoarele)
        const nextRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/events/next/0`, { headers });
        const nextJson = await nextRes.json();
        const allNext = nextJson?.events || [];

        if (!allNext.length) {
            console.log("Nu sunt meciuri viitoare. Salvăm doar clasamentul.");
            fs.writeFileSync('data/superliga.json', JSON.stringify({ info: "Fără meciuri programate", standings }));
            return;
        }

        // 3. Meciul principal (Hero)
        const main = allNext.find(m => m.status.type === "inprogress") || allNext[0];

        // 4. Rezultate etapa trecută pentru echipele din Hero
        let hLast = null, aLast = null;
        try {
            const hRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
            const hJ = await hRes.json(); hLast = hJ.events?.[0] || null;

            const aRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
            const aJ = await aRes.json(); aLast = aJ.events?.[0] || null;
        } catch (err) { console.log("Eroare la preluare rezultate anterioare."); }

        const finalData = {
            main,
            standings,
            hLast,
            aLast,
            upcoming: allNext.filter(m => m.id !== main.id).slice(0, 3),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date salvate cu succes!");

    } catch (e) {
        console.error("CRITICAL ERROR:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, standings: [] }));
    }
}

fetchData();
