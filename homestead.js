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
//   - GOOSE HUNTING (V153), only on days and hours the real season is open where we are
//     (Centre County is in Pennsylvania's Resident Population goose zone): when a flock of geese
//     goes over and he's in the house, he sees it out the back window now and then, comes out
//     with his shotgun and stands in the yard. A few geese come in low; he raises the gun and
//     takes one shot, with a small puff of smoke and a faint, far-off report. Some tries miss and
//     the flock flares away, and he goes back in to wait for the next one. When he gets one, it
//     tumbles down into the yard; he walks over, picks it up, carries it by the neck to the
//     house and goes in. One goose a day, then he's done; the rest of the time he goes about his
//     chores as before. Never swans, never on a Sunday.
//     2026-27 seasons, Game Commission (Resident Population Zone): Canada geese Sept 1-25, Oct
//     24-Nov 27, Dec 15-Jan 18, Jan 29-Feb 20; light (snow) geese Nov 6-Mar 10. Hours: half an
//     hour before sunrise to sunset (to half an hour after sunset in the September season).
//     Later years use the same dates until they're updated here.
// Preview for checking: ?homestead=hunt sends him out to hunt now (and he gets one).
// Preview for checking: ?homestead=work sends the person out now (to clear snow, if any;
// add &wx=snow to see it).
(() => {
  const q = location.search, preview = /[?&]homestead=work\b/.test(q), huntPreview = /[?&]homestead=hunt\b/.test(q);
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
    pad.far = W + S * 3;                                                         // V117: where the horses' paddock really ends, out of sight
    const door = { x: house.x + house.w * 0.5, base: house.base + H * 0.012 };
    return { S, arr, well, pad, door };
  }

  // ---- the animals in the paddock --------------------------------------------------
  function pickCritters(env, L) {
    const r = daySeed(env.now), list = [];
    const span = Math.max(10, (Math.min(env.W, L.pad.x1) - L.pad.x0));
    const at = () => L.pad.x0 + span * (0.1 + 0.8 * r());
    // V117: a herd of 2 to 4 horses that has the run of a long paddock, most of it off the right
    // edge of the picture. Who's in view is random: none, one or two, different ones at different
    // times, wandering in and out, grazing, heads coming up. They come together at feeding time.
    { const n = 2 + ((r() * 3) | 0);
      for (let i = 0; i < n; i++) list.push({ kind: 'horse', x: L.pad.x0 + (L.pad.far - L.pad.x0) * r(), dir: r() < 0.5 ? 1 : -1,
        coat: i === 0 || r() < 0.3 ? '#d8d2c8' : ['#5a3c26', '#2b2420', '#8a6a4a'][(r() * 3) | 0], next: 0, head: 0, headTo: 0, headNext: 0 }); }
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
    // V116: a mane along the top of the neck, well groomed: an even band combed flat, with fine
    // strands lying back toward the withers. Silver-white on the white horse, near black on the rest.
    {
      const x0 = s * 0.35, y0 = -s * 0.7, x1 = hx, y1 = hy + s * (-0.08 + 0.18 * u);
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len, ny = dx / len; if (ny > 0) { nx = -nx; ny = -ny; }           // the crest side, up and over
      const mane = shade(a.coat === '#d8d2c8' ? '#a39c90' : '#1c1612', light);
      const at = (f, off) => [x0 + dx * f + nx * off, y0 + dy * f + ny * off];
      ctx.fillStyle = mane; ctx.beginPath();
      for (let f = 0.02; f <= 0.92; f += 0.1) { const [px, py] = at(f, s * 0.065); f === 0.02 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      for (let f = 0.92; f >= 0.02; f -= 0.1) { const [px, py] = at(f, s * (0.14 - 0.03 * f)); ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill();
      const sheen = shade(a.coat === '#d8d2c8' ? '#e2ddd4' : '#3a302a', light);          // fine combed lines inside the mane, all lying back
      ctx.strokeStyle = sheen; ctx.lineWidth = Math.max(0.6, s * 0.008); ctx.lineCap = 'round';
      for (let f = 0.1; f <= 0.88; f += 0.06) {
        const [px, py] = at(f, s * 0.075), [qx, qy] = at(f - 0.05, s * 0.12);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
      }
      ctx.strokeStyle = mane; ctx.lineWidth = Math.max(1, s * 0.022);
      const [fx, fy] = at(0.97, s * 0.05);                                             // a short, neat forelock at the poll
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + s * 0.05, fy + s * 0.04 * (1 - u) + s * 0.025); ctx.stroke();
      ctx.lineWidth = s * 0.16; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
    }
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
    const horses = critters.filter(a => a.kind === 'horse');
    const feeding = person && person.task === 'paddock' && (person.state === 'work' || person.target && !person.target.home && person.target.x > p.x0) ? (person.state === 'work' ? person : person.target) : null;
    for (const a of critters) {
      const out = a.kind === 'hen' || a.kind === 'peacock' ? env.light > 0.45 : true;   // birds roost by dusk
      if (!out) continue;
      // Each wanders a little now and then, inside the fence.
      const horse = a.kind === 'horse';
      if (horse && feeding) {                                         // feeding time: they come over and stand together near the hay
        const k = horses.indexOf(a), side = k % 2 ? 1 : -1;
        a.to = Math.max(p.x0 + S * 0.25, feeding.x + side * S * 0.55 * Math.ceil((k + 1) / 2) - S * 0.1); a.next = +env.now + rnd(30, 90) * 1000;
      } else if (env.now > a.next) {
        a.next = +env.now + rnd(20, 120) * 1000 * (a.kind === 'hen' ? 0.2 : 1) * (horse ? rnd(1, 3) : 1);
        a.to = horse ? p.x0 + S * 0.25 + (p.far - p.x0) * Math.random() : p.x0 + span * (0.08 + 0.84 * Math.random());
      }
      if (a.to !== undefined) { const step = (a.kind === 'hen' ? 0.4 : 0.15) * dt * 60; if (Math.abs(a.to - a.x) > step) { a.dir = a.to > a.x ? 1 : -1; a.x += a.dir * step; } }
      if (a.x > W + S) continue;                                      // out of sight down the paddock
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
    rail(p.base - p.h * 1.08); rail(p.base - p.h * 0.75); rail(p.base - p.h * 0.35);   // V115: a top rail in front too
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
    } else if (P.state === 'work' && P.task === 'corn') {             // reaching back into the corn to feel an ear
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x - s * 0.1, y - s * (0.95 + work * 0.03)); ctx.stroke();
      ctx.fillStyle = shade('#c8a858', light); ctx.beginPath(); ctx.ellipse(x - s * 0.12, y - s * 0.98, s * 0.025, s * 0.06, 0.4, 0, 6.3); ctx.fill();
    } else if (P.state === 'work' && P.task === 'well') {
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x + s * 0.2, y - s * (0.85 + work * 0.1)); ctx.stroke();
    } else if (P.task === 'hunt') {                                   // V153: the shotgun, and the goose
      const d = P.dir === undefined ? -1 : P.dir, face = -d;                    // he faces the geese coming in
      const bend = P.state === 'work' && P.target.pick;
      const wood = shade('#6a4a2e', light), steel = shade('#2a2a2c', Math.max(0.4, light));
      if (bend) {                                                                // reaching down for it
        ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x + face * s * 0.18, y - s * 0.12); ctx.stroke();
        if (fallen) { fallen.x = x + face * s * 0.22; }
      } else if (P.aim) {                                                        // shouldered, pointing up at them
        const ang = -Math.PI / 2 + face * 0.75, kick = P.shot && +env.now - P.shot < 300 ? s * 0.03 : 0;
        const bx = x + face * s * 0.05 - face * kick, by = y - s * 0.78, mx = bx + Math.cos(ang) * s * 0.55, my = by + Math.sin(ang) * s * 0.55;
        ctx.beginPath(); ctx.moveTo(x, y - s * 0.74); ctx.lineTo(bx + Math.cos(ang) * s * 0.22, by + Math.sin(ang) * s * 0.22); ctx.stroke();
        ctx.strokeStyle = wood; ctx.lineWidth = s * 0.045; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang) * s * 0.2, by + Math.sin(ang) * s * 0.2); ctx.stroke();
        ctx.strokeStyle = steel; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(bx + Math.cos(ang) * s * 0.2, by + Math.sin(ang) * s * 0.2); ctx.lineTo(mx, my); ctx.stroke();
        if (puff && !puff.placed) { puff.x = mx; puff.y = my; puff.placed = true; }
      } else {                                                                   // carried, muzzle up, over the shoulder
        ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.75); ctx.lineTo(x - s * 0.12 - sw, y - s * 0.45); ctx.moveTo(x + s * 0.06, y - s * 0.75); ctx.lineTo(x + s * 0.1, y - s * 0.6); ctx.stroke();
        ctx.strokeStyle = wood; ctx.lineWidth = s * 0.045; ctx.beginPath(); ctx.moveTo(x + s * 0.12, y - s * 0.5); ctx.lineTo(x + s * 0.1, y - s * 0.68); ctx.stroke();
        ctx.strokeStyle = steel; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(x + s * 0.1, y - s * 0.68); ctx.lineTo(x + s * 0.02, y - s * 1.12); ctx.stroke();
      }
      if (P.carryGoose && !bend) {                                               // the other hand, holding it by the neck
        ctx.strokeStyle = shade('#7a2e26', light); ctx.lineWidth = s * 0.07;
        ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.75); ctx.lineTo(x - s * 0.14, y - s * 0.46); ctx.stroke();
        drawGoose(ctx, x - s * 0.14, y - s * 0.46, s, P.carryGoose, light, 'hang');
      }
    } else {
      ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.75); ctx.lineTo(x - s * 0.12 - sw, y - s * 0.45); ctx.moveTo(x + s * 0.08, y - s * 0.75); ctx.lineTo(x + s * 0.12 + sw, y - s * 0.45); ctx.stroke();
      if (P.carrying) { ctx.fillStyle = shade('#6a6e74', light); ctx.fillRect(x + s * 0.08, y - s * 0.45, s * 0.12, s * 0.12); }
      if (P.task === 'paddock' && P.state === 'work') { ctx.fillStyle = shade('#c8a860', light); ctx.fillRect(x - s * 0.25, y - s * 0.55, s * 0.18, s * 0.12); }   // a flake of hay
    }
    ctx.restore();
  }

  // ---- goose hunting (V153) ------------------------------------------------------------
  const SEASONS = {                                // month*100+day, Resident Population Zone, 2026-27
    goose: [[901, 925, true], [1024, 1127], [1215, 1231], [101, 118], [129, 220]],
    snow: [[1106, 1231], [101, 310]],
  };
  function huntOpen(env, kind) {
    const d = env.now, md = (d.getMonth() + 1) * 100 + d.getDate();
    if (d.getDay() === 0 || !SEASONS[kind]) return false;                      // Sundays closed; never swans
    const seg = SEASONS[kind].find(([a, b]) => md >= a && md <= b); if (!seg) return false;
    if (!env.sun) return false;
    const t = +d, late = seg[2] ? 30 * 60e3 : 0;                                // the September season runs later
    return t >= env.sun.rise - 30 * 60e3 && t <= env.sun.set + late;
  }
  const hunt = { day: '', bagged: false, tries: 0, nextLook: 0, seen: 0 };
  let fallen = null, puff = null;
  function standX(env, L) { const hx = env.house.x + env.house.w; return L.pad.x0 - Math.max(20, L.pad.x0 - hx) * 0.22; }   // past the trash can, by the fence
  function planHunt(env, L, kind, dir) {
    person = { x: L.door.x, y: L.door.base, state: 'walk', task: 'hunt', kind, dir, gun: true, carrying: false, stops: [] };
    person.target = { x: standX(env, L), dwell: 600, hunt: true };          // he stays till a flock comes in
  }
  function stepHunt(env, L, P, now) {
    if (P.state !== 'work') return;
    const W = Wildlife;
    if (P.target.hunt) {
      if (!P.flock && !P.shot) {                                            // standing: a few come in low
        P.waitTill = P.waitTill || now + rnd(8, 25) * 1000;
        if (now < P.waitTill) return;
        const S = L.S;
        P.flock = W.huntFlock({ kind: P.kind, dir: P.dir, W: env.W, y: P.y - S * rnd(2.4, 3), ty: P.y - S * rnd(1.3, 1.7), size: S * 0.075, speed: env.W / 1500 });
        return;
      }
      if (P.flock && !P.shot) {
        const a = W.lead(P.flock);
        if (!a) { P.shot = now; P.hit = false; return; }                      // they went by
        const ahead = (P.x - a.x) * a.dir;                                     // how far the lead still has to come
        P.aim = ahead < env.W * 0.3;
        if (ahead < L.S * 0.15) {
          P.shot = now; puff = { x: P.x + P.dir * -L.S * 0.3, y: P.y - L.S * 0.85, t: now };
          P.hit = huntPreview || hunt.tries > 0 || Math.random() < 0.5;          // he always gets one by the second try
          if (window.BirdCalls && BirdCalls.shot) BirdCalls.shot();
          if (P.hit) { const b = W.down(P.flock, P.x); if (b) fallen = { ...b, vy: 0, vx: b.dir * b.speed * 0.5, rot: 0, landed: false }; else P.hit = false; }
          else W.flare(P.flock);
        }
        return;
      }
      if (now - P.shot < 2500) return;                                       // lowers the gun, watches
      P.aim = false;
      if (P.hit && fallen) {
        if (!fallen.landed) return;
        P.target = { x: fallen.x, dwell: rnd(3, 5), pick: true }; P.state = 'walk'; return;
      }
      hunt.tries++; hunt.nextLook = now + rnd(15, 40) * 60e3;               // missed: back in to wait for another
      P.target = { x: L.door.x, dwell: 0, home: true }; P.state = 'walk';
    }
  }
  function stepFallen(env, L, dt) {
    if (!fallen || fallen.landed) return;
    const gy = env.groundY(Math.max(0, Math.min(env.W - 1, fallen.x))) + env.H * 0.025;
    fallen.vy += L.S * 0.0009 * dt * 60; fallen.y += fallen.vy * dt * 60; fallen.x += fallen.vx * dt * 60; fallen.rot += 0.08 * dt * 60;
    if (fallen.y >= gy) { fallen.y = gy; fallen.landed = true; fallen.rot = 0; fallen.x = Math.max(L.S * 0.3, Math.min(env.W - L.S * 0.3, fallen.x)); }
  }
  // A goose: dark brown with a black neck (Canada) or white with black wingtips (snow).
  function drawGoose(ctx, x, y, s, kind, light, pose, rot) {
    const body = kind === 'snow' ? '#eeece6' : '#6a5a4a', neck = kind === 'snow' ? '#eeece6' : '#1e1c1a';
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.lineCap = 'round';
    if (pose === 'hang') {                                                   // carried by the neck
      ctx.strokeStyle = shade(neck, light); ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s * 0.18); ctx.stroke();
      ctx.fillStyle = shade(body, light); ctx.beginPath(); ctx.ellipse(0, s * 0.3, s * 0.07, s * 0.14, 0, 0, 6.3); ctx.fill();
      if (kind === 'snow') { ctx.fillStyle = shade('#1e1c1a', light); ctx.fillRect(-s * 0.06, s * 0.4, s * 0.12, s * 0.04); }
    } else {                                                                  // lying in the grass, or tumbling down
      ctx.fillStyle = shade(body, light); ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.15, s * 0.06, 0, 0, 6.3); ctx.fill();
      ctx.strokeStyle = shade(neck, light); ctx.lineWidth = s * 0.045; ctx.beginPath(); ctx.moveTo(s * 0.12, -s * 0.06); ctx.lineTo(s * 0.26, -s * 0.03); ctx.stroke();
      if (kind === 'snow') { ctx.fillStyle = shade('#1e1c1a', light); ctx.fillRect(-s * 0.15, -s * 0.08, s * 0.05, s * 0.04); }
    }
    ctx.restore();
  }
  function drawHuntExtras(ctx, env, L) {
    const light = env.light, s = L.S * 0.55;
    if (fallen && !(person && person.carryGoose)) drawGoose(ctx, fallen.x, fallen.y, s, fallen.kind, light, 'lie', fallen.rot);
    if (puff) {                                                               // a small grey puff, drifting and fading
      const age = (+env.now - puff.t) / 1000;
      if (age > 2.5) puff = null;
      else { ctx.save(); ctx.globalAlpha = 0.45 * (1 - age / 2.5); ctx.fillStyle = shade('#c8c8c4', Math.max(0.5, light));
        ctx.beginPath(); ctx.arc(puff.x + age * s * 0.15, puff.y - age * s * 0.1, s * (0.05 + age * 0.08), 0, 6.3); ctx.fill(); ctx.restore(); }
    }
  }

  // ---- the person's day -------------------------------------------------------------
  function planOuting(env, L) {
    const snowy = load.some(v => v > 0.25);
    const r = Math.random(), hour = env.now.getHours();
    const feeding = hour < 9 || hour >= 15;
    const farmWork = window.Farm ? Farm.work(env) : null;                     // V112: the garden in season
    const checkCorn = window.Farm && Farm.cornCheck(env) && Math.random() < 0.3;   // V118: out to feel the corn
    const task = snowy ? 'panels' : checkCorn ? 'corn' : farmWork && Math.random() < 0.4 ? 'garden' : r < (feeding ? 0.55 : 0.35) ? 'paddock' : r < 0.7 ? 'well' : 'panels';
    person = { x: L.door.x, y: L.door.base, state: 'walk', task, tool: farmWork, carrying: false, stops: [] };
    if (task === 'panels') {
      const cols = [...Array(8).keys()];
      const order = snowy ? cols.filter(c => load[c] > 0.05 || load[c + 8] > 0.05) : [cols[(Math.random() * 8) | 0], cols[(Math.random() * 8) | 0]];
      person.stops = (order.length ? order : [3]).map(c => ({ x: L.arr.x0 + (c + 0.5) * L.arr.pw, col: c, dwell: snowy ? rnd(70, 140) : rnd(120, 360) }));
    } else if (task === 'well') person.stops = [{ x: L.well.x + L.well.s * 0.5, dwell: rnd(40, 90), fill: true }];
    else if (task === 'corn') person.stops = [{ x: L.arr.x1 + (L.well.x - L.well.s * 0.6 - L.arr.x1) * rnd(0.3, 0.7), dwell: rnd(90, 240) }];
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
      // V153: geese going over, the season open and none in yet today: now and then he goes out.
      const dk = env.now.toDateString(); if (hunt.day !== dk) { hunt.day = dk; hunt.bagged = false; hunt.tries = 0; }
      if (window.Wildlife && Wildlife.flockOverhead && !hunt.bagged && (huntPreview || now >= hunt.nextLook)) {
        const f = Wildlife.flockOverhead(env.W);
        if (huntPreview && !hunt.tries && !fallen) { const k = huntOpen(env, 'goose') || !huntOpen(env, 'snow') ? 'goose' : 'snow'; planHunt(env, L, k, f ? f.dir : -1); return; }
        if (f && f.id !== hunt.seen && huntOpen(env, f.kind)) {
          hunt.seen = f.id;
          if (Math.random() < 0.6) { planHunt(env, L, f.kind, f.dir); return; }
        }
      }
      if (!nextOuting) nextOuting = now + rnd(2, 25) * 60e3;
      if (preview || now >= nextOuting) { planOuting(env, L); nextOuting = now + rnd(20, 70) * 60e3; }
      return;
    }
    const P = person;
    if (P.task === 'hunt') {                                                    // V153
      if (P.target.hunt && !P.shot && P.state === 'work' && !huntOpen(env, P.kind) && !huntPreview) { P.target = { x: L.door.x, dwell: 0, home: true }; P.state = 'walk'; }
      stepHunt(env, L, P, now);
    }
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
      if (P.target.home) { if (P.carryGoose) { hunt.bagged = true; hunt.nextLook = Infinity; } person = null; return; }
      if (P.target.pick) { P.carryGoose = fallen ? fallen.kind : P.kind; fallen = null; P.target = { x: L.door.x, dwell: 0, home: true }; P.state = 'walk'; return; }
      if (P.target.hunt) return;                                                  // stepHunt moves him on
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
    stepSnow(env, dt); stepPerson(env, L, dt); stepFallen(env, L, dt);
    drawArray(ctx, env, L); drawWell(ctx, env, L); drawPaddock(ctx, env, L, dt);
  }
  function front(ctx, env) { const L = layout(env); drawHouseEnd(ctx, env); drawHuntExtras(ctx, env, L); if (person) drawPerson(ctx, env, L); }
  window.Homestead = { back, front, huntOpen, debug: () => ({ person: person && { task: person.task, state: person.state, x: Math.round(person.x), aim: !!person.aim, shot: !!person.shot, hit: !!person.hit, carrying: person.carryGoose || null }, fallen: fallen && { landed: fallen.landed, x: Math.round(fallen.x) }, hunt: { ...hunt }, snow: load.map(v => +v.toFixed(2)), critters: (critters || []).map(c => c.kind), horses: (critters || []).filter(c => c.kind === 'horse').map(c => Math.round(c.x)) }) };
})();
