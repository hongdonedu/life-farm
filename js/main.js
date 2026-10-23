/* 꼬물꼬물 한살이 농장 — 화면 전환, 타이틀, 농장 지도, 선생님 모드 */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, modal, closeModal, toast, talkHTML } = C;
  F.Z = F.Z || {};
  const view = $('#view');

  /* ───── 위쪽 막대 ───── */
  function topbar(show, where) {
    const tb = $('#topbar'); tb.hidden = !show;
    if (!show) return;
    $('#where').innerHTML = where || '';
    const S = C.S;
    $('#stampbar').innerHTML = F.ZONES.map((z) => `<i class="${S.stamps[z.id] ? 'on' : ''}" title="${esc(z.name)}">${S.stamps[z.id] ? '참' : ''}</i>`).join('');
    $('#btn-sound').textContent = C.muted ? '소리 꺼짐' : '소리';
    $('#btn-sound').setAttribute('aria-pressed', String(!C.muted));
  }
  F.topbar = topbar;
  $('#go-map').addEventListener('click', () => go('map'));
  $('#btn-notebook').addEventListener('click', () => go('notebook'));
  $('#btn-sound').addEventListener('click', () => { C.setMuted(!C.muted); topbar(true, $('#where').innerHTML); if (!C.muted) sfx('ok'); });
  $('.brand').insertAdjacentHTML('afterbegin', C.sprite('bf', F.BF.adultOpen, 36, '', '나비'));

  /* ───── 도장 ───── */
  F.stamp = function (id, label) {
    const S = C.S; const first = !S.stamps[id];
    S.stamps[id] = true; C.save();
    C.stampFX(label || '참 잘했어요');
    if (first) setTimeout(() => C.confetti(46), 300);
    topbar(true, $('#where').innerHTML);
  };

  /* ───── 화면 전환 ───── */
  let current = '';
  function go(name, arg) {
    closeModal(true);
    current = name;
    view.innerHTML = '';
    window.scrollTo(0, 0);
    if (name === 'title') { topbar(false); renderTitle(); }
    else if (name === 'map') { renderMap(); }
    else if (name === 'notebook') { topbar(true, '<b>농장 일지</b>'); F.Notebook.render(view); }
    else if (name === 'quiz') { topbar(true, '<b>마무리 퀴즈</b>'); F.Notebook.quiz(view); }
    else if (F.Z[name]) {
      const z = F.ZONES.find((x) => x.id === name);
      topbar(true, `${z.no}. <b>${esc(z.name)}</b>`);
      F.Z[name].render(view, arg);
    }
    try { if (name !== 'title') history.replaceState(null, '', '#' + name); else history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    view.focus({ preventScroll: true });
  }
  F.go = go;

  // 구역 머리말 (공통)
  F.zoneHead = function (id, extra) {
    const z = F.ZONES.find((x) => x.id === id);
    return `<div class="zone-head">
      <button class="btn small ghost no-print" data-go="map">← 지도</button>
      <h1>${esc(z.name)}</h1>
      <span class="std">[${esc(z.std)}] · ${esc(z.lesson)}</span>
      <span class="sp"></span>${extra || ''}
    </div>`;
  };
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); sfx('tap'); go(g.dataset.go, g.dataset.arg); }
  });

  /* ───── 타이틀 ───── */
  function renderTitle() {
    const S = C.S;
    const letters = (t, cls) => `<span class="w">${Array.from(t).map((ch) => `<span class="${cls || ''}">${ch}</span>`).join('')}</span>`;
    view.innerHTML = `
    <section class="title-screen">
      <div class="title-bg" role="img" aria-label="밀짚모자를 쓴 봄이가 돋보기로 케일 잎 위 애벌레를 관찰하는 봄날의 농장"></div>
      <div class="title-head">
        <span class="kicker">3학년 1학기 과학 · 4. 생물의 한살이</span>
        <h1 class="logo">${letters('꼬물꼬물')} ${letters('한살이', 'y')} ${letters('농장')}</h1>
        <p class="title-sub">배추흰나비를 기르고, 씨앗을 실험하고, 여러 생물의 한살이를 소개해요</p>
      </div>
      <div class="title-inner wrap">
        <div class="title-btns">
          <button class="btn primary" id="t-start">${S.started ? '이어서 하기' : '농장으로 출발'}</button>
          ${S.started ? '<button class="btn" id="t-new">처음부터</button>' : ''}
          <button class="btn" id="t-teacher">선생님 모드</button>
        </div>
        <div class="title-meta">
          <span>[4과04-01] 관찰하고 글과 그림으로 표현</span>
          <span>[4과04-02] 자라는 조건을 찾는 실험 설계</span>
          <span>[4과04-03] 한살이 유형 소개 자료</span>
        </div>
      </div>
    </section>`;
    $('#t-start').addEventListener('click', () => { sfx('ok'); if (!S.name) askName(() => go('map')); else go('map'); });
    const nw = $('#t-new');
    if (nw) nw.addEventListener('click', () => confirmBox('처음부터 다시 시작할까요? 지금까지의 관찰 기록과 도장이 모두 지워져요.', '모두 지우고 시작', () => { C.reset(); go('title'); toast('새 농장을 준비했어요!'); }));
    $('#t-teacher').addEventListener('click', () => teacherGate());
  }

  function confirmBox(msg, yes, onYes) {
    const box = modal(`<h2>확인해 주세요</h2><p style="font-size:18px">${esc(msg)}</p>
      <div class="row end" style="margin-top:16px"><button class="btn" data-close>아니요</button><button class="btn primary" id="cf-yes">${esc(yes)}</button></div>`);
    $('#cf-yes', box).addEventListener('click', () => { closeModal(true); onYes(); });
  }
  F.confirmBox = confirmBox;

  function askName(then) {
    const box = modal(`
      <h2>농부 이름을 적어 주세요</h2>
      <p class="muted" style="margin-bottom:12px">관찰 일지와 수료증에 이 이름이 들어가요.</p>
      <form id="name-form" class="field">
        <label for="farmer-name">이름</label>
        <input class="input" id="farmer-name" maxlength="14" autocomplete="off" placeholder="예) 3학년 2반 김봄" autofocus>
        <div class="row end" style="margin-top:12px"><button class="btn primary" type="submit">농장 열기</button></div>
      </form>`, { noClose: false });
    $('#name-form', box).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#farmer-name', box).value.trim();
      if (!v) { C.shake($('#farmer-name', box)); return; }
      C.S.name = v; C.S.started = true; C.save(); closeModal(true); sfx('ok'); then && then();
    });
  }
  F.askName = askName;

  /* ───── 농장 지도 ───── */
  function nextZone() { return F.ZONES.find((z) => !C.S.stamps[z.id]); }
  function renderMap() {
    const S = C.S;
    if (!S.name) { askName(() => go('map')); }
    S.started = true; C.save();
    topbar(true, `<b>${esc(S.name || '새 농부')}</b>의 농장`);
    const nz = nextZone();
    const allDone = F.ZONES.every((z) => S.stamps[z.id]);
    const msg = allDone
      ? '도장 여섯 개를 모두 모았어요! 마무리 퀴즈를 풀고 명예 농부 수료증을 받아요.'
      : nz.id === 'butterfly'
        ? '어서 와요! 먼저 <b>나비 사육장</b>에서 배추흰나비를 길러 볼까요? 알에서 나비가 되기까지 약 한 달이 걸려요.'
        : `잘하고 있어요! 다음은 <b>${esc(nz.name)}</b>이에요. ${esc(nz.goal)}`;
    view.innerHTML = `
    <section class="map-page wrap">
      <div class="map-head">
        <div><span class="kicker">${esc(S.name || '새 농부')} 농부의 봄 농장</span><h1 style="margin-top:8px">농장 지도</h1></div>
        <span class="sp"></span>
        <div style="flex:1 1 380px;min-width:0">${talkHTML(msg, allDone ? 'good' : 'smile')}</div>
      </div>
      <div class="map-frame">
        <img src="assets/map.jpg" alt="나비 사육장, 씨앗 실험실, 쑥쑥 텃밭, 한살이 도감관, 한살이 박람회, 스마트 팜이 길로 이어진 농장 지도">
        ${F.ZONES.map((z) => `
          <button class="pin ${nz && nz.id === z.id ? 'next' : ''}" style="left:${z.x}%;top:${z.y}%" data-go="${z.id}" aria-label="${z.no}. ${esc(z.name)}${S.stamps[z.id] ? ' (완료)' : ''}">
            <span class="lbl"><span class="no">${z.no}</span><span class="nm">${esc(z.name)}</span></span>
            ${S.stamps[z.id] ? '<span class="done-stamp">참!</span>' : ''}
          </button>`).join('')}
      </div>
      <div class="zone-list">
        ${F.ZONES.map((z) => `
          <button class="zcard ${S.stamps[z.id] ? 'done' : ''}" data-go="${z.id}">
            <span class="no">${S.stamps[z.id] ? '참' : z.no}</span>
            <b>${esc(z.name)}</b>
            <small>${esc(z.goal)}</small>
            <span class="tag">${esc(z.lesson)}</span>
          </button>`).join('')}
      </div>
      <div class="row">
        <button class="btn ${allDone ? 'primary' : ''}" data-go="quiz">마무리 퀴즈${allDone ? '' : ' (언제든 도전)'}</button>
        <button class="btn" data-go="notebook">농장 일지 보기</button>
        <a class="btn small" href="worksheet/index.html">활동지</a>
        <a class="btn small" href="guide/index.html">제작 가이드</a>
        <span class="sp" style="flex:1"></span>
        <button class="btn ghost small" id="m-teacher">선생님 모드</button>
        <button class="btn ghost small" data-go="title">처음 화면</button>
      </div>
    </section>`;
    $('#m-teacher').addEventListener('click', () => teacherGate());
  }

  /* ───── 선생님 모드 ───── */
  function teacherGate() {
    if (C.S.teacher) return teacherPanel();
    const box = modal(`
      <h2>선생님 모드</h2>
      <p class="muted">수업 시연과 차시별 활용을 위한 메뉴예요. 비밀번호(교육과정 개정 연도 네 자리)를 넣어 주세요.</p>
      <form id="tg" class="field" style="margin-top:12px">
        <label for="tcode">비밀번호</label>
        <input class="input" id="tcode" inputmode="numeric" maxlength="4" autocomplete="off" autofocus>
        <p id="tmsg" class="small" style="color:var(--stamp);min-height:1.4em"></p>
        <div class="row end"><button class="btn primary" type="submit">열기</button></div>
      </form>`);
    $('#tg', box).addEventListener('submit', (e) => {
      e.preventDefault();
      if ($('#tcode', box).value.trim() === '2022') { C.S.teacher = true; C.save(); sfx('ok'); teacherPanel(); }
      else { sfx('no'); $('#tmsg', box).textContent = '비밀번호가 달라요.'; C.shake($('#tcode', box)); }
    });
  }
  function teacherPanel() {
    const S = C.S;
    const box = modal(`
      <h2>선생님 모드</h2>
      <p class="muted" style="margin-bottom:10px">지도서 13차시 흐름에 맞춰 원하는 구역부터 열 수 있어요. 구역 안의 <b>건너뛰기</b> 버튼도 이 모드에서만 보여요.</p>
      <div class="tablewrap"><table class="teacher-table">
        <thead><tr><th>차시</th><th>지도서 주제</th><th>핵심 내용</th><th>게임에서</th></tr></thead>
        <tbody>${F.LESSONS.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <h3 style="margin-top:14px">나비 사육장 날짜로 바로 가기</h3>
      <div class="row" style="margin-top:6px">${F.BF_DAYS.map((d, i) => `<button class="btn small" data-jump="${i}">${d.d}일</button>`).join('')}</div>
      <h3 style="margin-top:14px">시연용</h3>
      <div class="row" style="margin-top:6px">
        <button class="btn small" id="t-all">도장 모두 채우기</button>
        <button class="btn small" id="t-off">선생님 모드 끄기</button>
        <button class="btn small" id="t-reset" style="border-color:var(--stamp);color:var(--stamp)">이 기기의 기록 지우기</button>
      </div>`, { cls: 'wide' });
    $$('[data-jump]', box).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.jump;
      S.bf.setup = 3; S.bf.safety = true; S.bf.idx = i; S.bf.day = F.BF_DAYS[i].d; S.bf.tasksDone = {};
      C.save(); closeModal(true); go('butterfly', 'raise');
    }));
    $('#t-all', box).addEventListener('click', () => { F.ZONES.forEach((z) => (S.stamps[z.id] = true)); C.save(); closeModal(true); go('map'); toast('도장을 모두 채웠어요(시연용).'); });
    $('#t-off', box).addEventListener('click', () => { S.teacher = false; C.save(); closeModal(true); toast('선생님 모드를 껐어요.'); if (current === 'map') go('map'); });
    $('#t-reset', box).addEventListener('click', () => confirmBox('이 기기에 저장된 이름, 관찰 기록, 도장을 모두 지울까요?', '모두 지우기', () => { C.reset(); go('title'); toast('기록을 지웠어요.'); }));
  }
  F.teacherPanel = teacherPanel;

  /* ───── 시작 ───── */
  const first = (location.hash || '').replace('#', '');
  if (C.memoryOnly) setTimeout(() => toast('이 브라우저에서는 기록이 저장되지 않아요. 창을 닫으면 처음부터 시작해요.'), 800);
  if (first && (F.Z[first] || first === 'map' || first === 'notebook' || first === 'quiz') && C.S.name) go(first);
  else go('title');
})();
