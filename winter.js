// WINTER (Nov 24, 2026): a second scene for Rising Code. Swipe left on the
// Christmas display to get here, swipe right to go back (index.html handles the
// swipe). A landscape drawn in code: rolling hills, pine trees, and a house with
// lit windows and a chimney whose smoke never stops.
//
// V26: THE SCENE MATCHES TODAY'S NOAA FORECAST for Happy Valley, PA (the National
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
// Preview without waiting for weather: add ?wx= with sunny, partly, cloudy, fog, drizzle-fog,
// rain, mix, snow-light, snow, snow-heavy or coming, and ?time=day or ?time=night.
(() => {
  // V66: the place comes from place.js (where this iPad is, or Happy Valley, PA); when it
  // changes, the forecast, alerts and daylight are fetched again for the new place.
  let LAT = window.Place ? Place.lat : 40.8473, LON = window.Place ? Place.lon : -77.6858;
  const placeName = () => (window.Place ? Place.name : 'HAPPY VALLEY');
  const RATE_MODERATE = 0.1, RATE_HEAVY = 0.5;   // snow, inches per hour
  const LOOKAHEAD_HRS = 48;                      // how far ahead upcoming snow is previewed
  const GATHER_HRS = 12;                         // clouds start gathering this long before it
  const FILL_MINUTES = 30;                       // time for a heavy snow to reach its full depth

  const q = location.search;
  const old = { light: 'snow-light', moderate: 'snow', heavy: 'snow-heavy', coming: 'coming', none: 'sunny' };
  const previewWx = (q.match(/[?&]wx=([\w-]+)/) || [])[1] || old[(q.match(/[?&]snow=(\w+)/) || [])[1]];
  const previewTime = (q.match(/[?&]time=(day|night)/) || [])[1];

  let ctx, W = 0, H = 0, t = 0;
  let flakes = [], drops = [], stars = [], smoke = [], trees = [], clouds = [], mists = [];
  let depth = null, roofDepth = null;            // snow height per 2-px column
  const COL = 2;
  let wx = { status: 'loading', day: isDayByClock(), sky: 'clear', fall: 'none', rate: 0, rain: 0, snowToday: false, todayTotal: 0, coming: null, words: '' };
  let cover = 0, fog = 0, light = 0;   // shown values, eased toward the weather (light is set from the sun on the first frame)
  // THREE-DAY FORECAST BOX (V27): a tap on the Winter scene opens a small box to the
  // left of the house with today and the next two days from NOAA: the day, the
  // forecast in words, the high and low, and the chance of rain or snow. Tap again
  // to close it. (Taps here make no sound; sounds belong to the Christmas display.)
  let days = [], panelOpen = false, panelA = 0;

  // DAWN AND DUSK (V46): daylight follows the real sunrise and sunset for Happy Valley, worked
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
    // V66: keep it on this calendar day. West of about Chicago the sunset falls after midnight
    // UTC, and without this it came out as yesterday's sunset.
    let r = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + UT * 3600e3;
    const noon = +new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    while (r - noon > 12 * 3600e3) r -= 864e5;
    while (noon - r > 12 * 3600e3) r += 864e5;
    return new Date(r);
  }
  // V153: today's sunrise and sunset, worked out once a day (the hunt in homestead.js keeps to legal hours).
  let sunDay = '', sunPair = null;
  function sunToday(now = new Date()) {
    const k = now.toDateString(); if (k !== sunDay) { sunDay = k; sunPair = { rise: +sunAt(true, now), set: +sunAt(false, now) }; }
    return sunPair;
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
      // V59: "Mostly Clear" and "Mostly Sunny" draw as clear, no clouds: when the words say
      // clear, the picture shows clear. Only "Partly" draws a few clouds.
      : /partly/.test(w) ? 'partly' : 'clear';
    const chance = /chance|slight|isolated|scattered/.test(w);
    return { fall, sky, chance };
  }
  function setPreview() {
    const day = previewTime ? previewTime === 'day' : isDayByClock();
    // NOAA-style words for each preview, so the forecast box and its icons read like the real thing.
    const words = { sunny: 'Sunny', partly: 'Partly Sunny', cloudy: 'Cloudy', fog: 'Patchy Fog', 'drizzle-fog': 'Light Drizzle and Fog/Mist', rain: 'Rain Showers', mix: 'Rain And Snow', 'snow-light': 'Chance Snow Showers', snow: 'Snow', 'snow-heavy': 'Heavy Snow', coming: 'Mostly Sunny' }[previewWx] || 'Sunny';
    const base = { status: 'preview', day, sky: 'clear', fall: 'none', rate: 0, rain: 0, snowToday: false, todayTotal: 0, coming: null, words };
    const p = {
      sunny: {}, partly: { sky: 'partly' }, cloudy: { sky: 'cloudy' }, fog: { sky: 'fog', fog: true },
      'drizzle-fog': { sky: 'cloudy', fall: 'rain', rain: 0.03, fog: true },
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
    const at = LAT + ',' + LON, stale = () => at !== LAT + ',' + LON;   // V66: drop a reply for a place we've since left
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
      try { const now = window.WxNow && await WxNow.latest(pt.properties.observationStations); if (now) { observed = now.words; if (!stale()) windObs = windFrom(now.o); } }
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
      if (stale()) return;
      // V147: ground fog when the words in use (the station's now, else the forecast) say fog or mist,
      // also with rain falling: "Light Drizzle and Fog/Mist" shows the drizzle and the fog.
      const fogNow = /fog|mist/i.test(observed || period.shortForecast || '');
      wx = { status: 'ok', day: !!period.isDaytime, sky, fall, fog: fogNow, rate, rain, snowToday: todayTotal > 0 || snowFalling, todayTotal, coming, words: observed ? 'Now: ' + observed : period.shortForecast, forecastWords: period.shortForecast };
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
      if (stale()) return;
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
      trees.push({ x, h: H * (0.12 + Math.random() * 0.1), seed: Math.random() });
    }
    // V147: slow banks of ground fog, drifting along the fields (only drawn when NOAA says fog or mist)
    mists = Array.from({ length: 8 }, () => ({ x: Math.random() * W * 1.4 - W * 0.2, y: H * (0.68 + Math.random() * 0.2), r: W * (0.18 + Math.random() * 0.16), v: (0.04 + Math.random() * 0.08) * (W / 1000), a: 0.35 + Math.random() * 0.35 }));
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
    // V75: the moon's darker "seas", faint gray patches on the lit part, so even a full moon
    // reads as the moon and not a plain disc (William saw tonight's full moon as a sun).
    ctx.save(); ctx.clip();
    ctx.globalAlpha *= 0.28; ctx.fillStyle = '#5d6673';
    for (const [dx, dy, q] of [[-0.28, -0.22, 0.3], [0.18, -0.3, 0.2], [0.05, 0.12, 0.26], [-0.32, 0.3, 0.16], [0.36, 0.22, 0.14]]) {
      ctx.beginPath(); ctx.arc(cx + dx * R, cy + dy * R, q * R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
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
    // THE SUN AND MOON WHERE THEY REALLY ARE (V68): skypath.js works out each one's place in
    // the sky for this iPad's location right now. The scene looks south: east is the left edge,
    // west the right, the horizon is the hills, and higher in the sky is higher on the screen.
    // So the sun comes up on the left at sunrise, arcs across and sets on the right; the moon
    // does the same on its own schedule, and shows by day too, pale, when it's up. Both fade
    // behind cloud. Previews (?time=day or night) keep the old fixed spot, upper left.
    const br = Math.min(W, H) * 0.05, vis = Math.max(0, 1 - cover * 1.2), D = Math.PI / 180;
    const place = (p) => {
      const hz = H * 0.8, top = H * 0.07;
      const y = p.alt >= 0 ? hz - Math.pow(Math.sin(p.alt * D), 0.7) * (hz - top) : hz - p.alt * H * 0.012;
      return { x: W * (p.az - 45) / 270, y, alt: p.alt };
    };
    let bodies;
    if (window.SkyPath && !previewTime) {
      const now = Date.now(), s = SkyPath.sun(now, LAT, LON), m = SkyPath.moon(now, LAT, LON);
      bodies = [];
      if (m.alt > -3) bodies.push(Object.assign({ kind: 'moon' }, place(m)));
      if (s.alt > -3) bodies.push(Object.assign({ kind: 'sun' }, place(s)));
    } else bodies = [{ kind: light > 0.5 ? 'sun' : 'moon', x: W * 0.2, y: H * 0.17, alt: 45 }];
    if (vis > 0.02) for (const b of bodies) {
      const isSun = b.kind === 'sun', low = Math.max(0, Math.min(1, b.alt / 10));   // low = 0 at the horizon
      ctx.globalAlpha = vis * (isSun ? 1 : 0.45 + 0.55 * (1 - light));            // a daytime moon is pale
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, br * (isSun ? 4 : 2.5));
      glow.addColorStop(0, isSun ? (low < 1 ? `rgba(255,${190 + 50 * low | 0},${140 + 60 * low | 0},0.9)` : 'rgba(255,240,200,0.9)') : 'rgba(220,230,245,0.35)');
      glow.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(b.x, b.y, br * 4, 0, 6.3); ctx.fill();
      if (isSun) { ctx.fillStyle = low < 1 ? `rgb(255,${200 + 46 * low | 0},${150 + 66 * low | 0})` : '#fff6d8'; ctx.beginPath(); ctx.arc(b.x, b.y, br, 0, 6.3); ctx.fill(); }
      else moon(b.x, b.y, br * 0.8, '#e8eef6');                                    // tonight's real phase
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
      // Heavy overcast darkens the top of the sky. V147: a soft fade from the top edge down to
      // nothing, about a fifth of the way down. It used to be a solid strip 12% tall, which left
      // a hard grey line across the sky in rain (about 70 px down on a Chromebook).
      if (cover > 0.85) {
        const fade = ctx.createLinearGradient(0, 0, 0, H * 0.2);
        fade.addColorStop(0, col); fade.addColorStop(0.45, col + '99'); fade.addColorStop(1, col + '00');
        ctx.globalAlpha = (cover - 0.85) * 4; ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H * 0.2); ctx.globalAlpha = 1;
      }
    }
  }
  function land() {
    ctx.fillStyle = tone('#0b1320', '#55665a');                                         // far hills
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.68 + Math.sin(x / W * 3.1 + 2) * H * 0.04);
    ctx.lineTo(W, H); ctx.fill();
    for (const tr of trees) {
      const b = groundY(tr.x) + H * 0.01, w = tr.h * 0.42;
      // V142: in a strong wind the top bends most, the low branches hardly at all (0 when calm).
      const lean = Sway.treeAt(tr.x, tr.seed || 0) * tr.h * 0.055, bend = (y) => lean * ((b - y) / tr.h) ** 2;
      ctx.fillStyle = tone('#0a1a14', '#1f3a2c');
      for (let k = 0; k < 3; k++) {
        const top = b - tr.h + k * tr.h * 0.22, bot = b - tr.h * 0.1 - (2 - k) * tr.h * 0.18, db = bend(bot);
        ctx.beginPath(); ctx.moveTo(tr.x + bend(top), top); ctx.lineTo(tr.x - w * (0.55 + k * 0.22) + db, bot); ctx.lineTo(tr.x + w * (0.55 + k * 0.22) + db, bot); ctx.fill();
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
  // V121: the lamps are back to full brightness, with more life: each flame wanders on its own
  // (between about 85% and full), now and then a draft makes it flutter for a second or two, and
  // on a windy day the drafts come more often. Noticeable if you watch, easy to miss at a glance.
  const lamps = [0, 1].map(() => ({ v: 0.95, to: 0.95, next: 0, flutter: 0, draft: 0 }));
  function flame(i) {
    const L = lamps[i], windy = windyNow();
    if (t >= L.draft) {                                                               // a draft: every 10-30 s, more often in wind
      L.flutter = t + 30 + Math.random() * 40;
      L.draft = t + (windy ? 120 : 300) + Math.random() * (windy ? 300 : 600);
    }
    if (t >= L.next) {
      if (t < L.flutter) { L.to = 0.8 + Math.random() * 0.16; L.next = t + 2 + Math.random() * 4; }   // quick flicker in the draft
      else { L.to = 0.88 + Math.random() * 0.12; L.next = t + 12 + Math.random() * 40; }               // a slow wander otherwise
    }
    L.v += (L.to - L.v) * (t < L.flutter ? 0.3 : 0.07);
    return L.v;
  }
  // V118: windy today? A wind alert of any kind, or wind in today's forecast words. (The farm won't
  // harvest in it.)
  function windyNow() { return alerts.some(a => /wind/i.test(a.event || '')) || (days[0] && /wind|breez|gust/i.test(days[0].words || '')); }
  // V140: THE SMOKE FOLLOWS A STRONG WIND (William: at about 25 mph it should go the way the wind
  // is blowing). The wind is the nearest NOAA station's latest reading: its speed, and the compass
  // direction it blows FROM. Under 15 mph the smoke is exactly the old smoke. From 15 to 25 mph it
  // eases over, and from 25 mph up it streams downwind, a little lower and a little faster the
  // harder it blows (capped at 40 mph so it never gets frantic). Same puffs, same size, same fade:
  // only where they drift changes. No reading, a reading over 3 hours old, or no direction: the
  // old smoke. Nothing is made up from forecast words.
  // The scene looks south (skypath.js: the sun rises on the left, sets on the right), so east is
  // left and west is right. Wind FROM the west travels east: the smoke goes left. Screen drift is
  // sin(direction it's from): west (270) gives -1 (left), east (90) gives +1 (right), and a north
  // or south wind (toward or away from us) barely moves it sideways.
  // Preview: ?wind (a 30 mph west wind), or ?wind=E, ?wind=NW,25, ?wind=90,35. Preview only; normal
  // use never looks at it.
  let windObs = null;
  function windFrom(o) {
    const sp = o && o.windSpeed, dr = o && o.windDirection;
    if (!sp || typeof sp.value !== 'number') return null;
    const toMph = (v) => /m_s-1/.test(v.unitCode || '') ? v.value * 2.237 : v.value * 0.6214;   // NOAA gives km/h
    const mph = toMph(sp), gs = o.windGust;
    const gust = gs && typeof gs.value === 'number' ? toMph(gs) : null;              // V142: the gusts too (often blank in a calm)
    const age = Date.now() - Date.parse(o.timestamp);
    return { mph, gust, dir: dr && typeof dr.value === 'number' ? dr.value : null, at: isFinite(age) ? Date.now() - age : Date.now() };
  }
  const COMPASS = { N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5 };
  const windPreview = (() => {
    const m = q.match(/[?&]wind(?:=([\w.]+)(?:,([\d.]+)(?:,([\d.]+))?)?)?(?:&|$)/);
    if (!m) return null;
    const d = (m[1] || 'W').toUpperCase(), dir = d in COMPASS ? COMPASS[d] : isFinite(+d) ? +d % 360 : 270;
    return { mph: m[2] ? +m[2] : 30, gust: m[3] ? +m[3] : null, dir, at: Date.now(), preview: true };   // V142: ?wind=W,30,50 adds 50 mph gusts
  })();
  function windNow() {
    if (windPreview) return windPreview;
    if (windObs && windObs.dir !== null && Date.now() - windObs.at < 3 * 3600e3) return windObs;
    return null;
  }
  let smokeWind = 0, smokeLean = 0;            // eased toward their targets so a new reading never jolts the plume
  // V142: THE TREES AND THE CORN IN A STRONG WIND (William: the tops of the trees moving from about
  // 25 mph sustained, more for gusts of 35 up to 60; the corn moving a little from about 35 mph,
  // "the same way that the smoke does"). Same reading as the smoke (windNow above): no reading,
  // a stale one, or no direction, and nothing moves. Calm, nothing moves either: the trees and the
  // corn are drawn exactly as before.
  //   trees   a gentle sway at the top from 25 mph sustained, a little more up to 50
  //   corn    leans and sways a little from about 32 mph sustained, more up to 60
  //   gusts   a reading with gusts of 32 mph or more sends a gust across the scene now and then
  //           (every 4 to 15 seconds, more often the stronger they are), entering on the side
  //           the wind comes from: it bends the tree tops and the standing corn further, then
  //           lets them come back over a few seconds. Up to full strength at 60 mph.
  // Everything bends downwind, the same way as the smoke: west wind to the left, east wind to the
  // right. A north or south wind blows toward or away from us, so it bends nothing sideways; the
  // sway alone shows it, a little smaller. Strengths ease over about four seconds, so a new
  // reading never jumps. Preview: ?wind=W,30 (30 mph), ?wind=W,30,50 (with 50 mph gusts).
  const ramp01 = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
  function swayTargets(w) {
    if (!w) return { tree: 0, corn: 0, gust: 0, side: 0 };
    const mph = w.mph, gust = Math.max(w.gust || 0, mph);
    return {
      tree: mph < 22 ? 0 : 0.4 * ramp01(mph, 22, 25) + 0.6 * ramp01(mph, 25, 50),   // a little at 25, more to 50
      corn: ramp01(mph, 32, 60),
      gust: ramp01(gust, 32, 60),
      side: Math.sin(w.dir * Math.PI / 180),                                        // +1 east wind (moves right), -1 west
    };
  }
  const Sway = {
    active: false, tree: 0, corn: 0, gust: 0, side: 0, gusts: [], next: 0, last: 0, s: 0,
    update(nowMs) {
      const g = swayTargets(windNow()), dt = this.last ? Math.min(0.25, Math.max(0, (nowMs - this.last) / 1000)) : 0;
      this.last = nowMs; this.s = nowMs / 1000;
      const e = 1 - Math.exp(-dt / 4);
      for (const k of ['tree', 'corn', 'gust', 'side']) { this[k] += (g[k] - this[k]) * e; if (g[k] === 0 && Math.abs(this[k]) < 1e-3) this[k] = 0; }
      if (g.gust > 0 && nowMs >= this.next) {
        if (this.next) this.gusts.push({ at: this.s, k: g.gust * (0.55 + Math.random() * 0.45) });
        this.next = nowMs + (4 + (1 - g.gust) * 5 + Math.random() * 6) * 1000;
      }
      if (g.gust === 0) this.next = 0;
      this.gusts = this.gusts.filter(q => this.s - q.at < 16);
      this.active = this.tree > 0 || this.corn > 0 || (this.gust > 0 && this.gusts.length > 0);
    },
    // How hard a gust is pushing at x right now, 0 to 1. Each gust crosses the screen downwind in
    // about two and a half seconds, rises over a second, and dies away over a few.
    gustAt(x) {
      let sum = 0;
      const a = Math.abs(this.side), from = this.side < 0 ? (W - x) / W : x / W;
      for (const q of this.gusts) {
        const tau = this.s - q.at - from * 2.5 * a;
        if (tau <= 0) continue;
        sum += q.k * (tau < 1.2 ? Math.sin(Math.PI / 2 * tau / 1.2) ** 2 : Math.exp(-(tau - 1.2) / 2.2));
      }
      return Math.min(1, sum) * this.gust;
    },
    // A tree top's sideways bend, in units of about 5.5% of the tree's height (seed: 0..1 per tree).
    treeAt(x, seed) {
      if (!this.active) return 0;
      const gu = this.gustAt(x), f = 0.22 + seed * 0.1, ph = seed * 6.28;
      const wob = Math.sin(this.s * 6.28 * f + ph) * 0.65 + Math.sin(this.s * 6.28 * f * 2.3 + ph * 1.7) * 0.35;
      const across = 0.45 + 0.55 * Math.abs(this.side);
      return this.side * (0.5 * this.tree + 1.0 * gu) + wob * (0.4 * this.tree + 0.45 * gu) * across;
    },
    // The standing corn's lean at x: how far the top moves sideways for each pixel of height.
    cornAt(x) {
      if (!this.active) return 0;
      const gu = this.gustAt(x);
      const dirn = this.side < 0 ? -1 : 1, wave = Math.sin(this.s * 6.28 * 0.4 - dirn * x / Math.max(1, W * 0.14));
      const across = 0.45 + 0.55 * Math.abs(this.side);
      return this.side * (0.09 * this.corn + 0.07 * gu) + wave * (0.03 * this.corn + 0.025 * gu) * across;
    },
  };
  function drawHouse() {
    const { x, w, h, top, peak, eave, chimney: ch } = house;
    ctx.fillStyle = tone('#222c3a', '#7a5f4c'); ctx.fillRect(x, top, w, h);             // walls
    ctx.fillStyle = tone('#121822', '#3a3d45');                                          // roof
    ctx.beginPath(); ctx.moveTo(x - eave, top); ctx.lineTo(x + w / 2, peak); ctx.lineTo(x + w + eave, top); ctx.fill();
    ctx.fillStyle = tone('#2b3646', '#6e4a3a'); ctx.fillRect(ch.x, ch.top, ch.w, roofY(ch.x + ch.w) - ch.top + 2);   // chimney
    ctx.fillStyle = tone('#3a4657', '#82604e'); ctx.fillRect(ch.x - 2, ch.top - 3, ch.w + 4, 4);
    // V111: an oil lamp in each window, each with its own flame. The flicker is an Easter egg:
    // a slow, small wander (a few percent), and now and then a brief dip when the flame gutters,
    // so a glance shows two steady lit windows and only a long look shows they're alive.
    const win = (wx0, wy, ww, wh, i) => {
      const lit = (1 - light) * flame(i);   // V45: by day the lights are off: dark glass; at night they glow
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
    win(x + w * 0.12, top + h * 0.25, w * 0.18, h * 0.3, 0);
    win(x + w * 0.7, top + h * 0.25, w * 0.18, h * 0.3, 1);
    ctx.fillStyle = tone('#3a2a1e', '#4a2f22'); ctx.fillRect(x + w * 0.43, top + h * 0.38, w * 0.14, h * 0.62);   // door
    { // V122: a plank door with a heavy beam across the middle and a big black knob
      const dx = x + w * 0.43, dy = top + h * 0.38, dw = w * 0.14, dh = h * 0.62;
      ctx.strokeStyle = tone('#2a1e15', '#36231a'); ctx.lineWidth = Math.max(1, dw * 0.025);
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(dx + dw * k / 4, dy + 1); ctx.lineTo(dx + dw * k / 4, dy + dh); ctx.stroke(); }   // planks
      ctx.fillStyle = tone('#2e2117', '#3c271c'); ctx.fillRect(dx - dw * 0.04, dy + dh * 0.44, dw * 1.08, dh * 0.1);   // the beam
      ctx.fillStyle = tone('#3d2c20', '#5a3a28'); ctx.fillRect(dx - dw * 0.04, dy + dh * 0.44, dw * 1.08, dh * 0.018);  // its top edge catching light
      const kx = dx + dw * 0.8, ky = dy + dh * 0.62, kr = Math.max(2.5, dw * 0.11);
      ctx.fillStyle = '#0e0e10'; ctx.beginPath(); ctx.arc(kx, ky, kr, 0, 6.3); ctx.fill();                               // the knob
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(kx - kr * 0.3, ky - kr * 0.3, kr * 0.35, 0, 6.3); ctx.fill();
    }
    // Chimney smoke, always: soft puffs that rise, spread and drift, whatever the weather.
    if (t % 6 === 0) smoke.push({ x: ch.x + ch.w / 2, y: ch.top - 4, r: ch.w * 0.5, a: 0.24 });
    { // V140: blend the old drift into the wind's drift (see windNow above)
      const w = windNow(), mph = w ? Math.min(w.mph, 40) : 0;
      const kT = w ? Math.max(0, Math.min(1, (mph - 15) / 10)) : 0;                  // 0 under 15 mph, 1 at 25 mph and up
      const leanT = w ? Math.sin(w.dir * Math.PI / 180) * (0.5 + 0.025 * Math.max(0, mph - 25)) : 0;   // px per frame, 0.5 at 25 mph, 0.875 at 40
      smokeWind += (kT - smokeWind) * 0.01; smokeLean += (leanT - smokeLean) * 0.01;
      const k = smokeWind, calm = 0.25 + (wx.fall !== 'none' ? 0.2 : 0);           // the old drift (rain or snow nudges it), used only in calm
      for (const s of smoke) { s.y -= 0.45 * (1 - 0.3 * k); s.x += calm * (1 - k) + smokeLean * k + Math.sin((t + s.y) / 30) * 0.15; s.r += 0.12; s.a *= 0.992; }
    }
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
  // GROUND FOG (V147): fog lies low, along the fields and around the house and trees, and thins
  // upward into clear air. No edges: a soft band that fades in from nothing above the hills,
  // thickest over the fields, plus a few wide wisps drifting slowly to the right. Only when
  // NOAA's words say fog or mist (wx.fog); it eases in and out over a few seconds.
  function fogLayer() {
    if (fog < 0.02) return;
    const c = tone('#3a4450', '#d8dde2'), top = H * 0.5;
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, c + '00'); g.addColorStop(0.3, c + '38'); g.addColorStop(0.55, c + 'a6');
    g.addColorStop(0.78, c + 'a6'); g.addColorStop(1, c + '73');
    ctx.globalAlpha = fog * 0.6; ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
    for (const m of mists) {
      m.x += m.v; if (m.x - m.r > W) m.x = -m.r;
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.16);
      const w = ctx.createRadialGradient(0, 0, 0, 0, 0, m.r);
      w.addColorStop(0, c + 'cc'); w.addColorStop(0.5, c + '55'); w.addColorStop(1, c + '00');
      ctx.globalAlpha = fog * m.a * 0.5; ctx.fillStyle = w; ctx.beginPath(); ctx.arc(0, 0, m.r, 0, 6.3); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  // V147: the NOAA words line that sat at the top left of Home ("NOAA · CENTRE HALL · NOW: ...") is
  // gone, on every device: the scene itself shows the weather. The words are still read and still
  // drive the sky, the rain, the snow and the fog, and the Weather Station and the forecast box
  // still show them.

  // ---- the frame -------------------------------------------------------------
  function wildEnv() {
    const now = new Date(), near = (d) => Math.abs(now - d) < 90 * 60e3;
    return { W, H, t, now, light, cover, fall: wx.fall || 'none', rate: Math.max(wx.rate || 0, (wx.rain || 0) * 4),
      dawnDusk: !previewTime && (near(sunAt(true, now)) || near(sunAt(false, now))),
      surfaceY: (x) => groundY(x) - (depth[Math.max(0, Math.min(depth.length - 1, Math.round(x / COL)))] || 0),
      house, houseH: house.h };
  }
  function draw() {
    t++;
    const first = t < 3;
    const ease = (cur, want, k) => cur + (want - cur) * (first ? 1 : k);
    cover = ease(cover, targetCover(), 0.01);
    fog = ease(fog, wx.fog ? 1 : 0, 0.01);
    light = ease(light, daylight(), 0.02);   // follows the real sun (V46)
    Sway.update(performance.now());          // V142: the trees and the corn in a strong wind
    // Ground: white while snow is in today's forecast (a light cover at least),
    // otherwise any snow melts slowly away to bare ground.
    if (wx.snowToday) { const floor = H * 0.008; for (let i = 0; i < depth.length; i++) if (depth[i] < floor) depth[i] = first ? floor : depth[i] + 0.02; }
    else { for (let i = 0; i < depth.length; i++) depth[i] = Math.max(0, depth[i] - (first ? 99 : 0.02)); for (let i = 0; i < roofDepth.length; i++) roofDepth[i] = Math.max(0, roofDepth[i] - (first ? 99 : 0.02)); }
    // V77: life around the house (wildlife.js): birds, geese and jets in the sky, behind the
    // trees; deer, a stray dog, a bear at the trash can in the yard, in front of the house.
    const life = window.Wildlife ? wildEnv() : null;
    // V78: the homestead (homestead.js): solar array, well and paddock behind the house line,
    // and the person who lives here in front of it.
    const home = window.Homestead ? { W, H, t, now: new Date(), sun: sunToday(), light, fall: wx.fall || 'none', rate: Math.max(wx.rate || 0, (wx.rain || 0) * 4), groundY, house, windy: windyNow(), ready: alertsChecked, sway: Sway } : null;
    sky(); if (life) Wildlife.sky(ctx, life); land(); if (home && window.Farm) Farm.back(ctx, home); if (home) Homestead.back(ctx, home); drawHouse(); snowLayers(); if (home) Homestead.front(ctx, home); if (life) Wildlife.ground(ctx, life); precipitation(); fogLayer();
    if (t % 3 === 0) for (const arr of [depth, roofDepth]) for (let i = 1; i < arr.length - 1; i++) {
      if (arr === roofDepth && roofY(i * COL) === null) continue;
      arr[i] += ((arr[i - 1] + arr[i + 1]) / 2 - arr[i]) * 0.05;
    }
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

  // WEATHER ALERTS (V29): NOAA's active alerts for Happy Valley (api.weather.gov/alerts),
  // checked every 10 minutes. When there is one, a red banner shows across the top:
  // the alert's name and when it ends. Tap the banner for the details page; swipe it
  // sideways to dismiss it. A dismissed alert stays away on this device; a new or
  // updated one shows again. Several at once: the most severe first, with a count.
  // Preview with ?alert on the address.
  const SEV = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
  let alerts = [], dismissed = new Set(), detail = null, bannerBox = null, closeBox = null, slide = 0, slideDir = 0, dragging = false;
  try { dismissed = new Set(JSON.parse(localStorage.getItem('risingcode_dismissed') || '[]').filter(id => String(id).indexOf('preview') !== 0)); } catch (e) {}
  // V144: putting an alert away: it stays away on this device until NOAA sends a new or updated
  // one (each update has an id of its own). The ?alert preview is only put away until a reload,
  // so the preview keeps working.
  function dismiss(a) {
    if (!a) return;
    dismissed.add(a.id);
    if (String(a.id).indexOf('preview') === 0) return;
    try { localStorage.setItem('risingcode_dismissed', JSON.stringify(Array.from(dismissed).slice(-50))); } catch (e) {}
  }
  let alertsChecked = false;                     // V118: the farm waits to know about wind before counting work time
  async function loadAlerts() {
    if (/[?&]alert\b/.test(q)) {
      const until = new Date(Date.now() + 30 * 3600e3).toISOString();
      alerts = [{ id: 'preview-alert', event: 'Winter Storm Warning', severity: 'Severe', ends: until,
        headline: 'Winter Storm Warning issued for your county (preview)',
        description: 'Heavy snow expected. Total snow accumulations of 8 to 12 inches. Winds gusting as high as 35 mph. (This is a preview, not a real alert.)',
        instruction: 'If you must travel, keep an extra flashlight, food, and water in your vehicle in case of an emergency.' }];
      // V143: ?alert=long previews a long alert, the kind that has to scroll on a phone.
      if (/[?&]alert=long\b/.test(q)) Object.assign(alerts[0], { event: 'Severe Thunderstorm Warning',
        description: Array.from({ length: 6 }, (_, i) => `Paragraph ${i + 1} of 6. At 4:15 PM EST, a line of strong storms was located along a line from Bellefonte to Spring Mills, moving east at 40 mph. Hazards include 60 mph wind gusts and quarter size hail. Damage to roofs, siding, trees and power lines is possible.`).join('\n\n') + ' (This is a preview, not a real alert.)' });
      alertsChecked = true; return;
    }
    try {
      const at = LAT + ',' + LON;
      const r = await (await fetch(`https://api.weather.gov/alerts/active?point=${LAT},${LON}`)).json();
      if (at !== LAT + ',' + LON) return;
      alerts = (r.features || []).map(f => f.properties).map(p => ({
        id: p.id, event: p.event, severity: p.severity, ends: p.ends || p.expires,
        headline: p.headline || p.event, description: p.description || '', instruction: p.instruction || '',
      })).sort((a, b) => (SEV[b.severity] || 0) - (SEV[a.severity] || 0));
      if (window.AlertChime) AlertChime.check(alerts.filter(a => !dismissed.has(a.id)));   // V103: a chime for a new alert
    } catch (e) { /* keep the last list */ }
    alertsChecked = true;
  }
  const showing = () => alerts.filter(a => !dismissed.has(a.id));
  // V141: a phone (the one-line banner) and the height of its status bar / notch / Dynamic Island.
  // The page is drawn under the status bar (black-translucent), so anything near the top has to
  // start below it. 0 in Safari's own window, on an iPad's layout, and on a Chromebook.
  const isPhone = () => W < 700;
  let safeProbe = null;
  function safeTop() {
    try {
      if (!safeProbe) {
        safeProbe = document.createElement('div');
        safeProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top, 0px);visibility:hidden;pointer-events:none';
        document.body.appendChild(safeProbe);
      }
      return safeProbe.offsetHeight || 0;
    } catch (e) { return 0; }
  }
  // V141: the phone banner's touch area reaches a little past its edges, so it's easy to catch.
  const onBanner = (x, y) => { const b = bannerBox, p = isPhone() ? 12 : 0;
    return !!b && x >= b.x - p && x <= b.x + b.w + p && y >= b.y - p && y <= b.y + b.h + p; };
  const endsText = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return 'UNTIL ' + d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase();
  };
  function banner() {
    const list = showing();
    if (!slideDir && !dragging && slide) { slide *= 0.7; if (Math.abs(slide) < 0.5) slide = 0; }   // V141: a short drag eases back
    if (slideDir) { slide += slideDir * W * 0.08; if (Math.abs(slide) > W) { dismiss(list[0]); slide = 0; slideDir = 0; } }
    const a = showing()[0];
    if (!a) { bannerBox = null; return; }
    if (W < 700) return phoneBanner(a);              // V130: a phone gets a small one-line tag
    const fs = Math.max(13, Math.min(22, Math.round(Math.min(W, H) / 34)));
    const x = 16 + slide, y = 16, w = W - 32,   // V147: up where the NOAA line was
    h = fs * 3.1;
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
    ctx.fillText([window.AlertChime && AlertChime.updated(a) ? 'UPDATED' : '', endsText(a.ends), 'TAP FOR DETAILS', 'SWIPE TO DISMISS'].filter(Boolean).join(' · '), x + fs * 3, y + fs * 1.75);
    ctx.restore();
  }
  // V130: on a phone the full banner covered too much. Just the alert's name and when it ends,
  // in one short line ("WIND ADVISORY · 7 PM"); tap it for everything else, swipe it away as before.
  // V141: on an iPhone it sat up under the clock and the notch (the app draws under the status bar),
  // over the NOAA line, and a swipe up there pulled down iOS's own Notification Center instead.
  // Now it sits below the status bar (V147: and, with the NOAA line gone, where that line was), a little taller, and follows the finger
  // when you slide it; let go past a short distance and it slides away.
  function phoneBanner(a) {
    const fs = 13, h = 34, y = safeTop() + 14;   // V147: the NOAA line above it is gone, so it moves up into its place
    let ends = '';
    if (a.ends) { const d = new Date(a.ends), today = d.toDateString() === new Date().toDateString();
      ends = d.toLocaleString(undefined, today ? { hour: 'numeric', minute: '2-digit' } : { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase().replace(':00', ''); }
    const more = showing().length > 1 ? ` +${showing().length - 1}` : '';
    const text = [(a.event || 'WEATHER ALERT').toUpperCase() + more, window.AlertChime && AlertChime.updated(a) ? 'UPDATED' : '', ends].filter(Boolean).join(' · ');
    ctx.save();
    ctx.font = `800 ${fs}px ui-monospace, Menlo, monospace`;
    const w = Math.min(W - 32, ctx.measureText(text).width + fs * 3.2), x = 16 + slide;
    bannerBox = { x: 16, y, w, h };
    ctx.globalAlpha = 1 - Math.min(0.9, Math.abs(slide) / W);
    ctx.fillStyle = `rgba(200,24,36,${0.85 + 0.15 * Math.sin(t / 15)})`; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    const tx = x + fs * 1.1, ty = y + h / 2, tr = fs * 0.55;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(tx, ty - tr); ctx.lineTo(tx + tr * 1.05, ty + tr * 0.8); ctx.lineTo(tx - tr * 1.05, ty + tr * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgb(200,24,36)'; ctx.fillRect(tx - tr * 0.1, ty - tr * 0.4, tr * 0.2, tr * 0.65); ctx.fillRect(tx - tr * 0.1, ty + tr * 0.4, tr * 0.2, tr * 0.2);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x + fs * 2.1, y + h / 2 + 1);
    ctx.restore();
  }
  // The details page: the whole alert. It stays open (even if you swipe to another screen and
  // come back) until you tap the ✕ in its top right corner (V104; before, any tap closed it).
  // V144: the ✕ closes the page and puts the alert away too (before, the banner stayed until it
  // was swiped away). It stays away until a new or updated alert comes in.
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
  // V143: on an iPhone the page sat too high: its ✕ was up under the clock and the notch, partly cut
  // off, and a long alert was simply cut short; a drag on it pulled down the menu instead. Now on a
  // phone the page starts below the status bar and notch, the long title wraps clear of the ✕, and the
  // alert's text scrolls inside the page (drag it, or the mouse wheel / arrow keys on a Chromebook),
  // fading softly at its top and bottom edges. While the page is open, a drag on it is only ever a
  // scroll: it never opens the menu or the radio and never changes screen. A short alert looks as before.
  let detailScroll = 0, detailVel = 0, detailMax = 0, detailTouching = false;
  let safeProbeB = null;
  function safeBottom() {
    try {
      if (!safeProbeB) {
        safeProbeB = document.createElement('div');
        safeProbeB.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-bottom, 0px);visibility:hidden;pointer-events:none';
        document.body.appendChild(safeProbeB);
      }
      return safeProbeB.offsetHeight || 0;
    } catch (e) { return 0; }
  }
  function detailPage() {
    const a = detail; if (!a) return;
    const fs = Math.max(13, Math.min(20, Math.round(Math.min(W, H) / 40)));
    const phone = isPhone(), top = phone ? safeTop() + 12 : 0, bottom = phone ? safeBottom() : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(6,9,14,0.985)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgb(200,24,36)'; ctx.fillRect(0, phone ? top - 4 : 0, W, fs * 0.5);
    const x = Math.max(24, W * 0.08), maxW = W - x * 2;
    const s = Math.max(48, fs * 3), bx = W - s - Math.max(16, W * 0.03), by = top + fs * 1.4;   // the ✕
    let y = top + fs * 2;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(fs * 1.4)}px ui-monospace, Menlo, monospace`;
    // The title keeps clear of the ✕: a long one wraps onto a second line.
    const title = wrap((a.event || '').toUpperCase(), bx - x - fs).filter(Boolean);
    title.forEach((l, i) => { ctx.fillText(l, x, y); y += i < title.length - 1 ? fs * 1.7 : fs * 2.2; });
    if (!title.length) y += fs * 2.2;
    ctx.fillStyle = '#ffb3b8'; ctx.font = `600 ${fs}px ui-monospace, Menlo, monospace`;
    ctx.fillText([a.severity ? a.severity.toUpperCase() : '', endsText(a.ends)].filter(Boolean).join(' · '), x, y); y += fs * 2;
    ctx.fillStyle = '#e6edf3'; ctx.font = `500 ${fs}px ui-monospace, Menlo, monospace`;
    const lines = wrap(a.headline, maxW).concat(wrap(a.description, maxW), a.instruction ? wrap('WHAT TO DO: ' + a.instruction, maxW) : []);
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    const lh = fs * 1.4, footY = H - bottom - fs * 4, boxTop = y, boxBot = footY - fs * 1.2;
    const textH = lines.length * lh;
    detailMax = Math.max(0, textH - (boxBot - boxTop));
    if (!detailTouching && detailVel) { detailScroll += detailVel; detailVel *= 0.92; if (Math.abs(detailVel) < 0.2) detailVel = 0; }
    if (detailScroll < 0 || detailScroll > detailMax) { detailScroll = Math.max(0, Math.min(detailMax, detailScroll)); detailVel = 0; }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, boxTop - 2, W, boxBot - boxTop + 2); ctx.clip();
    const first = Math.max(0, Math.floor(detailScroll / lh) - 1);
    for (let i = first; i < lines.length; i++) { const ly = boxTop + i * lh - detailScroll; if (ly > boxBot) break; ctx.fillText(lines[i], x, ly); }
    ctx.restore();
    if (detailMax > 0) {
      // Soft fades where text runs on past the edges, and a thin quiet bar showing where you are.
      const bg = 'rgba(6,9,14,', f = fs * 1.6;
      if (detailScroll > 1) { const g = ctx.createLinearGradient(0, boxTop - 2, 0, boxTop + f); g.addColorStop(0, bg + '1)'); g.addColorStop(1, bg + '0)'); ctx.fillStyle = g; ctx.fillRect(0, boxTop - 2, W, f + 2); }
      if (detailScroll < detailMax - 1) { const g = ctx.createLinearGradient(0, boxBot - f, 0, boxBot); g.addColorStop(0, bg + '0)'); g.addColorStop(1, bg + '1)'); ctx.fillStyle = g; ctx.fillRect(0, boxBot - f, W, f); }
      const trackH = boxBot - boxTop, barH = Math.max(fs * 2, trackH * (trackH / textH)), barY = boxTop + (trackH - barH) * (detailScroll / detailMax);
      ctx.fillStyle = 'rgba(230,238,246,0.22)';
      ctx.beginPath(); const bxx = W - Math.max(10, x * 0.4); if (ctx.roundRect) ctx.roundRect(bxx, barY, 3, barH, 1.5); else ctx.rect(bxx, barY, 3, barH); ctx.fill();
    }
    ctx.fillStyle = '#9fb0c0'; ctx.font = `500 ${Math.round(fs * 0.8)}px ui-monospace, Menlo, monospace`;
    ctx.fillText((detailMax > 0 ? 'SCROLL FOR MORE · ' : '') + 'NOAA · TAP ✕ TO CLOSE', x, footY);
    closeBox = { x: bx, y: by, w: s, h: s };
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, s, s, s * 0.2); else ctx.rect(bx, by, s, s); ctx.fill(); ctx.stroke();
    ctx.lineWidth = Math.max(3, s * 0.07); ctx.lineCap = 'round'; const m = s * 0.3;
    ctx.beginPath(); ctx.moveTo(bx + m, by + m); ctx.lineTo(bx + s - m, by + s - m); ctx.moveTo(bx + s - m, by + m); ctx.lineTo(bx + m, by + s - m); ctx.stroke();
    ctx.restore();
  }

  // V144: on William's 2016 iPad the ✕ did nothing. It's drawn on the canvas, so the only thing
  // that closed it was the browser's "click" caught at the page level, and an older iPad's Safari
  // doesn't always make a click out of a tap there: the canvas isn't marked as something you can
  // press, and a finger that wobbled more than 8 px counted as a scroll, whose click is thrown away.
  // Now a real (invisible) button sits over the ✕, a little bigger than it, and closes the page on
  // the touch itself, on a click, or on the mouse; the touch code also closes it when a tap starts
  // and ends on the ✕, even if the finger moved a little.
  const X_PAD = () => (closeBox ? Math.max(14, Math.round(closeBox.w * 0.3)) : 0);
  const onClose = (x, y) => { const c = closeBox, p = X_PAD();
    return !!(detail && c) && x >= c.x - p && x <= c.x + c.w + p && y >= c.y - p && y <= c.y + c.h + p; };
  function closeDetail() {
    const a = detail; if (!a) return false;
    detail = null; detailScroll = 0; detailVel = 0; detailTouching = false;
    dismiss(a);
    syncX(false);
    return true;
  }
  let xBtn = null, xKey = '';
  function syncX(on) {
    const c = on && detail ? closeBox : null, p = X_PAD();
    const key = c ? [c.x, c.y, c.w, p].map(Math.round).join(',') : '';
    if (key === xKey) return;
    xKey = key;
    if (!xBtn) {
      if (!c || !document.body) { xKey = ''; return; }
      xBtn = document.createElement('button');
      xBtn.type = 'button'; xBtn.id = 'alertx'; xBtn.setAttribute('aria-label', 'Close the alert');
      xBtn.style.cssText = 'position:fixed;z-index:3;display:none;margin:0;padding:0;border:0;border-radius:12px;background:transparent;'
        + '-webkit-appearance:none;appearance:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none';
      // The touch itself closes it, so it never waits on Safari to turn the tap into a click.
      // A drag that starts on it is a scroll of the alert's text, not a tap, so it doesn't close.
      let x0 = 0, y0 = 0;
      xBtn.addEventListener('touchstart', (e) => { const q2 = e.changedTouches[0]; x0 = q2.clientX; y0 = q2.clientY; }, { passive: true });
      xBtn.addEventListener('touchend', (e) => { const q2 = e.changedTouches[0]; if (Math.hypot(q2.clientX - x0, q2.clientY - y0) < 30) closeDetail(); }, { passive: true });
      xBtn.addEventListener('click', (e) => { e.stopPropagation(); closeDetail(); });
      document.body.appendChild(xBtn);
    }
    if (!c) { xBtn.style.display = 'none'; return; }
    xBtn.style.left = Math.round(c.x - p) + 'px'; xBtn.style.top = Math.round(c.y - p) + 'px';
    xBtn.style.width = Math.round(c.w + p * 2) + 'px'; xBtn.style.height = Math.round(c.h + p * 2) + 'px';
    xBtn.style.display = 'block';
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
    ctx.fillText(`NOAA · ${placeName()} · 3 DAYS`, x + pad, y + pad);
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
    // A tap: on the details page only its ✕ closes it; otherwise opens it if the tap is on the alert
    // banner; otherwise opens or closes the three-day forecast.
    tap(x, y) {
      if (detail) { if (onClose(x, y)) closeDetail(); return; }
      if (onBanner(x, y)) { detail = showing()[0] || null; detailScroll = 0; detailVel = 0; if (detail && window.AlertChime) AlertChime.read(detail); return; }
      panelOpen = !panelOpen;
    },
    // A sideways swipe that starts on the banner dismisses the alert instead of changing scene.
    // V123: for the radio set, which covers the scene: the alert on top, and a way to open its page.
    activeAlert() { const a = showing()[0]; return a ? { event: a.event, ends: endsText(a.ends), updated: !!(window.AlertChime && AlertChime.updated(a)), count: showing().length } : null; },
    openAlert() { detail = showing()[0] || null; detailScroll = 0; detailVel = 0; if (detail && window.AlertChime) AlertChime.read(detail); return !!detail; },
    swipeOnBanner(x, y, dx) {
      dragging = false;
      if (detail || !onBanner(x, y)) return false;
      slideDir = dx < 0 ? -1 : 1; return true;
    },
    // V141: on a phone the banner follows a sideways drag that starts on it. Returns true while it does.
    dragBanner(x, y, dx, dy) {
      if (detail || slideDir || !isPhone() || !onBanner(x, y) || Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) { if (dragging) { dragging = false; } return false; }
      dragging = true; slide = dx; return true;
    },
    // V141: where a drag let go on the banner fell short of a swipe: it eases back.
    releaseBanner() { dragging = false; },
    // V143: the details page is open (a drag on it is a scroll and nothing else), and scrolling it.
    detailOpen: () => !!detail,
    // V144: a touch that started and ended on the ✕ (a little wobble allowed) closes the page.
    closeAt(x0, y0, x1, y1) { return Math.hypot(x1 - x0, y1 - y0) < 30 && onClose(x0, y0) && onClose(x1, y1) && closeDetail(); },
    // V144: show the ✕'s button only while the page is up on Home and nothing covers it.
    syncX(on) { syncX(!!on); },
    scrollDetail(dy, done, vel) {
      if (!detail) return;
      detailTouching = !done; detailScroll = Math.max(0, Math.min(detailMax, detailScroll + dy));
      detailVel = done ? Math.max(-40, Math.min(40, vel || 0)) : 0;
    },
    start(context) { ctx = context; if (!this.started) { this.started = true;
      if (window.Place) Place.onChange(p => { if (p.lat === LAT && p.lon === LON) return; LAT = p.lat; LON = p.lon; days = []; wx = Object.assign({}, wx, { status: 'loading' }); loadWeather(); loadAlerts(); });
      loadWeather(); setInterval(loadWeather, 20 * 60e3); /* every 20 minutes (V44), to keep up with what's falling */ loadAlerts(); setInterval(loadAlerts, 600e3); } },
    resize(w, h) { W = w; H = h; if (ctx) layout(); },
    draw() { if (!house) layout(); draw(); },
    debug: () => ({ deepest: Math.max(...depth), roof: Math.max(...roofDepth), cap: maxDepth(), flakes: flakes.length, drops: drops.length, cover, light, wx, days, panelOpen, alerts: showing().map(a => a.event), detail: !!detail, detailScroll, detailMax, closeBox, bannerBox, wind: windNow(), sway: Sway }),
  };
})();
