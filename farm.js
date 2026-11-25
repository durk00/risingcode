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
//     the fall, the way the fields around Happy Valley do. Harvest starts December 7th (V120) and
//     goes slowly, sunup to sundown, in passes back and forth, one tractor length an hour, about
//     200 working hours in all, and not in rain, snow or wind. Stubble behind; stubble through the
//     winter, until it's worked under in late April.
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

  // The corn harvest (V119): it starts December 7th (V120; he leaves it to dry first) and goes very slowly, sunup to sundown. He
  // works the field in passes, back and forth across it, one tractor length an hour, so you have
  // to look away for an hour to see he's moved. Each pass thins the standing corn a little, with
  // stubble where it's been cut; the whole field takes about 200 hours of working daylight, three
  // weeks or more, into the new year. He doesn't work while it's raining or snowing or the
  // wind is up (a wind alert, or wind in today's forecast): that time doesn't count. Hours the app
  // wasn't open count as worked if the sun was up. Kept on the device. A ?farm= preview date
  // assumes good weather.
  const STEP_MIN = 60, WORK_HOURS = 200;
  const harvestDay = () => 341;                                                     // V120: December 7th, after the corn's had time to dry
  const KEY = 'risingcode_harvest';
  let hs = null;
  try { hs = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  const sunUp = (t) => {                                                            // is the sun up (a little above the horizon)?
    if (window.SkyPath) { const P = window.Place; return SkyPath.sun(t, P ? P.lat : 40.85, P ? P.lon : -77.69).alt > 2; }
    const h = new Date(t).getHours(); return h >= 7 && h < 17;
  };
  const workMin = (a, b) => { let m = 0; for (let t = a; t < b; t += 6e5) if (sunUp(t)) m += Math.min(10, (b - t) / 6e4); return m; };
  const passesFor = (steps) => Math.max(4, Math.ceil(WORK_HOURS * 60 / STEP_MIN / steps));
  function harvest(w, steps, env) {
    const hd = harvestDay(), total = steps * passesFor(steps);
    if (w.day < hd) return { done: w.day < D.apr28 ? -1 : 0, total, out: false };   // -1: last year's stubble (January to April)
    const now = +w.now, up = sunUp(now);
    const shift = w.day - (Math.floor((w.now - new Date(w.year, 0, 1)) / 864e5) + 1), start = +new Date(w.year, 0, hd - shift);   // midnight, the first day
    const stepsFrom = (credit) => Math.min(total, credit > 0 ? Math.floor(credit / STEP_MIN) + 1 : 0);
    if (pDate || !env) { const done = stepsFrom(workMin(start, now)); return { done, total, out: done < total && up }; }
    if (env.ready === false) return { done: hs && hs.year === w.year ? stepsFrom(hs.credit) : 0, total, out: false };   // weather not in yet
    const bad = env.fall !== 'none' || !!env.windy;
    if (!hs || hs.year !== w.year || hs.v !== 3) hs = { v: 3, year: w.year, credit: 0, last: start };
    if (hs.last < start) hs.last = start;                                              // nothing counts before the first day
    if (now > hs.last + 6e4) { if (!bad) hs.credit += workMin(hs.last, now); hs.last = now; try { localStorage.setItem(KEY, JSON.stringify(hs)); } catch (e) {} }
    const done = stepsFrom(hs.credit);
    return { done, total, out: done < total && up && !bad, held: bad && up && done < total };
  }

  function layout(env) {
    const { W, H, house } = env, S = house.h;
    const g = { x0: house.x - house.w * 0.08, x1: house.x + house.w * 1.08, rows: [] };
    for (let i = 0; i < 5; i++) g.rows.push(house.base + H * (0.055 + i * 0.022));
    const tl = S * 0.62, steps = Math.ceil(W / tl);
    return { S, g, tl, steps };
  }

  // ---- field corn -----------------------------------------------------------------------
  // V113: dense, a wall you can't see through: a solid backing in the corn's color plus three
  // ranks of stalks. From mid-October on the stalks die back: they shrink, go gray-brown, lean
  // and bend over at the top, and the leaves hang. Drawn once into an off-screen picture and
  // reused (it only changes with the day, the light and the harvest's progress), so an old iPad
  // isn't redrawing hundreds of stalks every frame.
  let stalks = null, stalkKey = '', pic = null, picKey = '';
  function cornField(ctx, env, L, w) {
    const { W, H, light } = env, S = L.S;
    const d = w.day, hv = harvest(w, L.steps, env);
    // Which pass he's on, and how far across it; everything left of cutX is cut this pass.
    const passes = hv.total / L.steps, pass = hv.done < 0 ? passes : Math.floor(hv.done / L.steps), inPass = hv.done < 0 ? 0 : hv.done % L.steps;
    const cutX = hv.done >= hv.total ? 0 : inPass * L.tl;
    const left = 1 - Math.min(passes, pass + 1) / passes, right = 1 - Math.min(passes, pass) / passes;   // share of the corn still standing
    const key = [W, H, d, Math.round(light * 24), Math.round(cutX), pass].join(':');
    if (!pic || picKey !== key) { pic = pic || document.createElement('canvas'); paintCorn(pic, env, L, w, hv, cutX, left, right); picKey = key; }
    ctx.drawImage(pic, 0, 0, W, H);
    if (hv.out) tractor(ctx, env, L, Math.min(W - L.tl * 0.2, Math.max(L.tl * 0.6, cutX)), H, inPass / L.steps);
  }
  function paintCorn(cv, env, L, w, hv, cutX, left, right) {
    const { W, H, light } = env, S = L.S, d = w.day;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, W, H);
    if (!stalks || stalkKey !== W + 'x' + H) {
      const r = rnd32('corn'), n = Math.ceil(W / Math.max(2.2, S * 0.011));
      stalks = Array.from({ length: n }, (_, i) => ({ x: (i + r()) * W / n, h: 0.8 + r() * 0.35, lean: (r() - 0.5) * 0.16, rank: (r() * 3) | 0, bend: r() < 0.5 ? -1 : 1, broke: r() < 0.24, keep: r() }));
      stalks.sort((a, b) => a.rank - b.rank);                                         // back rank first
      stalkKey = W + 'x' + H;
    }
    const grow = d < D.may5 ? 0 : d < D.jul25 ? ramp(d, D.may5, D.jul25) : 1;
    const tan = ramp(d, D.sep1, D.oct15), wither = ramp(d, D.oct15 - 5, D.nov1 + 14);                  // V114: fully dead by mid-November
    const fullH = S * 0.5 * (1 - 0.28 * wither);                                     // taller than a man; it slumps as it dies
    const col = mixHex(mixHex('#4f8a34', '#c4a86c', tan), '#7a6648', wither);
    const back = mixHex(mixHex('#2f5a22', '#8f7a50', tan), '#4e4130', wither);
    const share = (x) => hv.done < 0 ? 0 : x < cutX ? left : right;                  // V119: how much is still standing here
    const stubbleSeason = hv.done < 0 || hv.done > 0;
    const worked = d >= D.apr28 && d < D.may5;                                         // stubble plowed under, nothing up yet
    const standing = (x, s) => grow > 0 && (!stubbleSeason || (s ? s.keep < share(x) : share(x) > 0.05));
    ctx.lineCap = 'round';
    // The solid backing, wherever corn is standing, with a ragged top.
    if (grow > 0.15) {
      const r = rnd32('cornback'), top = fullH * (0.08 + 0.92 * grow) * 0.72;
      ctx.fillStyle = shade(back, light);
      const alphaAt = (x) => Math.min(1, share(x) / 0.35);                         // the wall thins out over the last few passes
      let open = false;
      for (let x = 0; x <= W + 6; x += 6) {
        const gy = env.groundY(Math.min(W - 1, x)) - H * 0.014;
        if (standing(x) && (!open || Math.abs(alphaAt(x) - ctx.globalAlpha) < 0.01)) {
          const y = gy - top * (0.85 + r() * 0.3);
          if (!open) { ctx.globalAlpha = stubbleSeason ? alphaAt(x) : 1; ctx.beginPath(); ctx.moveTo(x, gy + 2); open = true; }
          ctx.lineTo(x, y);
        } else if (open) { ctx.lineTo(x, env.groundY(Math.min(W - 1, x)) + 2); ctx.closePath(); ctx.fill(); open = false; if (standing(x)) x -= 6; }
      }
      if (open) { ctx.lineTo(W, env.groundY(W - 1) + 2); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    for (const s of stalks) {
      const gy = env.groundY(Math.min(W - 1, s.x)) - H * (0.016 - s.rank * 0.006);
      if (!standing(s.x, s)) {
        if (worked || !stubbleSeason) continue;
        if (s.rank !== 2 && s.x % 3 > 1) continue;                                     // stubble: short, sparser
        ctx.strokeStyle = shade('#9c8658', light); ctx.lineWidth = Math.max(1, S * 0.007);
        ctx.beginPath(); ctx.moveTo(s.x, gy); ctx.lineTo(s.x + s.lean * 6, gy - S * 0.022); ctx.stroke();
        continue;
      }
      const h = fullH * s.h * (0.08 + 0.92 * grow) * (s.broke ? 1 - 0.5 * wither : 1);
      const shadeK = 0.82 + s.rank * 0.09;                                             // front rank a little lighter
      const c = shade(mixHex('#000000', col, shadeK), light);
      // The stalk: straight while alive; leaning, and bent over at the top as it dies.
      const tipDx = s.lean * h + s.bend * wither * h * (s.broke ? 0.75 : 0.42), tipDy = h * (1 - wither * (s.broke ? 0.6 : 0.2));
      const midX = s.x + s.lean * h * 0.5, midY = gy - h * 0.6;
      const tx = s.x + tipDx, ty = gy - tipDy;
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.2, S * (0.006 + 0.007 * grow));
      ctx.beginPath(); ctx.moveTo(s.x, gy); ctx.quadraticCurveTo(midX, midY, tx, ty); ctx.stroke();
      ctx.lineWidth = Math.max(1, S * 0.005);                                          // leaves: out and up while green, hanging once dead
      for (let k = 1; k <= 4 - Math.round(wither * 1.4); k++) {                          // dead leaves fall off too
        const f = k / 5, lx = s.x + (midX - s.x) * f * 1.6, ly = gy - h * f * 0.9, sgn = (k + s.rank) % 2 ? 1 : -1, len = h * (0.3 - 0.08 * wither);
        const droop = 0.1 + tan * 0.3 + wither * 0.7;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + sgn * len * (0.6 - wither * 0.25), ly - len * (0.25 - wither * 0.25), lx + sgn * len * (0.9 - wither * 0.45), ly + len * droop); ctx.stroke();
      }
      if (d >= D.jul25 - 10 && grow > 0.85 && !s.broke) {                              // tassel, and an ear hanging on the stalk
        ctx.strokeStyle = shade(mixHex(mixHex('#d9c27a', '#c8b48a', tan), '#8a7a5a', wither), light);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - S * 0.01, ty - S * 0.02 * (1 - wither)); ctx.moveTo(tx, ty); ctx.lineTo(tx + S * 0.01, ty - S * 0.018 * (1 - wither)); ctx.stroke();
        if (s.rank === 2) { ctx.fillStyle = shade(mixHex(mixHex('#7a8f3a', '#b8a06a', tan), '#8a7350', wither), light); ctx.beginPath(); ctx.ellipse(midX + S * 0.01, midY + h * 0.08 + wither * h * 0.05, S * 0.008, S * 0.022, 0.3 + wither * 0.8, 0, 6.3); ctx.fill(); }
      }
    }
  }
  // V118: the tractor, an old red one, with him up on the seat at the wheel, pulling an open
  // wagon behind. The ears go into the wagon as he goes, so it fills up across the field.
  function tractor(ctx, env, L, x, H, fill) {
    const S = L.S, light = env.light, gy = env.groundY(Math.max(0, Math.min(env.W - 1, x))) - H * 0.004, u = L.tl;
    const red = shade('#a8352c', light), dark = shade('#1e1c1a', light), hub = shade('#c8a040', light, 0.35), steel = shade('#7c8086', light);
    ctx.save(); ctx.translate(x, gy); ctx.lineCap = 'round';
    // The wagon: an open box on four wheels, a tongue up to the hitch.
    const wx0 = -u * 1.02, wx1 = -u * 0.5, wTop = -u * 0.3, wBot = -u * 0.12;
    ctx.strokeStyle = steel; ctx.lineWidth = Math.max(1.5, u * 0.02); ctx.beginPath(); ctx.moveTo(wx1, wBot + u * 0.01); ctx.lineTo(-u * 0.4, -u * 0.12); ctx.stroke();
    if (fill > 0.02) {                                                                // the load of ears, heaped up as it fills
      ctx.fillStyle = shade('#d6b45a', light, 0.3); ctx.beginPath(); ctx.moveTo(wx0 + u * 0.02, wTop + u * 0.02);
      const crest = wTop - u * 0.09 * fill;
      for (let k = 0; k <= 8; k++) { const xx = wx0 + (wx1 - wx0) * k / 8; ctx.lineTo(xx, crest + Math.sin(k * 1.7) * u * 0.012 + Math.abs(k - 4) * u * 0.006 * fill); }
      ctx.lineTo(wx1 - u * 0.02, wTop + u * 0.02); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade('#b8923e', light, 0.3);
      for (let k = 0; k < 12 * fill; k++) { ctx.beginPath(); ctx.ellipse(wx0 + (wx1 - wx0) * ((k * 0.37) % 1), crest + u * 0.02 + (k % 3) * u * 0.012, u * 0.018, u * 0.008, (k % 5) * 0.6, 0, 6.3); ctx.fill(); }
    }
    ctx.fillStyle = shade('#7a5a3c', light); ctx.fillRect(wx0, wTop, wx1 - wx0, wBot - wTop);            // wooden sides
    ctx.strokeStyle = shade('#5a4028', light); ctx.lineWidth = 1;
    for (let k = 1; k < 3; k++) { const yy = wTop + (wBot - wTop) * k / 3; ctx.beginPath(); ctx.moveTo(wx0, yy); ctx.lineTo(wx1, yy); ctx.stroke(); }
    ctx.fillStyle = dark;
    for (const wxp of [wx0 + u * 0.09, wx1 - u * 0.09]) { ctx.beginPath(); ctx.arc(wxp, -u * 0.07, u * 0.07, 0, 6.3); ctx.fill(); ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(wxp, -u * 0.07, u * 0.025, 0, 6.3); ctx.fill(); ctx.fillStyle = dark; }
    // The tractor: big back wheel, the seat over it, the hood and grille out front, a small front wheel.
    ctx.fillStyle = red;
    ctx.fillRect(-u * 0.3, -u * 0.36, u * 0.36, u * 0.13);                                                // hood
    ctx.beginPath(); ctx.moveTo(u * 0.06, -u * 0.36); ctx.lineTo(u * 0.1, -u * 0.33); ctx.lineTo(u * 0.1, -u * 0.2); ctx.lineTo(u * 0.06, -u * 0.18); ctx.fill();   // grille end
    ctx.fillRect(-u * 0.34, -u * 0.26, u * 0.14, u * 0.1);                                                // body under the seat
    ctx.fillStyle = shade('#2a2422', light); for (let k = 0; k < 3; k++) ctx.fillRect(u * 0.075, -u * (0.32 - k * 0.045), u * 0.02, u * 0.025);   // grille slots
    ctx.fillStyle = steel; ctx.fillRect(-u * 0.02, -u * 0.47, u * 0.025, u * 0.12);                       // exhaust stack
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(-u * 0.29, -u * 0.15, u * 0.15, 0, 6.3); ctx.fill();   // back wheel
    ctx.strokeStyle = shade('#3a3632', light); ctx.lineWidth = Math.max(1, u * 0.012);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; ctx.beginPath(); ctx.moveTo(-u * 0.29 + Math.cos(a) * u * 0.12, -u * 0.15 + Math.sin(a) * u * 0.12); ctx.lineTo(-u * 0.29 + Math.cos(a) * u * 0.15, -u * 0.15 + Math.sin(a) * u * 0.15); ctx.stroke(); }   // tread lugs
    ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(-u * 0.29, -u * 0.15, u * 0.06, 0, 6.3); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(u * 0.03, -u * 0.07, u * 0.07, 0, 6.3); ctx.fill();    // front wheel
    ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(u * 0.03, -u * 0.07, u * 0.025, 0, 6.3); ctx.fill();
    ctx.fillStyle = shade('#2a2422', light); ctx.fillRect(-u * 0.33, -u * 0.31, u * 0.11, u * 0.025);     // the seat
    ctx.strokeStyle = steel; ctx.lineWidth = Math.max(1.2, u * 0.014);                                     // steering column and wheel
    ctx.beginPath(); ctx.moveTo(-u * 0.12, -u * 0.36); ctx.lineTo(-u * 0.17, -u * 0.43); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-u * 0.18, -u * 0.44, u * 0.035, u * 0.012, -0.5, 0, 6.3); ctx.stroke();
    // Him, sitting: jeans along the seat, the red coat, arms out to the wheel, his hat.
    ctx.strokeStyle = shade('#2e3a4e', light); ctx.lineWidth = Math.max(1.5, u * 0.03);
    ctx.beginPath(); ctx.moveTo(-u * 0.3, -u * 0.33); ctx.lineTo(-u * 0.21, -u * 0.34); ctx.lineTo(-u * 0.19, -u * 0.27); ctx.stroke();
    ctx.fillStyle = shade('#7a2e26', light); ctx.fillRect(-u * 0.32, -u * 0.47, u * 0.06, u * 0.14);
    ctx.strokeStyle = shade('#7a2e26', light); ctx.lineWidth = Math.max(1.2, u * 0.022); ctx.beginPath(); ctx.moveTo(-u * 0.28, -u * 0.44); ctx.lineTo(-u * 0.19, -u * 0.43); ctx.stroke();
    ctx.fillStyle = shade('#d8b090', light); ctx.beginPath(); ctx.arc(-u * 0.29, -u * 0.51, u * 0.028, 0, 6.3); ctx.fill();
    ctx.fillStyle = shade('#3a4a5e', light); ctx.fillRect(-u * 0.32, -u * 0.55, u * 0.06, u * 0.018);
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
    // Mid-October until harvest he goes out now and then to feel the ears and see if they're dry enough.
    cornCheck: (env) => { const w = when(env); return w.day >= D.oct15 && w.day < harvestDay(); },
    busy: (env) => harvest(when(env), layout(env).steps, env).out,
    debug: (env) => { const w = when(env); return { day: w.day, hour: +w.hour.toFixed(2), harvestDay: harvestDay(), harvest: harvest(w, layout(env).steps, env), work: window.Farm.work(env) }; },
  };
})();
