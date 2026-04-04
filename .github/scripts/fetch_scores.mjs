import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = {
        'x-rapidapi-host': HOST,
        'x-rapidapi-key': API_KEY,
        'Content-Type': 'application/json'
    };

    // ID-ul extras din lista ta pentru Romania Liga I
    const LEAGUE_ID = "189"; 

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        console.log("Preluăm datele pentru SuperLiga România (ID 189)...");

        // 1. Luăm Clasamentul
        const stdRes = await fetch(`https://${HOST}/football-get-league-standings?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        
        // În acest API, datele sunt sub response.standings sau data.table
        const standingsRaw = stdJson.response?.standings?.table || stdJson.data?.table || [];

        // 2. Luăm Meciurile
        const matchRes = await fetch(`https://${HOST}/football-get-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const matchJson = await matchRes.json();
        const matchesRaw = matchJson.response?.matches || matchJson.data?.matches || [];

        // Identificăm meciul principal (Cel LIVE sau primul care urmează)
        const mainMatch = matchesRaw.find(m => m.status?.status === "LIVE") || matchesRaw[0];

        // Mapăm datele pentru index.html
        const finalData = {
            main: mainMatch ? {
                homeTeam: { 
                    id: mainMatch.homeTeam?.id || mainMatch.home_id, 
                    shortName: mainMatch.homeTeam?.name || mainMatch.home_name 
                },
                awayTeam: { 
                    id: mainMatch.awayTeam?.id || mainMatch.away_id, 
                    shortName: mainMatch.awayTeam?.name || mainMatch.away_name 
                },
                homeScore: { display: mainMatch.homeScore?.current || 0 },
                awayScore: { display: mainMatch.awayScore?.current || 0 },
                status: { 
                    description: mainMatch.status?.reason || "Programat", 
                    type: mainMatch.status?.status === "LIVE" ? "inprogress" : "notstarted" 
                },
                startTimestamp: Math.floor(new Date(mainMatch.status?.utcTime || mainMatch.date).getTime() / 1000)
            } : null,
            standings: standingsRaw.map(s => ({
                position: s.idx || s.position,
                team: { shortName: s.name, id: s.id },
                points: s.pts || s.points
            })),
            upcoming: matchesRaw.filter(m => m !== mainMatch).slice(0, 3).map(m => ({
                homeTeam: { shortName: m.homeTeam?.name || m.home_name },
                awayTeam: { shortName: m.awayTeam?.name || m.away_name },
                startTimestamp: Math.floor(new Date(m.status?.utcTime || m.date).getTime() / 1000)
            })),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Succes! Datele din România sunt salvate.");

    } catch (e) {
        console.error("Eroare la procesare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, standings: [] }));
    }
}

fetchData();
