const { icon, colors } = require('./icons');

const buildBacklogHtml = (games, timesByAppid) => {
  const candidates = games
    .filter(({ achievements }) => achievements?.length && achievements.every(({ achieved }) => achieved !== 1))
    .map(gameStats => ({ ...gameStats, rarestPercent: rarestPercent(gameStats.achievements), timeToBeat: timesByAppid[gameStats.game.appid] }))
    .sort((a, b) => (b.rarestPercent ?? -1) - (a.rarestPercent ?? -1));

  return `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>次に始めるゲーム</title>
    <style>
      body { margin: 0; background: #121212; color: #a2a2a2; font-size: 14px; }
      a:link, a:visited { color: #aaaabb; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .backlog-card.is-picked { outline: 2px solid ${colors.gold}; }
    </style>
  </head>
  <body>
    <div style="margin: 0 auto; padding: 32px; max-width: 1400px;">
      <div style="display: flex; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 style="margin: 0; font-size: 22px; font-weight: normal; color: #e0e0e0;">次に始めるゲーム</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #6f6f6f;">実績を 1 つも解除していない ${candidates.length} 本を、完走しやすい順に並べています。</p>
        </div>
        <button id="pick-button" type="button" style="margin-left: auto; padding: 8px 20px; border: 0; border-radius: 4px; background: #232323; color: #e0e0e0; font-size: 16px; cursor: pointer;">1 本引く</button>
      </div>
      ${candidates.map(buildCardHtml).join('')}
    </div>
    <script>${pickScript}</script>
  </body>
</html>
  `;
};

const buildCardHtml = ({ game: { appid, name, capsuleUrl, store }, achievements, rarestPercent, timeToBeat }) => `
      <div class="backlog-card" style="display: flex; gap: 28px; margin-bottom: 20px; padding: 24px; border-radius: 10px; background: #1a1a1a;">
        ${buildMediaHtml(capsuleUrl, store.trailerUrl)}
        <div style="flex-grow: 1; min-width: 0;">
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span style="font-size: 24px; color: #e0e0e0;">${name}</span>
            ${store.review ? `<span style="font-size: 13px; color: #6f6f6f;">${store.review.review_score_label} (${store.review.percent_positive} %)</span>` : ''}
          </div>
          <div style="margin-top: 10px;">${store.tags.map(buildTagHtml).join('')}</div>
          <p style="margin: 12px 0; font-size: 15px; line-height: 1.7;">${store.shortDescription}</p>
          ${buildDifficultyHtml(achievements.length, rarestPercent)}
          ${buildTimeToBeatHtml(timeToBeat)}
          <div style="display: flex; gap: 8px; margin-top: 14px;">${store.screenshotUrls.map(buildScreenshotHtml).join('')}</div>
          <div style="display: flex; gap: 20px; margin-top: 14px; font-size: 15px;">
            <a href="steam://rungameid/${appid}">▶ 起動</a>
            <a href="https://store.steampowered.com/app/${appid}" target="_blank" rel="noopener noreferrer">ストア</a>
            <a href="https://howlongtobeat.com/?q=${encodeURIComponent(name)}" target="_blank" rel="noopener noreferrer">HowLongToBeat</a>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(name)}" target="_blank" rel="noopener noreferrer">YouTube</a>
          </div>
        </div>
      </div>`;

const buildMediaHtml = (capsuleUrl, trailerUrl) => `
        <div style="flex-shrink: 0; width: 520px; height: 297px; border-radius: 6px; overflow: hidden; background: #232323;">
          ${trailerUrl
            ? `<video src="${trailerUrl}" poster="${capsuleUrl}" muted loop playsinline preload="none" style="width: 100%; height: 100%; object-fit: cover;" onmouseover="this.play()" onmouseout="this.pause()"></video>`
            : `<img src="${capsuleUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.visibility='hidden';" />`}
        </div>`;

const buildTagHtml = (tag) =>
  `<span style="display: inline-block; margin: 0 6px 4px 0; padding: 2px 10px; border-radius: 12px; background: #262626; font-size: 12px;">${tag}</span>`;

const buildScreenshotHtml = (url) =>
  `<img src="${url}" loading="lazy" style="width: 200px; height: 113px; border-radius: 4px; object-fit: cover; background: #232323;" />`;

const buildDifficultyHtml = (count, rarest) => {
  const [label, color] = difficulty(rarest);

  return `
          <div style="display: flex; align-items: center; gap: 14px; font-size: 14px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 10px; background: ${color}22; color: ${color};">${icon('trophy', color, 12)}${label}</span>
            <span>実績 ${count} 個</span>
            <span title="100 % 達成したプレイヤーの割合はこの値以下です">最難関 ${rarest === undefined ? '--' : `${rarest.toFixed(1)} %`}</span>
          </div>`;
};

const buildTimeToBeatHtml = (timeToBeat) => `
          <div style="display: flex; align-items: center; gap: 14px; margin-top: 8px; font-size: 14px;">
            ${icon('clock', '#56ccf2', 16)}
            <span>クリア ${formatHours(timeToBeat?.normally)}</span>
            <span style="color: #e0e0e0;">全実績 ${formatHours(timeToBeat?.completely)}</span>
            ${timeToBeat?.count ? `<span style="font-size: 12px; color: #6f6f6f;">IGDB ${timeToBeat.count} 件の投稿</span>` : ''}
          </div>`;

const formatHours = (hours) => hours ? `約 ${hours} 時間` : '--';

const difficulty = (rarest) => {
  if (rarest === undefined) return ['不明', '#7a7a7a'];
  if (rarest >= 8) return ['完走しやすい', '#6fcf97'];

  return rarest >= 2 ? ['ふつう', '#f2c94c'] : ['やり込み', '#eb5757'];
};

const rarestPercent = (achievements) => {
  const percents = achievements.map(({ percent }) => percent).filter(Number.isFinite);

  return percents.length ? Math.min(...percents) : undefined;
};

const pickScript = `
  const $cards = [...document.querySelectorAll('.backlog-card')];
  document.getElementById('pick-button').addEventListener('click', () => {
    const $card = $cards[Math.floor(Math.random() * $cards.length)];
    $cards.forEach($c => $c.classList.toggle('is-picked', $c === $card));
    $card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
`;

module.exports = { buildBacklogHtml };
