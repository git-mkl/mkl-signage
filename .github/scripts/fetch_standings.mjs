import fs from 'fs';

function calculateStandings() {
    try {
        const data = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
        
        // Mapare Nume -> ID (extras din sistemul FotMob)
        const teamIds = {
            "Universitatea Craiova": 480286, "Rapid Bucuresti": 9738, "Universitatea Cluj": 89022,
            "CFR Cluj": 9731, "Dinamo Bucuresti": 10271, "FC Arges Pitesti": 9732,
            "FCSB": 9723, "UTA Arad": 584663, "Botosani": 188191, "Otelul Galati": 9736,
            "FCV Farul Constanta": 210132, "Petrolul Ploiesti": 188187, "Hermannstadt": 864269,
            "Csikszereda Miercurea Ciuc": 583690, "FC Unirea Slobozia": 364411, "FC Metaloglobus Bucuresti": 404509
        };

        const base = {
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

        const standings = Object.keys(base).map(name => ({
            name,
            id: teamIds[name], // Adăugăm ID-ul pentru logo
            ...base[name]
        })).sort((a, b) => b.pts - a.pts || b.gd - a.gd)
           .map((t, idx) => ({ rank: idx + 1, ...t }));

        fs.writeFileSync('data/superliga.json', JSON.stringify({ ...data, standings }, null, 2));
    } catch (e) { console.error(e); }
}
calculateStandings();
