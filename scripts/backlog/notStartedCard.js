const { buildCardHtml, buildTimeToBeatHtml, buildDifficultyBadgeHtml, formatPercent } = require('./cardParts');

const buildNotStartedCardHtml = ({ game, achievements, rarestPercent, timeToBeat }) => buildCardHtml(game, `
          <div style="margin-top: 10px;">${game.store.tags.map(buildTagHtml).join('')}</div>
          <p style="margin: 12px 0; font-size: 15px; line-height: 1.7;">${game.store.shortDescription}</p>
          ${buildDifficultyHtml(achievements.length, rarestPercent)}
          ${buildTimeToBeatHtml(timeToBeat)}
          <div style="display: flex; gap: 8px; margin-top: 14px;">${game.store.screenshots.map(buildScreenshotHtml).join('')}</div>`, timeToBeat);

const buildTagHtml = (tag) =>
  `<span style="display: inline-block; margin: 0 6px 4px 0; padding: 2px 10px; border-radius: 12px; background: #262626; font-size: 12px;">${tag}</span>`;

const buildScreenshotHtml = ({ thumbnailUrl, fullUrl }) =>
  `<img src="${thumbnailUrl}" data-full="${fullUrl}" data-type="image" loading="lazy" style="width: 200px; height: 113px; border-radius: 4px; object-fit: cover; background: #232323;" />`;

const buildDifficultyHtml = (count, rarest) => `
          <div style="display: flex; align-items: center; gap: 14px; font-size: 14px;">
            ${buildDifficultyBadgeHtml(rarest)}
            <span>実績 ${count} 個</span>
            <span title="100 % 達成したプレイヤーの割合はこの値以下です">最難関 ${formatPercent(rarest)}</span>
          </div>`;

module.exports = { buildNotStartedCardHtml };
