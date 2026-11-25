// TV (Nov 24, 2026, V85): the other half of the set that comes up when you swipe up from the
// middle (radio.js). Tap TV at the top and the radio turns into a TV: real full-length movies,
// played right here, picked by channel and flipped through with ◀ ▶ like channel surfing.
//
// Where the movies come from: the Internet Archive (archive.org), free, no key, no bill, and it
// lets its films play inside other apps. They're mostly public-domain classics (films whose
// copyright ran out or was never renewed), so the channels are by decade, 30s to 60s, plus
// old cartoons and old TV shows; newer movies are still owned and aren't there. Most-watched
// first. Lists kept on the device for a day.
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
    { id: 'CARTOONS', q: 'collection:classic_cartoons', wide: true },
    { id: 'OLD TV', q: 'collection:classic_tv', wide: true },
  ];
  const PER = 30;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  saved.idx = saved.idx || {}; saved.lists = saved.lists || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };

  async function movies(ch) {
    const c = saved.lists[ch.id];
    if (c && Date.now() - c.at < 24 * 3600e3 && c.list.length) return c.list;
    const q = `(${ch.q}) AND mediatype:movies AND -title:(trailer)`;
    const url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
      '&fl[]=identifier&fl[]=title&fl[]=year&sort[]=downloads+desc&rows=' + (PER + 10) + '&output=json';
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
      if (list.length >= PER) break;
    }
    if (list.length) { saved.lists[ch.id] = { at: Date.now(), list }; save(); }
    return list;
  }

  const css = document.createElement('style');
  css.textContent = `
  .tvbody .screen { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #050607; border-radius: 14px; overflow: hidden;
    border: 6px solid #0d0f12; box-shadow: inset 0 0 40px rgba(0,0,0,0.9), 0 0 0 2px #3a3f47; }
  .tvbody .screen iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #000; }
  .tvbody .screen canvas { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; background: transparent; }
  .tvbody .screen .msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px;
    color: #b98a46; font: 700 16px ui-monospace, Menlo, monospace; letter-spacing: 0.12em; }
  .tvbody .screen:fullscreen, .tvbody .screen:-webkit-full-screen { border: 0; border-radius: 0; width: 100vw; height: 100vh; aspect-ratio: auto; }
  .tvbody .title { margin: 12px 2px 12px; min-height: 44px; }
  .tvbody .title .name { font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 8px rgba(255,184,74,0.45); }
  .tvbody .title .sub { font-size: 12px; color: #b98a46; margin-top: 3px; letter-spacing: 0.1em; text-transform: uppercase; }
  .tvbody .full { flex: 1 0 40%; }
`;
  document.head.appendChild(css);

  let root = null, opts = {}, ch = CHANNELS.find(c => c.id === saved.ch) || CHANNELS[1], list = [], idx = 0, on = false, loading = false, err = false, staticTimer = null;
  const $ = (s) => root.querySelector(s);
  const scr = () => $('.screen');

  function channelsHtml() {
    return CHANNELS.map(c => `<button type="button" data-ch="${c.id}" class="${c.id === ch.id ? 'on' : ''}${c.wide ? ' wide' : ''}">${c.id}</button>`).join('') +
      '<button type="button" class="full wide" data-full="1">⛶ FULL SCREEN</button>';
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
  function step(dir) {
    if (!list.length) return on ? null : pick(ch.id);
    if (opts.quietRadio) opts.quietRadio();
    idx = (idx + dir + list.length) % list.length; play();
  }
  function full() {
    const s = scr();
    try { (s.requestFullscreen || s.webkitRequestFullscreen).call(s); } catch (e) {}
  }
  function power() {
    if (on) { on = false; screenMsg(''); render(); } else pick(ch.id);
    return on;
  }

  function mount(el, o) {
    root = el; opts = o || {};
    root.innerHTML = `<div class="screen"></div><div class="title"><div class="name">TV OFF</div><div class="sub">&nbsp;</div></div>
      <div class="row"><button type="button" class="step" data-tvstep="-1" aria-label="Previous movie">◀</button><div class="bands"></div><button type="button" class="step" data-tvstep="1" aria-label="Next movie">▶</button></div>
      <div class="hint">◀ ▶ CHANGES THE MOVIE · SWIPE DOWN OR TAP THE BAR TO MINIMIZE</div>`;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ch) pick(b.dataset.ch);
      else if (b.dataset.tvstep) step(+b.dataset.tvstep);
      else if (b.dataset.full) full();
    });
    render();
  }
  window.TV = { mount, power, isOn: () => on, show: () => render() };
})();
