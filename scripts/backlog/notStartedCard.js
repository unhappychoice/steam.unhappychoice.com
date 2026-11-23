const { icon } = require('../icons');
const { buildCardHtml, buildTimeToBeatHtml } = require('./cardParts');

const buildNotStartedCardHtml = ({ game, achievements, rarestPercent, timeToBeat }) => buildCardHtml(game, `
          <div style="margin-top: 10px;">${game.store.tags.map(buildTagHtml).join('')}</div>
          <p style="margin: 12px 0; font-size: 15px; line-height: 1.7;">${game.store.shortDescription}</p>
          ${buildDifficultyHtml(achievements.length, rarestPercent)}
          ${buildTimeToBeatHtml(timeToBeat)}
          <div style="display: flex; gap: 8px; margin-top: 14px;">${game.store.screenshots.map(buildScreenshotHtml).join('')}</div>`);

const buildTagHtml = (tag) =>
  `<span style="display: inline-block; margin: 0 6px 4px 0; padding: 2px 10px; border-radius: 12px; background: #262626; font-size: 12px;">${tag}</span>`;

const buildScreenshotHtml = ({ thumbnailUrl, fullUrl }) =>
  `<img src="${thumbnailUrl}" data-full="${fullUrl}" data-type="image" loading="lazy" style="width: 200px; height: 113px; border-radius: 4px; object-fit: cover; background: #232323;" />`;

const buildDifficultyHtml = (count, rarest) => {
  const [label, color] = difficulty(rarest);

  return `
          <div style="display: flex; align-items: center; gap: 14px; font-size: 14px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 10px; background: ${color}22; color: ${color};">${icon('trophy', color, 12)}${label}</span>
            <span>実績 ${count} 個</span>
            <span title="100 % 達成したプレイヤーの割合はこの値以下です">最難関 ${rarest === undefined ? '--' : `${rarest.toFixed(1)} %`}</span>
          </div>`;
};

const difficulty = (rarest) => {
  if (rarest === undefined) return ['不明', '#7a7a7a'];
  if (rarest >= 8) return ['完走しやすい', '#6fcf97'];

  return rarest >= 2 ? ['ふつう', '#f2c94c'] : ['やり込み', '#eb5757'];
};

module.exports = { buildNotStartedCardHtml };
