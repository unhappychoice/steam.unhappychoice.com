const $list = document.getElementById('games');
const $items = [...$list.children];
const $search = document.getElementById('filter-search');
const $status = document.getElementById('filter-status');
const $hideUnplayed = document.getElementById('filter-hide-unplayed');
const $dlcIncomplete = document.getElementById('filter-dlc-incomplete');
const $count = document.getElementById('visible-count');
const $sortButtons = [...document.querySelectorAll('[data-sort-key]')];
const sortState = { key: 'index', direction: 1 };

const matches = ({ dataset }) =>
  dataset.name.includes($search.value.trim().toLowerCase()) &&
  ($status.value === 'all' || dataset.status === $status.value) &&
  (!$hideUnplayed.checked || +dataset.playtime > 0) &&
  (!$dlcIncomplete.checked || dataset.dlcIncomplete === 'true');

const sortValue = (item) => item.dataset[sortState.key] === '' ? null : +item.dataset[sortState.key];

const compare = (a, b) => {
  const [x, y] = [sortValue(a), sortValue(b)];
  if (x === null || y === null) return (x === null) - (y === null);

  return (x - y) * sortState.direction || a.dataset.index - b.dataset.index;
};

const renderSortButtons = () => $sortButtons.forEach(button => {
  const isActive = button.dataset.sortKey === sortState.key;
  button.textContent = `${button.dataset.label}${isActive ? (sortState.direction > 0 ? ' ▲' : ' ▼') : ''}`;
  button.style.color = isActive ? '#e0e0e0' : '#8f8f8f';
});

const render = () => {
  const visibleItems = new Set($items.filter(matches));
  $items.forEach(item => { item.style.display = visibleItems.has(item) ? '' : 'none'; });
  [...$items].sort(compare).forEach(item => $list.appendChild(item));
  $count.textContent = `${visibleItems.size} / ${$items.length}`;
  renderSortButtons();
};

const changeSort = ({ dataset: { sortKey, defaultDirection } }) => {
  sortState.direction = sortState.key === sortKey ? -sortState.direction : +defaultDirection;
  sortState.key = sortKey;
  render();
};

const toggleSets = ($row, event) => {
  if (event.target.closest('a')) return;
  const $sets = $row.closest('li').querySelector('[data-sets]');
  const isOpening = $sets.style.display === 'none';
  $sets.style.display = isOpening ? '' : 'none';
  $row.querySelector('[data-chevron]').style.transform = isOpening ? 'rotate(180deg)' : '';
};

document.querySelectorAll('[data-set-toggle]').forEach($row => $row.addEventListener('click', event => toggleSets($row, event)));
$sortButtons.forEach(button => button.addEventListener('click', () => changeSort(button)));
[$search, $status, $hideUnplayed, $dlcIncomplete].forEach($control => $control.addEventListener('input', render));
render();
