exports.handler = async (event, context) => {
  const API_KEY = process.env.RAPIDAPI_KEY; 
  const today = new Date().toISOString().split('T')[0]; 
  const API_URL = "https://sportapi7.p.rapidapi.com/api/v1/sport/football/scheduled-events/" + today;

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "X-RapidAPI-Host": "sportapi7.p.rapidapi.com",
        "X-RapidAPI-Key": '8b8b29c474mshd383ae732d8331ap1b0325jsn05f8a83f75fa'
      }
    });

    const json = await response.json();
    
    // The API returns a list called 'events'
    var allEvents = json.events || [];
    var filtered = [];

    for (var i = 0; i < allEvents.length; i++) {
      // Filter for Romania matches based on the category object in your JSON
      if (allEvents[i].category && allEvents[i].category.name === "Romania") {
        filtered.push(allEvents[i]);
      }
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify(filtered)
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
