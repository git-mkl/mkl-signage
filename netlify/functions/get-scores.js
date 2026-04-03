const axios = require('axios'); // You may need to use 'node-fetch' depending on setup

exports.handler = async (event, context) => {
  // Your API Key is hidden in Netlify's Environment Variables
  const API_TOKEN = process.env.SPORTMONKS_API_TOKEN; 
  const API_URL = `https://api.sportmonks.com/v3/football/livescores/inplay?api_token=${API_TOKEN}&include=participants;scores;state;league`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allows your TV to talk to Netlify
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' })
    };
  }
};
