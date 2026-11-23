const { colors } = require('../icons');
const { buildCardHtml, buildTimeToBeatHtml, buildDifficultyBadgeHtml, formatPercent } = require('./cardParts');
const { rarestPercent } = require('../difficulty');

const buildInProgressCardHtml = ({ game, achievements, timeToBeat }) => {
  const remaining = achievements
    .filter(({ achieved }) => achieved !== 1)
    .sort((a, b) => (b.percent || 0) - (a.percent || 0));
  const unlocked = achievements
    .filter(({ achieved }) => achieved === 1)
    .sort((a, b) => b.unlocktime - a.unlocktime);
  const achievedCount = unlocked.length;

  return buildCardHtml(game, `
          ${buildProgressHtml(achievedCount, achievements.length, rarestPercent(remaining))}
          ${buildTimeToBeatHtml(timeToBeat, `<span>プレイ済み ${Math.round(game.playtime_forever / 60)} 時間</span>`)}
          <div style="margin-top: 14px;">
            ${remaining.slice(0, 5).map(achievement => buildRemainingAchievementHtml(game.name, achievement)).join('')}
            <div data-more style="display: none;">
              ${remaining.slice(5).map(achievement => buildRemainingAchievementHtml(game.name, achievement)).join('')}
              ${unlocked.map(buildUnlockedAchievementHtml).join('')}
            </div>
            <button type="button" data-more-toggle data-label="すべての実績を表示（残り ${remaining.length} 個 / 解除済み ${unlocked.length} 個）" style="margin-top: 8px; padding: 4px 0; border: 0; background: none; color: #8f8f8f; font-size: 13px; cursor: pointer;">すべての実績を表示（残り ${remaining.length} 個 / 解除済み ${unlocked.length} 個）</button>
          </div>`, timeToBeat);
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

const buildUnlockedAchievementHtml = ({ name, description, percent, unlockedImageUrl, unlocktime }) => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 6px 0; border-top: 1px solid #232323; opacity: .55;">
              <img src="${unlockedImageUrl}" loading="lazy" style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 4px; background: #232323;" onerror="this.style.visibility='hidden';" />
              <div style="flex-grow: 1; min-width: 0;">
                <div style="color: #d0d0d0;">${name ?? ''}</div>
                <div style="overflow: hidden; font-size: 12px; white-space: nowrap; text-overflow: ellipsis;">${description ?? ''}</div>
              </div>
              <span style="flex-shrink: 0; width: 56px; text-align: right; font-size: 13px;">${Number.isFinite(percent) ? `${percent.toFixed(1)} %` : '--'}</span>
              <span style="flex-shrink: 0; width: 96px; text-align: right; font-size: 12px; color: ${colors.gold};">${new Date(unlocktime * 1000).toISOString().slice(0, 10)}</span>
            </div>`;

const googleSearch = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
const youtubeSearch = (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

module.exports = { buildInProgressCardHtml };
