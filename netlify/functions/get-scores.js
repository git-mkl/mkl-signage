exports.handler = async (event, context) => {
  const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
  
  // 1. Broad Date Range: 15 days back to 15 days forward
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 15); 
  const end = new Date(today);
  end.setDate(today.getDate() + 15);

  const formatDate = (date) => date.toISOString().split('T')[0];

  // 2. The URL - We'll fetch more data and filter League IDs in the HTML to be safe
  const API_URL = `https://api.sportmonks.com/v3/football/fixtures/between/${formatDate(start)}/${formatDate(end)}?api_token=${API_TOKEN}&include=participants;scores;state;league&sort=starting_at`;

  try {
    const response = await fetch(API_URL);
    const json = await response.json();
    
    // We only return the data array to the browser
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify(json.data || [])
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
