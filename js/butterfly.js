/* 1. 나비 사육장 — 사육장 꾸미기 · 날마다 돌보며 관찰하기 · 한살이 포트폴리오 */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, sprite, spriteFluid, talkHTML, say, modal, closeModal, toast, shake, wait, choices } = C;
  const STEPS = ['사육장 꾸미기', '기르며 관찰하기', '한살이 포트폴리오'];
  F.Z = F.Z || {};

  F.Z.butterfly = {
    render(view, arg) {
      const S = C.S;
      let sub = arg;
      if (!sub) sub = S.bf.setup < 3 ? 'setup' : (!S.bf.released ? 'raise' : 'portfolio');
      if (sub !== 'setup' && S.bf.setup < 3 && !S.teacher) sub = 'setup';
      if (sub === 'setup') renderSetup(view);
      else if (sub === 'raise') renderRaise(view);
      else renderPortfolio(view);
    }
  };
  const head = (cur) => F.zoneHead('butterfly', C.stepsHTML(STEPS, cur));

  /* ════════ ① 사육장 꾸미기 ════════ */
  function renderSetup(view) {
    const S = C.S;
    S.bf.got = S.bf.got || [];
    const items = C.shuffle(F.SETUP_ITEMS, 7);
    view.innerHTML = `<section class="zone wrap">${head(0)}
      <div class="grid2">
        <div class="panel paper"><span class="tape">준비물 선반</span>
          <p class="muted" style="margin:6px 0 10px">배추흰나비를 기를 때 <b>필요한 것만</b> 골라 사육장 자리로 옮겨요. (누르거나 끌어다 놓기)</p>
          <div class="shelf" id="shelf">
            ${items.map((it) => `<button class="it ${S.bf.got.includes(it.k) ? 'used' : ''}" data-drag data-k="${it.k}">${C.spriteFluid('items', F.ITEM[it.k], '', it.name)}<span>${esc(it.name)}</span></button>`).join('')}
          </div>
        </div>
        <div style="display:grid;gap:14px;min-width:0">
          ${talkHTML('배추흰나비는 주변에서 쉽게 볼 수 있고 한살이 기간이 약 한 달로 짧아서 관찰하기 좋아요. 먼저 사육장을 꾸며 볼까요?', 'smile')}
          <div class="setup-area" data-drop id="area"><span class="cap">사육장 자리 <span id="cnt">${S.bf.got.length}</span>/8</span>
            ${S.bf.got.map((k) => putHTML(k)).join('')}
          </div>
          <div id="after"></div>
        </div>
      </div></section>`;
    const talk = $('.talk', view), area = $('#area', view);
    const ctl = C.dnd(view, {
      items: '.it', targets: '[data-drop]',
      onPick: (el) => place(el),
      onDrop: (el) => place(el)
    });
    function place(el) {
      const k = el.dataset.k, it = F.SETUP_ITEMS.find((x) => x.k === k);
      if (el.classList.contains('used')) return;
      if (!it.ok) { setTimeout(() => ctl.select(null), 0); sfx('no'); el.classList.add('nope'); shake(el); say(talk, `<b>${esc(C.josa(it.name, '은/는'))}</b> 필요 없어요. ${esc(it.why)}`, 'wow'); setTimeout(() => el.classList.remove('nope'), 1200); return; }
      sfx('pop'); el.classList.add('used'); setTimeout(() => ctl.select(null), 0);
      S.bf.got.push(k); C.save();
      area.insertAdjacentHTML('beforeend', putHTML(k));
      $('#cnt', view).textContent = S.bf.got.length;
      say(talk, `<b>${esc(it.name)}</b> — ${esc(it.why)}`, 'good');
      if (S.bf.got.length >= 8) setTimeout(() => showAssembled(), 700);
    }
    if (S.bf.got.length >= 8) showAssembled(true);

    function showAssembled(quiet) {
      $$('.it', view).forEach((b) => b.classList.add('used'));
      area.innerHTML = `<span class="cap">사육장 완성!</span>
        <div class="box-stage" style="width:100%;margin-top:4px">
          <div class="window"></div><div class="sun"></div>
          <div class="tray"></div>
          <div class="kale-pot">${kalePot('fresh')}</div>
          <div class="net"></div>
        </div>`;
      if (!quiet) { sfx('grow'); say(talk, '쟁반 위에 케일 화분을 올리고 사육 망을 씌웠어요. 이제 기르기 전에 꼭 지켜야 할 약속을 확인해요!', 'good'); }
      safety();
    }
    function safety() {
      const box = $('#after', view);
      const done = S.bf.safetyAns || {};
      box.innerHTML = `<div class="panel"><span class="tape green">기를 때 약속 (O, X)</span>
        <div style="margin-top:8px">${F.SAFETY_OX.map((q, i) => `
          <div class="qrow" data-i="${i}">
            <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
              <span style="flex:1;min-width:200px">${esc(q.q)}</span>
              <span class="ox"><button data-v="1" aria-label="맞아요(O)" ${done[i] ? 'disabled' : ''} class="${done[i] && q.a ? 'ok' : ''}">O</button><button data-v="0" aria-label="틀려요(X)" ${done[i] ? 'disabled' : ''} class="${done[i] && !q.a ? 'ok' : ''}">X</button></span>
            </div>
            <p class="small muted why">${done[i] ? esc(q.why) : ''}</p>
          </div>`).join('')}</div>
        <div class="next-row" style="margin-top:10px"><button class="btn primary" id="go-raise" ${Object.keys(done).length === F.SAFETY_OX.length ? '' : 'disabled'}>배추흰나비 알 찾으러 가기 →</button></div>
      </div>`;
      $$('.qrow', box).forEach((row) => row.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return;
        const i = +row.dataset.i, q = F.SAFETY_OX[i], v = b.dataset.v === '1';
        if (v === q.a) {
          sfx('ok'); b.classList.add('ok'); $$('button', row).forEach((x) => (x.disabled = true));
          $('.why', row).textContent = q.why; done[i] = true; S.bf.safetyAns = done; C.save();
          if (Object.keys(done).length === F.SAFETY_OX.length) { $('#go-raise', box).disabled = false; say(talk, '약속까지 완벽해요! 이제 케일 잎 뒷면에서 배추흰나비 알을 찾아볼까요?', 'good'); }
        } else { sfx('no'); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 700); say(talk, '다시 생각해 봐요. ' + q.why.replace(/^맞아요[!.]?\s*/, ''), 'wow'); }
      }));
      $('#go-raise', box).addEventListener('click', () => {
        S.bf.setup = 3; S.bf.safety = true; if (S.bf.idx < 0) { S.bf.idx = 0; S.bf.day = 1; S.bf.tasksDone = {}; }
        C.save(); sfx('ok'); F.go('butterfly', 'raise');
      });
    }
  }
  function putHTML(k) { const it = F.SETUP_ITEMS.find((x) => x.k === k); return `<span class="put">${C.spriteFluid('items', F.ITEM[k])}${esc(it.name)}</span>`; }

  // 케일 화분 그림 (props 시트가 있으면 그것, 없으면 준비물 스티커)
  function kalePot(state) {
    const map = { fresh: 0, eaten: 1, wilt: 2, pale: 3, small: 4 };
    return C.spriteFluid('props', map[state] != null ? map[state] : 0, '', '케일 화분');
  }
  F.kalePot = kalePot;

  /* ════════ ② 기르며 관찰하기 ════════ */
  const STAGE_CLASS = (st) => st.startsWith('egg') ? 'egg' : st.startsWith('larva') || st === 'prepupa' ? 'larva' : st.startsWith('pupa') ? 'pupa' : 'adult';
  function dayDef() { return F.BF_DAYS[Math.max(0, C.S.bf.idx)]; }
  function taskList(dd) {
    const t = [];
    if (dd.journal) t.push('journal');
    (dd.tasks || []).forEach((k) => t.push(k));
    if (dd.q) t.push('quiz');
    if (dd.ev === 'release') t.push('release');
    return t;
  }
  const TASK_LABEL = {
    journal: '돋보기로 관찰하고 기록장에 쓰기', quiz: '봄이의 질문에 답하기', release: '나비를 꽃밭으로 놓아 주기',
    water: F.TASKS.water.name, clean: F.TASKS.clean.name, leaf: F.TASKS.leaf.name, fall: F.TASKS.fall.name
  };

  function renderRaise(view) {
    const S = C.S;
    if (S.bf.idx < 0) { S.bf.idx = 0; S.bf.day = 1; S.bf.tasksDone = {}; C.save(); }
    const dd = dayDef();
    const tasks = taskList(dd);
    const st = dd.st;
    // 날마다 바뀌는 장면 상태
    const scene = sceneState(dd);
    view.innerHTML = `<section class="zone wrap">${head(1)}
      <div class="panel" style="padding:12px 14px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
          <b style="font-family:var(--font-display);font-size:21px">관찰 달력</b>
          <span class="legend"><span style="--c:#f3d873">알</span><span style="--c:#9fd37a">애벌레</span><span style="--c:#c9dfa0">번데기</span><span style="--c:#bcdcef">어른벌레</span><span style="--c:var(--stamp)">● 관찰할 날</span></span>
        </div>
        <div class="cal" id="cal">${calendarHTML(dd.d)}</div>
      </div>
      <div class="grid2">
        <div style="display:grid;gap:10px;min-width:0">
          <div class="box-stage" id="stage">
            <div class="window"></div><div class="sun"></div>
            <div class="tray"></div>
            <button class="kale-pot" id="pot" aria-label="케일 화분">${kalePot(scene.pot)}</button>
            ${scene.newPot ? `<button class="kale-pot new" id="newpot" aria-label="새 케일 화분">${kalePot('fresh')}</button>` : ''}
            <div class="net" aria-hidden="true"></div>
            <div id="skins"></div>
            <div id="poops"></div>
            <button class="critter" id="critter" aria-label="배추흰나비 ${esc(stageName(st))}"></button>
            <div class="moist" title="케일 화분 흙의 물기">물기 <span class="bar"><b id="moist" style="width:${scene.moist}%"></b></span></div>
            <div class="daylbl" id="daylbl">${dd.d}일째</div>
            <div class="nightfx"></div>
          </div>
          <div class="tools" id="tools">
            ${F.TOOLS.map((t) => `<button class="tool" data-tool="${t.id}" aria-label="${t.name}">${t.item ? C.spriteFluid('items', F.ITEM[t.item]) : '<span class="hand" aria-hidden="true">✋</span>'}${t.name}</button>`).join('')}
          </div>
        </div>
        <div style="display:grid;gap:12px;align-content:start;min-width:0">
          ${talkHTML(esc(dd.say), dd.ev === 'hatch' || dd.ev === 'eclose' || dd.st === 'prepupa' ? 'wow' : 'smile')}
          <div class="panel paper"><span class="tape">오늘 할 일</span>
            <ul class="tasks" id="tasks" style="margin-top:6px">${tasks.map((k) => `<li data-t="${k}" class="${S.bf.tasksDone[k] ? 'done' : ''}"><span class="ck">${S.bf.tasksDone[k] ? '✓' : ''}</span><span>${esc(TASK_LABEL[k])}</span></li>`).join('') || '<li class="done"><span class="ck">✓</span>오늘은 지켜보기만 해요</li>'}</ul>
            <p class="small muted" id="hint" style="margin-top:8px">${tasks.length ? '도구를 고른 다음 사육장 안을 눌러요.' : ''}</p>
          </div>
          ${dd.fact ? `<div class="fact"><b>알아 두기</b>${esc(dd.fact)}</div>` : ''}
          <div class="next-row">
            ${S.teacher ? '<button class="btn small ghost" id="skip">건너뛰기(교사)</button>' : ''}
            ${S.bf.journal && Object.keys(S.bf.journal).length ? '<button class="btn small" data-go="notebook">관찰 기록 보기</button>' : ''}
            <button class="btn primary" id="next">${nextLabel()}</button>
          </div>
        </div>
      </div></section>`;

    const stage = $('#stage', view), talk = $('.talk', view), critter = $('#critter', view);
    let tool = null;
    const cal = $('#cal', view), nowD = $('.d.now', cal);
    if (nowD) cal.scrollLeft = Math.max(0, nowD.offsetLeft - cal.clientWidth / 2);
    drawScene(stage, critter, dd, scene, false);
    playEvent(stage, critter, dd, scene, talk);

    // 도구
    $$('.tool', view).forEach((b) => b.addEventListener('click', () => {
      tool = tool === b.dataset.tool ? null : b.dataset.tool;
      $$('.tool', view).forEach((x) => x.classList.toggle('on', x.dataset.tool === tool));
      stage.className = 'box-stage' + (tool ? ' tool-' + tool : '');
      sfx('tap');
      const hint = $('#hint', view);
      const tips = { loupe: '돋보기: 사육장 속 생물을 눌러 자세히 관찰해요.', ruler: '자: 애벌레나 번데기를 눌러 길이를 재요.', can: '물뿌리개: 케일 화분을 눌러 물을 줘요.', tissue: '휴지: 쟁반에 떨어진 똥을 눌러 치워요.', brush: '붓: 애벌레를 다치지 않게 살살 옮겨요.', hand: '손: 생물은 손으로 만지지 않아요!' };
      hint.textContent = tool ? tips[tool] : '도구를 고른 다음 사육장 안을 눌러요.';
    }));

    // 생물 누르기
    critter.addEventListener('click', () => {
      if (!tool) { say(talk, '먼저 아래에서 도구를 골라요. 자세히 보려면 <b>돋보기</b>!', 'smile'); return; }
      if (tool === 'hand') { sfx('no'); shake(critter); say(talk, '안 돼요! 손으로 만지면 알이나 애벌레가 다칠 수 있어요. <b>붓</b>이나 잎을 이용해요.', 'wow'); return; }
      if (tool === 'loupe') { openLoupe(dd, view); return; }
      if (tool === 'ruler') { openLoupe(dd, view, true); return; }
      if (tool === 'brush') {
        if (scene.fallen && !S.bf.tasksDone.fall) { liftFallen(); return; }
        if (scene.newPot && !S.bf.tasksDone.leaf) { moveToNewPot(); return; }
        say(talk, '지금은 옮기지 않아도 괜찮아요. 붓은 꼭 필요할 때만 살살 써요.', 'smile'); return;
      }
      say(talk, '그 도구는 지금 필요 없어요.', 'smile');
    });

    // 화분
    $('#pot', view).addEventListener('click', () => {
      if (tool === 'can') {
        if (!tasks.includes('water') || S.bf.tasksDone.water) { say(talk, '흙이 아직 촉촉해요. 물을 너무 많이 주면 뿌리가 상할 수 있어요.', 'smile'); return; }
        sfx('water'); drip(stage); $('#moist', view).style.width = '82%';
        finish('water', '케일에 물을 줬어요. 먹이 식물이 싱싱해야 애벌레가 잘 자라요!');
      } else if (tool === 'loupe') { openLoupe(dd, view); }
      else if (tool === 'hand') { say(talk, '화분은 만져도 괜찮지만, 잎 위의 생물은 손대지 않아요.', 'smile'); }
      else if (!tool) say(talk, '도구를 먼저 골라요.', 'smile');
    });
    const np = $('#newpot', view);
    if (np) np.addEventListener('click', () => { if (tool === 'brush') moveToNewPot(); else say(talk, '<b>붓</b>을 골라 애벌레를 눌러서 새 화분으로 옮겨 줘요.', 'smile'); });

    // 똥
    $('#poops', view).addEventListener('click', (e) => {
      const p = e.target.closest('.poop'); if (!p) return;
      if (tool !== 'tissue') { say(talk, '똥은 <b>휴지</b>로 치워요.', 'smile'); return; }
      sfx('pop'); p.remove();
      if (!$$('.poop', view).length && tasks.includes('clean')) finish('clean', '쟁반이 깨끗해졌어요. 똥이 많다는 건 애벌레가 잎을 많이 먹었다는 뜻이에요!');
    });

    // 할 일 목록 누르면 안내
    $('#tasks', view).addEventListener('click', (e) => {
      const li = e.target.closest('li[data-t]'); if (!li) return;
      const k = li.dataset.t;
      if (k === 'journal') { if (S.bf.tasksDone.journal) return openJournal(dd.journal, view); return say(talk, '<b>돋보기</b>를 고르고 사육장 속 생물을 눌러 관찰해요.', 'smile'); }
      if (k === 'quiz') return openQuiz(dd.q);
      if (k === 'release') return release();
      say(talk, F.TASKS[k].hint, 'smile');
    });

    $('#next', view).addEventListener('click', () => nextDay(view));
    const sk = $('#skip', view);
    if (sk) sk.addEventListener('click', () => { tasks.forEach((k) => (S.bf.tasksDone[k] = true)); if (dd.journal && !S.bf.journal[dd.journal]) S.bf.journal[dd.journal] = { ans: {}, draw: '', note: '', day: dd.d, skipped: true }; if (dd.ev === 'release') S.bf.released = true; C.save(); nextDay(view); });

    function finish(k, msg) {
      S.bf.tasksDone[k] = true; C.save();
      const li = $(`#tasks li[data-t="${k}"]`, view);
      if (li) { li.classList.add('done'); $('.ck', li).textContent = '✓'; }
      sfx('ok'); if (msg) say(talk, msg, 'good');
      $('#next', view).textContent = nextLabel();
    }
    F._bfFinish = finish;
    function liftFallen() {
      sfx('pop'); scene.fallen = false; drawScene(stage, critter, dd, scene, true);
      finish('fall', '붓으로 살살 들어 잎 위에 올려 줬어요. 잎이나 나뭇가지를 가까이 대 주어도 스스로 기어 올라와요.');
    }
    function moveToNewPot() {
      sfx('pop'); scene.onNew = true; drawScene(stage, critter, dd, scene, true);
      setTimeout(() => {
        const old = $('#pot', view); old.innerHTML = kalePot('fresh');
        const npEl = $('#newpot', view); if (npEl) npEl.remove();
        scene.newPot = false; scene.onNew = false; scene.pot = 'fresh'; drawScene(stage, critter, dd, scene, false);
        finish('leaf', '애벌레를 붓으로 옮기고 싱싱한 케일 화분으로 바꿨어요. 먹이가 넉넉해야 잘 자라요!');
      }, 950);
    }
    function openQuiz(key) {
      const q = F.BF_QUIZ[key];
      const box = modal(`<h2>봄이의 질문</h2><p class="qtext" style="margin-bottom:12px">${esc(q.q)}</p>
        <div class="choices">${choices(q.opts, 3).map((c) => `<button class="choice" data-ok="${c.ok ? 1 : 0}">${esc(c.t)}</button>`).join('')}</div>
        <p class="fact" id="qwhy" hidden style="margin-top:12px"></p>
        <div class="row end" style="margin-top:12px"><button class="btn primary" data-close id="qok" hidden>알겠어요</button></div>`);
      $$('.choice', box).forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.ok === '1') {
          sfx('ok'); b.classList.add('ok'); $$('.choice', box).forEach((x) => (x.disabled = true));
          const w = $('#qwhy', box); w.hidden = false; w.innerHTML = `<b>정답!</b>${esc(q.why)}`; $('#qok', box).hidden = false;
          S.bf.quiz[key] = true; finish('quiz');
        } else { sfx('no'); b.classList.add('bad'); shake(b); }
      }));
    }
    function release() {
      if (S.bf.tasksDone.release) return;
      sfx('fanfare');
      critter.style.transition = 'left 2.4s ease-in, top 2.4s ease-in, transform 2.4s';
      critter.style.left = '18%'; critter.style.top = '18%'; critter.style.transform = 'translate(-50%,-50%) scale(.6) rotate(-20deg)';
      S.bf.released = true; finish('release', '훨훨! 나비가 꽃밭으로 날아갔어요. 어른벌레는 짝짓기를 하고 알을 낳아요. 그렇게 한살이가 다시 시작돼요.');
      setTimeout(() => { $('#next', view).textContent = '한살이 포트폴리오 만들기 →'; }, 600);
    }
  }

  function nextLabel() {
    const S = C.S; const i = S.bf.idx;
    if (i >= F.BF_DAYS.length - 1) return S.bf.released ? '한살이 포트폴리오 만들기 →' : '나비를 놓아 주세요';
    return `다음 관찰일(${F.BF_DAYS[i + 1].d}일)로 →`;
  }
  async function nextDay(view) {
    const S = C.S, dd = dayDef(), tasks = taskList(dd);
    const left = tasks.filter((k) => !S.bf.tasksDone[k]);
    if (left.length && !S.teacher) {
      sfx('no'); const li = $(`#tasks li[data-t="${left[0]}"]`, view); shake(li);
      say($('.talk', view), `아직 할 일이 남았어요: <b>${esc(TASK_LABEL[left[0]])}</b>`, 'wow'); return;
    }
    if (S.bf.idx >= F.BF_DAYS.length - 1) { if (S.bf.released || S.teacher) { S.bf.released = true; C.save(); F.go('butterfly', 'portfolio'); } return; }
    // 밤이 지나가는 연출
    const stage = $('#stage', view); stage.classList.add('night'); sfx('day');
    $('#next', view).disabled = true;
    await wait(1100);
    S.bf.idx += 1; S.bf.day = F.BF_DAYS[S.bf.idx].d; S.bf.tasksDone = {};
    if (F.BF_DAYS[S.bf.idx].ev === 'molt') S.bf.molts = F.BF_DAYS[S.bf.idx].molt;
    C.save();
    F.go('butterfly', 'raise');
  }

  function calendarHTML(cur) {
    const evDays = new Set(F.BF_DAYS.map((d) => d.d));
    let h = '';
    for (let d = 1; d <= 32; d++) {
      const stg = d < 6 ? 'egg' : d < 23 ? 'larva' : d < 31 ? 'pupa' : 'adult';
      h += `<span class="d ${stg} ${evDays.has(d) ? 'ev' : ''} ${d === cur ? 'now' : ''}">${d}<i></i></span>`;
    }
    return h;
  }
  function stageName(st) { return { egg: '알', egg2: '알', larva: '애벌레', prepupa: '애벌레', pupa: '번데기', pupa2: '번데기', adult: '어른벌레' }[st] || ''; }

  // 날짜별 장면 상태
  function sceneState(dd) {
    const S = C.S, done = S.bf.tasksDone;
    const tasks = taskList(dd);
    const sc = { pot: 'fresh', moist: 72, newPot: false, fallen: false, poops: 0, wet: 0 };
    if (dd.d >= 13 && dd.d < 16) sc.pot = 'eaten';
    if (dd.d === 16) { sc.pot = done.leaf ? 'fresh' : 'eaten'; sc.newPot = !done.leaf; }
    if (dd.d >= 21 && dd.d <= 22) sc.pot = 'eaten';
    if (tasks.includes('water') && !done.water) sc.moist = 22;
    if (tasks.includes('fall') && !done.fall) sc.fallen = true;
    if (tasks.includes('clean') && !done.clean) sc.poops = Math.min(7, 3 + Math.floor(dd.mm / 7));
    if (dd.st === 'prepupa') sc.wet = 2;
    return sc;
  }

  // 생물 위치·모양 그리기
  function critterPos(dd, sc) {
    if (sc.fallen) return { x: 46, y: 86 };
    if (sc.onNew) return { x: 73, y: 60 };
    switch (dd.st) {
      case 'egg': case 'egg2': return { x: 52, y: 52 };
      case 'larva': return { x: 50, y: 48 };
      case 'prepupa': return { x: 70, y: 24 };
      case 'pupa': case 'pupa2': return { x: 72, y: 25 };
      default: return { x: 60, y: 38 };
    }
  }
  function drawScene(stage, critter, dd, sc, animate) {
    const W = stage.clientWidth || 600;
    const p = critterPos(dd, sc);
    if (!animate) critter.style.transition = 'none';
    critter.style.left = p.x + '%'; critter.style.top = p.y + '%';
    if (!animate) { void critter.offsetWidth; critter.style.transition = ''; }
    critter.innerHTML = critterSVG(dd, W);
    critter.classList.toggle('tap-me', dd.st.startsWith('egg') || (dd.journal && !C.S.bf.tasksDone.journal) || (sc.fallen && !C.S.bf.tasksDone.fall) || (sc.newPot && !C.S.bf.tasksDone.leaf));
    // 똥
    const pp = stage.querySelector('#poops');
    let h = '';
    for (let i = 0; i < sc.poops; i++) h += `<button class="poop" aria-label="애벌레 똥" style="left:${26 + ((i * 37) % 52)}%;bottom:${10 + ((i * 13) % 5)}%"></button>`;
    for (let i = 0; i < sc.wet; i++) h += `<span class="poop wet" style="left:${58 + i * 6}%;bottom:11%"></span>`;
    pp.innerHTML = h;
    // 허물
    const sk = stage.querySelector('#skins'); let s2 = '';
    const molts = dd.st === 'larva' || dd.st === 'prepupa' ? Math.min(4, (dd.d >= 10) + (dd.d >= 13) + (dd.d >= 16) + (dd.d >= 19)) : 0;
    for (let i = 0; i < molts; i++) s2 += `<span class="molt-skin" style="left:${40 + i * 5}%;top:${55 + (i % 2) * 3}%" title="허물"></span>`;
    // 날개돋이 뒤 남은 번데기 껍질
    if (dd.st === 'adult' && !sc.released) s2 += `<span style="position:absolute;left:72%;top:25%;transform:translate(-50%,-50%);width:${Math.round(W * 0.04)}px;height:${Math.round(W * 0.1)}px;border-radius:50% 50% 45% 45%;border:1.5px solid rgba(160,170,120,.9);background:rgba(235,238,210,.55);pointer-events:none" title="번데기 껍질"></span>`;
    sk.innerHTML = s2;
  }
  // mm → 화면 길이
  function critterSVG(dd, W) {
    const ppm = W * 0.0042; // 1 mm당 화면 픽셀
    const st = dd.st;
    if (st === 'egg' || st === 'egg2') {
      const h = Math.max(13, ppm * 3), w = h * 0.5, col = st === 'egg2' ? '#f3e7a8' : '#f2c63c';
      return `<svg width="${w + 4}" height="${h + 4}" viewBox="-2 -2 ${w + 4} ${h + 4}"><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${col}" stroke="#b08a1a" stroke-width="1"/>${[0.3, 0.5, 0.7].map((f) => `<line x1="${w * f}" y1="${h * 0.12}" x2="${w * f}" y2="${h * 0.88}" stroke="#c9a12c" stroke-width=".8"/>`).join('')}${st === 'egg2' ? `<path d="M${w * 0.3} ${h * 0.6} q${w * 0.2} -${h * 0.15} ${w * 0.4} 0" stroke="#9aa04a" stroke-width="1.3" fill="none"/>` : ''}</svg>`;
    }
    if (st === 'larva' || st === 'prepupa') {
      const mm = dd.mm, L = Math.max(16, mm * ppm * 2.2), seg = 10, r = Math.max(2.4, L / seg / 1.55);
      const t = Math.min(1, (mm - 2) / 14);
      const c1 = mix('#efe58a', '#86c652', t), c2 = mix('#d8c95a', '#5d9e3b', t);
      let circles = '';
      for (let i = 0; i < seg; i++) {
        const x = r + i * ((L - 2 * r) / (seg - 1)), y = r + 2 + Math.sin(i / 2.2) * r * 0.25;
        circles += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? c1 : c2}" stroke="${mix(c2, '#2d3a2c', .35)}" stroke-width=".7"/>`;
      }
      const hx = L - r + r * 0.4;
      return `<svg width="${L + r}" height="${2 * r + 6}" viewBox="0 0 ${L + r} ${2 * r + 6}" style="transform:rotate(${st === 'prepupa' ? -70 : -8}deg)">${circles}<circle cx="${hx}" cy="${r + 2}" r="${r * 1.02}" fill="${mix(c2, '#3b4a22', .25)}"/><circle cx="${hx + r * 0.35}" cy="${r + 1}" r="${Math.max(0.8, r * 0.2)}" fill="#1d2414"/></svg>`;
    }
    if (st === 'pupa' || st === 'pupa2') {
      const L = 25 * ppm * 2.0, w = L * 0.36;
      const fill = st === 'pupa2' ? '#e6ead6' : '#a9cf74';
      return `<svg width="${w + 10}" height="${L + 14}" viewBox="-5 -10 ${w + 10} ${L + 14}"><line x1="${w / 2}" y1="-10" x2="${w / 2}" y2="2" stroke="#fff" stroke-width="1.4"/><path d="M${w / 2} 0 C ${w * 1.1} ${L * 0.25}, ${w * 1.05} ${L * 0.6}, ${w / 2} ${L} C ${-w * 0.05} ${L * 0.6}, ${-w * 0.1} ${L * 0.25}, ${w / 2} 0 Z" fill="${fill}" stroke="#6f8f45" stroke-width="1.1"/>${st === 'pupa2' ? `<path d="M${w * 0.32} ${L * 0.35} q${w * 0.2} ${L * 0.15} 0 ${L * 0.3}" fill="#2d3a2c" opacity=".55"/><ellipse cx="${w * 0.55}" cy="${L * 0.45}" rx="${w * 0.08}" ry="${L * 0.05}" fill="#2d3a2c" opacity=".5"/>` : ''}<path d="M${-2} ${L * 0.42} q${w / 2 + 2} ${L * 0.08} ${w + 4} 0" stroke="#fff" stroke-width="1.1" fill="none"/></svg>`;
    }
    // 어른벌레
    return sprite('bf', F.BF.adultOpen, Math.max(62, W * 0.16), '', '배추흰나비');
  }
  function mix(a, b, t) {
    const pa = a.match(/\w\w/g).map((x) => parseInt(x, 16)), pb = b.match(/\w\w/g).map((x) => parseInt(x, 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function drip(stage) {
    const d = document.createElement('div'); d.className = 'waterdrop'; d.style.left = '52%'; d.style.top = '46%';
    for (let i = 0; i < 9; i++) { const k = document.createElement('i'); k.style.left = (i * 7) % 40 + 'px'; k.style.animationDelay = i * 0.06 + 's'; d.appendChild(k); }
    stage.appendChild(d); setTimeout(() => d.remove(), 1400);
  }

  // 사건 연출 (부화·허물·번데기·날개돋이)
  async function playEvent(stage, critter, dd, sc, talk) {
    const S = C.S;
    const key = 'ev' + dd.d;
    if (!dd.ev || S.bf.tasksDone[key]) return;
    S.bf.tasksDone[key] = true; C.save();
    if (dd.ev === 'hatch') {
      critter.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 900, easing: 'ease-out' });
      sfx('grow');
    } else if (dd.ev === 'molt') {
      critter.animate([{ transform: 'translate(-50%,-50%) scale(.82)' }, { transform: 'translate(-50%,-50%) scale(1.08) rotate(4deg)', offset: .6 }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 900, easing: 'ease-out' });
      sfx('grow');
    } else if (dd.ev === 'pupate') {
      critter.animate([{ filter: 'brightness(1.6)', transform: 'translate(-50%,-50%) scale(.7)' }, { filter: 'none', transform: 'translate(-50%,-50%) scale(1)' }], { duration: 1200, easing: 'ease-out' });
      sfx('grow');
    } else if (dd.ev === 'eclose') {
      critter.animate([{ transform: 'translate(-50%,-50%) scale(.35) rotate(-40deg)', opacity: .3 }, { transform: 'translate(-50%,-50%) scale(.7) rotate(-10deg)', opacity: 1, offset: .45 }, { transform: 'translate(-50%,-50%) scale(1) rotate(0)' }], { duration: 2400, easing: 'ease-out' });
      sfx('fanfare'); setTimeout(() => C.confetti(24), 800);
    }
  }

  /* ───── 돋보기 · 자 ───── */
  function openLoupe(dd, view, rulerFirst) {
    const S = C.S;
    const spr = loupeSprite(dd);
    const needJ = dd.journal && !S.bf.tasksDone.journal;
    const box = modal(`
      <h2>돋보기로 관찰하기 — ${esc(stageName(dd.st))} (${dd.d}일째)</h2>
      <div class="grid2 even">
        <div class="jr-view">${spriteFluid('bf', spr, '', stageName(dd.st))}<p class="small muted">돋보기로 크게 본 모습이에요.</p></div>
        <div style="display:grid;gap:10px;align-content:start">
          ${loupeNotes(dd)}
          ${(dd.st === 'larva' || dd.st === 'prepupa' || dd.st.startsWith('pupa')) ? `<div><b style="font-family:var(--font-display);font-size:20px">자로 길이 재기</b>${measureHTML()}<p class="small muted" id="mhint">자를 좌우로 끌어서 0 눈금을 꼬리 끝에 맞춘 뒤, 머리 끝의 눈금을 읽어요.</p></div>` : ''}
          ${needJ ? '<button class="btn primary" id="to-journal">관찰 기록장에 쓰기 →</button>' : (dd.journal ? '<button class="btn" id="to-journal">내 관찰 기록 보기</button>' : '<button class="btn" data-close>닫기</button>')}
        </div>
      </div>`, { cls: 'wide' });
    const mm = dd.st.startsWith('pupa') ? 25 : dd.mm;
    if ($('.measure', box)) setupMeasure(box, mm);
    const tj = $('#to-journal', box);
    if (tj) tj.addEventListener('click', () => { closeModal(true); openJournal(dd.journal, view); });
  }
  function loupeSprite(dd) {
    if (dd.st === 'egg' || dd.st === 'egg2') return F.BF.egg;
    if (dd.st === 'larva' || dd.st === 'prepupa') return dd.mm <= 4 ? F.BF.larvaS : F.BF.larvaL;
    if (dd.st === 'pupa') return F.BF.pupa;
    if (dd.st === 'pupa2') return F.BF.pupaClear;
    return dd.ev === 'eclose' ? F.BF.emerge : F.BF.adultOpen;
  }
  function loupeNotes(dd) {
    const n = {
      egg: '노란색이고 길쭉한 옥수수 모양이에요. 세로로 주름이 있어요.',
      egg2: '알 색깔이 연해졌어요. 속에서 애벌레가 꿈틀거려요.',
      larva: dd.mm <= 4 ? '몸이 연한 노란색이고 아주 작아요. 갓 나온 애벌레는 알껍데기를 먹어요.' : '몸이 초록색이고 긴 원통 모양이에요. 마디가 있고 털이 나 있어요.',
      prepupa: '먹이를 먹지 않고 사육 망 위쪽으로 올라왔어요.',
      pupa: '가운데가 볼록하고 양 끝이 뾰족해요. 털이 없고, 실로 몸이 고정되어 있어요.',
      pupa2: '껍질이 투명해져 날개의 검은 무늬가 비쳐요.',
      adult: '머리, 가슴, 배가 있어요. 가슴에 다리 3쌍과 날개 2쌍이 있고, 더듬이가 1쌍 있어요.'
    };
    return `<div class="fact"><b>보이는 것</b>${esc(n[dd.st] || '')}</div>`;
  }
  function measureHTML() {
    return `<div class="measure" style="margin-top:6px"><svg class="worm" width="300" height="60" viewBox="0 0 300 60"></svg><div class="rul" tabindex="0" aria-label="자, 화살표 키로 움직일 수 있어요"><svg viewBox="0 0 400 40" preserveAspectRatio="none"></svg></div><span class="read">? mm</span></div>`;
  }
  function setupMeasure(box, mm) {
    const m = $('.measure', box), worm = $('.worm', m), rul = $('.rul', m), read = $('.read', m);
    const W = m.clientWidth || 380, pxmm = (W * 0.84) / 40; // 자 40 mm가 상자 폭의 84%
    // 애벌레(또는 번데기)
    const L = mm * pxmm, x0 = W * 0.12;
    worm.setAttribute('width', W); worm.setAttribute('viewBox', `0 0 ${W} 60`); worm.style.left = '0'; worm.style.top = '20%';
    const isPupa = mm === 25 && C.S.bf.idx >= 11;
    worm.innerHTML = isPupa
      ? `<path d="M${x0} 30 C ${x0 + L * 0.25} 8, ${x0 + L * 0.6} 6, ${x0 + L} 30 C ${x0 + L * 0.6} 54, ${x0 + L * 0.25} 52, ${x0} 30 Z" fill="#a9cf74" stroke="#6f8f45"/>`
      : (() => { const n = 12, r = Math.max(5, (L / n) * 0.62), sp = (L - 2 * r) / (n - 1); let h = ''; for (let i = 0; i < n; i++) h += `<circle cx="${x0 + r + i * sp}" cy="${30 + Math.sin(i / 1.8) * 1.5}" r="${r}" fill="${i % 2 ? '#86c652' : '#6fae45'}" stroke="#3f6b2a" stroke-width=".8"/>`; return h + `<circle cx="${x0 + L - r}" cy="30" r="${r * 1.04}" fill="#4b7a2c"/><circle cx="${x0 + L - r * 0.55}" cy="${30 - r * 0.25}" r="${Math.max(1.2, r * 0.18)}" fill="#111"/>`; })();
    // 자 눈금 (0~40 mm)
    const rs = $('svg', rul);
    let t = '<rect x="0" y="0" width="400" height="40" fill="rgba(255,255,255,.2)"/>';
    for (let i = 0; i <= 40; i++) { const x = 4 + i * 9.8; t += `<line x1="${x}" y1="0" x2="${x}" y2="${i % 10 === 0 ? 20 : i % 5 === 0 ? 14 : 8}" stroke="#335" stroke-width="${i % 5 === 0 ? 1.4 : .8}"/>`; if (i % 5 === 0) t += `<text x="${x}" y="34" font-size="11" text-anchor="middle" fill="#223">${i}</text>`; }
    rs.innerHTML = t;
    // 자 위치: 0 눈금 = 자 왼쪽 + 4/400*폭
    let left = W * 0.3; // 처음엔 어긋나게
    const zeroOff = () => (rul.clientWidth || W * 0.88) * (4 / 400);
    function place() { rul.style.left = left + 'px'; const z = left + zeroOff(); const ok = Math.abs(z - x0) < 4; read.textContent = ok ? '0 맞춤 ✓' : '0을 꼬리에 맞춰요'; if (ok && !m.dataset.ok) { m.dataset.ok = '1'; sfx('ok'); const h = $('#mhint', box); if (h) h.innerHTML = '0 눈금을 꼬리 끝에 맞췄어요! 이제 <b>머리 끝이 닿은 눈금</b>을 읽어 보세요. 긴 눈금 하나가 5 mm예요.'; } }
    rul.style.width = W * 0.88 + 'px'; place();
    let drag = null;
    rul.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, l: left }; rul.setPointerCapture(e.pointerId); });
    rul.addEventListener('pointermove', (e) => { if (!drag) return; left = Math.max(-W * 0.2, Math.min(W * 0.4, drag.l + e.clientX - drag.x)); const z = left + zeroOff(); if (Math.abs(z - x0) < 6) left = x0 - zeroOff(); place(); });
    rul.addEventListener('pointerup', () => (drag = null));
    rul.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { left -= 4; } else if (e.key === 'ArrowRight') { left += 4; } else return; e.preventDefault(); const z = left + zeroOff(); if (Math.abs(z - x0) < 5) left = x0 - zeroOff(); place(); });
  }

  /* ───── 관찰 기록장 ───── */
  function openJournal(key, view) {
    const S = C.S, J = F.JOURNAL[key], saved = S.bf.journal[key];
    const seed = key.length * 7 + 3;
    const qs = J.qs.map((q, qi) => ({ ...q, list: choices(q.opts, seed + qi * 11) }));
    const ans = saved && saved.ans ? Object.assign({}, saved.ans) : {};
    const box = modal(`
      <h2>관찰 기록장 · ${esc(J.title)} <span class="muted small">${J.day}일째</span></h2>
      <div class="jr">
        <div style="display:grid;gap:10px;align-content:start;min-width:0">
          <div class="jr-view">${spriteFluid('bf', F.BF[J.sprite], '', J.title)}</div>
          <div><b style="font-family:var(--font-display);font-size:20px">돋보기로 본 모습을 그려요</b><div id="pad"></div></div>
        </div>
        <div style="min-width:0">
          ${qs.map((q, qi) => `
            <div class="qrow" data-q="${qi}">
              <span class="qk">${esc(q.k)}</span>
              <div class="choices inline">${q.list.map((c) => `<button class="choice ${ans[q.k] && c.ok ? 'ok' : ''}" data-ok="${c.ok ? 1 : 0}">${esc(c.t)}</button>`).join('')}</div>
            </div>`).join('')}
          <div class="field" style="margin-top:10px"><label for="jnote">새롭게 알게 된 점, 궁금한 점</label>
            <textarea class="input" id="jnote" placeholder="예) 알이 생각보다 훨씬 작아서 놀랐다.">${esc(saved && saved.note || '')}</textarea></div>
          <p class="small" id="jmsg" style="min-height:1.5em;margin-top:6px;color:var(--stamp)"></p>
          ${J.fact ? `<div class="fact" id="jfact" ${saved ? '' : 'hidden'}><b>알아 두기</b>${esc(J.fact)}</div>` : ''}
          <div class="row end" style="margin-top:8px"><button class="btn primary" id="jsave">기록 완료</button></div>
        </div>
      </div>`, { cls: 'wide' });
    const pad = F.DrawPad($('#pad', box), { value: saved && saved.draw });
    $$('.qrow', box).forEach((row) => row.addEventListener('click', (e) => {
      const b = e.target.closest('.choice'); if (!b) return;
      const q = qs[+row.dataset.q];
      if (b.dataset.ok === '1') { sfx('ok'); $$('.choice', row).forEach((x) => x.classList.remove('ok', 'bad')); b.classList.add('ok'); ans[q.k] = b.textContent; }
      else { sfx('no'); b.classList.add('bad'); shake(b); $('#jmsg', box).textContent = J.hint; setTimeout(() => b.classList.remove('bad'), 900); }
    }));
    $('#jsave', box).addEventListener('click', () => {
      const missing = qs.filter((q) => !ans[q.k]);
      if (missing.length) { sfx('no'); $('#jmsg', box).textContent = `아직 고르지 않은 항목: ${missing.map((q) => q.k).join(', ')}`; shake($(`.qrow[data-q="${qs.indexOf(missing[0])}"]`, box)); return; }
      const draw = pad.dirty ? pad.data() : (saved && saved.draw) || '';
      const note = $('#jnote', box).value.trim();
      const doSave = () => {
        S.bf.journal[key] = { ans, draw, note, day: J.day }; S.bf.tasksDone.journal = true; C.save();
        closeModal(true); C.stampFX('관찰 완료');
        const li = $(`#tasks li[data-t="journal"]`, view); if (li) { li.classList.add('done'); $('.ck', li).textContent = '✓'; }
        const crit = $('#critter', view); if (crit) crit.classList.remove('tap-me');
        say($('.talk', view), J.fact ? esc(J.fact) : '관찰 기록을 남겼어요! 글과 그림으로 기록하면 변화를 한눈에 비교할 수 있어요.', 'good');
        const nx = $('#next', view); if (nx) nx.textContent = nextLabel();
      };
      if (!draw) {
        const b2 = $('#jmsg', box);
        b2.innerHTML = '그림이 비어 있어요. <button class="btn small" id="j-draw">그릴게요</button> <button class="btn small ghost" id="j-skip">다음에 그릴래요</button>';
        $('#j-draw', box).addEventListener('click', () => { b2.textContent = ''; $('#pad canvas', box).scrollIntoView({ behavior: 'smooth', block: 'center' }); });
        $('#j-skip', box).addEventListener('click', doSave);
        return;
      }
      doSave();
    });
  }
  F.openBfJournal = openJournal;

  /* ════════ ③ 한살이 포트폴리오 ════════ */
  function renderPortfolio(view) {
    const S = C.S;
    const pf = S.bf.portfolio || { placed: {}, periods: {} };
    const cardImg = (c) => {
      const jkey = { egg: 'egg', larva: 'larva', pupa: 'pupa', adult: 'adult' }[c.k];
      const j = S.bf.journal[jkey];
      return j && j.draw ? `<img src="${j.draw}" alt="${esc(c.name)} 그림">` : spriteFluid('bf', F.BF[c.sprite], '', c.name);
    };
    const order = C.shuffle(F.CYCLE, 5);
    const pos = [{ x: 50, y: 15 }, { x: 85, y: 50 }, { x: 50, y: 85 }, { x: 15, y: 50 }];
    view.innerHTML = `<section class="zone wrap">${head(2)}
      <div class="grid2">
        <div class="panel paper"><span class="tape">한살이 고리 만들기</span>
          <p class="muted" style="margin:8px 0">내가 그린 관찰 카드를 한살이 순서대로 고리에 놓아요. 1번 자리부터 시계 방향이에요.</p>
          <div class="cycle" id="cycle"><div class="ring"></div>
            ${pos.map((p, i) => { const k = pf.placed[i]; const c = k && F.CYCLE.find((x) => x.k === k); return `<div class="slot ${c ? 'filled' : ''}" data-drop data-i="${i}" style="left:${p.x}%;top:${p.y}%">${c ? `<div style="width:80%">${cardImg(c)}</div><span class="lab">${esc(c.name)}</span>` : `<span class="lab">${i + 1}</span>`}</div>`; }).join('')}
          </div>
          <div class="cards" id="cards" style="margin-top:12px">
            ${order.map((c) => `<button class="ccard ${Object.values(pf.placed).includes(c.k) ? 'used' : ''}" data-drag data-k="${c.k}">${cardImg(c)}${esc(c.name)}</button>`).join('')}
          </div>
        </div>
        <div style="display:grid;gap:14px;align-content:start;min-width:0">
          ${talkHTML('관찰한 내용을 모아 한살이 포트폴리오를 완성해요. 알에서 시작해 어른벌레가 되고, 어른벌레가 다시 알을 낳아요!', 'smile')}
          <div class="panel"><span class="tape green">단계별 기간</span>
            <p class="muted small" style="margin:8px 0">기간 카드를 알맞은 단계에 놓아요.</p>
            <div class="chipbank" id="chips">${C.shuffle(F.CYCLE, 9).map((c) => `<button class="chip ${Object.values(pf.periods).includes(c.period) ? 'used' : ''}" data-drag data-p="${c.period}">${esc(c.period)}</button>`).join('')}</div>
            <div class="periods" style="margin-top:10px">${F.CYCLE.map((c) => `<div class="period"><b>${esc(c.name)}</b><div class="drop" data-drop data-k="${c.k}">${pf.periods[c.k] ? esc(pf.periods[c.k]) : '여기에'}</div></div>`).join('')}</div>
          </div>
          <div id="pf-done"></div>
        </div>
      </div></section>`;
    const talk = $('.talk', view);
    C.dnd($('#cycle', view).parentElement, {
      items: '.ccard', targets: '.slot',
      onDrop: (el, slot) => {
        const i = +slot.dataset.i, k = el.dataset.k;
        if (pf.placed[i]) return;
        if (F.CYCLE[i].k !== k) { sfx('no'); shake(el); say(talk, i === 0 ? '한살이는 <b>알</b>에서 시작해요.' : `${i}번 다음에는 무엇이 될까요? 관찰 달력을 떠올려 봐요.`, 'wow'); return; }
        sfx('pop'); pf.placed[i] = k; S.bf.portfolio = pf; C.save();
        const c = F.CYCLE[i];
        slot.classList.add('filled'); slot.innerHTML = `<div style="width:80%">${cardImg(c)}</div><span class="lab">${esc(c.name)}</span>`;
        el.classList.add('used');
        check();
      }
    });
    C.dnd($('#chips', view).parentElement, {
      items: '.chip', targets: '.drop',
      onDrop: (el, d) => {
        const k = d.dataset.k, p = el.dataset.p;
        if (pf.periods[k]) return;
        const c = F.CYCLE.find((x) => x.k === k);
        if (c.period !== p) { sfx('no'); shake(el); say(talk, '다시 생각해 봐요. 애벌레 시기가 가장 길고, 알 시기는 일주일이 채 안 돼요.', 'wow'); return; }
        sfx('pop'); pf.periods[k] = p; S.bf.portfolio = pf; C.save();
        d.textContent = p; el.classList.add('used'); check();
      }
    });
    function check() {
      if (Object.keys(pf.placed).length === 4 && Object.keys(pf.periods).length === 4) {
        const box = $('#pf-done', view);
        if (box.innerHTML) return;
        box.innerHTML = `<div class="panel"><span class="tape sky">완성!</span>
          <p style="margin-top:8px;font-size:17px">배추흰나비는 <b>알 → 애벌레 → 번데기 → 어른벌레</b>의 한살이를 거쳐요. 어른벌레는 짝짓기를 하고 알을 낳아 한살이가 이어져요. 알에서 어른벌레가 되기까지 약 한 달이 걸려요.</p>
          <div class="next-row" style="margin-top:10px"><button class="btn" data-go="notebook">포트폴리오 보기</button><button class="btn primary" data-go="map">지도로 돌아가기</button></div></div>`;
        if (!C.S.stamps.butterfly) { F.stamp('butterfly', '한살이 관찰 완료'); say(talk, '배추흰나비 한살이 포트폴리오 완성! 농장 일지에 내 관찰 기록이 모두 모였어요.', 'good'); }
      }
    }
    check();
  }
})();
