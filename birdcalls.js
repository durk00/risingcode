// BIRD CALLS (Nov 27, 2026, V153): while a migrating flock goes over Home (wildlife.js), a few
// faint calls drift in now and then, as if the flock were passing high over the valley:
// Canada geese honk, snow geese yelp higher and quicker, tundra swans make a soft, mellow hoo.
// They are made right here with the browser's own sound (no recordings), kept very low,
// muffled like they're far off, and swell and fade as the flock passes. Most of the time
// there's nothing at all.
//
// V153: also the farmer's faint, far-off shot when he's out after geese (homestead.js).
// Quiet when: Menu → OUTDOOR SOUNDS is Off (on to start), the radio is up or the TV is on, the app
// isn't on Home, or the page is in the background. The iPad only lets a page make sound after
// it's been touched once since it opened; calls before that are simply skipped.
// Preview: ?wild=geese, snowgeese or swans brings a flock; tap once so the iPad allows sound.
(() => {
  const KEY = 'risingcode_birdcalls';
  const LEVEL = 0.035;                             // the whole thing, kept far below the alert chime (0.32)
  let on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) {}
  let ac = null, out = null, timers = [];
  function ctx() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        ac = new AC();
        // Far away: everything goes through a soft low-pass and a very low master level.
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.Q.value = 0.5;
        out = ac.createGain(); out.gain.value = LEVEL; out.connect(lp); lp.connect(ac.destination);
      }
    } catch (e) { ac = null; }
    return ac;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const quiet = () => !on || document.hidden
    || (window.Wildlife && Wildlife.drawnAgo && Wildlife.drawnAgo() > 2000)   // Home isn't showing
    || (window.Radio && Radio.isOpen && Radio.isOpen())
    || (window.TV && TV.isOn && TV.isOn())
    || (window.Menu && Menu.isOpen && Menu.isOpen());

  // One call: a buzzy tone through a band-pass (a throat), with its pitch moving the way the
  // real call does. pts: [[time, Hz], ...]; amp: 0 to 1 within this module's level.
  function voice(c, t0, type, pts, len, band, q, amp, pan) {
    const o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain();
    o.type = type; bp.type = 'bandpass'; bp.frequency.value = band; bp.Q.value = q;
    o.frequency.setValueAtTime(pts[0][1], t0);
    for (const [t, f] of pts.slice(1)) o.frequency.linearRampToValueAtTime(f, t0 + t);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(amp, t0 + Math.min(0.04, len * 0.25));
    g.gain.setValueAtTime(amp, t0 + len * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(bp); bp.connect(g);
    let last = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); last = p; }
    last.connect(out);
    o.start(t0); o.stop(t0 + len + 0.05);
  }
  function call(c, kind, t0, amp, pan) {
    const k = rnd(0.94, 1.06);                      // no two birds quite alike
    if (kind === 'goose') {                        // Canada goose: a two-part "ah-honk"
      voice(c, t0, 'sawtooth', [[0, 300 * k], [0.08, 360 * k]], 0.12, 900, 3, amp * 0.6, pan);
      voice(c, t0 + 0.13, 'sawtooth', [[0, 420 * k], [0.06, 470 * k], [0.2, 400 * k]], 0.24, 1100, 3, amp, pan);
    } else if (kind === 'snow') {                  // snow goose: a higher, quick, barking yelp
      voice(c, t0, 'sawtooth', [[0, 640 * k], [0.05, 780 * k], [0.13, 700 * k]], 0.15, 1400, 4, amp * 0.8, pan);
    } else {                                       // tundra swan: a soft, mellow, woodwind "hoo-hoo"
      voice(c, t0, 'triangle', [[0, 430 * k], [0.12, 500 * k], [0.3, 470 * k]], 0.34, 900, 2, amp * 0.9, pan);
      if (Math.random() < 0.6) voice(c, t0 + 0.42, 'triangle', [[0, 460 * k], [0.1, 520 * k], [0.25, 480 * k]], 0.3, 900, 2, amp * 0.8, pan);
    }
  }

  // A flock came over: a handful of short bursts spread across its pass, louder in the middle
  // (overhead) and fainter at the start and end, panned from the side it comes in on.
  function flock(kind, n) {
    if (!on) return;
    timers.forEach(clearTimeout); timers = [];
    const pass = rnd(45, 90), bursts = kind === 'swan' ? 2 + ((Math.random() * 3) | 0) : 3 + ((Math.random() * 4) | 0);
    for (let b = 0; b < bursts; b++) {
      const at = rnd(0.08, 0.92), swell = Math.sin(at * Math.PI);   // 0 at the edges, 1 overhead
      timers.push(setTimeout(() => {
        const c = ctx(); if (!c || c.state !== 'running' || quiet()) return;
        const calls = kind === 'snow' ? 2 + ((Math.random() * Math.min(5, n / 3)) | 0) : 1 + ((Math.random() * 3) | 0);
        let t = c.currentTime + 0.05;
        for (let i = 0; i < calls; i++) {
          call(c, kind, t, 0.25 + 0.75 * swell * rnd(0.6, 1), (0.5 - at) * 0.8);
          t += kind === 'snow' ? rnd(0.12, 0.35) : kind === 'swan' ? rnd(0.9, 1.6) : rnd(0.45, 0.9);
        }
      }, at * pass * 1000));
    }
  }

  // V153: the farmer's shotgun (homestead.js), heard from across the yard: a short, muffled
  // thump with a soft roll off the ridge, no louder than the calls. Same switch, same quiet rules.
  function shot() {
    const c = ctx(); if (!c || c.state !== 'running' || quiet()) return;
    const t0 = c.currentTime + 0.02, len = 1.4, buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) { const t = i / c.sampleRate; d[i] = (Math.random() * 2 - 1) * (Math.exp(-t * 28) + 0.18 * Math.exp(-Math.pow((t - 0.45) * 5, 2))); }
    const src = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; lp.type = 'lowpass'; lp.frequency.value = 700; g.gain.value = 0.9;
    src.connect(lp); lp.connect(g); g.connect(out); src.start(t0);
  }

  // The first touch after opening lets the iPad make sound (the same way the alert chime does).
  const unlock = () => {
    if (!on) return;
    const c = ctx(); if (!c) return;
    try { const blip = c.createBufferSource(); blip.buffer = c.createBuffer(1, 1, 22050); blip.connect(c.destination); blip.start(0); } catch (e) {}
    if (c.state !== 'running') { try { c.resume(); } catch (e) {} }
  };
  for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { timers.forEach(clearTimeout); timers = []; } });

  window.BirdCalls = {
    flock, shot,
    on: () => on,
    set(v) { on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} if (!on) { timers.forEach(clearTimeout); timers = []; } else unlock(); },
  };
})();
