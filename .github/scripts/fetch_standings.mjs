import fs from 'fs';

function calculateStandings() {
    try {
        console.log("--- CALCULARE CLASAMENT DIN REZULTATELE API ---");

        if (!fs.existsSync('data/superliga.json')) {
            console.log("Eroare: Nu exista date despre meciuri pentru a calcula clasamentul.");
            return;
        }

        const data = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
        
        // Luăm toate meciurile procesate de fetch_matches.mjs
        // Le combinăm pe toate (past, today, future) pentru a găsi tot ce e terminat (FT)
        const allMatches = [...(data.past || []), ...(data.today || []), ...(data.future || [])];
        const finishedMatches = allMatches.filter(m => m.status === 'FT');

        const table = {};

        // Functie pentru a initializa o echipa in tabel
        const initTeam = (name) => {
            if (!table[name]) {
                table[name] = { name: name, pj: 0, v: 0, e: 0, i: 0, gd: 0, pts: 0 };
            }
        };

        finishedMatches.forEach(m => {
            initTeam(m.home.name);
            initTeam(m.away.name);

            const sH = parseInt(m.home.score);
            const sA = parseInt(m.away.score);

            if (isNaN(sH) || isNaN(sA)) return; // Sarim peste scoruri invalide

            table[m.home.name].pj += 1;
            table[m.away.name].pj += 1;
            table[m.home.name].gd += (sH - sA);
            table[m.away.name].gd += (sA - sH);

            if (sH > sA) {
                table[m.home.name].v += 1;
                table[m.home.name].pts += 3;
                table[m.away.name].i += 1;
            } else if (sH < sA) {
                table[m.away.name].v += 1;
                table[m.away.name].pts += 3;
                table[m.home.name].i += 1;
            } else {
                table[m.home.name].e += 1;
                table[m.away.name].e += 1;
                table[m.home.name].pts += 1;
                table[m.away.name].pts += 1;
            }
        });

        // Convertim obiectul in array si sortam (Puncte, apoi Golaveraj)
        const standings = Object.values(table).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            return b.gd - a.gd;
        });

        // Adaugam rangul (locul in clasament)
        const finalStandings = standings.map((team, index) => ({
            rank: index + 1,
            ...team
        }));

        // Salvam inapoi in JSON fara sa stricam restul datelor
        const finalOutput = { 
            ...data, 
            standings: finalStandings, 
            updatedAt: new Date().toLocaleString('ro-RO') 
        };

        fs.writeFileSync('data/superliga.json', JSON.stringify(finalOutput, null, 2));
        console.log(`Succes: Clasament calculat pentru ${finalStandings.length} echipe din ${finishedMatches.length} meciuri finalizate.`);

    } catch (e) {
        console.error("Eroare la calcularea clasamentului:", e.message);
    }
}

calculateStandings();
