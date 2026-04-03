exports.handler = async (event, context) => {
  const API_KEY = process.env.RAPIDAPI_KEY;
  const HOST = "sportapi7.p.rapidapi.com";
  const today = new Date().toISOString().split('T')[0];
  const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };

  try {
    // 1. Programul zilei pentru a găsi meciul principal
    const schRes = await fetch(`https://${HOST}/api/v1/sport/football/scheduled-events/${today}`, { headers });
    const schJson = await schRes.json();
    const romania = (schJson.events || []).filter(m => m.category && m.category.name === "Romania");

    if (romania.length === 0) return { statusCode: 200, body: JSON.stringify({ error: "Nu sunt meciuri" }) };

    // Meciul principal (cel LIVE acum sau primul care urmează)
    let main = romania.find(m => m.status.type === "inprogress") || romania[0];
    
    // 2. Clasamentul (pentru Sidebar și Locul în clasament)
    const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${main.tournament.uniqueTournament.id}/season/${main.season.id}/standings/total`, { headers });
    const stdJson = await stdRes.json();

    // 3. Detalii meci (pentru Stadion)
    const detRes = await fetch(`https://${HOST}/api/v1/event/${main.id}`, { headers });
    const detJson = await detRes.json();

    // 4. Ultimele rezultate pentru ambele echipe
    const hLastRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
    const hLastJson = await hLastRes.json();

    const aLastRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
    const aLastJson = await aLastRes.json();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({
        main: main,
        venue: detJson.event.venue,
        standings: stdJson.standings[0].rows,
        hLast: hLastJson.events[0],
        aLast: aLastJson.events[0],
        upcoming: romania.filter(m => m.id !== main.id).slice(0, 3)
      })
    };
  } catch (e) { return { statusCode: 500, body: JSON.stringify({ error: e.message }) }; }
};
