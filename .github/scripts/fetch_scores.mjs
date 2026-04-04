import fs from 'fs';

async function fetchData() {
    const API_KEY = process.env.RAPIDAPI_KEY;
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const headers = {
        'x-rapidapi-host': HOST,
        'x-rapidapi-key': API_KEY,
        'Content-Type': 'application/json'
    };

    const LEAGUE_ID = 189; // Liga I România

    try {
        if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

        // 1. Verificăm dacă sunt meciuri LIVE acum
        console.log("Căutăm meciuri LIVE...");
        const liveRes = await fetch(`https://${HOST}/football-current-live`, { headers });
        const liveJson = await liveRes.json();
        const liveMatch = liveJson.response?.live?.find(m => m.leagueId === LEAGUE_ID);

        // 2. Preluăm programul complet pentru clasament și meciuri viitoare
        console.log("Preluăm programul complet și clasamentul...");
        const [matchRes, stdRes] = await Promise.all([
            fetch(`https://${HOST}/football-get-all-matches-by-league?leagueid=${LEAGUE_ID}`, { headers }),
            fetch(`https://${HOST}/football-get-standings?leagueid=${LEAGUE_ID}`, { headers })
        ]);

        const matchJson = await matchRes.json();
        const stdJson = await stdRes.json();

        const matchesRaw = matchJson.response?.matches || [];
        const standingsRaw = stdJson.response?.standings?.table?.all || 
                           stdJson.response?.standings?.[0]?.table?.all || [];

        // 3. Alegem ce afișăm pe cardul principal
        let mainMatchData = null;

        if (liveMatch) {
            console.log("Avem meci LIVE: " + liveMatch.home.name);
            mainMatchData = {
                homeTeam: { shortName: liveMatch.home.name },
                awayTeam: { shortName: liveMatch.away.name },
                homeScore: { display: liveMatch.home.score },
                awayScore: { display: liveMatch.away.score },
                status: { 
                    description: liveMatch.status?.liveTime?.short || "LIVE", 
                    type: "inprogress" 
                },
                startTimestamp: Math.floor(liveMatch.timeTS / 1000)
            };
        } else {
            // Dacă nu e live, luăm primul meci care nu e terminat
            const upcomingMatch = matchesRaw.find(m => !m.status?.finished);
            if (upcomingMatch) {
                mainMatchData = {
                    homeTeam: { shortName: upcomingMatch.home?.name },
                    awayTeam: { shortName: upcomingMatch.away?.name },
                    homeScore: { display: upcomingMatch.home?.score ?? 0 },
                    awayScore: { display: upcomingMatch.away?.score ?? 0 },
                    status: { 
                        description: "Programat", 
                        type: "notstarted" 
                    },
                    startTimestamp: Math.floor(new Date(upcomingMatch.status?.utcTime).getTime() / 1000)
                };
            }
        }

        // 4. Structurăm rezultatul final
        const finalData = {
            main: mainMatchData,
            standings: standingsRaw.slice(0, 10).map(s => ({
                position: s.idx || s.rank || 0,
                team: { shortName: s.name, id: s.id },
                points: s.pts || 0
            })),
            upcoming: matchesRaw
                .filter(m => !m.status?.finished && m.id !== (liveMatch?.id || matchesRaw.find(x => !x.status?.finished)?.id))
                .slice(0, 3)
                .map(m => ({
                    homeTeam: { shortName: m.home?.name },
                    awayTeam: { shortName: m.away?.name },
                    startTimestamp: Math.floor(new Date(m.status?.utcTime).getTime() / 1000)
                })),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData));
        console.log("Fișier generat cu succes!");

    } catch (e) {
        console.error("Eroare:", e.message);
        fs.writeFileSync('data/superliga.json', JSON.stringify({ error: e.message, updatedAt: new Date().toISOString() }));
    }
}

fetchData();
