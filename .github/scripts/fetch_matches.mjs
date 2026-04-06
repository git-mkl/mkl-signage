import fs from 'fs';

async function fetchSuperligaData() {
    const API_KEY = process.env.RAPIDAPI_KEY; 
    const HOST = 'livescore6.p.rapidapi.com';
    const headers = {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': HOST,
        'Content-Type': 'application/json'
    };

    try {
        const stages = ['liga-1-championship-group', 'liga-1-relegation-group'];
        let allProcessedMatches = [];
        let finalData = {
            past: [], today: [], future: [],
            standingsPlayoff: [], standingsPlayout: []
        };

        for (const stage of stages) {
            const url = `https://livescore6.p.rapidapi.com/matches/v2/list-by-league?Category=soccer&Ccd=romania&Scd=${stage}&Timezone=3`;
            const res = await fetch(url, { headers });
            const json = await res.json();
            
            const events = json.Stages?.[0]?.Events || [];
            const phaseName = stage.includes('championship') ? 'Play-off' : 'Play-out';

            events.forEach(m => {
                const esdStr = m.Esd.toString();
                const year = parseInt(esdStr.substring(0, 4));
                const month = parseInt(esdStr.substring(4, 6)) - 1;
                const day = parseInt(esdStr.substring(6, 8));
                const hour = parseInt(esdStr.substring(8, 10));
                const min = parseInt(esdStr.substring(10, 12));
                
                const matchDate = new Date(year, month, day, hour, min);
                const dateRo = matchDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
                const timeRo = matchDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', hour12: false });

                const homeId = m.T1[0].Img ? m.T1[0].Img.replace('enet/', '').replace('.png', '') : m.T1[0].ID;
                const awayId = m.T2[0].Img ? m.T2[0].Img.replace('enet/', '').replace('.png', '') : m.T2[0].ID;

                let status = "NS";
                let matchTime = timeRo;
                
                if (m.Eps === "FT" || m.Eps === "AET" || m.Eps === "AP") {
                    status = "FT";
                } else if (m.Eps === "NS") {
                    status = "NS";
                } else if (m.Eps === "Postp" || m.Eps === "Canc") {
                    status = "Canc"; matchTime = "Amânat";
                } else {
                    status = "LIVE"; matchTime = m.Eps; 
                }

                allProcessedMatches.push({
                    home: { name: m.T1[0].Nm, score: m.Tr1 ?? "-", id: homeId },
                    away: { name: m.T2[0].Nm, score: m.Tr2 ?? "-", id: awayId },
                    status: status,
                    phase: phaseName,
                    date: dateRo,
                    time: matchTime,
                    ts: matchDate.getTime()
                });
            });

            const tableArray = json.Stages?.[0]?.LeagueTable?.L?.[0]?.Tables?.[0]?.team || [];
            const formattedTable = tableArray.map(t => {
                const teamId = t.Img ? t.Img.replace('enet/', '').replace('.png', '') : t.Tid;
                return {
                    rank: t.rnk,
                    name: t.Tnm,
                    id: teamId,
                    pj: t.pld,
                    gd: t.gd,
                    pts: t.pts
                };
            });

            if (phaseName === 'Play-off') {
                finalData.standingsPlayoff = formattedTable;
            } else {
                finalData.standingsPlayout = formattedTable;
            }
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = startOfToday + 86400000;

        finalData.past = allProcessedMatches.filter(m => m.ts < startOfToday).sort((a, b) => b.ts - a.ts).slice(0, 4);
        finalData.today = allProcessedMatches.filter(m => m.ts >= startOfToday && m.ts < endOfToday).sort((a, b) => a.ts - b.ts);
        finalData.future = allProcessedMatches.filter(m => m.ts >= endOfToday).sort((a, b) => a.ts - b.ts).slice(0, 10); // Lăsăm mai multe în backend; frontend-ul taie la 6

        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync('data/superliga.json', JSON.stringify(finalData, null, 2));
        console.log("Date sincronizate cu succes (Dark Theme Ready).");

    } catch (e) { console.error("Eroare API:", e.message); }
}
fetchSuperligaData();
