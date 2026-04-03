import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        console.log("Pas 1: Căutăm ID-ul pentru SuperLiga România...");
        
        // Luăm toate categoriile (țările)
        const catRes = await fetch(`https://${HOST}/api/v1/sport/football/categories`, { headers });
        const catJson = await catRes.json();
        const romaniaCat = catJson.categories.find(c => c.name === "Romania");

        if (!romaniaCat) throw new Error("Nu am găsit categoria 'Romania' în API.");
        console.log(`Categorie găsită: Romania (ID: ${romaniaCat.id})`);

        // Luăm toate turneele din România
        const tourRes = await fetch(`https://${HOST}/api/v1/category/${romaniaCat.id}/unique-tournaments`, { headers });
        const tourJson = await tourRes.json();
        
        // Căutăm "Superliga" sau "Liga I"
        const superliga = tourJson.groups[0].uniqueTournaments.find(t => 
            t.name.includes("Superliga") || t.name.includes("Liga I")
        );

        if (!superliga) throw new Error("Nu am găsit 'Superliga' în lista de turnee din România.");
        const TOURNAMENT_ID = superliga.id;
        console.log(`Turneu găsit: ${superliga.name} (ID: ${TOURNAMENT_ID})`);

        // Pas 2: Luăm cel mai recent sezon
        const seasonRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/seasons`, { headers });
        const seasonJson = await seasonRes.json();
        const currentSeasonId = seasonJson.seasons[0].id;
        console.log(`Sezon activ: ${seasonJson.seasons[0].name} (ID: ${currentSeasonId})`);

        // Pas 3: Luăm Clasamentul
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/standings/total`, { headers });
        const stdJson = await stdRes.json();
        const standings = stdJson.standings[0].rows;

        // Pas 4: Luăm evenimentele următoare
        const nextRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${TOURNAMENT_ID}/season/${currentSeasonId}/events/next/0`, { headers });
        const nextJson = await nextRes.json();
        const allNext = nextJson.events || [];

        let main = allNext.find(m => m.status.type === "inprogress") || allNext[0];
        let hLast = null, aLast = null;

        if (main) {
            // Pas 5: Rezultate anterioare pentru Hero Card
            const hRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
            const hJ = await hRes.json(); hLast = hJ.events?.[0] || null;

            const aRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
            const aJ = await aRes.json(); aLast = aJ.events?.[0] || null;
        }

        const finalData = {
            main,
            standings,
            hLast,
            aLast,
            upcoming: allNext.filter(m => m.id !== main.id).slice(0, 3),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date salvate cu succes pentru SuperLiga România!");

    } catch (e) {
        console.error("EROARE:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message }));
    }
}

fetchData();
