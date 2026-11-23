const { steamId } = require('./config');

const buildLinksHtml = ({ appid, name }) => `
        <div style="margin: 8px 0 8px 102px; font-size: 13px;">
          ${linkGroups(appid, name).map(buildLinkGroupHtml).join('')}
        </div>`;

const linkGroups = (appid, name) => [
  ['Steam', [
    ['ストア', `https://store.steampowered.com/app/${appid}`],
    ['コミュニティ', `https://steamcommunity.com/app/${appid}`],
    ['ガイド', `https://steamcommunity.com/app/${appid}/guides/`],
    ['ニュース', `https://store.steampowered.com/news/app/${appid}`],
    ['自分の実績', `https://steamcommunity.com/profiles/${steamId}/stats/${appid}/?tab=achievements`],
    ['グローバル実績', `https://steamcommunity.com/stats/${appid}/achievements`],
    ['起動', `steam://rungameid/${appid}`]
  ]],
  ['攻略', [
    ['攻略', googleSearch(`${name} 攻略`)],
    ['全実績', googleSearch(`${name} 全実績`)],
    ['実績 解除方法', googleSearch(`${name} 実績 解除方法`)],
    ['Achievement Guide', googleSearch(`${name} achievement guide`)],
    ['Completionist', `https://completionist.me/steam/app/${appid}`],
    ['SteamDB', `https://steamdb.info/app/${appid}/`]
  ]],
  ['動画', [
    ['YouTube', youtubeSearch(name)],
    ['実況', youtubeSearch(`${name} 実況`)],
    ['VTuber', youtubeSearch(`${name} VTuber`)],
    ['全実績', youtubeSearch(`${name} 全実績`)],
    ['再生リスト', `${youtubeSearch(name)}&sp=EgIQAw%253D%253D`]
  ]]
];

const buildLinkGroupHtml = ([label, links]) => `
          <div style="display: flex; align-items: baseline; margin-bottom: 2px;">
            <span style="flex-shrink: 0; width: 56px; color: #6f6f6f;">${label}</span>
            <span style="display: flex; flex-wrap: wrap;">
              ${links.map(([text, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="margin: 0 16px 6px 0;">${text}</a>`).join('')}
            </span>
          </div>`;

const googleSearch = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
const youtubeSearch = (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

module.exports = { buildLinksHtml };
