// TV (Nov 24, 2026, V85): the other half of the set that comes up when you swipe up from the
// middle (radio.js). Tap TV at the top and the radio turns into a TV: real full-length movies,
// played right here, picked by channel and flipped through with ◀ ▶ like channel surfing.
//
// Where the movies come from: the Internet Archive (archive.org), free, no key, no bill, and it
// lets its films play inside other apps. They're mostly public-domain classics (films whose
// copyright ran out or was never renewed), so the channels are by decade, 30s to 70s (the 70s thin), plus
// old cartoons and old TV shows; newer movies are still owned and aren't there. Most-watched
// first. Lists kept on the device for 6 hours; a new order each day (V102).
//
// Picking a channel or a movie quiets the radio, so the two never play over each other. Tap ▶ on
// the picture to start it (the iPad won't start a movie with sound by itself). FULL SCREEN fills
// the iPad or Chromebook. ⏻ turns the TV off. Minimizing the set leaves the movie going.
(() => {
  const KEY = 'risingcode_tv';
  const CHANNELS = [
    { id: '30s', q: 'collection:feature_films AND year:[1930 TO 1939]' },
    { id: '40s', q: 'collection:feature_films AND year:[1940 TO 1949]' },
    { id: '50s', q: 'collection:feature_films AND year:[1950 TO 1959]' },
    { id: '60s', q: 'collection:feature_films AND year:[1960 TO 1969]' },
    { id: '70s', q: 'collection:feature_films AND year:[1970 TO 1979]' },   // V87: thin (a few 70s films slipped into the public domain), but real
    { id: 'CARTOONS', q: 'collection:classic_cartoons', wide: true },
    { id: 'OLD TV', q: 'collection:classic_tv', wide: true },
  ];
  // YOUTUBE goes straight to YouTube's free-with-ads movies (the address William found, V88).
  const PER = 30;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  saved.idx = saved.idx || {}; saved.lists = saved.lists || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };

  // V102: the lineup is refreshed every 6 hours (it was once a day), so added or removed films
  // show up the same day. And so the guide doesn't open on the same title at number 1 every
  // day, it takes the 60 most-watched on the channel and deals out 30 of them in a new order
  // each day: the same order all day long, a different one tomorrow.
  const POOL = 60, FRESH = 6 * 3600e3;
  function shuffleForToday(raw, chId) {
    let h = 2166136261;
    for (const c of new Date().toDateString() + '|' + chId) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
    const a = raw.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, PER);
  }
  const dealt = {};                                // today's order per channel, kept so it never reshuffles mid-day
  async function movies(ch) {
    const raw = await pool(ch), key = new Date().toDateString() + '|' + raw.length + '|' + (raw[0] && raw[0].id);
    if (!dealt[ch.id] || dealt[ch.id].key !== key) dealt[ch.id] = { key, list: shuffleForToday(raw, ch.id) };
    return dealt[ch.id].list;
  }
  async function pool(ch) {
    const c = saved.lists[ch.id];
    if (c && Date.now() - c.at < FRESH && c.list.length) return c.list;
    try {
      const q = `(${ch.q}) AND mediatype:movies AND -title:(trailer)`;
      const url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
        '&fl[]=identifier&fl[]=title&fl[]=year&sort[]=downloads+desc&rows=' + (POOL + 15) + '&output=json';
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 10000);
      const r = await fetch(url, { signal: ctl.signal }); clearTimeout(timer);
      if (!r.ok) throw new Error('archive ' + r.status);
      const docs = ((await r.json()).response || {}).docs || [];
      const seen = new Set(), list = [];
      for (const d of docs) {
        const title = String(Array.isArray(d.title) ? d.title[0] : d.title || '').trim();
        if (!d.identifier || !title || seen.has(title.toLowerCase())) continue;
        seen.add(title.toLowerCase());
        list.push({ id: d.identifier, title: title.slice(0, 60), year: String(d.year || '').slice(0, 4) });
        if (list.length >= POOL) break;
      }
      if (list.length) { saved.lists[ch.id] = { at: Date.now(), list }; save(); }
      return list;
    } catch (e) {
      if (c && c.list.length) return c.list;     // offline or the Archive is down: yesterday's lineup beats NO SIGNAL
      throw e;
    }
  }

  const css = document.createElement('style');
  css.textContent = `
  .tvbody .screen { position: relative; width: 100%; aspect-ratio: 16 / 9; max-height: max(180px, calc(100vh - 500px)); background: #050607; border-radius: 14px; overflow: hidden;
    border: 6px solid #0d0f12; box-shadow: inset 0 0 40px rgba(0,0,0,0.9), 0 0 0 2px #3a3f47; }
  .tvbody .screen iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #000; }
  .tvbody .screen canvas { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; background: transparent; }
  .tvbody .screen .msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px;
    color: #b98a46; font: 700 16px ui-monospace, Menlo, monospace; letter-spacing: 0.12em; }
  .tvbody .screen .pic { position: absolute; inset: 0; }
  .tvbody .screen:fullscreen { border: 0; border-radius: 0; width: 100vw; height: 100vh; aspect-ratio: auto; }
  .tvbody .screen:-webkit-full-screen { border: 0; border-radius: 0; width: 100vw; height: 100vh; aspect-ratio: auto; }
  /* V86: in full screen, a shrink button (arrows pointing in), top right, back to the TV set. */
  .tvbody .shrink { display: none; position: absolute; top: calc(14px + env(safe-area-inset-top, 0px)); right: 14px; width: 60px; height: 60px; z-index: 2;
    border-radius: 12px; border: 2px solid #ffb84a; background: rgba(20,24,30,0.72); cursor: pointer; align-items: center; justify-content: center; padding: 0; }
  .tvbody .screen:fullscreen .shrink { display: flex; }
  .tvbody .screen:-webkit-full-screen .shrink { display: flex; }
  .tvbody .screen.big { position: fixed; inset: 0; z-index: 5; width: 100vw; height: 100vh; max-height: none; aspect-ratio: auto; border: 0; border-radius: 0; box-shadow: none; }
  .tvbody .screen.big .shrink { display: flex; }
  .tvbody .titlerow { display: flex; align-items: center; gap: 12px; margin: 10px 2px; }
  .tvbody .title { flex: 1; min-width: 0; min-height: 44px; }
  .tvbody .title .name { font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 8px rgba(255,184,74,0.45); }
  .tvbody .title .sub { font-size: 12px; color: #b98a46; margin-top: 3px; letter-spacing: 0.1em; text-transform: uppercase; }
  .tvbody .full { flex: none; height: 52px; padding: 0 16px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a;
    font: 800 15px ui-monospace, Menlo, monospace; letter-spacing: 0.08em; cursor: pointer; }
  /* V87: newer movies live on the free-with-ads services; these open them (their app if it's installed). */
  .tvbody .out { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .tvbody .out span { flex: 1 0 100%; text-align: center; color: #b98a46; font-size: 12px; letter-spacing: 0.1em; }
  .tvbody .out a { flex: 1 0 90px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 2px solid #ffb84a;
    background: #1e2a37; color: #ffb84a; font: 800 17px ui-monospace, Menlo, monospace; letter-spacing: 0.08em; text-decoration: none; }
`;
  document.head.appendChild(css);

  let root = null, opts = {}, ch = CHANNELS.find(c => c.id === saved.ch) || CHANNELS[1], list = [], idx = 0, on = false, loading = false, err = false, staticTimer = null;
  const $ = (s) => root.querySelector(s);
  const scr = () => $('.screen .pic');

  function channelsHtml() {
    return CHANNELS.map(c => `<button type="button" data-ch="${c.id}" class="${c.id === ch.id ? 'on' : ''}${c.wide ? ' wide' : ''}">${c.id}</button>`).join('') +
      '';
  }
  function title(name, sub) { $('.title .name').textContent = name; $('.title .sub').innerHTML = sub || '&nbsp;'; }
  function screenMsg(text) { clearInterval(staticTimer); scr().innerHTML = text ? `<div class="msg">${text}</div>` : ''; }
  function render() {
    root.querySelector('.bands').innerHTML = channelsHtml();
    if (!on) { screenMsg(''); return title('TV OFF', 'PICK A CHANNEL OR TAP ⏻'); }
    if (loading) { return title('TUNING ' + ch.id + '…', 'FINDING MOVIES'); }
    if (err) { screenMsg('NO SIGNAL'); return title('NO SIGNAL', 'CAN\'T REACH THE INTERNET ARCHIVE · CHECK WI-FI'); }
    if (!list.length) { screenMsg('NOTHING ON THIS CHANNEL'); return title('NOTHING ON', ch.id); }
    const m = list[idx];
    title(m.title, `${ch.id} · ${idx + 1} OF ${list.length}${m.year ? ' · ' + m.year : ''} · TAP ▶ ON THE PICTURE`);
  }
  // A moment of snow between channels, drawn here, no sound.
  function snow(then) {
    clearInterval(staticTimer);
    const s = scr(); s.innerHTML = '<canvas></canvas>';
    const cv = s.querySelector('canvas'), w = 160, h = 90; cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), img = c.createImageData(w, h); let n = 0;
    staticTimer = setInterval(() => {
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 200; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      c.putImageData(img, 0, 0);
      if (++n > 10) { clearInterval(staticTimer); then(); }
    }, 40);
  }
  function play() {
    if (!on || !list.length) return render();
    const m = list[idx]; saved.idx[ch.id] = idx; save(); render();
    snow(() => {
      if (!on || list[idx] !== m) return;
      scr().innerHTML = `<iframe src="https://archive.org/embed/${encodeURIComponent(m.id)}" allow="autoplay; fullscreen" allowfullscreen title="${m.title.replace(/"/g, '')}"></iframe>`;
    });
  }
  async function pick(id) {
    ch = CHANNELS.find(c => c.id === id) || ch; saved.ch = ch.id; save();
    on = true; if (opts.quietRadio) opts.quietRadio(); if (opts.lit) opts.lit();
    loading = true; err = false; list = []; render(); snow(() => {});
    try { list = await movies(ch); } catch (e) { err = true; }
    if (ch.id !== id) return;
    loading = false; idx = Math.min(saved.idx[ch.id] || 0, Math.max(0, list.length - 1));
    play();
  }
  // V101: for the TV GUIDE (tvguide.js): tune straight to one movie on one channel.
  async function choose(id, i) {
    ch = CHANNELS.find(c => c.id === id) || ch; saved.ch = ch.id; save();
    on = true; if (opts.quietRadio) opts.quietRadio(); if (opts.lit) opts.lit();
    loading = true; err = false; render();
    try { list = await movies(ch); } catch (e) { err = true; list = []; }
    if (ch.id !== id) return;
    loading = false; idx = Math.max(0, Math.min(i, list.length - 1));
    play();
  }
  function step(dir) {
    if (!list.length) return on ? null : pick(ch.id);
    if (opts.quietRadio) opts.quietRadio();
    idx = (idx + dir + list.length) % list.length; play();
  }
  // V92: the iPad (as a home-screen app, and older iPads in Safari) won't let a page put one
  // part of itself full screen; the Chromebook will. So when the real full screen doesn't
  // happen, the picture is simply stretched over the whole screen instead, which on a
  // home-screen app looks the same: nothing else showing, the shrink button top right.
  const realFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function full() {
    const s = $('.screen'), go = s.requestFullscreen || s.webkitRequestFullscreen;
    let p = null;
    try { if (go) p = go.call(s); } catch (e) {}
    const fallback = () => { if (!realFull()) s.classList.add('big'); };
    if (p && p.then) p.then(() => setTimeout(fallback, 150), fallback); else setTimeout(fallback, 300);
  }
  function shrink() {
    const s = $('.screen');
    if (s.classList.contains('big')) { s.classList.remove('big'); return; }
    try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
  }
  function power() {
    if (on) { on = false; screenMsg(''); render(); } else pick(ch.id);
    return on;
  }

  function mount(el, o) {
    root = el; opts = o || {};
    root.innerHTML = `<div class="screen"><div class="pic"></div><button type="button" class="shrink" aria-label="Back to the TV"><svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#ffb84a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v8H4M20 4v8h8M12 28v-8H4M20 28v-8h8"/></svg></button></div><div class="titlerow"><div class="title"><div class="name">TV OFF</div><div class="sub">&nbsp;</div></div><button type="button" class="full" data-guide="1">☰ TV GUIDE</button><button type="button" class="full" data-full="1">⛶ FULL SCREEN</button></div>
      <div class="row"><button type="button" class="step" data-tvstep="-1" aria-label="Previous movie">◀</button><div class="bands"></div><button type="button" class="step" data-tvstep="1" aria-label="Next movie">▶</button></div>
      <div class="out"><span>NEWER MOVIES, FREE WITH ADS · OPENS THEIR APP OR SITE</span>
        <a href="https://tubitv.com/" target="_blank" rel="noopener">TUBI</a><a href="https://pluto.tv/on-demand" target="_blank" rel="noopener">PLUTO TV</a><a href="https://www.youtube.com/feed/storefront?bp=ogUCKAY%3D" target="_blank" rel="noopener">YOUTUBE</a></div>
      <div class="hint">☰ TV GUIDE OR ◀ ▶ PICKS THE MOVIE · SWIPE DOWN OR TAP THE BAR TO MINIMIZE</div>`;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ch) pick(b.dataset.ch);
      else if (b.dataset.tvstep) step(+b.dataset.tvstep);
      else if (b.dataset.full) full();
      else if (b.classList.contains('shrink')) shrink();
      else if (b.dataset.guide && window.TVGuide) TVGuide.open(root);
    });
    render();
  }
  window.TV = { mount, power, isOn: () => on, show: () => render(),
    channels: () => CHANNELS.map(c => c.id), movies: (id) => movies(CHANNELS.find(c => c.id === id) || ch), choose,
    current: () => ({ ch: ch.id, id: on && list[idx] ? list[idx].id : null }) };
})();
