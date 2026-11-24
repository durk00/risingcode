// g (Nov 24, 2026, V69): William's own AI, g (go-grow-gain.base44.app), as a page of this app,
// one swipe left past Kitchen, so he can chat with g without leaving the screensaver.
//
// This app is William's own; a copy without any AI can be made for other people. Even so, the
// page only appears on an iPad where it was turned on: open the app once with ?g=on at the end
// of the address (?g=off takes it away again), or, inside the app (the home-screen icon keeps
// its own storage), tap the word MENU at the top of the menu 5 times quickly (V71). Nothing private is in this file: g's chat is
// behind g's own sign-in, the same as when g is opened by itself.
//
// g is shown in a frame filling the page, with a thin bar on top: ← Back, and "Open g ↗" for
// when the frame can't show it (some sites refuse to be shown inside another page, and Safari
// can keep a sign-in from carrying into a frame). The frame is only loaded the first time the
// page is opened, then kept, so a conversation stays put while swiping to the weather and back.
(() => {
  const URL_G = 'https://go-grow-gain.base44.app/';
  const KEY = 'risingcode_g';
  const q = location.search;
  try {
    if (/[?&]g=on\b/.test(q)) localStorage.setItem(KEY, 'on');
    if (/[?&]g=off\b/.test(q)) localStorage.removeItem(KEY);
  } catch (e) {}
  let on = false;
  try { on = localStorage.getItem(KEY) === 'on'; } catch (e) {}
  if (!on) { window.GPage = { enabled: false, show() {} }; return; }

  const css = document.createElement('style');
  css.textContent = `
  #gpage { position: fixed; inset: 0; z-index: 5; display: none; background: #0b1016; flex-direction: column; }
  #gpage.show { display: flex; }
  #gpage .bar { display: flex; align-items: center; gap: 12px; padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 10px;
    background: #0b1016; border-bottom: 1px solid #243241; font: 700 15px ui-monospace, Menlo, monospace; letter-spacing: 0.06em; color: #ffb84a; }
  #gpage .bar .t { flex: 1; text-align: center; }
  #gpage .bar button, #gpage .bar a { padding: 8px 14px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a;
    font: 700 14px ui-monospace, Menlo, monospace; text-decoration: none; cursor: pointer; }
  #gpage .frame { position: relative; flex: 1; }
  #gpage .frame p { position: absolute; inset: auto 0 45% 0; text-align: center; color: #93a4b4; font: 500 14px/1.5 ui-monospace, Menlo, monospace; padding: 0 24px; }
  #gpage iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: transparent; }`;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.id = 'gpage'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="bar"><button type="button" class="back" aria-label="Back">← Back</button><span class="t">g</span>
    <a href="${URL_G}" target="_blank" rel="noopener">Open g ↗</a></div>
    <div class="frame"><p>Loading g… If it stays blank, tap “Open g ↗”.</p></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => { e.stopPropagation(); if (e.target.closest('.back') && window.GPage.onBack) window.GPage.onBack(); });
  const frame = el.querySelector('.frame');
  let loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    const f = document.createElement('iframe');
    f.src = URL_G; f.title = 'g';
    f.allow = 'microphone; clipboard-read; clipboard-write; autoplay';
    frame.appendChild(f);
  }
  window.GPage = { enabled: true, onBack: null, show(v) { el.classList.toggle('show', !!v); el.setAttribute('aria-hidden', v ? 'false' : 'true'); if (v) load(); } };
})();
