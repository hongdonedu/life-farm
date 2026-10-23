/* 꼬물꼬물 한살이 농장 — 공통 도구 (상태 저장, 소리, 화면 도우미, 끌어 놓기) */
(function () {
  const F = window.FARM;
  const KEY = 'lifefarm.v1';

  /* ───── 상태 ───── */
  const fresh = () => ({
    v: 1, name: '', teacher: false, started: false,
    stamps: {},                       // zoneId: true
    bf: { setup: 0, safety: false, day: 0, idx: -1, tasksDone: {}, journal: {}, quiz: {}, portfolio: null, released: false, molts: 0 },
    seed: { step: 0, exp1: null, exp2: null, myth: null, apply: null },
    garden: { runs: {}, myth: null, rescued: false },
    museum: { animals: {}, cycles: {}, compare: {}, plants: {}, seasonSeen: false, myth: null },
    expo: { posters: [] },
    smart: { rules: {}, runs: 0, ok: false, dream: '' },
    quiz: { best: null, last: null },
    log: []
  });
  let S = fresh();
  let memoryOnly = false;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const o = JSON.parse(raw); if (o && o.v === 1) S = Object.assign(fresh(), o); }
    } catch (e) { memoryOnly = true; }
  }
  function save() {
    if (memoryOnly) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { memoryOnly = true; }
  }
  function reset() { S = fresh(); try { localStorage.removeItem(KEY); } catch (e) {} }
  load();

  /* ───── 소리 (WebAudio로 즉석 합성, 파일 없음) ───── */
  let ac = null, muted = false;
  try { muted = localStorage.getItem(KEY + '.mute') === '1'; } catch (e) {}
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, t0, dur, type, vol, glide) {
    const a = ctx(); if (!a || muted) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, a.currentTime + t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, a.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, a.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, a.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
    o.connect(g); g.connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
  }
  const SFX = {
    tap: () => tone(660, 0, 0.08, 'triangle', 0.08),
    pop: () => { tone(520, 0, 0.12, 'sine', 0.14, 900); },
    ok: () => { tone(784, 0, 0.14, 'triangle', 0.13); tone(1047, 0.09, 0.22, 'triangle', 0.12); },
    no: () => { tone(330, 0, 0.16, 'square', 0.05, 250); tone(262, 0.12, 0.2, 'square', 0.045, 200); },
    stamp: () => { tone(140, 0, 0.18, 'sine', 0.28, 70); tone(880, 0.05, 0.25, 'triangle', 0.07); },
    page: () => { tone(1200, 0, 0.05, 'sine', 0.04, 600); },
    day: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 'sine', 0.09)); },
    grow: () => { [392, 494, 587, 784].forEach((f, i) => tone(f, i * 0.07, 0.22, 'triangle', 0.08)); },
    fanfare: () => { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, i === 5 ? 0.6 : 0.2, 'triangle', 0.12)); },
    water: () => { for (let i = 0; i < 6; i++) tone(900 + Math.random() * 700, i * 0.05, 0.06, 'sine', 0.04); },
    wrong: () => SFX.no()
  };
  function sfx(name) { try { (SFX[name] || SFX.tap)(); } catch (e) {} }
  function setMuted(m) { muted = m; try { localStorage.setItem(KEY + '.mute', m ? '1' : '0'); } catch (e) {} }

  /* ───── 화면 도우미 ───── */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (arr, seed) => {
    const a = arr.slice(); let s = seed || Math.floor(Math.random() * 1e9);
    for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  // 스프라이트 시트의 한 칸을 원하는 크기(px)로 보여 주는 요소
  function sprite(sheet, i, size, cls, alt) {
    const sh = F.SHEETS[sheet];
    const col = i % sh.cols, row = Math.floor(i / sh.cols);
    const rows = Math.ceil(sh.n / sh.cols);
    const k = size / sh.cell;
    const style = `width:${size}px;height:${size}px;background-image:url(${sh.src});background-size:${sh.cols * sh.cell * k}px ${rows * sh.cell * k}px;background-position:${-col * sh.cell * k}px ${-row * sh.cell * k}px`;
    return `<span class="spr ${cls || ''}" role="img" aria-label="${esc(alt || '')}" style="${style}"></span>`;
  }
  // 크기를 CSS 변수(--s)로 주는 반응형 스프라이트 (컨테이너 폭에 맞춰 커지고 작아짐)
  function spriteFluid(sheet, i, cls, alt) {
    const sh = F.SHEETS[sheet];
    const col = i % sh.cols, row = Math.floor(i / sh.cols);
    const rows = Math.ceil(sh.n / sh.cols);
    const style = `background-image:url(${sh.src});background-size:${sh.cols * 100}% ${rows * 100}%;background-position:${sh.cols > 1 ? (col / (sh.cols - 1)) * 100 : 0}% ${rows > 1 ? (row / (rows - 1)) * 100 : 0}%`;
    return `<span class="sprf ${cls || ''}" role="img" aria-label="${esc(alt || '')}" style="${style}"></span>`;
  }
  const itemSpr = (k, size, cls) => sprite('items', F.ITEM[k], size, cls, (F.SETUP_ITEMS.find((x) => x.k === k) || {}).name || k);

  // 토스트
  let toastT = 0;
  function toast(msg, kind) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.className = 'toast show ' + (kind || '');
    clearTimeout(toastT); toastT = setTimeout(() => (t.className = 'toast'), 2600);
  }

  // 봄이 말풍선 (화면 안의 .talk 요소)
  const FACE = { smile: 'assets/bomi_smile.webp', wow: 'assets/bomi_wow.webp', good: 'assets/bomi_good.webp' };
  function talkHTML(text, face, extraCls) {
    return `<div class="talk ${extraCls || ''}"><img class="talk-face" src="${FACE[face || 'smile']}" alt="봄이"><div class="talk-bubble"><b class="talk-name">봄이</b><p class="talk-text">${text}</p></div></div>`;
  }
  function say(el, text, face) {
    if (!el) return;
    const tx = $('.talk-text', el), im = $('.talk-face', el);
    if (im && face) im.src = FACE[face];
    if (tx) { tx.innerHTML = text; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
  }

  // 모달
  let modalClose = null;
  function modal(html, opts) {
    opts = opts || {};
    const m = $('#modal'), box = $('#modal .sheet');
    box.className = 'sheet ' + (opts.cls || '');
    box.innerHTML = (opts.noClose ? '' : '<button class="x" data-close aria-label="닫기">✕</button>') + html;
    m.hidden = false; document.body.classList.add('modal-open');
    modalClose = opts.onClose || null;
    $$('[data-close]', box).forEach((b) => b.addEventListener('click', () => closeModal()));
    setTimeout(() => { const f = $('[autofocus]', box) || $('button:not(.x), input, textarea', box); if (f) f.focus({ preventScroll: true }); }, 30);
    return box;
  }
  function closeModal(silent) {
    const m = $('#modal'); if (m.hidden) return;
    m.hidden = true; document.body.classList.remove('modal-open');
    const cb = modalClose; modalClose = null;
    if (cb && !silent) cb();
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden && $('#modal .x')) closeModal(); });

  // 도장(스탬프) 연출
  function stampFX(label) {
    sfx('stamp');
    const d = document.createElement('div');
    d.className = 'stamp-fx'; d.innerHTML = `<span>${esc(label || '참 잘했어요')}</span>`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1600);
  }
  function confetti(n) {
    const box = document.createElement('div'); box.className = 'confetti';
    const colors = ['#f7d05e', '#7cc27a', '#9fd3ea', '#f29bb0', '#fff7d6'];
    for (let i = 0; i < (n || 40); i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%'; p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + 's'; p.style.animationDuration = 1.4 + Math.random() * 1.2 + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3000);
  }

  /* ───── 끌어 놓기 + 누르기 선택(터치·마우스 모두) ─────
     opts: items(선택자), targets(선택자), onDrop(itemEl, targetEl) → true면 성공 */
  function dnd(root, opts) {
    let picked = null, drag = null;
    const items = () => $$(opts.items, root), targets = () => $$(opts.targets, root);
    function select(el) {
      items().forEach((x) => x.classList.toggle('picked', x === el));
      picked = el; root.classList.toggle('picking', !!el);
      if (el && opts.onPick) opts.onPick(el);
    }
    function drop(itemEl, tgt) {
      select(null);
      if (!tgt) return;
      opts.onDrop(itemEl, tgt);
    }
    root.addEventListener('pointerdown', (e) => {
      const it = e.target.closest(opts.items);
      if (!it || !root.contains(it) || it.classList.contains('used')) return;
      e.preventDefault();
      const r = it.getBoundingClientRect();
      drag = { it, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, ghost: null, pid: e.pointerId };
      try { it.setPointerCapture(e.pointerId); } catch (er) {}
    });
    root.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const dist = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
      if (!drag.moved && dist > 8) {
        drag.moved = true;
        const g = drag.it.cloneNode(true); g.classList.add('drag-ghost'); g.classList.remove('picked');
        const r = drag.it.getBoundingClientRect(); g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
        document.body.appendChild(g); drag.ghost = g; drag.it.classList.add('lifting');
      }
      if (drag.moved) {
        drag.ghost.style.left = e.clientX - drag.dx + 'px'; drag.ghost.style.top = e.clientY - drag.dy + 'px';
        const over = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.matches && el.matches(opts.targets) && root.contains(el));
        targets().forEach((t) => t.classList.toggle('over', t === over));
      }
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      targets().forEach((t) => t.classList.remove('over'));
      if (d.ghost) d.ghost.remove();
      d.it.classList.remove('lifting');
      if (d.moved) {
        const over = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.matches && el.matches(opts.targets) && root.contains(el));
        drop(d.it, over || null);
      } else {
        sfx('tap');
        select(picked === d.it ? null : d.it);
      }
    }
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', (e) => { if (drag && drag.ghost) drag.ghost.remove(); if (drag) drag.it.classList.remove('lifting'); drag = null; });
    root.addEventListener('click', (e) => {
      const t = e.target.closest(opts.targets);
      if (t && root.contains(t) && picked) { const it = picked; drop(it, t); }
    });
    // 키보드: Enter/Space로 고르고, 목표에서 Enter
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const it = e.target.closest(opts.items), t = e.target.closest(opts.targets);
      if (it && root.contains(it)) { e.preventDefault(); select(picked === it ? null : it); }
      else if (t && root.contains(t) && picked) { e.preventDefault(); drop(picked, t); }
    });
    return { select, get picked() { return picked; } };
  }

  // 흔들기 / 반짝 효과
  function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function flash(el, cls) { if (!el) return; el.classList.remove(cls || 'glow'); void el.offsetWidth; el.classList.add(cls || 'glow'); }

  // 단계 표시줄
  function stepsHTML(labels, cur) {
    return `<ol class="steps">${labels.map((l, i) => `<li class="${i < cur ? 'done' : i === cur ? 'now' : ''}"><span>${i + 1}</span>${esc(l)}</li>`).join('')}</ol>`;
  }

  // 보기 섞기(정답은 데이터에서 첫 번째) → [{text, ok}]
  function choices(opts, seed) { return shuffle(opts.map((t, i) => ({ t, ok: i === 0 })), seed); }

  // 한국어 조사 붙이기: josa('토끼', '은/는') → '토끼는'
  function josa(word, pair) {
    const w = String(word), c = w.charCodeAt(w.length - 1);
    const [a, b] = pair.split('/');
    if (c < 0xAC00 || c > 0xD7A3) return w + b;
    const jong = (c - 0xAC00) % 28;
    if (pair === '으로/로') return w + (jong && jong !== 8 ? a : b);
    return w + (jong ? a : b);
  }
  const IS_ARTIFACT = !!document.documentElement.dataset.artifact;
  function today() { const d = new Date(); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`; }

  F.core = { get S() { return S; }, save, reset, load, sfx, setMuted, get muted() { return muted; }, $, $$, esc, wait, shuffle, sprite, spriteFluid, itemSpr,
    toast, talkHTML, say, modal, closeModal, stampFX, confetti, dnd, shake, flash, stepsHTML, choices, josa, IS_ARTIFACT, today, get memoryOnly() { return memoryOnly; } };
})();
