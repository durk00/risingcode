// WINTER (Nov 24, 2026): a second scene for Rising Code. Swipe left on the
// Christmas display to get here, swipe right to go back (index.html handles the
// swipe). A night landscape drawn in code: rolling hills, pine trees, a house with
// lit windows and a smoking chimney, snow falling and piling up on the ground and
// the roof.
//
// The weather comes from NOAA (the National Weather Service, api.weather.gov) for
// Centre Hall, PA, refreshed every hour, and the scene shows what is COMING, not
// only what is happening now:
//   snowing now        flakes fall, light / moderate / heavy by the forecast rate,
//                      and snow piles up toward a depth set by the forecast total
//   snow within 48 hrs clouds gather across the top, thicker the closer it gets,
//                      with a few stray flurries in the last day
//   no snow forecast   a clear night: stars, chimney smoke, the old snow cover
// The thresholds below are first guesses, easy to change.
//
// Preview any state by adding ?snow=light, ?snow=moderate, ?snow=heavy,
// ?snow=coming or ?snow=none to the address.
(() => {
  const LAT = 40.8473, LON = -77.6858;          // Centre Hall, PA (town center)
  const RATE_MODERATE = 0.1, RATE_HEAVY = 0.5;   // inches per hour
  const LOOKAHEAD_HRS = 48;                      // how far ahead "coming" looks
  const FILL_MINUTES = 30;                       // time for a heavy snow to reach its full depth

  const preview = (location.search.match(/[?&]snow=(\w+)/) || [])[1];
  let ctx, W = 0, H = 0, t = 0;
  let flakes = [], stars = [], smoke = [], trees = [];
  let depth = null, roofDepth = null;            // snow height per 2-px column
  const COL = 2;
  let wx = { kind: 'loading', rate: 0, hoursUntil: null, total: 0, when: '' };
  let cover = 0;                                 // cloud cover shown, eases toward the target

  // ---- weather -------------------------------------------------------------
  function hoursOf(iso) {                        // "PT6H", "P1DT3H" -> hours
    const m = /P(?:(\d+)D)?T?(?:(\d+)H)?/.exec(iso || '');
    return m ? (+(m[1] || 0)) * 24 + (+(m[2] || 0)) : 1;
  }
  async function loadWeather() {
    if (preview) {
      const p = { light: 0.05, moderate: 0.3, heavy: 0.9 }[preview];
      wx = p ? { kind: 'snowing', rate: p, hoursUntil: 0, total: p * 10, when: 'now' }
        : preview === 'coming' ? { kind: 'coming', rate: 0, hoursUntil: 14, total: 4, when: 'TOMORROW' }
        : { kind: 'clear', rate: 0, hoursUntil: null, total: 0, when: '' };
      return;
    }
    try {
      const pt = await (await fetch(`https://api.weather.gov/points/${LAT},${LON}`)).json();
      const grid = await (await fetch(pt.properties.forecastGridData)).json();
      const vals = (grid.properties.snowfallAmount && grid.properties.snowfallAmount.values) || [];
      const now = Date.now();
      let rate = 0, total = 0, first = null;
      for (const v of vals) {
        const [startIso, dur] = v.validTime.split('/');
        const start = Date.parse(startIso), hrs = hoursOf(dur), end = start + hrs * 3600e3;
        const inches = (v.value || 0) / 25.4;     // NOAA gives millimeters
        if (inches <= 0 || end < now || start > now + LOOKAHEAD_HRS * 3600e3) continue;
        total += inches;
        if (start <= now && now < end) rate = Math.max(rate, inches / hrs);
        if (first === null || start < first) first = start;
      }
      if (rate > 0) wx = { kind: 'snowing', rate, hoursUntil: 0, total, when: 'now' };
      else if (first !== null) {
        const h = Math.max(0, (first - now) / 3600e3);
        const day = new Date(first).toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
        const sameDay = new Date(first).toDateString() === new Date().toDateString();
        const evening = new Date(first).getHours() >= 17;
        wx = { kind: 'coming', rate: 0, hoursUntil: h, total, when: sameDay ? (evening ? 'TONIGHT' : 'TODAY') : day };
      } else wx = { kind: 'clear', rate: 0, hoursUntil: null, total: 0, when: '' };
    } catch (e) {
      wx = { kind: 'offline', rate: 0, hoursUntil: null, total: 0, when: '' };
    }
  }

  // ---- layout --------------------------------------------------------------
  const groundY = (x) => H * 0.8 + Math.sin(x / W * 5.2 + 0.6) * H * 0.025 + Math.sin(x / W * 11.3) * H * 0.008;
  let house = null;
  function layout() {
    const hw = Math.min(W * 0.26, H * 0.36), hh = hw * 0.6, hx = W * 0.62 - hw / 2;
    const base = groundY(W * 0.62) + H * 0.012;
    house = { x: hx, w: hw, h: hh, base, top: base - hh, peak: base - hh - hw * 0.42, eave: hw * 0.08 };
    const chx = hx + hw * 0.7;
    house.chimney = { x: chx, w: hw * 0.09, top: roofY(chx) - hw * 0.2 };   // stands well above the roof
    stars = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.6, r: Math.random() * 1.1 + 0.3, p: Math.random() * 6.3 }));
    trees = [];
    for (let i = 0; i < 9; i++) {
      const x = (i < 5 ? W * (0.03 + i * 0.085) : W * (0.86 + (i - 5) * 0.045)) + (Math.random() - 0.5) * W * 0.03;
      trees.push({ x, h: H * (0.12 + Math.random() * 0.1) });
    }
    const n = Math.ceil(W / COL) + 1;
    const keep = depth && depth.length === n;
    if (!keep) { depth = new Float32Array(n).fill(H * 0.012); roofDepth = new Float32Array(n).fill(0); }
  }
  // Roof outline: a peaked roof; returns the roof surface y at x, or null off the roof.
  function roofY(x) {
    const { x: hx, w, top, peak, eave } = house;
    const l = hx - eave, r = hx + w + eave, mid = hx + w / 2;
    if (x < l || x > r) return null;
    const f = x < mid ? (x - l) / (mid - l) : (r - x) / (r - mid);
    return top + (peak - top) * f;
  }

  // ---- snow ----------------------------------------------------------------
  function targetFlakes() {
    const area = W * H / (1024 * 768);
    if (wx.kind === 'snowing') return Math.round(area * (wx.rate >= RATE_HEAVY ? 380 : wx.rate >= RATE_MODERATE ? 170 : 60));
    if (wx.kind === 'coming' && wx.hoursUntil < 24) return Math.round(area * 8);   // stray flurries
    return 0;
  }
  function maxDepth() {
    // Forecast total to on-screen depth: an inch is 1.2% of the screen height,
    // never more than a quarter of it.
    return Math.min(H * 0.25, Math.max(H * 0.03, wx.total * H * 0.012));
  }
  function newFlake(top) {
    const r = Math.random() * 1.8 + 0.6;
    return { x: Math.random() * (W + 80) - 40, y: top ? -10 - Math.random() * H * 0.2 : Math.random() * H, r, vy: 0.35 + r * 0.45, ph: Math.random() * 6.3 };
  }
  function land(x, onRoof) {
    const arr = onRoof ? roofDepth : depth;
    const i = Math.round(x / COL), cap = onRoof ? house.w * 0.12 : maxDepth();
    // Each flake adds a little, spread over neighbors so the drifts stay smooth.
    const perFlake = cap / (FILL_MINUTES * 60 * 30) * (W / COL) / Math.max(1, targetFlakes()) * 700;
    for (let k = -4; k <= 4; k++) {
      const j = i + k; if (j < 0 || j >= arr.length) continue;
      if (onRoof && roofY(j * COL) === null) continue;
      arr[j] = Math.min(cap, arr[j] + perFlake * (5 - Math.abs(k)) / 25);
    }
  }

  // ---- drawing -------------------------------------------------------------
  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#03060c'); g.addColorStop(1, '#0f1a2a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const clear = 1 - cover;
    if (clear > 0.05) for (const s of stars) {
      ctx.globalAlpha = clear * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 40 + s.p)));
      ctx.fillStyle = '#e9f1ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (cover > 0.02) {                          // clouds rolling across the top
      for (let i = 0; i < 14; i++) {
        const cx = ((i * 157 + t * 0.15 * (1 + (i % 3) * 0.3)) % (W + 400)) - 200;
        const cy = H * (0.05 + (i % 4) * 0.07) * (0.6 + cover * 0.6);
        const r = W * (0.12 + (i % 5) * 0.03) * (0.6 + cover * 0.5);
        const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g2.addColorStop(0, `rgba(70,80,95,${0.35 * cover})`); g2.addColorStop(1, 'rgba(70,80,95,0)');
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.fill();
      }
    }
  }
  function hills() {
    ctx.fillStyle = '#0b1320';
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.68 + Math.sin(x / W * 3.1 + 2) * H * 0.04);
    ctx.lineTo(W, H); ctx.fill();
    for (const tr of trees) {
      const b = groundY(tr.x) + H * 0.01, w = tr.h * 0.42;
      ctx.fillStyle = '#0a1a14';
      for (let k = 0; k < 3; k++) {
        const top = b - tr.h + k * tr.h * 0.22, bot = b - tr.h * 0.1 - (2 - k) * tr.h * 0.18;
        ctx.beginPath(); ctx.moveTo(tr.x, top); ctx.lineTo(tr.x - w * (0.55 + k * 0.22), bot); ctx.lineTo(tr.x + w * (0.55 + k * 0.22), bot); ctx.fill();
      }
    }
  }
  function drawHouse() {
    const { x, w, h, base, top, peak, eave, chimney: ch } = house;
    ctx.fillStyle = '#222c3a'; ctx.fillRect(x, top, w, h);                             // walls
    ctx.fillStyle = '#121822';                                                         // roof
    ctx.beginPath(); ctx.moveTo(x - eave, top); ctx.lineTo(x + w / 2, peak); ctx.lineTo(x + w + eave, top); ctx.fill();
    ctx.fillStyle = '#2b3646'; ctx.fillRect(ch.x, ch.top, ch.w, roofY(ch.x + ch.w) - ch.top + 2);   // chimney, brick-dark
    ctx.fillStyle = '#3a4657'; ctx.fillRect(ch.x - 2, ch.top - 3, ch.w + 4, 4);
    const glow = 0.85 + 0.15 * Math.sin(t / 23) * Math.sin(t / 7);                    // firelight flicker
    const win = (wx0, wy, ww, wh) => {
      ctx.fillStyle = `rgba(255,214,138,${glow})`; ctx.shadowColor = '#ffcf7a'; ctx.shadowBlur = ww * 0.6;
      ctx.fillRect(wx0, wy, ww, wh); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#121822'; ctx.lineWidth = Math.max(1, ww * 0.08);
      ctx.beginPath(); ctx.moveTo(wx0 + ww / 2, wy); ctx.lineTo(wx0 + ww / 2, wy + wh); ctx.moveTo(wx0, wy + wh / 2); ctx.lineTo(wx0 + ww, wy + wh / 2); ctx.stroke();
    };
    win(x + w * 0.12, top + h * 0.25, w * 0.18, h * 0.3);
    win(x + w * 0.7, top + h * 0.25, w * 0.18, h * 0.3);
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x + w * 0.43, top + h * 0.38, w * 0.14, h * 0.62);   // door
    // Chimney smoke: soft puffs that rise, spread and drift.
    if (t % 6 === 0) smoke.push({ x: ch.x + ch.w / 2, y: ch.top - 4, r: ch.w * 0.5, a: 0.22 });
    for (const s of smoke) { s.y -= 0.45; s.x += 0.25 + Math.sin((t + s.y) / 30) * 0.15; s.r += 0.12; s.a *= 0.992; }
    smoke = smoke.filter(s => s.a > 0.01 && s.y > -50);
    for (const s of smoke) { ctx.fillStyle = `rgba(190,200,212,${s.a})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill(); }
  }
  function snowLayers() {
    // Ground snow: from the drift line down to the bottom of the screen, over the
    // foot of the house.
    const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g.addColorStop(0, '#dfe8f1'); g.addColorStop(1, '#aebccb');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H);
    for (let i = 0; i < depth.length; i++) ctx.lineTo(i * COL, groundY(i * COL) - depth[i]);
    ctx.lineTo(W, H); ctx.fill();
    // Roof snow, riding on the roof line.
    ctx.fillStyle = '#e6eef6'; ctx.beginPath();
    let started = false, lastX = 0;
    for (let i = 0; i < roofDepth.length; i++) {
      const x = i * COL, ry = roofY(x); if (ry === null) continue;
      if (!started) { ctx.moveTo(x, ry); started = true; }
      ctx.lineTo(x, ry - roofDepth[i]); lastX = x;
    }
    for (let i = roofDepth.length - 1; i >= 0; i--) { const x = i * COL, ry = roofY(x); if (ry !== null) ctx.lineTo(x, ry); }
    if (started) ctx.fill();
  }
  function status() {
    const say = wx.kind === 'loading' ? 'CHECKING NOAA…'
      : wx.kind === 'offline' ? 'NOAA FORECAST UNAVAILABLE'
      : wx.kind === 'clear' ? 'NO SNOW IN THE FORECAST'
      : wx.kind === 'coming' ? `SNOW COMING ${wx.when} · ABOUT ${wx.total < 1 ? 'UNDER 1' : Math.round(wx.total)} IN`
      : `SNOWING · ${wx.rate >= RATE_HEAVY ? 'HEAVY' : wx.rate >= RATE_MODERATE ? 'MODERATE' : 'LIGHT'} · ABOUT ${wx.total < 1 ? 'UNDER 1' : Math.round(wx.total)} IN`;
    ctx.globalAlpha = 0.55; ctx.fillStyle = '#0b1320';
    ctx.font = `500 ${Math.max(11, Math.round(Math.min(W, H) / 60))}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(`${preview ? 'PREVIEW · ' : 'NOAA · CENTRE HALL · '}${say}`, 16, H - 14);
    ctx.globalAlpha = 1;
  }

  // ---- the frame -------------------------------------------------------------
  function draw() {
    t++;
    const want = wx.kind === 'snowing' ? Math.min(1, 0.55 + wx.rate)
      : wx.kind === 'coming' ? Math.max(0.1, 1 - wx.hoursUntil / LOOKAHEAD_HRS) * 0.8 : 0;
    cover += (want - cover) * (t < 3 ? 1 : 0.01);   // starts at the right cover, then eases
    sky(); hills(); drawHouse(); snowLayers();
    const n = targetFlakes();
    while (flakes.length < n) flakes.push(newFlake(flakes.length > n * 0.5));
    if (flakes.length > n) flakes.length = n;
    ctx.fillStyle = '#f2f7fc';
    for (const f of flakes) {
      f.y += f.vy; f.x += Math.sin(t / 50 + f.ph) * 0.35 + 0.15;
      const ry = roofY(f.x);
      const i = Math.max(0, Math.min(depth.length - 1, Math.round(f.x / COL)));
      if (ry !== null && f.y >= ry - roofDepth[i] && f.y < ry + 6) { if (wx.kind === 'snowing') land(f.x, true); Object.assign(f, newFlake(true)); continue; }
      if (f.y >= groundY(f.x) - depth[i]) { if (wx.kind === 'snowing') land(f.x, false); Object.assign(f, newFlake(true)); continue; }
      ctx.globalAlpha = 0.55 + f.r * 0.18; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.3); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Drifts settle: a little smoothing each frame so piles don't spike.
    if (t % 3 === 0) for (const arr of [depth, roofDepth]) for (let i = 1; i < arr.length - 1; i++) {
      if (arr === roofDepth && roofY(i * COL) === null) continue;
      arr[i] += ((arr[i - 1] + arr[i + 1]) / 2 - arr[i]) * 0.05;
    }
    status();
  }

  window.WinterScene = {
    start(context) { ctx = context; if (!this.started) { this.started = true; loadWeather(); setInterval(loadWeather, 3600e3); } },
    resize(w, h) { W = w; H = h; if (ctx) layout(); },
    draw() { if (!house) layout(); draw(); },
    debug: () => ({ deepest: Math.max(...depth), roof: Math.max(...roofDepth), cap: maxDepth(), flakes: flakes.length, wx }),
  };
})();
