const difficulty = (rarest) => {
  if (rarest === undefined) return { label: '不明', color: '#7a7a7a' };
  if (rarest >= 8) return { label: '完走しやすい', color: '#6fcf97' };

  return rarest >= 2 ? { label: 'ふつう', color: '#f2c94c' } : { label: 'やり込み', color: '#eb5757' };
};

const rarestPercent = (achievements) => {
  const percents = achievements.map(({ percent }) => percent).filter(Number.isFinite);

  return percents.length ? Math.min(...percents) : undefined;
};

module.exports = { difficulty, rarestPercent };
