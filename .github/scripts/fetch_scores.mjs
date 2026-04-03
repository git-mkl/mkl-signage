import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };
    
    // ID-ul corect pentru SuperLiga România este 216
    const TOURNAMENT_ID = 216; 

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Aflăm ID-ul sezonului ACTUAL pentru România
        const seasonRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/seasons`, { headers });
        const seasonJson = await seasonRes.json();
        const currentSeasonId = seasonJson.seasons[0].id; 

        // 2. Luăm CLASAMENTUL SuperLigii
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/standings/total`, { headers });
        const stdJson = await stdRes.json();
        const standings = stdJson.standings[0].rows;

        // 3. Luăm evenimentele următoare din SuperLigă
        const nextRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/events/next/0`, { headers });
        const nextJson = await nextRes.json();
        const allNext = nextJson.events || [];

        if (allNext.length === 0) {
            console.log("Nu sunt meciuri programate.");
            return;
        }

        // 4. Alegem meciul principal (Cel LIVE sau următorul)
        const main = allNext.find(m => m.status.type === "inprogress") || allNext[0];

        // 5. Ultimele rezultate (etapa trecută) pentru echipele din România
        const hRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
        const hJ = await hRes.json();
        const aRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
        const aJ = await aRes.json();

        const finalData = {
            main: main,
            standings: standings,
            hLast: hJ.events ? hJ.events[0] : null,
            aLast: aJ.events ? aJ.events[0] : null,
            upcoming: allNext.filter(m => m.id !== main.id).slice(0, 3),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date salvate pentru România: " + main.homeTeam.shortName + " vs " + main.awayTeam.shortName);

    } catch (e) {
        console.error("Eroare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, standings: [] }));
    }
}

fetchData();
