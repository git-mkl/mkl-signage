exports.handler = async (event, context) => {
  // Your API Key is pulled from Netlify's Environment Variables
  const API_TOKEN = process.env.SPORTMONKS_API_TOKEN; 
  const API_URL = `https://api.sportmonks.com/v3/football/livescores/inplay?api_token=${API_TOKEN}&include=participants;scores;state;league`;

  try {
    // Using native fetch (Standard in Node 18+) - No extra packages needed!
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Sportmonks responded with status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allows your TV to talk to the function
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data: ' + error.message })
    };
  }
};
