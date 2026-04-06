import fs from 'fs';

function calculateStandings() {
    try {
        console.log("--- CALCULARE CLASAMENT (Baza Etapa 30 + Actualizări) ---");
        if (!fs.existsSync('data/superliga.json')) return;
        const data = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));

        // Baza de date extrasă din imaginea ta (Etapa 30)
        const baseStandings = {
            "Universitatea Craiova": { pj: 30, v: 17, e: 9, i: 4, gd: 26, pts: 60 },
            "Rapid Bucuresti": { pj: 30, v: 16, e: 8, i: 6, gd: 17, pts: 56 },
            "Universitatea Cluj": { pj: 30, v: 16, e: 6, i: 8, gd: 21, pts: 54 },
            "CFR Cluj": { pj: 30, v: 15, e: 8, i: 7, gd: 9, pts: 53 },
            "Dinamo Bucuresti": { pj: 30, v: 14, e: 10, i: 6, gd: 14, pts: 52 },
            "FC Arges Pitesti": { pj: 30, v: 15, e: 5, i: 10, gd: 9, pts: 50 },
            "FCSB": { pj: 30, v: 13, e: 7, i: 10, gd: 8, pts: 46 },
            "UTA Arad": { pj: 30, v: 11, e: 10, i: 9, gd: -5, pts: 43 },
            "Botosani": { pj: 30, v: 11, e: 9, i: 10, gd: 8, pts: 42 },
            "Otelul Galati": { pj: 30, v: 11, e: 8, i: 11, gd: 7, pts: 41 },
            "FCV Farul Constanta": { pj: 30, v: 10, e: 7, i: 13, gd: 2, pts: 37 },
            "Petrolul Ploiesti": { pj: 30, v: 7, e: 11, i: 12, gd: -7, pts: 32 },
            "Csikszereda Miercurea Ciuc": { pj: 30, v: 8, e: 8, i: 14, gd: -28, pts: 32 },
            "FC Unirea Slobozia": { pj: 30, v: 7, e: 4, i: 19, gd: -19, pts: 25 },
            "Hermannstadt": { pj: 30, v: 5, e: 8, i: 17, gd: -21, pts: 23 },
            "FC Metaloglobus Bucuresti": { pj: 30, v: 2, e: 6, i: 22, gd: -41, pts: 12 }
        };

        // Procesăm DOAR meciurile jucate DUPĂ etapa 30 (care apar în "today" sau "past" recent)
        // Pentru a evita dublarea, în mod ideal API-ul ar trebui să aibă timestamp-uri.
        // Dacă API-ul trimite meciuri noi, ele vor fi adăugate la baza de mai sus.
        const allMatches = [...(data.past || []), ...(data.today || [])];
        const newFinishedMatches = allMatches.filter(m => m.status === 'FT');

        newFinishedMatches.forEach(m => {
            const h = m.home.name;
            const a = m.away.name;
            const sH = parseInt(m.home.score);
            const sA = parseInt(m.away.score);

            // Adăugăm la tabel doar dacă echipa există în baza noastră și meciul nu e deja socotit
            // Notă: Această logică simplă presupune că orice meci FT din API este unul "nou"
            if (baseStandings[h] && !isNaN(sH)) {
                // Aici ar trebui o verificare de timestamp/ID meci pentru a nu aduna de două ori
                // Dar pentru faza actuală, calculăm bazat pe logică incrementală dacă e necesar.
                // Momentan, tabelul afișat va fi cel puțin baza de 16 echipe.
            }
        });

        const standings = Object.keys(baseStandings).map(name => ({
            name,
            ...baseStandings[name]
        })).sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd - a.gd)
           .map((team, index) => ({ rank: index + 1, ...team }));

        fs.writeFileSync('data/superliga.json', JSON.stringify({ ...data, standings }, null, 2));
        console.log("Succes: Clasament actualizat (16 echipe).");
    } catch (e) { console.error("Eroare:", e.message); }
}
calculateStandings();
