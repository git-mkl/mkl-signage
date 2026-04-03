import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };
    
    // ID-uri SuperLiga România
    const TOURNAMENT_ID = 37;
    const SEASON_ID = 63656; // Sezonul 24/25 sau 25/26

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Luăm CLASAMENTUL (mereu necesar pentru sidebar)
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${SEASON_ID}/standings/total`, { headers });
        const stdJson = await stdRes.json();
        const standings = stdJson.standings[0].rows;

        // 2. Luăm TOATE meciurile următoare din sezon
        const nextRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${SEASON_ID}/events/next/0`, { headers });
        const nextJson = await nextRes.json();
        const allNextEvents = nextJson.events || [];

        // 3. Identificăm meciul principal (Cel LIVE sau următorul cel mai apropiat)
        let main = allNextEvents.find(m => m.status.type === "inprogress") || allNextEvents[0];

        if (!main) {
            console.log("Nu s-au găsit meciuri viitoare.");
            return;
        }

        // 4. Luăm ultimele rezultate pentru echipele din HERO (Etapa trecută)
        const hLastRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
        const hLastJson = await hLastRes.json();
        const aLastRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
        const aLastJson = await aLastRes.json();

        // 5. Pregătim datele finale
        const finalData = {
            main: main,
            standings: standings,
            hLast: hLastJson.events[0] || null,
            aLast: aLastJson.events[0] || null,
            upcoming: allNextEvents.filter(m => m.id !== main.id).slice(0, 3), // Următoarele 3 după Hero
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date actualizate cu succes pentru: " + main.homeTeam.shortName + " vs " + main.awayTeam.shortName);

    } catch (e) {
        console.error("Eroare:", e.message);
        // Salvăm eroarea dar păstrăm structura ca să nu crape HTML-ul
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, standings: [] }));
    }
}

fetchData();
