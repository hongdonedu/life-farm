/* 6. 스마트 팜 — 센서 규칙으로 물·빛·온도를 맞추고, 스마트 팜 전문가 알아보기 (진로) */
(function () {
  const F = window.FARM, C = F.core;
  const { $, $$, esc, sfx, talkHTML, say, shake, wait, spriteFluid } = C;
  const SM = F.SMART;
  F.Z = F.Z || {};
  // 그림 속 장치 위치(%) — assets/smart.jpg 기준
  const POS = {
    nozzles: [[32.3, 56.5], [43, 56.5], [52.6, 56.5], [61.4, 56.5]],
    leds: [[24, 47.3, 26], [55.5, 47.3, 18.5]],
    fan: [87.4, 48.6], roof: [89, 22],
    sensor: { soil: [6.3, 46], light: [19, 56.5], temp: [80.9, 54.2] }
  };

  F.Z.smart = {
    render(view) {
      const S = C.S, st = S.smart;
      view.innerHTML = `<section class="zone wrap">${F.zoneHead('smart', '')}
        <div class="grid2">
          <div style="display:grid;gap:10px;min-width:0">
            <div class="smart-room" id="room" style="background:url(assets/smart.jpg) center/cover">
              <div id="fx" style="position:absolute;inset:0;pointer-events:none"></div>
              <div id="sky" style="position:absolute;inset:0;pointer-events:none;transition:background .5s"></div>
              <div class="daylbl" id="sday" style="top:auto;bottom:4%;right:3%">준비</div>
              <div class="kalecard">
                <div id="kale">${spriteFluid('props', 4, '', '케일')}</div><b>케일 성장</b><div class="moist" style="position:static;border:0;padding:0;justify-content:center"><span class="bar" style="width:100%"><b id="grow" style="width:10%;background:var(--kale)"></b></span></div>
              </div>
            </div>
            <div class="gauges">
              <div class="gauge" id="g-soil">흙 습도<b>70 %</b></div>
              <div class="gauge" id="g-light">빛의 양<b>밝음</b></div>
              <div class="gauge" id="g-temp">온도<b>24 ℃</b></div>
            </div>
            <div class="panel" style="padding:12px"><b style="font-family:var(--font-display);font-size:19px">농장 기록</b><ul id="log" class="small" style="margin:6px 0 0;padding-left:18px;max-height:170px;overflow:auto"><li class="muted">시뮬레이션을 시작하면 7일 동안의 일이 기록돼요.</li></ul></div>
          </div>
          <div style="display:grid;gap:12px;align-content:start;min-width:0">
            ${talkHTML('스마트 팜은 <b>센서</b>로 흙의 물기, 빛, 온도를 재고, 필요할 때 <b>자동으로</b> 장치를 움직이는 똑똑한 농장이에요. 식물이 자라는 데 필요한 조건을 떠올리며 규칙을 만들어 볼까요?', 'smile')}
            <div class="panel paper" id="rulebox"><span class="tape">자동 규칙 만들기</span>
              <p class="muted small" style="margin:8px 0">아래 장치 카드를 알맞은 규칙 칸에 놓아요. (누르거나 끌어다 놓기)</p>
              <div class="rules">${SM.sensors.map((s) => `
                <div class="rule"><div class="if">만약 ${esc(s.when)}<small>${esc(s.name)}</small></div><span aria-hidden="true">→</span>
                  <div class="then ${st.rules[s.k] ? 'filled' : ''}" data-drop data-k="${s.k}">${st.rules[s.k] ? esc(SM.actions.find((a) => a.k === st.rules[s.k]).name) : '장치 카드를 놓아요'}</div></div>`).join('')}</div>
              <div class="acts" style="margin-top:12px">${C.shuffle(SM.actions, 12).map((a) => `<button class="act ${Object.values(st.rules).includes(a.k) ? 'used' : ''}" data-drag data-a="${a.k}">${esc(a.name)}</button>`).join('')}</div>
              <div class="next-row" style="margin-top:12px"><button class="btn small ghost" id="clear">규칙 지우기</button><button class="btn primary" id="run">7일 동안 돌려 보기 ▶</button></div>
            </div>
          </div>
        </div>
        <div id="career"></div></section>`;
      const talk = $('.talk', view);
      C.dnd($('#rulebox', view), {
        items: '.act', targets: '.then',
        onDrop: (el, slot) => {
          const k = slot.dataset.k, a = el.dataset.a;
          if (st.rules[k]) { const old = st.rules[k]; const ob = $(`.act[data-a="${old}"]`, view); if (ob) ob.classList.remove('used'); }
          st.rules[k] = a; C.save(); sfx('pop');
          slot.classList.add('filled'); slot.classList.remove('bad'); slot.textContent = SM.actions.find((x) => x.k === a).name;
          el.classList.add('used');
        }
      });
      $('#clear', view).addEventListener('click', () => { st.rules = {}; C.save(); F.go('smart'); });
      $('#run', view).addEventListener('click', () => run(view, talk));
      if (st.ok) career(view);
    }
  };

  let running = false;
  async function run(view, talk) {
    const S = C.S, st = S.smart;
    if (running) return;
    const missing = SM.sensors.filter((s) => !st.rules[s.k]);
    if (missing.length) { sfx('no'); say(talk, `‘${esc(missing[0].when)}’ 규칙이 비어 있어요. 장치 카드를 놓아 주세요.`, 'wow'); shake($(`.then[data-k="${missing[0].k}"]`, view)); return; }
    running = true; st.runs += 1; C.save();
    $('#run', view).disabled = true;
    const log = $('#log', view); log.innerHTML = '';
    const fx = $('#fx', view), sky = $('#sky', view);
    let soil = 70, grow = 10, stress = { soil: 0, light: 0, temp: 0 };
    const add = (t, ok) => { log.insertAdjacentHTML('afterbegin', `<li style="color:${ok === false ? 'var(--stamp)' : ok ? 'var(--kale-deep)' : 'inherit'}">${t}</li>`); };
    const setG = (id, val, warn) => { const g = $('#' + id, view); $('b', g).textContent = val; g.classList.toggle('warn', !!warn); };
    const cloudy = { 3: true, 5: true }, hot = { 2: true, 6: true };
    say(talk, '센서가 일하기 시작했어요! 7일 동안 무슨 일이 일어나는지 지켜봐요.', 'smile');
    for (let d = 1; d <= 7; d++) {
      $('#sday', view).textContent = d + '일째';
      // 아침
      sky.style.background = 'rgba(255,240,200,.08)';
      soil -= 22; if (soil < 0) soil = 0;
      setG('g-soil', soil + ' %', soil < 35); setG('g-light', cloudy[d] ? '부족(흐림)' : '밝음', cloudy[d]); setG('g-temp', '22 ℃');
      await wait(380);
      if (soil < 35) {
        blink(fx, 'soil');
        if (st.rules.soil === 'water') { spray(fx); soil = 80; setG('g-soil', soil + ' %'); add(`${d}일째 아침: 흙이 말랐어요 → <b>물을 줬어요</b> ✓`, true); sfx('water'); }
        else { stress.soil++; add(`${d}일째 아침: 흙이 말랐는데 ‘${esc(actName(st.rules.soil))}’ → 케일이 목말라요`, false); sfx('no'); }
      }
      await wait(380);
      // 낮
      if (cloudy[d]) {
        sky.style.background = 'rgba(80,90,110,.28)'; blink(fx, 'light');
        if (st.rules.light === 'led') { led(fx, true); add(`${d}일째 낮: 흐려서 빛이 부족해요 → <b>LED 조명을 켰어요</b> ✓`, true); }
        else { stress.light++; add(`${d}일째 낮: 빛이 부족한데 ‘${esc(actName(st.rules.light))}’ → 잎 색이 연해져요`, false); sfx('no'); }
      } else { sky.style.background = 'rgba(255,240,180,.06)'; }
      if (hot[d]) {
        setG('g-temp', '35 ℃', true); blink(fx, 'temp');
        if (st.rules.temp === 'vent') { vent(fx); setG('g-temp', '26 ℃'); add(`${d}일째 한낮: 너무 더워요(35 ℃) → <b>창문을 열고 환풍기를 켰어요</b> ✓`, true); }
        else { stress.temp++; add(`${d}일째 한낮: 너무 더운데 ‘${esc(actName(st.rules.temp))}’ → 케일이 시들어요`, false); sfx('no'); }
      } else setG('g-temp', '25 ℃');
      await wait(520);
      led(fx, false);
      // 밤
      sky.style.background = 'rgba(20,30,70,.38)'; setG('g-light', '밤(쉬는 시간)'); setG('g-temp', '18 ℃');
      const bad = stress.soil + stress.light + stress.temp;
      grow = Math.min(100, grow + (bad ? 6 : 13)); $('#grow', view).style.width = grow + '%';
      $('#kale', view).innerHTML = spriteFluid('props', bad >= 3 ? (stress.soil >= stress.light ? 2 : 3) : grow > 55 ? 0 : 4, '', '케일');
      await wait(420);
    }
    sky.style.background = 'transparent'; $('#sday', view).textContent = '7일 끝';
    running = false; $('#run', view).disabled = false;
    const total = stress.soil + stress.light + stress.temp;
    if (!total) {
      st.ok = true; C.save(); sfx('fanfare'); C.confetti(30);
      say(talk, '완벽해요! 물, 빛, 온도를 알맞게 맞춰 주니 케일이 쑥쑥 자랐어요. 식물이 자라는 조건을 아는 것이 스마트 팜의 첫걸음이에요.', 'good');
      $$('.then', view).forEach((t) => t.classList.remove('bad'));
      career(view);
      $('#career', view).scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const worst = Object.entries(stress).filter(([, v]) => v).map(([k]) => k);
      worst.forEach((k) => $(`.then[data-k="${k}"]`, view).classList.add('bad'));
      const msg = { soil: '흙이 마를 때는 무엇이 필요할까요?', light: '빛이 부족할 때 대신 빛을 줄 장치는?', temp: '너무 더울 때 온도를 낮추려면?' };
      say(talk, `케일이 힘들어했어요. 빨간 칸의 규칙을 고쳐 봐요. ${esc(msg[worst[0]])}`, 'wow');
    }
  }
  function actName(k) { return (SM.actions.find((a) => a.k === k) || {}).name || '없음'; }
  function blink(fx, k) {
    const p = POS.sensor[k], d = document.createElement('span');
    d.style.cssText = `position:absolute;left:${p[0]}%;top:${p[1]}%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#ff5a4a;box-shadow:0 0 0 6px rgba(255,90,74,.35);animation:glow 1s 2`;
    fx.appendChild(d); setTimeout(() => d.remove(), 1600);
  }
  function spray(fx) {
    POS.nozzles.forEach((p) => {
      const s = document.createElement('span');
      s.style.cssText = `position:absolute;left:${p[0]}%;top:${p[1]}%;width:5.5%;height:16%;margin-left:-2.75%;background:linear-gradient(180deg,rgba(150,210,245,.85),rgba(150,210,245,0));clip-path:polygon(45% 0,55% 0,100% 100%,0 100%);opacity:0;transition:opacity .25s`;
      fx.appendChild(s); requestAnimationFrame(() => (s.style.opacity = 1)); setTimeout(() => { s.style.opacity = 0; setTimeout(() => s.remove(), 300); }, 900);
    });
  }
  function led(fx, on) {
    $$('.ledglow', fx).forEach((x) => x.remove());
    if (!on) return;
    POS.leds.forEach((p) => {
      const s = document.createElement('span'); s.className = 'ledglow';
      s.style.cssText = `position:absolute;left:${p[0]}%;top:${p[1]}%;width:${p[2]}%;height:22%;background:linear-gradient(180deg,rgba(255,120,220,.55),rgba(255,140,230,0));filter:blur(2px)`;
      fx.appendChild(s);
    });
  }
  function vent(fx) {
    const f = document.createElement('span');
    f.style.cssText = `position:absolute;left:${POS.fan[0]}%;top:${POS.fan[1]}%;width:6%;aspect-ratio:1;margin:-3% 0 0 -3%;border-radius:50%;border:4px dashed rgba(255,255,255,.95);animation:spin .6s linear infinite`;
    const w = document.createElement('span');
    w.style.cssText = `position:absolute;left:${POS.roof[0]}%;top:${POS.roof[1]}%;width:13%;height:12%;margin:-6% 0 0 -6.5%;border-radius:8px;box-shadow:0 0 0 4px rgba(120,200,255,.9),0 0 22px rgba(120,200,255,.9)`;
    fx.appendChild(f); fx.appendChild(w); setTimeout(() => { f.remove(); w.remove(); }, 1300);
  }

  function career(view) {
    const S = C.S, st = S.smart, box = $('#career', view);
    box.innerHTML = `<div class="panel" style="margin-top:16px"><span class="tape green">진로 카드 · 똑똑한 농장을 만드는 사람</span>
      <div class="job" style="margin-top:12px">
        <img src="assets/bomi_good.webp" alt="엄지를 든 봄이" style="width:140px">
        <div><h2>${esc(SM.job.name)}</h2>
          <div class="grid2 even" style="margin-top:6px">
            <div><b>하는 일</b><ul style="margin:4px 0 0;padding-left:20px">${SM.job.does.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
            <div><b>필요한 힘</b><ul style="margin:4px 0 0;padding-left:20px">${SM.job.needs.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
          </div></div>
      </div>
      <form id="dream" class="field" style="margin-top:14px">
        <label for="dreamtxt">나의 꿈 카드: 스마트 팜에서 무엇을 기르고 싶나요? 그 생물이 잘 자라려면 무엇이 필요할까요?</label>
        <textarea class="input" id="dreamtxt" maxlength="160" placeholder="예) 딸기를 기르고 싶어요. 물과 햇빛, 알맞은 온도를 센서로 맞춰 줄 거예요.">${esc(st.dream || '')}</textarea>
        <div class="next-row"><button class="btn primary" type="submit">꿈 카드 저장하기</button></div>
      </form></div>`;
    $('#dream', box).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#dreamtxt', box).value.trim();
      if (v.length < 5) { sfx('no'); shake($('#dreamtxt', box)); return; }
      st.dream = v; C.save(); sfx('ok');
      if (!S.stamps.smart) F.stamp('smart', '스마트 농부'); else C.stampFX('저장 완료');
      box.querySelector('.next-row').innerHTML = '<button class="btn" data-go="notebook">농장 일지 보기</button><button class="btn primary" data-go="map">지도로 →</button>';
    });
  }
})();
