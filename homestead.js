// THE HOMESTEAD (Nov 24, 2026, V78): the everyday life of the place, on the Winter scene, slow
// enough that you only notice it when you look back later.
//
//   - A SOLAR ARRAY of 16 panels (two rows of eight) on gravel, left of the house, tilted 40
//     degrees (about right for central Pennsylvania's latitude) and facing south. The scene looks south,
//     so, as in real life, you see the backs of the panels: silver frames on their legs. Snow
//     that falls on them sits on top and slides off in the sun; somebody comes out and clears
//     it, one panel at a time.
//   - A WELL with a little roof and a bucket, between the array and the house.
//   - A PADDOCK behind an old split-rail fence at the right, running off the edge of the
//     picture: horses, a couple of goats, chickens by day (they roost at dusk), a small coop,
//     and once in a while a peacock. Which animals are out stays the same all day and
//     changes from day to day.
//   - SOMEBODY who lives here: out by day only, now and then, for a long while at a time,
//     walking slowly from the door to the panels (clearing snow after a snowfall, or just
//     checking them), to the well for a bucket of water, or in with the animals at feeding
//     time. Gone in by dark.
// Preview for checking: ?homestead=work sends the person out now (to clear snow, if any;
// add &wx=snow to see it).
(() => {
  const q = location.search, preview = /[?&]homestead=work\b/.test(q);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const load = new Array(16).fill(0);            // snow on each panel, 0 to 1
  let person = null, nextOuting = 0, lastT = 0, critters = null, critterDay = '';

  const shade = (hex, light, floor = 0.22) => {
    const n = parseInt(hex.slice(1), 16), k = floor + (1 - floor) * light;
    return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`;
  };
  // A steady pick per day (so the paddock doesn't reshuffle every time you look).
  function daySeed(d) { let h = 2166136261; for (const ch of d.toDateString()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); }

  function layout(env) {
    const { W, H, house } = env, S = house.h;
    const arr = { x0: W * 0.04, x1: Math.min(house.x - W * 0.13, W * 0.4) };
    arr.pw = (arr.x1 - arr.x0) / 8; arr.ph = S * 0.17; arr.base = env.groundY((arr.x0 + arr.x1) / 2) + H * 0.02; arr.leg = S * 0.16;
    const well = { x: house.x - Math.max(W * 0.06, S * 0.35), base: env.groundY(house.x - W * 0.06) + H * 0.02, s: S * 0.3 };
    const pad = { x0: house.x + house.w + Math.max(W * 0.07, S * 0.45), x1: W + S * 0.5 };
    pad.base = env.groundY(Math.min(W - 1, pad.x0 + 40)) + H * 0.035; pad.h = S * 0.22;
    const door = { x: house.x + house.w * 0.5, base: house.base + H * 0.012 };
    return { S, arr, well, pad, door };
  }

  // ---- the animals in the paddock --------------------------------------------------
  function pickCritters(env, L) {
    const r = daySeed(env.now), list = [];
    const span = Math.max(10, (Math.min(env.W, L.pad.x1) - L.pad.x0));
    const at = () => L.pad.x0 + span * (0.1 + 0.8 * r());
    if (r() < 0.8) { const n = r() < 0.5 ? 1 : 2; for (let i = 0; i < n; i++) list.push({ kind: 'horse', x: at(), dir: r() < 0.5 ? 1 : -1, coat: r() < 0.5 ? '#d8d2c8' : ['#5a3c26', '#2b2420', '#8a6a4a'][(r() * 3) | 0], next: 0, head: 0, headTo: 0, headNext: 0 }); }
    if (r() < 0.5) { const n = 1 + ((r() * 2) | 0); for (let i = 0; i < n; i++) list.push({ kind: 'goat', x: at(), dir: r() < 0.5 ? 1 : -1, coat: ['#e8e2d8', '#6e5a48', '#3a3330'][(r() * 3) | 0], next: 0 }); }
    const hens = 3 + ((r() * 5) | 0); for (let i = 0; i < hens; i++) list.push({ kind: 'hen', x: at(), dir: r() < 0.5 ? 1 : -1, coat: ['#8a4a26', '#e8e2d8', '#2b2420'][(r() * 3) | 0], next: 0, peck: r() * 6 });
    if (r() < 0.18) list.push({ kind: 'peacock', x: at(), dir: r() < 0.5 ? 1 : -1, next: 0, fan: 0 });
    return list;
  }

  // ---- drawing ----------------------------------------------------------------------
  function drawArray(ctx, env, L) {
    const a = L.arr, light = env.light;
    // Gravel bed.
    ctx.fillStyle = shade('#8c8a84', light); ctx.fillRect(a.x0 - a.pw * 0.2, a.base - 2, a.x1 - a.x0 + a.pw * 0.4, env.H * 0.012);
    for (let row = 0; row < 2; row++) for (let c = 0; c < 8; c++) {
      const k = row * 8 + c, x = a.x0 + c * a.pw, top = a.base - a.leg - (2 - row) * a.ph;
      // Legs and brace under the lower row.
      if (row === 1) {
        ctx.strokeStyle = shade('#6e737a', light); ctx.lineWidth = Math.max(1, a.pw * 0.05);
        ctx.beginPath(); ctx.moveTo(x + a.pw * 0.2, top + a.ph); ctx.lineTo(x + a.pw * 0.2, a.base); ctx.moveTo(x + a.pw * 0.8, top + a.ph); ctx.lineTo(x + a.pw * 0.8, a.base);
        ctx.moveTo(x + a.pw * 0.2, a.base); ctx.lineTo(x + a.pw * 0.8, top + a.ph); ctx.stroke();
      }
      // The panel's back: a light backsheet in a dark aluminum frame, with its junction box.
      ctx.fillStyle = shade('#c9ced4', light); ctx.fillRect(x + 1, top + 1, a.pw - 2, a.ph - 2);
      ctx.strokeStyle = shade('#5d646c', light); ctx.lineWidth = Math.max(1, a.pw * 0.04); ctx.strokeRect(x + 1, top + 1, a.pw - 2, a.ph - 2);
      ctx.fillStyle = shade('#3a3e44', light); ctx.fillRect(x + a.pw * 0.42, top + a.ph * 0.15, a.pw * 0.16, a.ph * 0.14);
      // Snow on the face shows as a white cap over the top edge.
      if (load[k] > 0.02) { ctx.fillStyle = shade('#f4f7fb', Math.max(0.55, light)); const sh = a.ph * 0.45 * load[k]; ctx.fillRect(x + 1, top - sh * 0.35, a.pw - 2, sh); }
    }
    drawWiring(ctx, env, a);
  }
  // V79: the wiring, as it really runs on a ground mount. All 16 panels are one series string:
  // each junction box's + lead plugs into the next panel's - lead. It starts at the lower row's
  // right end, runs left, jumps up to the top row at the left end, runs right, so both ends of
  // the string (+ and -) come out at the right end, nearest the house. The two home-run wires
  // drop down the last leg into a gray conduit that goes into the ground; the run is buried
  // and comes up again at the house wall into the disconnect box (drawHouseEnd).
  function drawWiring(ctx, env, a) {
    const light = env.light, wire = shade('#1c1e22', Math.max(0.5, light));
    const box = (row, c) => { const x = a.x0 + c * a.pw, top = a.base - a.leg - (2 - row) * a.ph; return { l: x + a.pw * 0.42, r: x + a.pw * 0.58, y: top + a.ph * 0.22, top }; };
    ctx.strokeStyle = wire; ctx.lineWidth = Math.max(1, a.pw * 0.025); ctx.lineCap = 'round';
    ctx.beginPath();
    for (let row = 0; row < 2; row++) for (let c = 0; c < 7; c++) {            // panel to panel, with a little sag
      const p = box(row, c), q = box(row, c + 1);
      ctx.moveTo(p.r, p.y); ctx.quadraticCurveTo((p.r + q.l) / 2, p.y + a.ph * 0.12, q.l, q.y);
    }
    const b8 = box(1, 0), b0 = box(0, 0), jx = a.x0 + a.pw * 0.12;              // row jumper at the left end
    ctx.moveTo(b8.l, b8.y); ctx.lineTo(jx, b8.y); ctx.lineTo(jx, b0.y); ctx.lineTo(b0.l, b0.y);
    const cx = a.x1 - a.pw * 0.12, cTop = a.base - a.leg + a.ph * 0.15;         // home runs down to the conduit
    const b7 = box(0, 7), b15 = box(1, 7);
    ctx.moveTo(b7.r, b7.y); ctx.lineTo(cx - 1.5, b7.y); ctx.lineTo(cx - 1.5, cTop);
    ctx.moveTo(b15.r, b15.y); ctx.lineTo(cx + 1.5, b15.y); ctx.lineTo(cx + 1.5, cTop);
    ctx.stroke();
    ctx.fillStyle = shade('#8e9298', light); const cw = Math.max(4, a.pw * 0.09);   // conduit into the ground
    ctx.fillRect(cx - cw / 2, cTop, cw, a.base - cTop + env.H * 0.01);
    ctx.fillRect(cx - cw * 0.8, cTop - cw * 0.3, cw * 1.6, cw * 0.5);             // weatherhead fitting
  }
  // Where the buried run comes back up: a conduit up the house's left wall into a gray
  // disconnect box. Drawn in front of the snow, since it's on the wall.
  function drawHouseEnd(ctx, env) {
    const h = env.house, light = env.light, S = h.h, x = h.x + h.w * 0.12, cw = Math.max(4, S * 0.035);
    const bx = x - S * 0.03, by = h.base - S * 0.42, bw = S * 0.1, bh = S * 0.13;
    ctx.fillStyle = shade('#8e9298', light); ctx.fillRect(x - cw / 2, by + bh, cw, h.base - by - bh + env.H * 0.01);
    ctx.fillStyle = shade('#9aa0a6', light); ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = shade('#5d646c', light); ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = shade('#3a3e44', light); ctx.fillRect(bx + bw * 0.7, by + bh * 0.35, bw * 0.12, bh * 0.3);   // the handle
  }
  function drawWell(ctx, env, L) {
    const w = L.well, s = w.s, light = env.light, x = w.x, b = w.base;
    ctx.fillStyle = shade('#7a7570', light); ctx.fillRect(x - s * 0.4, b - s * 0.38, s * 0.8, s * 0.38);           // stone ring
    ctx.strokeStyle = shade('#5a5550', light); ctx.lineWidth = 1;
    for (let r = 1; r < 3; r++) { ctx.beginPath(); ctx.moveTo(x - s * 0.4, b - s * 0.13 * r); ctx.lineTo(x + s * 0.4, b - s * 0.13 * r); ctx.stroke(); }
    ctx.fillStyle = shade('#5a4030', light); ctx.fillRect(x - s * 0.36, b - s * 1.0, s * 0.06, s * 0.62); ctx.fillRect(x + s * 0.3, b - s * 1.0, s * 0.06, s * 0.62);   // posts
    ctx.fillStyle = shade('#4a3a30', light); ctx.beginPath(); ctx.moveTo(x - s * 0.5, b - s * 0.95); ctx.lineTo(x, b - s * 1.25); ctx.lineTo(x + s * 0.5, b - s * 0.95); ctx.fill();   // roof
    ctx.strokeStyle = shade('#3a2e24', light); ctx.beginPath(); ctx.moveTo(x, b - s * 0.95); ctx.lineTo(x, b - s * (person && person.task === 'well' && person.state === 'work' ? 0.55 : 0.7)); ctx.stroke();   // rope
    if (!(person && person.carrying)) { ctx.fillStyle = shade('#6a6e74', light); ctx.fillRect(x - s * 0.07, b - s * 0.72, s * 0.14, s * 0.12); }   // bucket on the rope
  }
  function drawHorse(ctx, a, y, s, light, t) {
    ctx.save(); ctx.translate(a.x, y); ctx.scale(a.dir, 1);
    const col = shade(a.coat, light); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.07;
    for (const lx of [-0.32, -0.22, 0.25, 0.35]) { ctx.beginPath(); ctx.moveTo(lx * s, -s * 0.5); ctx.lineTo(lx * s, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -s * 0.62, s * 0.45, s * 0.18, 0, 0, 6.3); ctx.fill();
    // V112: grazing, the head is down nearly all the time; now and then it comes up slowly, looks
    // around a while, and goes slowly back down (a.head: 0 down, 1 up, eased).
    const u = a.head * a.head * (3 - 2 * a.head), hx = s * 0.55, hy = -s * (0.12 + 0.88 * u);
    ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(s * 0.35, -s * 0.7); ctx.lineTo(hx, hy + s * (-0.08 + 0.18 * u)); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx + s * 0.07, hy, s * 0.16, s * 0.07, 1.2 - 0.7 * u, 0, 6.3); ctx.fill();
    ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.66); ctx.quadraticCurveTo(-s * 0.62, -s * 0.5, -s * 0.58, -s * 0.28); ctx.stroke();   // tail
    ctx.restore();
  }
  function drawGoat(ctx, a, y, s, light, t) {
    ctx.save(); ctx.translate(a.x, y); ctx.scale(a.dir, 1);
    const col = shade(a.coat, light); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    for (const lx of [-0.25, 0.22]) { ctx.beginPath(); ctx.moveTo(lx * s, -s * 0.35); ctx.lineTo(lx * s, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -s * 0.42, s * 0.32, s * 0.14, 0, 0, 6.3); ctx.fill();
    const bob = Math.sin(t / 200 + a.x) > 0.3 ? s * 0.2 : 0;
    ctx.beginPath(); ctx.ellipse(s * 0.36, -s * 0.62 + bob, s * 0.11, s * 0.08, 0.3, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * 0.32, -s * 0.68 + bob); ctx.lineTo(s * 0.24, -s * 0.8 + bob); ctx.stroke();   // horn
    ctx.restore();
  }
  function drawHen(ctx, a, y, s, light, t) {
    const peck = Math.sin(t / 25 + a.peck) > 0.6;
    ctx.save(); ctx.translate(a.x, y); ctx.scale(a.dir, 1);
    ctx.fillStyle = shade(a.coat, light); ctx.beginPath(); ctx.ellipse(0, -s * 0.35, s * 0.3, s * 0.22, -0.2, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.28, peck ? -s * 0.15 : -s * 0.55, s * 0.13, 0, 6.3); ctx.fill();
    ctx.fillStyle = shade('#c0302a', light, 0.4); ctx.beginPath(); ctx.arc(s * 0.3, peck ? -s * 0.27 : -s * 0.68, s * 0.06, 0, 6.3); ctx.fill();   // comb
    ctx.restore();
  }
  function drawPeacock(ctx, a, y, s, light, t) {
    ctx.save(); ctx.translate(a.x, y); ctx.scale(a.dir, 1);
    const fan = Math.sin(t / 900) > 0.7;     // fans its tail now and then
    if (fan) {
      for (let i = 0; i < 9; i++) { const ang = Math.PI * (0.15 + i * 0.09); ctx.fillStyle = shade(i % 2 ? '#2f6a5a' : '#3a7f6a', light, 0.3);
        ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.4); ctx.arc(-s * 0.1, -s * 0.4, s * 0.9, ang + Math.PI * 0.5, ang + Math.PI * 0.59); ctx.fill(); }
    } else {
      ctx.fillStyle = shade('#2f6a5a', light, 0.3); ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.35); ctx.lineTo(-s * 1.1, -s * 0.12); ctx.lineTo(-s * 1.05, -s * 0.02); ctx.lineTo(-s * 0.1, -s * 0.25); ctx.fill();
    }
    ctx.fillStyle = shade('#1f4f8a', light, 0.3); ctx.beginPath(); ctx.ellipse(0, -s * 0.38, s * 0.2, s * 0.14, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = shade('#1f4f8a', light, 0.3); ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(s * 0.12, -s * 0.45); ctx.lineTo(s * 0.2, -s * 0.8); ctx.stroke();
    ctx.restore();
  }
  function drawPaddock(ctx, env, L, dt) {
    const p = L.pad, light = env.light, S = L.S, W = env.W, t = env.t;
    // The little coop at the far end, half out of the picture.
    const cx = Math.min(W - S * 0.15, p.x0 + (W - p.x0) * 0.82);
    ctx.fillStyle = shade('#6a4a34', light); ctx.fillRect(cx, p.base - S * 0.42, S * 0.4, S * 0.32);
    ctx.fillStyle = shade('#3e3a36', light); ctx.beginPath(); ctx.moveTo(cx - S * 0.05, p.base - S * 0.42); ctx.lineTo(cx + S * 0.2, p.base - S * 0.6); ctx.lineTo(cx + S * 0.45, p.base - S * 0.42); ctx.fill();
    ctx.fillStyle = shade('#1a1612', light); ctx.fillRect(cx + S * 0.05, p.base - S * 0.22, S * 0.1, S * 0.12);
    // Back rail, the animals, then the front rails and posts over them.
    const rail = (yy) => { ctx.fillStyle = shade('#7a5a3e', light); ctx.fillRect(p.x0, yy, p.x1 - p.x0, Math.max(2, S * 0.035)); };
    rail(p.base - p.h * 1.05);
    const dayKey = env.now.toDateString();
    if (!critters || critterDay !== dayKey) { critters = pickCritters(env, L); critterDay = dayKey; }
    const span = Math.max(10, Math.min(W, p.x1) - p.x0);
    for (const a of critters) {
      const out = a.kind === 'hen' || a.kind === 'peacock' ? env.light > 0.45 : true;   // birds roost by dusk
      if (!out) continue;
      // Each wanders a little now and then, inside the fence.
      if (env.now > a.next) { a.next = +env.now + rnd(20, 120) * 1000 * (a.kind === 'hen' ? 0.2 : 1); a.to = p.x0 + span * (0.08 + 0.84 * Math.random()); }
      if (a.to !== undefined) { const step = (a.kind === 'hen' ? 0.4 : 0.15) * dt * 60; if (Math.abs(a.to - a.x) > step) { a.dir = a.to > a.x ? 1 : -1; a.x += a.dir * step; } }
      const y = p.base - p.h * 0.05;
      if (a.kind === 'horse') {
        const nowMs = +env.now;
        if (nowMs >= a.headNext) {                                    // down 25-90 s, up 4-12 s
          if (a.headTo === 0) { a.headTo = 1; a.headNext = nowMs + rnd(4, 12) * 1000 + 2500; }
          else { a.headTo = 0; a.headNext = nowMs + rnd(25, 90) * 1000 + 4000; }
        }
        const rate = a.headTo ? dt / 2.5 : dt / 4;                    // about 2.5 s up, 4 s back down
        a.head = a.headTo ? Math.min(1, a.head + rate) : Math.max(0, a.head - rate);
        drawHorse(ctx, a, y, S * 0.48, light, t);
      }
      else if (a.kind === 'goat') drawGoat(ctx, a, y, S * 0.34, light, t);
      else if (a.kind === 'hen') drawHen(ctx, a, y + S * 0.03, S * 0.15, light, t);
      else drawPeacock(ctx, a, y, S * 0.3, light, t);
    }
    rail(p.base - p.h * 0.75); rail(p.base - p.h * 0.35);
    ctx.fillStyle = shade('#5e4430', light);
    for (let x = p.x0; x < Math.min(W + 20, p.x1); x += Math.max(S * 0.55, 30)) ctx.fillRect(x, p.base - p.h * 1.15, Math.max(3, S * 0.05), p.h * 1.15);
  }
  function drawPerson(ctx, env, L) {
    const P = person, s = L.S * 0.55, light = env.light, x = P.x, y = P.y;
    const walking = P.state === 'walk', sw = walking ? Math.sin(env.t / 8) * s * 0.08 : 0;
    const work = P.state === 'work' ? Math.sin(env.t / 25) : 0;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = shade('#2e3a4e', light); ctx.lineWidth = s * 0.09;          // jeans
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.42); ctx.lineTo(x - s * 0.05 + sw, y); ctx.moveTo(x, y - s * 0.42); ctx.lineTo(x + s * 0.05 - sw, y); ctx.stroke();
    ctx.fillStyle = shade('#7a2e26', light); ctx.fillRect(x - s * 0.1, y - s * 0.8, s * 0.2, s * 0.4);   // a red work coat
    ctx.fillStyle = shade('#d8b090', light); ctx.beginPath(); ctx.arc(x, y - s * 0.9, s * 0.08, 0, 6.3); ctx.fill();
    const cold = [10, 11, 0, 1, 2].includes(env.now.getMonth());
    ctx.fillStyle = shade(cold ? '#3a4a5e' : '#5a5040', light); ctx.fillRect(x - s * 0.085, y - s * 1.0, s * 0.17, s * 0.06);   // hat
    ctx.strokeStyle = shade('#7a2e26', light); ctx.lineWidth = s * 0.07;
    if (P.state === 'work' && P.task === 'panels') {             // a long brush up to the panel
      const ex = x + s * 0.35, ey = y - s * 1.15 - work * s * 0.15;
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x + s * 0.14, y - s * 0.95); ctx.stroke();
      ctx.strokeStyle = shade('#8a6a44', light); ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(x + s * 0.1, y - s * 0.85); ctx.lineTo(ex, ey); ctx.stroke();
    } else if (P.state === 'work' && P.task === 'garden') {            // V112: a hoe in April, a bucket to water in summer, a basket in the fall
      if (P.tool === 'till') {
        const hx = x + s * 0.3, hy = y - s * 0.05 + work * s * 0.08;
        ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x + s * 0.12, y - s * 0.6); ctx.stroke();
        ctx.strokeStyle = shade('#8a6a44', light); ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(x - s * 0.05, y - s * 0.85); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.strokeStyle = shade('#5a5e64', light); ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + s * 0.07, hy + s * 0.02); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x + s * 0.16, y - s * (0.5 + work * 0.06)); ctx.stroke();
        ctx.fillStyle = shade(P.tool === 'pick' ? '#9a7a4a' : '#6a6e74', light); ctx.fillRect(x + s * 0.12, y - s * 0.5, s * 0.14, s * 0.11);
      }
    } else if (P.state === 'work' && P.task === 'well') {
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x + s * 0.2, y - s * (0.85 + work * 0.1)); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.75); ctx.lineTo(x - s * 0.12 - sw, y - s * 0.45); ctx.moveTo(x + s * 0.08, y - s * 0.75); ctx.lineTo(x + s * 0.12 + sw, y - s * 0.45); ctx.stroke();
      if (P.carrying) { ctx.fillStyle = shade('#6a6e74', light); ctx.fillRect(x + s * 0.08, y - s * 0.45, s * 0.12, s * 0.12); }
      if (P.task === 'paddock' && P.state === 'work') { ctx.fillStyle = shade('#c8a860', light); ctx.fillRect(x - s * 0.25, y - s * 0.55, s * 0.18, s * 0.12); }   // a flake of hay
    }
    ctx.restore();
  }

  // ---- the person's day -------------------------------------------------------------
  function planOuting(env, L) {
    const snowy = load.some(v => v > 0.25);
    const r = Math.random(), hour = env.now.getHours();
    const feeding = hour < 9 || hour >= 15;
    const farmWork = window.Farm ? Farm.work(env) : null;                     // V112: the garden in season
    const task = snowy ? 'panels' : farmWork && Math.random() < 0.4 ? 'garden' : r < (feeding ? 0.55 : 0.35) ? 'paddock' : r < 0.7 ? 'well' : 'panels';
    person = { x: L.door.x, y: L.door.base, state: 'walk', task, tool: farmWork, carrying: false, stops: [] };
    if (task === 'panels') {
      const cols = [...Array(8).keys()];
      const order = snowy ? cols.filter(c => load[c] > 0.05 || load[c + 8] > 0.05) : [cols[(Math.random() * 8) | 0], cols[(Math.random() * 8) | 0]];
      person.stops = (order.length ? order : [3]).map(c => ({ x: L.arr.x0 + (c + 0.5) * L.arr.pw, col: c, dwell: snowy ? rnd(70, 140) : rnd(120, 360) }));
    } else if (task === 'well') person.stops = [{ x: L.well.x + L.well.s * 0.5, dwell: rnd(40, 90), fill: true }];
    else if (task === 'garden') {
      const g = Farm.garden(env), rows = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5).slice(0, 2 + ((Math.random() * 2) | 0));
      if (farmWork === 'tend') person.stops.push({ x: L.well.x + L.well.s * 0.5, dwell: rnd(40, 80), fill: true });   // water from the well first
      for (const ri of rows) person.stops.push({ x: g.x0 + (g.x1 - g.x0) * rnd(0.15, 0.85), y: g.rows[ri] + env.H * 0.004, dwell: rnd(150, 420), empty: farmWork === 'tend' });
      person.stops.push({ x: L.door.x, y: L.door.base, dwell: 0, home: true });
      person.target = person.stops.shift(); return;
    }
    else person.stops = [{ x: L.pad.x0 + rnd(0.1, 0.5) * Math.max(40, env.W - L.pad.x0), dwell: rnd(240, 600) }];
    person.stops.push({ x: L.door.x, dwell: 0, home: true });
    person.target = person.stops.shift();
  }
  function stepPerson(env, L, dt) {
    const now = +env.now;
    if (!person) {
      if (env.light < 0.55) return;
      if (window.Farm && Farm.busy(env)) return;                                 // he's out on the tractor
      if (!nextOuting) nextOuting = now + rnd(2, 25) * 60e3;
      if (preview || now >= nextOuting) { planOuting(env, L); nextOuting = now + rnd(20, 70) * 60e3; }
      return;
    }
    const P = person;
    if (env.light < 0.4 && !P.target.home) { P.stops = []; P.target = { x: L.door.x, dwell: 0, home: true }; P.state = 'walk'; }   // in by dark
    const groundAt = (x) => env.groundY(Math.max(0, Math.min(env.W - 1, x))) + env.H * 0.025;
    if (P.state === 'walk') {
      const step = env.W / 150 * dt;          // a slow walk: across the yard in a couple of minutes
      const onPath = P.target.y === undefined && Math.abs(P.y - groundAt(P.x)) < 3;   // along the yard: follow the ground
      if (onPath) {
        if (Math.abs(P.target.x - P.x) <= step) { P.x = P.target.x; P.state = 'work'; P.until = now + P.target.dwell * 1000; }
        else P.x += Math.sign(P.target.x - P.x) * step;
        P.y = groundAt(P.x);
        return;
      }
      const ty = P.target.y !== undefined ? P.target.y : groundAt(P.target.x);        // V112: out into the garden rows and back
      const dx = P.target.x - P.x, dy = ty - P.y, dist = Math.hypot(dx, dy);
      if (dist <= step) { P.x = P.target.x; P.y = ty; P.state = 'work'; P.until = now + P.target.dwell * 1000; }
      else { P.x += dx / dist * step; P.y += dy / dist * step; }
      return;
    }
    // Working: clearing snow takes it off this column of panels over the stay.
    if (P.task === 'panels' && P.target.col !== undefined) {
      const c = P.target.col, k = dt / Math.max(1, P.target.dwell);
      load[c] = Math.max(0, load[c] - k * 1.2); load[c + 8] = Math.max(0, load[c + 8] - k * 1.2);
    }
    if (now >= P.until) {
      if (P.target.home) { person = null; return; }
      if (P.target.fill) P.carrying = true;
      if (P.target.empty) P.carrying = false;                                    // watered the row
      P.target = P.stops.shift() || { x: L.door.x, dwell: 0, home: true }; P.state = 'walk';
    }
  }

  function stepSnow(env, dt) {
    const snowing = env.fall === 'snow' || env.fall === 'mix';
    for (let k = 0; k < 16; k++) {
      if (snowing) load[k] = Math.min(1, load[k] + Math.max(0.05, env.rate) * dt / 900);   // builds over a quarter hour or so
      else if (env.light > 0.6) load[k] = Math.max(0, load[k] - dt / 2400);              // dark panels shed snow in the sun
    }
  }

  // env: { W, H, t, now, light, fall, rate, groundY(x), house }
  function back(ctx, env) {
    const nowMs = performance.now(), dt = lastT ? Math.min(0.1, (nowMs - lastT) / 1000) : 0.016; lastT = nowMs;
    const L = layout(env);
    if (preview && !person && !load.some(v => v > 0) && (env.fall === 'snow' || env.fall === 'mix')) load.fill(0.8);
    stepSnow(env, dt); stepPerson(env, L, dt);
    drawArray(ctx, env, L); drawWell(ctx, env, L); drawPaddock(ctx, env, L, dt);
  }
  function front(ctx, env) { drawHouseEnd(ctx, env); if (person) drawPerson(ctx, env, layout(env)); }
  window.Homestead = { back, front, debug: () => ({ person: person && { task: person.task, state: person.state, x: Math.round(person.x) }, snow: load.map(v => +v.toFixed(2)), critters: (critters || []).map(c => c.kind) }) };
})();
