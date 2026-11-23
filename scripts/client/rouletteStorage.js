const rerollLimit = 2;

const readStorage = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};

const writeStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const weekKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
};

const remainingRerolls = () => rerollLimit - (readStorage(`roulette-rerolls-${todayKey()}`) ?? 0);
const useReroll = () => writeStorage(`roulette-rerolls-${todayKey()}`, rerollLimit - remainingRerolls() + 1);

const weeklyAppid = () => {
  const weekly = readStorage('roulette-weekly');
  return weekly?.week === weekKey() ? weekly.appid : undefined;
};
const setWeeklyAppid = (appid) => writeStorage('roulette-weekly', { appid, week: weekKey() });
