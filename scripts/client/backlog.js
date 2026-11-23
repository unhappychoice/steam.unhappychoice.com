const $tabButtons = [...document.querySelectorAll('[data-tab-target]')];
const $sections = [...document.querySelectorAll('[data-tab]')];

const showTab = (key) => {
  $tabButtons.forEach($button => $button.classList.toggle('is-active', $button.dataset.tabTarget === key));
  $sections.forEach($section => { $section.style.display = $section.dataset.tab === key ? 'block' : 'none'; });
};

const pickCard = () => {
  const $cards = [...document.querySelectorAll('[data-tab]')]
    .filter($section => $section.style.display !== 'none')
    .flatMap($section => [...$section.querySelectorAll('.backlog-card')]);
  const $card = $cards[Math.floor(Math.random() * $cards.length)];
  document.querySelectorAll('.backlog-card').forEach($c => $c.classList.toggle('is-picked', $c === $card));
  $card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

$tabButtons.forEach($button => $button.addEventListener('click', () => showTab($button.dataset.tabTarget)));
document.getElementById('pick-button').addEventListener('click', pickCard);
