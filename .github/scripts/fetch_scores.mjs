import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = {
        'x-rapidapi-host': HOST,
        'x-rapidapi-key': API_KEY,
        'Content-Type': 'application/json'
    };

    // Folosim parametrul exact din testul tău: leagueid=189
    const LEAGUE_ID = "189"; 

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. PRELUĂM CLASAMENTUL
        console.log("Preluăm clasamentul pentru Liga I...");
        const stdRes = await fetch(`https://${HOST}/football-get-standings?leagueid=${LEAGUE_ID}`, { headers });
        const stdJson = await stdRes.json();
        
        // Extragem tabelul (Structura FotMob standard)
        const standingsRaw = stdJson.response?.standings?.table?.all || 
                           stdJson.response?.standings?.[0]?.table || [];

        // 2. PRELUĂM MECIURILE
        console.log("Preluăm meciurile...");
        const matchRes = await fetch(`https://${HOST}/football-get-matches-by-league?leagueid=${LEAGUE_ID}`, { headers });
        const matchJson = await matchRes.json();
        
        // În acest API, meciurile sunt de obicei în response.matches sau response.data
        const matchesRaw = matchJson.response?.matches || matchJson.data || [];

        // Alegem meciul principal (Cel LIVE sau primul din listă)
        const mainMatch = matchesRaw.find(m => m.status?.started && !m.status?.finished) || matchesRaw[0];

        // 3. CONSTRUIM FIȘIERUL JSON PENTRU TV
        const finalData = {
            main: mainMatch ? {
                homeTeam: { 
                    id: mainMatch.home?.id, 
                    shortName: mainMatch.home?.name 
                },
                awayTeam: { 
                    id: mainMatch.away?.id, 
                    shortName: mainMatch.away?.name 
                },
                homeScore: { display: mainMatch.home?.score ?? 0 },
                awayScore: { display: mainMatch.away?.score ?? 0 },
                status: { 
                    description: mainMatch.status?.reason || "Programat", 
                    type: (mainMatch.status?.started && !mainMatch.status?.finished) ? "inprogress" : "notstarted" 
                },
                startTimestamp: Math.floor(new Date(mainMatch.status?.utcTime || mainMatch.date).getTime() / 1000)
            } : null,
            standings: standingsRaw.map(s => ({
                position: s.idx || s.rank || 0,
                team: { shortName: s.name, id: s.id },
                points: s.pts || 0
            })),
            upcoming: matchesRaw.filter(m => m !== mainMatch).slice(0, 3).map(m => ({
                homeTeam: { shortName: m.home?.name },
                awayTeam: { shortName: m.away?.name },
                startTimestamp: Math.floor(new Date(m.status?.utcTime || m.date).getTime() / 1000)
            })),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Succes! Panoul de control a fost actualizat.");

    } catch (e) {
        console.error("Eroare la procesare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ 
            error: e.message, 
            updatedAt: new Date().toISOString() 
        }));
    }
}

fetchData();
