import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const BASE_URL = 'https://v3.football.api-sports.io';
    const headers = {
        'x-apisports-key': API_KEY,
        'Content-Type': 'application/json'
    };

    const LEAGUE_ID = 283; 
    const TEST_SEASON = 2024; // Planul Free permite acces la 2024

    try {
        console.log(`Preluăm date pentru sezonul de test: ${TEST_SEASON}`);

        // 1. Meciuri (Folosim fixtures din 2024 pentru a vedea date)
        const res = await fetch(`${BASE_URL}/fixtures?league=${LEAGUE_ID}&season=${TEST_SEASON}&last=10`, { headers });
        const json = await res.json();
        
        // Simulăm "Live" cu ultimele meciuri jucate sau le punem la Upcoming
        const matches = (json.response || []).map(m => ({
            home: m.teams.home.name,
            away: m.teams.away.name,
            hScore: m.goals.home,
            aScore: m.goals.away,
            time: m.fixture.timestamp,
            logoH: m.teams.home.logo,
            logoA: m.teams.away.logo,
            status: m.fixture.status.short
        }));

        // 2. Clasament 2024
        let standings = [];
        const stdRes = await fetch(`${BASE_URL}/standings?league=${LEAGUE_ID}&season=${TEST_SEASON}`, { headers });
        const stdJson = await stdRes.json();
        
        if (stdJson.response && stdJson.response[0]) {
            standings = stdJson.response[0].league.standings[0].map(s => ({
                pos: s.rank,
                name: s.team.name,
                pj: s.all.played,
                pts: s.points,
                logo: s.team.logo
            }));
        }

        const finalData = {
            liveMatches: [], // In planul Free 2025 e blocat, deci live va fi gol
            upcoming: matches.slice(0, 5),
            standings: standings,
            updatedAt: new Date().toISOString()
        };

        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log("Datele istorice (2024) au fost incarcate pentru testare.");

    } catch (e) {
        console.error("Eroare:", e.message);
    }
}
fetchData();
