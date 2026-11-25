// g (Nov 24, 2026, V69): William's own AI, g (go-grow-gain.base44.app), as a page of this app,
// one swipe left past Kitchen, so he can chat with g without leaving the screensaver.
//
// This app is William's own; a copy without any AI can be made for other people. Even so, the
// page only appears on an iPad where it was turned on: open the app once with ?g=on at the end
// of the address (?g=off takes it away again), or, inside the app (the home-screen icon keeps
// its own storage), tap the word MENU at the top of the menu 5 times quickly (V71). Nothing private is in this file: g's chat is
// behind g's own sign-in, the same as when g is opened by itself.
//
// V72: Base44 won't let g be shown inside another page (it came up white), and iPadOS won't let
// a link open a web app saved to the home screen, so this page is a launcher: one big OPEN g
// button (it opens g in Safari), and a reminder that the bottom-edge swipe flips between g's
// home-screen app and Rising Code once both are open.
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
  #gpage .bar button, #gpage a { padding: 8px 14px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a;
    font: 700 14px ui-monospace, Menlo, monospace; text-decoration: none; cursor: pointer; }
  #gpage .go { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding: 24px; }
  #gpage .go .big { padding: 26px 60px; font-size: 30px; letter-spacing: 0.12em; border-width: 3px; border-radius: 16px; }
  #gpage .go p { max-width: 440px; text-align: center; color: #93a4b4; font: 500 15px/1.6 ui-monospace, Menlo, monospace; margin: 0; }
`;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.id = 'gpage'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="bar"><button type="button" class="back" aria-label="Back">← Back</button><span class="t">g</span>
    <span style="width:90px"></span></div>
    <div class="go"><a class="big" href="${URL_G}" target="_blank" rel="noopener">OPEN g</a>
      <p>Once g is open, flip between g and Outside In by swiping sideways along the very bottom edge of the screen.</p></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => { e.stopPropagation(); if (e.target.closest('.back') && window.GPage.onBack) window.GPage.onBack(); });
  window.GPage = { enabled: true, onBack: null, show(v) { el.classList.toggle('show', !!v); el.setAttribute('aria-hidden', v ? 'false' : 'true'); } };
})();
