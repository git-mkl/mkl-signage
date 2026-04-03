exports.handler = async (event, context) => {
  const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
  const today = new Date();
  
  // Look 15 days back and 15 days forward
  const start = new Date(today);
  start.setDate(today.getDate() - 15);
  const end = new Date(today);
  end.setDate(today.getDate() + 15);

  const formatDate = (date) => date.toISOString().split('T')[0];

  // Using your specific tracked League IDs
  const leagues = "271,501,1659,513";
  const API_URL = `https://api.sportmonks.com/v3/football/fixtures/between/${formatDate(start)}/${formatDate(end)}?api_token=${API_TOKEN}&include=participants;scores;state;league&leagues=${leagues}&sort=starting_at`;

  try {
    const response = await fetch(API_URL);
    const json = await response.json();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify(json.data || [])
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
