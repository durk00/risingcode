// EMERGENCIES (Nov 26, 2026): Respond, William's step-by-step emergency protocol app, inside Outside In.
//
// EMERGENCIES sits at the top of the menu (swipe down), centered between MENU and the ✕: the blue Star of
// Life on a white disc with the word EMERGENCIES beside it (at first it was a round button on Home; William wanted it off the
// screen and at the top of the menu). Tapping it closes the menu and opens the same full interface as Respond (durk00/respond), in this app's own code,
// so it works here with no Base44, no login and no other site:
//   terms of use first (Respond's wording, word for word), every time it opens, and nothing goes on
//   until the person taps "Yes — I Understand and Accept"; then Respond's home (EMERGENCY, "I'm not
//   sure what's happening", Call 911, Local Health Alerts), the categories and situations, the
//   Call 911 First screen, and the protocol steps, read aloud, with Say "What's next?" / "Go back" /
//   "Repeat" by voice where the browser can listen, and the same buttons on screen where it can't.
// The protocols and every word of them come from respond-data.js, which is copied from Respond, not
// written here. Respond's code still lists two protocols as DRAFT (Unresponsive but Breathing, Child
// CPR); William, a former EMT, signed off on their wording as written on Nov 26, 2026, so no DRAFT tag
// shows here. If any protocol's words change, it needs a responder's review again.
//
// Every control is a real <button> or link, so an older iPad's Safari turns a tap into a click
// (the lesson of the alert ✕, V144). Touches and clicks inside stay inside: they never reach the
// scene, the menu swipe, the radio swipe or the forecast tap.
(() => {
  const D = window.RESPOND_DATA;
  if (!D) return;
  const CATS = D.CATEGORIES, PROTOCOLS = D.PROTOCOLS, FLOW = D.UNSURE_FLOW, FOLLOW = D.UNSURE_FOLLOWUPS;
  const DRAFT = [];   // was D.DRAFT_IDS: William signed off on both drafts' wording, unchanged, Nov 26, 2026
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);   // iPadOS 13+ says it's a Mac
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const find = (cat, id) => { const l = PROTOCOLS[cat] || []; for (let i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; };

  // ── ICONS (Respond's own drawings) ───────────────────────────────────────
  const PHONE = '<path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.36 11.36 0 003.54.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.56 3.54 1 1 0 01-.27 1.11l-2.17 2.14z"/>';
  const PLUS = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>';
  const ARROW_L = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg>';
  const CHEV_R = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>';
  const WARN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" style="flex-shrink:0;margin-top:2px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  const MIC = (c) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  const SPK_ON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>';
  const SPK_OFF = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  // The menu entry's mark: the Star of Life (the blue six-armed star with the staff and serpent
  // of Asclepius seen on U.S. ambulances), on the white round button, William's choice. Not a red cross:
  // a red cross on white is the Red Cross emblem, which U.S. law (18 U.S.C. 706) reserves for the
  // American Red Cross and military medical services. One place to change it.
  const MARK = '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="#0b4ea2" stroke="#fff" stroke-width="2.5">' +
    '<rect x="38" y="3" width="24" height="94" rx="2"/><rect x="38" y="3" width="24" height="94" rx="2" transform="rotate(60 50 50)"/>' +
    '<rect x="38" y="3" width="24" height="94" rx="2" transform="rotate(120 50 50)"/></g>' +
    '<rect x="38.5" y="4.5" width="23" height="91" fill="#0b4ea2"/><rect x="38.5" y="4.5" width="23" height="91" fill="#0b4ea2" transform="rotate(60 50 50)"/>' +
    '<rect x="38.5" y="4.5" width="23" height="91" fill="#0b4ea2" transform="rotate(120 50 50)"/>' +
    '<g stroke="#fff" fill="none" stroke-linecap="round"><line x1="50" y1="18" x2="50" y2="86" stroke-width="5"/>' +
    '<path d="M53 27 C63 29 63 36 50 39 C37 42 37 49 50 52 C63 55 63 62 50 65 C39 68 40 74 48 77" stroke-width="4"/></g>' +
    '<ellipse cx="51" cy="25.5" rx="5" ry="3.6" fill="#fff"/></svg>';

  const css = document.createElement('style');
  css.textContent = `
  #respond { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 14; display: none; background: #000; color: #fff; overflow-y: auto; -webkit-overflow-scrolling: touch;
    font: 16px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }
  #respond.show { display: block; }
  #respond * { box-sizing: border-box; }
  #respond button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  #respond a { color: inherit; text-decoration: none; }
  #respond .scr { min-height: 100%; width: 100%; max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; padding: 28px 22px 24px; }
  #respond .center { align-items: center; justify-content: center; text-align: center; }
  #respond .col { display: flex; flex-direction: column; gap: 12px; width: 100%; }
  #respond .top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 22px; }
  #respond .back { display: flex; align-items: center; gap: 6px; background: none; border: 0; padding: 4px 12px 4px 0; color: #9ca3af; font-size: 14px; font-weight: 500; text-align: left; }
  #respond .close { background: #111; border: 1px solid #333; border-radius: 12px; padding: 8px 14px; color: #d1d5db; font-size: 14px; font-weight: 600; white-space: nowrap; }
  #respond .logo { width: 80px; height: 80px; border-radius: 18px; background: #dc2626; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(127,29,29,0.6); }
  #respond h1 { font-size: 36px; font-weight: 900; margin: 10px 0 4px; letter-spacing: -0.02em; }
  #respond h2 { font-size: 24px; font-weight: 900; margin: 0 0 4px; }
  #respond .sub { color: #6b7280; font-size: 14px; margin: 0; }
  #respond .card { width: 100%; padding: 18px; border-radius: 16px; background: #0a0a0a; border: 1px solid #262626; text-align: left; }
  #respond .card p { margin: 0; }
  #respond .card p + p { margin-top: 12px; }
  #respond .t3 { color: #d1d5db; font-size: 14px; line-height: 1.6; }
  #respond .t4 { color: #9ca3af; font-size: 12px; line-height: 1.6; }
  #respond .w { color: #fff; font-weight: 600; }
  #respond .r9 { color: #f87171; font-weight: 700; }
  #respond .big { width: 100%; padding: 18px; border: 0; border-radius: 16px; background: #dc2626; color: #fff; font-weight: 900; font-size: 18px; box-shadow: 0 6px 18px rgba(127,29,29,0.4); }
  #respond .ghost { width: 100%; padding: 15px; border-radius: 16px; border: 1px solid #262626; background: #0a0a0a; color: #fff; font-weight: 600; font-size: 17px; }
  #respond .link { background: none; border: 0; color: #9ca3af; font-size: 14px; font-weight: 500; text-decoration: underline; text-underline-offset: 4px; padding: 6px; }
  #respond .emerg { width: 100%; padding: 22px; border: 0; border-radius: 26px; color: #fff; font-weight: 900; font-size: 24px;
    background: radial-gradient(ellipse at 40% 35%, #f87171, #b91c1c); box-shadow: 0 12px 34px rgba(127,29,29,0.6); display: flex; flex-direction: column; align-items: center; gap: 2px; }
  #respond .emerg small { font-size: 15px; font-weight: 600; opacity: 0.8; }
  #respond .call { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 16px; border: 1px solid #262626; background: #0a0a0a; font-weight: 600; }
  #respond .row { display: flex; align-items: center; gap: 14px; width: 100%; padding: 18px; border-radius: 16px; background: #0a0a0a; border: 1px solid #262626; text-align: left; }
  #respond .row .grow { flex: 1; }
  #respond .row b { display: block; font-size: 18px; }
  #respond .row span.n { color: #6b7280; font-size: 14px; }
  #respond .draft { display: inline-block; margin-top: 4px; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(234,179,8,0.5); color: #fde047; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; }
  #respond .bars { display: flex; gap: 6px; margin-bottom: 8px; }
  #respond .bars i { height: 6px; border-radius: 99px; flex: 1; background: #262626; }
  #respond .bars i.on { background: #ef4444; } #respond .bars i.done { background: #7f1d1d; }
  #respond .q { font-size: 28px; font-weight: 900; line-height: 1.3; margin: 0; }
  #respond .hint { color: #fde047; font-size: 14px; font-weight: 600; margin: 10px 0 0; }
  #respond .opt { width: 100%; padding: 15px; border-radius: 16px; text-align: left; font-size: 17px; }
  #respond .opt.p { background: #dc2626; border: 0; font-weight: 900; }
  #respond .opt.s { background: #0a0a0a; border: 1px solid #262626; font-weight: 600; }
  #respond .ring { width: 112px; height: 112px; border-radius: 50%; background: #450a0a; display: flex; align-items: center; justify-content: center; animation: rsPulse 1.4s ease-in-out infinite; }
  #respond .ring div { width: 80px; height: 80px; border-radius: 50%; background: #dc2626; display: flex; align-items: center; justify-content: center; }
  @keyframes rsPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  #respond .ph { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
  #respond .ph .mid { text-align: center; flex: 1; }
  #respond .ph .mid b { display: block; font-size: 14px; }
  #respond .ph .mid span { color: #6b7280; font-size: 12px; }
  #respond .tog { width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #262626; background: #0a0a0a; padding: 0; }
  #respond .tog.on { border-color: #991b1b; background: #450a0a; }
  #respond .prog { height: 6px; background: #171717; border-radius: 99px; overflow: hidden; margin-bottom: 18px; }
  #respond .prog div { height: 100%; background: #dc2626; border-radius: 99px; transition: width 0.35s; }
  #respond .warn { display: flex; gap: 12px; padding: 16px; border-radius: 16px; background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.3); }
  #respond .warn p { margin: 0; color: #fde047; font-size: 14px; font-weight: 600; line-height: 1.6; }
  #respond .num { display: flex; align-items: center; gap: 12px; }
  #respond .num b { width: 48px; height: 48px; border-radius: 50%; background: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; flex-shrink: 0; }
  #respond .num i { height: 1px; flex: 1; background: #262626; }
  #respond .step { font-size: 18px; line-height: 1.6; font-weight: 500; }
  #respond .voice { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; background: rgba(127,29,29,0.35); border: 1px solid #991b1b; }
  #respond .voice b { display: block; font-size: 18px; font-weight: 900; }
  #respond .voice span { color: #fca5a5; font-size: 12px; font-weight: 600; }
  #respond .unlock { width: 100%; padding: 18px; border: 0; border-radius: 16px; background: #dc2626; color: #fff; font-size: 20px; font-weight: 900; animation: rsPulse 1.4s ease-in-out infinite; }
  #respond .disc { display: flex; gap: 8px; align-items: flex-start; padding: 8px 12px; border-radius: 12px; background: #0a0a0a; border: 1px solid #262626; margin-top: 16px; }
  #respond .disc p { margin: 0; color: #6b7280; font-size: 12px; line-height: 1.4; }
  #respond .nav { display: flex; gap: 12px; padding-top: 14px; }
  #respond .nav button { flex: 1; padding: 16px; border-radius: 16px; font-size: 16px; }
  #respond .nav .gb { background: #0a0a0a; border: 1px solid #262626; font-weight: 700; }
  #respond .nav .nx { background: #dc2626; border: 0; font-weight: 900; }
  #respond .list { border-top: 1px solid #171717; margin-top: 8px; padding-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  #respond .list button { display: flex; gap: 12px; align-items: flex-start; padding: 10px 12px; border-radius: 12px; border: 1px solid transparent; background: none; text-align: left; color: #6b7280; font-size: 14px; }
  #respond .list button.cur { background: #450a0a; border-color: #7f1d1d; color: #fff; }
  #respond .list button em { font-style: normal; width: 24px; height: 24px; border-radius: 50%; background: #262626; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  #respond .list button.cur em, #respond .list button.past em { background: #b91c1c; color: #fff; }
`;
  document.head.appendChild(css);

  const el = document.createElement('div');
  el.id = 'respond'; el.setAttribute('aria-hidden', 'true'); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Respond emergency protocols');
  document.body.appendChild(el);
  // Nothing inside reaches the app underneath (the scene's tap, the swipes, the radio, the menu).
  ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'mousedown', 'mouseup', 'wheel'].forEach((t) => {
    el.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
  });

  // ── STATE ────────────────────────────────────────────────────────────────
  let open = false;
  let S = {};   // the screen and what's on it
  function reset() { S = { screen: 'terms', cat: null, id: null, uStep: 0, follow: [], step: 0, tts: true, voice: true, list: false, interacted: !isIOS }; }
  reset();

  // ── VOICE (as in Respond) ────────────────────────────────────────────────
  const synth = window.speechSynthesis || null;
  function speak(text) {
    if (!synth || !window.SpeechSynthesisUtterance) return;
    try { synth.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.92; u.pitch = 1; u.volume = 1; synth.speak(u); } catch (e) {}
  }
  function hush() { if (synth) { try { synth.cancel(); } catch (e) {} } }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, recOn = false;
  function listen(on) {
    if (!SR) return;
    if (on && !recOn) {
      try {
        rec = new SR(); rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US';
        rec.onresult = (e) => {
          const t = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
          if (t.indexOf("what's next") >= 0 || t.indexOf('whats next') >= 0) goNext();
          else if (t.indexOf('go back') >= 0) goBack();
          else if (t.indexOf('repeat') >= 0) goRepeat();
        };
        rec.onerror = () => {};
        rec.onend = () => { if (recOn) { try { rec.start(); } catch (e) {} } };
        recOn = true; rec.start();
      } catch (e) {}
    } else if (!on && recOn) {
      recOn = false; try { rec.stop(); } catch (e) {} rec = null;
    }
  }
  function readStep(force) {
    if (!S.tts) return;
    if (!S.interacted && !force) return;
    const p = find(S.cat, S.id); const s = p && p.steps[S.step];
    if (s) speak('Step ' + (S.step + 1) + '. ' + s);
  }

  // ── SCREENS ──────────────────────────────────────────────────────────────
  const back = (act, label) => `<button type="button" class="back" data-act="${act}">${ARROW_L} ${esc(label)}</button>`;
  const closeBtn = '<button type="button" class="close" data-act="close">✕ Close</button>';
  const draftTag = (id) => DRAFT.indexOf(id) >= 0 ? '<span class="draft">DRAFT — awaiting responder review</span>' : '';

  function vTerms() {
    return `<div class="scr center"><div class="col" style="align-items:center;gap:24px;max-width:384px">
      <div class="logo" style="width:64px;height:64px"><svg width="32" height="32" viewBox="0 0 24 24" fill="white">${PLUS}</svg></div>
      <div><h2>Before You Continue</h2><p class="sub">Please read and accept the terms of use</p></div>
      <div class="card">
        <p class="t3">Respond provides <span class="w">lay rescuer BLS-level guidance only</span>. This app does not diagnose, treat, or replace emergency medical services.</p>
        <p class="t3">By continuing you accept <span class="w">full responsibility for your actions</span> and release the app creator from liability.</p>
        <p class="t4">In any emergency, always call <span class="r9">911</span> first.</p>
        <p class="t4" style="margin-top:8px">If you have not been trained in CPR or first aid, call 911 first — a dispatcher can guide you in real time.</p>
      </div>
      <button type="button" class="big" data-act="accept">Yes — I Understand and Accept</button>
      <button type="button" class="link" data-act="close">Not now — back to Outside In</button>
    </div></div>`;
  }
  function vHome() {
    return `<div class="scr" style="justify-content:space-between;min-height:100vh">
      <div class="top" style="justify-content:flex-end;margin-bottom:0">${closeBtn}</div>
      <div class="col" style="align-items:center;gap:6px;text-align:center">
        <div class="logo"><svg width="44" height="44" viewBox="0 0 24 24" fill="white">${PLUS}</svg></div>
        <h1>Respond</h1><p class="sub" style="max-width:320px">Step-by-step emergency protocols with voice guidance</p>
      </div>
      <div class="col" style="align-items:center;gap:20px;max-width:384px;margin:24px auto">
        <button type="button" class="emerg" data-act="cats"><span>EMERGENCY</span><small>Click Here</small></button>
        <button type="button" class="link" data-act="unsure">I'm not sure what's happening</button>
      </div>
      <div class="col" style="align-items:center;gap:4px">
        <a class="call" href="tel:911"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${PHONE}</svg> Call 911</a>
        <p class="sub" style="color:#4b5563;font-size:12px;margin-top:4px">If life is in immediate danger, call 911 first.</p>
        <button type="button" class="link" data-act="health" style="color:#d1d5db">Local Health Alerts</button>
      </div></div>`;
  }
  function vHealth() {
    const keys = Object.keys(D.STATE_HEALTH_URLS).sort((a, b) => D.STATE_HEALTH_URLS[a].name.localeCompare(D.STATE_HEALTH_URLS[b].name));
    return `<div class="scr"><div class="top">${back('home', 'Home')}${closeBtn}</div>
      <h2>Local Health Alerts</h2><p class="sub" style="margin-bottom:16px">Tap your state to visit its official health department</p>
      <div class="col" style="gap:8px">${keys.map((k) => { const s = D.STATE_HEALTH_URLS[k];
        return `<a class="row" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" style="padding:15px 18px"><span style="color:#ef4444;font-weight:900;font-size:14px;width:28px">${esc(k)}</span><span class="grow" style="font-weight:600">${esc(s.name)}</span></a>`; }).join('')}</div></div>`;
  }
  function vUnsure() {
    const fk = S.follow[S.follow.length - 1], fq = fk ? FOLLOW[fk] : null, q = FLOW[S.uStep];
    const bars = FLOW.map((_, i) => `<i class="${i === S.uStep ? 'on' : i < S.uStep ? 'done' : ''}"></i>`).join('');
    const body = fq
      ? `<div><p class="q">${esc(fq.q)}</p>${fq.hint ? `<p class="hint">${esc(fq.hint)}</p>` : ''}</div>
         <div class="col">${fq.options.map((o, i) => `<button type="button" class="opt ${o.primary ? 'p' : 's'}" data-act="fopt" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>`
      : `<p class="q">${esc(q.q)}</p>
         <div class="col"><button type="button" class="big" data-act="uyes" style="font-size:20px">✓ Yes</button>
         <button type="button" class="ghost" data-act="uno">No — next question</button></div>`;
    return `<div class="scr"><div class="top">${back('ub', 'Go Back To Home Screen')}${closeBtn}</div>
      <div class="bars">${bars}</div><p class="sub" style="font-size:12px;margin-bottom:28px">Question ${S.uStep + 1} of ${FLOW.length}</p>
      <div class="col" style="flex:1;justify-content:center;gap:32px">${body}</div></div>`;
  }
  function vCats() {
    return `<div class="scr"><div class="top">${back('home', 'Go Back To Home Screen')}<span style="color:#4b5563;font-size:12px;font-weight:500;text-align:right;max-width:120px;line-height:1.2">Reminder: Get Familiar With Protocols</span></div>
      <h2>What type of emergency?</h2><p class="sub" style="margin-bottom:24px">Select a category</p>
      <div class="col">${CATS.map((c) => `<button type="button" class="row" data-act="cat" data-id="${esc(c.id)}" style="border-left:4px solid ${esc(c.color)}">
        <span style="font-size:30px">${c.icon}</span><span class="grow"><b>${esc(c.label)}</b><span class="n">${(PROTOCOLS[c.id] || []).length} protocols</span></span>${CHEV_R}</button>`).join('')}</div>
      <div style="margin-top:20px;text-align:center">${closeBtn}</div></div>`;
  }
  function vScen() {
    let cat = null; CATS.forEach((c) => { if (c.id === S.cat) cat = c; });
    const list = PROTOCOLS[S.cat] || [];
    return `<div class="scr"><div class="top">${back('cats', 'Go Back To Home Screen')}${closeBtn}</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px"><span style="font-size:30px">${cat ? cat.icon : ''}</span><h2 style="margin:0">${esc(cat ? cat.label : '')}</h2></div>
      <p class="sub" style="margin-bottom:24px">Choose the specific situation</p>
      <div class="col">${list.map((s) => `<button type="button" class="row" data-act="scen" data-id="${esc(s.id)}">
        <span class="grow"><b>${esc(s.label)}</b><span class="n">${s.steps.length} steps</span>${draftTag(s.id) ? '<br>' + draftTag(s.id) : ''}</span>${CHEV_R}</button>`).join('')}</div></div>`;
  }
  function v911() {
    return `<div class="scr center"><div class="col" style="align-items:center;gap:30px;max-width:384px">
      <div class="ring"><div><svg width="36" height="36" viewBox="0 0 24 24" fill="white">${PHONE}</svg></div></div>
      <div><h2 style="font-size:30px">Call 911 First</h2><p style="color:#9ca3af;margin:12px 0 0;line-height:1.6">Dispatchers can guide you in real time. Call <span class="r9">911</span> before or while following this protocol.</p></div>
      <a class="big" href="tel:911" style="display:flex;align-items:center;justify-content:center;gap:12px;font-size:20px"><svg width="22" height="22" viewBox="0 0 24 24" fill="white">${PHONE}</svg> Call 911 Now</a>
      <button type="button" class="ghost" data-act="proto" style="color:#d1d5db;font-size:16px">Skip — Show me the protocol</button>
      <button type="button" class="link" data-act="b911" style="color:#6b7280">← Scenarios</button>
    </div></div>`;
  }
  function vProto() {
    const p = find(S.cat, S.id); if (!p) return vCats();
    const n = p.steps.length, i = S.step, last = i >= n - 1;
    const vOK = !!SR;
    return `<div class="scr" style="min-height:100vh">
      <div class="ph"><button type="button" class="back" data-act="pcats" style="font-size:12px">${ARROW_L} Categories</button>
        <div class="mid"><b>${esc(p.label)}</b><span>Step ${i + 1} / ${n}</span>${draftTag(p.id) ? '<br>' + draftTag(p.id) : ''}</div>
        <div style="display:flex;gap:8px"><button type="button" class="tog ${S.tts ? 'on' : ''}" data-act="tts" aria-label="Read steps aloud">${S.tts ? SPK_ON : SPK_OFF}</button>
        <button type="button" class="tog ${S.voice ? 'on' : ''}" data-act="voice" aria-label="Voice commands">${MIC(S.voice ? '#ef4444' : '#6b7280')}</button></div></div>
      <div class="prog"><div style="width:${((i + 1) / n) * 100}%"></div></div>
      <div class="col" style="flex:1;gap:16px">
        ${i === 0 && p.warning ? `<div class="warn">${WARN}<p>${esc(p.warning)}</p></div>` : ''}
        <div class="num"><b>${i + 1}</b><i></i></div>
        <div class="card"><p class="step">${esc(p.steps[i])}</p></div>
        ${isIOS && S.tts && !S.interacted && i === 0 ? '<button type="button" class="unlock" data-act="unlock">🔊 Tap to hear the steps</button>' : ''}
        ${S.voice && vOK ? `<div class="voice">${MIC('#fca5a5')}<div><b>Say “What’s next?”</b><span>or “Go back” · “Repeat” — hands-free</span></div></div>` : ''}
        ${S.voice && !vOK ? '<p class="sub" style="font-size:12px;text-align:center">Voice commands aren’t available in this browser — use the buttons below.</p>' : ''}
      </div>
      <div class="disc"><p>This guidance does not replace professional medical advice. Always call 911 first.</p></div>
      <div class="nav"><button type="button" class="gb" data-act="pback">‹ Go Back</button>
        ${last ? '<button type="button" class="nx" data-act="done">Done ✓</button>' : '<button type="button" class="nx" data-act="pnext">What\'s Next ›</button>'}</div>
      <button type="button" class="link" data-act="list" style="text-decoration:none;font-size:12px;color:#6b7280;margin-top:8px">${S.list ? 'Hide' : 'All'} steps</button>
      ${S.list ? `<div class="list">${p.steps.map((s, k) => `<button type="button" class="${k === i ? 'cur' : k < i ? 'past' : ''}" data-act="jump" data-i="${k}"><em>${k < i ? '✓' : k + 1}</em><span>${esc(s.length > 70 ? s.slice(0, 70) + '…' : s)}</span></button>`).join('')}</div>` : ''}
    </div>`;
  }

  function render() {
    const v = { terms: vTerms, home: vHome, health: vHealth, unsure: vUnsure, cats: vCats, scen: vScen, call911: v911, proto: vProto }[S.screen] || vHome;
    el.innerHTML = v();
    el.scrollTop = 0;
    listen(open && S.screen === 'proto' && S.voice);
  }
  function go(screen) {
    if (S.screen === 'proto' && screen !== 'proto') hush();
    S.screen = screen; S.list = false;
    if (screen === 'proto') { S.step = 0; askMic(); }
    render();
    if (screen === 'proto') readStep(false);
  }
  // Respond asks for the microphone when a protocol opens, so "What's next?" can work.
  function askMic() {
    if (!S.voice || !SR) return;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((st) => st.getTracks().forEach((t) => t.stop()))
          .catch(() => { S.voice = false; if (S.screen === 'proto') render(); });
      }
    } catch (e) {}
  }
  function choose(t) {
    if (t.follow) { S.follow.push(t.follow); render(); }
    else if (t.to === 'categories') go('cats');
    else { S.cat = t.cat; S.id = t.id; go('call911'); }
  }
  function goNext() { if (S.screen !== 'proto') return; S.interacted = true; const p = find(S.cat, S.id); if (p && S.step < p.steps.length - 1) { S.step++; render(); readStep(false); } }
  function goBack() { if (S.screen !== 'proto') return; S.interacted = true; if (S.step === 0) go('cats'); else { S.step--; render(); readStep(false); } }
  function goRepeat() { if (S.screen !== 'proto') return; S.interacted = true; readStep(true); }

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest && e.target.closest('[data-act]');
    if (!b) return;
    const a = b.getAttribute('data-act');
    if (a === 'close') return close();
    if (a === 'accept') return go('home');          // the terms were accepted: Respond's home
    if (a === 'home') return go('home');
    if (a === 'cats') return go('cats');
    if (a === 'health') return go('health');
    if (a === 'unsure') { S.uStep = 0; S.follow = []; return go('unsure'); }
    if (a === 'ub') { if (S.follow.length) { S.follow.pop(); return render(); } return go('home'); }
    if (a === 'uyes') return choose(FLOW[S.uStep].yes);
    if (a === 'uno') { if (S.uStep < FLOW.length - 1) { S.uStep++; return render(); } return go('home'); }
    if (a === 'fopt') { const fq = FOLLOW[S.follow[S.follow.length - 1]]; return choose(fq.options[+b.getAttribute('data-i')].go); }
    if (a === 'cat') { S.cat = b.getAttribute('data-id'); return go('scen'); }
    if (a === 'scen') { S.id = b.getAttribute('data-id'); return go('call911'); }
    if (a === 'b911') return go('scen');
    if (a === 'proto') return go('proto');
    if (a === 'pcats') { hush(); return go('cats'); }
    if (a === 'tts') { S.tts = !S.tts; if (!S.tts) hush(); return render(); }
    if (a === 'voice') { S.voice = !S.voice; return render(); }
    if (a === 'unlock') { S.interacted = true; render(); return readStep(true); }
    if (a === 'pnext') return goNext();
    if (a === 'pback') return goBack();
    if (a === 'done') { hush(); return go('cats'); }
    if (a === 'list') { S.list = !S.list; return render(); }
    if (a === 'jump') { S.step = +b.getAttribute('data-i'); S.list = false; render(); return readStep(false); }
  });

  // ── OPEN / CLOSE ─────────────────────────────────────────────────────────
  // Every time it opens it starts at the terms: nothing is shown until "Yes" is tapped again.
  function openR() {
    reset(); open = true;
    el.classList.add('show'); el.setAttribute('aria-hidden', 'false');
    render();
  }
  function close() {
    open = false; hush(); listen(false);
    el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); el.innerHTML = '';
    reset();
  }
  // Keys belong to Respond while it's open; Escape closes it.
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') close();
  }, true);

  window.Respond = {
    mark: MARK,   // the Star of Life, drawn on the menu's EMERGENCIES entry (menu.js)
    open: openR, close, isOpen: () => open,
    debug: () => ({ open, screen: S.screen, cat: S.cat, id: S.id, step: S.step }),
  };
})();
