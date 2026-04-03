import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };
    
    // ID-ul BATUT IN CUIE pentru SuperLiga România este 48
    const TOURNAMENT_ID = 48; 

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Identificăm Sezonul Actual
        const seasonRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/seasons`, { headers });
        const seasonJson = await seasonRes.json();
        const currentSeasonId = seasonJson.seasons[0].id; 

        // 2. Clasamentul României
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/standings/total`, { headers });
        const stdJson = await stdRes.json();
        const standings = stdJson.standings[0].rows;

        // 3. Următoarele meciuri din SuperLigă
        const nextRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/events/next/0`, { headers });
        const nextJson = await nextRes.json();
        const allNext = nextJson.events || [];

        if (allNext.length === 0) {
            console.log("Final de campionat sau eroare date.");
            return;
        }

        // 4. Meciul de afișat (Cel LIVE sau următorul)
        const main = allNext.find(m => m.status.type === "inprogress") || allNext[0];

        // 5. Query pentru rezultatele din etapa trecută (Last 1)
        const hLastRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
        const hLastJson = await hLastRes.json();
        const aLastRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
        const aLastJson = await aLastRes.json();

        const finalData = {
            main: main,
            standings: standings,
            hLast: hLastJson.events ? hLastJson.events[0] : null,
            aLast: aLastJson.events ? aLastJson.events[0] : null,
            upcoming: allNext.filter(m => m.id !== main.id).slice(0, 3),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Succes! Am salvat SuperLiga România.");

    } catch (e) {
        console.error("Eroare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, standings: [] }));
    }
}

fetchData();
