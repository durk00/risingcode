// RADIO (Nov 24, 2026, V80): swipe up from the middle of any scene and a radio comes up.
// No genres, the way people really listen to the radio: pick a decade (70s, 80s, 90s, 00s,
// 10s, 20s) and the dial only tunes stations playing that decade's music. From mid-November
// to Epiphany (Jan 6) a seventh button, XMAS, tunes Christmas stations.
//
// Where the music comes from: real internet radio stations' own public streams, found through
// Radio Browser (radio-browser.info), a free community directory of stations with no key and
// no bill. The station holds the broadcast license; this just plays its stream, like any
// radio app. Only streams an iPad can play over https (MP3, AAC, HLS) and that passed the
// directory's last check are used, most-liked first, English-speaking countries first.
// Station lists are kept for 12 hours on the iPad.
//
// The dial: drag the needle (or tap ◀ ▶). Between stations there's a soft, warm hiss made on
// the iPad itself (filtered noise, kept quiet, never a loud burst); let go and it settles on
// the nearest station and plays. If a stream is dead it says NO SIGNAL; turn the dial.
// Minimizing the radio (swipe down, or the minimize bar, V82) leaves it playing over the scenes; ⏻ turns it off.
(() => {
  const KEY = 'risingcode_radio';
  const MIRRORS = ['de1', 'de2', 'fi1', 'nl1', 'at1'].map(s => `https://${s}.api.radio-browser.info`).concat('https://all.api.radio-browser.info');
  const BANDS = [
    { id: '70s', tags: ['70s'] },
    { id: '80s', tags: ['80s'] },
    { id: '90s', tags: ['90s'] },
    { id: '00s', tags: ['2000s', '00s'] },
    { id: '10s', tags: ['2010s', '10s'] },
    { id: '20s', tags: ['2020s', 'top 40'] },
    { id: 'XMAS', tags: ['christmas'], season: true, wide: true },
    { id: 'TALK', label: 'NEWS/TALK', talk: true, wide: true }   // V84: labeled NEWS/TALK, since it's both,
  ];
  const ENGLISH = ['US', 'GB', 'CA', 'IE', 'AU', 'NZ'];
  const PER_BAND = 14;
  const inSeason = (d = new Date()) => { const m = d.getMonth(), day = d.getDate(); return (m === 10 && day >= 15) || m === 11 || (m === 0 && day <= 6); };
  const label = (b) => b.label || b.id;
  const bands = () => BANDS.filter(b => !b.season || inSeason());

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
  saved.pos = saved.pos || {}; saved.lists = saved.lists || {};

  // ---- station lists ----------------------------------------------------------------
  async function get(path) {
    for (const m of MIRRORS) {
      try {
        const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 7000);
        const r = await fetch(m + path, { signal: ctl.signal }); clearTimeout(timer);
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    throw new Error('directory unreachable');
  }
  const playable = (s) => s && s.lastcheckok === 1 && /^https:/.test(s.url_resolved || '') &&
    (s.hls === 1 || /^(MP3|AAC|AAC\+)$/i.test(s.codec || ''));
  // V83: TALK, local news and talk first. The stations in the iPad's own state (from Menu →
  // LOCATION, Happy Valley by default), nearest first where the directory knows where a station is,
  // so around Happy Valley that means the State College stations before Pittsburgh or Philadelphia.
  // Then, at the end of the dial, the national pair, one from each side, Fox News and MSNBC
  // (or Newsmax and CNN if those aren't in the directory). The pair only goes on together, so the
  // dial never has one side without the other.
  const STATES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  const miles = (a, b, c, d) => { const R = Math.PI / 180, x = (d - b) * R * Math.cos((a + c) / 2 * R), y = (c - a) * R; return 3959 * Math.sqrt(x * x + y * y); };
  const station = (s, where) => ({ name: s.name.trim().replace(/\s+/g, ' ').slice(0, 48), url: s.url_resolved, cc: s.countrycode || '', kbps: s.bitrate || 0, id: s.stationuuid, where });
  async function talkStations() {
    const P = window.Place, st = (P && P.state) || 'PA', lat = P ? P.lat : 40.85, lon = P ? P.lon : -77.69;
    const key = 'TALK-' + st, c = saved.lists[key];
    if (c && Date.now() - c.at < 12 * 3600e3 && c.list.length) return c.list;
    const seen = new Set(), local = [];
    let reached = false;
    for (const tag of ['news', 'talk', 'news talk']) {
      let rows = [];
      try { rows = await get(`/json/stations/search?countrycode=US&state=${encodeURIComponent(STATES[st] || st)}&tag=${encodeURIComponent(tag)}&tagExact=true&order=votes&reverse=true&hidebroken=true&is_https=true&limit=200`); reached = true; } catch (e) { continue; }
      for (const s of rows.filter(playable)) {
        const k = (s.name || '').trim().toLowerCase();
        if (!k || seen.has(k) || seen.has(s.url_resolved)) continue;
        seen.add(k); seen.add(s.url_resolved);
        const d = isFinite(s.geo_lat) && isFinite(s.geo_long) && (s.geo_lat || s.geo_long) ? miles(lat, lon, +s.geo_lat, +s.geo_long) : null;
        local.push({ s, d });
      }
    }
    if (!reached) throw new Error('directory unreachable');
    local.sort((a, b) => (a.d === null) - (b.d === null) || (a.d !== null ? a.d - b.d : 0) || (b.s.votes - a.s.votes));
    const pick = local.slice(0, PER_BAND - 2).map(({ s, d }) => station(s, d !== null && d < 60 ? 'LOCAL · ' + st : (STATES[st] || st).toUpperCase()));
    const side = async (names) => {
      for (const n of names) {
        try {
          const rows = (await get(`/json/stations/search?name=${encodeURIComponent(n)}&countrycode=US&order=votes&reverse=true&hidebroken=true&is_https=true&limit=20`)).filter(playable);
          const hit = rows.find(r => r.name.toLowerCase().includes(n.toLowerCase()) && !seen.has(r.url_resolved));
          if (hit) return hit;
        } catch (e) {}
      }
      return null;
    };
    const right = await side(['Fox News', 'Newsmax']), left = await side(['MSNBC', 'CNN']);
    if (right && left) pick.push(station(right, 'NATIONAL'), station(left, 'NATIONAL'));
    if (pick.length) { saved.lists[key] = { at: Date.now(), list: pick }; save(); }
    return pick;
  }
  async function stations(band) {
    if (band.talk) return talkStations();
    const c = saved.lists[band.id];
    if (c && Date.now() - c.at < 12 * 3600e3 && c.list.length) return c.list;
    const seen = new Set(), pick = [];
    for (const tag of band.tags) {
      let rows = [];
      try { rows = await get(`/json/stations/search?tag=${encodeURIComponent(tag)}&tagExact=true&order=votes&reverse=true&hidebroken=true&is_https=true&limit=200`); } catch (e) { if (!pick.length && tag === band.tags[band.tags.length - 1]) throw e; }
      rows = rows.filter(playable);
      rows.sort((a, b) => (ENGLISH.includes(b.countrycode) - ENGLISH.includes(a.countrycode)) || (b.votes - a.votes));
      for (const s of rows) {
        const k = (s.name || '').trim().toLowerCase();
        if (!k || seen.has(k) || seen.has(s.url_resolved)) continue;
        seen.add(k); seen.add(s.url_resolved);
        pick.push({ name: s.name.trim().replace(/\s+/g, ' ').slice(0, 48), url: s.url_resolved, cc: s.countrycode || '', kbps: s.bitrate || 0, id: s.stationuuid });
        if (pick.length >= PER_BAND) break;
      }
      if (pick.length >= PER_BAND) break;
    }
    if (pick.length) { saved.lists[band.id] = { at: Date.now(), list: pick }; save(); }
    return pick;
  }

  // ---- sound: the stream, and the hiss between stations --------------------------------
  const player = new Audio(); player.preload = 'none'; player.setAttribute('playsinline', '');
  let ac = null, hissGain = null;
  function wake() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ac = new AC();
        const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;                                         // soft pink-ish noise, not harsh white
        for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
        const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
        hissGain = ac.createGain(); hissGain.gain.value = 0;
        src.connect(lp); lp.connect(hp); hp.connect(hissGain); hissGain.connect(ac.destination); src.start();
      }
      if (ac.state !== 'running') ac.resume();
    } catch (e) {}
  }
  function hiss(level) {                                                   // 0..1, kept quiet on purpose
    if (!ac || !hissGain) return;
    hissGain.gain.setTargetAtTime(on ? level * 0.05 : 0, ac.currentTime, 0.08);
  }

  // ---- state --------------------------------------------------------------------------
  let band = bands().find(b => b.id === saved.band) || bands()[1];
  let list = [], pos = 0.5, playing = null, on = false, status = '', loading = false;
  // (The radio never starts by itself when the app opens: Safari needs a touch first.)
  const slot = (i) => list.length < 2 ? 0.5 : 0.06 + 0.88 * i / (list.length - 1);
  const nearest = () => { let best = 0, bd = 9; list.forEach((s, i) => { const d = Math.abs(slot(i) - pos); if (d < bd) { bd = d; best = i; } }); return { i: best, d: bd }; };
  const gap = () => (list.length < 2 ? 0.5 : 0.88 / (list.length - 1));

  // ---- the look -------------------------------------------------------------------------
  const css = document.createElement('style');
  css.textContent = `
  #radio { position: fixed; inset: 0; z-index: 11; display: none; align-items: center; justify-content: center;
    background: rgba(5,8,12,0.94); font-family: ui-monospace, Menlo, monospace; color: #ffb84a; touch-action: none; }
  #radio.show { display: flex; }
  #radio .set { width: min(92vw, 760px); border-radius: 22px; padding: 22px 22px 26px; background: linear-gradient(#24272c, #15171a);
    border: 2px solid #4a4f57; box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 #5a606a; position: relative; }
  #radio .top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  #radio .brand { font-weight: 800; font-style: italic; letter-spacing: 0.22em; font-size: 15px; color: #e8eef4; }
  #radio .stripes { flex: 1; height: 14px; background: linear-gradient(#ffb84a 0 22%, transparent 22% 33%, #d9892a 33% 55%, transparent 55% 66%, #9a5a1c 66% 88%, transparent 88%); }
  #radio .x, #radio .pw { width: 52px; height: 44px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a; font: 700 20px ui-monospace, Menlo, monospace; cursor: pointer; }
  #radio .x { position: relative; }   /* V82: a minimize mark (a bar low in the button), not an X: the radio keeps playing */
  #radio .x::after { content: ''; position: absolute; left: 50%; bottom: 11px; width: 22px; height: 4px; margin-left: -11px; border-radius: 2px; background: #ffb84a; }
  #radio .pw.on { background: #ffb84a; color: #14110c; }
  #radio .lcd { background: #120d05; border: 2px solid #3a2a10; border-radius: 8px; padding: 12px 16px; min-height: 64px; box-shadow: inset 0 0 18px rgba(255,184,74,0.12); }
  #radio .lcd .name { font-size: 24px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 8px rgba(255,184,74,0.55); }
  #radio .lcd .sub { font-size: 13px; color: #b98a46; margin-top: 4px; letter-spacing: 0.1em; text-transform: uppercase; }
  #radio .dial { position: relative; height: 92px; margin: 16px 0; border-radius: 8px; background: linear-gradient(#e9dcc0, #d6c6a2); border: 3px solid #0d0f12; cursor: grab; overflow: hidden; }
  #radio .dial canvas { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; background: transparent; }
  #radio .row { display: flex; gap: 10px; align-items: stretch; }
  #radio .row .step { width: 64px; flex: none; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a; font: 700 22px ui-monospace, Menlo, monospace; cursor: pointer; }
  #radio .bands { flex: 1; display: flex; gap: 8px; flex-wrap: wrap; }
  #radio .bands button.wide { flex: 1 0 40%; }   /* V83: XMAS and TALK on their own row, the decades keep full-size buttons */
  #radio .bands button { flex: 1 0 64px; height: 60px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a;
    font: 800 20px ui-monospace, Menlo, monospace; letter-spacing: 0.06em; cursor: pointer; box-shadow: 0 3px 0 #0a0c0f; }
  #radio .bands button.on { background: #ffb84a; color: #14110c; transform: translateY(2px); box-shadow: 0 1px 0 #0a0c0f; }
  /* V85: RADIO and TV, one set. */
  #radio .tab { height: 44px; padding: 0 18px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a;
    font: 800 17px ui-monospace, Menlo, monospace; letter-spacing: 0.14em; cursor: pointer; }
  #radio .tab.on { background: #ffb84a; color: #14110c; }
  #radio.tv .radiobody, #radio:not(.tv) .tvbody { display: none; }
  #radio .hint { text-align: center; color: #7d8a97; font-size: 12px; letter-spacing: 0.1em; margin-top: 14px; }
`;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.id = 'radio'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="set">
    <div class="top"><button type="button" class="pw" aria-label="Power">⏻</button><button type="button" class="tab" data-mode="radio">RADIO</button><button type="button" class="tab" data-mode="tv">TV</button><span class="stripes"></span><button type="button" class="x" aria-label="Minimize"></button></div>
    <div class="radiobody"><div class="lcd"><div class="name">—</div><div class="sub">&nbsp;</div></div>
    <div class="dial"><canvas></canvas></div>
    <div class="row"><button type="button" class="step" data-step="-1" aria-label="Tune down">◀</button><div class="bands"></div><button type="button" class="step" data-step="1" aria-label="Tune up">▶</button></div>
    <div class="hint">DRAG THE DIAL · SWIPE DOWN OR TAP THE BAR TO MINIMIZE, IT KEEPS PLAYING</div></div>
    <div class="tvbody"></div></div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  const cv = $('.dial canvas'), dialEl = $('.dial');
  // V85: the TV half (tv.js). Picking a movie quiets the radio.
  let mode = saved.mode === 'tv' && window.TV ? 'tv' : 'radio';
  if (window.TV) TV.mount($('.tvbody'), { quietRadio: () => { if (on) powerOff(); }, lit: () => $('.pw').classList.add('on') });
  else el.querySelector('.tab[data-mode="tv"]').style.display = 'none';
  function setMode(m) {
    mode = m === 'tv' && window.TV ? 'tv' : 'radio'; saved.mode = mode; save();
    el.classList.toggle('tv', mode === 'tv');
    el.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.mode === mode));
    if (mode === 'tv') { TV.show(); $('.pw').classList.toggle('on', TV.isOn()); } else render();
  }

  function renderBands() {
    $('.bands').innerHTML = bands().map(b => `<button type="button" data-band="${b.id}" class="${b.id === band.id ? 'on' : ''}${b.wide ? ' wide' : ''}">${label(b)}</button>`).join('');
  }
  function lcd(name, sub) { $('.lcd .name').textContent = name; $('.lcd .sub').innerHTML = sub || '&nbsp;'; }
  function showStation() {
    $('.pw').classList.toggle('on', mode === 'tv' ? TV.isOn() : on);
    if (loading) return lcd('TUNING ' + label(band) + '…', 'FINDING STATIONS');
    if (status === 'nodir') return lcd('NO SIGNAL', 'CAN\'T REACH THE STATION LIST · CHECK WI-FI');
    if (!list.length) return lcd('NO STATIONS', 'NOTHING PLAYABLE ON ' + label(band) + ' RIGHT NOW');
    const n = nearest();
    if (n.d > gap() * 0.25) return lcd('· · ·', label(band) + ' · BETWEEN STATIONS');
    const s = list[n.i];
    const st = !on ? 'OFF · TAP ⏻' : status === 'dead' ? 'NO SIGNAL · TURN THE DIAL' : status === 'buffering' ? 'TUNING IN…' : 'LIVE';
    lcd(s.name, `${label(band)} · ${n.i + 1} OF ${list.length}${s.where ? ' · ' + s.where : s.cc ? ' · ' + s.cc : ''} · ${st}`);
  }
  function drawDial() {
    const r = dialEl.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!r.width) return;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    c.fillStyle = '#2a2116'; c.font = `700 ${Math.round(11 * dpr)}px ui-monospace, Menlo, monospace`; c.textAlign = 'center';
    for (let i = 0; i <= 50; i++) {                                         // the scale
      const x = W * (0.03 + 0.94 * i / 50), big = i % 5 === 0;
      c.fillRect(x - dpr * 0.5, H * 0.1, dpr * (big ? 1.6 : 1), H * (big ? 0.26 : 0.15));
    }
    list.forEach((s, i) => {                                                // a mark for each station
      const x = W * slot(i);
      c.fillStyle = '#7a3c10'; c.beginPath(); c.arc(x, H * 0.52, dpr * 3.2, 0, 6.3); c.fill();
      c.fillStyle = '#2a2116'; c.fillText(String(i + 1), x, H * 0.82);
    });
    const nx = W * pos;                                                     // the needle, glowing
    c.fillStyle = 'rgba(214,84,20,0.25)'; c.fillRect(nx - dpr * 6, 0, dpr * 12, H);
    c.fillStyle = '#c0420e'; c.fillRect(nx - dpr * 1.5, 0, dpr * 3, H);
  }
  function render() { renderBands(); showStation(); drawDial(); }

  // ---- tuning -----------------------------------------------------------------------------
  let settleTimer = null;
  function stopStream() { try { player.pause(); player.removeAttribute('src'); player.load(); } catch (e) {} playing = null; }
  function tuneIn() {
    if (!on || !list.length) { stopStream(); hiss(0); return; }
    const n = nearest();
    if (n.d > gap() * 0.25) { stopStream(); hiss(1); status = ''; return showStation(); }
    const s = list[n.i];
    hiss(Math.min(1, n.d / (gap() * 0.25)) * 0.6);
    if (playing === s.url) return showStation();
    stopStream(); playing = s.url; status = 'buffering';
    if (window.TV && TV.isOn()) TV.off();             // V107: never the TV and the radio at once
    player.src = s.url; current = s; retries = 0; mediaInfo(s);
    const p = player.play(); if (p && p.catch) p.catch(() => { if (playing === s.url) { status = 'dead'; hiss(0.35); showStation(); } });
    saved.pos[band.id] = pos; save(); showStation();
  }
  player.addEventListener('playing', () => { status = 'live'; retries = 0; hiss(0); showStation(); try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {} });

  // V81: the radio plays until it's turned off, wherever you are in the app (any scene, Kitchen,
  // the night clock) and when the iPad's screen goes dark. For that, the station is announced to
  // the iPad as what's playing (Media Session): its name shows on the lock screen with pause and
  // next/previous station buttons, which iPadOS treats as music to keep going. If the iPad cuts it
  // off anyway (a call, another app taking the sound), it picks back up when you come back, as
  // long as the radio is still on. A stream that drops on its own is retried a few times before
  // it says NO SIGNAL.
  let current = null, retries = 0, retryTimer = null;
  function mediaInfo(s) {
    if (!('mediaSession' in navigator)) return;
    try { navigator.mediaSession.metadata = new MediaMetadata({ title: s.name, artist: 'RISING FM · ' + label(band), album: 'Outside In radio' }); } catch (e) {}
  }
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession, h = (a, f) => { try { ms.setActionHandler(a, f); } catch (e) {} };
    h('play', () => { if (!on) { on = true; saved.on = true; save(); } if (current && playing) player.play().catch(() => {}); else tuneIn(); showStation(); });
    h('pause', () => { powerOff(); try { ms.playbackState = 'paused'; } catch (e) {} });
    h('stop', () => { powerOff(); try { ms.playbackState = 'none'; } catch (e) {} });
    h('nexttrack', () => stepTo(1));
    h('previoustrack', () => stepTo(-1));
  }
  function retry() {
    if (!on || !playing || !current) return;
    if (!player.paused && player.readyState >= 3) return;                 // still playing from its buffer: leave it
    if (retries >= 3) { status = 'dead'; showStation(); return; }
    retries++; clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { if (!on || !current || playing !== current.url) return; player.src = current.url; player.play().catch(() => {}); }, 2500 * retries);
  }
  player.addEventListener('stalled', retry);
  player.addEventListener('ended', retry);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && on && playing && player.paused) player.play().catch(retry);
  });
  player.addEventListener('waiting', () => { if (playing) { status = 'buffering'; showStation(); } });
  player.addEventListener('error', () => { if (playing) { if (current && retries < 3 && status === 'live') return retry(); status = 'dead'; hiss(0.35); showStation(); } });

  function settle() {                                                      // glide onto the nearest station
    clearTimeout(settleTimer);
    if (!list.length) return;
    const target = slot(nearest().i);
    const step = () => {
      pos += (target - pos) * 0.35;
      if (Math.abs(target - pos) < 0.002) pos = target;
      drawDial(); hiss(Math.min(1, Math.abs(target - pos) / (gap() * 0.25)));
      if (pos !== target) settleTimer = setTimeout(step, 30); else tuneIn();
    };
    step();
  }
  async function pickBand(id) {
    band = bands().find(b => b.id === id) || band; saved.band = band.id; save();
    stopStream(); list = []; loading = true; status = ''; render(); hiss(on ? 0.6 : 0);
    try { list = await stations(band); } catch (e) { status = 'nodir'; }
    if (band.id !== id) return;
    loading = false;
    pos = typeof saved.pos[band.id] === 'number' ? saved.pos[band.id] : slot(0);
    render(); settle();
  }

  // Dragging the needle.
  let dragging = false;
  const dialAt = (clientX) => { const r = dialEl.getBoundingClientRect(); return Math.max(0.03, Math.min(0.97, (clientX - r.left) / r.width)); };
  function dragTo(x) {
    pos = dialAt(x); drawDial();
    const n = nearest(), off = Math.min(1, n.d / (gap() * 0.25));
    if (playing && off >= 1) { stopStream(); }
    hiss(off); showStation();
  }
  dialEl.addEventListener('pointerdown', (e) => { wake(); dragging = true; clearTimeout(settleTimer); try { dialEl.setPointerCapture(e.pointerId); } catch (e2) {} dragTo(e.clientX); });
  dialEl.addEventListener('pointermove', (e) => { if (dragging) dragTo(e.clientX); });
  const endDrag = () => { if (!dragging) return; dragging = false; settle(); };
  dialEl.addEventListener('pointerup', endDrag); dialEl.addEventListener('pointercancel', endDrag);

  function stepTo(dir) {
    if (!list.length) return;
    const idx = list.map((_, j) => j);
    const i = dir > 0 ? (idx.find(j => slot(j) > pos + 0.001) ?? list.length - 1) : ([...idx].reverse().find(j => slot(j) < pos - 0.001) ?? 0);
    if (!on) { on = true; saved.on = true; save(); }
    const from = pos, to = slot(i); let k = 0;
    clearTimeout(settleTimer); stopStream();
    const glide = () => { k += 0.12; pos = from + (to - from) * Math.min(1, k); drawDial(); hiss(Math.sin(Math.min(1, k) * Math.PI) * 0.8); showStation(); if (k < 1) settleTimer = setTimeout(glide, 30); else tuneIn(); };
    glide();
  }
  function powerOff() { on = false; saved.on = false; save(); stopStream(); hiss(0); status = ''; showStation(); }
  el.addEventListener('click', (e) => {
    wake();
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('x')) return close();
    if (b.dataset.mode) return setMode(b.dataset.mode);
    if (b.classList.contains('pw') && mode === 'tv') { $('.pw').classList.toggle('on', TV.power()); return; }
    if (b.classList.contains('pw')) { on = !on; saved.on = on; save(); if (on) { if (!list.length && !loading) pickBand(band.id); else tuneIn(); } else powerOff(); return showStation(); }
    if (b.dataset.band) { if (!on) { on = true; saved.on = true; save(); } return pickBand(b.dataset.band); }
    if (b.dataset.step) stepTo(+b.dataset.step);
  });

  // Swipe down on the radio closes it. Touches on the radio never reach the scenes underneath.
  let sy = null, sx = 0;
  el.addEventListener('touchstart', (e) => { const p = e.changedTouches[0]; sy = e.target.closest('.dial, button, .guide') ? null : p.clientY; sx = p.clientX; e.stopPropagation(); }, { passive: true });
  el.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  el.addEventListener('touchend', (e) => { const p = e.changedTouches[0]; if (sy !== null && p.clientY - sy > 90 && p.clientY - sy > Math.abs(p.clientX - sx) * 1.5) close(); sy = null; e.stopPropagation(); }, { passive: true });
  for (const t of ['mousedown', 'mouseup', 'click']) el.addEventListener(t, (e) => e.stopPropagation());
  el.addEventListener('mousedown', (e) => { if (!e.target.closest('.dial, button, .guide')) sy = e.clientY; });
  el.addEventListener('mouseup', (e) => { if (sy !== null && e.clientY - sy > 90) close(); sy = null; });
  document.addEventListener('keydown', (e) => { if (isOpen() && (e.key === 'Escape' || e.key === 'ArrowDown')) { e.stopImmediatePropagation(); close(); } }, true);
  window.addEventListener('resize', () => { if (isOpen()) drawDial(); });

  const isOpen = () => el.classList.contains('show');
  function open() {
    wake();
    el.classList.add('show'); el.setAttribute('aria-hidden', 'false');
    setMode(mode);
    if (mode === 'radio' && !list.length && !loading) pickBand(band.id);
  }
  function close() { el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); clearTimeout(settleTimer); if (!playing) hiss(0); }
  window.Radio = { open, close, isOpen };
})();
