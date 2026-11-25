// RADIO DIMS WHEN LEFT ALONE (Nov 25, 2026, V107): after 30 seconds with no touch, the radio
// fades almost away so the scene shows through and the screen is easier on the eyes. The buttons
// are still there; touch anywhere on it and it comes right back. That first touch only wakes it,
// so it never presses a button by accident. The TV never dims while it's showing (you're
// watching it), only the radio side does.
(() => {
  const css = document.createElement('style');
  css.textContent = `
  #radio { transition: background-color 1.2s ease; }
  #radio .set { transition: opacity 1.2s ease; }
  #radio.dim { background-color: rgba(5,8,12,0.25); }
  #radio.dim .set { opacity: 0.16; }`;
  document.head.appendChild(css);
  const IDLE = 30e3;
  let timer = null, el = null;
  const isTV = () => el.classList.contains('tv');
  function arm() { clearTimeout(timer); timer = setTimeout(() => { if (el.classList.contains('show') && !isTV() && !el.classList.contains('dim')) el.classList.add('dim'); }, IDLE); }
  function wake(e) {
    if (el.classList.contains('dim')) {
      el.classList.remove('dim');
      if (e && e.cancelable) e.preventDefault();      // the waking touch doesn't press anything
      if (e) e.stopPropagation();
      swallowClick = Date.now();
    }
    arm();
  }
  let swallowClick = 0;
  function start() {
    el = document.getElementById('radio'); if (!el) return;
    for (const ev of ['touchstart', 'mousedown', 'pointerdown']) el.addEventListener(ev, wake, { capture: true, passive: false });
    el.addEventListener('click', (e) => { if (Date.now() - swallowClick < 600) { e.preventDefault(); e.stopPropagation(); } }, true);
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
