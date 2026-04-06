import fs from 'fs';

function calculateStandings() {
    try {
        console.log("--- CALCULARE CLASAMENT INTERN ---");
        if (!fs.existsSync('data/superliga.json')) return;

        const data = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
        const allMatches = [...(data.past || []), ...(data.today || []), ...(data.future || [])];
        const finishedMatches = allMatches.filter(m => m.status === 'FT');

        const table = {};
        const initTeam = (name) => {
            if (!table[name]) table[name] = { name, pj: 0, v: 0, e: 0, i: 0, gd: 0, pts: 0 };
        };

        finishedMatches.forEach(m => {
            initTeam(m.home.name); initTeam(m.away.name);
            const sH = parseInt(m.home.score); const sA = parseInt(m.away.score);
            if (isNaN(sH) || isNaN(sA)) return;

            table[m.home.name].pj++; table[m.away.name].pj++;
            table[m.home.name].gd += (sH - sA); table[m.away.name].gd += (sA - sH);

            if (sH > sA) { table[m.home.name].v++; table[m.home.name].pts += 3; table[m.away.name].i++; }
            else if (sH < sA) { table[m.away.name].v++; table[m.away.name].pts += 3; table[m.home.name].i++; }
            else { table[m.home.name].e++; table[m.away.name].e++; table[m.home.name].pts++; table[m.away.name].pts++; }
        });

        const standings = Object.values(table)
            .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd - a.gd)
            .map((team, index) => ({ rank: index + 1, ...team }));

        fs.writeFileSync('data/superliga.json', JSON.stringify({ ...data, standings }, null, 2));
        console.log("Succes: Clasament calculat.");
    } catch (e) { console.error("Eroare:", e.message); }
}
calculateStandings();
