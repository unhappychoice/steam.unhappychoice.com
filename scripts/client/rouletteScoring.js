const moodTags = {
  light: ['カジュアル', 'リラックス', 'パズル', 'かわいい', '探し物', '心地よい', '健全', '放置', 'インクリメンタル', 'ミニマリスト', '短時間', '猫', '家族向け', '笑える', 'ポイント＆クリック'],
  challenge: ['高難易度', 'ソウルライク', 'ローグライク', 'ローグライト', 'ローグライクアクション', 'ペースの速い', '弾幕', 'ハックアンドスラッシュ', 'ストラテジー', 'FPS', 'シューティング', 'サバイバル', 'サバイバルホラー']
};
const oppositeMood = { light: 'challenge', challenge: 'light' };
const longPlayTags = ['物語性', 'オープンワールド', 'RPG'];

const countMoodTags = (tags, mood) => tags.filter(tag => moodTags[mood].includes(tag)).length;

const moodScore = ({ tags }, mood) =>
  mood === 'normal' ? 0 : (countMoodTags(tags, mood) - countMoodTags(tags, oppositeMood[mood])) * 2;

const timeScore = ({ completelyHours: hours, achievedCount, goal, tags }, time) => {
  if (time === 'short') return (achievedCount > 0 ? 1 : 0) + (goal.percent >= 30 ? 2 : 0) + (hours && hours <= 10 ? 1 : 0) - (hours >= 50 ? 2 : 0);
  if (time === 'long') return (hours >= 20 ? 2 : 0) + (tags.some(tag => longPlayTags.includes(tag)) ? 1 : 0);

  return 0;
};

const pickCandidate = ({ time, mood, shownAppids }) => {
  const ranked = candidates
    .filter(({ appid }) => !shownAppids.includes(appid))
    .map(candidate => ({ candidate, score: moodScore(candidate, mood) + timeScore(candidate, time) + Math.random() }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return ranked[Math.floor(Math.random() * ranked.length)]?.candidate;
};
