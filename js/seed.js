/* 2. 씨앗 실험실 — 씨가 싹 트는 데 필요한 조건 (예상 → 관찰 → 설명) */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, talkHTML, say, shake, choices } = C;
  const STEPS = ['다르게 할 조건', '같게 할 조건', '결과 예상', '관찰하기', '결론'];
  F.Z = F.Z || {};

  F.Z.seed = {
    render(view, arg) {
      const S = C.S;
      const which = arg || (!S.seed.exp1 || !S.seed.exp1.done ? 'exp1' : !S.seed.exp2 || !S.seed.exp2.done ? 'exp2' : 'final');
      if (which === 'final') return renderFinal(view);
      renderExp(view, which);
    }
  };

  function expState(key) {
    const S = C.S;
    if (!S.seed[key]) {
      const E = F.SEED[key];
      const b = {}, a = {};
      E.conds.forEach((c) => { b[c.k] = c.k === E.vary ? 0 : (c.bStart != null ? c.bStart : 0); if (c.aOpts) a[c.k] = 0; });
      S.seed[key] = { step: 0, b, a, predict: null, day: 0, concl: false, done: false };
    }
    return S.seed[key];
  }
  // 조건이 같은지
  function sameCond(E, st, c) {
    if (c.k === E.vary) return false;
    if (c.aFix) return st.a[c.k] === 1;          // 냉장고 안은 어두우므로 밖의 컵도 어둠상자에 넣어야 같아짐
    return st.b[c.k] === 0;
  }
  function fairCount(E, st) {
    const others = E.conds.filter((c) => c.k !== E.vary);
    return { ok: others.filter((c) => sameCond(E, st, c)).length, n: others.length };
  }

  function renderExp(view, key) {
    const S = C.S, E = F.SEED[key], st = expState(key);
    const no = key === 'exp1' ? 1 : 2;
    view.innerHTML = `<section class="zone wrap">${F.zoneHead('seed', C.stepsHTML(STEPS, Math.min(st.step, 4)))}
      <div class="row">
        <button class="btn small ${key === 'exp1' ? 'primary' : ''}" data-go="seed" data-arg="exp1">실험 1 · 물</button>
        <button class="btn small ${key === 'exp2' ? 'primary' : ''}" data-go="seed" data-arg="exp2" ${S.seed.exp1 && S.seed.exp1.done || S.teacher ? '' : 'disabled'}>실험 2 · 온도</button>
        <button class="btn small" data-go="seed" data-arg="final" ${S.seed.exp2 && S.seed.exp2.done || S.teacher ? '' : 'disabled'}>정리하기</button>
      </div>
      <div class="grid2">
        <div class="panel paper" style="min-width:0"><span class="tape">실험 ${no}. ${esc(E.q)}</span>
          <div class="bench" id="bench" style="margin-top:10px"></div>
          <div class="fair" id="fair" style="margin-top:12px"></div>
        </div>
        <div style="display:grid;gap:12px;align-content:start;min-width:0">
          ${talkHTML('', 'smile')}
          <div class="panel" id="stepbox"></div>
        </div>
      </div></section>`;
    const talk = $('.talk', view), bench = $('#bench', view), stepbox = $('#stepbox', view), fair = $('#fair', view);

    function drawBench() {
      const visA = cupVis(key, 'A', st), visB = cupVis(key, 'B', st);
      bench.innerHTML = ['A', 'B'].map((w) => `
        <div class="setup">
          <div class="who"><i>${w}</i>${w === 'A' ? (key === 'exp1' ? '물을 담은 컵' : '냉장고 밖') : (key === 'exp1' ? '물을 담지 않은 컵' : '냉장고 안')}</div>
          ${w === 'A' ? visA : visB}
          <div class="conds">${E.conds.map((c) => condRow(E, st, c, w)).join('')}</div>
        </div>`).join('');
      const f = fairCount(E, st);
      const varyOk = st.step >= 1;
      fair.innerHTML = `<b style="font-family:var(--font-display);font-size:19px">공정한 실험 저울</b>
        <span class="meter" aria-label="같게 한 조건 ${f.ok}/${f.n}"><b style="width:${varyOk ? (f.ok / f.n) * 100 : 0}%"></b></span>
        <span class="small">다르게 할 조건 <b>${varyOk ? esc(E.conds.find((c) => c.k === E.vary).name) : '?'}</b> · 같게 할 조건 <b>${varyOk ? f.ok : 0}/${f.n}</b></span>`;
      $$('button.v', bench).forEach((b) => b.addEventListener('click', () => toggle(b.dataset.k, b.dataset.w)));
    }
    function condRow(E, st, c, w) {
      const isVary = c.k === E.vary;
      let val, cls = '', btn = false;
      if (w === 'A') {
        if (c.aOpts) { val = c.aOpts[st.a[c.k] || 0]; btn = st.step === 1; cls = st.step >= 1 ? (sameCond(E, st, c) ? 'same' : 'diff') : ''; }
        else { val = c.a; cls = st.step >= 1 ? (isVary ? 'vary' : (sameCond(E, st, c) ? 'same' : 'diff')) : ''; }
      } else {
        val = c.bOpts[st.b[c.k] || 0];
        if (c.aFix) { cls = st.step >= 1 ? (sameCond(E, st, c) ? 'same' : 'diff') : ''; }
        else if (isVary) cls = st.step >= 1 ? 'vary' : '';
        else { cls = st.step >= 1 ? (sameCond(E, st, c) ? 'same' : 'diff') : ''; btn = st.step === 1 && c.bOpts.length > 1; }
      }
      const tag = btn ? 'button' : 'span';
      return `<div class="cond"><span class="k">${esc(c.name)}</span><${tag} class="v ${cls} ${btn ? '' : 'locked'}" ${btn ? `data-k="${c.k}" data-w="${w}"` : ''}>${esc(val)}</${tag}></div>`;
    }
    function toggle(k, w) {
      const c = E.conds.find((x) => x.k === k);
      if (w === 'A') st.a[k] = ((st.a[k] || 0) + 1) % c.aOpts.length;
      else st.b[k] = ((st.b[k] || 0) + 1) % c.bOpts.length;
      sfx('tap'); C.save(); drawBench();
      const f = fairCount(E, st);
      if (f.ok === f.n) { sfx('ok'); say(talk, '다르게 할 조건 하나만 빼고 나머지를 모두 같게 맞췄어요. 이제 공정한 실험이에요!', 'good'); setTimeout(() => { st.step = 2; C.save(); drawStep(); drawBench(); }, 600); }
      else if (c.aFix && st.a[k] === 1) say(talk, '맞아요! 냉장고 안은 어두우니까, 냉장고 밖의 컵도 <b>어둠상자</b>에 넣어야 빛 조건이 같아져요.', 'good');
    }

    function drawStep() {
      const f = fairCount(E, st);
      $('.steps', view).outerHTML = C.stepsHTML(STEPS, Math.min(st.step, 4));
      if (st.step === 0) {
        say(talk, key === 'exp1' ? '봄이 되면 많은 식물이 싹 터요. 씨가 싹 트려면 무엇이 필요할까요? 먼저 <b>물</b>이 필요한지 알아봐요.' : '물 말고 또 필요한 조건이 있을까요? 이번엔 <b>온도</b>를 알아봐요. 냉장고 안은 차갑지요!', 'smile');
        const opts = C.shuffle(E.conds.map((c) => c.name), 4);
        stepbox.innerHTML = `<h3>1. 다르게 할 조건은?</h3><p class="muted small" style="margin-bottom:8px">‘${esc(E.q)}’를 알아보려면 무엇을 다르게 해야 할까요?</p>
          <div class="choices">${opts.map((n) => `<button class="choice" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
        $$('.choice', stepbox).forEach((b) => b.addEventListener('click', () => {
          const right = E.conds.find((c) => c.k === E.vary).name;
          if (b.dataset.n === right) { sfx('ok'); b.classList.add('ok'); st.step = 1; C.save(); setTimeout(() => { drawStep(); drawBench(); }, 500); }
          else { sfx('no'); b.classList.add('bad'); shake(b); say(talk, '알아보려는 것과 관계있는 조건 <b>하나만</b> 다르게 해요.', 'wow'); }
        }));
      } else if (st.step === 1) {
        say(talk, key === 'exp1'
          ? '이제 물을 뺀 나머지 조건은 모두 <b>같게</b> 해야 해요. B 컵에서 빨간 칸을 눌러 A와 같게 바꿔 봐요.'
          : '온도 말고는 모두 같게! 빨간 칸을 눌러 바꿔요. <b>빛</b> 조건도 잘 살펴봐요.', 'smile');
        stepbox.innerHTML = `<h3>2. 같게 할 조건 맞추기</h3><p class="muted small">빨간 칸(다른 조건)을 눌러 초록 칸(같은 조건)으로 바꿔요. 노란 칸은 다르게 할 조건이에요.</p>
          <p style="margin-top:8px;font-size:17px">같게 맞춘 조건: <b>${f.ok}</b> / ${f.n}</p>
          ${S.teacher ? '<button class="btn small ghost" id="tskip" style="margin-top:8px">모두 같게(교사)</button>' : ''}`;
        const ts = $('#tskip', stepbox); if (ts) ts.addEventListener('click', () => { E.conds.forEach((c) => { if (c.k !== E.vary) { if (c.aFix) st.a[c.k] = 1; else st.b[c.k] = 0; } }); st.step = 2; C.save(); drawStep(); drawBench(); });
      } else if (st.step === 2) {
        say(talk, '실험을 하기 전에 결과를 예상해 봐요. 예상이 틀려도 괜찮아요. 관찰하고 비교하는 게 중요해요!', 'smile');
        stepbox.innerHTML = `<h3>3. 결과 예상하기</h3><div class="choices" style="margin-top:8px">${E.predict.map((p, i) => `<button class="choice ${st.predict === i ? 'ok' : ''}" data-i="${i}">${esc(p)}</button>`).join('')}</div>`;
        $$('.choice', stepbox).forEach((b) => b.addEventListener('click', () => { st.predict = +b.dataset.i; sfx('pop'); st.step = 3; st.day = 0; C.save(); drawStep(); drawBench(); }));
      } else if (st.step === 3) {
        say(talk, '날짜 막대를 밀거나 <b>하루씩 지나기</b>를 눌러 무씨가 어떻게 변하는지 관찰해요.', 'smile');
        stepbox.innerHTML = `<h3>4. 관찰하기</h3>
          <div class="timeline" style="margin-top:6px"><span class="dd" id="dd">${st.day}일째</span><input type="range" id="days" min="0" max="${E.days}" value="${st.day}" aria-label="지난 날짜"><button class="btn small" id="plus">하루씩 지나기</button></div>
          <div class="tablewrap" style="margin-top:10px"><table class="restable"><thead><tr><th>날짜</th><th>A</th><th>B</th></tr></thead><tbody id="rt"></tbody></table></div>
          <div class="next-row" style="margin-top:10px"><button class="btn primary" id="tocon" ${st.day >= E.days ? '' : 'disabled'}>결과 정리하기 →</button></div>`;
        const set = (d) => {
          st.day = d; C.save(); $('#dd', stepbox).textContent = d + '일째'; $('#days', stepbox).value = d; drawBench(); table();
          if (d >= E.days) { $('#tocon', stepbox).disabled = false; say(talk, key === 'exp1' ? 'A 컵의 무씨는 껍질이 벗겨지고 싹이 텄어요. B 컵의 무씨는 그대로예요!' : '냉장고 밖(어둠상자 속) 무씨는 싹이 텄고, 냉장고 안 무씨는 싹이 트지 않았어요!', 'wow'); }
        };
        $('#days', stepbox).addEventListener('input', (e) => { sfx('tap'); set(+e.target.value); });
        $('#plus', stepbox).addEventListener('click', () => { if (st.day < E.days) { sfx('grow'); set(st.day + 1); } });
        $('#tocon', stepbox).addEventListener('click', () => { st.step = 4; C.save(); drawStep(); });
        table();
      } else {
        const predOk = st.predict === E.result;
        say(talk, predOk ? '내 예상과 실제 결과가 같았어요! 예상이 맞았는지 비교하는 것도 과학자의 방법이에요.' : '예상과 결과가 달랐네요. 괜찮아요! 결과를 보고 생각을 고치는 게 바로 탐구예요.', predOk ? 'good' : 'smile');
        const word = key === 'exp1' ? ['물', '빛', '바람'] : ['알맞은 온도', '어둠', '소리'];
        stepbox.innerHTML = `<h3>5. 결론</h3>
          <p style="margin:6px 0">내 예상: <b>${esc(E.predict[st.predict] || '')}</b><br>실제 결과: <b>${esc(E.predict[E.result])}</b></p>
          <p class="qtext" style="font-size:19px">씨가 싹 트려면 ${st.concl ? `<b style="border-bottom:2px solid var(--ink);padding:0 6px">${esc(C.josa(word[0], '이/가'))}</b>` : '<span style="border-bottom:2px solid var(--ink);padding:0 18px">?</span>이(가)'} 필요해요.</p>
          <div class="choices inline" style="margin-top:8px">${C.shuffle(word, 2).map((w) => `<button class="choice ${st.concl && w === word[0] ? 'ok' : ''}" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>
          <div class="next-row" style="margin-top:12px" id="cn"></div>`;
        const after = () => {
          $('#cn', stepbox).innerHTML = key === 'exp1'
            ? '<button class="btn primary" data-go="seed" data-arg="exp2">실험 2 · 온도로 →</button>'
            : '<button class="btn primary" data-go="seed" data-arg="final">정리하기 →</button>';
        };
        if (st.concl) after();
        $$('.choice', stepbox).forEach((b) => b.addEventListener('click', () => {
          if (b.dataset.w === word[0]) { sfx('ok'); st.concl = true; st.done = true; C.save(); C.stampFX(`실험 ${no} 완료`); drawStep(); say(talk, esc(E.concl), 'good'); }
          else { sfx('no'); b.classList.add('bad'); shake(b); }
        }));
      }
    }
    function table() {
      const rt = $('#rt', view); if (!rt) return;
      let h = '';
      for (let d = 1; d <= st.day; d++) h += `<tr><td>${d}일째</td><td>${esc(stateText(key, 'A', d))}</td><td>${esc(stateText(key, 'B', d))}</td></tr>`;
      rt.innerHTML = h || '<tr><td colspan="3" class="muted">아직 관찰 전이에요</td></tr>';
    }
    drawBench(); drawStep();
  }

  function grows(key, w) { return w === 'A'; }
  function stateText(key, w, d) {
    if (!grows(key, w)) return '변화 없음';
    return ['', '씨가 불었다', '껍질이 벗겨지고 뿌리가 나왔다', '줄기가 올라왔다', '떡잎이 나왔다(싹이 텄다)'][Math.min(4, d)];
  }

  // 컵과 무씨 그림 (SVG)
  function cupVis(key, w, st) {
    const d = st.step >= 3 ? st.day : 0;
    const grow = grows(key, w);
    const water = key === 'exp1' ? w === 'A' : (C.S.seed[key].b.water === 0 || w === 'A');
    const dark = key === 'exp2' && (w === 'B' || (st.a.light === 1));
    const cold = key === 'exp2' && w === 'B';
    const g = grow ? Math.min(4, d) : 0;
    const pale = dark; // 어두운 곳의 새싹은 노르스름해요
    let seeds = '';
    for (let i = 0; i < 10; i++) {
      const x = 63 + i * 8.2 + (i % 2) * 1.5, y = 58 + (i % 3) * 2;
      const sw = g >= 1 ? 1.25 : 1;
      seeds += `<ellipse cx="${x}" cy="${y}" rx="${3.4 * sw}" ry="${2.6 * sw}" fill="${g >= 1 ? '#a77b4f' : '#7a5232'}" stroke="#4d321c" stroke-width=".6"/>`;
      if (g >= 2) seeds += `<path d="M${x + 1} ${y + 2} q ${1 + (i % 2)} ${5 + g * 2} ${-2 + (i % 3)} ${8 + g * 3}" stroke="#f3efe2" stroke-width="1.6" fill="none"/>`;
      if (g >= 3) seeds += `<path d="M${x} ${y - 2} q ${-2} ${-8 - g * 2} ${1} ${-12 - g * 3}" stroke="${pale ? '#e9e3b0' : '#cfe3a0'}" stroke-width="1.8" fill="none"/>`;
      if (g >= 4) { const ty = y - 26; const leaf = pale ? '#e4d77a' : '#7cc45a'; seeds += `<path d="M${x + 1} ${ty} c -6 -2 -8 -8 -2 -9 c 2 0 2 3 2 9 Z" fill="${leaf}" stroke="#4b7a2c" stroke-width=".5"/><path d="M${x + 1} ${ty} c 6 -2 8 -8 2 -9 c -2 0 -2 3 -2 9 Z" fill="${leaf}" stroke="#4b7a2c" stroke-width=".5"/>`; }
    }
    const bg = cold ? 'cold' : dark ? 'dark' : '';
    const badge = [key === 'exp1' ? (water ? '물 있음' : '물 없음') : (cold ? '약 4 ℃' : '약 20 ℃'), dark ? (cold ? '어두움' : '어둠상자') : '밝음'].join(' · ');
    return `<div class="vis ${bg}"><svg viewBox="0 0 200 150" role="img" aria-label="${w} 컵: ${esc(stateText(key, w, d))}">
      ${cold ? '<g stroke="#b9d6ea" stroke-width="2"><line x1="0" y1="40" x2="200" y2="40"/><line x1="0" y1="118" x2="200" y2="118"/></g>' : ''}
      <path d="M44 34 L156 34 L146 140 L54 140 Z" fill="rgba(255,255,255,.55)" stroke="#9fb7c4" stroke-width="2"/>
      ${water ? '<path d="M50 92 L150 92 L146 138 L54 138 Z" fill="#9fd3ea" opacity=".75"/>' : ''}
      <path d="M58 60 L142 60 L138 104 L62 104 Z" fill="rgba(255,255,255,.7)" stroke="#9fb7c4" stroke-width="1.5"/>
      <path d="M98 104 L98 132" stroke="#e6e1d3" stroke-width="5"/>
      <ellipse cx="100" cy="60" rx="42" ry="7" fill="${water ? '#efeadb' : '#f7f4ea'}" stroke="#d3cdbb"/>
      ${seeds}
    </svg><span class="badge">${esc(badge)}</span></div>`;
  }

  function renderFinal(view) {
    const S = C.S;
    view.innerHTML = `<section class="zone wrap">${F.zoneHead('seed', '')}
      <div class="row">
        <button class="btn small" data-go="seed" data-arg="exp1">실험 1 · 물</button>
        <button class="btn small" data-go="seed" data-arg="exp2">실험 2 · 온도</button>
        <button class="btn small primary">정리하기</button>
      </div>
      <div class="grid2">
        <div class="panel paper"><span class="tape">실험 정리</span>
          <div class="grid2 even" style="margin-top:10px">
            <div class="jr-view">${C.spriteFluid('props', 5, '', '싹이 튼 무씨')}<b>물·알맞은 온도 ○</b><span class="small muted">싹이 텄어요</span></div>
            <div class="jr-view">${C.spriteFluid('props', 6, '', '싹이 트지 않은 무씨')}<b>물 × 또는 너무 차가움</b><span class="small muted">싹이 트지 않았어요</span></div>
          </div>
          <p class="qtext" style="margin-top:12px;font-size:20px">${esc(F.SEED.final)}</p>
        </div>
        <div style="display:grid;gap:12px;align-content:start;min-width:0">
          ${talkHTML('두 실험을 모두 마쳤어요! 마지막으로 헷갈리기 쉬운 것을 확인해 봐요.', 'good')}
          <div class="panel"><span class="tape green">O, X</span>
            <div class="qrow" id="myth" style="margin-top:6px"><span>${esc(F.SEED.myth.q)}</span><span class="ox"><button data-v="1">O</button><button data-v="0">X</button></span><p class="small muted why"></p></div>
          </div>
          <div class="panel"><span class="tape sky">생활 속으로</span>
            <p class="qtext" style="font-size:18px;margin:8px 0">${esc(F.SEED.apply.q)}</p>
            <div class="choices" id="apply">${choices(F.SEED.apply.opts, 6).map((c) => `<button class="choice" data-ok="${c.ok ? 1 : 0}">${esc(c.t)}</button>`).join('')}</div>
          </div>
          <div class="next-row" id="fin"></div>
        </div>
      </div></section>`;
    const talk = $('.talk', view);
    const mrow = $('#myth', view);
    const finish = () => {
      if (S.seed.myth && S.seed.apply) {
        $('#fin', view).innerHTML = '<button class="btn" data-go="notebook">실험 기록 보기</button><button class="btn primary" data-go="map">지도로 →</button>';
        if (!S.stamps.seed) F.stamp('seed', '씨앗 박사');
      }
    };
    if (S.seed.myth) { $('.why', mrow).textContent = F.SEED.myth.why; $$('button', mrow).forEach((b) => { b.disabled = true; if (b.dataset.v === '0') b.classList.add('ok'); }); }
    mrow.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return;
      if ((b.dataset.v === '1') === F.SEED.myth.a) { sfx('ok'); b.classList.add('ok'); $$('button', mrow).forEach((x) => (x.disabled = true)); $('.why', mrow).textContent = F.SEED.myth.why; S.seed.myth = true; C.save(); say(talk, esc(F.SEED.myth.why), 'good'); finish(); }
      else { sfx('no'); b.classList.add('bad'); shake(b); say(talk, '어둠상자 속 무씨는 어떻게 되었는지 떠올려 봐요.', 'wow'); }
    });
    if (S.seed.apply) $$('#apply .choice', view).forEach((b) => { b.disabled = true; if (b.dataset.ok === '1') b.classList.add('ok'); });
    $$('#apply .choice', view).forEach((b) => b.addEventListener('click', () => {
      if (S.seed.apply) return;
      if (b.dataset.ok === '1') { sfx('ok'); b.classList.add('ok'); S.seed.apply = true; C.save(); say(talk, '맞아요! 봄에는 비가 내리고 날씨가 따뜻해져서 씨가 싹 트는 데 필요한 물과 알맞은 온도가 갖추어져요.', 'good'); finish(); }
      else { sfx('no'); b.classList.add('bad'); shake(b); }
    }));
    finish();
  }
})();
