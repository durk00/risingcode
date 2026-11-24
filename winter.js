// WINTER (Nov 24, 2026): a second scene for Rising Code. Swipe left on the
// Christmas display to get here, swipe right to go back (index.html handles the
// swipe). A landscape drawn in code: rolling hills, pine trees, and a house with
// lit windows and a chimney whose smoke never stops.
//
// V26: THE SCENE MATCHES TODAY'S NOAA FORECAST for Centre Hall, PA (the National
// Weather Service, api.weather.gov), refreshed every hour. The sky and the ground
// both follow it:
//   day or night   from the forecast period that's on now (sun by day; moon and
//                  stars by night)
//   sky            clear / partly cloudy / cloudy / fog, from that period's words
//   falling        rain, snow, or a mix, from the same words; snow comes down
//                  light / moderate / heavy by the forecast rate
//   ground         white when snow is in today's forecast, piling up while it
//                  falls; bare otherwise (any snow left melts away slowly)
// Upcoming snow is still previewed on top of today's weather: if snow is due in the
// next two days but not now, a line at the bottom says when and about how much,
// and in its last 12 hours the clouds start gathering.
// Every threshold below is a first guess, easy to change.
//
// A tap opens a three-day forecast box to the left of the house (V27). NOAA weather
// alerts show as a red banner at the top: tap for details, swipe to dismiss (V29).
//
// Preview without waiting for weather: add ?wx= with sunny, partly, cloudy, fog,
// rain, mix, snow-light, snow, snow-heavy or coming, and ?time=day or ?time=night.
(() => {
  const LAT = 40.8473, LON = -77.6858;          // Centre Hall, PA (town center)
  const RATE_MODERATE = 0.1, RATE_HEAVY = 0.5;   // snow, inches per hour
  const LOOKAHEAD_HRS = 48;                      // how far ahead upcoming snow is previewed
  const GATHER_HRS = 12;                         // clouds start gathering this long before it
  const FILL_MINUTES = 30;                       // time for a heavy snow to reach its full depth

  const q = location.search;
  const old = { light: 'snow-light', moderate: 'snow', heavy: 'snow-heavy', coming: 'coming', none: 'sunny' };
  const previewWx = (q.match(/[?&]wx=([\w-]+)/) || [])[1] || old[(q.match(/[?&]snow=(\w+)/) || [])[1]];
  const previewTime = (q.match(/[?&]time=(day|night)/) || [])[1];

  let ctx, W = 0, H = 0, t = 0;
  let flakes = [], drops = [], stars = [], smoke = [], trees = [], clouds = [];
  let depth = null, roofDepth = null;            // snow height per 2-px column
  const COL = 2;
  let wx = { status: 'loading', day: isDayByClock(), sky: 'clear', fall: 'none', rate: 0, rain: 0, snowToday: false, todayTotal: 0, coming: null, words: '' };
  let cover = 0, fog = 0, light = 0;   // shown values, eased toward the weather (light is set from the sun on the first frame)
  // THREE-DAY FORECAST BOX (V27): a tap on the Winter scene opens a small box to the
  // left of the house with today and the next two days from NOAA: the day, the
  // forecast in words, the high and low, and the chance of rain or snow. Tap again
  // to close it. (Taps here make no sound; sounds belong to the Christmas display.)
  let days = [], panelOpen = false, panelA = 0;

  // DAWN AND DUSK (V46): daylight follows the real sunrise and sunset for Centre Hall, worked
  // out on the device for each day of the year, not the forecast's 6-to-6 periods. The sky
  // brightens over the half hour before sunrise to the half hour after, and dims the same
  // way at sunset, so the scene changes in real time as it does outside.
  function sunAt(rise, d = new Date()) {
    const rad = Math.PI / 180, N = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), lh = LON / 15;
    const t = N + ((rise ? 6 : 18) - lh) / 24, M = 0.9856 * t - 3.289;
    const L = (M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634 + 360) % 360;
    let RA = (Math.atan(0.91764 * Math.tan(L * rad)) / rad + 360) % 360;
    RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15;
    const sinDec = 0.39782 * Math.sin(L * rad), cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(LAT * rad)) / (cosDec * Math.cos(LAT * rad));
    const Hh = (rise ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad) / 15;
    const UT = (Hh + RA - 0.06571 * t - 6.622 - lh + 48) % 24;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + UT * 3600e3);
  }
  function daylight(now = new Date()) {                // 0 night ... 1 day, with a one-hour blend at each end
    if (previewTime) return previewTime === 'day' ? 1 : 0;
    const up = sunAt(true, now), down = sunAt(false, now), half = 30 * 60e3;
    const ramp = (t, a) => Math.max(0, Math.min(1, (t - (a - half)) / (2 * half)));
    return Math.min(ramp(+now, +up), 1 - ramp(+now, +down));
  }
  function isDayByClock() { return daylight() >= 0.5; }

  // ---- weather -------------------------------------------------------------
  function hoursOf(iso) {                        // "PT6H", "P1DT3H" -> hours
    const m = /P(?:(\d+)D)?T?(?:(\d+)H)?/.exec(iso || '');
    return m ? (+(m[1] || 0)) * 24 + (+(m[2] || 0)) : 1;
  }
  // Words from the forecast ("Mostly Sunny", "Chance Snow Showers", "Rain And Snow")
  // to what the scene shows.
  function readWords(words) {
    const w = (words || '').toLowerCase();
    const fall = /sleet|freezing|wintry|rain and snow|snow and rain|ice pellets/.test(w) ? 'mix'
      : /snow|flurr|blizzard/.test(w) ? 'snow'
      : /rain|shower|drizzle|thunder|storm/.test(w) ? 'rain' : 'none';
    const sky = fall !== 'none' ? 'cloudy'
      : /fog|haze|mist|smoke/.test(w) ? 'fog'
      : /mostly cloudy|^cloudy|overcast/.test(w) ? 'cloudy'
      : /partly|mostly sunny|mostly clear|few clouds/.test(w) ? 'partly' : 'clear';
    const chance = /chance|slight|isolated|scattered/.test(w);
    return { fall, sky, chance };
  }
  function setPreview() {
    const day = previewTime ? previewTime === 'day' : isDayByClock();
    // NOAA-style words for each preview, so the status line and the forecast icon read like the real thing.
    const words = { sunny: 'Sunny', partly: 'Partly Sunny', cloudy: 'Cloudy', fog: 'Patchy Fog', rain: 'Rain Showers', mix: 'Rain And Snow', 'snow-light': 'Chance Snow Showers', snow: 'Snow', 'snow-heavy': 'Heavy Snow', coming: 'Mostly Sunny' }[previewWx] || 'Sunny';
    const base = { status: 'preview', day, sky: 'clear', fall: 'none', rate: 0, rain: 0, snowToday: false, todayTotal: 0, coming: null, words };
    const p = {
      sunny: {}, partly: { sky: 'partly' }, cloudy: { sky: 'cloudy' }, fog: { sky: 'fog' },
      rain: { sky: 'cloudy', fall: 'rain', rain: 0.15 },
      mix: { sky: 'cloudy', fall: 'mix', rate: 0.1, rain: 0.08, snowToday: true, todayTotal: 2 },
      'snow-light': { sky: 'cloudy', fall: 'snow', rate: 0.05, snowToday: true, todayTotal: 1 },
      snow: { sky: 'cloudy', fall: 'snow', rate: 0.3, snowToday: true, todayTotal: 4 },
      'snow-heavy': { sky: 'cloudy', fall: 'snow', rate: 0.9, snowToday: true, todayTotal: 9 },
      coming: { sky: 'partly', coming: { when: 'TOMORROW', total: 4, hoursUntil: 10 } },
    }[previewWx] || {};
    wx = Object.assign(base, p);
    const name = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
    days = [
      { name: name(0), words: wx.words, hi: 38, lo: 24, pop: 20 },
      { name: name(1), words: /\bicons\b/.test(q) ? 'Partly Sunny' : 'Mostly Cloudy', hi: 35, lo: 27, pop: 40 },
      { name: name(2), words: 'Snow Showers Likely', hi: 31, lo: 19, pop: 70 },
    ];
  }
  async function loadWeather() {
    if (previewWx) { setPreview(); return; }
    try {
      const pt = await (await fetch(`https://api.weather.gov/points/${LAT},${LON}`)).json();
      const [fc, grid] = await Promise.all([
        fetch(pt.properties.forecast).then(r => r.json()),
        fetch(pt.properties.forecastGridData).then(r => r.json()),
      ]);
      const now = Date.now();
      const period = fc.properties.periods.find(p => Date.parse(p.startTime) <= now && now < Date.parse(p.endTime)) || fc.properties.periods[0];
      let { fall, sky, chance } = readWords(period.shortForecast);
      // WHAT'S HAPPENING NOW (V44): the forecast says what's expected this period; the nearest
      // NOAA station says what's actually happening. When a station has a reading from the
      // last 2 hours, its words decide what falls and what the sky looks like, so rain or
      // snow shows when it's really coming down and not when it's only "a chance".
      // V58: read through WxNow, which checks the last several readings of the nearest stations
      // and builds the words from the measurements when NOAA leaves them blank.
      let observed = '';
      try { const now = window.WxNow && await WxNow.latest(pt.properties.observationStations); if (now) observed = now.words; }
      catch (e) { /* the forecast alone still drives the scene */ }
      const obsHeavy = /heavy/i.test(observed), obsLight = /light|drizzle|flurr/i.test(observed);
      if (observed) { const ob = readWords(observed); fall = ob.fall; sky = ob.fall !== 'none' ? 'cloudy' : ob.sky; chance = false; }
      // No station reading, and the forecast only says a chance: show the clouds, but nothing
      // falling. A false rain is worse than a missed one (V58).
      else if (chance && fall !== 'none') fall = 'none';
      const g = grid.properties;
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      let rate = 0, todayTotal = 0, ahead = 0, first = null;
      for (const v of (g.snowfallAmount && g.snowfallAmount.values) || []) {
        const [s, d] = v.validTime.split('/'); const start = Date.parse(s), hrs = hoursOf(d), end = start + hrs * 3600e3;
        const inches = (v.value || 0) / 25.4;     // NOAA gives millimeters
        if (inches <= 0) continue;
        if (start < +midnight && end > +startOfDay) todayTotal += inches;
        if (start <= now && now < end) rate = Math.max(rate, inches / hrs);
        if (end > now && start < now + LOOKAHEAD_HRS * 3600e3) { ahead += inches; if (first === null || start < first) first = start; }
      }
      let rain = 0;
      for (const v of (g.quantitativePrecipitation && g.quantitativePrecipitation.values) || []) {
        const [s, d] = v.validTime.split('/'); const start = Date.parse(s), hrs = hoursOf(d);
        if (start <= now && now < start + hrs * 3600e3) rain = (v.value || 0) / 25.4 / hrs;
      }
      const snowFalling = fall === 'snow' || fall === 'mix';
      if (snowFalling && rate === 0) rate = observed ? (obsHeavy ? 0.6 : obsLight ? 0.05 : 0.2) : chance ? 0.03 : 0.08;
      if (fall === 'rain' && rain === 0) rain = observed ? (obsHeavy ? 0.3 : obsLight ? 0.03 : 0.1) : chance ? 0.03 : 0.1;
      let coming = null;
      if (!snowFalling && first !== null && first > now) {
        const day = new Date(first).toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
        const sameDay = new Date(first).toDateString() === new Date().toDateString();
        const tomorrow = new Date(now + 864e5).toDateString() === new Date(first).toDateString();
        const when = sameDay ? (new Date(first).getHours() >= 17 ? 'TONIGHT' : 'TODAY') : tomorrow ? 'TOMORROW' : day;
        coming = { when, total: ahead, hoursUntil: (first - now) / 3600e3 };
      }
      wx = { status: 'ok', day: !!period.isDaytime, sky, fall, rate, rain, snowToday: todayTotal > 0 || snowFalling, todayTotal, coming, words: observed ? 'Now: ' + observed : period.shortForecast, forecastWords: period.shortForecast };
      // Three days for the forecast box: NOAA's day and night periods grouped by date.
      const byDate = new Map();
      for (const p of fc.properties.periods) {
        const d = new Date(p.startTime), key = d.toDateString();
        if (!byDate.has(key)) byDate.set(key, { name: d.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase(), words: '', hi: null, lo: null, pop: 0 });
        const e = byDate.get(key);
        if (p.isDaytime) { e.hi = p.temperature; e.words = p.shortForecast; }
        else { e.lo = p.temperature; if (!e.words) e.words = p.shortForecast; }
        e.pop = Math.max(e.pop, (p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value) || 0);
      }
      days = [...byDate.values()].slice(0, 3);
    } catch (e) {
      wx = Object.assign({}, wx, { status: 'offline', day: isDayByClock() });
    }
  }

  // ---- layout --------------------------------------------------------------
  const groundY = (x) => H * 0.8 + Math.sin(x / W * 5.2 + 0.6) * H * 0.025 + Math.sin(x / W * 11.3) * H * 0.008;
  let house = null;
  function roofY(x) {                            // roof surface y at x, or null off the roof
    const { x: hx, w, top, peak, eave } = house;
    const l = hx - eave, r = hx + w + eave, mid = hx + w / 2;
    if (x < l || x > r) return null;
    const f = x < mid ? (x - l) / (mid - l) : (r - x) / (r - mid);
    return top + (peak - top) * f;
  }
  function layout() {
    const hw = Math.min(W * 0.26, H * 0.36), hh = hw * 0.6, hx = W * 0.62 - hw / 2;
    const base = groundY(W * 0.62) + H * 0.012;
    house = { x: hx, w: hw, h: hh, base, top: base - hh, peak: base - hh - hw * 0.42, eave: hw * 0.08 };
    const chx = hx + hw * 0.7;
    house.chimney = { x: chx, w: hw * 0.09, top: roofY(chx) - hw * 0.2 };
    stars = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.6, r: Math.random() * 1.1 + 0.3, p: Math.random() * 6.3 }));
    trees = [];
    for (let i = 0; i < 9; i++) {
      const x = (i < 5 ? W * (0.03 + i * 0.085) : W * (0.86 + (i - 5) * 0.045)) + (Math.random() - 0.5) * W * 0.03;
      trees.push({ x, h: H * (0.12 + Math.random() * 0.1) });
    }
    clouds = Array.from({ length: 9 }, (_, i) => ({ x: Math.random() * (W + 400) - 200, y: H * (0.06 + Math.random() * 0.3), s: W * (0.1 + Math.random() * 0.08), v: 0.12 + Math.random() * 0.15, k: i }));
    const n = Math.ceil(W / COL) + 1;
    if (!depth || depth.length !== n) { depth = new Float32Array(n).fill(0); roofDepth = new Float32Array(n).fill(0); }
  }

  // ---- what to show --------------------------------------------------------
  const snowing = () => wx.fall === 'snow' || wx.fall === 'mix';
  function targetFlakes() {
    if (!snowing()) return 0;
    const area = W * H / (1024 * 768), n = wx.rate >= RATE_HEAVY ? 380 : wx.rate >= RATE_MODERATE ? 170 : 60;
    return Math.round(area * n * (wx.fall === 'mix' ? 0.5 : 1));
  }
  function targetDrops() {
    if (wx.fall !== 'rain' && wx.fall !== 'mix') return 0;
    const area = W * H / (1024 * 768);
    return Math.round(area * Math.min(420, 90 + wx.rain * 1500) * (wx.fall === 'mix' ? 0.5 : 1));
  }
  function maxDepth() {                          // an inch of today's total is 1.2% of the screen, capped at a quarter
    return Math.min(H * 0.25, Math.max(H * 0.02, wx.todayTotal * H * 0.012));
  }
  function targetCover() {
    let c = { clear: 0, partly: 0.4, cloudy: 0.9, fog: 0.5 }[wx.sky] || 0;
    if (wx.fall !== 'none') c = 1;
    if (wx.coming && wx.coming.hoursUntil < GATHER_HRS) c = Math.max(c, 0.9 * (1 - wx.coming.hoursUntil / GATHER_HRS));
    return c;
  }

  // ---- colors: by day and by night, blended by `light` ----------------------
  const mix = (a, b, f) => {
    const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join('');
  };
  const tone = (night, day) => mix(night, day, light);

  // ---- drawing -------------------------------------------------------------
  // THE MOON'S REAL PHASE (V41), worked out from the date: days since a known new moon
  // (Jan 6, 2000, 18:14 UTC), over the 29.53-day cycle. Drawn as seen from Pennsylvania:
  // lit on the right while it grows, on the left while it shrinks. The unlit part shows
  // as a faint outline so a new moon still reads as the moon.
  const SYNODIC = 29.530588853;
  function moonAge(t = Date.now()) { return (((t - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % SYNODIC + SYNODIC) % SYNODIC; }
  function moonPhaseName(age = moonAge()) {
    const k = age / SYNODIC;
    return k < 0.03 || k > 0.97 ? 'NEW MOON' : k < 0.22 ? 'WAXING CRESCENT' : k < 0.28 ? 'FIRST QUARTER' : k < 0.47 ? 'WAXING GIBBOUS'
      : k < 0.53 ? 'FULL MOON' : k < 0.72 ? 'WANING GIBBOUS' : k < 0.78 ? 'LAST QUARTER' : 'WANING CRESCENT';
  }
  function moon(cx, cy, R, color, age = moonAge()) {
    const th = age / SYNODIC * Math.PI * 2, waxing = age < SYNODIC / 2, rx = R * Math.abs(Math.cos(th)), gibbous = Math.cos(th) < 0;
    ctx.save();
    ctx.globalAlpha *= 0.22; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, R * 0.08);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, !waxing);              // the lit edge
    ctx.ellipse(cx, cy, Math.max(0.01, rx), R, 0, Math.PI / 2, -Math.PI / 2, waxing !== gibbous);   // the terminator
    ctx.closePath(); ctx.fill();
  }
  function sky() {
    const grey = Math.min(1, cover * 1.1);
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.8);
    g.addColorStop(0, mix(tone('#03060c', '#3f78b8'), tone('#141a22', '#8a939e'), grey));
    g.addColorStop(1, mix(tone('#0f1a2a', '#a9cbea'), tone('#1d242d', '#b4bcc5'), grey));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const clearness = Math.max(0, 1 - cover * 1.3);
    if (clearness > 0.02 && light < 0.9) for (const s of stars) {
      ctx.globalAlpha = clearness * (1 - light) * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 40 + s.p)));
      ctx.fillStyle = '#e9f1ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill();
    }
    // Sun by day, moon by night, upper left, fading behind cloud.
    const bx = W * 0.2, by = H * 0.17, br = Math.min(W, H) * 0.05;
    const vis = Math.max(0, 1 - cover * 1.2);
    if (vis > 0.02) {
      ctx.globalAlpha = vis;
      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, br * (light > 0.5 ? 4 : 2.5));
      glow.addColorStop(0, light > 0.5 ? 'rgba(255,240,200,0.9)' : 'rgba(220,230,245,0.35)');
      glow.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(bx, by, br * 4, 0, 6.3); ctx.fill();
      if (light > 0.5) { ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.3); ctx.fill(); }
      else moon(bx, by, br * 0.8, '#e8eef6');                               // tonight's real phase
      ctx.globalAlpha = 1;
    }
    // Clouds: puffy groups of circles drifting right to left; white by day, grey when heavy.
    if (cover > 0.02) {
      const n = Math.ceil(clouds.length * Math.min(1, cover + 0.2));
      const col = mix(tone('#2a323d', '#f4f6f9'), tone('#20262e', '#9aa3ad'), Math.min(1, cover));
      for (let i = 0; i < n; i++) {
        const c = clouds[i];
        c.x -= c.v; if (c.x < -c.s * 2) { c.x = W + c.s * 2; c.y = H * (0.06 + Math.random() * 0.3); }
        ctx.globalAlpha = Math.min(0.95, 0.35 + cover * 0.6); ctx.fillStyle = col;
        for (const [dx, dy, r] of [[0, 0, 0.5], [0.45, 0.1, 0.38], [-0.45, 0.12, 0.36], [0.2, -0.18, 0.34], [-0.15, -0.12, 0.3]]) {
          ctx.beginPath(); ctx.arc(c.x + dx * c.s, c.y + dy * c.s * 0.6, r * c.s * 0.55, 0, 6.3); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (cover > 0.85) { ctx.globalAlpha = (cover - 0.85) * 4; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H * 0.12); ctx.globalAlpha = 1; }
    }
  }
  function land() {
    ctx.fillStyle = tone('#0b1320', '#55665a');                                         // far hills
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.68 + Math.sin(x / W * 3.1 + 2) * H * 0.04);
    ctx.lineTo(W, H); ctx.fill();
    for (const tr of trees) {
      const b = groundY(tr.x) + H * 0.01, w = tr.h * 0.42;
      ctx.fillStyle = tone('#0a1a14', '#1f3a2c');
      for (let k = 0; k < 3; k++) {
        const top = b - tr.h + k * tr.h * 0.22, bot = b - tr.h * 0.1 - (2 - k) * tr.h * 0.18;
        ctx.beginPath(); ctx.moveTo(tr.x, top); ctx.lineTo(tr.x - w * (0.55 + k * 0.22), bot); ctx.lineTo(tr.x + w * (0.55 + k * 0.22), bot); ctx.fill();
      }
    }
    // Bare ground: winter grass and dirt, darker and glossier when it's raining.
    const wet = wx.fall === 'rain' || wx.fall === 'mix' ? 0.35 : 0;
    const g = ctx.createLinearGradient(0, H * 0.75, 0, H);
    g.addColorStop(0, mix(tone('#141a14', '#6d6a4c'), tone('#0c100c', '#3e3d2c'), wet));
    g.addColorStop(1, mix(tone('#0d110d', '#544a36'), tone('#080a08', '#2e2a20'), wet));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) ctx.lineTo(x, groundY(x));
    ctx.lineTo(W, H); ctx.fill();
  }
  function drawHouse() {
    const { x, w, h, top, peak, eave, chimney: ch } = house;
    ctx.fillStyle = tone('#222c3a', '#7a5f4c'); ctx.fillRect(x, top, w, h);             // walls
    ctx.fillStyle = tone('#121822', '#3a3d45');                                          // roof
    ctx.beginPath(); ctx.moveTo(x - eave, top); ctx.lineTo(x + w / 2, peak); ctx.lineTo(x + w + eave, top); ctx.fill();
    ctx.fillStyle = tone('#2b3646', '#6e4a3a'); ctx.fillRect(ch.x, ch.top, ch.w, roofY(ch.x + ch.w) - ch.top + 2);   // chimney
    ctx.fillStyle = tone('#3a4657', '#82604e'); ctx.fillRect(ch.x - 2, ch.top - 3, ch.w + 4, 4);
    const flick = 0.85 + 0.15 * Math.sin(t / 23) * Math.sin(t / 7);                    // firelight
    const lit = (1 - light) * flick;   // V45: by day the lights are off: dark glass; at night they glow
    const win = (wx0, wy, ww, wh) => {
      ctx.fillStyle = mix('#33414f', '#ffd68a', lit); ctx.shadowColor = '#ffcf7a'; ctx.shadowBlur = ww * 0.6 * (1 - light);
      ctx.fillRect(wx0, wy, ww, wh); ctx.shadowBlur = 0;
      if (light > 0.3) {                         // a faint daylight reflection across the dark glass
        ctx.save(); ctx.globalAlpha = 0.18 * light; ctx.fillStyle = '#dfe8f1';
        ctx.beginPath(); ctx.moveTo(wx0, wy + wh * 0.55); ctx.lineTo(wx0 + ww * 0.55, wy); ctx.lineTo(wx0 + ww * 0.8, wy); ctx.lineTo(wx0, wy + wh * 0.9); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.strokeStyle = tone('#121822', '#efe6da'); ctx.lineWidth = Math.max(1, ww * 0.08);
      ctx.strokeRect(wx0, wy, ww, wh);
      ctx.beginPath(); ctx.moveTo(wx0 + ww / 2, wy); ctx.lineTo(wx0 + ww / 2, wy + wh); ctx.moveTo(wx0, wy + wh / 2); ctx.lineTo(wx0 + ww, wy + wh / 2); ctx.stroke();
    };
    win(x + w * 0.12, top + h * 0.25, w * 0.18, h * 0.3);
    win(x + w * 0.7, top + h * 0.25, w * 0.18, h * 0.3);
    ctx.fillStyle = tone('#3a2a1e', '#4a2f22'); ctx.fillRect(x + w * 0.43, top + h * 0.38, w * 0.14, h * 0.62);   // door
    // Chimney smoke, always: soft puffs that rise, spread and drift, whatever the weather.
    if (t % 6 === 0) smoke.push({ x: ch.x + ch.w / 2, y: ch.top - 4, r: ch.w * 0.5, a: 0.24 });
    for (const s of smoke) { s.y -= 0.45; s.x += 0.25 + Math.sin((t + s.y) / 30) * 0.15 + (wx.fall !== 'none' ? 0.2 : 0); s.r += 0.12; s.a *= 0.992; }
    smoke = smoke.filter(s => s.a > 0.01 && s.y > -50);
    const sc = tone('#bec8d4', '#e6eaee');
    for (const s of smoke) { ctx.globalAlpha = s.a * (light > 0.5 ? 1.6 : 1); ctx.fillStyle = sc; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function snowLayers() {
    if (Math.max(...depth) < 0.3 && Math.max(...roofDepth) < 0.3) return;
    const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g.addColorStop(0, tone('#dfe8f1', '#f6f9fc')); g.addColorStop(1, tone('#aebccb', '#d4dfe9'));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H);
    for (let i = 0; i < depth.length; i++) ctx.lineTo(i * COL, groundY(i * COL) - depth[i] + (depth[i] < 0.3 ? 2 : 0));
    ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = tone('#e6eef6', '#fbfdff'); ctx.beginPath();
    let started = false;
    for (let i = 0; i < roofDepth.length; i++) {
      const x = i * COL, ry = roofY(x); if (ry === null) continue;
      if (!started) { ctx.moveTo(x, ry); started = true; }
      ctx.lineTo(x, ry - roofDepth[i]);
    }
    for (let i = roofDepth.length - 1; i >= 0; i--) { const x = i * COL, ry = roofY(x); if (ry !== null) ctx.lineTo(x, ry); }
    if (started) ctx.fill();
  }
  function addSnow(x, onRoof) {
    const arr = onRoof ? roofDepth : depth;
    const i = Math.round(x / COL), cap = onRoof ? house.w * 0.12 : maxDepth();
    const perFlake = cap / (FILL_MINUTES * 60 * 30) * (W / COL) / Math.max(1, targetFlakes()) * 700;
    for (let k = -4; k <= 4; k++) {
      const j = i + k; if (j < 0 || j >= arr.length) continue;
      if (onRoof && roofY(j * COL) === null) continue;
      arr[j] = Math.min(cap, arr[j] + perFlake * (5 - Math.abs(k)) / 25);
    }
  }
  function precipitation() {
    const nF = targetFlakes();
    while (flakes.length < nF) { const r = Math.random() * 1.8 + 0.6; flakes.push({ x: Math.random() * (W + 80) - 40, y: flakes.length > nF * 0.5 ? -10 : Math.random() * H, r, vy: 0.35 + r * 0.45, ph: Math.random() * 6.3 }); }
    if (flakes.length > nF) flakes.length = nF;
    ctx.fillStyle = '#f2f7fc';
    for (const f of flakes) {
      f.y += f.vy; f.x += Math.sin(t / 50 + f.ph) * 0.35 + 0.15;
      const ry = roofY(f.x), i = Math.max(0, Math.min(depth.length - 1, Math.round(f.x / COL)));
      const reset = () => { f.x = Math.random() * (W + 80) - 40; f.y = -10 - Math.random() * 40; };
      if (ry !== null && f.y >= ry - roofDepth[i] && f.y < ry + 6) { addSnow(f.x, true); reset(); continue; }
      if (f.y >= groundY(f.x) - depth[i]) { addSnow(f.x, false); reset(); continue; }
      ctx.globalAlpha = 0.55 + f.r * 0.18; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.3); ctx.fill();
    }
    const nD = targetDrops();
    while (drops.length < nD) drops.push({ x: Math.random() * (W + 200) - 100, y: Math.random() * H, v: 9 + Math.random() * 5, l: 8 + Math.random() * 10 });
    if (drops.length > nD) drops.length = nD;
    ctx.strokeStyle = tone('#9fb3c8', '#dce6ef'); ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55; ctx.beginPath();
    for (const d of drops) {
      d.y += d.v; d.x -= d.v * 0.18;
      const ry = roofY(d.x);
      if (d.y >= groundY(d.x) || (ry !== null && d.y >= ry && d.y < ry + 12)) { d.x = Math.random() * (W + 200) - 100; d.y = -20; continue; }
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.18, d.y - d.l);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  function fogLayer() {
    if (fog < 0.02) return;
    const g = ctx.createLinearGradient(0, H * 0.45, 0, H);
    const c = tone('#3a4450', '#d8dde2');
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, c); g.addColorStop(1, c);
    ctx.globalAlpha = fog * 0.6; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  }
  function status() {
    const amt = (n) => n < 1 ? 'UNDER 1' : String(Math.round(n));
    let say = wx.status === 'loading' ? 'CHECKING NOAA…'
      : wx.status === 'offline' ? 'NOAA FORECAST UNAVAILABLE'
      : (wx.words || '').toUpperCase();
    if (wx.status !== 'loading' && wx.status !== 'offline' && wx.todayTotal > 0) say += ` · ABOUT ${amt(wx.todayTotal)} IN TODAY`;
    if (wx.coming) say += ` · SNOW COMING ${wx.coming.when} · ABOUT ${amt(wx.coming.total)} IN`;
    ctx.font = `500 ${Math.max(11, Math.round(Math.min(W, H) / 60))}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';   // top left, clear of the tap hint at the bottom
    ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.fillStyle = '#eef3f8'; ctx.globalAlpha = 0.8;
    ctx.fillText(`${wx.status === 'preview' ? 'PREVIEW' : 'NOAA · CENTRE HALL'} · ${say}`, 16, 14);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // ---- the frame -------------------------------------------------------------
  function draw() {
    t++;
    const first = t < 3;
    const ease = (cur, want, k) => cur + (want - cur) * (first ? 1 : k);
    cover = ease(cover, targetCover(), 0.01);
    fog = ease(fog, wx.sky === 'fog' ? 1 : 0, 0.01);
    light = ease(light, daylight(), 0.02);   // follows the real sun (V46)
    // Ground: white while snow is in today's forecast (a light cover at least),
    // otherwise any snow melts slowly away to bare ground.
    if (wx.snowToday) { const floor = H * 0.008; for (let i = 0; i < depth.length; i++) if (depth[i] < floor) depth[i] = first ? floor : depth[i] + 0.02; }
    else { for (let i = 0; i < depth.length; i++) depth[i] = Math.max(0, depth[i] - (first ? 99 : 0.02)); for (let i = 0; i < roofDepth.length; i++) roofDepth[i] = Math.max(0, roofDepth[i] - (first ? 99 : 0.02)); }
    sky(); land(); drawHouse(); snowLayers(); precipitation(); fogLayer();
    if (t % 3 === 0) for (const arr of [depth, roofDepth]) for (let i = 1; i < arr.length - 1; i++) {
      if (arr === roofDepth && roofY(i * COL) === null) continue;
      arr[i] += ((arr[i - 1] + arr[i + 1]) / 2 - arr[i]) * 0.05;
    }
    status();
    panel();
    banner();
    detailPage();
  }
  // WEATHER ICONS (V28) in the forecast box, at the right of each day, above the
  // precipitation: sun; sun behind a cloud; cloud; cloud with rain streaks; cloud
  // with snowflakes; cloud with both for a mix; fog lines. A moon stands in for
  // the sun when only tonight's forecast is left. Shapes differ, not just colors.
  function icon(kind, night, cx, cy, r) {
    const { fall, sky } = kind;
    ctx.save(); ctx.lineCap = 'round';
    const sun = (x0, y0, rr) => {
      if (night) {
        moon(x0, y0, rr * 0.75, '#e8eef6');                               // tonight's real phase (V41)
        return;
      }
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = Math.max(1.5, rr * 0.14);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x0 + Math.cos(a) * rr * 0.78, y0 + Math.sin(a) * rr * 0.78); ctx.lineTo(x0 + Math.cos(a) * rr * 1.08, y0 + Math.sin(a) * rr * 1.08); ctx.stroke(); }
      ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(x0, y0, rr * 0.58, 0, 6.3); ctx.fill();
    };
    const cloud = (x0, y0, rr, shade) => {
      ctx.fillStyle = shade;
      for (const [dx, dy, q] of [[-0.45, 0.12, 0.42], [0.05, -0.12, 0.55], [0.5, 0.1, 0.4]]) { ctx.beginPath(); ctx.arc(x0 + dx * rr, y0 + dy * rr, q * rr, 0, 6.3); ctx.fill(); }
      ctx.fillRect(x0 - rr * 0.45, y0 + rr * 0.1, rr * 0.95, rr * 0.42);
    };
    if (fall !== 'none') {
      cloud(cx, cy - r * 0.25, r, '#c4ccd6');
      const top = cy + r * 0.38;
      for (let k = 0; k < 3; k++) {
        const px = cx - r * 0.45 + k * r * 0.45;
        const snowHere = fall === 'snow' || (fall === 'mix' && k !== 1);
        if (snowHere) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, top + r * 0.32, r * 0.11, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.arc(px + r * 0.12, top + r * 0.62, r * 0.09, 0, 6.3); ctx.fill(); }
        else { ctx.strokeStyle = '#9fd0ff'; ctx.lineWidth = Math.max(1.5, r * 0.11); ctx.beginPath(); ctx.moveTo(px + r * 0.1, top + r * 0.15); ctx.lineTo(px - r * 0.06, top + r * 0.7); ctx.stroke(); }
      }
    } else if (sky === 'fog') {
      ctx.strokeStyle = '#c4ccd6'; ctx.lineWidth = Math.max(1.5, r * 0.14);
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx - r * (0.9 - (k % 2) * 0.2), cy - r * 0.5 + k * r * 0.36); ctx.lineTo(cx + r * (0.9 - ((k + 1) % 2) * 0.2), cy - r * 0.5 + k * r * 0.36); ctx.stroke(); }
    } else if (sky === 'cloudy') {
      cloud(cx + r * 0.25, cy - r * 0.35, r * 0.7, '#8e98a4');
      cloud(cx - r * 0.1, cy + r * 0.05, r, '#c4ccd6');
    } else if (sky === 'partly') {
      sun(cx + r * 0.3, cy - r * 0.3, r * 0.75);
      cloud(cx - r * 0.15, cy + r * 0.15, r * 0.85, '#dfe5ec');
    } else sun(cx, cy, r * 0.95);
    ctx.restore();
  }

  // WEATHER ALERTS (V29): NOAA's active alerts for Centre Hall (api.weather.gov/alerts),
  // checked every 10 minutes. When there is one, a red banner shows across the top:
  // the alert's name and when it ends. Tap the banner for the details page; swipe it
  // sideways to dismiss it. A dismissed alert stays away on this device; a new or
  // updated one shows again. Several at once: the most severe first, with a count.
  // Preview with ?alert on the address.
  const SEV = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
  let alerts = [], dismissed = new Set(), detail = null, bannerBox = null, slide = 0, slideDir = 0;
  try { dismissed = new Set(JSON.parse(localStorage.getItem('risingcode_dismissed') || '[]')); } catch (e) {}
  async function loadAlerts() {
    if (/[?&]alert\b/.test(q)) {
      const until = new Date(Date.now() + 30 * 3600e3).toISOString();
      alerts = [{ id: 'preview-alert', event: 'Winter Storm Warning', severity: 'Severe', ends: until,
        headline: 'Winter Storm Warning issued for Centre County (preview)',
        description: 'Heavy snow expected. Total snow accumulations of 8 to 12 inches. Winds gusting as high as 35 mph. (This is a preview, not a real alert.)',
        instruction: 'If you must travel, keep an extra flashlight, food, and water in your vehicle in case of an emergency.' }];
      return;
    }
    try {
      const r = await (await fetch(`https://api.weather.gov/alerts/active?point=${LAT},${LON}`)).json();
      alerts = (r.features || []).map(f => f.properties).map(p => ({
        id: p.id, event: p.event, severity: p.severity, ends: p.ends || p.expires,
        headline: p.headline || p.event, description: p.description || '', instruction: p.instruction || '',
      })).sort((a, b) => (SEV[b.severity] || 0) - (SEV[a.severity] || 0));
    } catch (e) { /* keep the last list */ }
  }
  const showing = () => alerts.filter(a => !dismissed.has(a.id));
  const endsText = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return 'UNTIL ' + d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase();
  };
  function banner() {
    const list = showing();
    if (slideDir) { slide += slideDir * W * 0.08; if (Math.abs(slide) > W) { const a = list[0]; if (a) { dismissed.add(a.id); try { localStorage.setItem('risingcode_dismissed', JSON.stringify([...dismissed].slice(-50))); } catch (e) {} } slide = 0; slideDir = 0; } }
    const a = showing()[0];
    if (!a) { bannerBox = null; return; }
    const fs = Math.max(13, Math.min(22, Math.round(Math.min(W, H) / 34)));
    const x = 16 + slide, y = 40, w = W - 32, h = fs * 3.1;
    bannerBox = { x: 16, y, w, h };
    const pulse = 0.85 + 0.15 * Math.sin(t / 15);
    ctx.save();
    ctx.globalAlpha = 1 - Math.min(0.9, Math.abs(slide) / W);
    ctx.fillStyle = `rgba(200,24,36,${pulse})`; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, fs * 0.5); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    // A warning triangle with an exclamation mark, so it reads as an alert by shape too.
    const tx = x + fs * 1.4, ty = y + h / 2, tr = fs * 0.95;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(tx, ty - tr); ctx.lineTo(tx + tr * 1.05, ty + tr * 0.8); ctx.lineTo(tx - tr * 1.05, ty + tr * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgb(200,24,36)'; ctx.fillRect(tx - tr * 0.09, ty - tr * 0.45, tr * 0.18, tr * 0.7); ctx.fillRect(tx - tr * 0.09, ty + tr * 0.38, tr * 0.18, tr * 0.18);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${fs}px ui-monospace, Menlo, monospace`;
    const more = showing().length > 1 ? `  +${showing().length - 1} MORE` : '';
    ctx.fillText((a.event || 'WEATHER ALERT').toUpperCase() + more, x + fs * 3, y + fs * 0.45);
    ctx.font = `500 ${Math.round(fs * 0.72)}px ui-monospace, Menlo, monospace`;
    ctx.fillText([endsText(a.ends), 'TAP FOR DETAILS', 'SWIPE TO DISMISS'].filter(Boolean).join(' · '), x + fs * 3, y + fs * 1.75);
    ctx.restore();
  }
  // The details page (a first version; to be designed next): the whole alert, and a
  // tap anywhere closes it.
  function wrap(text, maxW) {
    const out = [];
    for (const para of String(text).split(/\n\s*\n/)) {
      let line = '';
      for (const word of para.replace(/\s+/g, ' ').trim().split(' ')) {
        const tryLine = line ? line + ' ' + word : word;
        if (ctx.measureText(tryLine).width > maxW && line) { out.push(line); line = word; } else line = tryLine;
      }
      if (line) out.push(line);
      out.push('');
    }
    return out;
  }
  function detailPage() {
    const a = detail; if (!a) return;
    const fs = Math.max(13, Math.min(20, Math.round(Math.min(W, H) / 40)));
    ctx.save();
    ctx.fillStyle = 'rgba(6,9,14,0.985)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgb(200,24,36)'; ctx.fillRect(0, 0, W, fs * 0.5);
    const x = Math.max(24, W * 0.08), maxW = W - x * 2;
    let y = fs * 2;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(fs * 1.4)}px ui-monospace, Menlo, monospace`;
    ctx.fillText((a.event || '').toUpperCase(), x, y); y += fs * 2.2;
    ctx.fillStyle = '#ffb3b8'; ctx.font = `600 ${fs}px ui-monospace, Menlo, monospace`;
    ctx.fillText([a.severity ? a.severity.toUpperCase() : '', endsText(a.ends)].filter(Boolean).join(' · '), x, y); y += fs * 2;
    ctx.fillStyle = '#e6edf3'; ctx.font = `500 ${fs}px ui-monospace, Menlo, monospace`;
    const lines = wrap(a.headline, maxW).concat(wrap(a.description, maxW), a.instruction ? wrap('WHAT TO DO: ' + a.instruction, maxW) : []);
    const room = Math.floor((H - y - fs * 3) / (fs * 1.4));
    lines.slice(0, room).forEach((l, i) => ctx.fillText(l, x, y + i * fs * 1.4));
    ctx.fillStyle = '#9fb0c0'; ctx.font = `500 ${Math.round(fs * 0.8)}px ui-monospace, Menlo, monospace`;
    ctx.fillText((lines.length > room ? 'MORE AT WEATHER.GOV · ' : '') + 'NOAA · TAP TO CLOSE', x, H - fs * 2);
    ctx.restore();
  }
  function panel() {
    panelA += ((panelOpen ? 1 : 0) - panelA) * 0.15;
    if (panelA < 0.02) return;
    const fs = Math.max(12, Math.min(20, Math.round(Math.min(W, H) / 38)));
    const x = W * 0.04, w = Math.min(W * 0.4, house.x - W * 0.07, fs * 19);
    const lineH = fs * 1.45, blockH = lineH * 3 + fs * 0.6, pad = fs * 0.8;
    const h = pad * 2 + fs * 1.2 + Math.max(1, days.length) * blockH;
    const y = Math.max(H * 0.29, Math.min(H * 0.32, groundY(x) - h - H * 0.03));
    ctx.save(); ctx.globalAlpha = panelA;
    ctx.fillStyle = 'rgba(8,12,18,0.78)'; ctx.strokeStyle = 'rgba(230,238,246,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, fs * 0.6); else ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#9fb0c0'; ctx.font = `600 ${Math.round(fs * 0.75)}px ui-monospace, Menlo, monospace`;
    ctx.fillText('NOAA · CENTRE HALL · 3 DAYS', x + pad, y + pad);
    if (!days.length) { ctx.fillStyle = '#eef3f8'; ctx.font = `500 ${fs}px ui-monospace, Menlo, monospace`; ctx.fillText(wx.status === 'offline' ? 'Forecast unavailable' : 'Loading…', x + pad, y + pad + fs * 1.6); }
    const fit = (text, max) => { let s2 = text; while (s2.length > 3 && ctx.measureText(s2).width > max) s2 = s2.slice(0, -2); return s2 === text ? s2 : s2.trim() + '…'; };
    days.forEach((d, i) => {
      const by = y + pad + fs * 1.2 + i * blockH + fs * 0.4;
      if (i) { ctx.fillStyle = 'rgba(230,238,246,0.15)'; ctx.fillRect(x + pad, by - fs * 0.35, w - pad * 2, 1); }
      ctx.fillStyle = '#ffffff'; ctx.font = `700 ${fs}px ui-monospace, Menlo, monospace`;
      ctx.fillText(d.name, x + pad, by);
      ctx.fillStyle = '#dfe8f1'; ctx.font = `500 ${Math.round(fs * 0.9)}px ui-monospace, Menlo, monospace`;
      ctx.fillText(fit(d.words || '', w - pad * 2 - fs * 2.8), x + pad, by + lineH);
      icon(readWords(d.words), d.hi === null, x + w - pad - fs * 1.2, by + fs * 1.15, fs * 1.15);
      const temps = [d.hi !== null ? `HIGH ${d.hi}°` : '', d.lo !== null ? `LOW ${d.lo}°` : ''].filter(Boolean).join('  ');
      ctx.fillStyle = '#ffffff'; ctx.font = `600 ${Math.round(fs * 0.9)}px ui-monospace, Menlo, monospace`;
      ctx.fillText(fit(temps + (d.pop ? `  ·  ${d.pop}% PRECIP` : ''), w - pad * 2), x + pad, by + lineH * 2);
    });
    ctx.restore();
  }

  window.WinterScene = {
    moonPhaseName: () => moonPhaseName(),
    drawMoon(c, cx, cy, R, age) { const keep = ctx; ctx = c; moon(cx, cy, R, '#e8eef6', age); ctx = keep; },   // for checking the phases
    // The forecast-box weather icon, shared with the weather station page (V40).
    icon(words, night, cx, cy, r, c) { const keep = ctx; ctx = c || ctx; icon(readWords(words), night, cx, cy, r); ctx = keep; },
    // A tap: closes the details page if it's open; opens it if the tap is on the alert
    // banner; otherwise opens or closes the three-day forecast.
    tap(x, y) {
      if (detail) { detail = null; return; }
      const b = bannerBox;
      if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { detail = showing()[0] || null; return; }
      panelOpen = !panelOpen;
    },
    // A sideways swipe that starts on the banner dismisses the alert instead of changing scene.
    swipeOnBanner(x, y, dx) {
      const b = bannerBox;
      if (detail || !b || !(x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)) return false;
      slideDir = dx < 0 ? -1 : 1; return true;
    },
    start(context) { ctx = context; if (!this.started) { this.started = true; loadWeather(); setInterval(loadWeather, 20 * 60e3); /* every 20 minutes (V44), to keep up with what's falling */ loadAlerts(); setInterval(loadAlerts, 600e3); } },
    resize(w, h) { W = w; H = h; if (ctx) layout(); },
    draw() { if (!house) layout(); draw(); },
    debug: () => ({ deepest: Math.max(...depth), roof: Math.max(...roofDepth), cap: maxDepth(), flakes: flakes.length, drops: drops.length, cover, light, wx, days, panelOpen, alerts: showing().map(a => a.event), detail: !!detail }),
  };
})();
