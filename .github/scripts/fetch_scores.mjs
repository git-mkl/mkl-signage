import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };
    const TOURNAMENT_ID = 37; // SuperLiga Romania constant ID

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Aflăm ID-ul sezonului ACTUAL (ca să nu mai crape)
        const seasonRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/seasons`, { headers });
        const seasonJson = await seasonRes.json();
        const currentSeasonId = seasonJson.seasons[0].id; 

        // 2. Luăm CLASAMENTUL folosind ID-ul proaspăt aflat
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/standings/total`, { headers });
        const stdJson = await stdRes.json();
        
        let standings = [];
        if (stdJson.standings && stdJson.standings[0] && stdJson.standings[0].rows) {
            standings = stdJson.standings[0].rows;
        }

        // 3. Luăm TOATE meciurile următoare
        const nextRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/events/next/0`, { headers });
        const nextJson = await nextRes.json();
        const allNext = nextJson.events || [];

        if (allNext.length === 0) {
            fs.writeFileSync('data/superliga.json', JSON.stringify({ info: "Final de sezon sau pauză", standings: standings }));
            return;
        }

        // 4. Meciul principal (Live sau următorul)
        const main = allNext.find(m => m.status.type === "inprogress") || allNext[0];

        // 5. Ultimele rezultate (Etapa trecută) - doar dacă avem un meci principal
        let hLast = null, aLast = null;
        if (main) {
            const hRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
            const hJ = await hRes.json(); hLast = hJ.events ? hJ.events[0] : null;

            const aRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
            const aJ = await aRes.json(); aLast = aJ.events ? aJ.events[0] : null;
        }

        const finalData = {
            main: main,
            standings: standings,
            hLast: hLast,
            aLast: aLast,
            upcoming: allNext.filter(m => m.id !== main.id).slice(0, 3),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Succes! Datele au fost salvate corect.");

    } catch (e) {
        console.error("Eroare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, standings: [] }));
    }
}

fetchData();
