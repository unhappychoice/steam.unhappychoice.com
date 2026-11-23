const { icon } = require('../icons');

const buildCardHtml = (game, bodyHtml, timeToBeat) => `
      <div class="backlog-card" style="display: flex; gap: 28px; margin-bottom: 20px; padding: 24px; border-radius: 10px; background: #1a1a1a;">
        ${buildMediaHtml(game, game.store)}
        <div style="flex-grow: 1; min-width: 0;">
          ${buildTitleHtml(game.name, game.store.review)}
          ${bodyHtml}
          ${buildLinksHtml(game.appid, game.name, timeToBeat?.url)}
        </div>
      </div>`;

const buildMediaHtml = ({ capsuleUrl, headerUrl }, { trailerUrl, fullTrailerUrl }) => `
        <div data-full="${fullTrailerUrl ?? capsuleUrl}" data-type="${fullTrailerUrl ? 'video' : 'image'}" style="flex-shrink: 0; width: 520px; height: 297px; border-radius: 6px; overflow: hidden; background: #232323;">
          ${trailerUrl
            ? `<video src="${trailerUrl}" poster="${capsuleUrl}" muted loop playsinline preload="none" style="width: 100%; height: 100%; object-fit: cover;" onmouseover="this.play()" onmouseout="this.pause()"></video>`
            : `<img src="${capsuleUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror = null; this.src = '${headerUrl}';" />`}
        </div>`;

const buildTitleHtml = (name, review) => `
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span style="font-size: 24px; color: #e0e0e0;">${name}</span>
            ${review ? `<span style="font-size: 13px; color: #6f6f6f;">${review.review_score_label} (${review.percent_positive} %)</span>` : ''}
          </div>`;

const buildLinksHtml = (appid, name, igdbUrl) => `
          <div style="display: flex; gap: 20px; margin-top: 14px; font-size: 15px;">
            <a href="steam://rungameid/${appid}">▶ 起動</a>
            <a href="https://store.steampowered.com/app/${appid}" target="_blank" rel="noopener noreferrer">ストア</a>
            <a href="https://howlongtobeat.com/?q=${encodeURIComponent(name)}" target="_blank" rel="noopener noreferrer">HowLongToBeat</a>
            ${igdbUrl ? `<a href="${igdbUrl}" target="_blank" rel="noopener noreferrer">IGDB</a>` : ''}
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(name)}" target="_blank" rel="noopener noreferrer">YouTube</a>
          </div>`;

const buildTimeToBeatHtml = (timeToBeat, extraHtml = '') => `
          <div style="display: flex; align-items: center; gap: 14px; margin-top: 8px; font-size: 14px;">
            ${icon('clock', '#56ccf2', 16)}
            <span>クリア ${formatHours(timeToBeat?.normally)}</span>
            <span style="color: #e0e0e0;">全実績 ${formatHours(timeToBeat?.completely)}</span>
            ${extraHtml}
            ${timeToBeat?.count ? `<span style="font-size: 12px; color: #6f6f6f;">IGDB ${timeToBeat.count} 件の投稿</span>` : ''}
          </div>`;

const formatHours = (hours) => hours ? `約 ${hours} 時間` : '--';

const buildDifficultyBadgeHtml = (rarest) => {
  const [label, color] = difficulty(rarest);

  return `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 10px; background: ${color}22; color: ${color};">${icon('trophy', color, 12)}${label}</span>`;
};

const difficulty = (rarest) => {
  if (rarest === undefined) return ['不明', '#7a7a7a'];
  if (rarest >= 8) return ['完走しやすい', '#6fcf97'];

  return rarest >= 2 ? ['ふつう', '#f2c94c'] : ['やり込み', '#eb5757'];
};

const formatPercent = (percent) => percent === undefined ? '--' : `${percent.toFixed(1)} %`;

module.exports = { buildCardHtml, buildTimeToBeatHtml, buildDifficultyBadgeHtml, formatPercent };
