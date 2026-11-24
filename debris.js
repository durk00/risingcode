// DEBRIS (Nov 24, 2026): the Earth screensaver flying through a dust cloud, at William's request.
// The Earth is never in empty space: it moves through dust and rock all the time. This draws it:
//   - a thick haze of fine dust drifting past, near specks quicker than far ones
//   - rocks, big and small, tumbling and turning, crossing the screen in every direction:
//     up, down, sideways, at angles, and straight at the viewer, growing as they come
//   - they come all the time, and often in groups: 1, 2, 3, 4 or 5 together
//   - most pass behind the Earth; now and then a big one sweeps past in front, with a streak
//   - each rock is lit from one side by the sun and dark on the other
//   - V58: the rocks sit farther off (smaller), and meteors streak across the sky: far away,
//     very quick, thin to thick, in any direction, sometimes a few at once
// Earth calls Debris.back() before drawing the globe and Debris.front() after it.
(() => {
  let W = 0, H = 0, dust = [], rocks = [], wait = 0, meteors = [], mWait = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function shape() {                               // a lumpy outline, never round
    const n = 7 + ((Math.random() * 6) | 0), pts = [];
    for (let i = 0; i < n; i++) pts.push(0.6 + Math.random() * 0.45);
    return pts;
  }
  function rock(front, x, y, dir) {
    const S = Math.min(W, H), toward = !front && Math.random() < 0.3;
    const r = {
      front, toward, pts: shape(), rot: rnd(0, 6.3), spin: rnd(-0.04, 0.04),
      size: front ? rnd(0.018, 0.045) * S : rnd(0.003, 0.016) * S,
      tone: rnd(0.75, 1.15), life: 0,
    };
    if (toward) {                                  // straight at us: starts small near the middle and grows
      r.x = W / 2 + rnd(-0.35, 0.35) * W; r.y = H / 2 + rnd(-0.35, 0.35) * H;
      const a = Math.atan2(r.y - H / 2, r.x - W / 2) + rnd(-0.4, 0.4);
      r.vx = Math.cos(a) * rnd(0.3, 1.2); r.vy = Math.sin(a) * rnd(0.3, 1.2);
      r.grow = rnd(1.006, 1.02); r.size *= 0.25;
    } else {                                       // across the screen, from any edge, any direction
      const speed = front ? rnd(4, 9) : rnd(0.4, 3.2);
      r.vx = Math.cos(dir) * speed; r.vy = Math.sin(dir) * speed;
      r.x = x; r.y = y; r.grow = 1;
    }
    return r;
  }
  // A group of 1 to 5 entering together from one edge, all heading roughly the same way.
  function group(front) {
    const n = front ? 1 + (Math.random() < 0.3 ? 1 : 0) : 1 + ((Math.random() * 5) | 0);
    const dir = rnd(0, Math.PI * 2), m = Math.max(W, H) * 0.08;
    // Start just off the edge the group is coming from.
    const sx = W / 2 - Math.cos(dir) * (W / 2 + m), sy = H / 2 - Math.sin(dir) * (H / 2 + m);
    const side = rnd(-0.5, 0.5) * Math.max(W, H);
    for (let i = 0; i < n; i++) {
      const off = side + rnd(-0.12, 0.12) * Math.max(W, H), lag = i * rnd(10, 60);
      const x = sx - Math.sin(dir) * off - Math.cos(dir) * lag, y = sy + Math.cos(dir) * off - Math.sin(dir) * lag;
      rocks.push(rock(front, x, y, dir + rnd(-0.25, 0.25)));
    }
  }

  function resize(w, h) {
    W = w; H = h; rocks = []; meteors = [];
    dust = Array.from({ length: Math.round(W * H / 2200) }, () => {
      const z = Math.random(), a = rnd(0, 6.3);
      return { x: rnd(0, W), y: rnd(0, H), z, vx: Math.cos(a) * (0.1 + z * 0.9), vy: Math.sin(a) * (0.1 + z * 0.9) };
    });
    for (let i = 0; i < 24; i++) { const r = rock(false, rnd(0, W), rnd(0, H), rnd(0, 6.3)); rocks.push(r); }
  }

  function drawRock(ctx, r, sun) {
    const s = r.size;
    if (r.front || s > 18) {                       // a faint streak behind the fast or near ones
      const sp = Math.hypot(r.vx, r.vy);
      if (sp > 2) {
        ctx.globalAlpha = 0.07; ctx.strokeStyle = '#9a8d7c'; ctx.lineWidth = s * 0.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.vx * 10, r.y - r.vy * 10); ctx.stroke();
      }
    }
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
    ctx.beginPath();
    r.pts.forEach((k, i) => { const a = i / r.pts.length * Math.PI * 2; const px = Math.cos(a) * s * k, py = Math.sin(a) * s * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.closePath();
    // Lit from the sun's side (it stays put while the rock turns), dark on the far side.
    const la = sun - r.rot, g = ctx.createLinearGradient(Math.cos(la) * s, Math.sin(la) * s, -Math.cos(la) * s, -Math.sin(la) * s);
    const b = r.tone * (r.front ? 1 : 0.55 + Math.min(0.45, s / 40));
    g.addColorStop(0, `rgb(${185 * b | 0},${168 * b | 0},${145 * b | 0})`);
    g.addColorStop(0.55, `rgb(${70 * b | 0},${62 * b | 0},${54 * b | 0})`);
    g.addColorStop(1, '#0b0a09');
    ctx.globalAlpha = Math.min(1, r.life / 20) * (r.front ? 1 : 0.9); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  function step(r) {
    r.x += r.vx; r.y += r.vy; r.rot += r.spin; r.life++;
    if (r.toward) { r.size *= r.grow; r.vx *= 1.012; r.vy *= 1.012; }
    const m = r.size * 2 + 40;
    r.gone = r.life > 30 && (r.x < -m - 600 || r.x > W + m + 600 || r.y < -m - 600 || r.y > H + m + 600 || (r.toward && r.size > Math.min(W, H) * 0.09));
  }

  // Meteors: a bright head with a fading tail, crossing a good part of the sky in under a second.
  function meteor() {
    const a = rnd(0, Math.PI * 2), sp = rnd(18, 45) * Math.max(W, H) / 1000, w = Math.random() < 0.7 ? rnd(0.6, 1.6) : rnd(1.8, 3.6);
    return { x: rnd(0, W), y: rnd(0, H), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w, len: rnd(6, 14), life: 0, max: 14 + ((Math.random() * 22) | 0) };
  }
  function drawMeteors(ctx) {
    if (--mWait <= 0) {
      const n = Math.random() < 0.25 ? 2 + ((Math.random() * 3) | 0) : 1;
      for (let i = 0; i < n; i++) meteors.push(meteor());
      mWait = 10 + ((Math.random() * 70) | 0);
    }
    ctx.lineCap = 'round';
    for (const m of meteors) {
      m.life++; m.x += m.vx; m.y += m.vy;
      const fade = Math.sin(Math.PI * Math.min(1, m.life / m.max));        // flares up, then burns out
      const tx = m.x - m.vx * m.len * 0.5, ty = m.y - m.vy * m.len * 0.5;
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.25, 'rgba(255,225,170,0.55)'); g.addColorStop(1, 'rgba(255,200,140,0)');
      ctx.globalAlpha = fade; ctx.strokeStyle = g; ctx.lineWidth = m.w;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
      if (m.w > 1.8) { ctx.globalAlpha = fade * 0.9; ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(m.x, m.y, m.w * 0.8, 0, 6.3); ctx.fill(); }
    }
    meteors = meteors.filter(m => m.life < m.max);
  }

  const SUN = -0.6;                                 // the sunlight comes from the upper left
  // Behind the globe: the dust and most of the rocks.
  function back(ctx) {
    if (!W) return;
    for (const d of dust) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x += W; else if (d.x > W) d.x -= W;
      if (d.y < 0) d.y += H; else if (d.y > H) d.y -= H;
      ctx.globalAlpha = 0.12 + 0.4 * d.z; ctx.fillStyle = '#b9ab98';
      const s = 0.6 + d.z * 1.6; ctx.fillRect(d.x, d.y, s, s);
    }
    drawMeteors(ctx);
    if (--wait <= 0) { group(false); wait = 4 + ((Math.random() * 30) | 0); }
    if (Math.random() < 0.002) group(true);
    for (const r of rocks) if (!r.front) { step(r); drawRock(ctx, r, SUN); }
    ctx.globalAlpha = 1;
  }
  // In front of the globe: the occasional big one sweeping past.
  function front(ctx) {
    if (!W) return;
    for (const r of rocks) if (r.front) { step(r); drawRock(ctx, r, SUN); }
    rocks = rocks.filter(r => !r.gone).slice(-90);
    ctx.globalAlpha = 1;
  }

  window.Debris = { resize, back, front, count: () => rocks.length, meteors: () => meteors.length };
})();
