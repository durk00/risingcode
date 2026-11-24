// NIGHT CLOCK (Nov 24, 2026): during the night hours picked in the menu (9 PM to 6 AM unless
// changed), whatever scene is
// up is covered by a big, dim, quiet clock on black: the time, the date, and the moon's
// phase. Tap it to get the app back; after 5 minutes without a tap it returns to the
// clock until morning. It drifts a little every minute so nothing sits in one spot all
// night. Preview it any time with ?night on the address.
(() => {
  const OPTIONS = [
    { id: 'off', name: 'Off' },
    { id: '21-6', name: '9 PM – 6 AM' },
    { id: '22-6', name: '10 PM – 6 AM' },
    { id: '23-7', name: '11 PM – 7 AM' },
  ];
  const AWAKE_MS = 5 * 60 * 1000;
  const preview = /[?&]night\b/.test(location.search);
  let pick = '21-6';   // V43: starts at 9 PM by default, which suits winter and summer alike
  try { if (OPTIONS.some(o => o.id === localStorage.getItem('risingcode_night'))) pick = localStorage.getItem('risingcode_night'); } catch (e) {}
  let awakeUntil = 0, showing = false;

  const style = document.createElement('style');
  style.textContent = `
  #nightclock { position: fixed; inset: 0; z-index: 9; background: #000; display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none; transition: opacity 1.2s ease; cursor: pointer; }
  #nightclock.on { opacity: 1; pointer-events: auto; }
  #nightclock .face { text-align: center; transition: transform 2s ease; font-family: ui-monospace, Menlo, monospace; }
  /* Dim grey on black: readable across a dark room without lighting it up. */
  #nightclock .time { color: #707c89; font-weight: 300; font-size: min(26vw, 42vh); line-height: 1; letter-spacing: -0.02em; }
  #nightclock .ampm { font-size: 0.22em; letter-spacing: 0.05em; margin-left: 0.15em; }
  #nightclock .date { color: #4c5763; font-size: min(3.4vw, 4.4vh); letter-spacing: 0.14em; margin-top: 2vh; }
  #nightclock .wake { color: #3a434d; font-size: min(1.8vw, 2.4vh); letter-spacing: 0.18em; margin-top: 4vh; transition: opacity 2s ease; }`;
  document.head.appendChild(style);
  const el = document.createElement('div'); el.id = 'nightclock'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="face"><div class="time"></div><div class="date"></div><div class="wake">TAP TO WAKE</div></div>';
  document.body.appendChild(el);
  const face = el.querySelector('.face'), timeEl = el.querySelector('.time'), dateEl = el.querySelector('.date'), wakeEl = el.querySelector('.wake');

  // Touches on the clock never reach the scenes underneath.
  for (const ev of ['touchstart', 'touchend', 'mousedown', 'mouseup']) el.addEventListener(ev, (e) => e.stopPropagation());
  el.addEventListener('click', (e) => { e.stopPropagation(); awakeUntil = Date.now() + AWAKE_MS; update(); });

  function inWindow(d) {
    if (pick === 'off') return false;
    const [from, to] = pick.split('-').map(Number), h = d.getHours();
    return from > to ? (h >= from || h < to) : (h >= from && h < to);
  }
  function update() {
    const now = new Date();
    const want = (preview || inWindow(now)) && Date.now() > awakeUntil && !(window.Menu && Menu.isOpen());
    if (want !== showing) {
      showing = want; el.classList.toggle('on', showing); el.setAttribute('aria-hidden', showing ? 'false' : 'true');
      if (showing) { wakeEl.style.opacity = 1; setTimeout(() => { wakeEl.style.opacity = 0; }, 10000); }
    }
    if (!showing) return;
    const t = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const [hm, ap] = t.split(' ');
    timeEl.innerHTML = `${hm}<span class="ampm">${ap || ''}</span>`;
    const moon = window.WinterScene && WinterScene.moonPhaseName ? ' · ' + WinterScene.moonPhaseName() : '';
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase() + moon;
  }
  // Drift a few percent each minute so no pixel holds the same picture all night.
  setInterval(() => { if (showing) face.style.transform = `translate(${(Math.random() * 6 - 3).toFixed(1)}vw, ${(Math.random() * 6 - 3).toFixed(1)}vh)`; }, 60000);
  setInterval(update, 10000);
  update();

  window.NightClock = {
    options: () => OPTIONS, get: () => pick,
    set(id) { if (!OPTIONS.some(o => o.id === id)) return; pick = id; try { localStorage.setItem('risingcode_night', id); } catch (e) {} awakeUntil = 0; update(); },
    isShowing: () => showing,
    update,
  };
})();
