// MENU (Nov 24, 2026): swipe down on any scene to open it; swipe up or tap the ✕ to
// close. Nothing shows on the scenes themselves. A first version, to be designed
// further:
//   SOUND     which sound plays when the radar catches Santa (the same four as
//             tapping the Christmas display: toot, Jingle Bells, icicles, silent)
//   MY CORNER the personal wildcard: one thing picked for this household's own
//             interests (a poem of the day, a what-can-I-cook helper, ...). The
//             pick is remembered on this device; what each one shows is still to
//             be built.
// index.html opens and closes it and hands it the sound controls (Menu.connect).
(() => {
  const WILDCARDS = [
    { id: 'none', name: 'Nothing', note: '' },
    { id: 'poem', name: 'Poem of the day', note: 'COMING' },
    { id: 'cook', name: 'What can I make?', note: 'COMING' },
  ];
  let wild = 'none';
  try { if (WILDCARDS.some(w => w.id === localStorage.getItem('risingcode_wildcard'))) wild = localStorage.getItem('risingcode_wildcard'); } catch (e) {}
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
  #menu .opt.on::before { content: "✓ "; }
  #menu .opt small { display: block; color: #93a4b4; font-size: 11px; margin-top: 4px; letter-spacing: 0.1em; }
  #menu footer { margin-top: 36px; color: #93a4b4; font-size: 12px; letter-spacing: 0.1em; }`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const el = document.createElement('div'); el.id = 'menu'; el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  function render() {
    const names = sound ? sound.names : [];
    const cur = sound ? sound.get() : -1;
    el.innerHTML = `<div class="wrap">
      <header><h1>MENU</h1><button class="x" aria-label="Close menu">✕</button></header>
      <h2>SOUND</h2>
      <p class="help">What plays on the Christmas display when the radar catches Santa.</p>
      <div class="opts">${names.map((n, i) => `<button class="opt${i === cur ? ' on' : ''}" data-sound="${i}">${n}</button>`).join('')}</div>
      <h2>MY CORNER</h2>
      <p class="help">One thing just for this household. Picked here, remembered on this device.</p>
      <div class="opts">${WILDCARDS.map(w => `<button class="opt${w.id === wild ? ' on' : ''}" data-wild="${w.id}">${w.name}${w.note ? `<small>${w.note}</small>` : ''}</button>`).join('')}</div>
      <footer>SWIPE UP OR TAP ✕ TO CLOSE</footer></div>`;
  }
  el.addEventListener('click', (e) => {
    e.stopPropagation();                         // menu taps never reach the scenes
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('x')) { Menu.close(); return; }
    if (b.dataset.sound !== undefined && sound) { sound.set(+b.dataset.sound); render(); }
    if (b.dataset.wild) { wild = b.dataset.wild; try { localStorage.setItem('risingcode_wildcard', wild); } catch (e2) {} render(); }
  });

  let open = false;
  window.Menu = {
    connect(s) { sound = s; },
    isOpen: () => open,
    open() { open = true; render(); el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); },
    close() { open = false; el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); },
    wildcard: () => wild,
  };
})();
