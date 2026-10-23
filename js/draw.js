/* 관찰 그림 그리기 판 — 마우스·손가락·펜 모두 사용 */
(function () {
  const F = window.FARM;
  const PENS = [
    { c: '#2d3a2c', n: '연필' }, { c: '#8a5a2b', n: '갈색' }, { c: '#f2c230', n: '노랑' },
    { c: '#9bd36a', n: '연두' }, { c: '#3e8a57', n: '초록' }, { c: '#e46b5b', n: '빨강' }, { c: '#6fa8d6', n: '하늘' }
  ];
  F.DrawPad = function (host, opts) {
    opts = opts || {};
    host.innerHTML = `
      <div class="drawpad">
        <canvas width="640" height="480" aria-label="그림 그리기 칸"></canvas>
        <div class="pens">
          ${PENS.map((p, i) => `<button type="button" data-pen="${i}" title="${p.n}" aria-label="${p.n} 색" style="background:${p.c}" class="${i === 0 ? 'on' : ''}"></button>`).join('')}
          <button type="button" class="er" data-size>굵게</button>
          <button type="button" class="er" data-eraser>지우개</button>
          <button type="button" class="er" data-undo>되돌리기</button>
          <button type="button" class="er" data-clear>모두 지우기</button>
        </div>
      </div>`;
    const cv = host.querySelector('canvas'), g = cv.getContext('2d');
    let pen = PENS[0].c, width = 4, eraser = false, drawing = false, last = null, dirty = false;
    const hist = [];
    function blank() { g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); }
    blank();
    if (opts.value) { const im = new Image(); im.onload = () => { g.drawImage(im, 0, 0, cv.width, cv.height); dirty = true; }; im.src = opts.value; }
    function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; }
    function line(a, b, pr) {
      g.strokeStyle = eraser ? '#fff' : pen; g.lineCap = 'round'; g.lineJoin = 'round';
      g.lineWidth = (eraser ? 22 : width) * (pr ? 0.6 + pr * 0.8 : 1);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      hist.push(g.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 20) hist.shift();
      drawing = true; last = pos(e); line(last, { x: last.x + 0.1, y: last.y + 0.1 }, e.pressure); dirty = true;
    });
    cv.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pos(e); line(last, p, e.pointerType === 'pen' ? e.pressure : 0); last = p; });
    const stop = () => { drawing = false; last = null; if (opts.onChange) opts.onChange(); };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
    host.querySelectorAll('[data-pen]').forEach((b) => b.addEventListener('click', () => {
      pen = PENS[+b.dataset.pen].c; eraser = false;
      host.querySelectorAll('[data-pen]').forEach((x) => x.classList.toggle('on', x === b));
      host.querySelector('[data-eraser]').classList.remove('on');
    }));
    host.querySelector('[data-size]').addEventListener('click', (e) => { width = width === 4 ? 9 : 4; e.target.textContent = width === 4 ? '굵게' : '가늘게'; });
    host.querySelector('[data-eraser]').addEventListener('click', (e) => { eraser = !eraser; e.target.classList.toggle('on', eraser); });
    host.querySelector('[data-undo]').addEventListener('click', () => { const h = hist.pop(); if (h) g.putImageData(h, 0, 0); });
    host.querySelector('[data-clear]').addEventListener('click', () => { hist.push(g.getImageData(0, 0, cv.width, cv.height)); blank(); dirty = false; });
    return {
      get dirty() { return dirty; },
      data() {
        // 저장용으로 작게 줄여 JPEG로
        const s = document.createElement('canvas'); s.width = 320; s.height = 240;
        s.getContext('2d').drawImage(cv, 0, 0, 320, 240);
        try { return s.toDataURL('image/jpeg', 0.82); } catch (e) { return ''; }
      }
    };
  };
})();
