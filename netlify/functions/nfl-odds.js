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
      "&started=false" +
      "&includeOpenCloseOdds=true" +
      "&limit=1";

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

    const event = data.data?.[0];

    if (!event) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "No upcoming NFL event with odds found.",
        }),
      };
    }

    const odds = Object.values(event.odds || {})
      .filter((odd) => {
        const text = [
          odd.oddID,
          odd.marketName,
          odd.statID,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes("touchdown");
      })
      .slice(0, 100);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
      body: JSON.stringify({
        success: true,
        eventID: event.eventID,
        teams: event.teams,
        players: event.players,
        touchdownOdds: odds,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to retrieve NFL odds",
        message: error.message,
      }),
    };
  }
};
