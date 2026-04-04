import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.FOOTBALL_API_KEY;
    const BASE_URL = 'https://v3.football.api-sports.io';
    const headers = { 'x-apisports-key': API_KEY, 'Content-Type': 'application/json' };
    const LEAGUE_ID = 283; 

    try {
        console.log("Preluare date SuperLiga...");

        // 1. Detectăm sezonul curent
        const leagueRes = await fetch(`${BASE_URL}/leagues?id=${LEAGUE_ID}`, { headers });
        const leagueData = await leagueRes.json();
        const currentSeason = leagueData.response[0].seasons.find(s => s.current).year;

        // 2. Meciuri LIVE
        const liveRes = await fetch(`${BASE_URL}/fixtures?league=${LEAGUE_ID}&live=all`, { headers });
        const liveJson = await liveRes.json();
        const liveMatches = (liveJson.response || []).map(m => ({
            id: m.fixture.id,
            home: { name: m.teams.home.name, logo: m.teams.home.logo, score: m.goals.home },
            away: { name: m.teams.away.name, logo: m.teams.away.logo, score: m.goals.away },
            status: m.fixture.status.elapsed + "'",
            isLive: true
        }));

        // 3. Program (NS = Not Started)
        const nextRes = await fetch(`${BASE_URL}/fixtures?league=${LEAGUE_ID}&season=${currentSeason}&status=NS`, { headers });
        const nextData = await nextRes.json();
        const upcoming = (nextData.response || [])
            .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
            .slice(0, 6)
            .map(m => ({
                home: { name: m.teams.home.name, logo: m.teams.home.logo },
                away: { name: m.teams.away.name, logo: m.teams.away.logo },
                timestamp: m.fixture.timestamp,
                dateStr: new Date(m.fixture.timestamp * 1000).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })
            }));

        // 4. Clasament
        const stdRes = await fetch(`${BASE_URL}/standings?league=${LEAGUE_ID}&season=${currentSeason}`, { headers });
        const stdJson = await stdRes.json();
        const standings = stdJson.response[0].league.standings[0].map(s => ({
            rank: s.rank,
            team: s.team.name,
            logo: s.team.logo,
            played: s.all.played,
            win: s.all.win,
            draw: s.all.draw,
            lose: s.all.lose,
            gd: s.goalsDiff,
            points: s.points
        }));

        const finalData = { liveMatches, upcoming, standings, updatedAt: new Date().toISOString() };
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        
    } catch (e) { console.error("Eroare:", e.message); }
}
fetchData();
