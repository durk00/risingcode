// ALERT CHIME (Nov 25, 2026, V103): when a new NOAA weather alert comes in, a short, soft
// three-note chime plays, once, so you look over at the red banner. A warning (the serious
// kind: a winter storm warning) chimes twice. A tornado warning, or anything NOAA rates
// extreme, sounds the Emergency Alert System tone instead (V104), day or night. The same alert never chimes again,
// even when NOAA updates it, and a dismissed one stays quiet.
//
// Quiet at night: from 10 PM to 7 AM only a severe or extreme WARNING makes a sound; advisories
// and watches wait silently on the banner until morning. A wind advisory shouldn't wake anyone.
//
// Menu → ALERT SOUND turns it on or off (on to start). The iPad only lets a page make sound
// after it's been touched once since it opened; if an alert comes in before that, the chime
// plays at the first touch.
(() => {
  const KEY = 'risingcode_alertchime', DONE = 'risingcode_chimed';
  let on = true, chimed = [];
  try { on = localStorage.getItem(KEY) !== 'off'; chimed = JSON.parse(localStorage.getItem(DONE) || '[]'); } catch (e) {}
  const keyOf = (a) => (a.event || '') + '|' + String(a.ends || '').slice(0, 13);
  const warning = (a) => /warning/i.test(a.event || '') && (a.severity === 'Severe' || a.severity === 'Extreme');
  // V104: life-threatening ones get the emergency tone instead, day or night: the two-tone
  // attention signal the Emergency Alert System uses (853 and 960 Hz together), for 5 seconds.
  const emergency = (a) => /tornado warning|tsunami warning|extreme wind warning|flash flood emergency|tornado emergency/i.test(a.event || '') || a.severity === 'Extreme';
  const quietHours = (d = new Date()) => d.getHours() >= 22 || d.getHours() < 7;

  let ac = null, pending = 0;
  function ctx() {
    try { if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); } } catch (e) {}
    return ac;
  }
  function note(c, f, t0, len) {
    const o = c.createOscillator(), g = c.createGain(), o2 = c.createOscillator(), g2 = c.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2;   // a soft bell: the note plus a faint octave
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    g2.gain.setValueAtTime(0.0001, t0); g2.gain.exponentialRampToValueAtTime(0.06, t0 + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, t0 + len * 0.6);
    o.connect(g); g.connect(c.destination); o2.connect(g2); g2.connect(c.destination);
    o.start(t0); o2.start(t0); o.stop(t0 + len + 0.05); o2.stop(t0 + len + 0.05);
  }
  function siren(c, t0, len) {
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03);
    g.gain.setValueAtTime(0.22, t0 + len - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len); g.connect(c.destination);
    for (const f of [853, 960]) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(t0); o.stop(t0 + len + 0.05); }
  }
  function play(times) {                           // times: 1 or 2 chimes; 3 means the emergency tone
    const c = ctx(); if (!c) return;
    if (c.state !== 'running') { pending = Math.max(pending, times); try { c.resume(); } catch (e) {} return; }
    if (times >= 3) { siren(c, c.currentTime + 0.05, 5); return; }
    let t = c.currentTime + 0.05;
    for (let k = 0; k < times; k++) {
      [659.25, 830.61, 987.77].forEach((f, i) => note(c, f, t + i * 0.22, 1.3));   // E, G sharp, B: rising, friendly, not an alarm
      t += 1.6;
    }
  }
  // The first touch after opening unlocks sound; a chime that was waiting plays then.
  const unlock = () => {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // play even with the iPad on silent, like a video
    const c = ctx(); if (!c) return;
    // Older iPads only truly turn sound on if something plays during the touch itself (V105).
    try { const blip = c.createBufferSource(); blip.buffer = c.createBuffer(1, 1, 22050); blip.connect(c.destination); blip.start(0); } catch (e) {}
    const go = () => { if (pending) { const n = pending; pending = 0; play(n); } };
    if (c.state !== 'running') { try { c.resume().then(go, () => {}); } catch (e) {} } else go();
  };
  for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { capture: true, passive: true });

  // V105: UPDATED. NOAA often re-sends the same alert with new wording. That doesn't chime, but
  // the banner says UPDATED until the alert page has been opened again.
  let texts = {};
  try { texts = JSON.parse(localStorage.getItem('risingcode_alerttext') || '{}') || {}; } catch (e) {}
  const hash = (a) => { let h = 5381; for (const ch of (a.headline || '') + '|' + (a.description || '') + '|' + (a.instruction || '')) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h.toString(36); };
  const saveTexts = () => { const keys = Object.keys(texts); if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => delete texts[k]); try { localStorage.setItem('risingcode_alerttext', JSON.stringify(texts)); } catch (e) {} };
  function track(list) {
    for (const a of list || []) {
      const k = keyOf(a), h = hash(a);
      if (!texts[k]) texts[k] = { h, read: h }; else texts[k].h = h;
    }
    saveTexts();
  }
  function check(list) {
    track(list);
    let times = 0;
    for (const a of list || []) {
      const k = keyOf(a);
      if (chimed.includes(k)) continue;
      chimed.push(k);
      if (quietHours() && !warning(a) && !emergency(a)) continue;
      times = Math.max(times, emergency(a) ? 3 : warning(a) ? 2 : 1);
    }
    chimed = chimed.slice(-60);
    try { localStorage.setItem(DONE, JSON.stringify(chimed)); } catch (e) {}
    if (times && on) play(times);
  }
  window.AlertChime = {
    check,
    updated: (a) => { const t = texts[keyOf(a)]; return !!t && t.h !== t.read; },
    read: (a) => { const t = texts[keyOf(a)]; if (t && t.read !== t.h) { t.read = t.h; saveTexts(); } },
    on: () => on,
    set(v) { on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} if (on) play(1); },   // turning it on plays a sample
  };
})();
