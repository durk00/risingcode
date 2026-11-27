// LIFE AROUND THE HOUSE (Nov 24, 2026, V77): what really goes on outside a house in the woods
// of Happy Valley, at the times it really happens, on the Winter scene.
//
// The timing follows the Pennsylvania Game Commission:
//   - DEER are most active at dawn and dusk; some move at night, few at midday. Activity
//     surges in the fall rut (mid-October through November). They cross in ones to fours,
//     stop to graze, and flick a white tail.
//   - BLACK BEARS are active April through October, mostly at dusk and dawn and at night,
//     and come for trash cans, bird feeders and grills. They den in mid to late November
//     (pregnant females first, males weeks later), so in late November one is rare, from late
//     December to mid-March there are none, and a few wander out on warm days in March.
//   - BIRDS cross by day: a few at a time most of the year, bigger flocks in migration.
//     Canada geese migrate through late February to early April and September through
//     December, flying in a V; songbird migration peaks late April to mid-May and
//     August to October.
//   - A STRAY DOG trots across now and then by day.
//   - A JET passes high overhead once in a while: a contrail by day when the sky is clear
//     enough, blinking lights at night.
// Nothing comes out in a downpour or heavy snow (fewer in light rain or snow), and birds
// stay down when it's falling hard. Everything is drawn as simple silhouettes that pick up
// the light of the hour. A trash can stands by the house; a bear stops at it.
//
// MIGRATION (Nov 27, 2026, V153): three kinds of big waterfowl pass over in their seasons,
// each as a small, quiet flock, never more than one migrating flock in the sky at a time:
//   - CANADA GEESE: dark bodies, black necks, a steady V.
//   - SNOW GEESE: white with black wingtips, in a loose, wavy line.
//   - TUNDRA SWANS: white, long straight necks, slow deep wingbeats, a few in a short line.
// In the fall they fly right to left (south); in spring left to right (north). How often they
// come follows the season: few at the edges, most at the peak, none once it's over. Outside
// migration only a few local Canada geese go over now and then, in twos to fives.
// Windows: Canada geese Sep 1-Dec 31 (peak mid-Nov) and Feb 20-Apr 15 (peak mid-Mar); snow
// geese Nov 1-Dec 31 (peak early Dec) and Feb 15-Mar 31 (peak early Mar), matching when the
// Game Commission's light goose season and Middle Creek's spring flocks put them in the state;
// tundra swans Nov 1-Dec 20 and Feb 25-Apr 5 (approximate). Nothing here is a live sighting.
// Calls: birdcalls.js plays a faint, synthesized call now and then while a flock goes over.
//
// Previews for checking: ?wild=deer, bear, dog, birds, geese, snowgeese, swans, jet brings one
// right away (add &month=11 or &month=3 to see the fall or spring direction).
(() => {
  const q = location.search;
  const forced = (q.match(/[?&]wild=(deer|bear|dog|birds|geese|snowgeese|swans|jet)\b/) || [])[1] || null;
  let actors = [], lastT = 0, nextCheck = 0, forcedDone = false;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // Mean minutes between arrivals: per-second chance = 1 / (60 * minutes).
  const chance = (mins) => (mins > 0 && isFinite(mins)) ? 1 / (60 * mins) : 0;

  // How strong a migration is on a date: 0 outside the window, rising to 1 at the peak and
  // tapering back to 0 at the end. Windows are [start, peak, end] as month*100+day.
  const doy = (md) => { const m = Math.floor(md / 100), d = md % 100; return [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][m - 1] + d; };
  function strength(md, w) {
    const x = doy(md), a = doy(w[0]), p = doy(w[1]), b = doy(w[2]);
    if (x < a || x > b) return 0;
    const f = x <= p ? (x - a) / Math.max(1, p - a) : (b - x) / Math.max(1, b - p);
    return 0.15 + 0.85 * Math.sin(Math.min(1, f) * Math.PI / 2);
  }
  const MIG = {
    goose: { fall: [901, 1110, 1231], spring: [220, 315, 415], mins: 14 },
    snow:  { fall: [1101, 1201, 1231], spring: [215, 305, 331], mins: 30 },
    swan:  { fall: [1101, 1125, 1220], spring: [225, 315, 405], mins: 35 },
  };
  function migration(md) {
    const out = {};
    for (const k in MIG) {
      const f = strength(md, MIG[k].fall), sp = strength(md, MIG[k].spring);
      out[k] = { level: Math.max(f, sp), dir: f >= sp ? -1 : 1 };     // fall: right to left (south)
    }
    return out;
  }
  const monthQ = +((q.match(/[?&]month=(\d{1,2})\b/) || [])[1] || 0);
  function season(d) {
    let m = d.getMonth() + 1, day = d.getDate();
    if (monthQ >= 1 && monthQ <= 12) { m = monthQ; day = 15; }
    const md = m * 100 + day;
    const rut = md >= 1015 && md <= 1130;
    const bear = (md >= 401 && md <= 1031) ? 1 : (md >= 1101 && md <= 1120) ? 0.5 : (md >= 1121 && md <= 1220) ? 0.12
      : (md >= 315 && md <= 331) ? 0.2 : 0;
    const geese = (md >= 220 && md <= 415) || (md >= 901 && md <= 1231);
    const songbirds = (md >= 420 && md <= 520) || (md >= 815 && md <= 1031);
    return { rut, bear, geese, songbirds, mig: migration(md) };
  }

  // What may arrive this second, given the hour, the month and the weather.
  function spawn(env) {
    const s = season(env.now), heavy = env.fall !== 'none' && env.rate > 0.4, wet = env.fall !== 'none';
    const day = env.light > 0.6, night = env.light < 0.15, twilight = !day && !night || env.dawnDusk;
    const weather = heavy ? 0.15 : wet ? 0.5 : 1;
    const deerMins = (twilight ? 7 : night ? 22 : 45) / (s.rut ? 1.6 : 1) / weather;
    if (Math.random() < chance(deerMins)) addDeer(env);
    if (s.bear && !day && Math.random() < chance(80 / s.bear / weather)) addBear(env);
    if (day && Math.random() < chance(50 / weather)) addDog(env);
    if (env.light > 0.35 && !heavy) {
      const birdMins = (s.songbirds ? 1.2 : 2.5) / (wet ? 0.4 : 1);
      if (Math.random() < chance(birdMins)) addBirds(env, s.songbirds);
      // V153: one migrating flock at a time, as often as the season says.
      if (!actors.some(a => a.flock)) {
        for (const k of ['goose', 'snow', 'swan']) {
          const lv = s.mig[k].level;
          if (lv > 0 && Math.random() < chance(MIG[k].mins / lv / (wet ? 0.4 : 1))) { addFlock(env, k, s.mig[k].dir); break; }
        }
        // Local Canada geese, all year, a few at a time and not often.
        if (!actors.some(a => a.flock) && Math.random() < chance(45 / (wet ? 0.4 : 1))) addFlock(env, 'goose', Math.random() < 0.5 ? 1 : -1, 2 + ((Math.random() * 4) | 0));
      }
    }
    if (Math.random() < chance(night ? 35 : 30)) addJet(env, !day);
  }

  // ---- the animals ---------------------------------------------------------------
  const scaleOf = (env) => env.houseH;
  function walker(env, kind, x, dir, size, speed, extra = {}) {
    return Object.assign({ kind, layer: 'ground', x, dir, size, speed, phase: Math.random() * 6.3, pause: 0, born: env.t }, extra);
  }
  function addDeer(env) {
    const n = Math.random() < 0.45 ? 1 : 1 + ((Math.random() * 4) | 0), dir = Math.random() < 0.5 ? 1 : -1, S = scaleOf(env);
    const start = dir > 0 ? -S : env.W + S;
    for (let i = 0; i < n; i++) actors.push(walker(env, 'deer', start - dir * i * S * rnd(0.7, 1.4), dir, S * rnd(0.5, 0.6), S * rnd(0.006, 0.009),
      { graze: Math.random() < 0.6 ? rnd(0.2, 0.8) : null, buck: Math.random() < 0.3, lane: rnd(0, 1) }));
  }
  function addBear(env) {
    const dir = Math.random() < 0.5 ? 1 : -1, S = scaleOf(env);
    actors.push(walker(env, 'bear', dir > 0 ? -S : env.W + S, dir, S * 0.5, S * 0.005, { toCan: true, lane: 0.3 }));
  }
  function addDog(env) {
    const dir = Math.random() < 0.5 ? 1 : -1, S = scaleOf(env);
    const coats = ['#4a3a2a', '#2b2622', '#8a6a44', '#6e6258'];
    actors.push(walker(env, 'dog', dir > 0 ? -S : env.W + S, dir, S * 0.32, S * 0.012, { coat: coats[(Math.random() * coats.length) | 0], sniff: rnd(0.25, 0.75), lane: rnd(0.4, 1) }));
  }
  function addBirds(env, migration) {
    const n = migration ? 8 + ((Math.random() * 30) | 0) : 1 + ((Math.random() * 6) | 0);
    const dir = Math.random() < 0.5 ? 1 : -1, y0 = env.H * rnd(0.12, 0.5), S = scaleOf(env);
    for (let i = 0; i < n; i++) actors.push({ kind: 'bird', layer: 'sky', x: (dir > 0 ? -20 : env.W + 20) - dir * rnd(0, S * 1.6), y: y0 + rnd(-1, 1) * env.H * 0.05,
      dir, size: S * rnd(0.025, 0.04), speed: S * rnd(0.018, 0.03), phase: Math.random() * 6.3, wob: rnd(0, 6.3) });
  }
  // V153: a migrating flock. kind: 'goose' (Canada, a V), 'snow' (snow geese, a loose wavy
  // line) or 'swan' (tundra swans, a short line). dir: -1 right to left, 1 left to right.
  let flockId = 0;
  function addFlock(env, kind, dir, count) {
    const S = scaleOf(env), id = ++flockId;
    const n = count || (kind === 'goose' ? 5 + ((Math.random() * 11) | 0) : kind === 'snow' ? 8 + ((Math.random() * 13) | 0) : 3 + ((Math.random() * 7) | 0));
    const size = S * (kind === 'swan' ? 0.075 : kind === 'snow' ? 0.055 : 0.06);
    const speed = S * (kind === 'swan' ? 0.0105 : kind === 'snow' ? 0.0125 : 0.012);
    const y0 = env.H * rnd(kind === 'snow' ? 0.08 : 0.1, kind === 'swan' ? 0.26 : 0.3), gap = size * (kind === 'swan' ? 1.9 : 1.5);
    const x0 = dir > 0 ? -size * 2 : env.W + size * 2;
    for (let i = 0; i < n; i++) {
      let dx, dy;
      if (kind === 'goose') { const rank = Math.ceil(i / 2), side = i === 0 ? 0 : (i % 2 ? 1 : -1); dx = rank * gap; dy = side * rank * gap * 0.6; }
      else if (kind === 'snow') { dx = i * gap * 0.8 + rnd(-0.3, 0.3) * gap; dy = Math.sin(i * 0.9) * gap * 0.7 + rnd(-0.25, 0.25) * gap; }
      else { dx = i * gap; dy = i * gap * 0.22 * (i % 2 ? 1 : 0.6); }
      actors.push({ kind, layer: 'sky', flock: id, x: x0 - dir * dx, y: y0 + dy, dir, size, speed, phase: i * 0.7 + rnd(0, 0.4), wob: rnd(0, 6.3) });
    }
    if (window.BirdCalls) BirdCalls.flock(kind, n);
  }
  const addGeese = (env) => addFlock(env, 'goose', season(env.now).mig.goose.level > 0 ? season(env.now).mig.goose.dir : (Math.random() < 0.5 ? 1 : -1));
  function addJet(env, night) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    actors.push({ kind: 'jet', layer: 'sky', x: dir > 0 ? -40 : env.W + 40, y: env.H * rnd(0.05, 0.16), dir, size: Math.max(3, env.H * 0.006),
      speed: env.W / (60 * rnd(50, 80)), night, trail: [] });
  }

  // ---- drawing ---------------------------------------------------------------------
  const shade = (hex, light) => {
    const n = parseInt(hex.slice(1), 16), k = 0.25 + 0.75 * light;
    return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`;
  };
  function legs(ctx, x, y, h, spread, phase, moving) {
    const sw = moving ? Math.sin(phase) * spread : 0;
    ctx.beginPath();
    ctx.moveTo(x - spread, y - h); ctx.lineTo(x - spread + sw, y);
    ctx.moveTo(x - spread * 0.5, y - h); ctx.lineTo(x - spread * 0.5 - sw, y);
    ctx.moveTo(x + spread * 0.6, y - h); ctx.lineTo(x + spread * 0.6 - sw, y);
    ctx.moveTo(x + spread * 1.1, y - h); ctx.lineTo(x + spread * 1.1 + sw, y);
    ctx.stroke();
  }
  function drawDeer(ctx, a, y, env) {
    const s = a.size, d = a.dir, moving = a.pause <= 0, down = !moving && a.grazing;
    ctx.save(); ctx.translate(a.x, y); ctx.scale(d, 1);
    const col = shade('#7a6450', env.light);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.2, s * 0.06); ctx.lineCap = 'round';
    legs(ctx, -s * 0.05, 0, s * 0.5, s * 0.28, a.phase, moving);
    ctx.beginPath(); ctx.ellipse(0, -s * 0.62, s * 0.42, s * 0.17, 0, 0, 6.3); ctx.fill();          // body
    const hx = s * 0.4, hy = down ? -s * 0.1 : -s * 1.0;
    ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.7); ctx.lineTo(hx, hy); ctx.lineWidth = s * 0.12; ctx.stroke();   // neck
    ctx.beginPath(); ctx.ellipse(hx + s * 0.08, hy, s * 0.11, s * 0.065, down ? 0.9 : 0.3, 0, 6.3); ctx.fill();  // head
    ctx.lineWidth = Math.max(1, s * 0.035);
    if (a.buck && !down) { ctx.beginPath(); ctx.moveTo(hx, hy - s * 0.04); ctx.quadraticCurveTo(hx - s * 0.05, hy - s * 0.25, hx + s * 0.12, hy - s * 0.28);
      ctx.moveTo(hx - s * 0.02, hy - s * 0.12); ctx.lineTo(hx - s * 0.08, hy - s * 0.2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(hx - s * 0.02, hy - s * 0.04); ctx.lineTo(hx - s * 0.07, hy - s * 0.15); ctx.stroke(); }
    // The white tail: up and flicking now and then.
    const flick = Math.sin(env.t / 9 + a.phase) > 0.85;
    ctx.fillStyle = shade('#f2efe8', Math.max(0.35, env.light));
    ctx.beginPath(); ctx.ellipse(-s * 0.44, -s * (flick ? 0.86 : 0.7), s * 0.05, s * (flick ? 0.09 : 0.06), flick ? -0.5 : 0.3, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  function drawDog(ctx, a, y, env) {
    const s = a.size, moving = a.pause <= 0;
    ctx.save(); ctx.translate(a.x, y); ctx.scale(a.dir, 1);
    const col = shade(a.coat, env.light); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.2, s * 0.1);
    legs(ctx, 0, 0, s * 0.45, s * 0.3, a.phase * 1.4, moving);
    ctx.beginPath(); ctx.ellipse(0.05 * s, -s * 0.55, s * 0.45, s * 0.17, 0, 0, 6.3); ctx.fill();
    const sniff = !moving, hy = sniff ? -s * 0.15 : -s * 0.75;
    ctx.beginPath(); ctx.ellipse(s * 0.55, hy, s * 0.17, s * 0.11, sniff ? 0.8 : 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * 0.48, hy - s * 0.06); ctx.lineTo(s * 0.44, hy - s * 0.2); ctx.stroke();   // ear
    const wag = Math.sin(env.t / 3) * 0.4;
    ctx.beginPath(); ctx.moveTo(-s * 0.42, -s * 0.62); ctx.quadraticCurveTo(-s * 0.62, -s * (0.8 + wag * 0.3), -s * 0.7, -s * (0.95 + wag)); ctx.stroke();
    ctx.restore();
  }
  function drawBear(ctx, a, y, env) {
    const s = a.size, moving = a.pause <= 0;
    ctx.save(); ctx.translate(a.x, y); ctx.scale(a.dir, 1);
    const col = shade('#1d1916', Math.max(0.5, env.light)); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.16;
    legs(ctx, 0, 0, s * 0.35, s * 0.3, a.phase * 0.8, moving);
    ctx.beginPath(); ctx.ellipse(0, -s * 0.55, s * 0.55, s * 0.3, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.72, s * 0.3, s * 0.2, 0, 0, 6.3); ctx.fill();          // the hump
    const hy = moving ? -s * 0.5 : -s * 0.25;
    ctx.beginPath(); ctx.ellipse(s * 0.62, hy, s * 0.2, s * 0.15, 0.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = shade('#8a6a4a', Math.max(0.5, env.light));                                           // the tan muzzle
    ctx.beginPath(); ctx.ellipse(s * 0.79, hy + s * 0.03, s * 0.07, s * 0.05, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(s * 0.55, hy - s * 0.14, s * 0.06, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  // V153: snow geese and tundra swans: white bodies that take the light of the hour, black
  // wingtips on the snow geese, a long straight neck on the swans.
  function drawWhite(ctx, a, env) {
    const s = a.size, swan = a.kind === 'swan', f = Math.sin(a.phase) * (swan ? 0.42 : 0.36), L = Math.max(0.3, env.light);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = shade(swan ? '#f4f2ec' : '#f0eee8', L); ctx.lineWidth = Math.max(1.2, s * (swan ? 0.15 : 0.14));
    ctx.beginPath(); ctx.moveTo(a.x - s, a.y - s * f); ctx.quadraticCurveTo(a.x - s * 0.4, a.y - s * 0.25, a.x, a.y);
    ctx.quadraticCurveTo(a.x + s * 0.4, a.y - s * 0.25, a.x + s, a.y - s * f); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a.x - a.dir * s * 0.3, a.y + s * 0.02); ctx.lineTo(a.x + a.dir * s * (swan ? 0.85 : 0.55), a.y + s * 0.04); ctx.stroke();   // body and neck
    if (!swan) {                                   // black wingtips
      ctx.strokeStyle = shade('#1e1c1a', Math.max(0.4, env.light)); ctx.lineWidth = Math.max(1, s * 0.13);
      ctx.beginPath(); ctx.moveTo(a.x - s, a.y - s * f); ctx.lineTo(a.x - s * 0.72, a.y - s * f * 0.6 - s * 0.06);
      ctx.moveTo(a.x + s, a.y - s * f); ctx.lineTo(a.x + s * 0.72, a.y - s * f * 0.6 - s * 0.06); ctx.stroke();
    }
    ctx.restore();
  }
  function drawBird(ctx, a, env, goose) {
    const s = a.size, f = Math.sin(a.phase) * (goose ? 0.35 : 0.6);
    ctx.save(); ctx.strokeStyle = goose ? shade('#2a2622', Math.max(0.4, env.light)) : shade('#2e2a26', Math.max(0.35, env.light));
    ctx.lineWidth = Math.max(1, s * (goose ? 0.12 : 0.16)); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x - s, a.y - s * f); ctx.quadraticCurveTo(a.x - s * 0.4, a.y - s * 0.25, a.x, a.y);
    ctx.quadraticCurveTo(a.x + s * 0.4, a.y - s * 0.25, a.x + s, a.y - s * f); ctx.stroke();
    if (goose) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + a.dir * s * 0.6, a.y + s * 0.05); ctx.stroke(); }   // the long neck
    ctx.restore();
  }
  function drawJet(ctx, a, env) {
    const vis = Math.max(0, 1 - env.cover * 1.3);
    if (vis <= 0.03) return;
    ctx.save(); ctx.globalAlpha = vis;
    if (a.night) {
      const blink = Math.floor(env.t / 20) % 3 === 0;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(a.x - 1, a.y - 1, 2, 2);
      if (blink) { ctx.fillStyle = '#ff5050'; ctx.beginPath(); ctx.arc(a.x - a.dir * 3, a.y, 1.6, 0, 6.3); ctx.fill(); }
    } else {
      // The contrail: a thin white line that spreads and fades behind it.
      for (let i = 1; i < a.trail.length; i++) {
        const p = a.trail[i - 1], q2 = a.trail[i], age = i / a.trail.length;
        ctx.strokeStyle = `rgba(255,255,255,${0.55 * age})`; ctx.lineWidth = 1 + (1 - age) * 5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
      }
      ctx.fillStyle = '#d8dde3'; ctx.fillRect(a.x - a.size, a.y - 1, a.size * 2, 2);
    }
    ctx.restore();
  }

  // The trash can by the house (the bear's reason for coming).
  function canAt(env) { return { x: env.house.x + env.house.w + env.house.w * 0.07, w: env.houseH * 0.12, h: env.houseH * 0.17 }; }
  function drawCan(ctx, env, tipped) {
    const c = canAt(env), y = env.surfaceY(c.x) + env.H * 0.012;
    ctx.save(); ctx.translate(c.x, y); if (tipped) ctx.rotate(1.3);
    ctx.fillStyle = shade('#5d646b', env.light); ctx.fillRect(-c.w / 2, -c.h, c.w, c.h);
    ctx.fillStyle = shade('#4a5057', env.light); ctx.fillRect(-c.w * 0.58, -c.h - c.h * 0.1, c.w * 1.16, c.h * 0.12);
    ctx.restore();
  }

  let canTipped = 0;
  function step(env, dt) {
    for (const a of actors) {
      if (a.layer === 'sky') {
        a.x += a.dir * a.speed * dt * 60; a.phase += ({ goose: 0.12, snow: 0.14, swan: 0.08 }[a.kind] || 0.35) * dt * 60;
        if (a.kind === 'snow') a.y += Math.sin(env.t / 40 + a.wob) * 0.08;   // the line ripples a little
        if (a.kind === 'bird') a.y += Math.sin(env.t / 30 + a.wob) * 0.2;
        if (a.kind === 'jet') { a.trail.push({ x: a.x, y: a.y }); if (a.trail.length > 160) a.trail.shift(); }
        a.gone = a.dir > 0 ? a.x > env.W + 400 : a.x < -400;
        continue;
      }
      if (a.layer === 'low') {                     // V153: geese coming in low over the yard (homestead.js hunt)
        a.x += a.dir * a.speed * (a.flare ? 1.5 : 1) * dt * 60; a.phase += (a.flare ? 0.2 : 0.11) * dt * 60;
        if (a.flare) a.y -= a.size * 0.06 * dt * 60;                              // flaring up and away
        else a.y += (a.ty - a.y) * Math.min(1, 0.006 * dt * 60);                  // gliding down toward the yard
        a.gone = a.dir > 0 ? a.x > env.W + 300 : a.x < -300;
        continue;
      }
      if (a.pause > 0) { a.pause -= dt; if (a.pause <= 0) a.grazing = false; continue; }
      a.x += a.dir * a.speed * dt * 60; a.phase += 0.18 * dt * 60;
      const frac = a.x / env.W;
      // Deer stop to graze once; the dog stops to sniff; the bear stops at the can.
      if (a.kind === 'deer' && a.graze !== null && (a.dir > 0 ? frac > a.graze : frac < a.graze)) { a.pause = rnd(6, 20); a.grazing = true; a.graze = null; }
      if (a.kind === 'dog' && a.sniff !== null && (a.dir > 0 ? frac > a.sniff : frac < a.sniff)) { a.pause = rnd(2, 6); a.sniff = null; }
      if (a.kind === 'bear' && a.toCan) { const c = canAt(env); if (Math.abs(a.x - c.x) < a.size * 0.8) { a.pause = rnd(10, 25); a.toCan = false; canTipped = 120; } }
      a.gone = a.dir > 0 ? a.x > env.W + a.size * 3 : a.x < -a.size * 3;
    }
    actors = actors.filter(a => !a.gone);
  }

  // env: { W, H, t, now, light, cover, fall, rate, dawnDusk, surfaceY(x), house, houseH }
  function update(env) {
    const nowMs = performance.now(), dt = lastT ? Math.min(0.1, (nowMs - lastT) / 1000) : 0.016; lastT = nowMs;
    if (forced && !forcedDone) {
      forcedDone = true;
      ({ deer: addDeer, bear: addBear, dog: addDog, birds: (e) => addBirds(e, true), geese: addGeese,
        snowgeese: (e) => addFlock(e, 'snow', season(e.now).mig.snow.dir), swans: (e) => addFlock(e, 'swan', season(e.now).mig.swan.dir), jet: (e) => addJet(e, e.light < 0.3) })[forced](env);
    }
    if (nowMs >= nextCheck) { nextCheck = nowMs + 1000; if (actors.length < 60) spawn(env); }
    step(env, dt);
    if (canTipped > 0) canTipped -= dt;
  }
  // Sky: birds, geese and jets, drawn over the sky and clouds and behind the trees.
  let drawnAt = 0;
  function sky(ctx, env) { drawnAt = performance.now(); update(env); for (const a of actors) if (a.layer === 'sky') a.kind === 'jet' ? drawJet(ctx, a, env) : (a.kind === 'snow' || a.kind === 'swan') ? drawWhite(ctx, a, env) : drawBird(ctx, a, env, a.kind === 'goose'); }
  // Ground: the trash can and the animals in the yard, in front of the house.
  function ground(ctx, env) {
    drawCan(ctx, env, canTipped > 0);
    for (const a of actors) if (a.layer === 'low') a.kind === 'snow' ? drawWhite(ctx, a, env) : drawBird(ctx, a, env, true);
    for (const a of actors) {
      if (a.layer !== 'ground') continue;
      const y = env.surfaceY(a.x) + env.H * (0.015 + 0.025 * (a.lane || 0));
      if (a.kind === 'deer') drawDeer(ctx, a, y, env); else if (a.kind === 'dog') drawDog(ctx, a, y, env); else drawBear(ctx, a, y, env);
    }
  }
  // V153: for the hunt in homestead.js. A migrating goose flock in view right now (he sees it
  // from the back window), a low flock that comes in over the yard, and what happens at the shot.
  function flockOverhead(W) {
    const a = actors.find(b => b.layer === 'sky' && b.flock && (b.kind === 'goose' || b.kind === 'snow') && b.x > 0 && b.x < W);
    return a ? { kind: a.kind, id: a.flock, dir: a.dir } : null;
  }
  function huntFlock(o) {                          // o: { kind, dir, W, y, ty, size, speed }
    const id = ++flockId, n = 4 + ((Math.random() * 5) | 0), gap = o.size * 1.6, x0 = o.dir > 0 ? -o.size * 2 : o.W + o.size * 2;
    for (let i = 0; i < n; i++) {
      const rank = Math.ceil(i / 2), side = i === 0 ? 0 : (i % 2 ? 1 : -1);
      actors.push({ kind: o.kind, layer: 'low', flock: id, x: x0 - o.dir * rank * gap, y: o.y + side * rank * gap * 0.45, ty: o.ty + side * rank * gap * 0.45,
        dir: o.dir, size: o.size, speed: o.speed, phase: i * 0.7, wob: 0 });
    }
    if (window.BirdCalls) BirdCalls.flock(o.kind, n);
    return id;
  }
  const flockOf = (id) => actors.filter(a => a.flock === id);
  function lead(id) { const f = flockOf(id); if (!f.length) return null; return f.reduce((m, a) => (a.x - m.x) * a.dir > 0 ? a : m); }
  function flare(id) { for (const a of flockOf(id)) a.flare = true; }
  function down(id, x) {                           // one bird of the flock, the one nearest x, leaves the flock
    const f = flockOf(id); if (!f.length) return null;
    const a = f.reduce((m, b) => Math.abs(b.x - x) < Math.abs(m.x - x) ? b : m);
    a.gone = true; actors = actors.filter(b => b !== a); flare(id);
    return { x: a.x, y: a.y, kind: a.kind, size: a.size, dir: a.dir, speed: a.speed };
  }
  window.Wildlife = { sky, ground, season, migration, flockOverhead, huntFlock, lead, flare, down, drawnAgo: () => performance.now() - drawnAt, debugSky: () => actors.filter(a => a.layer === 'sky').map(a => ({ k: a.kind, d: a.dir, x: Math.round(a.x), y: Math.round(a.y) })), debug: () => actors.map(a => a.kind) };
})();
