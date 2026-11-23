const { difficulty, rarestPercent } = require('../difficulty');

const buildCandidates = (games, timesByAppid) => games
  .filter(({ achievements }) => achievements?.length && achievements.some(({ achieved }) => achieved !== 1))
  .map(gameStats => buildCandidate(gameStats, timesByAppid[gameStats.game.appid]));

const buildCandidate = ({ game, achievements }, timeToBeat) => {
  const remaining = achievements.filter(({ achieved }) => achieved !== 1);
  const achievedCount = achievements.length - remaining.length;

  return {
    appid: game.appid,
    name: game.name,
    capsuleUrl: game.capsuleUrl,
    headerUrl: game.headerUrl,
    libraryUrl: game.libraryUrl,
    trailerUrl: game.store.fullTrailerUrl,
    tags: game.store.tags,
    review: game.store.review && { label: game.store.review.review_score_label, percent: game.store.review.percent_positive },
    completelyHours: timeToBeat?.completely,
    playtimeHours: Math.round(game.playtime_forever / 60),
    achievedCount,
    total: achievements.length,
    difficulty: difficulty(rarestPercent(remaining)),
    goal: buildGoal(remaining)
  };
};

const buildGoal = (remaining) => {
  const easiest = [...remaining].sort((a, b) => (b.percent || 0) - (a.percent || 0))[0];

  return {
    name: easiest.name ?? '',
    description: easiest.description ?? '',
    percent: Number.isFinite(easiest.percent) ? Math.round(easiest.percent * 10) / 10 : undefined,
    iconUrl: easiest.imageUrl
  };
};

module.exports = { buildCandidates };
