const fs = require('fs');

const fetchGames = () => {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`

  const queries = {
    key: process.env.STEAM_API_KEY,
    steamid: '76561198120099395',
    format: 'json',
    include_appinfo: '1',
    include_played_free_games: '1'
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
  const url3 = 'http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/';


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
        fetch(`${url3}${queryString}`)
          .then(response => response.json())
          .then(json => json.game.availableGameStats?.achievements)
      ])
      .then(([percentages, images]) => achievements?.map(achievement => ({
        ...achievement,
        percent: +percentages?.find(({ name }) => name === achievement.apiname)?.percent,
        imageUrl: images?.find(({ name }) => name === achievement.apiname)?.icongray
      })))
    )
    .then(achievements => ({
      game,
      achievements,
      nextAchievements: achievements
        ?.filter(({ achieved }) => achieved !== 1)
        .sort((a, b) => a.percent > b.percent ? -1 : 1)
        ?.slice(0, 3)
    }));
}

const buildHtml = (games) => {
  const gamesHtml = games
    .map(({ game: { appid, name, playtime_forever, playtime_2weeks }, achievements }) => `
      <li style="padding: 8px 32px; display: flex; align-items: center; height: 40px;" onMouseOut="this.style.background='transparent';" onMouseOver="this.style.background='rgba(255, 255, 255, .03)'">
        <img style="display: inline-block; height: 40px; margin-right: 16px;" src="${`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`}" />
        <span style="display: inline-block; flex-grow: 1; margin-right: 16px;">${name}</span>
        <span style="display: inline-block; width: 60px; margin-right: 16px;">${Math.round(playtime_forever / 60 * 10) / 10}h</span>
        <span style="display: inline-block; width: 60px; margin-right: 16px;">${Math.round((playtime_2weeks ?? 0) / 60 * 10) / 10}h</span>
        <span style="display: inline-block; width: 60px; margin-right: 16px;">
          ${achievements ? `${Math.round(achievements.filter(({ achieved}) => achieved).length / achievements.length * 100)} %` : '--'}
        </span>
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
    <ul style="margin: 0 auto; padding: 32px 0; max-width: 1200px;">
      ${gamesHtml}
    </ul>
  </body>
</html>
  `;
};

const buildRouletteHtml = (games) => {
  // Filter and map game data for the roulette
  const gamesData = games
    .filter(({ achievements }) => achievements && achievements.filter(({ achieved }) => achieved !== 1).length > 0)
    .map(({ game: { name, appid }, nextAchievements }) => ({
      name,
      appid,
      imageUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900.jpg`,
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
  // .then(games => games.slice(0, 10).map(fetchAchievements))
  .then(games => games.map(fetchAchievements))
  .then(promises => Promise.all(promises))
  .then(games => {
    fs.writeFileSync('./index.html', buildHtml(games))
    fs.writeFileSync('./roulette.html', buildRouletteHtml(games))
  });
