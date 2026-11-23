const fs = require('fs');
const path = require('path');
const { colors } = require('../icons');
const { buildHeaderHtml, buildSharedHeadHtml } = require('../header');
const { buildCandidates } = require('./candidates');

const buildRouletteHtml = (games, timesByAppid) => `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>今日の一本</title>
    ${buildSharedHeadHtml()}
    <style>
      body { margin: 0; background: #121212; color: #a2a2a2; font-size: 14px; }
      a:link, a:visited { color: #aaaabb; text-decoration: none; }
      .option-button { padding: 14px 22px; border: 1px solid #2c2c2c; border-radius: 10px; background: #1a1a1a; color: #a2a2a2; font-size: 16px; cursor: pointer; }
      .option-button.is-selected { border-color: ${colors.gold}; background: ${colors.gold}1a; color: #f0f0f0; }
      .launch-button, a.launch-button:link, a.launch-button:visited { padding: 16px 56px; border-radius: 12px; background: ${colors.gold}; color: #121212; font-size: 22px; font-weight: bold; }
      .launch-button:hover { filter: brightness(1.1); }
      .secondary-button, a.secondary-button:link, a.secondary-button:visited { padding: 8px 16px; border: 1px solid #2c2c2c; border-radius: 8px; background: #1a1a1a; color: #a2a2a2; font-size: 13px; cursor: pointer; }
      .secondary-button:disabled { opacity: .4; cursor: default; }
    </style>
  </head>
  <body>
    ${buildHeaderHtml('roulette')}
    <div style="margin: 0 auto; padding: 32px; max-width: 1000px;">
      <div id="weekly-banner" style="margin-bottom: 24px;"></div>
      ${buildQuestionScreenHtml()}
      <div id="shuffle-screen" style="display: none; text-align: center;">
        <img id="shuffle-image" style="width: 300px; height: 450px; border-radius: 10px; object-fit: cover; background: #232323;" />
      </div>
      <div id="result-screen" style="display: none;"></div>
    </div>
    <script>const candidates = ${JSON.stringify(buildCandidates(games, timesByAppid)).replace(/</g, '\\u003c')};</script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js"></script>
    ${['rouletteStorage.js', 'rouletteScoring.js', 'rouletteView.js', 'roulette.js'].map(file => `<script>${clientScript(file)}</script>`).join('\n')}
  </body>
</html>
`;

const buildQuestionScreenHtml = () => `
      <div id="question-screen" style="text-align: center;">
        <h1 style="margin: 24px 0 8px; font-size: 28px; font-weight: normal; color: #f0f0f0;">今日の一本を決めよう</h1>
        <p style="margin: 0 0 36px; color: #6f6f6f;">2 つ答えるだけで、今の自分に合う 1 本を選びます</p>
        ${questionHtml('time', '今日はどれくらい遊べる？', [['short', '30 分'], ['medium', '1〜2 時間'], ['long', 'がっつり']], 'medium')}
        ${questionHtml('mood', '今の気分は？', [['light', '頭を使わない'], ['normal', 'ふつう'], ['challenge', '挑戦したい']], 'normal')}
        <button id="draw-button" type="button" class="launch-button" style="margin-top: 16px; border: 0; cursor: pointer;">引く</button>
      </div>`;

const questionHtml = (key, label, options, defaultValue) => `
        <div style="margin-bottom: 32px;">
          <div style="margin-bottom: 12px; font-size: 16px; color: #d0d0d0;">${label}</div>
          <div style="display: flex; justify-content: center; gap: 12px;">
            ${options.map(([value, text]) => `<button type="button" class="option-button${value === defaultValue ? ' is-selected' : ''}" data-question="${key}" data-value="${value}">${text}</button>`).join('')}
          </div>
        </div>`;

const clientScript = (filename) => fs.readFileSync(path.join(__dirname, '..', 'client', filename), 'utf8');

module.exports = { buildRouletteHtml };
