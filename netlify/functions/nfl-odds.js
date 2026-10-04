exports.handler = async function () {
  const apiKey = process.env.SPORTSGAMEODDS_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key is not configured" }),
    };
  }

  try {
    const url =
      "https://api.sportsgameodds.com/v2/events" +
      "?leagueID=NFL" +
      "&oddsAvailable=true" +
      "&includeOpenCloseOdds=true" +
      "&limit=50";

    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to retrieve NFL odds",
      }),
    };
  }
};
