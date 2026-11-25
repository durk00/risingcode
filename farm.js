// THE FARM (Nov 25, 2026, V112): what grows on the homestead, following the real calendar the
// way the rest of the scene follows the real sky.
//
//   - A KITCHEN GARDEN in the front yard, five rows. April: the rows get tilled, a few at a
//     time (he's out with a hoe). Mid-May, after the last frost: planted, little green rows
//     come up and grow through July. August into September: full, with red and yellow among
//     the green. Late September into October: picked and pulled, the rows go brown, then bare.
//     Winter: the old rows under snow or bare ground.
//   - FIELD CORN behind the place, all the way across: feed corn for the horses and the other
//     stock, not sweet corn. Planted early May, knee-high by July 4th, tasseled and taller than
//     a man by late July, then it turns tan in September and stands in the field drying through
//     the fall, the way the fields around Happy Valley do. Harvest comes in early December,
//     on its own day each year: the tractor goes out after daybreak and works across the field,
//     one tractor length at a time, about every 45 minutes, not a smooth crawl. Behind it is
//     stubble. It quits before the sun goes down. Stubble through the winter, until it's worked
//     under in late April.
// Dates are for central Pennsylvania and move a few days earlier for each degree further south
// (later further north). Preview any day with ?farm=2026-07-20 (and &farmhour=10 for a time).
(() => {
  const q = location.search;
  const pDate = (q.match(/[?&]farm=(\d{4}-\d{2}-\d{2})/) || [])[1];
  const pHour = +((q.match(/[?&]farmhour=(\d+(?:\.\d+)?)/) || [])[1] || NaN);
  const rnd32 = (seed) => { let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); };
  const shade = (hex, light, floor = 0.22) => {
    const n = parseInt(hex.slice(1), 16), k = floor + (1 - floor) * light;
    return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`;
  };
  const mixHex = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const c = (s) => Math.round(((A >> s) & 255) * (1 - k) + ((B >> s) & 255) * k); return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ramp = (d, a, b) => clamp((d - a) / (b - a));

  function when(env) {
    let now = env.now;
    if (pDate) { const [y, m, d] = pDate.split('-').map(Number); now = new Date(y, m - 1, d, isNaN(pHour) ? now.getHours() : Math.floor(pHour), isNaN(pHour) ? now.getMinutes() : Math.round((pHour % 1) * 60)); }
    const lat = window.Place ? Place.lat : 40.85;
    const shift = Math.round((40.8 - lat) * 3);                                     // days earlier per degree south
    const start = new Date(now.getFullYear(), 0, 1);
    const day = Math.floor((now - start) / 864e5) + 1 + shift;                       // day of the year, shifted to central PA's calendar
    return { now, day, hour: now.getHours() + now.getMinutes() / 60, year: now.getFullYear() };
  }
  // Day-of-year marks (non-leap; close enough for a picture).
  const D = { apr1: 91, apr20: 110, apr28: 118, may5: 125, may15: 135, jul4: 185, jul25: 206, jul31: 212, aug10: 222, sep1: 244, sep20: 263, oct15: 288, nov1: 305 };

  // The corn harvest: a day in early December, its own each year, worked from 8 to 4 in steps.
  const HARVEST_START = 8, HARVEST_END = 16, STEP_MIN = 45;
  function harvestDay(year) { const r = rnd32('harvest' + year); return 336 + Math.floor(r() * 9); }   // Dec 2 to Dec 10
  // How many tractor-lengths are cut, and whether the tractor is out right now.
  function harvest(w, steps) {
    const hd = harvestDay(w.year);
    const stepsPerDay = Math.floor((HARVEST_END - HARVEST_START) * 60 / STEP_MIN);
    let done;
    if (w.day < hd) done = w.day < D.apr28 && w.day >= 1 ? -1 : 0;                 // -1: last year's stubble (Jan to April)
    else {
      const before = (w.day - hd) * stepsPerDay;
      const today = w.hour < HARVEST_START ? 0 : Math.min(stepsPerDay, Math.floor((w.hour - HARVEST_START) * 60 / STEP_MIN) + 1);
      done = Math.min(steps, before + today);
    }
    const out = done >= 0 && done < steps && w.day >= hd && w.hour >= HARVEST_START && w.hour < HARVEST_END;
    return { done, out };
  }

  function layout(env) {
    const { W, H, house } = env, S = house.h;
    const g = { x0: house.x - house.w * 0.08, x1: house.x + house.w * 1.08, rows: [] };
    for (let i = 0; i < 5; i++) g.rows.push(house.base + H * (0.055 + i * 0.022));
    const tl = S * 0.62, steps = Math.ceil(W / tl);
    return { S, g, tl, steps };
  }

  // ---- field corn -----------------------------------------------------------------------
  let stalks = null, stalkKey = '';
  function cornField(ctx, env, L, w) {
    const { W, H, light } = env, S = L.S;
    const key = W + 'x' + H;
    if (!stalks || stalkKey !== key) {
      const r = rnd32('corn'), n = Math.ceil(W / Math.max(4, S * 0.03));
      stalks = Array.from({ length: n }, (_, i) => ({ x: (i + 0.2 + r() * 0.6) * W / n, h: 0.85 + r() * 0.3, lean: (r() - 0.5) * 0.12, back: r() < 0.5 }));
      stalkKey = key;
    }
    const d = w.day, hv = harvest(w, L.steps);
    // Height and color through the year.
    const grow = d < D.may5 ? 0 : d < D.jul25 ? ramp(d, D.may5, D.jul25) : 1;
    const tan = ramp(d, D.sep1, D.oct15);
    const fullH = S * 0.5;                                                         // taller than a man
    const green = '#4f8a34', dry = '#c4a86c';
    const col = mixHex(green, dry, tan);
    const cutX = hv.done < 0 ? W + 1 : hv.done * L.tl;                              // everything left of this is cut
    const stubbleSeason = hv.done < 0 || (d >= harvestDay(w.year) && hv.done > 0);
    ctx.save(); ctx.lineCap = 'round';
    for (const s of stalks) {
      const gy = env.groundY(s.x) - H * (s.back ? 0.012 : 0.004);
      if (s.x < cutX && stubbleSeason || (grow === 0 && hv.done !== -1 && d < D.may5 && d > D.apr28)) {   // stubble (or bare after it's worked under)
        if (d >= D.apr28 && d < D.may5) continue;
        ctx.strokeStyle = shade('#a08a5a', light); ctx.lineWidth = Math.max(1, S * 0.008);
        ctx.beginPath(); ctx.moveTo(s.x, gy); ctx.lineTo(s.x + s.lean * 4, gy - S * 0.025); ctx.stroke();
        continue;
      }
      if (grow === 0) continue;
      const h = fullH * s.h * (0.08 + 0.92 * grow);
      const top = gy - h, tx = s.x + s.lean * h;
      ctx.strokeStyle = shade(col, light); ctx.lineWidth = Math.max(1.2, S * (0.007 + 0.008 * grow));
      ctx.beginPath(); ctx.moveTo(s.x, gy); ctx.lineTo(tx, top); ctx.stroke();
      ctx.lineWidth = Math.max(1, S * 0.006);                                         // leaves, drooping more once dry
      for (let k = 1; k <= 3; k++) {
        const ly = gy - h * k / 4.2, lx = s.x + s.lean * h * k / 4.2, sgn = k % 2 ? 1 : -1, len = h * 0.28 * (1 - tan * 0.3);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + sgn * len * 0.6, ly - len * 0.25, lx + sgn * len, ly + len * (0.15 + tan * 0.35)); ctx.stroke();
      }
      if (d >= D.jul25 - 10 && grow > 0.85) {                                         // tassel, and an ear on the stalk
        ctx.strokeStyle = shade(mixHex('#d9c27a', '#c8b48a', tan), light); ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(tx - S * 0.012, top - S * 0.025); ctx.moveTo(tx, top); ctx.lineTo(tx + S * 0.012, top - S * 0.022); ctx.stroke();
        ctx.fillStyle = shade(mixHex('#7a8f3a', '#b8a06a', tan), light); ctx.beginPath(); ctx.ellipse(s.x + s.lean * h * 0.5 + S * 0.01, gy - h * 0.5, S * 0.008, S * 0.022, 0.3, 0, 6.3); ctx.fill();
      }
    }
    ctx.restore();
    if (hv.out) tractor(ctx, env, L, Math.min(W - L.tl * 0.2, cutX), H);
  }
  // A small tractor pulling a one-row picker, the man in the red coat driving.
  function tractor(ctx, env, L, x, H) {
    const S = L.S, light = env.light, gy = env.groundY(Math.max(0, Math.min(env.W - 1, x))) - H * 0.004, u = L.tl / 1.0;
    ctx.save(); ctx.translate(x, gy);
    ctx.fillStyle = shade('#8a8f94', light); ctx.fillRect(-u * 0.95, -u * 0.22, u * 0.35, u * 0.16);             // the picker, behind
    ctx.fillStyle = shade('#a2312a', light); ctx.fillRect(-u * 0.55, -u * 0.3, u * 0.55, u * 0.18);              // tractor body
    ctx.fillRect(-u * 0.5, -u * 0.48, u * 0.2, u * 0.2);                                                        // cab seat back
    ctx.fillStyle = shade('#2a2a2a', light); ctx.fillRect(-u * 0.08, -u * 0.42, u * 0.035, u * 0.14);           // exhaust stack
    ctx.beginPath(); ctx.arc(-u * 0.42, -u * 0.13, u * 0.13, 0, 6.3); ctx.fill();                               // big back wheel
    ctx.beginPath(); ctx.arc(-u * 0.06, -u * 0.07, u * 0.07, 0, 6.3); ctx.fill();                               // front wheel
    ctx.fillStyle = shade('#7a2e26', light); ctx.fillRect(-u * 0.33, -u * 0.47, u * 0.07, u * 0.13);           // the driver's red coat
    ctx.fillStyle = shade('#d8b090', light); ctx.beginPath(); ctx.arc(-u * 0.295, -u * 0.52, u * 0.035, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  // ---- the kitchen garden -----------------------------------------------------------------
  let plants = null, plantKey = '';
  function garden(ctx, env, L, w) {
    const { H, light } = env, g = L.g, S = L.S, d = w.day;
    const tilled = d < D.apr1 ? 0 : d < D.apr28 ? Math.ceil(5 * ramp(d, D.apr1, D.apr28)) : 5;
    const grow = d < D.may15 ? 0 : ramp(d, D.may15, D.jul31);
    const fade = ramp(d, D.sep20, D.oct15);
    const fresh = d >= D.apr1 && d < D.nov1;                                         // worked soil shows darker
    const key = Math.round(g.x0) + ':' + Math.round(g.x1);
    if (!plants || plantKey !== key) {
      const r = rnd32('garden');
      plants = g.rows.map((_, ri) => Array.from({ length: 14 }, (_, i) => ({ f: (i + 0.3 + r() * 0.4) / 14, kind: ri % 3, fruit: r() })));
      plantKey = key;
    }
    ctx.save();
    g.rows.forEach((ry, ri) => {
      const persp = 0.85 + ri * 0.06, x0 = g.x0 - ri * S * 0.03, x1 = g.x1 + ri * S * 0.03, hgt = Math.max(2, H * 0.007 * persp);
      const worked = fresh && (ri < tilled || d >= D.apr28);
      ctx.fillStyle = shade(worked ? '#4a3424' : '#5a4a36', light); ctx.globalAlpha = worked ? 0.95 : 0.35;   // old rows still faintly show in winter
      ctx.fillRect(x0, ry - hgt / 2, x1 - x0, hgt);
      ctx.globalAlpha = 1;
      if (grow <= 0 || d >= D.oct15 + 10) return;
      for (const p of plants[ri]) {
        const px = x0 + (x1 - x0) * p.f, h = S * 0.06 * persp * (0.12 + 0.88 * grow) * (p.kind === 1 ? 1.4 : 1) * (1 - fade * 0.6);
        const leaf = shade(mixHex('#4e8a34', '#7a6a3e', fade), light);
        ctx.fillStyle = leaf; ctx.beginPath(); ctx.ellipse(px, ry - h * 0.5, h * (p.kind === 2 ? 0.7 : 0.45), h * 0.55, 0, 0, 6.3); ctx.fill();
        if (d >= D.aug10 && fade < 0.6 && p.fruit < 0.5) {                            // tomatoes and squash coming in
          ctx.fillStyle = shade(p.kind === 0 ? '#c8382c' : '#e0b43a', light, 0.35);
          ctx.beginPath(); ctx.arc(px + h * 0.2, ry - h * 0.35, Math.max(1.8, h * 0.2), 0, 6.3); ctx.fill();
        }
      }
    });
    ctx.restore();
  }

  function back(ctx, env) {
    const w = when(env), L = layout(env);
    cornField(ctx, env, L, w);
    garden(ctx, env, L, w);
  }
  window.Farm = {
    back,
    // For the homestead: the garden's rows, and what work it wants today (tilling or tending).
    garden: (env) => layout(env).g,
    work: (env) => { const d = when(env).day; return d >= D.apr1 && d < D.apr28 ? 'till' : d >= D.may15 && d < D.sep20 ? 'tend' : d >= D.sep20 && d < D.oct15 ? 'pick' : null; },
    // While the tractor is out, he's on it, so he isn't walking around the yard too.
    busy: (env) => harvest(when(env), layout(env).steps).out,
    debug: (env) => { const w = when(env); return { day: w.day, hour: +w.hour.toFixed(2), harvestDay: harvestDay(w.year), harvest: harvest(w, layout(env).steps), work: window.Farm.work(env) }; },
  };
})();
