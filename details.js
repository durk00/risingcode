// DETAILS (Nov 24, 2026), laid out since V39 like a home weather station's indoor console
// (outdoor temperature with feels-like and today's high/low, a wind compass, humidity and
// dew point, pressure with its trend, rain chance, cloud cover, sunrise and sunset).
// A third scene for Rising Code, one more swipe left past
// Winter (swipe right to go back). The detailed NOAA weather for Happy Valley, PA:
//
//   RIGHT NOW   the latest reading from the nearest NOAA weather station:
//               temperature, conditions, humidity, dew point, wind and gusts,
//               pressure, and when it was taken
//   NEXT 3 DAYS hour by hour from the NOAA forecast grid, in four strips that share
//               one time line:
//                 temperature (solid) and dew point (dashed), in °F (V31: every
//                   temperature here is written °F so a dew point can't be misread as a %)
//                 relative humidity, %, with the drying hours shaded: humidity
//                   under 50% and under a 20% chance of rain (handy for field drying)
//                 chance of rain or snow, % (bars)
//                 wind (solid) and gusts (dotted), mph
//
// Lines differ by style and brightness, not by color, and each is labeled.
// Refreshed every hour while it's showing. Preview with sample numbers by adding
// ?details-sample to the address.
(() => {
  // V66: the same place as Winter (place.js); a change of place fetches everything again.
  let LAT = window.Place ? Place.lat : 40.8473, LON = window.Place ? Place.lon : -77.6858;
  const placeName = () => (window.Place ? Place.name : 'HAPPY VALLEY');
  const HOURS = 72;
  const DRY_RH = 50, DRY_POP = 20;               // the drying-hours rule
  const sample = /[?&]details-sample\b/.test(location.search);
  let ctx, W = 0, H = 0;
  let data = null, status = 'loading', lastLoad = 0;
  if (window.Place) Place.onChange(p => { if (p.lat === LAT && p.lon === LON) return; LAT = p.lat; LON = p.lon; data = null; status = 'loading'; lastLoad = 0; });

  const cToF = (c) => c === null || c === undefined ? null : c * 9 / 5 + 32;
  const kmhToMph = (k) => k === null || k === undefined ? null : k * 0.621371;
  function hoursOf(iso) { const m = /P(?:(\d+)D)?T?(?:(\d+)H)?/.exec(iso || ''); return m ? (+(m[1] || 0)) * 24 + (+(m[2] || 0)) : 1; }
  // NOAA grid series come as runs ("from 3 PM for 4 hours: 61%"); spread them over the hours.
  function hourly(series, t0, conv) {
    const out = new Array(HOURS).fill(null);
    for (const v of (series && series.values) || []) {
      const [s, d] = v.validTime.split('/'); const start = Date.parse(s), n = hoursOf(d);
      for (let k = 0; k < n; k++) {
        const i = Math.round((start + k * 3600e3 - t0) / 3600e3);
        if (i >= 0 && i < HOURS) out[i] = conv ? conv(v.value) : v.value;
      }
    }
    return out;
  }

  function makeSample() {
    const t0 = new Date(); t0.setMinutes(0, 0, 0);
    const temp = [], dew = [], rh = [], pop = [], wind = [], gust = [], sky = [];
    for (let i = 0; i < HOURS; i++) {
      const hr = (t0.getHours() + i) % 24, day = Math.floor((t0.getHours() + i) / 24);
      const tt = 30 + day * 2 + 10 * Math.sin((hr - 9) / 24 * 2 * Math.PI);
      temp.push(tt); dew.push(tt - 8 - 6 * Math.sin((hr - 9) / 24 * 2 * Math.PI) + (day === 2 ? 7 : 0));
      rh.push(Math.max(25, Math.min(100, 68 - 32 * Math.sin((hr - 9) / 24 * 2 * Math.PI) + (day === 2 ? 25 : 0))));
      pop.push(day === 2 ? Math.min(90, 40 + hr * 2) : day === 1 && hr > 18 ? 25 : 5);
      wind.push(6 + 5 * Math.sin(i / 7)); gust.push(14 + 7 * Math.sin(i / 7)); sky.push(day === 2 ? 90 : 30);
    }
    return { t0: +t0, temp, dew, rh, pop, wind, gust, sky, hi: 41, lo: 22,
      now: { station: 'SAMPLE STATION', when: new Date(), temp: 31, words: 'Mostly Clear', rh: 72, dew: 23, wind: 9, gust: 17, dir: 'NW', deg: 315, pressure: 30.12, trend: 'RISING' } };
  }

  const compass = (deg) => deg === null || deg === undefined ? '' : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
  async function load() {
    lastLoad = Date.now();
    if (sample) { data = makeSample(); status = 'ok'; return; }
    const at = LAT + ',' + LON;                   // V66: drop a reply for a place we've since left
    try {
      const pt = await (await fetch(`https://api.weather.gov/points/${LAT},${LON}`)).json();
      const [grid, stations] = await Promise.all([
        fetch(pt.properties.forecastGridData).then(r => r.json()),
        fetch(pt.properties.observationStations).then(r => r.json()),
      ]);
      const g = grid.properties, t0d = new Date(); t0d.setMinutes(0, 0, 0); const t0 = +t0d;
      const d = { t0,
        temp: hourly(g.temperature, t0, cToF), dew: hourly(g.dewpoint, t0, cToF), rh: hourly(g.relativeHumidity, t0),
        pop: hourly(g.probabilityOfPrecipitation, t0), wind: hourly(g.windSpeed, t0, kmhToMph), gust: hourly(g.windGust, t0, kmhToMph),
        sky: hourly(g.skyCover, t0), now: null, hi: null, lo: null };
      // Today's high and low (V39), from NOAA's daily max/min for today's date.
      const today = new Date().toDateString();
      const daily = (series) => { for (const v of (series && series.values) || []) { const st = new Date(v.validTime.split('/')[0]); const mid = new Date(+st + hoursOf(v.validTime.split('/')[1]) * 1800e3); if (mid.toDateString() === today) return cToF(v.value); } return null; };
      d.hi = daily(g.maxTemperature); d.lo = daily(g.minTemperature);
      // RIGHT NOW (V38): the nearest station sometimes has no recent reading, or blanks
      // for some values. Fill any blanks from this hour of the forecast; and if no
      // station has anything, show this hour of the forecast so the top is never empty.
      // V74 (Nov 24, 9 PM): Details showed 36° from the State College airport at 6:53 PM
      // while it was 25° at the house: a reading over 2 hours old on a clear night, when the
      // temperature falls fast. Now a station reading must be under 90 minutes old; of the
      // nearest five stations, the nearest one with a fresh reading is used (or a farther
      // one if it is a good deal newer). If none is fresh, this hour of NOAA's forecast for
      // this exact spot is shown, and the screen says how old the newest reading was.
      const FRESH = 90 * 60e3;
      const hour = { temp: d.temp[0], rh: d.rh[0], dew: d.dew[0], wind: d.wind[0], gust: d.gust[0] };
      const val = (x) => (x && x.value !== null && x.value !== undefined ? x.value : null);
      const cands = [];
      let newestAny = null;
      for (const [rank, st] of (stations.features || []).slice(0, 5).entries()) {
        try {
          // The last several readings (V39), so pressure can show which way it's heading.
          const list = ((await (await fetch(`https://api.weather.gov/stations/${st.properties.stationIdentifier}/observations?limit=8`)).json()).features || []).map(f => f.properties);
          const o = list.find(x => x && x.temperature && x.temperature.value !== null);
          if (!o) continue;
          const when = new Date(o.timestamp), age = Date.now() - when;
          if (!newestAny || when > newestAny) newestAny = when;
          if (!(age <= FRESH)) continue;
          cands.push({ rank, st, o, list, when, age });
          if (rank === 0 && age <= 60 * 60e3) break;     // the nearest station is fresh: no need to look further
        } catch (e) { /* try the next station */ }
      }
      if (cands.length) {
        const newest = Math.min(...cands.map(c => c.age));
        const pick = cands.find(c => c.age <= newest + 30 * 60e3);   // nearest, unless a farther one is over half an hour newer
        const { st, o, list, when } = pick;
        const pNow = o.barometricPressure && o.barometricPressure.value;
        const old = list.find(x => x && x.barometricPressure && x.barometricPressure.value && new Date(o.timestamp) - new Date(x.timestamp) >= 2.5 * 3600e3);
        const dp = pNow && old ? (pNow - old.barometricPressure.value) / 3386.39 : null;
        const trend = dp === null ? '' : dp > 0.02 ? 'RISING' : dp < -0.02 ? 'FALLING' : 'STEADY';
        d.now = { station: (st.properties.name || st.properties.stationIdentifier).toUpperCase(), when, fromStation: true,
          temp: cToF(val(o.temperature)), words: window.WxNow ? WxNow.describe(o) : (o.textDescription || ''),   // V58: built from the cloud layers when NOAA leaves the words blank
          rh: val(o.relativeHumidity) ?? hour.rh, dew: val(o.dewpoint) !== null ? cToF(val(o.dewpoint)) : hour.dew,
          wind: val(o.windSpeed) !== null ? kmhToMph(val(o.windSpeed)) : hour.wind, gust: val(o.windGust) !== null ? kmhToMph(val(o.windGust)) : hour.gust,
          dir: compass(val(o.windDirection)), deg: val(o.windDirection), pressure: val(o.barometricPressure) ? val(o.barometricPressure) / 3386.39 : null, trend };
      }
      if (!d.now && hour.temp !== null) {
        d.now = { station: 'NOAA FORECAST FOR THIS HOUR', when: new Date(t0), temp: hour.temp, words: '', rh: hour.rh, dew: hour.dew, wind: hour.wind, gust: hour.gust, dir: '', deg: null, pressure: null, trend: '',
          staleFrom: newestAny };   // V74: the newest station reading, too old to show
      }
      if (at !== LAT + ',' + LON) return;
      data = d; status = 'ok';
    } catch (e) { status = data ? 'ok' : 'offline'; }
  }

  // ---- drawing -------------------------------------------------------------
  // V60: what was white on this page is amber (William's request): the readings, the words,
  // the graph line, the rain-chance bars, the wind arrow and the weather icon.
  const AMBER = '#ffb84a';
  const C = { bg: '#0b1118', panel: '#121a23', rule: '#243241', text: AMBER, dim: '#93a4b4', line: '#ffc870', line2: '#8fc3ec', fill: 'rgba(200,225,245,0.13)', bar: '#d99a40' };
  const font = (w, px) => `${w} ${Math.round(px)}px ui-monospace, Menlo, monospace`;
  const fmt = (v, unit, digits = 0) => v === null || v === undefined || isNaN(v) ? '—' : v.toFixed(digits) + unit;

  // ---- the console (V39): laid out like a home weather station's indoor display ----
  // Feels like: wind chill when it's cold and breezy, heat index when it's hot.
  function feelsLike(t, rh, v) {
    if (t === null) return null;
    if (t <= 50 && v !== null && v > 3) return 35.74 + 0.6215 * t - 35.75 * Math.pow(v, 0.16) + 0.4275 * t * Math.pow(v, 0.16);
    if (t >= 80 && rh !== null) return -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t - 0.05481717 * rh * rh + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
    return t;
  }
  // Sunrise and sunset for Happy Valley, worked out on the device (the standard almanac method).
  function sunTime(rise) {
    const rad = Math.PI / 180, d = new Date(), N = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), lh = LON / 15;
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
  const clock = (dt) => dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  function tile(x, y, w, h, fs, label) {
    ctx.fillStyle = C.panel; ctx.strokeStyle = C.rule; ctx.lineWidth = 1.5;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, fs * 0.5); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.dim; ctx.font = font(700, fs * 0.72); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(label, x + fs * 0.7, y + fs * 0.55);
  }
  // The Winter icon, redrawn in amber: drawn on a small side canvas, multiplied by amber (white
  // becomes amber, grays become darker amber, so the shapes keep their shading), then trimmed
  // back to the icon's own outline and placed on the page.
  let iconCanvas = null;
  function amberIcon(words, night, cx, cy, r) {
    const size = Math.ceil(r * 3), dpr = 2;
    iconCanvas = iconCanvas || document.createElement('canvas');
    iconCanvas.width = size * dpr; iconCanvas.height = size * dpr;
    const ic = iconCanvas.getContext('2d'); ic.setTransform(dpr, 0, 0, dpr, 0, 0);
    WinterScene.icon(words, night, size / 2, size / 2, r, ic);
    const shape = document.createElement('canvas'); shape.width = iconCanvas.width; shape.height = iconCanvas.height;
    shape.getContext('2d').drawImage(iconCanvas, 0, 0);
    ic.setTransform(1, 0, 0, 1, 0, 0);
    // V75: at night the icon keeps its own colors, a silver moon and gray clouds, so the moon
    // reads as the moon (tinted amber, tonight's full moon looked like a sun with no rays).
    if (night) { ctx.drawImage(iconCanvas, cx - size / 2, cy - size / 2, size, size); return; }
    ic.globalCompositeOperation = 'multiply'; ic.fillStyle = AMBER; ic.fillRect(0, 0, iconCanvas.width, iconCanvas.height);
    ic.globalCompositeOperation = 'destination-in'; ic.drawImage(shape, 0, 0);
    ic.globalCompositeOperation = 'source-over';
    ctx.drawImage(iconCanvas, cx - size / 2, cy - size / 2, size, size);
  }
  function big(text, x, y, px, weight = 800, color = C.text, align = 'left') {
    ctx.fillStyle = color; ctx.font = font(weight, px); ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y);
  }
  function consoleTiles(x, y, w, h, fs) {
    const n = (data && data.now) || {};
    const gap = fs * 0.6, row1 = h * 0.62, row2 = h - row1 - gap;
    // Row 1: outdoor temperature (wide), wind compass, humidity.
    const w1 = (w - gap * 2) * 0.42, w2 = (w - gap * 2) * 0.3, w3 = (w - gap * 2) * 0.28;
    tile(x, y, w1, row1, fs, 'OUTDOOR');
    // V67: the temperature and the weather icon share the top of the tile without touching;
    // on a narrow tile (an iPad standing up) the number gets a little smaller to make room.
    const iconR = Math.min(row1 * 0.2, w1 * 0.13), tempText = fmt(n.temp, '°F');
    let tempPx = Math.min(row1 * 0.42, w1 * 0.3);
    ctx.font = font(800, tempPx);
    const room = w1 - fs * 0.8 - iconR * 2.6 - fs * 0.6, tw = ctx.measureText(tempText).width;
    if (tw > room) tempPx *= room / tw;
    ctx.font = font(800, tempPx);
    const iconX = Math.max(x + w1 * 0.8, x + fs * 0.8 + ctx.measureText(tempText).width + iconR * 1.5);
    big(tempText, x + fs * 0.8, y + row1 * 0.62, tempPx);
    ctx.fillStyle = C.text; ctx.font = font(600, fs); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const fl = feelsLike(n.temp, n.rh, n.wind);
    ctx.fillText(`FEELS LIKE ${fmt(fl, '°F')}`, x + fs * 0.8, y + row1 * 0.78);
    ctx.fillStyle = C.dim; ctx.font = font(600, fs * 0.85);
    ctx.fillText(`TODAY HIGH ${fmt(data.hi, '°F')}  LOW ${fmt(data.lo, '°F')}`, x + fs * 0.8, y + row1 * 0.92);
    if (n.words) { ctx.textAlign = 'right'; ctx.fillStyle = C.text; ctx.font = font(600, fs * 0.85); ctx.textBaseline = 'top'; ctx.fillText(n.words.toUpperCase(), x + w1 - fs * 0.7, y + fs * 0.55); }
    // V40: a weather icon next to the temperature, matching the conditions: sun, sun and
    // cloud, clouds, rain, snow, fog, or a moon at night. With no station words (forecast
    // fallback), it goes by this hour's cloud cover and rain chance.
    if (window.WinterScene && WinterScene.icon) {
      const sky = data.sky ? data.sky[0] : null, pop = data.pop ? data.pop[0] : 0;
      const words = n.words || (pop >= 50 ? (n.temp !== null && n.temp <= 32 ? 'Snow' : 'Rain') : sky === null ? '' : sky >= 88 ? 'Cloudy' : sky >= 50 ? 'Partly Cloudy' : 'Clear');
      const nowT = new Date(), night = nowT < sunTime(true) || nowT > sunTime(false);
      if (words) amberIcon(words, night, Math.min(iconX, x + w1 - iconR * 1.2), y + row1 * 0.47, iconR);
      // V75: at night, the moon's phase by name under the icon.
      if (words && night && WinterScene.moonPhaseName) {
        ctx.fillStyle = C.dim; ctx.font = font(600, fs * 0.62); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(WinterScene.moonPhaseName(), Math.min(iconX, x + w1 - iconR * 1.2), y + row1 * 0.47 + iconR * 1.25);
      }
    }
    // Wind: a compass ring, the arrowhead on the side the wind comes FROM, speed and gust inside.
    const wx = x + w1 + gap; tile(wx, y, w2, row1, fs, 'WIND');
    const cx = wx + w2 / 2, cy = y + row1 * 0.56, r = Math.min(w2 * 0.36, row1 * 0.36);
    ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.stroke();
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; const r2 = k % 4 ? r * 0.93 : r * 0.86; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r, cy - Math.cos(a) * r); ctx.lineTo(cx + Math.sin(a) * r2, cy - Math.cos(a) * r2); ctx.stroke(); }
    ctx.fillStyle = C.dim; ctx.font = font(700, fs * 0.7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([l, a]) => ctx.fillText(l, cx + Math.sin(a * Math.PI / 180) * (r + fs * 0.75), cy - Math.cos(a * Math.PI / 180) * (r + fs * 0.75)));
    if (n.deg !== null && n.deg !== undefined) {
      const a = n.deg * Math.PI / 180, tipX = cx + Math.sin(a) * r * 0.82, tipY = cy - Math.cos(a) * r * 0.82;
      ctx.fillStyle = AMBER; ctx.beginPath();
      ctx.moveTo(cx + Math.sin(a) * r * 1.05, cy - Math.cos(a) * r * 1.05);
      ctx.lineTo(tipX + Math.cos(a) * r * 0.12, tipY + Math.sin(a) * r * 0.12);
      ctx.lineTo(tipX - Math.cos(a) * r * 0.12, tipY - Math.sin(a) * r * 0.12); ctx.closePath(); ctx.fill();
    }
    big(n.wind === null || n.wind === undefined ? '—' : `${Math.round(n.wind)}`, cx, cy + fs * 0.4, r * 0.62, 800, C.text, 'center');
    ctx.fillStyle = C.dim; ctx.font = font(600, fs * 0.7); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`MPH ${n.dir || ''}`.trim(), cx, cy + fs * 0.65);
    ctx.fillText(`GUST ${n.gust === null || n.gust === undefined ? '—' : Math.round(n.gust)}`, cx, cy + fs * 1.5);
    // Humidity and dew point.
    const hx = wx + w2 + gap; tile(hx, y, w3, row1, fs, 'HUMIDITY');
    big(fmt(n.rh, '%'), hx + fs * 0.8, y + row1 * 0.5, Math.min(row1 * 0.3, w3 * 0.3));
    ctx.fillStyle = C.dim; ctx.font = font(700, fs * 0.72); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('DEW POINT', hx + fs * 0.8, y + row1 * 0.62);
    big(fmt(n.dew, '°F'), hx + fs * 0.8, y + row1 * 0.62 + fs * 2.4, fs * 1.8, 700);
    // Row 2: pressure with its trend, rain chance today, cloud cover now, sun.
    const y2 = y + row1 + gap, w4 = (w - gap * 3) / 4;
    const small = (i, label, value, sub) => {
      const tx = x + i * (w4 + gap); tile(tx, y2, w4, row2, fs, label);
      let px = Math.min(row2 * 0.36, fs * 2.2);
      ctx.font = font(800, px); while (px > 8 && ctx.measureText(value).width > w4 - fs * 1.4) { px -= 1; ctx.font = font(800, px); }   // shrink to fit narrow tiles
      big(value, tx + fs * 0.8, y2 + row2 * 0.66, px, 800);
      if (sub) { ctx.fillStyle = C.dim; ctx.font = font(600, fs * 0.72); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(sub, tx + fs * 0.8, y2 + row2 * 0.9); }
    };
    const arrow = { RISING: ' ↑', FALLING: ' ↓', STEADY: ' →' }[n.trend] || '';
    small(0, 'PRESSURE', fmt(n.pressure, ' IN', 2) + arrow, n.trend || '');
    const todayLeft = 24 - new Date(data.t0).getHours();
    const popToday = Math.max(0, ...data.pop.slice(0, todayLeft).filter(v => v !== null));
    small(1, 'RAIN CHANCE TODAY', `${Math.round(popToday)}%`, 'NOAA FORECAST');
    small(2, 'CLOUD COVER', fmt(data.sky ? data.sky[0] : null, '%'), 'THIS HOUR');
    // Sun: sunrise and sunset on two lines so they fit.
    { const tx = x + 3 * (w4 + gap); tile(tx, y2, w4, row2, fs, 'SUNRISE · SUNSET');
      const px = Math.min(row2 * 0.24, fs * 1.6);
      big('↑ ' + clock(sunTime(true)), tx + fs * 0.8, y2 + row2 * 0.55, px, 800);
      big('↓ ' + clock(sunTime(false)), tx + fs * 0.8, y2 + row2 * 0.55 + px * 1.25, px, 800); }
  }

  function strip(x, y, w, h, fs, title, series, opts) {
    let lastLabelY = null;
    ctx.fillStyle = C.panel; ctx.fillRect(x, y, w, h);
    const pl = fs * 3.2, pr = fs * 5.2, pt = fs * 1.5, pb = fs * 0.5;
    const cx = x + pl, cw = w - pl - pr, cy = y + pt, ch = h - pt - pb;
    const all = series.flatMap(s => s.v).filter(v => v !== null && !isNaN(v));
    let lo = opts.min !== undefined ? opts.min : Math.floor(Math.min(...all) / 5) * 5 - 5;
    let hi = opts.max !== undefined ? opts.max : Math.ceil(Math.max(...all) / 5) * 5 + 5;
    if (!all.length || hi <= lo) { lo = 0; hi = 100; }
    const X = (i) => cx + i / (HOURS - 1) * cw, Y = (v) => cy + ch - (v - lo) / (hi - lo) * ch;
    ctx.fillStyle = C.dim; ctx.font = font(700, fs * 0.75); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title, x + fs * 0.5, y + fs * 0.35);
    // Days: a rule at each midnight, light ticks at 6 AM, noon and 6 PM.
    for (let i = 0; i < HOURS; i++) {
      const hr = new Date(data.t0 + i * 3600e3).getHours();
      if (hr === 0) { ctx.fillStyle = C.rule; ctx.fillRect(X(i), cy, 1.5, ch); }
      else if (hr % 6 === 0) { ctx.fillStyle = 'rgba(36,50,65,0.6)'; ctx.fillRect(X(i), cy, 1, ch); }
    }
    // Scale: top and bottom values.
    ctx.fillStyle = C.dim; ctx.font = font(500, fs * 0.68); ctx.textAlign = 'right';
    ctx.textBaseline = 'top'; ctx.fillText(String(hi) + opts.unit, cx - fs * 0.4, cy - 2);
    ctx.textBaseline = 'bottom'; ctx.fillText(String(lo) + opts.unit, cx - fs * 0.4, cy + ch + 2);
    if (opts.shade) {                             // shaded hours, e.g. the drying hours
      ctx.fillStyle = C.fill;
      for (let i = 0; i < HOURS; i++) if (opts.shade(i)) ctx.fillRect(X(i) - cw / HOURS / 2, cy, cw / HOURS + 0.5, ch);
    }
    for (const s of series) {
      if (s.bars) {
        ctx.fillStyle = C.bar;
        s.v.forEach((v, i) => { if (v) ctx.fillRect(X(i) - cw / HOURS * 0.4, Y(v), cw / HOURS * 0.8, Y(lo) - Y(v)); });
      } else {
        ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2.2; ctx.setLineDash(s.dash || []);
        ctx.beginPath(); let on = false;
        s.v.forEach((v, i) => { if (v === null || isNaN(v)) { on = false; return; } if (on) ctx.lineTo(X(i), Y(v)); else { ctx.moveTo(X(i), Y(v)); on = true; } });
        ctx.stroke(); ctx.setLineDash([]);
      }
      // Label at the right end, with the value there.
      const lastI = s.v.map((v, i) => v === null ? -1 : i).filter(i => i >= 0).pop();
      if (lastI !== undefined && lastI >= 0) {
        ctx.fillStyle = s.bars ? C.bar : s.color; ctx.font = font(700, fs * 0.7); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        let ly = Math.max(cy + fs * 0.5, Math.min(cy + ch - fs * 0.5, Y(s.v[lastI]) + (s.nudge || 0) * fs));
        if (lastLabelY !== null && Math.abs(ly - lastLabelY) < fs * 0.9) ly = lastLabelY + (ly >= lastLabelY ? 1 : -1) * fs * 0.9;   // keep two labels from overlapping
        lastLabelY = ly;
        ctx.fillText(s.label, cx + cw + fs * 0.5, ly);
      }
    }
    // Now: the first value, written at the left edge of the line.
    return { X, cx, cw };
  }

  function draw() {
    if (!data && status === 'loading' && !lastLoad) load();
    if (Date.now() - lastLoad > 3600e3) load();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const fs = Math.max(11, Math.min(18, Math.round(Math.min(W, H) / 46)));
    const m = Math.max(14, W * 0.025);
    // Header: name on the left, the date and time on the right, like the console's top line.
    ctx.fillStyle = C.text; ctx.font = font(800, fs * 1.05); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(sample ? 'WEATHER STATION · SAMPLE NUMBERS' : `WEATHER STATION · ${placeName()}`, m, m * 0.6);
    const nowD = new Date(), title = sample ? 'WEATHER STATION · SAMPLE NUMBERS' : `WEATHER STATION · ${placeName()}`;
    const stamp = nowD.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase() + '  ' + clock(nowD);
    const narrow = ctx.measureText(title).width + ctx.measureText(stamp).width + fs * 2 > W - m * 2;   // on a phone the date goes under the name
    ctx.textAlign = narrow ? 'left' : 'right'; ctx.fillText(stamp, narrow ? m : W - m, m * 0.6 + (narrow ? fs * 1.4 : 0));
    if (!data) { ctx.textAlign = 'left'; ctx.fillStyle = C.dim; ctx.font = font(500, fs); ctx.fillText(status === 'offline' ? 'NOAA forecast unavailable right now.' : 'Loading…', m, m * 0.6 + fs * 2.4); return; }
    const n = data.now;
    ctx.fillStyle = C.dim; ctx.font = font(600, fs * 0.72); ctx.textAlign = 'right';
    // V74: how old the reading is, worked out as the screen is drawn; or, on the forecast,
    // how old the newest station reading was.
    const ago = (t) => { const mins = Math.max(0, Math.round((Date.now() - t) / 60e3)); return mins < 60 ? `${mins} MIN AGO` : `${Math.floor(mins / 60)} HR ${mins % 60} MIN AGO`; };
    if (n) ctx.fillText(n.fromStation ? `READING: ${n.station} · ${clock(n.when)} · ${ago(n.when)}`
      : n.staleFrom ? `${n.station} · NEWEST STATION READING ${clock(n.staleFrom)} WAS TOO OLD` : `READING: ${n.station} · ${clock(n.when)}`, W - m, m * 0.6 + fs * (narrow ? 2.8 : 1.5));
    const top = m * 0.6 + fs * (narrow ? 4.1 : 2.8), sw = W - m * 2;
    const consoleH = Math.min(H * 0.45, sw * 0.42);
    consoleTiles(m, top, sw, consoleH, fs);
    const chartsTop = top + consoleH + fs * 0.9, gap = fs * 0.4, k = 4;
    const sh = (H - chartsTop - m * 0.6 - fs * 1.5 - gap * (k - 1)) / k;
    const geo = strip(m, chartsTop, sw, sh, fs, 'NEXT 3 DAYS · TEMPERATURE AND DEW POINT', [
      { v: data.temp, color: C.line, label: 'TEMP' },
      { v: data.dew, color: C.line2, dash: [7, 5], label: 'DEW PT', nudge: 0.8 },
    ], { unit: '°F' });
    strip(m, chartsTop + (sh + gap), sw, sh, fs, `HUMIDITY · SHADED: DRYING HOURS (UNDER ${DRY_RH}%, UNDER ${DRY_POP}% RAIN CHANCE)`, [
      { v: data.rh, color: C.line, label: 'HUMIDITY' },
    ], { unit: '%', min: 0, max: 100, shade: (i) => data.rh[i] !== null && data.rh[i] < DRY_RH && (data.pop[i] || 0) < DRY_POP });
    strip(m, chartsTop + (sh + gap) * 2, sw, sh, fs, 'CHANCE OF RAIN OR SNOW', [
      { v: data.pop, bars: true, label: 'CHANCE' },
    ], { unit: '%', min: 0, max: 100 });
    strip(m, chartsTop + (sh + gap) * 3, sw, sh, fs, 'WIND AND GUSTS', [
      { v: data.wind, color: C.line, label: 'WIND' },
      { v: data.gust, color: C.line2, dash: [2, 4], width: 2.6, label: 'GUSTS', nudge: -0.8 },
    ], { unit: ' MPH', min: 0, max: Math.max(20, Math.ceil(Math.max(...data.gust.concat(data.wind).filter(v => v !== null)) / 10) * 10 + 5) });
    const by = chartsTop + (sh + gap) * k - gap + fs * 0.35;
    ctx.textBaseline = 'top'; ctx.textAlign = 'center';
    for (let i = 0; i < HOURS; i++) {
      const dt = new Date(data.t0 + i * 3600e3), hr = dt.getHours(), x = geo.X(i);
      if (i === 0) { ctx.fillStyle = C.text; ctx.font = font(700, fs * 0.68); ctx.textAlign = 'left'; ctx.fillText('NOW', x, by); ctx.textAlign = 'center'; continue; }
      if (hr === 0) { ctx.fillStyle = C.text; ctx.font = font(700, fs * 0.7); ctx.fillText(dt.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(), x, by); }
      else if (hr === 12 && i > 3) { ctx.fillStyle = C.dim; ctx.font = font(500, fs * 0.62); ctx.fillText('NOON', x, by); }
    }
  }

  window.DetailsScene = {
    start(context) { ctx = context; },
    resize(w, h) { W = w; H = h; },
    draw() { if (ctx) draw(); },
    debug: () => ({ status, hours: data ? data.temp.filter(v => v !== null).length : 0, now: data && data.now }),
  };
})();
