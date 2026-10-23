/* 5. 한살이 박람회 — 생물의 한살이를 소개하는 카드 만들기와 전시 */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, talkHTML, say, shake, spriteFluid, toast } = C;
  const STEPS = ['생물 고르기', '순서 놓기', '유형 고르기', '설명 쓰기', '꾸미고 전시'];
  F.Z = F.Z || {};

  const SAMPLES = [
    { k: 'frog', title: '물에서 땅으로! 개구리의 한살이', type: 'egg', color: 'sky', by: '봄이(예시)', note: '올챙이일 때는 아가미로 숨 쉬고 꼬리로 헤엄치다가, 다 자라면 땅에서도 살 수 있어요.', captions: F.EXPO_SUBJECTS.find((s) => s.k === 'frog').tips },
    { k: 'apple', title: '해마다 꽃 피는 사과나무', type: 'perennial', color: 'peach', by: '봄이(예시)', note: '사과나무는 겨울에 죽지 않고 겨울눈으로 겨울을 나요. 여러 해 동안 꽃과 열매를 되풀이해요.', captions: F.EXPO_SUBJECTS.find((s) => s.k === 'apple').tips }
  ];
  const subj = (k) => F.EXPO_SUBJECTS.find((s) => s.k === k);
  const stageSpr = (st, cls) => spriteFluid(st.sh, st.i, cls || '', st.t);
  const subjIcon = (s) => s.k === 'butterfly' ? spriteFluid('bf', 6) : s.k === 'balsam' ? spriteFluid('plants', 1) : s.k === 'apple' ? spriteFluid('plants', 8) : spriteFluid('animals', { frog: 3, chicken: 4, dog: 10 }[s.k]);

  function posterHTML(p, rot) {
    const s = subj(p.k), col = F.EXPO_COLORS.find((c) => c.k === p.color) || F.EXPO_COLORS[0];
    return `<article class="poster" style="background:${col.bg};color:${col.ink};${rot ? `--rot:${rot}deg` : ''}">
      <span class="ptype" style="color:${col.accent}">${esc(F.EXPO_TYPES[p.type])}</span>
      <h3>${esc(p.title)}</h3>
      <div class="pstages">${s.stages.map((st, i) => `<div class="pst">${stageSpr(st)}<b>${esc(st.t)}</b><span>${esc((p.captions || [])[i] || '')}</span></div>`).join('')}</div>
      ${p.note ? `<p class="pnote">${esc(p.note)}</p>` : ''}
      <p class="pby">만든 사람: ${esc(p.by || '')}</p>
    </article>`;
  }
  F.posterHTML = posterHTML;

  F.Z.expo = {
    render(view, arg) {
      const S = C.S;
      const d = S.expo.draft || (S.expo.draft = { step: 0, k: null, placed: [], type: null, title: '', captions: [], note: '', color: 'leaf' });
      if (arg === 'new') { S.expo.draft = { step: 0, k: null, placed: [], type: null, title: '', captions: [], note: '', color: 'leaf' }; C.save(); return F.go('expo'); }
      view.innerHTML = `<section class="zone wrap">${F.zoneHead('expo', C.stepsHTML(STEPS, d.step))}
        <div class="grid2">
          <div class="panel paper" id="work" style="min-width:0"></div>
          <div style="display:grid;gap:12px;align-content:start;min-width:0">
            ${talkHTML('', 'smile')}
            <div class="panel" id="side"></div>
          </div>
        </div>
        <div class="panel" style="background:url(assets/expo.jpg) center/cover;padding:0;overflow:hidden">
          <div style="background:linear-gradient(180deg,rgba(255,253,246,.0),rgba(255,253,246,.55) 30%,rgba(255,253,246,.9));padding:18px">
            <h2 style="font-size:30px;text-shadow:0 2px 0 #fff">한살이 박람회 게시판</h2>
            <p class="small" style="margin-bottom:10px">우리 반 친구들이 만든 카드도 여기에 붙여요. 아래는 봄이가 만든 예시예요.</p>
            <div class="gallery" id="gallery"></div>
          </div>
        </div></section>`;
      const talk = $('.talk', view), work = $('#work', view), side = $('#side', view);
      drawGallery();
      step();

      function drawGallery() {
        const mine = S.expo.posters.map((p, i) => posterHTML(p, [-1.5, 1.2, -.6][i % 3])).join('');
        $('#gallery', view).innerHTML = mine + SAMPLES.map((p, i) => posterHTML(p, i ? 1.4 : -1.1)).join('');
      }
      function setStep(n) { d.step = n; C.save(); $('.steps', view).outerHTML = C.stepsHTML(STEPS, n); step(); }

      function step() {
        if (d.step === 0) {
          say(talk, '박람회에 소개할 생물을 하나 골라요. 지금까지 관찰하고 조사한 생물 중에서 골라도 좋아요!', 'smile');
          work.innerHTML = `<span class="tape">1. 소개할 생물 고르기</span><div class="choice-grid" style="margin-top:12px">${F.EXPO_SUBJECTS.map((s) => `<button class="bigpick ${d.k === s.k ? 'on' : ''}" data-k="${s.k}"><div style="width:70%">${subjIcon(s)}</div><b>${esc(s.name)}</b><span class="small muted">${s.kind === 'animal' ? '동물' : '식물'}</span></button>`).join('')}</div>`;
          side.innerHTML = `<h3>소개 카드에 들어갈 것</h3><ul style="margin:6px 0 0;padding-left:20px"><li>한살이 단계 그림과 순서</li><li>한살이 유형(알·새끼, 한해·여러해)</li><li>단계별 설명과 알게 된 점</li></ul>`;
          $$('.bigpick', work).forEach((b) => b.addEventListener('click', () => {
            const s = subj(b.dataset.k); sfx('ok');
            Object.assign(d, { k: s.k, placed: [], type: null, title: `${s.name}의 한살이`, captions: s.tips.slice(), note: '' });
            setStep(1);
          }));
        } else if (d.step === 1) {
          const s = subj(d.k);
          say(talk, `${esc(s.name)}의 한살이 단계를 순서대로 놓아요.`, 'smile');
          const cards = C.shuffle(s.stages.map((st, i) => ({ ...st, i })), s.k.length * 7);
          work.innerHTML = `<span class="tape">2. ${esc(s.name)}의 한살이 순서</span>
            <div class="order" style="margin-top:12px">${s.stages.map((st, i) => `${i ? '<span class="arrow">→</span>' : ''}<div class="os ${d.placed[i] ? 'filled' : ''}" data-drop data-i="${i}"><span class="n">${i + 1}</span>${d.placed[i] ? stageSpr(st) + `<span>${esc(st.t)}</span>` : ''}</div>`).join('')}</div>
            <div class="stagecards" style="margin-top:10px">${cards.map((st) => `<button class="sc ${d.placed[st.i] ? 'used' : ''}" data-drag data-i="${st.i}">${stageSpr(st)}<span>${esc(st.t)}</span></button>`).join('')}</div>
            <div class="next-row" style="margin-top:10px"><button class="btn small ghost" id="back">← 다른 생물</button></div>`;
          side.innerHTML = `<div class="fact"><b>도움말</b>${s.kind === 'animal' ? '태어날 때의 모습부터 다 자란 모습까지 차례로 놓아요.' : '씨나 싹에서 시작해 꽃과 열매(또는 계절 순서)로 이어져요.'}</div>`;
          $('#back', work).addEventListener('click', () => setStep(0));
          C.dnd(work, {
            items: '.sc', targets: '.os',
            onDrop: (card, slot) => {
              const si = +slot.dataset.i, ci = +card.dataset.i, next = d.placed.filter(Boolean).length;
              if (d.placed[si]) return;
              if (si !== next || ci !== si) { sfx('no'); shake(card); say(talk, next === 0 ? '어떤 모습에서 한살이가 시작될까요?' : `${next}번 다음에는 어떤 모습일까요?`, 'wow'); return; }
              sfx('pop'); d.placed[si] = true; C.save(); slot.classList.add('filled'); slot.insertAdjacentHTML('beforeend', stageSpr(s.stages[si]) + `<span>${esc(s.stages[si].t)}</span>`); card.classList.add('used');
              if (d.placed.filter(Boolean).length === s.stages.length) { say(talk, '순서를 모두 맞췄어요!', 'good'); setTimeout(() => setStep(2), 600); }
            }
          });
        } else if (d.step === 2) {
          const s = subj(d.k);
          say(talk, `${esc(s.name)}의 한살이는 어떤 유형일까요?`, 'smile');
          const opts = s.kind === 'animal' ? ['egg', 'baby'] : ['annual', 'perennial'];
          work.innerHTML = `<span class="tape">3. 한살이 유형 고르기</span><div class="choice-grid" style="margin-top:12px">${opts.map((t) => `<button class="bigpick" data-t="${t}"><b>${esc(F.EXPO_TYPES[t])}</b><span class="small muted">${esc(t === 'egg' ? '알에서 새끼가 나와요' : t === 'baby' ? '어미가 새끼를 낳아요' : F.PLANT_TYPE_DESC[t])}</span></button>`).join('')}</div>`;
          side.innerHTML = '';
          $$('.bigpick', work).forEach((b) => b.addEventListener('click', () => {
            if (b.dataset.t === s.type) { sfx('ok'); d.type = s.type; C.save(); say(talk, `맞아요! ${esc(C.josa(s.name, '은/는'))} ${esc(F.EXPO_TYPES[s.type])}이에요.`, 'good'); setTimeout(() => setStep(3), 500); }
            else { sfx('no'); shake(b); say(talk, '도감관에서 알아본 내용을 떠올려 봐요.', 'wow'); }
          }));
        } else if (d.step === 3) {
          const s = subj(d.k);
          say(talk, '제목과 단계별 설명을 내 말로 다듬어요. 써 둔 예시를 고쳐 써도 좋아요.', 'smile');
          work.innerHTML = `<span class="tape">4. 설명 쓰기</span>
            <form id="pf" style="display:grid;gap:10px;margin-top:12px">
              <div class="field"><label for="ptitle">카드 제목</label><input class="input" id="ptitle" maxlength="24" value="${esc(d.title)}"></div>
              ${s.stages.map((st, i) => `<div class="field"><label for="pc${i}">${i + 1}. ${esc(st.t)}</label><input class="input" id="pc${i}" maxlength="30" value="${esc(d.captions[i] || '')}"></div>`).join('')}
              <div class="field"><label for="pnote">조사하며 새롭게 알게 된 점</label><textarea class="input" id="pnote" maxlength="120" placeholder="예) 올챙이는 뒷다리가 먼저 나와요.">${esc(d.note)}</textarea></div>
              <div class="next-row"><button class="btn small ghost" type="button" id="back">← 유형</button><button class="btn primary" type="submit">꾸미러 가기 →</button></div>
            </form>`;
          side.innerHTML = `<div class="fact"><b>잘 쓰는 방법</b>각 단계에서 <b>생김새</b>나 <b>하는 일</b>을 한 가지씩 써요. 예) “허물을 4번 벗으며 자라요.”</div>`;
          $('#back', work).addEventListener('click', () => setStep(2));
          $('#pf', work).addEventListener('submit', (e) => {
            e.preventDefault();
            d.title = $('#ptitle', work).value.trim() || `${s.name}의 한살이`;
            d.captions = s.stages.map((st, i) => $(`#pc${i}`, work).value.trim());
            d.note = $('#pnote', work).value.trim();
            C.save(); sfx('ok'); setStep(4);
          });
        } else {
          say(talk, '카드 색을 고르고 박람회 게시판에 붙여요!', 'smile');
          const p = { ...d, by: C.S.name || '나' };
          work.innerHTML = `<span class="tape">5. 꾸미고 전시하기</span>
            <div class="row" style="margin:12px 0" id="colors">${F.EXPO_COLORS.map((c) => `<button class="btn small ${d.color === c.k ? 'primary' : ''}" data-c="${c.k}" style="background:${c.bg}">${esc(c.name)}</button>`).join('')}</div>
            <div id="prev">${posterHTML(p)}</div>
            <div class="next-row" style="margin-top:12px">
              <button class="btn small ghost" id="back">← 설명 고치기</button>
              ${C.IS_ARTIFACT ? '' : '<button class="btn" id="save-img">그림으로 저장</button>'}
              <button class="btn primary" id="pin">게시판에 전시하기</button>
            </div>`;
          side.innerHTML = `<div class="fact"><b>나누기</b>${C.IS_ARTIFACT ? '전시한 카드는 농장 일지에도 모여요.' : '그림으로 저장해서 학급 게시판이나 패들렛에 올려 친구들과 나눠요.'}</div>`;
          $$('#colors .btn', work).forEach((b) => b.addEventListener('click', () => { d.color = b.dataset.c; C.save(); sfx('tap'); $$('#colors .btn', work).forEach((x) => x.classList.toggle('primary', x === b)); $('#prev', work).innerHTML = posterHTML({ ...d, by: C.S.name || '나' }); }));
          $('#back', work).addEventListener('click', () => setStep(3));
          const si = $('#save-img', work); if (si) si.addEventListener('click', () => exportPNG({ ...d, by: C.S.name || '나' }));
          $('#pin', work).addEventListener('click', () => {
            S.expo.posters.push({ k: d.k, title: d.title, type: d.type, captions: d.captions, note: d.note, color: d.color, by: C.S.name || '나', ts: Date.now() });
            S.expo.draft = { step: 0, k: null, placed: [], type: null, title: '', captions: [], note: '', color: 'leaf' };
            C.save(); drawGallery(); sfx('fanfare');
            if (!S.stamps.expo) F.stamp('expo', '박람회 전시'); else C.stampFX('전시 완료');
            work.innerHTML = `<span class="tape">전시 완료!</span><p style="margin-top:12px;font-size:18px">게시판에 내 카드가 붙었어요. 다른 생물로 한 장 더 만들어 볼까요?</p>
              <div class="next-row" style="margin-top:12px"><button class="btn" data-go="expo" data-arg="new">한 장 더 만들기</button><button class="btn primary" data-go="map">지도로 →</button></div>`;
            say(talk, '멋진 소개 카드예요! 생물에 따라 한살이의 유형이 다양하다는 것을 친구들에게 알려 줄 수 있겠어요.', 'good');
            $('#gallery', view).scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      }
    }
  };

  /* ───── 카드를 PNG로 저장 (웹 주소로 열었을 때) ───── */
  function loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
  async function exportPNG(p) {
    try {
      const s = subj(p.k), col = F.EXPO_COLORS.find((c) => c.k === p.color) || F.EXPO_COLORS[0];
      const W = 1200, H = 860, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d');
      try { await document.fonts.load('700 40px Gaegu'); await document.fonts.load('20px "Gowun Dodum"'); } catch (e) {}
      g.fillStyle = col.bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = col.ink; g.lineWidth = 8; g.strokeRect(14, 14, W - 28, H - 28);
      g.fillStyle = col.accent; g.font = '700 28px "Gowun Dodum", sans-serif'; g.fillText(F.EXPO_TYPES[p.type], 56, 82);
      g.fillStyle = col.ink; g.font = '700 64px Gaegu, sans-serif'; g.fillText(p.title, 52, 156);
      const n = s.stages.length, cw = (W - 104) / n;
      for (let i = 0; i < n; i++) {
        const st = s.stages[i], sh = F.SHEETS[st.sh], im = await loadImg(sh.src);
        const x = 52 + i * cw, y = 200;
        g.fillStyle = 'rgba(255,255,255,.8)'; roundRect(g, x + 6, y, cw - 12, 470, 22); g.fill();
        const col0 = st.i % sh.cols, row0 = Math.floor(st.i / sh.cols), size = Math.min(cw - 40, 230);
        g.drawImage(im, col0 * sh.cell, row0 * sh.cell, sh.cell, sh.cell, x + (cw - size) / 2, y + 16, size, size);
        g.fillStyle = col.ink; g.textAlign = 'center';
        g.font = '700 34px Gaegu, sans-serif'; g.fillText(st.t, x + cw / 2, y + size + 62);
        g.font = '22px "Gowun Dodum", sans-serif'; wrap(g, (p.captions || [])[i] || '', x + cw / 2, y + size + 100, cw - 36, 30);
        if (i) { g.font = '700 40px sans-serif'; g.fillText('→', x - 2, y + 140); }
        g.textAlign = 'left';
      }
      g.fillStyle = col.ink; g.font = '24px "Gowun Dodum", sans-serif';
      if (p.note) wrap(g, '알게 된 점: ' + p.note, 56, 726, W - 112, 34, 'left');
      g.font = '20px "Gowun Dodum", sans-serif'; g.textAlign = 'right'; g.fillText(`만든 사람: ${p.by}  ·  꼬물꼬물 한살이 농장`, W - 52, H - 44);
      cv.toBlob((b) => {
        if (!b) { toast('그림을 만들 수 없어요.', 'bad'); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${p.title}.png`; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('그림 파일로 저장했어요!', 'good');
      }, 'image/png');
    } catch (e) {
      toast('이 방식으로 연 파일에서는 그림 저장이 막혀 있어요. 인터넷 주소(GitHub Pages)로 열면 저장돼요.', 'bad');
    }
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function wrap(g, text, x, y, maxW, lh, align) {
    g.textAlign = align || 'center';
    let line = '', yy = y;
    for (const ch of Array.from(text)) {
      const t = line + ch;
      if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = ch; yy += lh; } else line = t;
    }
    if (line) g.fillText(line, x, yy);
    g.textAlign = 'left';
  }
})();
