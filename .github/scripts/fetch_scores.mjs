import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = 'free-api-live-football-data.p.rapidapi.com'; // HOST-ul NOU
    const headers = {
        'x-rapidapi-host': HOST,
        'x-rapidapi-key': API_KEY,
        'Content-Type': 'application/json'
    };

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        console.log("Pas 1: Identificăm ID-ul SuperLigii în noul API...");
        
        // În acest API, SuperLiga România are de obicei ID-ul 301 sau similar
        // Dar îl căutăm dinamic pentru siguranță
        const leagueRes = await fetch(`https://${HOST}/football-get-all-leagues`, { headers });
        const leagueJson = await leagueRes.json();
        
        // Căutăm în lista de ligi
        const leagues = leagueJson.response || leagueJson.data || [];
        const romania = leagues.find(l => l.league_name === "Romania - Liga I" || l.league_name === "Superliga");
        
        // Dacă nu îl găsim dinamic, folosim un fallback (ID-ul probabil în acest API)
        const LEAGUE_ID = romania ? romania.league_id : "301"; 

        console.log(`Utilizăm League ID: ${LEAGUE_ID}`);

        // 2. Luăm Clasamentul
        const stdRes = await fetch(`https://${HOST}/football-get-league-standings?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        const rawStandings = stdJson.response?.standings || [];

        // 3. Luăm Meciurile de azi/următoare
        const matchRes = await fetch(`https://${HOST}/football-get-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const matchJson = await matchRes.json();
        const matches = matchJson.response?.matches || [];

        // Mapăm datele pe formatul cerut de index.html
        const mainMatch = matches.find(m => m.status === "LIVE") || matches[0];

        const finalData = {
            main: mainMatch ? {
                homeTeam: { name: mainMatch.home_team_name, id: mainMatch.home_team_id, shortName: mainMatch.home_team_name },
                awayTeam: { name: mainMatch.away_team_name, id: mainMatch.away_team_id, shortName: mainMatch.away_team_name },
                homeScore: { display: mainMatch.home_score || 0 },
                awayScore: { display: mainMatch.away_score || 0 },
                status: { description: mainMatch.status, type: mainMatch.status === "LIVE" ? "inprogress" : "notstarted" },
                startTimestamp: Math.floor(new Date(mainMatch.date).getTime() / 1000)
            } : null,
            standings: rawStandings.map(s => ({
                position: s.position,
                team: { shortName: s.team_name, id: s.team_id },
                points: s.points
            })),
            upcoming: matches.slice(1, 4).map(m => ({
                homeTeam: { shortName: m.home_team_name },
                awayTeam: { shortName: m.away_team_name },
                startTimestamp: Math.floor(new Date(m.date).getTime() / 1000)
            })),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date salvate cu succes din noul API!");

    } catch (e) {
        console.error("Eroare API nou:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message }));
    }
}

fetchData();
