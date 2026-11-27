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
// V145: the bar closes on the touch itself, and a quick second tap after the set wakes from fading counts.
// V152: the three orange lines between SPORTS and the minimize bar are now the VOLUME: a round
// amber knob on the lines, with small amber notches above and below that light up to the level.
// Drag it (or tap where you want it) and the radio gets louder or quieter; the level is kept on
// the device. It also sets the hiss between stations and the screensaver's Santa sounds. Weather
// alert chimes stay at full on purpose, so a warning is never turned down by accident.
// How it reaches the radio: on a Chromebook (and Android, Mac, PC) the browser just sets the
// stream's volume. An iPhone or iPad ignores that, so there the stream is played through the
// page's own sound mixer (Web Audio) with a volume step in it, which only works when the station
// allows it (most do; a few don't, and HLS streams can't). Those stations play at the device's
// own volume, and the set says so. At full volume an iPhone or iPad plays the stream the old
// direct way, so nothing changes for anyone who never turns it down.
// The TV can't be turned down from here: the movie plays in the Internet Archive's own player,
// and a page isn't allowed to reach inside another site's player. With the TV showing, the knob
// dims and a tap on it says to use the device's volume buttons.
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
  const VKEY = 'risingcode_volume';
  let vol = 1;
  try { const v = parseFloat(localStorage.getItem(VKEY)); if (v >= 0 && v <= 1) vol = v; } catch (e) {}
  const volHooks = [];
  window.AppVolume = { get: () => vol, onChange: (f) => { volHooks.push(f); } };
  // Can this browser set a stream's volume? An iPhone or iPad always reads it back as 1.
  const canSetVolume = (() => { try { const a = document.createElement('audio'); a.volume = 0.5; return Math.abs(a.volume - 0.5) < 0.01; } catch (e) { return false; } })();
  const forceGain = /[?&]volroute=gain(&|$)/.test(location.search);   // for testing the iPad way on a computer
  const needsGain = () => forceGain || !canSetVolume;
  function makePlayer(cors) {
    const a = new Audio(); a.preload = 'none'; a.setAttribute('playsinline', '');
    if (cors) a.crossOrigin = 'anonymous';
    return a;
  }
  const direct = makePlayer(false);
  let player = direct, routed = null, routedGain = null;
  const noGain = {};                                                   // stations that wouldn't go through the mixer
  const isHls = (url) => /\.m3u8(\?|$)/i.test(url || '');
  let ac = null, hissGain = null, lastHiss = 0;
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
    lastHiss = level;
    if (!ac || !hissGain) return;
    hissGain.gain.setTargetAtTime(on ? level * 0.05 * vol : 0, ac.currentTime, 0.08);
  }
  // The stream through the mixer, for an iPhone or iPad turned below full.
  function routedPlayer() {
    if (routed) return routed;
    wake(); if (!ac) return null;
    try {
      const a = makePlayer(true), src = ac.createMediaElementSource(a);
      routedGain = ac.createGain(); routedGain.gain.value = vol;
      src.connect(routedGain); routedGain.connect(ac.destination);
      hook(a); routed = a;
    } catch (e) { routed = null; routedGain = null; }
    return routed;
  }
  function pickPlayer(url) {
    if (needsGain() && vol < 0.995 && !isHls(url) && !noGain[url]) { const r = routedPlayer(); if (r) return r; }
    return direct;
  }
  // Does the level the knob shows really reach what's playing?
  const volReaches = () => !needsGain() || player === routed || vol >= 0.995;
  // What the knob is doing right now, for checking on a device (type AppVolume.state() in the console).
  window.AppVolume.state = () => ({ level: vol, route: player === routed ? 'mixer' : 'direct', setsVolume: canSetVolume, directVolume: direct.volume,
    mixerLevel: routedGain ? routedGain.gain.value : null, playing: !!playing && !player.paused, time: player.currentTime, reaches: volReaches() });

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
  /* V152: the volume, made from the old three lines: lit up to the knob, dim past it. */
  #radio .vol { flex: 1; min-width: 130px; height: 48px; position: relative; cursor: pointer; touch-action: none; outline: none; -webkit-tap-highlight-color: transparent; }
  #radio .vol .vtrack { position: absolute; left: 15px; right: 15px; top: 0; bottom: 0; }
  #radio .vol .vlines, #radio .vol .vlit { position: absolute; left: 0; top: 17px; height: 14px; background: linear-gradient(#ffb84a 0 22%, transparent 22% 33%, #d9892a 33% 55%, transparent 55% 66%, #9a5a1c 66% 88%, transparent 88%); }
  #radio .vol .vlines { right: 0; opacity: 0.3; }
  #radio .vol .vnotch i { position: absolute; width: 2px; margin-left: -1px; border-radius: 1px; background: #ffb84a; opacity: 0.3; }
  #radio .vol .vnotch i.lit { opacity: 1; }
  #radio .vol .vknob { position: absolute; top: 11px; width: 26px; height: 26px; margin-left: -13px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #ffd08a, #ffb84a 55%, #d9892a);
    box-shadow: 0 0 0 2px #14110c, 0 0 8px rgba(255,184,74,0.45); }
  #radio .vol .vknob::after { content: ''; position: absolute; left: 12px; top: 6px; width: 2px; height: 14px; border-radius: 1px; background: #14110c; opacity: 0.7; }
  #radio .vol:focus-visible .vknob { box-shadow: 0 0 0 2px #14110c, 0 0 0 4px #ffb84a; }
  #radio .vol.na { opacity: 0.35; }
  #radio .vol.fixed .vlit, #radio .vol.fixed .vnotch i.lit { opacity: 0.55; }
  /* On a phone there isn't room beside the buttons, so the volume gets its own row under them. */
  @media (max-width: 600px) {
    #radio .top { flex-wrap: wrap; row-gap: 4px; }
    #radio .top .x { margin-left: auto; }
    #radio .vol { order: 9; flex: 1 0 100%; }
  }
  #radio .x, #radio .pw { width: 52px; height: 44px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a; font: 700 20px ui-monospace, Menlo, monospace; cursor: pointer; }
  #radio .x { position: relative; }   /* V82: a minimize mark (a bar low in the button), not an X: the radio keeps playing */
  #radio .x::after { content: ''; position: absolute; left: 50%; bottom: 11px; width: 22px; height: 4px; margin-left: -11px; border-radius: 2px; background: #ffb84a; }
  #radio .pw.on { background: #ffb84a; color: #14110c; }
  #radio .lcd { background: #120d05; border: 2px solid #3a2a10; border-radius: 8px; padding: 12px 16px; min-height: 64px; box-shadow: inset 0 0 18px rgba(255,184,74,0.12); }
  #radio .lcd .name { font-size: 24px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 8px rgba(255,184,74,0.55); }
  #radio .lcd .sub { font-size: 13px; color: #b98a46; margin-top: 4px; letter-spacing: 0.1em; text-transform: uppercase; }
  #radio .dial { position: relative; height: 92px; margin: 16px 0; border-radius: 8px; background: #120c06; border: 3px solid #0d0f12; cursor: grab; overflow: hidden; }
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
    <div class="top"><button type="button" class="pw" aria-label="Power">⏻</button><button type="button" class="tab" data-mode="radio">RADIO</button><button type="button" class="tab" data-mode="tv">TV</button><div class="vol" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100"><div class="vtrack"><i class="vlines"></i><i class="vlit"></i><span class="vnotch"></span><i class="vknob"></i></div></div><button type="button" class="x" aria-label="Minimize"></button></div>
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
    volShow();
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
    if (window.TubeGlow) TubeGlow.paint(c, W, H, on);                       // V108: lit from behind by the tubes
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

  // ---- the volume knob (V152) -------------------------------------------------------------
  const volEl = $('.vol'), vtrack = $('.vtrack'), vknob = $('.vknob'), vlit = $('.vlit');
  const NOTCHES = 11;
  // Small amber notches above and below the lines, a little taller toward loud, lit up to the level.
  $('.vnotch').innerHTML = Array.from({ length: NOTCHES }, (_, i) => {
    const h = 4 + Math.round(i * 0.5), x = (i * 100 / (NOTCHES - 1)) + '%';
    return `<i style="left:${x};top:${15 - h}px;height:${h}px"></i><i style="left:${x};top:33px;height:${h}px"></i>`;
  }).join('');
  const notches = el.querySelectorAll('.vnotch i');
  function volShow() {
    const pct = Math.round(vol * 100);
    vknob.style.left = pct + '%'; vlit.style.width = pct + '%';
    for (let k = 0; k < notches.length; k++) notches[k].classList.toggle('lit', (k >> 1) * 100 / (NOTCHES - 1) <= pct + 0.5);
    const tv = mode === 'tv';
    volEl.classList.toggle('na', tv);
    const fixed = !tv && on && !!playing && !volReaches();
    volEl.classList.toggle('fixed', fixed);
    // A station the knob can't reach says so for as long as it plays.
    if (fixed !== fixedShown) { fixedShown = fixed; if (fixed) volNote(OWN_VOL, true); else if (noteSticky) volNoteEnd(); }
    volEl.setAttribute('aria-valuenow', String(pct));
    volEl.setAttribute('aria-valuetext', tv ? 'The TV uses the device\'s volume buttons' : pct + ' percent');
  }
  const OWN_VOL = 'THIS STATION PLAYS AT THE DEVICE\'S OWN VOLUME · USE ITS VOLUME BUTTONS';
  let noteTimer = null, noteEl = null, noteWas = '', noteSticky = false, fixedShown = false;
  function volNoteEnd() { clearTimeout(noteTimer); if (noteEl) noteEl.textContent = noteWas; noteEl = null; noteSticky = false; }
  function volNote(text, sticky) {
    const hints = el.querySelectorAll('.hint'); let h = null;
    for (let k = 0; k < hints.length; k++) if (hints[k].offsetParent !== null) h = hints[k];
    if (!h) return;
    if (noteEl && noteEl !== h) noteEl.textContent = noteWas;
    if (noteEl !== h) { noteWas = h.textContent; noteEl = h; }
    h.textContent = text; clearTimeout(noteTimer); noteSticky = !!sticky;
    if (!sticky) noteTimer = setTimeout(() => { if (fixedShown && mode !== 'tv') { h.textContent = OWN_VOL; noteSticky = true; } else volNoteEnd(); }, 4000);
  }
  function applyVol() {
    if (canSetVolume) { try { direct.volume = forceGain ? 1 : vol; } catch (e) {} }
    if (routedGain && ac) { try { routedGain.gain.setTargetAtTime(vol, ac.currentTime, 0.03); } catch (e) { routedGain.gain.value = vol; } }
    hiss(lastHiss);
    for (let k = 0; k < volHooks.length; k++) { try { volHooks[k](vol); } catch (e) {} }
    volShow();
  }
  function setVol(v, keep) {
    vol = Math.max(0, Math.min(1, v));
    if (vol > 0.98) vol = 1;                                              // easy to get back to full
    applyVol();
    if (keep) { try { localStorage.setItem(VKEY, String(Math.round(vol * 100) / 100)); } catch (e) {} }
  }
  // When a finger lets go: on an iPhone or iPad playing the direct way, turning it below full moves
  // the station onto the mixer (a second of tuning in), since that's the only way it can get quieter.
  function volDone() {
    try { localStorage.setItem(VKEY, String(Math.round(vol * 100) / 100)); } catch (e) {}
    if (mode === 'tv') return;
    if (on && playing && player === direct && needsGain() && vol < 0.995) {
      const want = pickPlayer(playing);
      if (want !== direct) {
        const url = playing; quiet(direct); player = want; status = 'buffering'; showStation();
        player.src = url; player.play().catch(() => {});
      } else volNote(OWN_VOL);
    }
    volShow();
  }
  const volAt = (x) => { const r = vtrack.getBoundingClientRect(); return r.width ? (x - r.left) / r.width : vol; };
  let vdrag = false;
  function volStart(x) {
    wake();
    if (mode === 'tv') { volNote('THE MOVIE\'S SOUND IS IN THE INTERNET ARCHIVE\'S PLAYER · USE THE DEVICE\'S VOLUME BUTTONS'); return false; }
    vdrag = true; setVol(volAt(x)); return true;
  }
  volEl.addEventListener('touchstart', (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); volStart(e.touches[0].clientX); }, { passive: false });
  volEl.addEventListener('touchmove', (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); if (vdrag) setVol(volAt(e.touches[0].clientX)); }, { passive: false });
  const vEnd = (e) => { e.stopPropagation(); if (vdrag) { vdrag = false; volDone(); } };
  volEl.addEventListener('touchend', vEnd, { passive: true });
  volEl.addEventListener('touchcancel', vEnd, { passive: true });
  volEl.addEventListener('mousedown', (e) => {
    if (e.button) return; e.preventDefault(); e.stopPropagation(); if (!volStart(e.clientX)) return;
    const mv = (ev) => { if (vdrag) setVol(volAt(ev.clientX)); };
    const up = () => { window.removeEventListener('mousemove', mv, true); window.removeEventListener('mouseup', up, true); if (vdrag) { vdrag = false; volDone(); } };
    window.addEventListener('mousemove', mv, true); window.addEventListener('mouseup', up, true);
  });
  volEl.addEventListener('click', (e) => e.stopPropagation());
  volEl.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -0.05, ArrowRight: 0.05, ArrowUp: 0.05, Home: -1, End: 1 }[e.key];
    if (step === undefined) return;
    e.preventDefault(); e.stopPropagation();
    if (mode === 'tv') return volStart(0);
    setVol(vol + step); volDone();
  });
  applyVol();
  // V108: keep redrawing while the tubes warm up or cool down, and now and then for the faint flicker.
  setInterval(() => { if (isOpen() && (window.TubeGlow && (TubeGlow.warming() || on))) drawDial(); }, 120);

  // ---- tuning -----------------------------------------------------------------------------
  let settleTimer = null;
  function quiet(a) { try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {} }
  function stopStream() { quiet(direct); if (routed) quiet(routed); playing = null; }
  function tuneIn() {
    if (!on || !list.length) { stopStream(); hiss(0); return; }
    const n = nearest();
    if (n.d > gap() * 0.25) { stopStream(); hiss(1); status = ''; return showStation(); }
    const s = list[n.i];
    hiss(Math.min(1, n.d / (gap() * 0.25)) * 0.6);
    if (playing === s.url) return showStation();
    stopStream(); playing = s.url; status = 'buffering';
    if (window.TV && TV.isOn()) TV.off();             // V107: never the TV and the radio at once
    player = pickPlayer(s.url);
    player.src = s.url; current = s; retries = 0; mediaInfo(s);
    const p = player.play(); if (p && p.catch) p.catch(() => { if (playing === s.url) { status = 'dead'; hiss(0.35); showStation(); } });
    saved.pos[band.id] = pos; save(); showStation(); volShow();
  }

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
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && routed && ac && ac.state !== 'running') { try { ac.resume(); } catch (e) {} }
    if (document.visibilityState === 'visible' && on && playing && player.paused) player.play().catch(retry);
  });
  // Each stream player reports only while it's the one playing.
  function hook(a) {
    const mine = (f) => (e) => { if (a === player) f(e); };
    a.addEventListener('playing', mine(() => { status = 'live'; retries = 0; hiss(0); showStation(); volShow(); try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {} }));
    a.addEventListener('stalled', mine(retry));
    a.addEventListener('ended', mine(retry));
    a.addEventListener('waiting', mine(() => { if (playing) { status = 'buffering'; showStation(); } }));
    a.addEventListener('error', mine(() => {
      if (!playing) return;
      // V152: a station that won't go through the mixer (it doesn't allow it) plays the direct
      // way instead, at the device's own volume.
      if (a === routed && status !== 'live') { noGain[playing] = true; const url = playing; quiet(routed); player = direct; direct.src = url; direct.play().catch(() => { if (playing === url) { status = 'dead'; hiss(0.35); showStation(); } }); volShow(); volNote(OWN_VOL); return; }
      if (current && retries < 3 && status === 'live') return retry(); status = 'dead'; hiss(0.35); showStation();
    }));
  }
  hook(direct);

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
  function powerOff() { on = false; saved.on = false; save(); stopStream(); hiss(0); status = ''; showStation(); volShow(); }
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

  // V145: the minimize bar closes the set on the touch itself, so it never waits on Safari to
  // make a click out of the tap (the same precaution as the alert's ✕, V144). A finger that
  // slides up to 30 px still counts as a tap; the click that would
  // follow is cancelled, so it can't land on the scene underneath once the set is gone. The
  // touch that only wakes a faded radio never gets here (radiodim.js stops it first).
  {
    const bar = $('.x'); let bx = null, by = 0;
    bar.addEventListener('touchstart', (e) => { const p = e.changedTouches[0]; bx = p.clientX; by = p.clientY; }, { passive: true });
    bar.addEventListener('touchcancel', () => { bx = null; }, { passive: true });
    bar.addEventListener('touchend', (e) => {
      const p = e.changedTouches[0], x0 = bx; bx = null;
      if (x0 === null || e.touches.length || Math.hypot(p.clientX - x0, p.clientY - by) > 30) return;
      if (e.cancelable) e.preventDefault();
      close();
    }, { passive: false });
  }
  // Swipe down on the radio closes it. Touches on the radio never reach the scenes underneath.
  let sy = null, sx = 0;
  el.addEventListener('touchstart', (e) => { const p = e.changedTouches[0]; sy = e.target.closest('.dial, button, .guide, .vol') ? null : p.clientY; sx = p.clientX; e.stopPropagation(); }, { passive: true });
  el.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  el.addEventListener('touchend', (e) => { const p = e.changedTouches[0]; if (sy !== null && p.clientY - sy > 90 && p.clientY - sy > Math.abs(p.clientX - sx) * 1.5) close(); sy = null; e.stopPropagation(); }, { passive: true });
  for (const t of ['mousedown', 'mouseup', 'click']) el.addEventListener(t, (e) => e.stopPropagation());
  el.addEventListener('mousedown', (e) => { if (!e.target.closest('.dial, button, .guide, .vol')) sy = e.clientY; });
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
