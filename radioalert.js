// ALERT OVER THE RADIO (Nov 25, 2026, V123): the radio and TV set covers the scene with a dark
// backdrop, which hid the red weather-alert banner (it only showed faintly through). Now, while
// the set is open, the alert shows on top of it, across the top of the screen, the same red
// banner. Tap it and the set tucks away and the alert's page opens on Home. When the set fades
// after 30 seconds, the strip fades with it (the scene's own banner shows through then), and the
// first touch brings both back.
(() => {
  const css = document.createElement('style');
  css.textContent = `
  #radio .ralert { position: absolute; top: calc(12px + env(safe-area-inset-top, 0px)); left: 16px; right: 16px; z-index: 3; display: none;
    align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; border: 2px solid #ffffff; background: #c81824; color: #ffffff;
    font: 800 16px ui-monospace, Menlo, monospace; letter-spacing: 0.06em; cursor: pointer; transition: opacity 1.2s ease; text-align: left; }
  #radio .ralert.on { display: flex; }
  #radio .ralert small { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; opacity: 0.9; margin-top: 2px; }
  #radio .ralert .tri { font-size: 26px; line-height: 1; }
  #radio.dim .ralert { opacity: 0.12; }
  #radio.has-alert { padding-top: calc(78px + env(safe-area-inset-top, 0px)); box-sizing: border-box; }   /* the set moves down to make room */
  #radio.has-alert .tvbody .screen { max-height: max(160px, calc(100vh - 590px)); }`;
  document.head.appendChild(css);
  function start() {
    const set = document.getElementById('radio'); if (!set) return;
    const el = document.createElement('button'); el.type = 'button'; el.className = 'ralert'; el.setAttribute('aria-label', 'Weather alert');
    set.appendChild(el);
    let last = '';
    const update = () => {
      const a = window.WinterScene && WinterScene.activeAlert ? WinterScene.activeAlert() : null;
      const text = a ? `<span class="tri">⚠</span><span>${a.event.toUpperCase()}${a.count > 1 ? ` (+${a.count - 1})` : ''}<small>${[a.updated ? 'UPDATED' : '', a.ends, 'TAP FOR DETAILS'].filter(Boolean).join(' · ')}</small></span>` : '';
      if (text !== last) { el.innerHTML = text; last = text; }
      el.classList.toggle('on', !!a); set.classList.toggle('has-alert', !!a);
    };
    update(); setInterval(update, 2000);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.Radio) Radio.close();
      if (window.goHome) goHome();
      if (window.WinterScene && WinterScene.openAlert) WinterScene.openAlert();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
