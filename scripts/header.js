const fs = require('fs');
const path = require('path');
const { icon, colors } = require('./icons');

const buildHeaderHtml = (activePage) => `
    <script>${fs.readFileSync(path.join(__dirname, 'client', 'transition.js'), 'utf8')}</script>
    <header style="border-bottom: 1px solid #232323; background: #161616; view-transition-name: site-header;">
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
          <a href="${href}" style="position: relative; display: inline-flex; align-items: center; padding: 0 14px; color: ${isActive ? '#e0e0e0' : '#8f8f8f'}; font-size: 14px; text-decoration: none;">
            ${label}
            ${isActive ? `<span style="position: absolute; right: 0; bottom: 0; left: 0; height: 2px; background: ${colors.gold}; view-transition-name: nav-indicator;"></span>` : ''}
          </a>`;

const buildSharedHeadHtml = () => `<style>${sharedStyle}</style>`;

const sharedStyle = `
      html { scrollbar-gutter: stable; }
      @view-transition { navigation: auto; }
      ::view-transition-old(root), ::view-transition-new(root) { animation-duration: .25s; }
      ::view-transition-group(nav-indicator) { animation-duration: .35s; animation-timing-function: cubic-bezier(.2, .8, .2, 1); }
      @media (prefers-reduced-motion: reduce) {
        ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
      }
`;

const pages = [
  { key: 'index', href: 'index.html', label: 'ゲーム一覧' },
  { key: 'backlog', href: 'backlog.html', label: '次に遊ぶゲーム' },
  { key: 'roulette', href: 'roulette.html', label: '今日の一本' }
];

module.exports = { buildHeaderHtml, buildSharedHeadHtml };
