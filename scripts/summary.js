const { icon, colors } = require('./icons');

const buildSummaryHtml = (games) => `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 32px 32px 8px;">
      ${summaryItems(games).map(buildSummaryCardHtml).join('')}
    </div>
`;

const summaryItems = (games) => {
  const withAchievements = games.filter(({ achievements }) => achievements?.length);
  const completed = withAchievements.filter(isBaseComplete);
  const dlcCompleted = completed.filter(isDlcComplete);
  const played = games.filter(({ game }) => game.playtime_forever > 0);
  const dlcSets = games.flatMap(({ achievementSets }) => achievementSets.filter(({ isDlc }) => isDlc));
  const completedDlcSets = dlcSets.filter(({ achievedCount, achievements }) => achievedCount === achievements.length);
  const unlocked = sum(withAchievements.map(achievedCount));
  const total = sum(withAchievements.map(({ achievements }) => achievements.length));
  const startedRates = withAchievements.filter(game => achievedCount(game) > 0).map(game => achievedCount(game) / game.achievements.length);
  const averageRate = startedRates.length ? sum(startedRates) / startedRates.length : 0;

  return [
    { label: '所持ゲーム', value: games.length, note: '本', iconName: 'gamepad', color: '#5aa9e6' },
    { label: 'プレイ済み', value: played.length, note: `/ ${games.length} 本`, iconName: 'play', color: '#6fcf97', ratio: ratioOf(played.length, games.length) },
    { label: '総プレイ時間', value: Math.round(sum(games.map(({ game }) => game.playtime_forever)) / 60).toLocaleString(), note: '時間', iconName: 'clock', color: '#56ccf2' },
    { label: '平均達成率', value: `${Math.round(averageRate * 100)} %`, note: `${startedRates.length} 本の平均`, iconName: 'trendingUp', color: '#f2994a', ratio: averageRate },
    { label: 'コンプリート', value: completed.length, note: `/ ${withAchievements.length} 本`, iconName: 'trophy', color: colors.gold, ratio: ratioOf(completed.length, withAchievements.length) },
    { label: 'DLC 込みコンプリート', value: dlcCompleted.length, note: `/ ${withAchievements.length} 本`, iconName: 'star', color: colors.gold, ratio: ratioOf(dlcCompleted.length, withAchievements.length) },
    { label: '解除した実績', value: unlocked.toLocaleString(), note: `/ ${total.toLocaleString()}`, iconName: 'check', color: '#4fd1c5', ratio: ratioOf(unlocked, total) },
    { label: 'DLC セット完了', value: completedDlcSets.length, note: `/ ${dlcSets.length} セット`, iconName: 'dlc', color: colors.dlc, ratio: ratioOf(completedDlcSets.length, dlcSets.length) }
  ];
};

const buildSummaryCardHtml = ({ label, value, note, iconName, color, ratio }) => `
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 8px; background: #1a1a1a;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="display: inline-flex; padding: 8px; border-radius: 50%; background: ${color}22;">${icon(iconName, color, 20)}</span>
          <div style="white-space: nowrap;">
            <div style="font-size: 12px; color: #7a7a7a;">${label}</div>
            <span style="font-size: 22px; color: #e0e0e0;">${value}</span>
            <span style="margin-left: 4px; font-size: 12px; color: #7a7a7a;">${note}</span>
          </div>
        </div>
        ${ratio === undefined ? '' : buildProgressBarHtml(ratio, color)}
      </div>`;

const buildProgressBarHtml = (ratio, color) => `
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #7a7a7a;">
          <div style="flex-grow: 1; height: 4px; border-radius: 2px; background: #2a2a2a;">
            <div style="width: ${Math.round(ratio * 100)}%; height: 100%; border-radius: 2px; background: ${color};"></div>
          </div>
          <span style="width: 32px; text-align: right;">${Math.round(ratio * 100)} %</span>
        </div>`;

const isBaseComplete = (game) => achievedCount(game) === game.achievements.length;
const isDlcComplete = ({ dlcProgress }) => dlcProgress.achievedCount === dlcProgress.total;
const achievedCount = ({ achievements }) => achievements.filter(({ achieved }) => achieved === 1).length;
const ratioOf = (numerator, denominator) => denominator ? numerator / denominator : 0;
const sum = (values) => values.reduce((total, value) => total + value, 0);

module.exports = { buildSummaryHtml };
