const fs = require('fs');
const path = require('path');
const { colors } = require('../icons');
const { buildNotStartedCardHtml } = require('./notStartedCard');
const { buildInProgressCardHtml } = require('./inProgressCard');

const buildBacklogHtml = (games, timesByAppid) => {
  const withExtras = games
    .filter(({ achievements }) => achievements?.length)
    .map(gameStats => ({ ...gameStats, rarestPercent: rarestPercent(gameStats.achievements), timeToBeat: timesByAppid[gameStats.game.appid] }));
  const notStarted = withExtras
    .filter(({ achievements }) => achievedCount(achievements) === 0)
    .sort((a, b) => (b.rarestPercent ?? -1) - (a.rarestPercent ?? -1));
  const inProgress = withExtras
    .filter(({ achievements }) => achievedCount(achievements) > 0 && achievedCount(achievements) < achievements.length)
    .map(gameStats => ({ ...gameStats, rarestRemainingPercent: rarestPercent(gameStats.achievements.filter(({ achieved }) => achieved !== 1)) }))
    .sort((a, b) => (b.rarestRemainingPercent ?? -1) - (a.rarestRemainingPercent ?? -1));

  return `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>次に遊ぶゲーム</title>
    <style>
      body { margin: 0; background: #121212; color: #a2a2a2; font-size: 14px; }
      a:link, a:visited { color: #aaaabb; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .backlog-card.is-picked { outline: 2px solid ${colors.gold}; }
      [data-full] { cursor: zoom-in; }
      .tab-button { padding: 8px 18px; border: 0; border-bottom: 2px solid transparent; background: none; color: #7a7a7a; font-size: 16px; cursor: pointer; }
      .tab-button.is-active { border-bottom-color: ${colors.gold}; color: #e0e0e0; }
      .lightbox-nav { position: absolute; top: 50%; padding: 12px 16px; border: 0; border-radius: 6px; background: rgba(255, 255, 255, .08); color: #e0e0e0; font-size: 28px; cursor: pointer; transform: translateY(-50%); }
    </style>
  </head>
  <body>
    <div style="margin: 0 auto; padding: 32px; max-width: 1400px;">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: normal; color: #e0e0e0;">次に遊ぶゲーム</h1>
        <button id="pick-button" type="button" style="margin-left: auto; padding: 8px 20px; border: 0; border-radius: 4px; background: #232323; color: #e0e0e0; font-size: 16px; cursor: pointer;">1 本引く</button>
      </div>
      <div style="margin-bottom: 20px; border-bottom: 1px solid #232323;">
        <button type="button" class="tab-button is-active" data-tab-target="not-started">未着手 (${notStarted.length})</button>
        <button type="button" class="tab-button" data-tab-target="in-progress">着手済み (${inProgress.length})</button>
      </div>
      ${buildSectionHtml('not-started', '実績を 1 つも解除していないゲームを、完走しやすい順に並べています。', notStarted.map(buildNotStartedCardHtml), true)}
      ${buildSectionHtml('in-progress', '実績を解除し始めたゲームを、残りの実績が完走しやすい順に並べています。', inProgress.map(buildInProgressCardHtml), false)}
    </div>
    ${lightboxHtml}
    <script src="https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js"></script>
    <script>${clientScript('backlog.js')}</script>
    <script>${clientScript('lightbox.js')}</script>
  </body>
</html>
  `;
};

const buildSectionHtml = (key, description, cardsHtml, isVisible) => `
      <section data-tab="${key}" style="display: ${isVisible ? 'block' : 'none'};">
        <p style="margin: 0 0 16px; font-size: 12px; color: #6f6f6f;">${description}</p>
        ${cardsHtml.join('')}
      </section>`;

const lightboxHtml = `
    <div id="lightbox" style="display: none; position: fixed; inset: 0; z-index: 10; align-items: center; justify-content: center; background: rgba(0, 0, 0, .92);">
      <div id="lightbox-stage" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"></div>
      <button id="lightbox-prev" type="button" class="lightbox-nav" style="left: 24px;">‹</button>
      <button id="lightbox-next" type="button" class="lightbox-nav" style="right: 24px;">›</button>
    </div>
`;

const achievedCount = (achievements) => achievements.filter(({ achieved }) => achieved === 1).length;

const rarestPercent = (achievements) => {
  const percents = achievements.map(({ percent }) => percent).filter(Number.isFinite);

  return percents.length ? Math.min(...percents) : undefined;
};

const clientScript = (filename) => fs.readFileSync(path.join(__dirname, '..', 'client', filename), 'utf8');

module.exports = { buildBacklogHtml };
