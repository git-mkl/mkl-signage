import fs from 'fs';

function calculateStandings() {
    try {
        const data = JSON.parse(fs.readFileSync('data/superliga.json', 'utf8'));
        
        const ids = {
            "Universitatea Cluj": 89022, "Universitatea Craiova": 480286, "Rapid Bucuresti": 9738, "CFR Cluj": 9731, "FC Arges": 9732, "Dinamo Bucuresti": 10271,
            "UTA Arad": 584663, "FCSB": 9723, "Botosani": 188191, "Otelul Galati": 9736, "Farul Constanta": 210132, "Csikszereda": 583690, "Unirea Slobozia": 364411, "Petrolul Ploiesti": 188187, "Hermannstadt": 864269, "Metaloglobus": 404509
        };

        const playoff = [
            { name: "Universitatea Cluj", pj: 3, gd: 3, pts: 36, id: ids["Universitatea Cluj"] },
            { name: "Universitatea Craiova", pj: 2, gd: 0, pts: 33, id: ids["Universitatea Craiova"] },
            { name: "Rapid Bucuresti", pj: 3, gd: -1, pts: 31, id: ids["Rapid Bucuresti"] },
            { name: "CFR Cluj", pj: 2, gd: 0, pts: 30, id: ids["CFR Cluj"] },
            { name: "FC Arges", pj: 3, gd: 0, pts: 29, id: ids["FC Arges"] },
            { name: "Dinamo Bucuresti", pj: 3, gd: -2, pts: 27, id: ids["Dinamo Bucuresti"] }
        ].map((t, i) => ({ rank: i + 1, ...t }));

        const playout = [
            { name: "UTA Arad", pj: 3, gd: 4, pts: 28, id: ids["UTA Arad"] },
            { name: "FCSB", pj: 3, gd: 0, pts: 27, id: ids["FCSB"] },
            { name: "Botosani", pj: 3, gd: -1, pts: 27, id: ids["Botosani"] },
            { name: "Otelul Galati", pj: 3, gd: 0, pts: 24, id: ids["Otelul Galati"] },
            { name: "Farul Constanta", pj: 3, gd: 1, pts: 23, id: ids["Farul Constanta"] },
            { name: "Csikszereda", pj: 2, gd: 1, pts: 20, id: ids["Csikszereda"] },
            { name: "Unirea Slobozia", pj: 3, gd: 1, pts: 19, id: ids["Unirea Slobozia"] },
            { name: "Petrolul Ploiesti", pj: 2, gd: -3, pts: 16, id: ids["Petrolul Ploiesti"] },
            { name: "Hermannstadt", pj: 3, gd: 0, pts: 15, id: ids["Hermannstadt"] },
            { name: "Metaloglobus", pj: 3, gd: -3, pts: 10, id: ids["Metaloglobus"] }
        ].map((t, i) => ({ rank: i + 1, ...t }));

        data.standingsPlayoff = playoff;
        data.standingsPlayout = playout;

        fs.writeFileSync('data/superliga.json', JSON.stringify(data, null, 2));
    } catch (e) { console.error(e); }
}
calculateStandings();
