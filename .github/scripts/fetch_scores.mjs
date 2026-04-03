import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    const today = new Date().toISOString().split('T')[0];
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };

    try {
        // 1. Programul zilei pentru România
        const schRes = await fetch(`https://${HOST}/api/v1/sport/football/scheduled-events/${today}`, { headers });
        const schJson = await schRes.json();
        const romania = (schJson.events || []).filter(m => m.category && m.category.name === "Romania");

        if (romania.length === 0) {
            console.log("Niciun meci azi.");
            return;
        }

        // Meciul principal (cel LIVE sau primul de azi)
        const main = romania.find(m => m.status.type === "inprogress") || romania[0];

        // 2. Clasamentul
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${main.tournament.uniqueTournament.id}/season/${main.season.id}/standings/total`, { headers });
        const stdJson = await stdRes.json();

        // 3. Ultimele rezultate pentru cele două echipe
        const hLastRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
        const hLastJson = await hLastRes.json();

        const aLastRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
        const aLastJson = await aLastRes.json();

        const finalData = {
            main: main,
            standings: stdJson.standings[0].rows,
            hLast: hLastJson.events[0],
            aLast: aLastJson.events[0],
            upcoming: romania.filter(m => m.id !== main.id).slice(0, 3),
            lastUpdate: new Date().toISOString()
        };

        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date salvate cu succes!");
    } catch (e) {
        console.error("Eroare:", e.message);
        process.exit(1);
    }
}

fetchData();
