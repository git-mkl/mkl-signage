import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = {
        'x-rapidapi-host': HOST,
        'x-rapidapi-key': API_KEY,
        'Content-Type': 'application/json'
    };

    const LEAGUE_ID = "189"; // ID-ul confirmat de tine pentru Liga I

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        console.log("Preluăm clasamentul...");
        const stdRes = await fetch(`https://${HOST}/football-get-league-standings?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        
        // Debug: vedem în log-ul GitHub cum arată datele
        console.log("Structura clasament primită:", JSON.stringify(stdJson).substring(0, 200));

        // Extragem tabelul (verificăm multiple căi posibile)
        const standingsRaw = stdJson.response?.standings?.table?.all || 
                           stdJson.response?.standings?.[0]?.table || 
                           stdJson.data?.table || [];

        console.log("Preluăm meciurile...");
        const matchRes = await fetch(`https://${HOST}/football-get-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const matchJson = await matchRes.json();
        
        const matchesRaw = matchJson.response?.matches || matchJson.data?.matches || [];

        // Identificăm meciul principal (Cel LIVE sau primul din listă)
        const mainMatch = matchesRaw.find(m => m.status?.started && !m.status?.finished) || matchesRaw[0];

        // Mapăm datele pentru a fi compatibile cu index.html
        const finalData = {
            main: mainMatch ? {
                homeTeam: { 
                    id: mainMatch.home?.id || mainMatch.homeTeam?.id, 
                    shortName: mainMatch.home?.name || mainMatch.homeTeam?.name 
                },
                awayTeam: { 
                    id: mainMatch.away?.id || mainMatch.awayTeam?.id, 
                    shortName: mainMatch.away?.name || mainMatch.awayTeam?.name 
                },
                homeScore: { display: mainMatch.home?.score ?? mainMatch.scores?.homeScore ?? 0 },
                awayScore: { display: mainMatch.away?.score ?? mainMatch.scores?.awayScore ?? 0 },
                status: { 
                    description: mainMatch.status?.reason || "Programat", 
                    type: (mainMatch.status?.started && !mainMatch.status?.finished) ? "inprogress" : "notstarted" 
                },
                startTimestamp: Math.floor(new Date(mainMatch.status?.utcTime || mainMatch.date).getTime() / 1000)
            } : null,
            standings: standingsRaw.map(s => ({
                position: s.idx || s.rank || s.position,
                team: { shortName: s.name || s.teamName, id: s.id || s.teamId },
                points: s.pts || s.points
            })),
            upcoming: matchesRaw.filter(m => m !== mainMatch).slice(0, 3).map(m => ({
                homeTeam: { shortName: m.home?.name || m.homeTeam?.name },
                awayTeam: { shortName: m.away?.name || m.awayTeam?.name },
                startTimestamp: Math.floor(new Date(m.status?.utcTime || m.date).getTime() / 1000)
            })),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Date salvate cu succes!");

    } catch (e) {
        console.error("Eroare la procesare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, updatedAt: new Date().toISOString() }));
    }
}

fetchData();
