// DETAILS (Nov 24, 2026): a third scene for Rising Code, one more swipe left past
// Winter (swipe right to go back). The detailed NOAA weather for Centre Hall, PA:
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
  const LAT = 40.8473, LON = -77.6858;          // Centre Hall, PA (town center), same as Winter
  const HOURS = 72;
  const DRY_RH = 50, DRY_POP = 20;               // the drying-hours rule
  const sample = /[?&]details-sample\b/.test(location.search);
  let ctx, W = 0, H = 0;
  let data = null, status = 'loading', lastLoad = 0;

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
    const temp = [], dew = [], rh = [], pop = [], wind = [], gust = [];
    for (let i = 0; i < HOURS; i++) {
      const hr = (t0.getHours() + i) % 24, day = Math.floor((t0.getHours() + i) / 24);
      const tt = 30 + day * 2 + 10 * Math.sin((hr - 9) / 24 * 2 * Math.PI);
      temp.push(tt); dew.push(tt - 8 - 6 * Math.sin((hr - 9) / 24 * 2 * Math.PI) + (day === 2 ? 7 : 0));
      rh.push(Math.max(25, Math.min(100, 68 - 32 * Math.sin((hr - 9) / 24 * 2 * Math.PI) + (day === 2 ? 25 : 0))));
      pop.push(day === 2 ? Math.min(90, 40 + hr * 2) : day === 1 && hr > 18 ? 25 : 5);
      wind.push(6 + 5 * Math.sin(i / 7)); gust.push(14 + 7 * Math.sin(i / 7));
    }
    return { t0: +t0, temp, dew, rh, pop, wind, gust,
      now: { station: 'SAMPLE STATION', when: new Date(), temp: 31, words: 'Mostly Clear', rh: 72, dew: 23, wind: 5, gust: null, dir: 'NW', pressure: 30.12 } };
  }

  const compass = (deg) => deg === null || deg === undefined ? '' : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
  async function load() {
    lastLoad = Date.now();
    if (sample) { data = makeSample(); status = 'ok'; return; }
    try {
      const pt = await (await fetch(`https://api.weather.gov/points/${LAT},${LON}`)).json();
      const [grid, stations] = await Promise.all([
        fetch(pt.properties.forecastGridData).then(r => r.json()),
        fetch(pt.properties.observationStations).then(r => r.json()),
      ]);
      const g = grid.properties, t0d = new Date(); t0d.setMinutes(0, 0, 0); const t0 = +t0d;
      const d = { t0,
        temp: hourly(g.temperature, t0, cToF), dew: hourly(g.dewpoint, t0, cToF), rh: hourly(g.relativeHumidity, t0),
        pop: hourly(g.probabilityOfPrecipitation, t0), wind: hourly(g.windSpeed, t0, kmhToMph), gust: hourly(g.windGust, t0, kmhToMph), now: null };
      // RIGHT NOW (V38): the nearest station sometimes has no recent reading, or blanks
      // for some values. Try the nearest few and take the first with a temperature from
      // the last 3 hours; fill any blanks from this hour of the forecast; and if no
      // station has anything, show this hour of the forecast so the top is never empty.
      const hour = { temp: d.temp[0], rh: d.rh[0], dew: d.dew[0], wind: d.wind[0], gust: d.gust[0] };
      for (const st of (stations.features || []).slice(0, 5)) {
        try {
          const o = (await (await fetch(`https://api.weather.gov/stations/${st.properties.stationIdentifier}/observations/latest`)).json()).properties;
          const when = new Date(o.timestamp);
          if (!o || o.temperature.value === null || Date.now() - when > 3 * 3600e3) continue;
          const val = (x) => (x && x.value !== null && x.value !== undefined ? x.value : null);
          d.now = { station: (st.properties.name || st.properties.stationIdentifier).toUpperCase(), when,
            temp: cToF(val(o.temperature)), words: o.textDescription || '',
            rh: val(o.relativeHumidity) ?? hour.rh, dew: val(o.dewpoint) !== null ? cToF(val(o.dewpoint)) : hour.dew,
            wind: val(o.windSpeed) !== null ? kmhToMph(val(o.windSpeed)) : hour.wind, gust: val(o.windGust) !== null ? kmhToMph(val(o.windGust)) : hour.gust,
            dir: compass(val(o.windDirection)), pressure: val(o.barometricPressure) ? val(o.barometricPressure) / 3386.39 : null };
          break;
        } catch (e) { /* try the next station */ }
      }
      if (!d.now && hour.temp !== null) {
        d.now = { station: 'NOAA FORECAST FOR THIS HOUR', when: new Date(t0), temp: hour.temp, words: '', rh: hour.rh, dew: hour.dew, wind: hour.wind, gust: hour.gust, dir: '', pressure: null };
      }
      data = d; status = 'ok';
    } catch (e) { status = data ? 'ok' : 'offline'; }
  }

  // ---- drawing -------------------------------------------------------------
  const C = { bg: '#0b1118', panel: '#121a23', rule: '#243241', text: '#e8eef4', dim: '#93a4b4', line: '#ffffff', line2: '#8fc3ec', fill: 'rgba(200,225,245,0.13)', bar: '#b9c6d3' };
  const font = (w, px) => `${w} ${Math.round(px)}px ui-monospace, Menlo, monospace`;
  const fmt = (v, unit, digits = 0) => v === null || v === undefined || isNaN(v) ? '—' : v.toFixed(digits) + unit;

  function rightNow(x, y, w, h, fs) {
    const n = data && data.now;
    ctx.fillStyle = C.dim; ctx.font = font(600, fs * 0.8); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('RIGHT NOW' + (n ? ` · ${n.station} · ${n.when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toUpperCase()}` : ''), x, y);
    if (!n) { ctx.fillStyle = C.text; ctx.font = font(500, fs); ctx.fillText(status === 'offline' ? 'NOAA unavailable' : status === 'loading' ? 'Loading…' : 'No station reading right now', x, y + fs * 1.6); return; }
    ctx.fillStyle = C.text; ctx.font = font(800, fs * 3.2);
    const t = fmt(n.temp, '°F'); ctx.fillText(t, x, y + fs * 1.3);
    const tw = ctx.measureText(t).width + fs * 1.5;
    ctx.font = font(600, fs * 1.1); ctx.fillText(n.words, x + tw, y + fs * 1.5);
    const items = [['HUMIDITY', fmt(n.rh, '%')], ['DEW POINT', fmt(n.dew, '°F')],
      ['WIND', n.wind === null ? '—' : `${n.dir} ${fmt(n.wind, '')} MPH`], ['GUSTS', fmt(n.gust, ' MPH')], ['PRESSURE', fmt(n.pressure, ' IN', 2)]];
    // Five readings in a row, or two rows of three on a narrow screen.
    const perRow = (w - tw) / items.length < fs * 7.5 ? 3 : items.length, colW = (w - tw) / perRow;
    items.forEach(([k, v], i) => {
      const cxx = x + tw + (i % perRow) * colW, ry = y + fs * 3.1 + Math.floor(i / perRow) * fs * 2.1 - (perRow < items.length ? fs * 0.6 : 0);
      ctx.fillStyle = C.dim; ctx.font = font(600, fs * 0.72); ctx.fillText(k, cxx, ry);
      ctx.fillStyle = C.text; ctx.font = font(700, fs * 1.05); ctx.fillText(v, cxx, ry + fs * 0.9);
    });
  }

  function strip(x, y, w, h, fs, title, series, opts) {
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
        const ly = Math.max(cy + fs * 0.5, Math.min(cy + ch - fs * 0.5, Y(s.v[lastI]) + (s.nudge || 0) * fs));
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
    const fs = Math.max(11, Math.min(18, Math.round(Math.min(W, H) / 44)));
    const m = Math.max(16, W * 0.03);
    ctx.fillStyle = C.text; ctx.font = font(800, fs * 1.1); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(sample ? 'WEATHER DETAILS · SAMPLE NUMBERS' : 'WEATHER DETAILS · NOAA · CENTRE HALL', m, m * 0.7);
    if (!data) { ctx.fillStyle = C.dim; ctx.font = font(500, fs); ctx.fillText(status === 'offline' ? 'NOAA forecast unavailable right now.' : 'Loading…', m, m * 0.7 + fs * 2.4); return; }
    const top = m * 0.7 + fs * 2.2;
    rightNow(m, top, W - m * 2, fs * 5.5, fs);
    const chartsTop = top + fs * 6.6, gap = fs * 0.5, n = 4;
    const sh = (H - chartsTop - m - fs * 1.6 - gap * (n - 1)) / n, sw = W - m * 2;
    let geo = null;
    geo = strip(m, chartsTop, sw, sh, fs, 'TEMPERATURE AND DEW POINT', [
      { v: data.temp, color: C.line, label: 'TEMP' },
      { v: data.dew, color: C.line2, dash: [7, 5], label: 'DEW PT', nudge: 0.8 },
    ], { unit: '°F' });
    strip(m, chartsTop + (sh + gap), sw, sh, fs, `HUMIDITY · SHADED: DRYING HOURS (UNDER ${DRY_RH}% AND UNDER ${DRY_POP}% CHANCE OF RAIN)`, [
      { v: data.rh, color: C.line, label: 'HUMIDITY' },
    ], { unit: '%', min: 0, max: 100, shade: (i) => data.rh[i] !== null && data.rh[i] < DRY_RH && (data.pop[i] || 0) < DRY_POP });
    strip(m, chartsTop + (sh + gap) * 2, sw, sh, fs, 'CHANCE OF RAIN OR SNOW', [
      { v: data.pop, bars: true, label: 'CHANCE' },
    ], { unit: '%', min: 0, max: 100 });
    strip(m, chartsTop + (sh + gap) * 3, sw, sh, fs, 'WIND AND GUSTS', [
      { v: data.wind, color: C.line, label: 'WIND' },
      { v: data.gust, color: C.line2, dash: [2, 4], width: 2.6, label: 'GUSTS', nudge: -0.8 },
    ], { unit: ' MPH', min: 0, max: Math.max(20, Math.ceil(Math.max(...data.gust.concat(data.wind).filter(v => v !== null)) / 10) * 10 + 5) });
    // Shared time line along the bottom: day names at midnight, then 6 AM / noon / 6 PM.
    const by = chartsTop + (sh + gap) * 4 - gap + fs * 0.4;
    ctx.textBaseline = 'top'; ctx.textAlign = 'center';
    for (let i = 0; i < HOURS; i++) {
      const dt = new Date(data.t0 + i * 3600e3), hr = dt.getHours();
      const x = geo.X(i);
      if (i === 0) { ctx.fillStyle = C.text; ctx.font = font(700, fs * 0.7); ctx.textAlign = 'left'; ctx.fillText('NOW', x, by); ctx.textAlign = 'center'; continue; }
      if (hr === 0) { ctx.fillStyle = C.text; ctx.font = font(700, fs * 0.72); ctx.fillText(dt.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(), x, by); }
      else if (hr === 12 && i > 3) { ctx.fillStyle = C.dim; ctx.font = font(500, fs * 0.65); ctx.fillText('NOON', x, by); }
    }
  }

  window.DetailsScene = {
    start(context) { ctx = context; },
    resize(w, h) { W = w; H = h; },
    draw() { if (ctx) draw(); },
    debug: () => ({ status, hours: data ? data.temp.filter(v => v !== null).length : 0, now: data && data.now }),
  };
})();
