import fs from 'fs';

async function fetchMatches() {
    const API_KEY = process.env.RAPIDAPI_KEY; 
    const HOST = 'free-api-live-football-data.p.rapidapi.com';
    const url = 'https://free-api-live-football-data.p.rapidapi.com/football-get-all-matches-by-league?leagueid=189';
    
    try {
        const res = await fetch(url, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': HOST }
        });
        const response = await res.json();
        const allMatches = response.response?.matches || [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const processed = allMatches.map(m => {
            const matchDate = new Date(m.status.utcTime);
            let phase = "Sezon Regular";
            const stageName = (m.leagueName || m.roundName || "").toLowerCase();
            
            if (stageName.includes("championship") || stageName.includes("play-off")) {
                phase = "Play-off";
            } else if (stageName.includes("relegation") || stageName.includes("play-out")) {
                phase = "Play-out";
            }

            // Calculăm minutul dacă meciul e live (aproximativ pe baza timpului de start)
            let matchTime = matchDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Bucharest' });
            if (m.status.started && !m.status.finished) {
                let diffMins = Math.floor((now.getTime() - matchDate.getTime()) / 60000);
                if(diffMins > 45) diffMins -= 15; // Aproximare pauză
                matchTime = diffMins > 0 ? diffMins + "'" : "LIVE";
            }

            return {
                home: { name: m.home.name, score: m.home.score ?? "-", id: m.home.id },
                away: { name: m.away.name, score: m.away.score ?? "-", id: m.away.id },
                status: m.status.finished ? "FT" : (m.status.started ? "LIVE" : "NS"),
                phase: phase,
                date: matchDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', timeZone: 'Europe/Bucharest' }),
                time: matchTime,
                ts: matchDate.getTime()
            };
        });

        const matchData = {
            past: processed.filter(m => m.ts < startOfToday).sort((a, b) => b.ts - a.ts).slice(0, 10),
            today: processed.filter(m => m.ts >= startOfToday && m.ts < (startOfToday + 86400000)),
            future: processed.filter(m => m.ts >= (startOfToday + 86400000)).sort((a, b) => a.ts - b.ts).slice(0, 10)
        };

        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(matchData, null, 2));
        console.log("Sincronizare completă - Live Minute Tracker adăugat.");
    } catch (e) { console.error("Eroare API:", e.message); }
}
fetchMatches();
