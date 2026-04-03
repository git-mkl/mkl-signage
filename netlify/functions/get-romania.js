exports.handler = async (event, context) => {
  const API_KEY = process.env.RAPIDAPI_KEY;
  const HOST = "sportapi7.p.rapidapi.com";
  const today = new Date().toISOString().split('T')[0];
  const headers = { "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": API_KEY };

  try {
    // 1. Get Schedule & identify the Main Match
    const schRes = await fetch(`https://${HOST}/api/v1/sport/football/scheduled-events/${today}`, { headers });
    const schJson = await schRes.json();
    const romania = (schJson.events || []).filter(m => m.category && m.category.name === "Romania");

    if (romania.length === 0) return { statusCode: 200, body: JSON.stringify({ error: "No matches" }) };

    // Identify main match (Live first, otherwise first upcoming)
    let main = romania.find(m => m.status.type === "inprogress") || romania[0];
    
    // 2. Get Standings
    const stdRes = await fetch(`https://${HOST}/api/v1/unique-tournament/${main.tournament.uniqueTournament.id}/season/${main.season.id}/standings/total`, { headers });
    const stdJson = await stdRes.json();

    // 3. Get Last Results for Home and Away teams
    const hLastRes = await fetch(`https://${HOST}/api/v1/team/${main.homeTeam.id}/events/last/1`, { headers });
    const hLastJson = await hLastRes.json();

    const aLastRes = await fetch(`https://${HOST}/api/v1/team/${main.awayTeam.id}/events/last/1`, { headers });
    const aLastJson = await aLastRes.json();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({
        main: main,
        standings: stdJson.standings[0].rows,
        hLast: hLastJson.events[0],
        aLast: aLastJson.events[0],
        upcoming: romania.filter(m => m.id !== main.id).slice(0, 3)
      })
    };
  } catch (e) { return { statusCode: 500, body: JSON.stringify({ error: e.message }) }; }
};
