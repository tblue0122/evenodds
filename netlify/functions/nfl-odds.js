exports.handler = async function () {
  const apiKey = process.env.SPORTSGAMEODDS_API_KEY;

  const americanProb = (odds) => {
    odds = Number(odds);
    if (!Number.isFinite(odds)) return null;
    return odds < 0
      ? (-odds / (-odds + 100)) * 100
      : (100 / (odds + 100)) * 100;
  };

  try {
    const params = new URLSearchParams({
      leagueID: "NFL",
      oddsAvailable: "true",
      started: "false",
      oddID: "touchdowns-PLAYER_ID-game-ou-over",
      includeOpenCloseOdds: "true",
      limit: "50"
    });

    const response = await fetch(
      "https://api.sportsgameodds.com/v2/events?" + params,
      { headers: { "x-api-key": apiKey } }
    );

    const json = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify(json)
      };
    }

    const output = [];

    for (const event of json.data || []) {
      const home =
        event.teams?.home?.names?.short ||
        event.teams?.home?.names?.medium ||
        "HOME";

      const away =
        event.teams?.away?.names?.short ||
        event.teams?.away?.names?.medium ||
        "AWAY";

      for (const odd of Object.values(event.odds || {})) {
        if (
          odd.statID !== "touchdowns" ||
          odd.periodID !== "game" ||
          odd.sideID !== "over"
        ) continue;

        const playerID = odd.statEntityID;
        const player = event.players?.[playerID];

        if (!player) continue;

        const books = Object.values(odd.byBookmaker || {})
          .filter(b => b.available && b.odds != null);

        if (!books.length) continue;

        const current = Number(books[0].odds);

        const opens = books
          .map(b => Number(b.openOdds))
          .filter(Number.isFinite);

        const first = opens.length ? opens[0] : current;

        const currentProb = americanProb(current);
        const firstProb = americanProb(first);

        const move =
          currentProb != null && firstProb != null
            ? +(currentProb - firstProb).toFixed(2)
            : null;

        let signal = "➡ Flat";

        if (move > 1.5) signal = "🔥 Steam";
        else if (move > 0.25) signal = "👀 Shortening";
        else if (move < -0.25) signal = "⬇ Drift";

        output.push({
          game: `${away} @ ${home}`,
          player:
            player.name ||
            player.names?.display ||
            player.nickname ||
            playerID,
          pos: player.position || "",
          first,
          current,
          implied:
            currentProb == null ? null : +
