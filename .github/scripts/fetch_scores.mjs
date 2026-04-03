import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const today = new Date().toISOString().split('T')[0];
    const url = `https://sportapi7.p.rapidapi.com/api/v1/sport/football/scheduled-events/${today}`;

    try {
        const res = await fetch(url, {
            headers: { "X-RapidAPI-Host": "sportapi7.p.rapidapi.com", "X-RapidAPI-Key": API_KEY }
        });
        const json = await res.json();
        
        // Filtrăm pentru România (ca în funcția Netlify)
        const romania = (json.events || []).filter(m => m.category && m.category.name === "Romania");
        
        // Salvăm datele într-un fișier local
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(romania));
        
        console.log("Datele au fost actualizate cu succes!");
    } catch (e) {
        console.error("Eroare la fetch:", e.message);
        process.exit(1);
    }
}

fetchData();
