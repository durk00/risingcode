// PHONE FIT (Nov 25, 2026, V133): on an iPhone the radio and TV set was taller than the screen,
// so the top of the TV was cut off. On a phone-width screen the buttons are about half as tall
// and the spacing tighter. Bigger
// screens (iPad, Chromebook) are untouched. Load after radio.js and tv.js.
(() => {
  const css = document.createElement('style');
  css.textContent = `
  @media (max-width: 560px) {
    #radio .set { width: 96vw; padding: 10px 10px 12px; border-radius: 16px; }
    #radio .top { gap: 8px; margin-bottom: 8px; }
    #radio .x, #radio .pw { width: 40px; height: 34px; font-size: 16px; }
    #radio .x::after { bottom: 8px; width: 18px; height: 3px; margin-left: -9px; }
    #radio .tab { height: 34px; padding: 0 12px; font-size: 14px; letter-spacing: 0.1em; }
    #radio .lcd { padding: 6px 10px; min-height: 0; }
    #radio .lcd .name { font-size: 18px; }
    #radio .lcd .sub { font-size: 11px; margin-top: 2px; }
    #radio .dial { height: 56px; margin: 8px 0; }
    #radio .row { gap: 6px; }
    #radio .row .step { width: 40px; font-size: 18px; }
    #radio .bands { gap: 6px; }
    #radio .bands button { height: 36px; font-size: 15px; box-shadow: 0 2px 0 #0a0c0f; }
    #radio .hint { font-size: 10px; margin-top: 8px; }
    .tvbody .titlerow { flex-wrap: wrap; gap: 6px; margin: 6px 0; }
    .tvbody .title { flex: 1 0 100%; min-height: 0; }
    .tvbody .title .name { font-size: 16px; }
    .tvbody .title .sub { font-size: 10px; }
    .tvbody .full { flex: 1; height: 36px; padding: 0 8px; font-size: 13px; }
    .tvbody .out { gap: 6px; margin-top: 8px; }
    .tvbody .out span { font-size: 10px; }
    .tvbody .out a { flex: 1 0 70px; height: 36px; font-size: 14px; }
  }`;
  document.head.appendChild(css);
})();
