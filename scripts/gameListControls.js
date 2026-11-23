const fs = require('fs');
const path = require('path');

const buildDataAttributes = ({ game: { name, playtime_forever, playtime_2weeks }, achievements, achievementSets }, index) => {
  const achievedCount = achievements?.filter(({ achieved }) => achieved === 1).length ?? 0;
  const total = achievements?.length ?? 0;

  return [
    ['index', index],
    ['name', name.toLowerCase().replace(/"/g, '&quot;')],
    ['playtime', playtime_forever],
    ['playtime2w', playtime_2weeks ?? 0],
    ['percent', total ? achievedCount / total : ''],
    ['remaining', total ? total - achievedCount : ''],
    ['status', completionStatus(achievedCount, total)],
    ['dlc-incomplete', achievementSets.some(({ isDlc, achievedCount, achievements }) => isDlc && achievedCount < achievements.length)]
  ].map(([key, value]) => `data-${key}="${value}"`).join(' ');
};

const completionStatus = (achievedCount, total) => {
  if (!total) return 'none';
  if (achievedCount === total) return 'complete';

  return achievedCount === 0 ? 'not-started' : 'in-progress';
};

const buildControlsHtml = () => `
    <div style="position: sticky; top: 0; z-index: 1; padding: 16px 32px 8px; background: #121212;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px; font-size: 14px;">
        <input id="filter-search" type="search" placeholder="Search games" style="${inputStyle} width: 240px;" />
        <select id="filter-status" style="${inputStyle}">
          ${statusOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select>
        <label><input id="filter-hide-unplayed" type="checkbox" /> 未プレイを隠す</label>
        <label><input id="filter-dlc-incomplete" type="checkbox" /> DLC 未完了あり</label>
        <span id="visible-count" style="margin-left: auto;"></span>
      </div>
      <div style="display: flex; align-items: center; height: 24px; font-size: 13px;">
        <span style="display: inline-block; flex-shrink: 0; width: 86px; margin-right: 16px;"></span>
        ${sortButtonHtml('index', 'ゲーム名', 1, 'flex-grow: 1; text-align: left;')}
        ${sortButtonHtml('playtime', '総時間', -1, 'width: 60px; text-align: left;')}
        ${sortButtonHtml('playtime2w', '2週間', -1, 'width: 60px; text-align: left;')}
        ${sortButtonHtml('remaining', '残り実績', 1, 'width: 72px; text-align: right;')}
        ${sortButtonHtml('percent', '達成率', -1, 'width: 80px; text-align: left;')}
        <span style="display: inline-block; width: 24px;"></span>
      </div>
    </div>
`;

const sortButtonHtml = (key, label, defaultDirection, style) => `
        <button type="button" data-sort-key="${key}" data-label="${label}" data-default-direction="${defaultDirection}" style="${buttonStyle} ${style}">${label}</button>`;

const statusOptions = [
  ['all', 'すべて'],
  ['complete', 'コンプリート済み'],
  ['in-progress', '進行中'],
  ['not-started', '未着手'],
  ['none', '実績なし']
];

const inputStyle = 'padding: 6px 10px; border: 0; border-radius: 4px; background: #232323; color: #a2a2a2; font-size: 14px;';
const buttonStyle = 'margin: 0 16px 0 0; padding: 0; border: 0; background: none; color: #8f8f8f; font-size: 13px; cursor: pointer; white-space: nowrap;';

const gameListScript = () => fs.readFileSync(path.join(__dirname, 'client', 'gameList.js'), 'utf8');

module.exports = { buildDataAttributes, buildControlsHtml, gameListScript };
