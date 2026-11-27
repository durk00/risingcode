// RADIO DIMS WHEN LEFT ALONE (Nov 25, 2026, V107): after 30 seconds with no touch, the radio
// fades almost away so the scene shows through and the screen is easier on the eyes. The buttons
// are still there; touch anywhere on it and it comes right back. The lit dial stays (V109),
// a little brighter, glowing on its own like an old radio left on in a dark room. That first touch only wakes it,
// so it never presses a button by accident. The TV never dims while it's showing (you're
// watching it), only the radio side does.
(() => {
  const css = document.createElement('style');
  css.textContent = `
  #radio { transition: background-color 1.2s ease; }
  /* V109: everything fades except the lit dial, which stays glowing like a radio in a dark room. */
  #radio .set { background: transparent; isolation: isolate; transition: border-color 1.2s ease, box-shadow 1.2s ease; }
  #radio .set::before { content: ''; position: absolute; inset: 0; border-radius: inherit; z-index: -1;
    background: linear-gradient(#24272c, #15171a); transition: opacity 1.2s ease; }
  #radio .set > *, #radio .radiobody > * { transition: opacity 1.2s ease; }
  #radio .dial { transition: box-shadow 1.2s ease, border-color 1.2s ease; }
  #radio.dim { background-color: rgba(5,8,12,0.25); }
  #radio.dim .set { border-color: transparent; box-shadow: none; }
  #radio.dim .set::before { opacity: 0.1; }
  #radio.dim .set > *:not(.radiobody), #radio.dim .radiobody > *:not(.dial) { opacity: 0.16; }
  #radio.dim .dial { border-color: #1a1208; box-shadow: 0 0 34px 6px rgba(255,170,70,0.28); }`;
  document.head.appendChild(css);
  const IDLE = 30e3;
  let timer = null, el = null;
  const isTV = () => el.classList.contains('tv');
  function arm() { clearTimeout(timer); timer = setTimeout(() => { if (el.classList.contains('show') && !isTV() && !el.classList.contains('dim')) el.classList.add('dim'); }, IDLE); }
  // V145: the waking touch is swallowed whole, and only it. Before, any click within 0.6 s of
  // the waking touch was thrown away, so a quick second tap (the set lights up, you tap the
  // minimize bar again) did nothing and the bar seemed stuck; now a new touch always counts.
  // One tap sends several events (pointerdown, then touchstart, then the click); the ones that
  // belong to the waking tap are stopped too, so they can't start a swipe or press a button.
  let wokeAt = -1e9, wokeT = -1e9, fresh = true, lastTouch = -1e9;
  const sameTap = (e) => e && Math.abs((e.timeStamp || 0) - wokeT) < 100;
  function wake(e) {
    const now = Date.now();
    if (e && e.type === 'touchstart') lastTouch = now;
    if (el.classList.contains('dim')) {
      el.classList.remove('dim');
      if (e && e.target && e.target.closest && e.target.closest('.pw')) { arm(); return; }   // V110: ⏻ always works, even on the waking touch
      if (e && e.cancelable) e.preventDefault();      // the waking touch doesn't press anything
      if (e) e.stopPropagation();
      wokeAt = now; wokeT = e ? e.timeStamp || 0 : -1e9; fresh = false;
    } else if (!fresh && sameTap(e)) {
      e.stopPropagation();                            // the same waking tap's touchstart (after its pointerdown)
    } else if (e && !(e.type === 'mousedown' && now - lastTouch < 1000)) {
      fresh = true;                                   // a new tap (a phone's copy-mouse event after a touch isn't one)
    }
    arm();
  }
  function start() {
    el = document.getElementById('radio'); if (!el) return;
    for (const ev of ['touchstart', 'mousedown', 'pointerdown']) el.addEventListener(ev, wake, { capture: true, passive: false });
    el.addEventListener('click', (e) => { if (!fresh && Date.now() - wokeAt < 600) { fresh = true; e.preventDefault(); e.stopPropagation(); } }, true);
    let was = '';
    new MutationObserver(() => {
      const now = (el.classList.contains('show') ? 's' : '') + (isTV() ? 't' : '');
      if (now === was) return;                       // only react when open/closed or RADIO/TV changes (changing classes here would loop)
      was = now;
      if (el.classList.contains('dim')) el.classList.remove('dim');
      clearTimeout(timer); if (now === 's') arm();
    })
      .observe(el, { attributes: true, attributeFilter: ['class'] });
    arm();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
