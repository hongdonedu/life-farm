/* 4. 한살이 도감관 — 다양한 동물(알·새끼)과 식물(한해살이·여러해살이)의 한살이 */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, talkHTML, say, shake, spriteFluid, choices } = C;
  F.Z = F.Z || {};

  const animalsDone = () => Object.keys(C.S.museum.animals).length === F.ANIMALS.length && Object.keys(F.CYCLES).every((k) => C.S.museum.cycles[k]) && C.S.museum.compare[0] && C.S.museum.compare[1];
  const plantsDone = () => Object.keys(C.S.museum.plants).length === F.PLANTS.length && C.S.museum.seasonSeen && C.S.museum.myth;

  F.Z.museum = {
    render(view, arg) {
      const hall = arg || (animalsDone() ? 'plant' : 'animal');
      view.innerHTML = `<section class="zone wrap">${F.zoneHead('museum', '')}
        <div class="tabs" role="tablist">
          <button class="${hall === 'animal' ? 'on' : ''}" data-go="museum" data-arg="animal" role="tab" aria-selected="${hall === 'animal'}">동물관 ${animalsDone() ? '✓' : ''}</button>
          <button class="${hall === 'plant' ? 'on' : ''}" data-go="museum" data-arg="plant" role="tab" aria-selected="${hall === 'plant'}">식물관 ${plantsDone() ? '✓' : ''}</button>
        </div>
        <div id="hall"></div></section>`;
      if (hall === 'animal') animalHall($('#hall', view)); else plantHall($('#hall', view));
    }
  };
  function checkStamp(talk) {
    if (animalsDone() && plantsDone() && !C.S.stamps.museum) {
      F.stamp('museum', '도감 박사');
      say(talk, '동물관과 식물관을 모두 둘러봤어요! 생물마다 한살이의 모습이 다양하다는 걸 알게 되었지요?', 'good');
    }
  }

  /* ───── 동물관 ───── */
  function animalHall(host) {
    const S = C.S, M = S.museum;
    const bank = C.shuffle(F.ANIMALS, 21);
    host.innerHTML = `
      <div class="grid2">
        <div class="panel paper" id="sortbox"><span class="tape">동물 나누기</span>
          <p class="muted" style="margin:8px 0">동물 카드를 <b>알을 낳는 동물</b>과 <b>새끼를 낳는 동물</b>로 나누어요.</p>
          <div class="bank">${bank.map((a) => `<button class="ac ${M.animals[a.i] ? 'used' : ''}" data-drag data-i="${a.i}">${spriteFluid('animals', a.i, '', a.name)}${esc(a.name)}</button>`).join('')}</div>
          <div class="baskets" style="margin-top:12px">
            ${['egg', 'baby'].map((t) => `<div class="basket ${t}" data-drop data-t="${t}"><h3>${t === 'egg' ? spriteIcon('stages', 4) : spriteIcon('stages', 7)}${esc(F.ANIMAL_TYPES[t])}</h3><div class="in">${F.ANIMALS.filter((a) => M.animals[a.i] === t).map((a) => `<span>${spriteFluid('animals', a.i)}${esc(a.name)}</span>`).join('')}</div></div>`).join('')}
          </div>
        </div>
        <div style="display:grid;gap:12px;align-content:start;min-width:0">
          ${talkHTML('동물은 알이나 새끼로 태어나서 자라고, 다 자란 동물이 다시 알이나 새끼를 낳아요. 동물마다 어떻게 다를까요?', 'smile')}
          <div class="panel" id="infocard"><span class="tape sky">도감 카드</span><p class="muted" style="margin-top:8px">동물을 바르게 나누면 그 동물의 한살이가 여기에 나타나요.</p></div>
        </div>
      </div>
      <div id="cycles"></div>
      <div id="compare"></div>`;
    const talk = $('.talk', host), info = $('#infocard', host);
    C.dnd($('#sortbox', host), {
      items: '.ac', targets: '.basket',
      onDrop: (el, bk) => {
        const a = F.ANIMALS[+el.dataset.i], t = bk.dataset.t;
        if (a.t !== t) { sfx('no'); shake(el); say(talk, `${esc(C.josa(a.name, '은/는'))} 어떻게 태어날까요? ${a.t === 'egg' ? '알에서 깨어나는 모습을 떠올려 봐요.' : '어미 배 속에서 자라다 태어나요.'}`, 'wow'); return; }
        sfx('pop'); M.animals[a.i] = t; C.save();
        el.classList.add('used');
        $('.in', bk).insertAdjacentHTML('beforeend', `<span>${spriteFluid('animals', a.i)}${esc(a.name)}</span>`);
        info.innerHTML = `<span class="tape sky">도감 카드</span><div style="display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:center;margin-top:8px"><div>${spriteFluid('animals', a.i, '', a.name)}</div><div><b style="font-family:var(--font-display);font-size:24px">${esc(a.name)}</b> <span class="small muted">${esc(F.ANIMAL_TYPES[a.t])}</span><p>${esc(a.life)}</p></div></div>`;
        say(talk, `맞아요! ${esc(C.josa(a.name, '은/는'))} ${esc(F.ANIMAL_TYPES[a.t])}이에요.`, 'good');
        if (Object.keys(M.animals).length === F.ANIMALS.length) { setTimeout(() => cycles(), 400); say(talk, '모두 나눴어요! 이번엔 동물이 자라는 순서를 맞혀 볼까요?', 'good'); }
      }
    });
    if (Object.keys(M.animals).length === F.ANIMALS.length) cycles();

    function cycles() {
      const box = $('#cycles', host);
      box.innerHTML = `<div class="panel" style="margin-top:16px"><span class="tape green">자라는 순서 맞히기</span>
        <div style="display:grid;gap:18px;margin-top:10px">${Object.entries(F.CYCLES).map(([k, cy]) => cycleHTML(k, cy)).join('')}</div></div>`;
      Object.keys(F.CYCLES).forEach((k) => wireCycle(k));
      if (Object.keys(F.CYCLES).every((k) => M.cycles[k])) compare();
    }
    function cycleHTML(k, cy) {
      const done = M.cycles[k];
      const cards = C.shuffle(cy.steps.map((s, i) => ({ ...s, i })), k.length * 13);
      return `<div class="cyc" data-k="${k}">
        <b style="font-family:var(--font-display);font-size:22px">${esc(cy.name)}의 한살이 <span class="small muted">(${esc(F.ANIMAL_TYPES[cy.type])})</span></b>
        <div class="order" style="margin-top:6px">${cy.steps.map((s, i) => `${i ? '<span class="arrow">→</span>' : ''}<div class="os ${done ? 'filled' : ''}" data-drop data-i="${i}"><span class="n">${i + 1}</span>${done ? stageCard(s) : ''}</div>`).join('')}</div>
        ${done ? '' : `<div class="stagecards" style="margin-top:8px">${cards.map((s) => `<button class="sc" data-drag data-i="${s.i}">${stageCard(s)}</button>`).join('')}</div>`}
      </div>`;
    }
    function wireCycle(k) {
      const el = $(`.cyc[data-k="${k}"]`, host); if (!el || M.cycles[k]) return;
      const cy = F.CYCLES[k];
      let next = 0;
      C.dnd(el, {
        items: '.sc', targets: '.os',
        onDrop: (card, slot) => {
          const si = +slot.dataset.i, ci = +card.dataset.i;
          if (slot.classList.contains('filled')) return;
          if (si !== next || ci !== si) { sfx('no'); shake(card); say(talk, next === 0 ? `${esc(cy.name)}의 한살이는 무엇에서 시작할까요?` : `${next}번 다음 모습은 무엇일까요?`, 'wow'); return; }
          sfx('pop'); slot.classList.add('filled'); slot.insertAdjacentHTML('beforeend', stageCard(cy.steps[ci])); card.classList.add('used'); next++;
          if (next === cy.steps.length) {
            M.cycles[k] = true; C.save(); sfx('ok');
            say(talk, k === 'frog' ? '개구리는 알 → 올챙이 → 뒷다리 → 앞다리가 나오고 꼬리가 짧아지며 개구리가 돼요. 다 자란 개구리는 물과 땅을 오가며 살아요.' : k === 'chicken' ? '닭은 알 → 병아리 → 어린 닭 → 다 자란 닭으로 자라요.' : '갓 태어난 강아지는 어미와 모습이 비슷하고, 어미젖을 먹으며 자라요.', 'good');
            if (Object.keys(F.CYCLES).every((x) => M.cycles[x])) compare();
          }
        }
      });
    }
    function compare() {
      const box = $('#compare', host);
      box.innerHTML = `<div class="panel" style="margin-top:16px"><span class="tape sky">비교하기</span>
        ${F.ANIMAL_COMPARE.map((q, qi) => `<div class="qrow" data-q="${qi}" style="margin-top:6px"><span class="qk">${esc(q.q)}</span>
          <div class="choices">${choices(q.opts, qi + 5).map((c) => `<button class="choice ${M.compare[qi] && c.ok ? 'ok' : ''}" data-ok="${c.ok ? 1 : 0}" ${M.compare[qi] ? 'disabled' : ''}>${esc(c.t)}</button>`).join('')}</div></div>`).join('')}
        <div class="next-row" id="anext" style="margin-top:10px"></div></div>`;
      const done = () => {
        if (M.compare[0] && M.compare[1]) {
          $('#anext', host).innerHTML = plantsDone() ? '<button class="btn primary" data-go="map">지도로 →</button>' : '<button class="btn primary" data-go="museum" data-arg="plant">식물관으로 →</button>';
          checkStamp(talk);
        }
      };
      $$('.qrow', box).forEach((row) => row.addEventListener('click', (e) => {
        const b = e.target.closest('.choice'); if (!b || b.disabled) return;
        const qi = +row.dataset.q;
        if (b.dataset.ok === '1') { sfx('ok'); b.classList.add('ok'); $$('.choice', row).forEach((x) => (x.disabled = true)); M.compare[qi] = true; C.save(); say(talk, qi === 0 ? '맞아요! 알을 낳든 새끼를 낳든, 다 자란 암컷이 자손을 남겨 한살이가 이어져요.' : '맞아요. 그리고 같은 무리 안에서도 동물마다 알을 낳는 곳, 한 번에 낳는 수, 자라는 기간이 달라요.', 'good'); done(); }
        else { sfx('no'); b.classList.add('bad'); shake(b); }
      }));
      done();
    }
  }
  function stageCard(s) {
    return (s.s != null ? spriteFluid('stages', s.s, '', s.t) : spriteFluid('animals', s.a, '', s.t)) + `<span>${esc(s.t)}</span>`;
  }
  function spriteIcon(sheet, i) { return `<span style="width:34px;display:inline-block">${spriteFluid(sheet, i)}</span>`; }

  /* ───── 식물관 ───── */
  function plantHall(host) {
    const S = C.S, M = S.museum;
    const bank = C.shuffle(F.PLANTS, 33);
    host.innerHTML = `
      <div class="grid2">
        <div class="panel paper" id="psort"><span class="tape">식물 나누기</span>
          <p class="muted" style="margin:8px 0">식물 카드를 <b>한 해 동안 사는 식물</b>과 <b>여러 해 동안 사는 식물</b>로 나누어요.</p>
          <div class="bank">${bank.map((p) => `<button class="ac ${M.plants[p.i] ? 'used' : ''}" data-drag data-i="${p.i}">${spriteFluid('plants', p.i, '', p.name)}${esc(p.name)}</button>`).join('')}</div>
          <div class="baskets" style="margin-top:12px">
            ${['annual', 'perennial'].map((t) => `<div class="basket ${t}" data-drop data-t="${t}"><h3>${spriteIcon('seasons', t === 'annual' ? 0 : 9)}${esc(F.PLANT_TYPES[t])}</h3><p class="small muted">${esc(F.PLANT_TYPE_DESC[t])}</p><div class="in">${F.PLANTS.filter((p) => M.plants[p.i] === t).map((p) => `<span>${spriteFluid('plants', p.i)}${esc(p.name)}</span>`).join('')}</div></div>`).join('')}
          </div>
        </div>
        <div style="display:grid;gap:12px;align-content:start;min-width:0">
          ${talkHTML('식물도 씨가 싹 트고 자라 꽃이 피고 열매를 맺어 씨를 만들어요. 그런데 한 해만 사는 식물도, 여러 해를 사는 식물도 있어요!', 'smile')}
          <div class="panel" id="pinfo"><span class="tape sky">도감 카드</span><p class="muted" style="margin-top:8px">식물을 바르게 나누면 설명이 나타나요.</p></div>
        </div>
      </div>
      <div id="season"></div>
      <div id="pmyth"></div>`;
    const talk = $('.talk', host), info = $('#pinfo', host);
    C.dnd($('#psort', host), {
      items: '.ac', targets: '.basket',
      onDrop: (el, bk) => {
        const p = F.PLANTS[+el.dataset.i], t = bk.dataset.t;
        if (p.t !== t) { sfx('no'); shake(el); say(talk, p.note ? `${esc(C.josa(p.name, '은/는'))} 풀이지만… 겨울에 땅속 부분이 어떻게 되는지 생각해 봐요.` : `${esc(C.josa(p.name, '은/는'))} 겨울을 어떻게 날까요? 다시 생각해 봐요.`, 'wow'); return; }
        sfx('pop'); M.plants[p.i] = t; C.save(); el.classList.add('used');
        $('.in', bk).insertAdjacentHTML('beforeend', `<span>${spriteFluid('plants', p.i)}${esc(p.name)}</span>`);
        info.innerHTML = `<span class="tape sky">도감 카드</span><div style="display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:center;margin-top:8px"><div>${spriteFluid('plants', p.i, '', p.name)}</div><div><b style="font-family:var(--font-display);font-size:24px">${esc(p.name)}</b> <span class="small muted">${esc(F.PLANT_TYPES[p.t])}</span><p>${esc(p.note || F.PLANT_TYPE_DESC[p.t])}</p></div></div>`;
        say(talk, p.note ? `맞아요! ${esc(p.note)}` : `맞아요! ${esc(C.josa(p.name, '은/는'))} ${esc(F.PLANT_TYPES[p.t])}이에요.`, 'good');
        if (Object.keys(M.plants).length === F.PLANTS.length) { setTimeout(() => season(), 400); say(talk, '모두 나눴어요! 이번엔 계절에 따라 봉숭아와 사과나무가 어떻게 달라지는지 살펴봐요.', 'good'); }
      }
    });
    if (Object.keys(M.plants).length === F.PLANTS.length) season();

    function season() {
      const box = $('#season', host);
      box.innerHTML = `<div class="panel season" style="margin-top:16px"><span class="tape green">계절 따라 한살이</span>
        <div class="pair" style="margin-top:10px">${F.SEASON_PLANTS.map((sp, i) => `<div class="sp-card" id="sp${i}"></div>`).join('')}</div>
        <input type="range" min="0" max="4" value="0" id="srange" aria-label="계절">
        <div class="ticks">${F.SEASONS.map((s) => `<span>${esc(s)}</span>`).join('')}</div></div>`;
      const seen = new Set([0]);
      const draw = (k) => {
        F.SEASON_PLANTS.forEach((sp, i) => {
          $(`#sp${i}`, box).innerHTML = `<b>${esc(sp.name)}</b><span class="small muted">${esc(F.PLANT_TYPES[sp.type])}</span>${spriteFluid('seasons', sp.frames[k], '', sp.name)}<p>${esc(sp.text[k])}</p>`;
        });
      };
      draw(0);
      $('#srange', box).addEventListener('input', (e) => {
        const k = +e.target.value; sfx('page'); draw(k); seen.add(k);
        if (k === 3) say(talk, '겨울이 되면 봉숭아는 씨를 남기고 죽어요. 사과나무는 잎이 지지만 죽지 않고 <b>겨울눈</b>으로 겨울을 나요.', 'wow');
        if (seen.size === 5 && !M.seasonSeen) { M.seasonSeen = true; C.save(); sfx('ok'); say(talk, '한해살이식물은 한 해 동안 한살이를 마치고, 여러해살이식물은 여러 해 동안 살면서 한살이 과정의 일부를 되풀이해요.', 'good'); myth(); }
      });
      if (M.seasonSeen) myth();
    }
    function myth() {
      const box = $('#pmyth', host);
      if (box.innerHTML) return;
      box.innerHTML = `<div class="panel" style="margin-top:16px"><span class="tape sky">O, X</span>
        <div class="grid2" style="margin-top:8px;align-items:center">
          <div class="qrow" id="mrow"><span class="qtext" style="font-size:19px">나무는 여러해살이식물이고, 풀은 모두 한해살이식물이다.</span><span class="ox"><button data-v="1">O</button><button data-v="0">X</button></span><p class="small muted why"></p></div>
          <div class="jr-view"><div style="width:min(240px,100%)">${spriteFluid('seasons', 10, '', '겨울 민들레의 땅속뿌리')}</div><span class="small muted">겨울 민들레: 잎은 땅에 붙고 굵은 뿌리는 살아 있어요</span></div>
        </div><div class="next-row" id="pnext" style="margin-top:10px"></div></div>`;
      const row = $('#mrow', box);
      const fin = () => { $('#pnext', box).innerHTML = animalsDone() ? '<button class="btn primary" data-go="map">지도로 →</button>' : '<button class="btn primary" data-go="museum" data-arg="animal">동물관으로 →</button>'; checkStamp(talk); };
      if (M.myth) { $$('button', row).forEach((b) => { b.disabled = true; if (b.dataset.v === '0') b.classList.add('ok'); }); $('.why', row).textContent = '민들레, 비비추처럼 풀이지만 땅속 부분이 살아남아 여러 해를 사는 식물도 있어요.'; fin(); }
      row.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return;
        if (b.dataset.v === '0') { sfx('ok'); b.classList.add('ok'); $$('button', row).forEach((x) => (x.disabled = true)); $('.why', row).textContent = '민들레, 비비추처럼 풀이지만 땅속 부분이 살아남아 여러 해를 사는 식물도 있어요.'; M.myth = true; C.save(); say(talk, '맞아요! 풀 중에도 여러해살이식물이 있어요. 민들레는 땅속뿌리로 겨울을 나요.', 'good'); fin(); }
        else { sfx('no'); b.classList.add('bad'); shake(b); say(talk, '민들레는 풀일까요, 나무일까요? 그리고 몇 해를 살까요?', 'wow'); }
      });
    }
  }
})();
