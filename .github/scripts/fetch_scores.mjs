import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = "sportapi7.p.rapidapi.com";
    
    // Luăm data de ieri și de azi pentru a fi siguri că prindem rezultatul FCSB
    const today = new Date().toISOString().split('T')[0];
    const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };

    try {
        // CREĂM FOLDERUL DATA (Dacă nu există)
        if (!fs.existsSync('data')) {
            fs.mkdirSync('data', { recursive: true });
        }

        const schRes = await fetch(`https://${HOST}/api/v1/sport/football/scheduled-events/${today}`, { headers });
        const schJson = await schRes.json();
        const romania = (schJson.events || []).filter(m => m.category && m.category.name === "Romania");

        // Dacă nu găsește meciuri azi, creăm un fișier de siguranță ca să nu dea eroare bot-ul
        if (romania.length === 0) {
            console.log("Niciun meci găsit pentru data de azi.");
            fs.writeFileSync('data/superliga.json', JSON.stringify({ info: "No matches today", standings: [], upcoming: [] }));
            return;
        }

        const main = romania.find(m => m.status.type === "inprogress") || romania[0];
        
        // Luăm clasamentul
        const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${main.tournament.uniqueTournament.id}/season/${main.season.id}/standings/total`, { headers });
        const stdJson = await stdRes.json();

        const finalData = {
            main: main,
            standings: stdJson.standings[0].rows,
            upcoming: romania.filter(m => m.id !== main.id).slice(0, 3),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date salvate cu succes în data/superliga.json");

    } catch (e) {
        console.error("Eroare la procesare:", e.message);
        // Salvăm eroarea în fișier ca să nu crape procesul de Git
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message }));
    }
}

fetchData();
