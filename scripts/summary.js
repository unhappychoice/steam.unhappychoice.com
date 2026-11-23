const buildSummaryHtml = (games) => `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 32px 32px 8px;">
      ${summaryItems(games).map(buildSummaryCardHtml).join('')}
    </div>
`;

const summaryItems = (games) => {
  const withAchievements = games.filter(({ achievements }) => achievements?.length);
  const completed = withAchievements.filter(isBaseComplete);
  const dlcSets = games.flatMap(({ achievementSets }) => achievementSets.filter(({ isDlc }) => isDlc));
  const unlocked = sum(withAchievements.map(achievedCount));
  const total = sum(withAchievements.map(({ achievements }) => achievements.length));
  const startedRates = withAchievements.filter(game => achievedCount(game) > 0).map(game => achievedCount(game) / game.achievements.length);

  return [
    ['所持ゲーム', games.length, '本'],
    ['プレイ済み', games.filter(({ game }) => game.playtime_forever > 0).length, `/ ${games.length} 本`],
    ['総プレイ時間', Math.round(sum(games.map(({ game }) => game.playtime_forever)) / 60).toLocaleString(), '時間'],
    ['平均達成率', `${percent(sum(startedRates), startedRates.length)} %`, `${startedRates.length} 本の平均`],
    ['コンプリート', completed.length, `/ ${withAchievements.length} 本`, true],
    ['DLC 込みコンプリート', completed.filter(isDlcComplete).length, `/ ${withAchievements.length} 本`, true],
    ['解除した実績', unlocked.toLocaleString(), `/ ${total.toLocaleString()} (${percent(unlocked, total)} %)`],
    ['DLC セット完了', dlcSets.filter(({ achievedCount, achievements }) => achievedCount === achievements.length).length, `/ ${dlcSets.length} セット`]
  ];
};

const buildSummaryCardHtml = ([label, value, note, isHighlighted]) => `
      <div style="padding: 12px 16px; border-radius: 6px; background: #1a1a1a;">
        <div style="font-size: 12px; color: #7a7a7a;">${label}</div>
        <div style="margin-top: 4px; white-space: nowrap;">
          <span style="font-size: 24px; color: ${isHighlighted ? '#d4af37' : '#d0d0d0'};">${value}</span>
          <span style="margin-left: 4px; font-size: 12px; color: #7a7a7a;">${note}</span>
        </div>
      </div>`;

const isBaseComplete = (game) => achievedCount(game) === game.achievements.length;
const isDlcComplete = ({ dlcProgress }) => dlcProgress.achievedCount === dlcProgress.total;
const achievedCount = ({ achievements }) => achievements.filter(({ achieved }) => achieved === 1).length;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const percent = (numerator, denominator) => denominator ? Math.round(numerator / denominator * 100) : 0;

module.exports = { buildSummaryHtml };
