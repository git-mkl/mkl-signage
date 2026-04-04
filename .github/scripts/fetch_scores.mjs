import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const BASE_URL = 'https://v3.football.api-sports.io';
    const headers = {
        'x-apisports-key': API_KEY,
        'Content-Type': 'application/json'
    };

    const LEAGUE_ID = 283; // SuperLiga Romania

    try {
        console.log("Incepem preluarea datelor...");

        // 1. Detectam sezonul curent (esențial pentru API-Football)
        const leagueRes = await fetch(`${BASE_URL}/leagues?id=${LEAGUE_ID}`, { headers });
        const leagueData = await leagueRes.json();
        
        if (!leagueData.response || leagueData.response.length === 0) {
            throw new Error("Nu s-au gasit informatii despre SuperLiga (ID 283)");
        }

        const currentSeason = leagueData.response[0].seasons.find(s => s.current).year;
        console.log(`Sezon detectat: ${currentSeason}`);

        // 2. Meciuri LIVE
        const liveRes = await fetch(`${BASE_URL}/fixtures?league=${LEAGUE_ID}&live=all`, { headers });
        const liveJson = await liveRes.json();
        const liveMatches = (liveJson.response || []).map(m => ({
            id: m.fixture.id,
            home: m.teams.home.name,
            away: m.teams.away.name,
            hScore: m.goals.home,
            aScore: m.goals.away,
            minute: m.fixture.status.elapsed + "'",
            logoH: m.teams.home.logo,
            logoA: m.teams.away.logo
        }));

        // 3. Meciuri VIITOARE (Upcoming)
        const nextRes = await fetch(`${BASE_URL}/fixtures?league=${LEAGUE_ID}&next=10`, { headers });
        const nextData = await nextRes.json();
        const upcoming = (nextData.response || []).map(m => ({
            home: m.teams.home.name,
            away: m.teams.away.name,
            time: m.fixture.timestamp,
            logoH: m.teams.home.logo,
            logoA: m.teams.away.logo
        }));

        // 4. Clasament
        let standings = [];
        const stdRes = await fetch(`${BASE_URL}/standings?league=${LEAGUE_ID}&season=${currentSeason}`, { headers });
        const stdJson = await stdRes.json();
        
        if (stdJson.response && stdJson.response[0]) {
            const table = stdJson.response[0].league.standings[0];
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

        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log(`Succes! S-au gasit ${liveMatches.length} meciuri live si ${upcoming.length} viitoare.`);

    } catch (e) {
        console.error("ERRORE CRITICA:", e.message);
        process.exit(1);
    }
}

fetchData();
