const fs = require('fs');
const { buildDataAttributes, buildControlsHtml, gameListScript } = require('./gameListControls');
const { buildSummaryHtml } = require('./summary');
const { icon, colors } = require('./icons');

const fetchGames = () => {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`

  const queries = {
    key: process.env.STEAM_API_KEY,
    steamid: '76561198120099395',
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

const attachStoreAssets = (games) =>
  Promise.all(chunk(games, 100).map(fetchStoreAssets))
    .then(results => Object.assign({}, ...results))
    .then(assetsByAppid => games.map(game => ({ ...game, ...buildImageUrls(game.appid, assetsByAppid[game.appid]) })));

const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

const fetchStoreAssets = (games) => {
  const input = {
    ids: games.map(({ appid }) => ({ appid })),
    context: { language: 'japanese', country_code: 'JP' },
    data_request: { include_assets: true }
  };

  return fetch(`https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?${new URLSearchParams({ input_json: JSON.stringify(input) })}`)
    .then(response => response.json())
    .then(json => Object.fromEntries((json.response.store_items ?? []).map(({ appid, assets }) => [appid, assets])))
    .catch(() => ({}));
};

const buildImageUrls = (appid, assets) => ({
  headerUrl: buildAssetUrl(assets, assets?.header) ?? `${storeAssetBaseUrl}steam/apps/${appid}/header.jpg`,
  libraryUrl: buildAssetUrl(assets, assets?.library_capsule) ?? `${storeAssetBaseUrl}steam/apps/${appid}/library_600x900.jpg`
});

const buildAssetUrl = (assets, filename) =>
  filename && `${storeAssetBaseUrl}${assets.asset_url_format.replace('${FILENAME}', filename)}`;

const storeAssetBaseUrl = 'https://shared.akamai.steamstatic.com/store_item_assets/';

const fetchAchievements = (game) => {
  const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/`;
  const url2 =`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${game.appid}`;

  const queries = {
    key: process.env.STEAM_API_KEY,
    steamid: '76561198120099395',
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
        fetchAchievementSets(game.appid)
      ])
      .then(([percentages, sets]) => achievements?.map(achievement => ({
        ...achievement,
        ...buildSetInfo(game.appid, achievement.apiname, sets),
        percent: +percentages?.find(({ name }) => name === achievement.apiname)?.percent
      })))
    )
    .then(achievements => buildGameStats(game, achievements));
}

const fetchAchievementSets = (appid) =>
  fetch(`https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?appid=${appid}&language=japanese`)
    .then(response => response.json())
    .then(json => json.response ?? {})
    .catch(() => ({}));

const buildSetInfo = (appid, apiname, { achievements, groups }) => {
  const detail = achievements?.find(({ internal_name }) => internal_name === apiname);
  const group = groups?.find(({ groupid }) => groupid === detail?.groupid);

  return {
    imageUrl: detail && `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appid}/${detail.icon_gray}`,
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
  const playingDlcAchievements = achievementSets
    .filter(({ isDlc, achievedCount }) => isDlc && achievedCount > 0)
    .flatMap(({ achievements }) => achievements);

  return {
    game,
    achievements: baseAchievements,
    achievementSets,
    dlcProgress: buildDlcProgress(achievementSets),
    nextAchievements: pickNextAchievements([...(baseAchievements ?? []), ...playingDlcAchievements])
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

const pickNextAchievements = (achievements) =>
  achievements
    .filter(({ achieved }) => achieved !== 1)
    .sort((a, b) => a.percent > b.percent ? -1 : 1)
    .slice(0, 3);

const buildHtml = (games) => {
  const gamesHtml = games
    .map((gameStats, index) => [gameStats, buildDataAttributes(gameStats, index)])
    .map(([{ game: { appid, name, playtime_forever, playtime_2weeks, headerUrl }, achievements, achievementSets, dlcProgress }, dataAttributes]) => `
      <li ${dataAttributes} style="padding: 8px 32px; list-style: none;" onMouseOut="this.style.background='transparent';" onMouseOver="this.style.background='rgba(255, 255, 255, .03)'">
        <div ${achievementSets.length ? 'data-set-toggle' : ''} style="display: flex; align-items: center; height: 40px; ${achievementSets.length ? 'cursor: pointer;' : ''}">
          <img style="display: inline-block; flex-shrink: 0; width: 86px; height: 40px; margin-right: 16px; object-fit: cover; background: #232323;" src="${headerUrl}" onerror="this.style.visibility='hidden';" />
          <span style="display: inline-flex; align-items: center; flex-grow: 1; margin-right: 16px;">
            ${name}
            ${buildSetToggleHtml(achievementSets)}
          </span>
          <span style="display: inline-block; width: 60px; margin-right: 16px;">${Math.round(playtime_forever / 60 * 10) / 10}h</span>
          <span style="display: inline-block; width: 60px; margin-right: 16px;">${Math.round((playtime_2weeks ?? 0) / 60 * 10) / 10}h</span>
          <span style="display: inline-flex; flex-direction: column; align-items: flex-end; width: 72px; margin-right: 16px;">
            <span>${achievements?.length ? `${achievements.filter(({ achieved }) => achieved).length} / ${achievements.length}` : ''}</span>
            ${dlcProgress.total ? `<span style="${dlcLineStyle}">${dlcProgress.achievedCount} / ${dlcProgress.total}</span>` : ''}
          </span>
          <span style="display: inline-flex; flex-direction: column; width: 80px; margin-right: 16px; white-space: nowrap;">
            <span style="display: inline-flex; align-items: center;">${buildCompletionHtml(achievements?.filter(({ achieved }) => achieved).length, achievements?.length)}</span>
            ${buildDlcProgressHtml(dlcProgress)}
          </span>
          <span style="display: inline-flex; width: 280px;">
            <span style="display: inline-block; margin-right: 16px;">
              <a href="https://www.youtube.com/results?search_query=${encodeURI(name)}" target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            </span>
            <span style="display: inline-block; margin-right: 16px;">
              <a href="https://www.youtube.com/results?search_query=${encodeURI(name + ' 実況')}" target="_blank" rel="noopener noreferrer">
                実況
              </a>
            </span>
            <span style="display: inline-block; margin-right: 16px;">
              <a href="https://www.youtube.com/results?search_query=${encodeURI(name + ' VTuber')}" target="_blank" rel="noopener noreferrer">
                VTuber
              </a>
            </span>
            <span style="display: inline-block;">
              <a href="https://www.youtube.com/results?search_query=${encodeURI(name)}&sp=EgIQAw%253D%253D" target="_blank" rel="noopener noreferrer">
                再生リスト
              </a>
            </span>
          </span>
        </div>
        ${buildAchievementSetsHtml(achievementSets)}
      </li>
    `)
    .join('');

  return `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
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
    <div style="margin: 0 auto; max-width: 1200px;">
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

const buildSetToggleHtml = (achievementSets) => !achievementSets.length ? '' : `
            <span style="display: inline-flex; align-items: center; flex-shrink: 0; margin-left: 10px; font-size: 12px; color: #6f6f6f;">
              ${achievementSets.length} セット
              <span data-chevron style="display: inline-flex; margin-left: 2px; transition: transform .2s;">${icon('chevronDown', '#6f6f6f', 16)}</span>
            </span>`;

const buildAchievementSetsHtml = (achievementSets) => !achievementSets.length ? '' : `
        <div data-sets style="display: none;">
          ${achievementSets.map(buildAchievementSetHtml).join('')}
        </div>`;

const buildAchievementSetHtml = ({ name, isDlc, achievements, achievedCount }) => `
        <div style="display: flex; align-items: center; height: 24px; margin-left: 102px; font-size: 13px; color: #7a7a7a;">
          <span style="display: inline-flex; align-items: center; flex-grow: 1; min-width: 0; margin-right: 16px;">
            <span style="display: inline-flex; flex-shrink: 0; width: 14px; margin-right: 6px;">${isDlc ? icon('dlc', colors.dlc) : ''}</span>
            <span style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" title="${name}">${name}</span>
          </span>
          <span style="display: inline-block; width: 136px; margin-right: 16px;"></span>
          <span style="display: inline-block; width: 72px; margin-right: 16px; text-align: right;">${achievedCount} / ${achievements.length}</span>
          <span style="display: inline-flex; align-items: center; width: 80px; margin-right: 16px; white-space: nowrap;">${buildCompletionHtml(achievedCount, achievements.length)}</span>
          <span style="display: inline-block; width: 280px;"></span>
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


const buildRouletteHtml = (games) => {
  // Filter and map game data for the roulette
  const gamesData = games
    .filter(({ nextAchievements }) => nextAchievements.length > 0)
    .map(({ game: { name, appid, libraryUrl }, nextAchievements }) => ({
      name,
      appid,
      imageUrl: libraryUrl,
      nextAchievements: nextAchievements || []
    }));

  // Generate HTML blocks for each game
  const gameBlocksHtml = gamesData.map((game, index) => `
    <div id="game-block-${index}" class="game-block" style="display: ${index === 0 ? 'flex' : 'none'}; flex-direction: column; align-items: center;">
      <a href="steam://rungameid/${game.appid}">
        <img src="${game.imageUrl}" style="display: block; width: 300px; height:450px; background: #232323;" onerror="this.style.visibility='hidden';"/>
      </a>
      <p style="margin: 24px 0 0; font-size: 22px">${game.name}</p>
      <ul style="margin: 32px 0 0; padding: 0; width: 450px;">
        ${game.nextAchievements.map(achievement => `
          <li style="display: flex; height: 48px; margin: 0 0 4px; padding: 12px; background: #232323;">
            <img src="${achievement.imageUrl}" style="width: 48px; height: 48px; margin-right: 12px; background: #333;" onerror="this.style.visibility='hidden';" />
            <div style="display: flex; flex-direction: column; flex-grow: 1; margin-right: 12px;">
              <p style="margin: 0; font-size: 13px">${achievement?.name ?? ''}</p>
              <p style="margin: 1px 0 0; font-size: 10px; overflow: hidden;">${achievement?.description ?? ''}</p>
            </div>
            <div style="display: flex; justify-content: center; align-items: center;">
              <p style="font-size: 12px">${achievement?.percent?.toFixed(2) ?? '--'}%</p>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');

  // Generate preload links for all images
  const preloadLinks = gamesData.flatMap(game => [
    game.imageUrl,
    ...game.nextAchievements.map(ach => ach.imageUrl)
  ]).filter(url => url).map(url => `<link href="${url}" as="image" rel="preload" />`).join('\n');

  return `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    ${preloadLinks}
    <style>
        body {
          margin: 0;
          background: #121212;
          color: #a2a2a2;
        }
        a:link { color: #aaaabb; text-decoration: none; }
        a:visited { color: #777799; text-decoration: none; }
        a:hover { text-decoration: underline; }
        a:active { color: #afafbf; text-decoration: none; }
    </style>
  </head>
  <body>
    <div style="display: flex; padding: 64px 48px; flex-direction: column; align-items: center;">
      <div id="roulette-container" style="width: 450px; min-height: 650px; display: flex; justify-content: center; align-items: flex-start;">
        ${gameBlocksHtml}
      </div>
      <button id="start-button" style="margin-top: 32px; padding: 8px 24px; appearance: none; border: 0; border-radius: 0; background: #232323; color: #a2a2a2; font-size: 24px;">Have fun!</button>
    </div>
  </body>
  <script>
    const gamesCount = ${gamesData.length};
    const $gameBlocks = document.querySelectorAll('.game-block');
    const $startButton = document.getElementById('start-button');
    let currentGameIndex = 0;

    // Use the original interval calculation that the user preferred
    const shuffle = (callback, weight, threshold) => {
      const interval = weight < 30
        ? 80
        : 80 + 1.4 ** (weight - 30);

      setTimeout(() => {
        callback();
        if (++weight < threshold) {
          shuffle(callback, weight, threshold);
        } else {
          // Ensure the final game is truly random and update the display
          const finalIndex = Math.floor(Math.random() * gamesCount);
          if (currentGameIndex !== finalIndex) {
            $gameBlocks[currentGameIndex].style.display = 'none';
            $gameBlocks[finalIndex].style.display = 'flex';
            currentGameIndex = finalIndex;
          }
          
          $startButton.disabled = false;
        }
      }, interval);
    }

    $startButton.onclick = () => {
      if (gamesCount === 0) return;
      $startButton.disabled = true;

      shuffle(() => {
        // To avoid the roulette looking like it's stuck, ensure the next item is always different.
        if (gamesCount <= 1) return;

        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * gamesCount);
        } while (nextIndex === currentGameIndex);

        $gameBlocks[currentGameIndex].style.display = 'none';
        $gameBlocks[nextIndex].style.display = 'flex';
        currentGameIndex = nextIndex;
      }, 1, 50);
    }
  </script>
</html>
  `;
}

fetchGames()
  .then(attachStoreAssets)
  // .then(games => games.slice(0, 10).map(fetchAchievements))
  .then(games => games.map(fetchAchievements))
  .then(promises => Promise.all(promises))
  .then(games => {
    fs.writeFileSync('./index.html', buildHtml(games))
    fs.writeFileSync('./roulette.html', buildRouletteHtml(games))
  });
