/* 3. 쑥쑥 텃밭 — 식물이 자라는 데 필요한 조건을 찾는 실험 설계 (물·햇빛) */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, talkHTML, say, shake, spriteFluid } = C;
  const STEPS = ['무엇을 알아볼까', '조건 맞추기', '결과 예상', '기르며 관찰', '결론'];
  const G = F.GARDEN;
  F.Z = F.Z || {};

  F.Z.garden = {
    render(view, arg) {
      const S = C.S;
      if (arg === 'final' || (S.garden.runs.water && S.garden.runs.water.done && S.garden.runs.sun && S.garden.runs.sun.done && !arg)) return renderFinal(view);
      renderRun(view, arg);
    }
  };

  function runState(vary) {
    const S = C.S;
    if (!S.garden.runs[vary]) {
      const b = {};
      G.conds.forEach((c) => { b[c.k] = c.k === vary ? 1 : (G.bStart[c.k] != null ? G.bStart[c.k] : 0); });
      S.garden.runs[vary] = { step: 1, b, predict: null, day: 0, concl: false, done: false };
    }
    return S.garden.runs[vary];
  }

  function renderRun(view, vary) {
    const S = C.S;
    const st0 = vary ? runState(vary) : null;
    const step = st0 ? st0.step : 0;
    view.innerHTML = `<section class="zone wrap">${F.zoneHead('garden', C.stepsHTML(STEPS, step))}
      <div class="grid2">
        <div class="panel paper" style="min-width:0"><span class="tape">${vary ? esc(G.varyOpts.find((v) => v.k === vary).q) : '실험 설계하기'}</span>
          <div class="bench" id="bench" style="margin-top:10px"></div>
          <div class="fair" id="fair" style="margin-top:12px"></div>
          <div id="chartbox" style="margin-top:12px"></div>
        </div>
        <div style="display:grid;gap:12px;align-content:start;min-width:0">
          ${talkHTML('', 'smile')}
          <div class="panel" id="stepbox"></div>
        </div>
      </div></section>`;
    const talk = $('.talk', view), bench = $('#bench', view), stepbox = $('#stepbox', view), fair = $('#fair', view);

    if (!vary) {
      // ① 무엇을 알아볼까?
      bench.innerHTML = ['A', 'B'].map((w) => `<div class="setup"><div class="who"><i>${w}</i>케일 화분 ${w}</div><div class="vis">${potVis('small', false)}</div></div>`).join('');
      fair.innerHTML = '<span class="muted small">비슷한 크기로 자란 케일 화분 두 개로 실험해요.</span>';
      say(talk, '케일이 쑥쑥 자라려면 무엇이 필요할까요? 이번엔 내가 직접 실험을 <b>설계</b>해요. 먼저 알아볼 조건을 하나 골라요.', 'smile');
      const doneW = S.garden.runs.water && S.garden.runs.water.done, doneS = S.garden.runs.sun && S.garden.runs.sun.done;
      stepbox.innerHTML = `<h3>1. 무엇을 알아볼까요?</h3><p class="muted small" style="margin-bottom:8px">두 케일 화분에서 <b>다르게 할 조건</b>을 골라요.</p>
        <div class="choice-grid">
          ${G.varyOpts.map((v) => `<button class="bigpick ${S.garden.runs[v.k] && S.garden.runs[v.k].done ? 'on' : ''}" data-v="${v.k}">${v.k === 'water' ? C.spriteFluid('items', F.ITEM.can, '', '') : C.spriteFluid('items', F.ITEM.shade, '', '')}<b>${esc(v.name)}</b><span class="small muted">${esc(v.q)}</span>${S.garden.runs[v.k] && S.garden.runs[v.k].done ? '<span class="small" style="color:var(--kale-deep)">✓ 실험 완료</span>' : ''}</button>`).join('')}
        </div>
        ${doneW && doneS ? '<div class="next-row" style="margin-top:12px"><button class="btn primary" data-go="garden" data-arg="final">정리하기 →</button></div>' : ''}`;
      $$('.bigpick', stepbox).forEach((b) => b.addEventListener('click', () => { sfx('ok'); runState(b.dataset.v); C.save(); F.go('garden', b.dataset.v); }));
      return;
    }

    const st = st0;
    const other = vary === 'water' ? 'sun' : 'water';
    function same(c) { return c.k !== vary && st.b[c.k] === 0; }
    function fc() { const o = G.conds.filter((c) => c.k !== vary); return { ok: o.filter(same).length, n: o.length }; }
    function stateOfB(d) { return d >= 3 ? (vary === 'water' ? 'wilt' : 'pale') : 'small'; }

    function drawBench() {
      const d = st.step >= 3 ? st.day : 0;
      const hA = G.heights.good[d], hB = G.heights[vary][d];
      const visA = potVis(d >= 4 ? 'fresh' : 'small', false, hA);
      const covered = vary === 'sun' && st.step >= 3 && !st.peek;
      const visB = potVis(d >= 3 ? stateOfB(d) : 'small', covered, hB);
      bench.innerHTML = ['A', 'B'].map((w) => `
        <div class="setup">
          <div class="who"><i>${w}</i>${w === 'A' ? '기준 화분' : '조건을 바꾼 화분'}</div>
          <div class="vis">${w === 'A' ? visA : visB}${st.step >= 3 ? `<span class="badge">키 약 ${(w === 'A' ? hA : hB).toFixed(1)} cm</span>` : ''}</div>
          <div class="conds">${G.conds.map((c) => {
            if (w === 'A') return `<div class="cond"><span class="k">${esc(c.name)}</span><span class="v locked ${c.k === vary ? 'vary' : 'same'}">${esc(c.a)}</span></div>`;
            const isV = c.k === vary, val = c.b[st.b[c.k]];
            const btn = !isV && st.step === 1;
            const cls = isV ? 'vary' : (same(c) ? 'same' : 'diff');
            return `<div class="cond"><span class="k">${esc(c.name)}</span>${btn ? `<button class="v ${cls}" data-k="${c.k}">${esc(val)}</button>` : `<span class="v locked ${cls}">${esc(val)}</span>`}</div>`;
          }).join('')}</div>
          ${w === 'B' && vary === 'sun' && st.step >= 3 ? `<button class="btn small" id="peek">${st.peek ? '상자 다시 씌우기' : '상자를 잠깐 열어 보기'}</button>` : ''}
        </div>`).join('');
      const f = fc();
      fair.innerHTML = `<b style="font-family:var(--font-display);font-size:19px">공정한 실험 저울</b>
        <span class="meter"><b style="width:${(f.ok / f.n) * 100}%"></b></span>
        <span class="small">다르게 할 조건 <b>${esc(G.conds.find((c) => c.k === vary).name)}</b> · 같게 할 조건 <b>${f.ok}/${f.n}</b></span>`;
      $$('button.v', bench).forEach((b) => b.addEventListener('click', () => {
        const c = G.conds.find((x) => x.k === b.dataset.k);
        st.b[c.k] = (st.b[c.k] + 1) % c.b.length; sfx('tap'); C.save(); drawBench();
        const f2 = fc();
        if (f2.ok === f2.n) { sfx('ok'); say(talk, `좋아요! <b>${esc(G.conds.find((x) => x.k === vary).name)}</b>만 다르고 나머지는 모두 같아요. 공정한 실험 설계 완성!`, 'good'); setTimeout(() => { st.step = 2; C.save(); drawStep(); drawBench(); }, 600); }
      }));
      const pk = $('#peek', bench);
      if (pk) pk.addEventListener('click', () => { st.peek = !st.peek; sfx('tap'); drawBench(); if (st.peek) say(talk, '상자 속 케일은 햇빛을 받지 못해 잎 색깔이 연해지고 줄기가 가늘어졌어요. 물을 줄 때만 잠깐 열고 다시 씌워요.', 'wow'); });
      drawChart();
    }
    function drawChart() {
      const box = $('#chartbox', view);
      if (st.step < 3) { box.innerHTML = ''; return; }
      const d = st.day, W = 440, H = 190, pl = 34, pb = 26, pt = 14, pr = 12;
      const xs = (i) => pl + (i / 10) * (W - pl - pr), ys = (v) => H - pb - ((v - 6) / 18) * (H - pb - pt);
      const line = (arr, col) => `<polyline fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${arr.slice(0, d + 1).map((v, i) => `${xs(i)},${ys(v)}`).join(' ')}"/>` + (d >= 0 ? `<circle cx="${xs(d)}" cy="${ys(arr[d])}" r="4.5" fill="${col}"/>` : '');
      let grid = '';
      for (let v = 6; v <= 24; v += 6) grid += `<line x1="${pl}" x2="${W - pr}" y1="${ys(v)}" y2="${ys(v)}" stroke="#e3e6d8"/><text x="${pl - 6}" y="${ys(v) + 4}" text-anchor="end">${v}</text>`;
      for (let i = 0; i <= 10; i += 2) grid += `<text x="${xs(i)}" y="${H - 8}" text-anchor="middle">${i}일</text>`;
      box.innerHTML = `<b style="font-family:var(--font-display);font-size:19px">케일의 키 변화 (cm)</b>
        <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="케일 키 그래프">${grid}${line(G.heights.good, '#3e8a57')}${line(G.heights[vary], vary === 'water' ? '#c4553b' : '#d8b83a')}
        <g font-size="12"><rect x="${pl + 8}" y="${pt}" width="10" height="4" fill="#3e8a57"/><text x="${pl + 22}" y="${pt + 5}" style="fill:var(--ink)">A 기준</text>
        <rect x="${pl + 80}" y="${pt}" width="10" height="4" fill="${vary === 'water' ? '#c4553b' : '#d8b83a'}"/><text x="${pl + 94}" y="${pt + 5}" style="fill:var(--ink)">B ${vary === 'water' ? '물 없음' : '햇빛 없음'}</text></g></svg>
        <p class="small muted">그래프의 값은 지도서의 실험 결과(잘 자람·시듦·연하고 가늘게 자람)를 바탕으로 만든 예시예요.</p>`;
    }

    function drawStep() {
      $('.steps', view).outerHTML = C.stepsHTML(STEPS, st.step);
      const vName = G.conds.find((c) => c.k === vary).name;
      if (st.step === 1) {
        say(talk, `<b>${esc(vName)}</b>만 다르게 하고, 나머지 조건은 모두 같게 해야 해요. B 화분의 빨간 칸을 눌러 바꿔요. 같게 할 조건에는 <b>${esc(G.conds.find((c) => c.k === other).name)}</b>도 있어요!`, 'smile');
        stepbox.innerHTML = `<h3>2. 같게 할 조건 맞추기</h3>
          <p class="muted small">B 화분: 노란 칸은 다르게 할 조건, 빨간 칸은 다른 조건, 초록 칸은 같은 조건이에요.</p>
          <div class="fact" style="margin-top:8px"><b>도움말</b>${vary === 'water' ? '물을 주지 않는 화분도 다른 화분과 같은 장소에 두어 햇빛과 온도를 같게 해요.' : '두 화분을 같은 장소에 두고, 한 화분에만 햇빛 차단 장치를 씌워요. 물은 두 화분에 똑같이 줘요.'}</div>
          <p class="small muted" style="margin-top:8px">${esc(G.tip)}</p>`;
      } else if (st.step === 2) {
        say(talk, '열흘 동안 기르면 어떻게 될까요? 결과를 먼저 예상해 봐요.', 'smile');
        stepbox.innerHTML = `<h3>3. 결과 예상하기</h3><div class="choices" style="margin-top:8px">${G.predict[vary].map((p, i) => `<button class="choice" data-i="${i}">${esc(p)}</button>`).join('')}</div>`;
        $$('.choice', stepbox).forEach((b) => b.addEventListener('click', () => { st.predict = +b.dataset.i; st.step = 3; st.day = 0; sfx('pop'); C.save(); drawStep(); drawBench(); }));
      } else if (st.step === 3) {
        say(talk, vary === 'water' ? 'A 화분에만 물을 적당히 주며 길러요. 날짜를 넘기며 관찰해 볼까요?' : '두 화분에 물을 똑같이 주며 길러요. B 화분은 햇빛 차단 장치를 씌워 두었어요.', 'smile');
        stepbox.innerHTML = `<h3>4. 기르며 관찰하기</h3>
          <div class="timeline" style="margin-top:6px"><span class="dd" id="dd">${st.day}일째</span><input type="range" id="days" min="0" max="10" value="${st.day}" aria-label="지난 날짜"><button class="btn small" id="plus">이틀 지나기</button></div>
          <div class="tablewrap" style="margin-top:10px" id="obs"></div>
          <div class="next-row" style="margin-top:10px"><button class="btn primary" id="tocon" ${st.day >= 10 ? '' : 'disabled'}>결과 정리하기 →</button></div>`;
        const set = (d) => {
          st.day = d; C.save(); $('#dd', stepbox).textContent = d + '일째'; $('#days', stepbox).value = d; drawBench(); obs();
          if (d >= 10) { $('#tocon', stepbox).disabled = false; say(talk, vary === 'water' ? '물을 주지 않은 케일은 잎과 줄기가 시들었어요. 줄기가 약하고 키도 작아요!' : '햇빛을 받지 못한 케일은 잎 색깔이 연해지고 줄기가 가늘고 약해졌어요!', 'wow'); }
        };
        $('#days', stepbox).addEventListener('input', (e) => { sfx('tap'); set(+e.target.value); });
        $('#plus', stepbox).addEventListener('click', () => { if (st.day < 10) { sfx('grow'); set(Math.min(10, st.day + 2)); } });
        $('#tocon', stepbox).addEventListener('click', () => { st.step = 4; C.save(); drawStep(); drawBench(); });
        obs();
      } else {
        const predOk = st.predict === 0;
        say(talk, predOk ? '예상한 대로였어요! 실험으로 내 생각을 확인했어요.' : '예상과 달랐지만 괜찮아요. 결과를 보고 생각을 바꾸는 것이 탐구예요.', predOk ? 'good' : 'smile');
        const word = vary === 'water' ? ['물', '바람', '소리'] : ['햇빛', '어둠', '비료'];
        stepbox.innerHTML = `<h3>5. 결론</h3>
          <div class="tablewrap" style="margin:6px 0 10px">${resultTable(vary)}</div>
          <p class="qtext" style="font-size:19px">식물이 잘 자라려면 ${st.concl ? `<b style="border-bottom:2px solid var(--ink);padding:0 6px">${esc(C.josa(word[0], '이/가'))}</b>` : '<span style="border-bottom:2px solid var(--ink);padding:0 18px">?</span>이(가)'} 필요해요.</p>
          <div class="choices inline" style="margin-top:8px">${C.shuffle(word, 4).map((w) => `<button class="choice ${st.concl && w === word[0] ? 'ok' : ''}" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>
          <div class="next-row" style="margin-top:12px" id="cn"></div>`;
        const after = () => {
          const both = S.garden.runs[other] && S.garden.runs[other].done;
          $('#cn', stepbox).innerHTML = both ? '<button class="btn primary" data-go="garden" data-arg="final">정리하기 →</button>' : `<button class="btn primary" id="go-other">${esc(G.conds.find((c) => c.k === other).name)} 실험도 하기 →</button>`;
          const go = $('#go-other', stepbox); if (go) go.addEventListener('click', () => { runState(other); C.save(); F.go('garden', other); });
        };
        if (st.concl) after();
        $$('.choice', stepbox).forEach((b) => b.addEventListener('click', () => {
          if (b.dataset.w === word[0]) { sfx('ok'); st.concl = true; st.done = true; C.save(); C.stampFX('실험 설계 완료'); drawStep(); say(talk, esc(G.concl[vary]), 'good'); }
          else { sfx('no'); b.classList.add('bad'); shake(b); }
        }));
      }
    }
    function obs() {
      const o = $('#obs', view); if (!o) return;
      const d = st.day;
      const bState = d >= 6 ? G.obs[vary] : d >= 3 ? { leaf: vary === 'water' ? '조금 처짐' : '색이 조금 연해짐', stem: '조금 가늘어짐' } : { leaf: '변화 없음', stem: '변화 없음' };
      const aState = d >= 6 ? G.obs.good : { leaf: d >= 3 ? '조금 커짐' : '변화 없음', stem: d >= 3 ? '조금 굵어짐' : '변화 없음' };
      o.innerHTML = `<table class="restable"><thead><tr><th></th><th>잎</th><th>줄기</th><th>키</th></tr></thead><tbody>
        <tr><td><b>A</b></td><td>${esc(aState.leaf)}</td><td>${esc(aState.stem)}</td><td>${G.heights.good[d].toFixed(1)} cm</td></tr>
        <tr><td><b>B</b></td><td>${esc(bState.leaf)}</td><td>${esc(bState.stem)}</td><td>${G.heights[vary][d].toFixed(1)} cm</td></tr></tbody></table>`;
    }
    drawBench(); drawStep();
  }

  function resultTable(vary) {
    return `<table class="restable"><thead><tr><th></th><th>잎</th><th>줄기</th><th>10일째 키</th></tr></thead><tbody>
      <tr><td><b>A</b> ${vary === 'water' ? '물 줌' : '햇빛 받음'}</td><td>${esc(G.obs.good.leaf)}</td><td>${esc(G.obs.good.stem)}</td><td>${G.heights.good[10]} cm</td></tr>
      <tr><td><b>B</b> ${vary === 'water' ? '물 안 줌' : '햇빛 차단'}</td><td>${esc(G.obs[vary].leaf)}</td><td>${esc(G.obs[vary].stem)}</td><td>${G.heights[vary][10]} cm</td></tr></tbody></table>`;
  }
  F.gardenResultTable = resultTable;

  // 화분 그림 (props 시트) — h: 키(cm)에 따라 크기를 조금 바꿈
  function potVis(state, covered, h) {
    const map = { fresh: 0, eaten: 1, wilt: 2, pale: 3, small: 4 };
    const scale = h ? Math.min(1, 0.72 + (h - 10) * 0.025) : 0.8;
    if (covered) return `<div style="position:absolute;inset:6% 18% 0;display:grid;place-items:end center">${spriteFluid('props', 7, '', '햇빛 차단 장치를 씌운 화분')}</div>`;
    return `<div style="position:absolute;inset:4% 16% 0;display:grid;place-items:end center"><div style="width:${scale * 100}%">${spriteFluid('props', map[state], '', '케일 화분')}</div></div>`;
  }

  function renderFinal(view) {
    const S = C.S;
    view.innerHTML = `<section class="zone wrap">${F.zoneHead('garden', '')}
      <div class="grid2">
        <div class="panel paper"><span class="tape">두 실험 정리</span>
          <div class="grid2 even" style="margin-top:10px">
            <div><b style="font-family:var(--font-display);font-size:20px">물의 양</b>${resultTable('water')}</div>
            <div><b style="font-family:var(--font-display);font-size:20px">햇빛의 양</b>${resultTable('sun')}</div>
          </div>
          <p class="qtext" style="margin-top:12px;font-size:20px">${esc(G.final)}</p>
          <div class="grid2 even" style="margin-top:10px" id="rescue">
            <button class="bigpick ${S.garden.rescuedW ? 'on' : ''}" data-r="W"><div style="width:70%">${spriteFluid('props', S.garden.rescuedW ? 0 : 2, '', '시든 케일')}</div><b>${S.garden.rescuedW ? '다시 싱싱해졌어요' : '시든 케일에 물 주기'}</b></button>
            <button class="bigpick ${S.garden.rescuedS ? 'on' : ''}" data-r="S"><div style="width:70%">${spriteFluid('props', S.garden.rescuedS ? 0 : 3, '', '연한 케일')}</div><b>${S.garden.rescuedS ? '햇빛을 받고 초록색이 됐어요' : '상자를 벗기고 햇빛 주기'}</b></button>
          </div>
        </div>
        <div style="display:grid;gap:12px;align-content:start;min-width:0">
          ${talkHTML('실험이 끝난 케일도 소중한 생명이에요. 시든 케일에게 다시 물과 햇빛을 주며 돌봐 줄까요?', 'smile')}
          <div class="panel"><span class="tape green">O, X</span>
            <div class="qrow" id="myth" style="margin-top:6px"><span>${esc(G.myth.q)}</span><span class="ox"><button data-v="1">O</button><button data-v="0">X</button></span><p class="small muted why"></p></div>
          </div>
          <div class="next-row" id="fin"></div>
        </div>
      </div></section>`;
    const talk = $('.talk', view), mrow = $('#myth', view);
    const finish = () => {
      if (S.garden.myth && S.garden.rescuedW && S.garden.rescuedS) {
        $('#fin', view).innerHTML = '<button class="btn" data-go="notebook">실험 기록 보기</button><button class="btn primary" data-go="map">지도로 →</button>';
        if (!S.stamps.garden) F.stamp('garden', '실험 설계왕');
      }
    };
    $$('#rescue .bigpick', view).forEach((b) => b.addEventListener('click', () => {
      const k = 'rescued' + b.dataset.r; if (S.garden[k]) return;
      S.garden[k] = true; C.save(); sfx(b.dataset.r === 'W' ? 'water' : 'grow');
      b.classList.add('on'); b.querySelector('div').innerHTML = spriteFluid('props', 0, '', '싱싱한 케일');
      b.querySelector('b').textContent = b.dataset.r === 'W' ? '다시 싱싱해졌어요' : '햇빛을 받고 초록색이 됐어요';
      say(talk, '고마워요! 식물을 소중히 여기는 마음도 과학자에게 꼭 필요해요.', 'good'); finish();
    }));
    if (S.garden.myth) { $('.why', mrow).textContent = G.myth.why; $$('button', mrow).forEach((b) => { b.disabled = true; if (b.dataset.v === '0') b.classList.add('ok'); }); }
    mrow.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return;
      if ((b.dataset.v === '1') === G.myth.a) { sfx('ok'); b.classList.add('ok'); $$('button', mrow).forEach((x) => (x.disabled = true)); $('.why', mrow).textContent = G.myth.why; S.garden.myth = true; C.save(); say(talk, esc(G.myth.why), 'good'); finish(); }
      else { sfx('no'); b.classList.add('bad'); shake(b); say(talk, '여름 한낮 뙤약볕에 시든 식물을 본 적 있나요? 다시 생각해 봐요.', 'wow'); }
    });
    finish();
  }
})();
