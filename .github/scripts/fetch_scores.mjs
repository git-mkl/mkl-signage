import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.FOOTBALL_API_KEY; // Asigură-te că ai pus cheia în GitHub Secrets
    const BASE_URL = 'https://v3.football.api-sports.io';
    const headers = {
        'x-apisports-key': API_KEY,
        'Content-Type': 'application/json'
    };

    const LEAGUE_ID = 283; // SuperLiga Romania
    const SEASON = 2025; // Sezonul curent

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Preluăm meciurile LIVE (Live & In-Play)
        const liveRes = await fetch(`${BASE_URL}/fixtures?league=${LEAGUE_ID}&live=all`, { headers });
        const liveData = await liveRes.json();
        const liveMatches = (liveData.response || []).map(m => ({
            id: m.fixture.id,
            home: m.teams.home.name,
            away: m.teams.away.name,
            hScore: m.goals.home,
            aScore: m.goals.away,
            minute: m.fixture.status.elapsed + "'",
            logoH: m.teams.home.logo,
            logoA: m.teams.away.logo
        }));

        // 2. Preluăm Programul (Următoarele meciuri)
        const nextRes = await fetch(`${BASE_URL}/fixtures?league=${LEAGUE_ID}&season=${SEASON}&next=10`, { headers });
        const nextData = await nextRes.json();
        const upcoming = (nextData.response || [])
            .filter(m => !liveMatches.find(l => l.id === m.fixture.id))
            .map(m => ({
                id: m.fixture.id,
                home: m.teams.home.name,
                away: m.teams.away.name,
                time: m.fixture.timestamp,
                logoH: m.teams.home.logo,
                logoA: m.teams.away.logo
            }));

        // 3. Preluăm Clasamentul
        let standings = [];
        const stdRes = await fetch(`${BASE_URL}/standings?league=${LEAGUE_ID}&season=${SEASON}`, { headers });
        const stdData = await stdRes.json();
        
        if (stdData.response && stdData.response[0]) {
            const table = stdData.response[0].league.standings[0];
            standings = table.map(s => ({
                pos: s.rank,
                name: s.team.name,
                pj: s.all.played,
                pts: s.points,
                logo: s.team.logo
            }));
        }

        const finalData = {
            liveMatches,
            upcoming,
            standings,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Datele de la API-Football au fost salvate.");

    } catch (e) {
        console.error("Eroare API-Football:", e.message);
    }
}

fetchData();
