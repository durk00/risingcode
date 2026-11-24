// PORTRAIT (Nov 24, 2026): a screensaver choice. An AI's face made of rising code, looking
// straight out at whoever is in front of the screen, after a ChatGPT image William liked
// (that one was a profile; this one faces you). Dark, with the face in amber code.
//   - head, neck and shoulders in amber, brighter along the outline and the features
//   - big eyes, where the code runs faster and brighter than anywhere else
//   - the pace changes at random, like the Christmas display: the face and the eyes each
//     drift between slow, steady and fast, holding each for anywhere from 1 to 5 minutes
//   - a faint dark-blue code in the background so the face sits in a field of it
(() => {
  const KANA = Array.from({ length: 0xFF9D - 0xFF66 + 1 }, (_, i) => String.fromCharCode(0xFF66 + i));
  const GL = KANA.concat('0123456789'.split(''));
  const pick = () => GL[(Math.random() * GL.length) | 0];
  let ctx, W = 0, H = 0, cell = 10, cols = 0, rows = 0, shape = null, light = null, glyph = [], body = [], eyes = [], bg = [];
  // Pace: each of the face and the eyes has its own, easing between random targets.
  const pace = { face: { now: 1, want: 1, left: 0 }, eyes: { now: 2, want: 2, left: 0 } };
  function nextPace(p, eye) {
    const speeds = eye ? [1, 2, 3.5, 5] : [0.4, 0.8, 1.2, 1.8];
    p.want = speeds[(Math.random() * speeds.length) | 0];
    p.left = (60 + Math.random() * 240) * 30;   // 1 to 5 minutes at 30 frames a second
  }

  // The face as a grid of values: 0 background, 1 skin, 2 outline and features, 3 eye, 4 pupil.
  function build() {
    shape = new Uint8Array(cols * (rows + 1));
    const cx = W / 2, cy = H * 0.44, a = Math.min(W * 0.2, H * 0.21), b = a * 1.33;
    const eyeY = cy - b * 0.05, eyeDX = a * 0.43, erx = a * 0.31, ery = a * 0.17;
    light = new Float32Array(cols * (rows + 1));   // rounded shading: brighter at the middle of the face, falling off to the sides
    const inHead = (x, y) => { const k = 1 - 0.18 * Math.max(0, (y - cy) / b); const u = (x - cx) / (a * k), v = (y - cy) / b; return u * u + v * v < 1; };
    const inNeck = (x, y) => Math.abs(x - cx) < a * 0.42 && y > cy + b * 0.7 && y < cy + b * 1.35;
    const inShoulders = (x, y) => { const u = (x - cx) / (a * 2.4), v = (y - (cy + b * 2.05)) / (b * 0.85); return u * u + v * v < 1; };
    const inside = (x, y) => inHead(x, y) || inNeck(x, y) || inShoulders(x, y);
    for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cell + cell / 2, y = r * cell + cell / 2;
      if (!inside(x, y)) continue;
      let v = 1;
      light[r * cols + c] = inHead(x, y) ? Math.max(0, 1 - Math.pow((x - cx) / a, 2) * 0.9 - Math.pow((y - cy) / b, 2) * 0.4) : Math.max(0, 0.55 - Math.abs(x - cx) / (a * 4));
      // Outline: a skin cell next to the background.
      if (!inside(x - cell, y) || !inside(x + cell, y) || !inside(x, y - cell) || !inside(x, y + cell)) v = 2;
      for (const s of [-1, 1]) {
        const ex = cx + s * eyeDX, u = (x - ex) / erx, w = (y - eyeY) / ery, d = u * u + w * w;
        if (d < 1) v = Math.hypot(x - ex, y - eyeY) < a * 0.1 ? 4 : 3;
        else if (d < 2.1 && v === 1) v = 5;      // the shadow of the eye socket
        // Brows: a thin arch over each eye.
        const bu = (x - ex) / (erx * 1.15), bw = (y - (eyeY - ery * 1.9)) / (ery * 0.55);
        if (bu * bu + bw * bw < 1 && y < eyeY - ery * 1.6) v = 2;
      }
      if (Math.abs(x - cx) < cell * 1.1 && y > eyeY + ery * 1.4 && y < cy + b * 0.33 && v !== 3 && v !== 4) v = 2;   // nose
      if (Math.abs(x - cx) < a * 0.16 && Math.abs(y - (cy + b * 0.35)) < cell * 0.6) v = 2;        // nose base
      if (Math.abs(x - cx) < a * 0.32 && Math.abs(y - (cy + b * 0.56) + Math.pow((x - cx) / a, 2) * a * 0.3) < cell * 0.7) v = 2;   // mouth, a slight smile
      shape[r * cols + c] = v;
    }
  }
  const stream = () => ({ head: Math.random() * rows * 1.5, speed: 0.15 + Math.random() * 0.25, len: 8 + ((Math.random() * 22) | 0) });
  function resize(w, h) {
    W = w; H = h; cell = Math.max(7, Math.round(Math.min(W, H) / 84));   // finer grain so the features show
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    body = Array.from({ length: cols }, stream); eyes = Array.from({ length: cols }, stream); bg = Array.from({ length: cols }, stream);
    glyph = Array.from({ length: cols * (rows + 1) }, pick);
    build();
  }

  const trail = (s, r) => { const k = r - Math.floor(s.head); return k >= 0 && k < s.len ? 1 - k / s.len : 0; };
  const move = (s, f) => { s.head -= s.speed * f; if (s.head + s.len < 0) Object.assign(s, stream(), { head: rows + Math.random() * rows * 0.4 }); };
  function draw() {
    for (const [k, p] of Object.entries(pace)) { p.now += (p.want - p.now) * 0.01; if (--p.left <= 0) nextPace(p, k === 'eyes'); }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.font = `${cell}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let c = 0; c < cols; c++) {
      const x = c * cell + cell / 2;
      for (let r = 0; r <= rows; r++) {
        const v = shape[r * cols + c], y = r * cell + cell / 2;
        let a, col;
        if (v === 0) {                                   // faint background code
          const f = trail(bg[c], r); if (f <= 0) continue;
          a = 0.12 * f * f; col = '#3a5a7a';
        } else if (v === 3 || v === 4) {                 // the eyes: fast, bright amber with a hot center
          const f = trail(eyes[c], r);
          a = (v === 4 ? 1 : 0.62) + 0.45 * f; col = v === 4 || f > 0.9 ? '#fff1cc' : '#ffc04a';
        } else if (v === 5) {                            // eye sockets stay in shadow
          const f = trail(body[c], r); a = 0.04 + 0.25 * f * f; col = '#c97a1e';
        } else {                                         // skin (shaded round) and the outline and features
          const f = trail(body[c], r), sh = light[r * cols + c];
          a = (v === 2 ? 0.8 : 0.07 + 0.3 * sh) + 0.55 * f * f; col = v === 2 ? '#ffd27a' : f > 0.95 ? '#ffe2a0' : '#e8902a';
        }
        ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = col;
        const glow = v === 3 || v === 4;
        if (glow) { ctx.shadowColor = '#ffbf40'; ctx.shadowBlur = cell * (v === 4 ? 1.4 : 0.8); }
        ctx.fillText(glyph[r * cols + c], x, y);
        if (glow) ctx.shadowBlur = 0;
      }
      move(body[c], pace.face.now); move(eyes[c], pace.eyes.now * 1.8); move(bg[c], 0.6);
    }
    // Glyphs change: often in the eyes, now and then elsewhere.
    for (let i = 0; i < 30; i++) glyph[(Math.random() * glyph.length) | 0] = pick();
    for (let i = 0; i < shape.length; i += 7) if ((shape[i] === 3 || shape[i] === 4) && Math.random() < 0.15 * pace.eyes.now) glyph[i] = pick();
    ctx.globalAlpha = 1;
  }

  nextPace(pace.face, false); nextPace(pace.eyes, true);
  window.FaceSaver = {
    start(c) { ctx = c; },
    resize,
    draw() { if (ctx && W) draw(); },
    pace: () => ({ face: pace.face.now, eyes: pace.eyes.now }),
  };
})();
