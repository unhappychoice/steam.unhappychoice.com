const fetchTimeToBeat = (appids) => {
  const { TWITCH_CLIENT_ID: clientId, TWITCH_CLIENT_SECRET: clientSecret } = process.env;
  if (!clientId || !clientSecret) return Promise.resolve({});

  return fetchAccessToken(clientId, clientSecret)
    .then(token => igdbClient(clientId, token))
    .then(query => fetchIgdbGameIds(query, appids)
      .then(gameIdByAppid => fetchTimes(query, Object.values(gameIdByAppid))
        .then(timesByGameId => mapTimesToAppids(gameIdByAppid, timesByGameId))))
    .catch(error => {
      console.warn(`Failed to fetch time to beat from IGDB: ${error.message}`);
      return {};
    });
};

const fetchAccessToken = (clientId, clientSecret) =>
  fetch(`https://id.twitch.tv/oauth2/token?${new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' })}`, { method: 'POST' })
    .then(response => response.json())
    .then(json => json.access_token);

const igdbClient = (clientId, token) => (endpoint, body) =>
  fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}` },
    body
  }).then(response => response.ok ? response.json() : Promise.reject(new Error(`${endpoint}: HTTP ${response.status}`)));

const fetchIgdbGameIds = (query, appids) =>
  Promise.all(chunk(appids, 500).map(ids =>
    query('external_games', `fields game, uid; where external_game_source = 1 & uid = (${ids.map(id => `"${id}"`).join(',')}); limit 500;`)))
    .then(results => Object.fromEntries(results.flat().map(({ uid, game }) => [uid, game])));

const fetchTimes = (query, gameIds) =>
  Promise.all(chunk(gameIds, 500).map(ids =>
    query('game_time_to_beats', `fields game_id, normally, completely, count; where game_id = (${ids.join(',')}); limit 500;`)))
    .then(results => Object.fromEntries(results.flat().map(time => [time.game_id, time])));

const mapTimesToAppids = (gameIdByAppid, timesByGameId) =>
  Object.fromEntries(Object.entries(gameIdByAppid)
    .filter(([, gameId]) => timesByGameId[gameId])
    .map(([appid, gameId]) => [appid, toHours(timesByGameId[gameId])]));

const toHours = ({ normally, completely, count }) => ({
  normally: normally && Math.round(normally / 3600),
  completely: completely && Math.round(completely / 3600),
  count
});

const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

module.exports = { fetchTimeToBeat };
