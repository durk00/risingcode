// MENU (Nov 24, 2026): swipe down on any scene to open it; swipe up or tap the ✕ to
// close. Nothing shows on the scenes themselves. A first version, to be designed
// further:
//   EMERGENCIES (V145) at the top, centered between MENU and the ✕: opens Respond's
//             emergency steps (respond.js), terms first every time
//   SOUND     which sound plays when the radar catches Santa (the same four as
//             tapping the Christmas display: toot, Jingle Bells, icicles, silent)
//   SCREENSAVER (V49) Christmas display or plain code rain, or Auto by the season (index.html)
//   NIGHT CLOCK (V42) the hours the dim night clock covers the screen (nightclock.js)
//   LOCATION (V66) where this iPad is, or Happy Valley, PA (place.js)
//   AROUND HAPPY VALLEY (V33) upcoming local events, each with its source named
//             and linked. Only the YMCA of Centre County's local events calendar
//             (its public Events API, which a browser may read) works from this page; no
//             local news feed does (see README). Fetched when the menu opens, kept 15 min.
//   MY CORNER the personal wildcard: one thing picked for this household's own
//             interests. Off or Verses for the week (V149: the Poem of the day and
//             What can I make? placeholders are gone). The pick is remembered on this device.
//   SHIELD (V148) at the very bottom, under My Corner: opens shield.html (Shield's checks from public
//             records, no AI). It replaces V146's LOOK IT UP section, so there is one way in.
//             V150: a SHIELD heading like the other sections, and a box styled like the other menu
//             boxes: an amber shield, Consumer Protection, BUILT INTO OUTSIDE IN under it.
// index.html opens and closes it and hands it the sound controls (Menu.connect).
(() => {
  const WILDCARDS = [
    { id: 'none', name: 'Off', note: 'SHOW NOTHING HERE' },   // V48: was "Nothing"; it's the off switch for My Corner
    { id: 'verses', name: 'Verses for the week', note: 'KING JAMES' },   // V47, verses.js
  ];
  // V148: a plain shield for the SHIELD button. V150: amber (the app's amber), dark check, on the dark box.
  const SHIELD_MARK = '<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2 L37 8 V21 C37 32 30 40 20 44 C10 40 3 32 3 21 V8 Z" fill="#ffa21f" stroke="#ffa21f" stroke-width="2.5" stroke-linejoin="round"/><path d="M12.5 22.5 L18 28 L28.5 16.5" fill="none" stroke="#0b1520" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let wild = 'none';
  // V149: a pick that's no longer offered (the old Poem of the day or What can I make?) falls back to Off,
  // and the stale pick is cleared so this device remembers Off from now on.
  try {
    const saved = localStorage.getItem('risingcode_wildcard');
    if (WILDCARDS.some(w => w.id === saved)) wild = saved;
    else if (saved !== null) localStorage.removeItem('risingcode_wildcard');
  } catch (e) {}
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
  #menu .allow { width: 100%; margin: 0 0 12px; text-align: center; font-weight: 800; letter-spacing: 0.1em; }   /* V128: a plain button, not an amber outline that reads like a warning */
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
  /* V145: EMERGENCIES at the top, centered between MENU and the ✕ (William's spot): the blue Star of Life
     on a white disc, the word beside it. The header becomes three columns so it stays truly centered. */
  #menu header.three { display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; }
  #menu header.three .x { justify-self: end; }
  #menu .em { display: flex; align-items: center; gap: 10px; padding: 6px 14px 6px 6px; border-radius: 30px;
    background: #121a23; border: 2px solid #ffffff; color: #e8eef4; font: 800 15px ui-monospace, monospace; letter-spacing: 0.1em;
    cursor: pointer; min-height: 52px; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
  #menu .em .disc { flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; }
  #menu .em .disc svg { width: 30px; height: 30px; display: block; }
  #menu .em:active { background: #1e2a37; }
  @media (max-width: 380px) { #menu .em { font-size: 13px; letter-spacing: 0.06em; padding-right: 10px; gap: 7px; } #menu header.three { gap: 6px; } }
  /* V148: SHIELD at the bottom of the menu (William's spot, under My Corner).
     V150: styled like the other menu boxes (dark, thin border, same font and corners) instead of white. */
  #menu .shieldbtn { display: flex; align-items: center; gap: 14px; padding: 14px 16px; min-height: 56px;
    border-radius: 10px; background: #121a23; color: #e8eef4; border: 2px solid #243241; text-decoration: none;
    font: 600 16px ui-monospace, monospace; cursor: pointer; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
  #menu .shieldbtn:active { background: #1e2a37; border-color: #ffffff; }
  #menu .shieldbtn svg { flex-shrink: 0; width: 26px; height: 30px; display: block; }
  #menu .shieldbtn .t { display: block; }
  #menu .shieldbtn .s { display: block; color: #93a4b4; font-size: 11px; margin-top: 4px; letter-spacing: 0.1em; }
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
  // V98: the events calendar is Happy Valley's, so the section only shows when this iPad is
  // set to Happy Valley or is actually within about 60 miles of it. Someone in California sees
  // no events section at all, rather than events 2,500 miles away.
  const NEAR = { lat: 40.8473, lon: -77.6858 };
  function nearHome() {
    const P = window.Place; if (!P) return true;
    const R = Math.PI / 180, x = (P.lon - NEAR.lon) * R * Math.cos((P.lat + NEAR.lat) / 2 * R), y = (P.lat - NEAR.lat) * R;
    return 3959 * Math.sqrt(x * x + y * y) < 60;
  }
  async function loadLocal() {
    if (!nearHome()) return;
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
    if (!nearHome()) return '';
    const head = '<h2>AROUND HAPPY VALLEY</h2>';   // V96: Happy Valley, not the exact place
    const src = `<p class="src">Source: <a href="${EVENTS_SOURCE.url}" target="_blank" rel="noopener">${EVENTS_SOURCE.name}</a> events calendar. Local news isn't available here yet.</p>`;
    if (local.state === 'loading' || local.state === 'idle') return head + '<p class="help">Loading events…</p>' + src;
    if (local.state === 'error') return head + '<p class="help">Couldn’t load events right now. It will try again the next time the menu opens.</p>' + src;
    if (!local.items.length) return head + '<p class="help">No upcoming local events are listed.</p>' + src;
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
  // V100: ALLOW LOCATION, right in the menu, for anyone who missed or said no to the iPad's question.
  // Tapping it asks the iPad again. If the iPad still says no (it remembers a no), it says where to
  // turn it on. Hidden once the app knows where the iPad is.
  let askedHere = false;
  function allowHtml() {
    const P = window.Place; if (!P) return '';
    const st = P.status(), m = P.mode();
    // V129: shown whenever the app isn't using where the iPad is, so anyone can say yes to location
    // (V128 hid it on Happy Valley; William wants it there to invite people to allow it).
    if ((m === 'here' && st === 'ok') || st === 'outside') return '';
    if (m === 'here' && st === 'checking') return '<p class="help">Asking the iPad…</p>';
    const no = askedHere && m === 'here' && st === 'denied';
    return `<button class="opt allow" data-allowloc="1">ALLOW LOCATION<small>USE WHERE THIS iPAD IS FOR THE WEATHER, THE SKY AND THE RADIO</small></button>` +
      (m === 'here' && st === 'unavailable' ? '<p class="help">The iPad didn’t answer, so it’s showing Happy Valley. In Safari, open the page menu beside the address bar (it may show <b>aA</b>), then Website Settings → Location → Allow, and tap ALLOW LOCATION again.</p>' : '') +
      (no ? '<p class="help">The iPad still says no. Turn it on in Settings → Privacy &amp; Security → Location Services → Safari Websites → While Using the App, then tap ALLOW LOCATION again.</p>' : '');
  }
  if (window.Place) Place.onChange(() => { if (open) render(); });
  function render() {
    const names = sound ? sound.names : [];
    const cur = sound ? sound.get() : -1;
    el.innerHTML = `<div class="wrap">
      <header class="${window.Respond ? 'three' : ''}"><h1>MENU</h1>${window.Respond ? `<button class="em" data-emergency="1" aria-label="Emergencies: step-by-step emergency protocols"><span class="disc">${Respond.mark}</span><span>EMERGENCIES</span></button>` : ''}<button class="x" aria-label="Close menu">✕</button></header>
      ${window.HowTo ? `<div class="opts"><button class="opt" data-howto="1">HOW THE APP WORKS<small>WHAT EVERYTHING DOES, IN PLAIN ENGLISH</small></button></div>` : ''}
      ${window.Saver ? `<h2>SCREENSAVER</h2>
      <p class="help">The screen one swipe right of Home: the Christmas display, code rain, the Earth or the portrait.</p>
      <div class="opts">${Saver.options().map(o => `<button class="opt${o.id === Saver.get() ? ' on' : ''}" data-saver="${o.id}">${o.name}<small>${o.note}</small></button>`).join('')}</div>` : ''}
      ${window.AlertChime ? `<h2>ALERT SOUND</h2>
      <p class="help">A short chime when a new weather alert comes in. From 10 PM to 7 AM only serious warnings chime.</p>
      <div class="opts">${[['on', 'On'], ['off', 'Off']].map(([id, n]) => `<button class="opt${(id === 'on') === AlertChime.on() ? ' on' : ''}" data-chime="${id}">${n}</button>`).join('')}</div>` : ''}
      <h2>SOUND</h2>
      <p class="help">What plays on the Christmas display when the radar catches Santa.</p>
      <div class="opts">${names.map((n, i) => `<button class="opt${i === cur ? ' on' : ''}" data-sound="${i}">${n}</button>`).join('')}</div>
      ${window.NightClock ? `<h2>NIGHT CLOCK</h2>
      <p class="help">During these hours the screen becomes a big, dim clock. Tap it to wake the app for 5 minutes.</p>
      <div class="opts">${NightClock.options().map(o => `<button class="opt${o.id === NightClock.get() ? ' on' : ''}" data-night="${o.id}">${o.name}</button>`).join('')}</div>` : ''}
      ${window.Place ? `<h2>LOCATION</h2>
      ${allowHtml()}<p class="help">Whose weather, alerts and daylight to show. The spot stays on this iPad and only goes to NOAA. US only.</p>
      <div class="opts">${Place.options().map(o => `<button class="opt${o.id === Place.mode() ? ' on' : ''}" data-place="${o.id}">${o.name}<small>${o.note}</small></button>`).join('')}</div>` : ''}
      ${localHtml()}
      <h2>MY CORNER</h2>
      <p class="help">One thing just for this household. Picked here, remembered on this device.</p>
      <div class="opts">${WILDCARDS.map(w => `<button class="opt${w.id === wild ? ' on' : ''}" data-wild="${w.id}">${w.name}${w.note ? `<small>${w.note}</small>` : ''}</button>`).join('')}</div>
      ${wild === 'verses' ? versesHtml() : ''}
      <h2>SHIELD</h2>
      <p class="help">Look up restaurants, vehicles, contractors and businesses in public records.</p>
      <a class="shieldbtn" href="shield.html" aria-label="Shield, Consumer Protection, built into Outside In: look up restaurants, vehicles, contractors and businesses in public records">${SHIELD_MARK}<span><span class="t">Consumer Protection</span><span class="s">BUILT INTO OUTSIDE IN</span></span></a>
      <footer>TAP ✕ TO CLOSE, OR AT THE BOTTOM GIVE IT A GOOD SWIPE UP</footer></div>`;
  }
  // THE HIDDEN g SWITCH (V71): tap the word MENU 5 times quickly to turn the g page on (or off)
  // on this iPad. An app added to the home screen keeps its own storage, separate from
  // Safari, so turning g on with ?g=on in Safari doesn't reach the home-screen icon.
  let gTaps = 0, gTapAt = 0;
  el.addEventListener('click', (e) => {
    if (!e.target.closest('h1')) return;
    const now = Date.now(); gTaps = now - gTapAt < 1500 ? gTaps + 1 : 1; gTapAt = now;
    if (gTaps < 5) return;
    gTaps = 0;
    let on = false; try { on = localStorage.getItem('risingcode_g') === 'on'; if (on) localStorage.removeItem('risingcode_g'); else localStorage.setItem('risingcode_g', 'on'); } catch (e2) {}
    const h = el.querySelector('h1'); if (h) h.textContent = on ? 'g OFF' : 'g ON';
    setTimeout(() => location.reload(), 700);
  });
  el.addEventListener('click', (e) => {
    e.stopPropagation();                         // menu taps never reach the scenes
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('x')) { Menu.close(); return; }
    if (b.dataset.emergency && window.Respond) { Menu.close(); Respond.open(); return; }   // V145: the menu slides away under Respond's terms
    if (b.dataset.howto && window.HowTo) { HowTo.open(); return; }   // V89
    if (b.dataset.chime && window.AlertChime) { AlertChime.set(b.dataset.chime === 'on'); render(); }   // V103
    if (b.dataset.sound !== undefined && sound) { sound.set(+b.dataset.sound); render(); }
    if (b.dataset.saver && window.Saver) { Saver.set(b.dataset.saver); render(); }
    if (b.dataset.night && window.NightClock) { NightClock.set(b.dataset.night); render(); }
    if (b.dataset.allowloc && window.Place) { askedHere = true; Place.set('here'); render(); return; }
    if (b.dataset.place && window.Place) { Place.set(b.dataset.place); render(); }
    if (b.dataset.wild) { wild = b.dataset.wild; try { localStorage.setItem('risingcode_wildcard', wild); } catch (e2) {} render(); }
  });

  // V148: on an older iPad, Safari can drop the click after a touch on a scrolling page, so the
  // SHIELD button opens on the finger's lift (like the alert ✕ in V144 and the radio bar in V145).
  // A finger that slides more than about an inch is a scroll, not a tap, and opens nothing.
  let shX = null, shY = 0;
  el.addEventListener('touchstart', (e) => { const p = e.changedTouches[0]; shX = e.target.closest('.shieldbtn') ? p.clientX : null; shY = p.clientY; }, { passive: true });
  el.addEventListener('touchcancel', () => { shX = null; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    const p = e.changedTouches[0], x0 = shX; shX = null;
    if (x0 === null || e.touches.length || !e.target.closest('.shieldbtn') || Math.hypot(p.clientX - x0, p.clientY - shY) > 30) return;
    if (e.cancelable) e.preventDefault();
    location.href = 'shield.html';
  }, { passive: false });

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
