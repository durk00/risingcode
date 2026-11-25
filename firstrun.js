// FIRST TIME (Nov 24, 2026): the very first time the app opens on a device, a one-time
// guide shows how to get around: an arrow pointing down for the settings menu, arrows to
// the sides for the other screens, and what a tap does. One tap anywhere closes it and it
// never shows again on that device. Preview it with ?intro on the address.
(() => {
  const KEY = 'risingcode_seen_intro';
  let seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (seen && !/[?&]intro\b/.test(location.search)) return;

  const style = document.createElement('style');
  style.textContent = `
  #intro { position: fixed; inset: 0; z-index: 12; background: rgba(4,7,11,0.88); color: #e8eef4; cursor: pointer;
    font: 600 16px/1.4 ui-monospace, Menlo, monospace; letter-spacing: 0.06em; transition: opacity 0.6s ease; }
  #intro.bye { opacity: 0; pointer-events: none; }
  #intro .tip { position: absolute; text-align: center; }
  #intro .arrow { font-size: 54px; line-height: 1; font-weight: 400; }
  #intro .big { font-size: 20px; font-weight: 800; letter-spacing: 0.1em; }
  #intro .small { color: #9fb0c0; font-size: 13px; font-weight: 500; margin-top: 4px; }
  #intro .down { top: calc(26px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); }
  #intro .down .arrow { animation: nudge 1.4s ease-in-out infinite; }
  @keyframes nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
  #intro .left { left: max(18px, env(safe-area-inset-left, 0px)); top: 50%; transform: translateY(-50%); max-width: 26vw; text-align: left; }
  #intro .right { right: max(18px, env(safe-area-inset-right, 0px)); top: 50%; transform: translateY(-50%); max-width: 26vw; text-align: right; }
  #intro .mid { left: 50%; top: 50%; transform: translate(-50%, -50%); max-width: 40vw; }
  #intro .go { bottom: calc(40px + env(safe-area-inset-bottom, 0px)); left: 50%; transform: translateX(-50%); border: 2px solid #ffffff; border-radius: 10px; padding: 12px 22px; }`;
  document.head.appendChild(style);

  const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'How to use the app');
  el.innerHTML = `
    <div class="tip down"><div class="arrow">↓</div><div class="big">SWIPE DOWN FOR SETTINGS</div><div class="small">sound, night clock, local events, my corner</div></div>
    <div class="tip left"><div class="arrow">←</div><div class="big">SWIPE LEFT</div><div class="small">Christmas → Winter → Weather station → Kitchen</div></div>
    <div class="tip right"><div class="arrow">→</div><div class="big">SWIPE RIGHT</div><div class="small">to go back</div></div>
    <div class="tip mid"><div class="big">TAP THE SCREEN</div><div class="small">Christmas: sound on, tap again to change it<br>Winter: the three-day forecast<br>Swipe up from the middle: radio and TV</div></div>
    <div class="tip go big">TAP ANYWHERE TO START<div class="small">Full instructions any time: Menu → HOW IT WORKS</div></div>`;
  document.body.appendChild(el);

  for (const ev of ['touchstart', 'touchend', 'mousedown', 'mouseup']) el.addEventListener(ev, (e) => e.stopPropagation());
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    try { localStorage.setItem(KEY, '1'); } catch (e2) {}
    el.classList.add('bye'); setTimeout(() => el.remove(), 700);
  });
})();
