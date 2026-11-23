const timeFraming = { short: 'まず 30 分だけ', medium: '1〜2 時間だけ', long: 'じっくり腰を据えて' };

const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

const resultHtml = (candidate, { time, isWeekly, rerolls }) => `
  <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
    <div style="width: min(100%, 880px); aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden; background: #000;">
      ${candidate.trailerUrl
        ? `<video id="result-video" poster="${candidate.capsuleUrl}" muted autoplay loop controls playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>`
        : `<img src="${candidate.capsuleUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror = null; this.src = '${candidate.headerUrl}';" />`}
    </div>
    <div style="text-align: center;">
      ${isWeekly ? '<div style="margin-bottom: 6px; color: #d4af37; font-size: 13px;">今週の 1 本</div>' : ''}
      <div style="font-size: 30px; color: #f0f0f0;">${escapeHtml(candidate.name)}</div>
      <div style="margin-top: 8px; font-size: 13px;">
        ${candidate.review ? `${escapeHtml(candidate.review.label)}（${candidate.review.percent} % が好評）・` : ''}${candidate.tags.slice(0, 4).map(escapeHtml).join(' / ')}
      </div>
    </div>
    ${progressHtml(candidate)}
    ${goalHtml(candidate, time)}
    <a href="steam://rungameid/${candidate.appid}" class="launch-button">▶ 今すぐ起動</a>
    <div style="display: flex; gap: 12px;">
      <button type="button" class="secondary-button" data-action="reroll" ${rerolls > 0 ? '' : 'disabled'}>引き直す（今日あと ${rerolls} 回）</button>
      <button type="button" class="secondary-button" data-action="weekly" ${isWeekly ? 'disabled' : ''}>${isWeekly ? '今週の 1 本に設定済み' : '今週の 1 本にする'}</button>
      <button type="button" class="secondary-button" data-action="back">条件を変える</button>
    </div>
  </div>`;

const progressHtml = ({ achievedCount, total, difficulty }) => `
    <div style="display: flex; align-items: center; gap: 14px; font-size: 14px;">
      <span style="padding: 2px 10px; border-radius: 10px; background: ${difficulty.color}22; color: ${difficulty.color};">${difficulty.label}</span>
      ${achievedCount > 0
        ? `<span>すでに <b style="color: #d4af37;">${achievedCount} / ${total}</b> 解除済み。続きから始めよう</span>`
        : `<span>まだ手付かず。実績 ${total} 個が待っています</span>`}
    </div>`;

const goalHtml = ({ goal }, time) => `
    <div style="display: flex; align-items: center; gap: 16px; width: min(100%, 640px); padding: 16px 20px; border: 1px solid #d4af3755; border-radius: 10px; background: #1a1a1a;">
      <img src="${goal.iconUrl}" style="flex-shrink: 0; width: 56px; height: 56px; border-radius: 6px; background: #232323;" onerror="this.style.visibility='hidden';" />
      <div style="flex-grow: 1; min-width: 0;">
        <div style="font-size: 12px; color: #d4af37;">今日のゴール・${timeFraming[time]}</div>
        <div style="margin-top: 2px; font-size: 18px; color: #f0f0f0;">${escapeHtml(goal.name)}</div>
        <div style="font-size: 13px;">${escapeHtml(goal.description)}</div>
      </div>
      ${goal.percent === undefined ? '' : `<div style="flex-shrink: 0; text-align: right; font-size: 12px;"><div style="font-size: 20px; color: #e0e0e0;">${goal.percent} %</div>の人が解除済み</div>`}
    </div>`;

const weeklyBannerHtml = (candidate) => `
  <div style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; border: 1px solid #d4af3755; border-radius: 10px; background: #1a1a1a;">
    <img src="${candidate.headerUrl}" style="width: 120px; height: 56px; border-radius: 4px; object-fit: cover;" />
    <div style="flex-grow: 1;">
      <div style="font-size: 12px; color: #d4af37;">今週の 1 本</div>
      <div style="font-size: 16px; color: #f0f0f0;">${escapeHtml(candidate.name)}</div>
    </div>
    <a href="steam://rungameid/${candidate.appid}" class="secondary-button">▶ 続きから</a>
    <button type="button" class="secondary-button" data-action="show-weekly">表示</button>
  </div>`;
