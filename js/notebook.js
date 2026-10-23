/* 농장 일지(포트폴리오) · 마무리 퀴즈 · 명예 농부 수료증 */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, spriteFluid, talkHTML, say, shake, choices, toast } = C;

  function printBtn(label) {
    return C.IS_ARTIFACT ? '' : `<button class="btn no-print" id="print">${esc(label || '인쇄하기')}</button>`;
  }
  function wirePrint(root) {
    const p = $('#print', root);
    if (p) p.addEventListener('click', () => { sfx('tap'); window.print(); });
  }

  F.Notebook = {
    render(view) {
      const S = C.S;
      const J = S.bf.journal || {};
      const stampN = F.ZONES.filter((z) => S.stamps[z.id]).length;
      const seedRow = (key, no) => {
        const st = S.seed[key], E = F.SEED[key];
        if (!st || !st.done) return `<div class="empty">실험 ${no} · 아직 하지 않았어요.</div>`;
        const vary = E.conds.find((c) => c.k === E.vary).name;
        const same = E.conds.filter((c) => c.k !== E.vary).map((c) => c.name).join(', ');
        return `<div class="jcard"><b>실험 ${no}. ${esc(E.q)}</b><dl>
          <dt>다르게 한 조건</dt><dd>${esc(vary)}</dd><dt>같게 한 조건</dt><dd>${esc(same)}</dd>
          <dt>내 예상</dt><dd>${esc(E.predict[st.predict] || '-')}</dd><dt>결과</dt><dd>${esc(E.predict[E.result])}</dd>
          <dt>결론</dt><dd><b>${esc(E.concl)}</b></dd></dl></div>`;
      };
      const gRow = (k) => {
        const st = S.garden.runs[k], G = F.GARDEN;
        if (!st || !st.done) return `<div class="empty">${k === 'water' ? '물의 양' : '햇빛의 양'} 실험을 아직 하지 않았어요.</div>`;
        return `<div class="jcard"><b>${esc(G.varyOpts.find((v) => v.k === k).q)}</b>
          <dl><dt>다르게 한 조건</dt><dd>${esc(G.conds.find((c) => c.k === k).name)}</dd><dt>같게 한 조건</dt><dd>${esc(G.conds.filter((c) => c.k !== k).map((c) => c.name).join(', '))}</dd><dt>내 예상</dt><dd>${esc(G.predict[k][st.predict] || '-')}</dd></dl>
          <div class="tablewrap">${F.gardenResultTable(k)}</div><p><b>${esc(G.concl[k])}</b></p></div>`;
      };
      const animalsBy = (t) => F.ANIMALS.filter((a) => S.museum.animals[a.i] === t).map((a) => a.name).join(', ') || '-';
      const plantsBy = (t) => F.PLANTS.filter((p) => S.museum.plants[p.i] === t).map((p) => p.name).join(', ') || '-';
      view.innerHTML = `<section class="nb wrap">
        <div class="nb-head">
          <div><span class="kicker">${esc(S.name || '이름 없음')} 농부</span><h1 style="margin-top:8px">농장 일지</h1></div>
          <span style="flex:1"></span>
          <span class="muted">모은 도장 <b>${stampN}</b> / 6</span>
          ${printBtn('일지 인쇄하기')}
          <button class="btn no-print" data-go="quiz">마무리 퀴즈</button>
          <button class="btn primary no-print" data-go="map">지도로</button>
        </div>
        ${C.IS_ARTIFACT ? '<p class="small muted no-print">이 미리보기에서는 인쇄가 막혀 있어요. 인쇄는 GitHub Pages 주소나 내려받은 폴더에서 열어 해 주세요.</p>' : ''}

        <section class="panel paper nb-sec"><span class="tape">1. 배추흰나비 관찰 기록 [4과04-01]</span>
          <div class="jgrid" style="margin-top:10px">
            ${F.JOURNAL_ORDER.map((k) => {
              const Jd = F.JOURNAL[k], e = J[k];
              if (!e) return `<div class="jcard"><b>${esc(Jd.title)}</b><div class="pic">${spriteFluid('bf', F.BF[Jd.sprite], '', Jd.title)}</div><span class="muted small">${Jd.day}일째에 관찰해요</span></div>`;
              return `<div class="jcard"><b>${esc(Jd.title)} <span class="small muted">${e.day}일째</span></b>
                <div class="pic">${e.draw ? `<img src="${e.draw}" alt="${esc(Jd.title)} 그림">` : spriteFluid('bf', F.BF[Jd.sprite], '', Jd.title)}</div>
                <dl>${Object.entries(e.ans || {}).map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>
                ${e.note ? `<p class="small">✎ ${esc(e.note)}</p>` : ''}</div>`;
            }).join('')}
          </div>
          <div style="margin-top:12px">${S.bf.portfolio && Object.keys(S.bf.portfolio.periods || {}).length === 4
            ? `<p><b>한살이:</b> 알(${esc(S.bf.portfolio.periods.egg)}) → 애벌레(${esc(S.bf.portfolio.periods.larva)}) → 번데기(${esc(S.bf.portfolio.periods.pupa)}) → 어른벌레(${esc(S.bf.portfolio.periods.adult)}) → 다시 알</p>`
            : '<div class="empty">한살이 포트폴리오를 완성하면 여기에 정리돼요.</div>'}</div>
        </section>

        <section class="panel nb-sec"><span class="tape green">2. 씨앗 실험 [4과04-02]</span>
          <div class="jgrid" style="margin-top:10px">${seedRow('exp1', 1)}${seedRow('exp2', 2)}</div>
        </section>

        <section class="panel nb-sec"><span class="tape green">3. 텃밭 실험 설계 [4과04-02]</span>
          <div class="grid2 even" style="margin-top:10px">${gRow('water')}${gRow('sun')}</div>
        </section>

        <section class="panel nb-sec"><span class="tape sky">4. 한살이 도감 [4과04-03]</span>
          <div class="grid2 even" style="margin-top:10px">
            <div class="jcard"><b>동물</b><dl><dt>알을 낳는 동물</dt><dd>${esc(animalsBy('egg'))}</dd><dt>새끼를 낳는 동물</dt><dd>${esc(animalsBy('baby'))}</dd></dl></div>
            <div class="jcard"><b>식물</b><dl><dt>한해살이</dt><dd>${esc(plantsBy('annual'))}</dd><dt>여러해살이</dt><dd>${esc(plantsBy('perennial'))}</dd></dl></div>
          </div>
        </section>

        <section class="panel nb-sec"><span class="tape sky">5. 한살이 소개 카드 [4과04-03]</span>
          <div class="gallery" style="margin-top:10px">${S.expo.posters.length ? S.expo.posters.map((p) => F.posterHTML(p)).join('') : '<div class="empty">박람회에서 소개 카드를 만들면 여기에 모여요.</div>'}</div>
        </section>

        <section class="panel nb-sec"><span class="tape">6. 스마트 팜 · 나의 꿈</span>
          ${S.smart.ok ? `<p style="margin-top:10px">${F.SMART.sensors.map((s) => `${esc(s.when)} → <b>${esc((F.SMART.actions.find((a) => a.k === S.smart.rules[s.k]) || {}).name || '')}</b>`).join(' · ')}</p>` : '<div class="empty" style="margin-top:10px">스마트 팜 규칙을 완성하면 여기에 정리돼요.</div>'}
          ${S.smart.dream ? `<p class="fact" style="margin-top:8px"><b>나의 꿈</b>${esc(S.smart.dream)}</p>` : ''}
        </section>

        <section class="panel nb-sec"><span class="tape">마무리 퀴즈</span>
          <p style="margin-top:10px">${S.quiz.best != null ? `최고 점수 <b>${S.quiz.best}</b> / 10` : '아직 풀지 않았어요.'}</p>
        </section>
      </section>`;
      wirePrint(view);
    },

    quiz(view) {
      const S = C.S;
      const qs = F.QUIZ.map((q, i) => ({ ...q, list: choices(q.opts, i * 17 + 3) }));
      let i = 0, score = 0;
      view.innerHTML = `<section class="zone wrap"><div class="zone-head"><button class="btn small ghost" data-go="map">← 지도</button><h1>마무리 퀴즈</h1><span class="std">생물의 한살이 정리</span></div>
        <div class="grid2"><div class="panel paper quizbox" id="qz"></div><div>${talkHTML('배운 내용을 정리해 볼까요? 10문제 중 7문제 이상 맞히면 명예 농부 수료증을 받아요!', 'smile')}</div></div></section>`;
      const box = $('#qz', view), talk = $('.talk', view);
      function show() {
        const q = qs[i];
        box.innerHTML = `<span class="qnum">${i + 1} / ${qs.length}</span><p class="qtext">${esc(q.q)}</p>
          <div class="choices">${q.list.map((c) => `<button class="choice" data-ok="${c.ok ? 1 : 0}">${esc(c.t)}</button>`).join('')}</div>
          <p class="fact" id="why" hidden></p><div class="next-row"><button class="btn primary" id="nx" hidden>${i + 1 < qs.length ? '다음 문제 →' : '결과 보기'}</button></div>`;
        let answered = false;
        $$('.choice', box).forEach((b) => b.addEventListener('click', () => {
          if (answered) return; answered = true;
          const ok = b.dataset.ok === '1';
          if (ok) { score++; sfx('ok'); b.classList.add('ok'); say(talk, '정답이에요!', 'good'); }
          else { sfx('no'); b.classList.add('bad'); $$('.choice', box).forEach((x) => { if (x.dataset.ok === '1') x.classList.add('ok'); }); say(talk, '아쉬워요. 설명을 읽고 다음 문제로 가요.', 'wow'); }
          $$('.choice', box).forEach((x) => (x.disabled = true));
          const w = $('#why', box); w.hidden = false; w.innerHTML = `<b>${ok ? '맞아요' : '정답 풀이'}</b>${esc(q.why)}`;
          $('#nx', box).hidden = false; $('#nx', box).focus();
        }));
        $('#nx', box).addEventListener('click', () => { i++; if (i < qs.length) show(); else done(); });
      }
      function done() {
        S.quiz.last = score; S.quiz.best = Math.max(S.quiz.best || 0, score); C.save();
        const pass = score >= 7;
        box.innerHTML = `<span class="qnum">결과</span><p class="qtext" style="font-size:30px">${score} / ${qs.length}</p>
          <p>${pass ? '훌륭해요! 명예 농부 수료증을 받을 수 있어요.' : '7문제 이상 맞히면 수료증을 받아요. 다시 도전해 볼까요?'}</p>
          <div class="next-row"><button class="btn" data-go="quiz">다시 풀기</button>${pass ? '<button class="btn primary" id="cert">수료증 받기</button>' : '<button class="btn primary" data-go="map">지도로</button>'}</div>`;
        if (pass) { sfx('fanfare'); C.confetti(50); $('#cert', box).addEventListener('click', certificate); }
        else sfx('no');
        say(talk, pass ? '생물의 한살이 박사가 다 됐어요!' : '농장 일지를 다시 보고 오면 더 잘할 수 있어요.', pass ? 'good' : 'smile');
      }
      show();
    }
  };

  function certificate() {
    const S = C.S;
    const n = F.ZONES.filter((z) => S.stamps[z.id]).length;
    const box = C.modal(`
      <div class="cert">
        <span class="kicker" style="justify-self:center">꼬물꼬물 한살이 농장</span>
        <h2>명예 농부 수료증</h2>
        <span class="nm">${esc(S.name || '')}</span>
        <p style="font-size:17px;max-width:30em;justify-self:center">위 농부는 배추흰나비를 정성껏 길러 한살이를 관찰하고, 씨와 식물이 자라는 조건을 실험으로 찾았으며, 여러 생물의 한살이를 비교하여 소개하였으므로 이 수료증을 드립니다.</p>
        <p class="muted">모은 도장 ${n}개 · 마무리 퀴즈 ${S.quiz.best} / 10 · ${C.today()}</p>
        <img class="bomi" src="assets/bomi.webp" alt="">
        <span class="seal">꼬물꼬물<br>농장장</span>
      </div>
      <div class="row end no-print" style="margin-top:14px">${C.IS_ARTIFACT ? '' : '<button class="btn" id="print">인쇄하기</button>'}<button class="btn primary" data-close>닫기</button></div>`, { cls: 'wide' });
    wirePrint(box);
    C.stampFX('수료!');
  }
})();
