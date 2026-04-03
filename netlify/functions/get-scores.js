exports.handler = async (event, context) => {
  const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
  
  // 1. Calculate Date Range (7 days back, 7 days forward)
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);

  const formatDate = (date) => date.toISOString().split('T')[0];

  // 2. Build the URL for Fixtures Between Dates
  // We filter by your specific League IDs to keep the data clean
  const leagueIds = "271,1659,501,513";
  const API_URL = `https://api.sportmonks.com/v3/football/fixtures/between/${formatDate(start)}/${formatDate(end)}?api_token=${API_TOKEN}&include=participants;scores;state;league&leagues=${leagueIds}&sort=starting_at`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching fixtures' })
    };
  }
};
