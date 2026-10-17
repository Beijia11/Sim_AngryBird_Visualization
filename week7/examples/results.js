// Week 7, Part A. Each <div class="test" data-test="tN"> gets a score grid (rows = agents,
// columns = the 9 hidden input scripts) and a side-by-side player. Data: w7_data.js (build_week7.py).
(() => {
  const ROWS = [
    { key: 'opus', name: 'Opus 5.5', sub: 'Claude Code · video' },
    { key: 'astra', name: 'astra', sub: 'GPT-6 Codex · video' },
    { key: 'opus_text', name: 'Opus 5.5', sub: 'text instead of video', cls: 'ctrl' },
    { key: 'astra_text', name: 'astra', sub: 'text instead of video', cls: 'ctrl' },
    { key: 'lower', name: 'A alone', sub: 'no transplant', cls: 'lower' },
  ];
  const COL_NAMES = { gt: 'GT', opus: 'Opus 5.5', astra: 'astra', opus_text: 'Opus · text', astra_text: 'astra · text' };
  const EVENTS_LABEL = { t1: 'dialogue flow', t2: 'launches', t3: 'event counts', t4: 'event counts' };

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const frac = (a, b) => `<b>${a}</b>/${b}`;

  function build(root) {
    const t = root.dataset.test, D = window.W7[t];
    const rows = ROWS.filter(r => D.summary[r.key]);
    const wrap = el('div', 'score-wrap');
    const table = el('table', 'score');
    const head = el('tr');
    head.append(el('th', '', 'hidden input'));
    D.cases.forEach((c, i) => {
      const th = el('th', 'case');
      th.dataset.i = i;
      th.innerHTML = `<button type="button" title="${c.id}">${c.id.split('_')[0]}<small>${c.label}</small></button>`;
      head.append(th);
    });
    for (const h of ['exact', EVENTS_LABEL[t], 'pos. error', 'time', 'code']) head.append(el('th', h === 'exact' ? 'sep' : '', h));
    const thead = el('thead'); thead.append(head); table.append(thead);

    const tbody = el('tbody');
    for (const r of rows) {
      const S = D.summary[r.key], R = D.runs[r.key];
      const tr = el('tr', r.cls || '');
      tr.append(el('th', 'row', `${r.name}<small>${r.sub}</small>`));
      D.cases.forEach((c, i) => {
        const ok = c.pass[r.key];
        const td = el('td', 'case', `<span class="dot ${ok ? 'y' : 'n'}" aria-label="${ok ? 'exact' : 'differs'}">${ok ? '✓' : '✕'}</span>`);
        td.dataset.i = i;
        tr.append(td);
      });
      const ev = S.flow != null ? S.flow : S.counts;
      tr.append(el('td', 'num sep', frac(S.exact, S.cases)));
      tr.append(el('td', 'num', frac(ev, S.cases)));
      tr.append(el('td', 'num', S.pos_err == null ? '·' : `${S.pos_err.toFixed(S.pos_err < 10 ? 2 : 0)} px`));
      tr.append(el('td', 'num', R ? `${R.minutes} min` : '·'));
      tr.append(el('td', 'num', R ? `+${R.added} / −${R.removed}` : '·'));
      tbody.append(tr);
    }
    table.append(tbody);
    wrap.append(table);

    const player = el('div', 'player');
    const cols = el('div', 'cols');
    cols.style.gridTemplateColumns = `repeat(${D.cols.length}, 1fr)`;
    D.cols.forEach(n => cols.append(el('span', n === 'gt' ? 'gt' : '', COL_NAMES[n])));
    const video = el('video');
    Object.assign(video, { controls: true, muted: true, loop: true, playsInline: true, preload: 'none' });
    const cap = el('div', 'cap');
    player.append(cols, video, cap);

    const slot = root.querySelector('.score-slot');
    slot.replaceWith(wrap, player);

    const pick = (i, play) => {
      const c = D.cases[i];
      table.querySelectorAll('.case').forEach(x => x.classList.toggle('on', +x.dataset.i === i));
      video.poster = `examples/media/${t}/${c.id}.jpg`;
      video.src = `examples/media/${t}/${c.id}.mp4`;
      cap.textContent = `${c.id.split('_')[0]}: ${c.label}. Same key presses replayed on every program, ${D.cols.length} programs side by side.`;
      if (play) video.play().catch(() => {});
    };
    table.addEventListener('click', e => {
      const cell = e.target.closest('.case');
      if (cell) pick(+cell.dataset.i, true);
    });
    pick(+(root.dataset.start || 0), false);
  }

  document.querySelectorAll('.test[data-test]').forEach(build);
})();
