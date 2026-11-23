const $questions = document.getElementById('question-screen');
const $shuffle = document.getElementById('shuffle-screen');
const $shuffleImage = document.getElementById('shuffle-image');
const $result = document.getElementById('result-screen');
const $weekly = document.getElementById('weekly-banner');
const rouletteState = { time: 'medium', mood: 'normal', shownAppids: [] };

const findCandidate = (appid) => candidates.find(candidate => candidate.appid === appid);

const showScreen = ($screen) => [$questions, $shuffle, $result].forEach($s => { $s.style.display = $s === $screen ? 'block' : 'none'; });

const selectOption = ($button) => {
  const { question, value } = $button.dataset;
  rouletteState[question] = value;
  document.querySelectorAll(`[data-question="${question}"]`).forEach($b => $b.classList.toggle('is-selected', $b === $button));
};

const playTrailer = (url) => {
  const $video = document.getElementById('result-video');
  if (!$video) return;
  if ($video.canPlayType('application/vnd.apple.mpegurl')) return void ($video.src = url);
  if (!window.Hls?.isSupported()) return;
  const hls = new Hls();
  hls.loadSource(url);
  hls.attachMedia($video);
};

const showResult = (candidate) => withTransition(() => renderResult(candidate));

const renderResult = (candidate) => {
  const isWeekly = weeklyAppid() === candidate.appid;
  $result.innerHTML = resultHtml(candidate, { time: rouletteState.time, isWeekly, rerolls: remainingRerolls() });
  showScreen($result);
  playTrailer(candidate.trailerUrl);
  rouletteState.current = candidate;
};

const shuffleImages = (finish, step = 0) => {
  const delay = 50 + step ** 2 * 1.2;
  if (delay > 320) return finish();
  $shuffleImage.src = candidates[Math.floor(Math.random() * candidates.length)].libraryUrl;
  setTimeout(() => shuffleImages(finish, step + 1), delay);
};

const draw = () => {
  const candidate = pickCandidate(rouletteState);
  if (!candidate) return;
  rouletteState.shownAppids.push(candidate.appid);
  withTransition(() => showScreen($shuffle));
  shuffleImages(() => showResult(candidate));
};

const renderWeeklyBanner = () => {
  const candidate = findCandidate(weeklyAppid());
  $weekly.innerHTML = candidate ? weeklyBannerHtml(candidate) : '';
};

const actions = {
  reroll: () => { useReroll(); draw(); },
  weekly: () => { setWeeklyAppid(rouletteState.current.appid); renderWeeklyBanner(); showResult(rouletteState.current); },
  back: () => withTransition(() => showScreen($questions)),
  'show-weekly': () => showResult(findCandidate(weeklyAppid()))
};

document.querySelectorAll('[data-question]').forEach($button => $button.addEventListener('click', () => selectOption($button)));
document.getElementById('draw-button').addEventListener('click', draw);
document.addEventListener('click', ({ target }) => actions[target.closest('[data-action]')?.dataset.action]?.());
renderWeeklyBanner();
showScreen($questions);
