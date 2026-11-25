// FIRST TIME (Nov 24, 2026; one line since V93): the very first time the app opens on a
// device, it says only to swipe down from the center for settings and instructions (the menu,
// with HOW IT WORKS at the top). Swiping down there opens the menu; a tap just closes it. It
// never shows again on that device. Preview it with ?intro on the address.
(() => {
  const KEY = 'risingcode_seen_intro';
  let seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (seen && !/[?&]intro\b/.test(location.search)) return;

  const style = document.createElement('style');
  style.textContent = `
  #intro { position: fixed; inset: 0; z-index: 12; background: rgba(4,7,11,0.86); color: #e8eef4; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px;
    font: 600 16px/1.4 ui-monospace, Menlo, monospace; letter-spacing: 0.06em; transition: opacity 0.6s ease; }
  #intro.bye { opacity: 0; pointer-events: none; }
  #intro .arrow { font-size: 64px; line-height: 1; font-weight: 400; color: #ffb84a; animation: nudge 1.4s ease-in-out infinite; }
  @keyframes nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(12px); } }
  #intro .big { font-size: 24px; font-weight: 800; letter-spacing: 0.1em; margin-top: 18px; max-width: 640px; }
  #intro .small { color: #9fb0c0; font-size: 15px; font-weight: 500; margin-top: 10px; letter-spacing: 0.08em; }
  #intro .go { position: absolute; bottom: calc(80px + env(safe-area-inset-bottom, 0px)); color: #9fb0c0; font-size: 13px; letter-spacing: 0.12em; }`;
  document.head.appendChild(style);

  // V93: one line only. Everything else is in Menu → HOW IT WORKS.
  const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'How to start');
  el.innerHTML = `
    <div class="arrow">↓</div>
    <div class="big">SWIPE DOWN FROM THE CENTER OF THE SCREEN</div>
    <div class="small">for settings and instructions</div>
    <div class="go">OR TAP ANYWHERE TO START</div>`;
  document.body.appendChild(el);

  let done = false, y0 = null;
  const bye = (openMenu) => {
    if (done) return; done = true;
    try { localStorage.setItem(KEY, '1'); } catch (e2) {}
    el.classList.add('bye'); setTimeout(() => el.remove(), 700);
    if (openMenu && window.Menu) Menu.open();
  };
  // Doing what it says (a swipe down on the guide itself) opens the menu right away.
  el.addEventListener('touchstart', (e) => { e.stopPropagation(); y0 = e.changedTouches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => { e.stopPropagation(); if (y0 !== null && e.changedTouches[0].clientY - y0 > 80) bye(true); y0 = null; }, { passive: true });
  el.addEventListener('mousedown', (e) => { e.stopPropagation(); y0 = e.clientY; });
  el.addEventListener('mouseup', (e) => { e.stopPropagation(); if (y0 !== null && e.clientY - y0 > 80) bye(true); y0 = null; });
  el.addEventListener('click', (e) => { e.stopPropagation(); bye(false); });
})();
