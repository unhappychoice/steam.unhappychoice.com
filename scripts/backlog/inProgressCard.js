const { colors } = require('../icons');
const { buildCardHtml, buildTimeToBeatHtml, buildDifficultyBadgeHtml, formatPercent } = require('./cardParts');

const buildInProgressCardHtml = ({ game, achievements, timeToBeat }) => {
  const remaining = achievements
    .filter(({ achieved }) => achieved !== 1)
    .sort((a, b) => (b.percent || 0) - (a.percent || 0));
  const achievedCount = achievements.length - remaining.length;

  return buildCardHtml(game, `
          ${buildProgressHtml(achievedCount, achievements.length, rarestPercent(remaining))}
          ${buildTimeToBeatHtml(timeToBeat, `<span>プレイ済み ${Math.round(game.playtime_forever / 60)} 時間</span>`)}
          <div style="margin-top: 14px;">
            ${remaining.slice(0, 5).map(achievement => buildRemainingAchievementHtml(game.name, achievement)).join('')}
            ${remaining.length > 5 ? `<div style="margin-top: 6px; font-size: 12px; color: #6f6f6f;">ほか ${remaining.length - 5} 個</div>` : ''}
          </div>`);
};

const buildProgressHtml = (achievedCount, total, rarestRemaining) => `
          <div style="display: flex; align-items: center; gap: 14px; margin-top: 12px; font-size: 14px;">
            ${buildDifficultyBadgeHtml(rarestRemaining)}
            <div style="flex-grow: 1; max-width: 360px; height: 6px; border-radius: 3px; background: #2a2a2a;">
              <div style="width: ${Math.round(achievedCount / total * 100)}%; height: 100%; border-radius: 3px; background: ${colors.gold};"></div>
            </div>
            <span style="color: #e0e0e0;">${achievedCount} / ${total}</span>
            <span>残り ${total - achievedCount} 個</span>
            <span title="残りの実績のうち、いちばん解除率が低いもの">残りの最難関 ${formatPercent(rarestRemaining)}</span>
          </div>`;

const rarestPercent = (achievements) => {
  const percents = achievements.map(({ percent }) => percent).filter(Number.isFinite);

  return percents.length ? Math.min(...percents) : undefined;
};

const buildRemainingAchievementHtml = (gameName, { name, englishName, description, percent, imageUrl }) => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 6px 0; border-top: 1px solid #232323;">
              <img src="${imageUrl}" loading="lazy" style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 4px; background: #232323;" onerror="this.style.visibility='hidden';" />
              <div style="flex-grow: 1; min-width: 0;">
                <div style="color: #d0d0d0;">${name ?? ''}</div>
                <div style="overflow: hidden; font-size: 12px; white-space: nowrap; text-overflow: ellipsis;">${description ?? ''}</div>
              </div>
              <span style="flex-shrink: 0; width: 56px; text-align: right; font-size: 13px;">${Number.isFinite(percent) ? `${percent.toFixed(1)} %` : '--'}</span>
              <span style="display: flex; flex-shrink: 0; gap: 12px; font-size: 12px;">
                <a href="${youtubeSearch(`${gameName} ${name}`)}" target="_blank" rel="noopener noreferrer">YouTube</a>
                <a href="${googleSearch(`${gameName} ${englishName ?? name} achievement`)}" target="_blank" rel="noopener noreferrer">Google</a>
              </span>
            </div>`;

const googleSearch = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
const youtubeSearch = (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

module.exports = { buildInProgressCardHtml };
