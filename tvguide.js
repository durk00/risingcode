// TV GUIDE (Nov 25, 2026, V101): instead of flipping through movies one at a time with ◀ ▶, tap
// ☰ TV GUIDE on the TV and the whole lineup comes up over the set, like the old cable listings
// channel: navy rows, white titles, a yellow ▶ on every row. Pick a channel along the top,
// scroll with a finger, tap a movie (anywhere on its row) and it starts tuning in. ✕ closes the
// guide without changing anything. What's on now is marked ON NOW. Uses the same lists as the
// TV (tv.js), so nothing extra is fetched.
(() => {
  const css = document.createElement('style');
  css.textContent = `
  .tvbody { position: relative; }
  .tvbody .guide { position: absolute; inset: -4px; z-index: 4; display: none; flex-direction: column; overflow: hidden;
    background: #0b1a56; border: 3px solid #ffd84a; border-radius: 14px; font-family: ui-monospace, Menlo, monospace; }
  .tvbody .guide.show { display: flex; }
  .tvbody .ghead { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #071140; border-bottom: 3px solid #ffd84a; flex-wrap: wrap; }
  .tvbody .glogo { color: #ffd84a; font: 900 22px ui-monospace, Menlo, monospace; letter-spacing: 0.12em; margin-right: 4px; }
  .tvbody .gtabs { flex: 1; display: flex; gap: 6px; flex-wrap: wrap; }
  .tvbody .gtabs button { min-height: 44px; padding: 0 12px; border-radius: 8px; border: 2px solid #8fa6ff; background: #13288a; color: #ffffff; font: 800 15px ui-monospace, Menlo, monospace; cursor: pointer; }
  .tvbody .gtabs button.on { background: #ffd84a; border-color: #ffd84a; color: #0b1020; }
  .tvbody .gx { width: 48px; height: 44px; border-radius: 8px; border: 2px solid #ffd84a; background: #071140; color: #ffd84a; font: 800 20px ui-monospace, Menlo, monospace; cursor: pointer; }
  .tvbody .glist { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; }
  .tvbody .grow { display: flex; align-items: center; gap: 14px; width: 100%; min-height: 66px; padding: 8px 14px 8px 10px; border: 0; border-bottom: 1px solid #071140;
    background: #13288a; color: #ffffff; text-align: left; cursor: pointer; font: 700 18px ui-monospace, Menlo, monospace; }
  .tvbody .grow:nth-child(even) { background: #0f2272; }
  .tvbody .grow.cur { box-shadow: inset 8px 0 0 #ffd84a; }
  .tvbody .gplay { flex: none; width: 50px; height: 50px; border-radius: 10px; background: #ffd84a; color: #0b1020; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .tvbody .gt { flex: 1; min-width: 0; }
  .tvbody .gt small { display: block; color: #b9c7ff; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; margin-top: 3px; }
  .tvbody .gnow { color: #ffd84a; }
  .tvbody .gy { flex: none; color: #ffd84a; font-size: 16px; }
  .tvbody .gmsg { color: #ffffff; text-align: center; padding: 30px 16px; font-weight: 700; letter-spacing: 0.1em; margin: 0; }
`;
  document.head.appendChild(css);
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let el = null, chId = null;

  function head() {
    return `<div class="ghead"><span class="glogo">TV GUIDE</span><div class="gtabs">${TV.channels().map(c =>
      `<button type="button" data-gch="${esc(c)}" class="${c === chId ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
      <button type="button" class="gx" aria-label="Close the guide">✕</button></div>`;
  }
  async function show(id) {
    chId = id;
    el.innerHTML = head() + '<div class="glist"><p class="gmsg">LOADING THE LINEUP…</p></div>';
    let list = null;
    try { list = await TV.movies(id); } catch (e) {}
    if (chId !== id) return;
    const now = TV.current();
    const rows = !list ? '<p class="gmsg">NO SIGNAL · CAN\'T REACH THE INTERNET ARCHIVE</p>'
      : !list.length ? '<p class="gmsg">NOTHING ON THIS CHANNEL RIGHT NOW</p>'
      : list.map((m, i) => {
          const cur = now.ch === id && now.id === m.id;
          return `<button type="button" class="grow${cur ? ' cur' : ''}" data-pick="${i}"><span class="gplay">▶</span>` +
            `<span class="gt">${esc(m.title)}<small>${cur ? '<span class="gnow">ON NOW · </span>' : ''}${esc(id)} · ${i + 1} OF ${list.length}</small></span>` +
            `<span class="gy">${esc(m.year || '')}</span></button>`;
        }).join('');
    el.querySelector('.glist').innerHTML = rows;
    const c = el.querySelector('.grow.cur'); if (c) c.scrollIntoView({ block: 'center' });
  }
  function open(root) {
    if (!el) {
      el = document.createElement('div'); el.className = 'guide'; root.appendChild(el);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const b = e.target.closest('button'); if (!b) return;
        if (b.classList.contains('gx')) return close();
        if (b.dataset.gch) return show(b.dataset.gch);
        if (b.dataset.pick !== undefined) { TV.choose(chId, +b.dataset.pick); close(); }
      });
    }
    el.classList.add('show');
    show(TV.current().ch);
  }
  function close() { if (el) el.classList.remove('show'); }
  window.TVGuide = { open, close, isOpen: () => !!el && el.classList.contains('show') };
})();
