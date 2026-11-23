const { icon, colors } = require('./icons');

const buildHeaderHtml = (activePage) => `
    <header style="border-bottom: 1px solid #232323; background: #161616;">
      <div style="display: flex; align-items: center; margin: 0 auto; padding: 0 32px; max-width: 1400px; height: 56px;">
        <a href="index.html" style="display: inline-flex; align-items: center; gap: 10px; color: #e0e0e0; font-size: 17px; text-decoration: none;">
          ${icon('trophy', colors.gold, 20)}
          Steam Achievements
        </a>
        <nav style="display: flex; gap: 8px; margin-left: auto; height: 100%;">
          ${pages.map(page => buildNavLinkHtml(page, page.key === activePage)).join('')}
        </nav>
      </div>
    </header>
`;

const buildNavLinkHtml = ({ href, label }, isActive) => `
          <a href="${href}" style="display: inline-flex; align-items: center; padding: 0 14px; border-bottom: 2px solid ${isActive ? colors.gold : 'transparent'}; color: ${isActive ? '#e0e0e0' : '#8f8f8f'}; font-size: 14px; text-decoration: none;">${label}</a>`;

const pages = [
  { key: 'index', href: 'index.html', label: 'ゲーム一覧' },
  { key: 'backlog', href: 'backlog.html', label: '次に遊ぶゲーム' },
  { key: 'roulette', href: 'roulette.html', label: 'ルーレット' }
];

module.exports = { buildHeaderHtml };
