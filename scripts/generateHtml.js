const fs = require('fs');
const { steamId } = require('./config');
const { buildLinksHtml } = require('./gameLinks');
const { attachStoreData } = require('./store');
const { buildBacklogHtml } = require('./backlog');
const { fetchTimeToBeat } = require('./timeToBeat');
const { buildHeaderHtml, buildSharedHeadHtml } = require('./header');
const { buildRouletteHtml } = require('./roulette');
const { buildDataAttributes, buildControlsHtml, gameListScript } = require('./gameListControls');
const { buildSummaryHtml } = require('./summary');
const { icon, colors } = require('./icons');

const fetchGames = () => {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`

  const queries = {
    key: process.env.STEAM_API_KEY,
    steamid: steamId,
    format: 'json',
    include_appinfo: '1',
    include_played_free_games: '1',
    include_all_free_games: '1',
    skip_unvetted_apps: '0'
  };

  const queryString = `?${Object.entries(queries).map(([key, value]) => `${key}=${value}`).join('&')}`;

  return fetch(`${url}${queryString}`)
    .then(response => response.json())
    .then(json => json.response.games)
    .then(games => games.sort((a, b) => a.name > b.name ? 1 : -1))
};

const fetchAchievements = (game) => {
  const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/`;
  const url2 =`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${game.appid}`;

  const queries = {
    key: process.env.STEAM_API_KEY,
    steamid: steamId,
    appid: game.appid,
    l: 'japanese'
  }

  const queryString = `?${Object.entries(queries).map(([key, value]) => `${key}=${value}`).join('&')}`;

  return fetch(`${url}${queryString}`)
    .then(response => response.json())
    .then(json => json.playerstats.achievements)
    .then(achievements => Promise.all([
        fetch(url2)
          .then(response => response.json())
          .then(json => json.achievementpercentages?.achievements),
        fetchAchievementSets(game.appid, 'japanese'),
        fetchAchievementSets(game.appid, 'english')
      ])
      .then(([percentages, sets, englishSets]) => achievements?.map(achievement => ({
        ...achievement,
        ...buildSetInfo(game.appid, achievement.apiname, sets),
        englishName: englishSets.achievements?.find(({ internal_name }) => internal_name === achievement.apiname)?.localized_name,
        percent: +percentages?.find(({ name }) => name === achievement.apiname)?.percent
      })))
    )
    .then(achievements => buildGameStats(game, achievements));
}

const fetchAchievementSets = (appid, language) =>
  fetch(`https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?appid=${appid}&language=${language}`)
    .then(response => response.json())
    .then(json => json.response ?? {})
    .catch(() => ({}));

const buildSetInfo = (appid, apiname, { achievements, groups }) => {
  const detail = achievements?.find(({ internal_name }) => internal_name === apiname);
  const group = groups?.find(({ groupid }) => groupid === detail?.groupid);

  return {
    imageUrl: detail && `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appid}/${detail.icon_gray}`,
    unlockedImageUrl: detail && `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appid}/${detail.icon}`,
    groupid: detail?.groupid ?? 0,
    setName: group?.localized_name,
    setOrder: group?.order ?? 0,
    isDlc: Boolean(group?.dlcappid),
    archived: Boolean(detail?.archived || group?.archived)
  };
};

const buildGameStats = (game, achievements) => {
  const visibleAchievements = achievements?.filter(({ achieved, archived }) => achieved === 1 || !archived);
  const baseAchievements = visibleAchievements?.filter(({ isDlc }) => !isDlc);
  const achievementSets = buildAchievementSets(visibleAchievements ?? []);

  return {
    game,
    achievements: baseAchievements,
    achievementSets,
    dlcProgress: buildDlcProgress(achievementSets)
  };
};

const buildDlcProgress = (achievementSets) =>
  achievementSets
    .filter(({ isDlc }) => isDlc)
    .reduce(({ achievedCount, total }, set) => ({
      achievedCount: achievedCount + set.achievedCount,
      total: total + set.achievements.length
    }), { achievedCount: 0, total: 0 });

const buildAchievementSets = (achievements) =>
  [...new Set(achievements.filter(({ setName }) => setName).map(({ groupid }) => groupid))]
    .map(groupid => achievements.filter(achievement => achievement.groupid === groupid))
    .sort((a, b) => a[0].isDlc - b[0].isDlc || a[0].setOrder - b[0].setOrder)
    .map(setAchievements => ({
      name: setAchievements[0].setName,
      isDlc: setAchievements[0].isDlc,
      achievements: setAchievements,
      achievedCount: setAchievements.filter(({ achieved }) => achieved === 1).length
    }));

const buildHtml = (games) => {
  const gamesHtml = games
    .map((gameStats, index) => [gameStats, buildDataAttributes(gameStats, index)])
    .map(([{ game: { appid, name, playtime_forever, playtime_2weeks, headerUrl }, achievements, achievementSets, dlcProgress }, dataAttributes]) => `
      <li ${dataAttributes} style="padding: 8px 32px; list-style: none;" onMouseOut="this.style.background='transparent';" onMouseOver="this.style.background='rgba(255, 255, 255, .03)'">
        <div data-toggle style="display: flex; align-items: center; height: 40px; cursor: pointer;">
          <img style="display: inline-block; flex-shrink: 0; width: 86px; height: 40px; margin-right: 16px; object-fit: cover; background: #232323;" src="${headerUrl}" onerror="this.style.visibility='hidden';" />
          <span style="display: inline-flex; align-items: center; flex-grow: 1; margin-right: 16px;">
            ${name}
            ${buildSetCountHtml(achievementSets)}
          </span>
          <span style="display: inline-block; width: 60px; margin-right: 16px;">${Math.round(playtime_forever / 60 * 10) / 10}h</span>
          <span style="display: inline-block; width: 60px; margin-right: 16px;">${Math.round((playtime_2weeks ?? 0) / 60 * 10) / 10}h</span>
          <span style="display: inline-flex; flex-direction: column; align-items: flex-end; width: 96px; margin-right: 16px; white-space: nowrap;">
            <span>${achievements?.length ? `${achievements.filter(({ achieved }) => achieved).length} / ${achievements.length}` : ''}</span>
            ${dlcProgress.total ? `<span style="${dlcLineStyle}">${dlcProgress.achievedCount} / ${dlcProgress.total}</span>` : ''}
          </span>
          <span style="display: inline-flex; flex-direction: column; width: 80px; margin-right: 16px; white-space: nowrap;">
            <span style="display: inline-flex; align-items: center;">${buildCompletionHtml(achievements?.filter(({ achieved }) => achieved).length, achievements?.length)}</span>
            ${buildDlcProgressHtml(dlcProgress)}
          </span>
          <span data-chevron style="display: inline-flex; justify-content: center; width: 24px; transition: transform .2s;">${icon('chevronDown', '#6f6f6f', 18)}</span>
        </div>
        <div data-details style="display: none;">
          ${buildLinksHtml({ appid, name })}
          ${achievementSets.map(buildAchievementSetHtml).join('')}
        </div>
      </li>
    `)
    .join('');

  return `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>ゲーム一覧</title>
    ${buildSharedHeadHtml()}
    <style>
        body {
          margin: 0;
          background: #121212;
          color: #a2a2a2;
        }
        
        a:link {
          color: #aaaabb;
          text-decoration: none;
        }
        
        a:visited {
          color: #777799;
          text-decoration: none;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        a:active {
          color: #afafbf;
          text-decoration: none;
        }
    </style>
  </head>
  <body>
    ${buildHeaderHtml('index')}
    <div style="margin: 0 auto; max-width: 1464px;">
      ${buildSummaryHtml(games)}
      ${buildControlsHtml()}
      <ul id="games" style="margin: 0; padding: 0 0 32px;">
        ${gamesHtml}
      </ul>
    </div>
    <script>
${gameListScript()}
    </script>
  </body>
</html>
  `;
};

const buildSetCountHtml = (achievementSets) => !achievementSets.length ? '' : `
            <span style="flex-shrink: 0; margin-left: 10px; font-size: 12px; color: #6f6f6f;">${achievementSets.length} セット</span>`;

const buildAchievementSetHtml = ({ name, isDlc, achievements, achievedCount }) => `
        <div style="display: flex; align-items: center; height: 24px; margin-left: 102px; font-size: 13px; color: #7a7a7a;">
          <span style="display: inline-flex; align-items: center; flex-grow: 1; min-width: 0; margin-right: 16px;">
            <span style="display: inline-flex; flex-shrink: 0; width: 14px; margin-right: 6px;">${isDlc ? icon('dlc', colors.dlc) : ''}</span>
            <span style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" title="${name}">${name}</span>
          </span>
          <span style="display: inline-block; width: 136px; margin-right: 16px;"></span>
          <span style="display: inline-block; width: 96px; margin-right: 16px; white-space: nowrap; text-align: right;">${achievedCount} / ${achievements.length}</span>
          <span style="display: inline-flex; align-items: center; width: 80px; margin-right: 16px; white-space: nowrap;">${buildCompletionHtml(achievedCount, achievements.length)}</span>
          <span style="display: inline-block; width: 24px;"></span>
        </div>
`;


const buildDlcProgressHtml = ({ achievedCount, total }) => !total ? '' : `
            <span style="display: inline-flex; align-items: center; ${dlcLineStyle}">
              ${icon('dlc', colors.dlc, 12, 'margin-right: 4px;')}
              ${buildCompletionHtml(achievedCount, total, 12)}
            </span>`;

const dlcLineStyle = 'font-size: 12px; line-height: 16px; color: #7a7a7a;';

const buildCompletionHtml = (achievedCount, total, iconSize = 14) => {
  if (!total) return '--';
  if (achievedCount < total) return `${Math.round(achievedCount / total * 100)} %`;

  return `<span style="color: ${colors.gold};">100 %</span>${icon('trophy', colors.gold, iconSize, 'margin-left: 4px;')}`;
};


fetchGames()
  .then(attachStoreData)
  // .then(games => games.slice(0, 10).map(fetchAchievements))
  .then(games => games.map(fetchAchievements))
  .then(promises => Promise.all(promises))
  .then(games => fetchTimeToBeat(games.map(({ game }) => game.appid)).then(timesByAppid => [games, timesByAppid]))
  .then(([games, timesByAppid]) => {
    fs.writeFileSync('./index.html', buildHtml(games))
    fs.writeFileSync('./roulette.html', buildRouletteHtml(games, timesByAppid))
    fs.writeFileSync('./backlog.html', buildBacklogHtml(games, timesByAppid))
  });
