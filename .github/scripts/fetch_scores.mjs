import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };
    
    // SuperLiga România IDs
    const TOURNAMENT_ID = 37;
    const SEASON_ID = 63656; 

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Luăm CLASAMENTUL
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${SEASON_ID}/standings/total`, { headers });
        const stdJson = await stdRes.json();
        const standings = stdJson.standings[0].rows;

        // 2. Luăm TOATE meciurile următoare (Next Events)
        const nextRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${SEASON_ID}/events/next/0`, { headers });
        const nextJson = await nextRes.json();
        const allNext = nextJson.events || [];

        if (allNext.length === 0) {
            console.log("Nu mai sunt meciuri în program.");
            return;
        }

        // 3. Alegem meciul principal (Cel LIVE sau primul din listă)
        const main = allNext.find(m => m.status.type === "inprogress") || allNext[0];

        // 4. Luăm ultimele rezultate (etapa trecută) pentru ambele echipe din Hero
        const hLastRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
        const hLastJson = await hLastRes.json();
        const aLastRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
        const aLastJson = await aLastRes.json();

        const finalData = {
            main: main,
            standings: standings,
            hLast: hLastJson.events[0] || null,
            aLast: aLastJson.events[0] || null,
            upcoming: allNext.filter(m => m.id !== main.id).slice(0, 3),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Succes! Meci detectat: " + main.homeTeam.shortName + " vs " + main.awayTeam.shortName);

    } catch (e) {
        console.error("Eroare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, standings: [] }));
    }
}

fetchData();
