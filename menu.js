// MENU (Nov 24, 2026): swipe down on any scene to open it; swipe up or tap the ✕ to
// close. Nothing shows on the scenes themselves. A first version, to be designed
// further:
//   SOUND     which sound plays when the radar catches Santa (the same four as
//             tapping the Christmas display: toot, Jingle Bells, icicles, silent)
//   NIGHT CLOCK (V42) the hours the dim night clock covers the screen (nightclock.js)
//   AROUND PENNS VALLEY (V33) upcoming Penns Valley events, each with its source named
//             and linked. Only the YMCA of Centre County's Penns Valley calendar
//             (its public Events API, which a browser may read) works from this page; no
//             local news feed does (see README). Fetched when the menu opens, kept 15 min.
//   MY CORNER the personal wildcard: one thing picked for this household's own
//             interests (a poem of the day, a what-can-I-cook helper, ...). The
//             pick is remembered on this device; what each one shows is still to
//             be built.
// index.html opens and closes it and hands it the sound controls (Menu.connect).
(() => {
  const WILDCARDS = [
    { id: 'none', name: 'Off', note: 'SHOW NOTHING HERE' },   // V48: was "Nothing"; it's the off switch for My Corner
    { id: 'verses', name: 'Verses for the week', note: 'KING JAMES' },   // V47, verses.js
    { id: 'poem', name: 'Poem of the day', note: 'COMING' },
    { id: 'cook', name: 'What can I make?', note: 'COMING' },
  ];
  let wild = 'none';
  try { if (WILDCARDS.some(w => w.id === localStorage.getItem('risingcode_wildcard'))) wild = localStorage.getItem('risingcode_wildcard'); } catch (e) {}
  const EVENTS_URL = 'https://www.ymcaofcentrecounty.org/wp-json/tribe/events/v1/events?per_page=6&categories=penns-valley-events';
  const EVENTS_SOURCE = { name: 'YMCA of Centre County', url: 'https://www.ymcaofcentrecounty.org/events/category/penns-valley-events/' };
  let local = { state: 'idle', items: [], at: 0 };   // idle | loading | ok | error
  let sound = null;                              // { names, get(), set(i) } from index.html

  const css = `
  #menu { position: fixed; inset: 0; z-index: 10; background: rgba(8,12,18,0.97); color: #e8eef4;
    font: 500 16px/1.4 ui-monospace, Menlo, monospace; letter-spacing: 0.04em;
    transform: translateY(-100%); transition: transform 0.35s ease; overflow-y: auto;
    padding: calc(28px + env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 40px max(24px, env(safe-area-inset-left, 0px)); }
  #menu.open { transform: translateY(0); }
  #menu .wrap { max-width: 760px; margin: 0 auto; }
  #menu header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  #menu h1 { font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.08em; }
  #menu .x { background: none; border: 2px solid #93a4b4; color: #e8eef4; width: 44px; height: 44px; border-radius: 22px; font: 700 20px ui-monospace, monospace; cursor: pointer; }
  #menu h2 { font-size: 13px; color: #93a4b4; font-weight: 700; letter-spacing: 0.12em; margin: 28px 0 6px; }
  #menu .help { color: #93a4b4; font-size: 13px; margin: 0 0 12px; }
  #menu .opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
  #menu .opt { text-align: left; padding: 14px 16px; border-radius: 10px; background: #121a23; color: #e8eef4;
    border: 2px solid #243241; font: 600 16px ui-monospace, monospace; cursor: pointer; min-height: 56px; }
  /* The picked one stands out by brightness and a check mark, not by color alone. */
  #menu .opt.on { border-color: #ffffff; background: #1e2a37; }
  #menu .opt.on::before { content: "✓ "; }
  #menu .opt small { display: block; color: #93a4b4; font-size: 11px; margin-top: 4px; letter-spacing: 0.1em; }
  #menu .ev { display: block; padding: 12px 16px; margin-bottom: 8px; border-radius: 10px; background: #121a23; border: 2px solid #243241; color: #e8eef4; text-decoration: none; }
  #menu .ev b { display: block; font-weight: 700; }
  #menu .ev span { color: #93a4b4; font-size: 13px; }
  #menu .src { color: #93a4b4; font-size: 12px; letter-spacing: 0.08em; }
  #menu .src a { color: #e8eef4; }
  #menu .verse { margin-top: 14px; padding: 16px 18px; border-radius: 10px; background: #121a23; border: 2px solid #243241; }
  #menu .verse .vt { margin: 6px 0; font: 500 17px/1.55 Georgia, 'Times New Roman', serif; letter-spacing: 0.01em; }
  #menu .verse sup { color: #93a4b4; font-size: 11px; }
  #menu .verse .vref { margin: 10px 0 0; color: #e8eef4; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; }
  #menu footer { margin-top: 36px; color: #93a4b4; font-size: 12px; letter-spacing: 0.1em; }`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const el = document.createElement('div'); el.id = 'menu'; el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);


  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const decode = (t) => { const d = document.createElement('textarea'); d.innerHTML = String(t || ''); return d.value; };   // WordPress titles arrive as HTML entities
  const safeUrl = (u) => /^https:\/\//.test(u || '') ? u : EVENTS_SOURCE.url;
  function whenText(e) {
    const d = new Date((e.start_date || '').replace(' ', 'T'));            // the site's local time, shown as written
    if (isNaN(d)) return '';
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return e.all_day ? day : day + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  async function loadLocal() {
    if (local.state === 'loading' || (local.state === 'ok' && Date.now() - local.at < 15 * 60 * 1000)) return;
    local.state = 'loading'; render();
    try {
      const start = new Date().toISOString().slice(0, 10);
      const r = await fetch(EVENTS_URL + '&start_date=' + start);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      local = { state: 'ok', at: Date.now(), items: (j.events || []).map((e) => ({ title: decode(e.title), when: whenText(e), url: safeUrl(e.url), where: e.venue && e.venue.venue ? decode(e.venue.venue) : '' })) };
    } catch (err) { local = { state: 'error', items: [], at: 0 }; }
    if (open) render();
  }
  function localHtml() {
    const head = '<h2>AROUND PENNS VALLEY</h2>';
    const src = `<p class="src">Source: <a href="${EVENTS_SOURCE.url}" target="_blank" rel="noopener">${EVENTS_SOURCE.name}</a> events calendar. Local news isn't available here yet.</p>`;
    if (local.state === 'loading' || local.state === 'idle') return head + '<p class="help">Loading events…</p>' + src;
    if (local.state === 'error') return head + '<p class="help">Couldn’t load events right now. It will try again the next time the menu opens.</p>' + src;
    if (!local.items.length) return head + '<p class="help">No upcoming Penns Valley events are listed.</p>' + src;
    return head + local.items.map((e) => `<a class="ev" href="${esc(e.url)}" target="_blank" rel="noopener"><b>${esc(e.title)}</b><span>${esc(e.when)}${e.where ? ' · ' + esc(e.where) : ''}</span></a>`).join('') + src;
  }

  // VERSES (V47): the week's passage, shown right under My Corner when picked.
  let verse = { ref: '', state: 'idle', verses: [] };
  function versesHtml() {
    if (!window.Verses) return '';
    const v = Verses.today();
    if (verse.ref !== v.ref) {
      verse = { ref: v.ref, state: 'loading', verses: [] };
      Verses.text(v.ref).then(vs => { if (verse.ref === v.ref) { verse = { ref: v.ref, state: 'ok', verses: vs }; if (open) render(); } },
        () => { if (verse.ref === v.ref) { verse = { ref: v.ref, state: 'error', verses: [] }; if (open) render(); } });
    }
    const body = verse.state === 'ok' ? verse.verses.map(x => `<p class="vt"><sup>${esc(x.n)}</sup> ${esc(x.t)}</p>`).join('')
      : verse.state === 'error' ? '<p class="help">Couldn’t load the words right now; look it up by the reference below.</p>' : '<p class="help">Loading…</p>';
    return `<div class="verse"><p class="src">${esc(v.label)}</p>${body}<p class="vref">${esc(v.ref)} · KING JAMES VERSION</p></div>`;
  }
  function render() {
    const names = sound ? sound.names : [];
    const cur = sound ? sound.get() : -1;
    el.innerHTML = `<div class="wrap">
      <header><h1>MENU</h1><button class="x" aria-label="Close menu">✕</button></header>
      <h2>SOUND</h2>
      <p class="help">What plays on the Christmas display when the radar catches Santa.</p>
      <div class="opts">${names.map((n, i) => `<button class="opt${i === cur ? ' on' : ''}" data-sound="${i}">${n}</button>`).join('')}</div>
      ${window.NightClock ? `<h2>NIGHT CLOCK</h2>
      <p class="help">During these hours the screen becomes a big, dim clock. Tap it to wake the app for 5 minutes.</p>
      <div class="opts">${NightClock.options().map(o => `<button class="opt${o.id === NightClock.get() ? ' on' : ''}" data-night="${o.id}">${o.name}</button>`).join('')}</div>` : ''}
      ${localHtml()}
      <h2>MY CORNER</h2>
      <p class="help">One thing just for this household. Picked here, remembered on this device.</p>
      <div class="opts">${WILDCARDS.map(w => `<button class="opt${w.id === wild ? ' on' : ''}" data-wild="${w.id}">${w.name}${w.note ? `<small>${w.note}</small>` : ''}</button>`).join('')}</div>
      ${wild === 'verses' ? versesHtml() : ''}
      <footer>SWIPE UP OR TAP ✕ TO CLOSE</footer></div>`;
  }
  el.addEventListener('click', (e) => {
    e.stopPropagation();                         // menu taps never reach the scenes
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('x')) { Menu.close(); return; }
    if (b.dataset.sound !== undefined && sound) { sound.set(+b.dataset.sound); render(); }
    if (b.dataset.night && window.NightClock) { NightClock.set(b.dataset.night); render(); }
    if (b.dataset.wild) { wild = b.dataset.wild; try { localStorage.setItem('risingcode_wildcard', wild); } catch (e2) {} render(); }
  });

  let open = false;
  window.Menu = {
    connect(s) { sound = s; },
    isOpen: () => open,
    atBottom: () => el.scrollTop + el.clientHeight >= el.scrollHeight - 2,   // an upward drag can only be a close, not a scroll
    open() { open = true; render(); loadLocal(); el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); },
    close() { open = false; el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); },
    wildcard: () => wild,
    _setLocal(l) { local = l; render(); },          // test hook
  };
})();
