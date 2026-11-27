// LOOK IT UP (V146): Shield's checks rebuilt with no AI model. Two kinds of result only:
//   READ HERE      a public record this page fetches and shows as it came, with its source
//                  named and linked (OpenStreetMap for restaurants, NHTSA for vehicles).
//   LOOK IT UP ↗   a source that won't let a web page read it (BBB, review sites, Pennsylvania's
//                  contractor and business registries). We open it on its own site with the
//                  search filled in where its address allows, and never claim a result.
// Anything with no public source (a fair price, a car's value) says "not available here".
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const enc = encodeURIComponent;
  const ext = (href, text) => `<a class="ext" href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;
  const na = (t) => `<span class="na">${esc(t)}</span>`;
  async function getJson(url, ms) {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), ms || 20000) : 0;
    try {
      const r = await fetch(url, ctl ? { signal: ctl.signal } : {});
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { if (timer) clearTimeout(timer); }
  }

  // ---- areas: tap one to open it; the pick is remembered, and #food etc. opens one directly
  const AREAS = ['food', 'car', 'home', 'biz'];
  function show(a) {
    if (AREAS.indexOf(a) < 0) return;
    document.querySelectorAll('.area').forEach((b) => b.classList.toggle('on', b.getAttribute('data-area') === a));
    AREAS.forEach((x) => $(x).classList.toggle('on', x === a));
    try { localStorage.setItem('risingcode_lookup_area', a); } catch (e) {}
    if (a === 'food') whereText();
  }
  document.querySelectorAll('.area').forEach((b) => b.addEventListener('click', () => show(b.getAttribute('data-area'))));

  // ---- where "near you" is: the same spot the app's LOCATION setting uses (place.js)
  const HOME = { lat: 40.8473, lon: -77.6858, name: 'Happy Valley, PA' };
  function spot() {
    try {
      const s = JSON.parse(localStorage.getItem('risingcode_place') || '{}') || {};
      if (s.mode !== 'home' && s.here && isFinite(s.here.lat) && isFinite(s.here.lon)) return { lat: +s.here.lat, lon: +s.here.lon, name: s.here.name ? String(s.here.name) : 'where this device is' };
    } catch (e) {}
    return HOME;
  }
  let fresh = null;   // a spot from "use where I am now", for this visit only
  const near = () => fresh || spot();
  function whereText() {
    const p = near();
    $('foodWhere').innerHTML = 'Searching around ' + esc(p.name) + '. ' +
      (navigator.geolocation ? '<a href="#" id="useHere">Use where I am now</a>' : '');
    const u = $('useHere');
    if (u) u.addEventListener('click', (ev) => {
      ev.preventDefault();
      $('foodWhere').textContent = 'Finding where you are…';
      navigator.geolocation.getCurrentPosition((pos) => { fresh = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'where you are now' }; whereText(); },
        () => { $('foodWhere').textContent = 'Couldn’t get your location, so this searches around ' + spot().name + '.'; }, { timeout: 15000, maximumAge: 600000 });
    });
  }
  function miles(a, b) {
    const R = Math.PI / 180, x = (b.lon - a.lon) * R * Math.cos((a.lat + b.lat) / 2 * R), y = (b.lat - a.lat) * R;
    return 3959 * Math.sqrt(x * x + y * y);
  }

  // ---- RESTAURANTS: OpenStreetMap through the public Overpass API (no key, readable by a page).
  // The first server is the main one; the others are public copies tried if it's busy.
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  const KINDS = { restaurant: 'Restaurant', fast_food: 'Fast food', cafe: 'Café' };
  const reSafe = (t) => t.replace(/[\\^$.|?*+()[\]{}"]/g, '\\$&');
  // A name search ignores apostrophes, so "brothers" also finds "Brother's Pizza".
  const nameRe = (t) => t.replace(/['\u2019]/g, '').split('').map((ch) => reSafe(ch)).join("['\u2019]?");
  function addressOf(t) {
    const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
    return [street, t['addr:city']].filter(Boolean).join(', ');
  }
  $('foodForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const q = $('foodQ').value.replace(/[\\"]/g, '').trim().slice(0, 40), r = +$('foodR').value || 10, p = near();
    const around = `(around:${Math.round(r * 1609)},${p.lat.toFixed(5)},${p.lon.toFixed(5)})`;
    const base = 'nwr["amenity"~"^(restaurant|fast_food|cafe)$"]';
    const ovs = (re) => re.replace(/\\/g, '\\\\');   // a regex's backslashes, doubled for Overpass's quoted strings
    const parts = q ? [`${base}["name"~"${ovs(nameRe(q))}",i]${around};`, `${base}["cuisine"~"${ovs(reSafe(q.toLowerCase().replace(/\s+/g, '_')))}",i]${around};`] : [`${base}["name"]${around};`];
    const query = `[out:json][timeout:25];(${parts.join('')});out center tags 200;`;
    const out = $('foodOut');
    out.innerHTML = '<p class="help">Scanning OpenStreetMap…</p>';
    let data = null, used = '';
    for (const s of OVERPASS) {
      try { data = await getJson(s + '?data=' + enc(query), 30000); used = s; break; } catch (e) { data = null; }
    }
    if (!data) { out.innerHTML = '<p class="help">Couldn’t reach OpenStreetMap right now. Try again in a minute.</p>'; return; }
    const seen = {};
    const rows = (data.elements || []).map((e) => {
      const t = e.tags || {}, lat = e.lat != null ? e.lat : e.center && e.center.lat, lon = e.lon != null ? e.lon : e.center && e.center.lon;
      return { t, type: e.type, id: e.id, d: isFinite(lat) ? miles(p, { lat, lon }) : null };
    }).filter((x) => x.t.name && !seen[x.type + x.id] && (seen[x.type + x.id] = 1))
      .sort((a, b) => (a.d == null ? 1e9 : a.d) - (b.d == null ? 1e9 : b.d)).slice(0, 40);
    const stamp = data.osm3s && /^\d{4}-/.test(data.osm3s.timestamp_osm_base || '') ? ' Map data as of ' + new Date(data.osm3s.timestamp_osm_base).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '.' : '';
    const src = `<p class="src">Source: ${ext('https://www.openstreetmap.org/', 'OpenStreetMap')} contributors (ODbL), read through ${esc(used.split('/')[2])}.${stamp} Listings are added by volunteers, so a place can be missing or out of date. Reviews aren’t read here: each one’s review links open Google Maps or Yelp.</p>`;
    if (!rows.length) { out.innerHTML = `<p class="help">No restaurants matching “${esc(q)}” are listed within ${r} miles.</p>` + src; return; }
    out.innerHTML = `<p class="help">${rows.length} found${q ? ` for “${esc(q)}”` : ''}, nearest first.</p>` + rows.map(({ t, type, id, d }) => {
      const addr = addressOf(t), kind = [KINDS[t.amenity], t.cuisine ? t.cuisine.replace(/_/g, ' ').replace(/;/g, ', ') : ''].filter(Boolean).join(' · ');
      const site = /^https?:\/\//.test(t.website || t['contact:website'] || '') ? (t.website || t['contact:website']) : '';
      const phone = t.phone || t['contact:phone'] || '';
      const findAs = t.name + (addr ? ' ' + addr : '');
      return `<div class="card"><b>${esc(t.name)}</b><div class="meta">${esc(kind)}${d != null ? ' · ' + d.toFixed(1) + ' mi' : ''}</div>
        <div class="row">${addr ? esc(addr) : na('Address not listed')}</div>
        <div class="row">Hours: ${t.opening_hours ? esc(t.opening_hours) : na('not listed')}</div>
        <div class="row">Phone: ${phone ? `<a href="tel:${esc(phone.replace(/[^+\d]/g, ''))}">${esc(phone)}</a>` : na('not listed')}</div>
        <div class="links">${site ? ext(site, 'Their website') : ''}${ext('https://www.google.com/maps/search/?api=1&query=' + enc(findAs), 'Reviews on Google Maps')}${ext('https://www.yelp.com/search?find_desc=' + enc(t.name) + '&find_loc=' + enc(t['addr:city'] ? t['addr:city'] + (t['addr:state'] ? ', ' + t['addr:state'] : '') : addr), 'Reviews on Yelp')}${ext(`https://www.openstreetmap.org/${type}/${id}`, 'Map listing')}</div></div>`;
    }).join('') + src;
  });

  // ---- VEHICLES: NHTSA's public APIs (no key, readable by a page): vPIC decodes a VIN,
  // then recalls, owner complaints and NCAP crash-test stars for that year, make and model.
  // V150: everything is shown in plain English, read straight from those records (no AI,
  // nothing added), and the links go to NHTSA's own pages for people, not the raw API data.
  const NHTSA = 'https://api.nhtsa.gov';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (y, m, d) => (m >= 1 && m <= 12 && d >= 1 && d <= 31) ? MONTHS[m - 1] + ' ' + d + ', ' + y : '';
  // NHTSA writes recall dates day first (17/01/2020) and complaint dates month first (11/11/2026).
  const recallDate = (s) => { const m = /^(\d\d)\/(\d\d)\/(\d{4})/.exec(s || ''); return m ? fmtDate(+m[3], +m[2], +m[1]) : ''; };
  const complaintDate = (s) => { const m = /^(\d\d)\/(\d\d)\/(\d{4})/.exec(s || ''); return m ? fmtDate(+m[3], +m[1], +m[2]) : ''; };
  const complaintSort = (s) => { const m = /^(\d\d)\/(\d\d)\/(\d{4})/.exec(s || ''); return m ? +(m[3] + m[1] + m[2]) : 0; };
  // NHTSA's part names come in capitals ("AIR BAGS: AIR BAG/RESTRAINT CONTROL MODULE"); read them as
  // ordinary words, keeping the usual abbreviations in capitals.
  const KEEP = { ABS: 1, ECU: 1, ECM: 1, PCM: 1, TPMS: 1, LED: 1, HID: 1, EV: 1, HVAC: 1, CVT: 1, VIN: 1, GPS: 1, USB: 1, ADAS: 1, AC: 1, DC: 1, '4WD': 1, AWD: 1, FWD: 1, RWD: 1, SRS: 1, USA: 1, US: 1, UK: 1 };
  const words = (s) => String(s || '').toLowerCase().replace(/[a-z0-9]+/g, (w) => KEEP[w.toUpperCase()] ? w.toUpperCase() : w);
  const capFirst = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const partName = (s) => { const g = String(s || '').split(':').map((p) => words(p).trim()).filter(Boolean); return g.length ? capFirst(g[0]) + (g.length > 1 ? ': ' + g.slice(1).join(', ') : '') : ''; };
  const partList = (s) => String(s || '').split(',').map((p) => capFirst(words(p).trim())).filter(Boolean);
  const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const rated = (v) => /^[1-5]$/.test(String(v == null ? '' : v));
  const starsTxt = (v) => `<span class="stars">${'★'.repeat(+v)}${'☆'.repeat(5 - v)}</span> ${v} star${+v === 1 ? '' : 's'}`;
  const nhtsaVehicle = (y, mk, md) => `https://www.nhtsa.gov/vehicle/${enc(y)}/${enc(mk)}/${enc(md)}`;
  const nhtsaId = (id) => 'https://www.nhtsa.gov/recalls?nhtsaId=' + enc(id);
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

  function recallCard(x) {
    const warn = [];
    if (x.parkIt) warn.push('NHTSA says don’t drive it: park it until it’s fixed.');
    if (x.parkOutSide) warn.push('NHTSA says park it outside, away from buildings, until it’s fixed.');
    const when = recallDate(x.ReportReceivedDate);
    return `<div class="card"><b>${esc(partName(x.Component) || 'Recall')}</b>
      <div class="meta">Recall ${esc(x.NHTSACampaignNumber)}${when ? ' · announced ' + esc(when) : ''}${x.Manufacturer ? ' · by ' + esc(clean(x.Manufacturer)) : ''}</div>
      ${warn.map((w) => `<div class="row warn">${esc(w)}</div>`).join('')}
      ${clean(x.Summary) ? `<div class="row"><span class="lbl">What’s wrong:</span> ${esc(clean(x.Summary))}</div>` : ''}
      ${clean(x.Consequence) ? `<div class="row"><span class="lbl">What can happen:</span> ${esc(clean(x.Consequence))}</div>` : ''}
      ${clean(x.Remedy) ? `<div class="row"><span class="lbl">The fix:</span> ${esc(clean(x.Remedy))}</div>` : ''}
      ${x.overTheAirUpdate ? '<div class="row">NHTSA lists this fix as an over-the-air software update.</div>' : ''}
      <div class="links">${ext(nhtsaId(x.NHTSACampaignNumber), 'This recall on NHTSA')}</div></div>`;
  }

  function complaintCard(c) {
    const filed = complaintDate(c.dateComplaintFiled), happened = complaintDate(c.dateOfIncident);
    const what = [];
    if (c.crash) what.push('a crash');
    if (c.fire) what.push('a fire');
    if (+c.numberOfInjuries > 0) what.push(plural(+c.numberOfInjuries, 'injury', 'injuries'));
    if (+c.numberOfDeaths > 0) what.push(plural(+c.numberOfDeaths, 'death'));
    const parts = partList(c.components);
    return `<div class="card cmp"><div class="meta">Filed ${esc(filed || 'date not given')}${happened && happened !== filed ? ' · happened ' + esc(happened) : ''}</div>
      ${parts.length ? `<div class="row"><span class="lbl">Part:</span> ${esc(parts.join(', '))}</div>` : ''}
      <div class="row">${what.length ? '<span class="warn">Reported ' + esc(what.join(', ')) + '.</span>' : 'No crash, fire or injury reported.'}</div>
      ${clean(c.summary) ? `<div class="row said">“${esc(clean(c.summary))}”</div>` : ''}
      <div class="links">${ext(nhtsaId(c.odiNumber), 'Complaint ' + c.odiNumber + ' on NHTSA')}</div></div>`;
  }

  function ratingCard(v, r, page) {
    let rows = '';
    if (!r) rows = '<div class="row">Couldn’t read this rating right now.</div>';
    else {
      const line = (label, val, extra) => rated(val) ? `<div class="row"><span class="lbl">${label}:</span> ${starsTxt(val)}${extra || ''}</div>` : '';
      const sub = (pairs) => { const s = pairs.filter((p) => rated(p[1])).map((p) => p[0] + ' ' + plural(+p[1], 'star')); return s.length ? ' <span class="sub">(' + s.join(', ') + ')</span>' : ''; };
      rows += `<div class="row"><span class="lbl">Overall:</span> ${rated(r.OverallRating) ? starsTxt(r.OverallRating) : na('Not rated')}</div>`;
      rows += line('Front crash', r.OverallFrontCrashRating, sub([['driver', r.FrontCrashDriversideRating], ['passenger', r.FrontCrashPassengersideRating]]));
      rows += line('Side crash', r.OverallSideCrashRating, sub([['front seat', r['combinedSideBarrierAndPoleRating-Front']], ['rear seat', r['combinedSideBarrierAndPoleRating-Rear']]]));
      rows += line('Side pole crash', r.SidePoleCrashRating);
      const risk = typeof r.RolloverPossibility === 'number' && r.RolloverPossibility > 0 ? ' <span class="sub">(rollover risk ' + (Math.round(r.RolloverPossibility * 1000) / 10) + '%)</span>' : '';
      rows += line('Rollover', r.RolloverRating, risk);
      if (rated(r.RolloverRating) && /tip/i.test(r.dynamicTipResult || '')) rows += `<div class="row sub">In the tip-over test: ${/^no tip$/i.test(r.dynamicTipResult) ? 'it didn’t tip' : esc(words(r.dynamicTipResult))}.</div>`;
      const tech = [['Stability control', r.NHTSAElectronicStabilityControl], ['Forward collision warning', r.NHTSAForwardCollisionWarning], ['Lane departure warning', r.NHTSALaneDepartureWarning]]
        .filter((t) => t[1] && !/not rated|^$/i.test(t[1])).map((t) => t[0] + ': ' + esc(words(t[1])));
      if (tech.length) rows += `<div class="row sub">${tech.join(' · ')}</div>`;
    }
    return `<div class="card"><b>${esc(v.VehicleDescription)}</b>${rows}<div class="links">${ext(page, 'Ratings on NHTSA')}</div></div>`;
  }

  let cmpList = [], cmpShown = 0;
  const CMP_STEP = 10;
  function moreComplaints() {
    const box = $('cmpList'), btn = $('cmpMore');
    if (!box) return;
    const next = cmpList.slice(cmpShown, cmpShown + CMP_STEP);
    box.insertAdjacentHTML('beforeend', next.map(complaintCard).join(''));
    cmpShown += next.length;
    if (btn) {
      const left = cmpList.length - cmpShown;
      if (left > 0) btn.textContent = 'SHOW ' + Math.min(CMP_STEP, left) + ' MORE (' + left + ' left)';
      else btn.parentNode.removeChild(btn);
    }
  }
  $('carOut').addEventListener('click', (ev) => { if (ev.target && ev.target.id === 'cmpMore') { ev.preventDefault(); moreComplaints(); } });

  $('carForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const out = $('carOut');
    let vin = $('carVin').value.trim().toUpperCase(), year = $('carYear').value.trim(), make = $('carMake').value.trim(), model = $('carModel').value.trim();
    let decoded = '';
    if (vin) {
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) { out.innerHTML = '<p class="help">A VIN is 17 letters and numbers (never I, O or Q).</p>'; return; }
      out.innerHTML = '<p class="help">Decoding the VIN with NHTSA…</p>';
      try {
        const v = ((await getJson('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/' + vin + '?format=json')).Results || [])[0] || {};
        if (!v.ModelYear || !v.Make || !v.Model) { out.innerHTML = '<p class="help">NHTSA couldn’t decode that VIN to a year, make and model. Check it, or enter them below it.</p>'; return; }
        year = v.ModelYear; make = v.Make; model = v.Model;
        const facts = [];
        if (v.BodyClass) facts.push(['Body', v.BodyClass]);
        if (v.DisplacementL && isFinite(+v.DisplacementL)) facts.push(['Engine', (+v.DisplacementL).toFixed(1) + ' liter' + (v.EngineCylinders ? ', ' + v.EngineCylinders + ' cylinders' : '')]);
        if (v.FuelTypePrimary) facts.push(['Fuel', v.FuelTypePrimary]);
        if (v.DriveType) facts.push(['Drive', v.DriveType]);
        if (v.PlantCity) facts.push(['Built in', words(v.PlantCity).replace(/(^|\s)\S/g, (c) => c.toUpperCase()) + (v.PlantCountry ? ', ' + words(v.PlantCountry).replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : '')]);
        decoded = `<div class="card"><b>${esc([year, make, model, v.Trim].filter(Boolean).join(' '))}</b>
          ${facts.map((f) => `<div class="row"><span class="lbl">${esc(f[0])}:</span> ${esc(f[1])}</div>`).join('')}
          <p class="src">VIN ${esc(vin)}, decoded by NHTSA. The recalls below are for every ${esc(year + ' ' + make + ' ' + model)}. To see whether this exact car still has one that hasn’t been fixed, enter the VIN on ${ext('https://www.nhtsa.gov/recalls', 'NHTSA’s recall page')}.</p></div>`;
      } catch (e) { out.innerHTML = '<p class="help">Couldn’t reach NHTSA right now. Try again in a minute.</p>'; return; }
    }
    if (!/^(19|20)\d\d$/.test(year) || !make || !model) { out.innerHTML = '<p class="help">Enter a VIN, or the year, make and model.</p>'; return; }
    out.innerHTML = decoded + '<p class="help">Reading NHTSA records…</p>';
    const q = `make=${enc(make)}&model=${enc(model)}&modelYear=${enc(year)}`;
    const page = nhtsaVehicle(year, make, model);
    const [rec, comp, rat] = await Promise.all([`${NHTSA}/recalls/recallsByVehicle?${q}`, `${NHTSA}/complaints/complaintsByVehicle?${q}`,
      `${NHTSA}/SafetyRatings/modelyear/${enc(year)}/make/${enc(make)}/model/${enc(model)}`].map((u) => getJson(u).catch(() => null)));
    const title = esc(`${year} ${make} ${model}`);
    let html = decoded;
    html += `<div class="links top">${ext(page, 'The ' + year + ' ' + make + ' ' + model + ' on NHTSA')}</div>`;
    // recalls
    const recs = rec ? (rec.results || []) : [];
    html += `<h2>RECALLS${rec ? ' (' + recs.length + ')' : ''}</h2>`;
    if (!rec) html += `<p class="help">Couldn’t read recalls right now.</p>`;
    else if (!recs.length) html += `<p class="help">NHTSA lists no recalls for the ${title}. (If the model name doesn’t match NHTSA’s spelling it finds nothing, so a VIN is surer.)</p>`;
    else html += recs.map(recallCard).join('');
    // complaints: counted from the records, then the owners' own words, newest first
    html += `<h2>OWNER COMPLAINTS</h2>`;
    cmpList = []; cmpShown = 0;
    if (!comp) html += `<p class="help">Couldn’t read complaints right now.</p>`;
    else {
      const list = (comp.results || []).slice().sort((a, b) => complaintSort(b.dateComplaintFiled) - complaintSort(a.dateComplaintFiled));
      if (!list.length) html += `<p class="help">NHTSA lists no owner complaints for the ${title}.</p>`;
      else {
        const sum = (k) => list.reduce((n, c) => n + (+c[k] || 0), 0), cnt = (k) => list.filter((c) => c[k]).length;
        const parts = {};
        list.forEach((c) => partList(c.components).forEach((p) => { parts[p] = (parts[p] || 0) + 1; }));
        const top = Object.keys(parts).sort((a, b) => parts[b] - parts[a]).slice(0, 5);
        html += `<div class="card"><b>${plural(list.length, 'complaint')} filed with NHTSA</b>
          <div class="row">Involving a crash: ${cnt('crash')} · Involving a fire: ${cnt('fire')}</div>
          <div class="row">Injuries reported: ${sum('numberOfInjuries')} · Deaths reported: ${sum('numberOfDeaths')}</div>
          <div class="row"><span class="lbl">Parts named most:</span> ${top.map((p) => esc(p) + ' (' + parts[p] + ')').join(', ')}</div>
          <div class="meta">These are owners’ own reports, in their own words. NHTSA doesn’t confirm them.</div></div>
          <h2>NEWEST FIRST</h2><div id="cmpList"></div>${list.length > CMP_STEP ? '<button class="go more" id="cmpMore" type="button">SHOW MORE</button>' : ''}`;
        cmpList = list;
      }
    }
    // crash tests
    html += `<h2>CRASH-TEST STARS</h2>`;
    if (!rat) html += `<p class="help">Couldn’t read crash-test ratings right now.</p>`;
    else if (!(rat.Results || []).length) html += `<p class="help">NHTSA has no crash-test ratings for the ${title}.</p>`;
    else {
      const det = await Promise.all(rat.Results.slice(0, 4).map((v) => getJson(`${NHTSA}/SafetyRatings/VehicleId/${v.VehicleId}`).then((j) => ({ v, r: (j.Results || [])[0] || {} }), () => ({ v, r: null }))));
      html += det.map(({ v, r }) => ratingCard(v, r, page)).join('');
    }
    html += `<p class="src">Read from NHTSA’s public records just now. Nothing here is scored, judged or added.</p>`;
    // value: no public source
    html += `<h2>PRICE &amp; VALUE</h2><div class="lookup"><b>${na('Not available here')}</b><span>There’s no free public record of what a used car is worth, so this page won’t show a number. Check it yourself: </span><div class="links">${ext('https://www.kbb.com/', 'Kelley Blue Book')}${ext('https://www.edmunds.com/', 'Edmunds')}${ext('https://www.jdpower.com/cars', 'J.D. Power')}</div></div>`;
    out.innerHTML = html;
    if (cmpList.length) moreComplaints();
  });

  // ---- CONTRACTORS and ANY BUSINESS: lookups that open on the source's own site.
  function lookup(name, what, href, how) {
    return `<div class="lookup"><b>${esc(name)} ↗</b><span>${esc(what)}${how ? ' ' + esc(how) : ''}</span><div class="links">${ext(href, 'Open ' + name)}</div></div>`;
  }
  function common(n, c) {
    return lookup('Better Business Bureau', 'BBB rating, accreditation and complaints filed with the BBB.', 'https://www.bbb.org/search?find_text=' + enc(n) + (c ? '&find_loc=' + enc(c) : ''), 'Opens with your search filled in.') +
      lookup('Google reviews', 'Customers’ own reviews and star average on Google Maps.', 'https://www.google.com/maps/search/?api=1&query=' + enc(n + (c ? ' ' + c : '')), 'Opens with your search filled in.') +
      lookup('Yelp reviews', 'Customers’ own reviews on Yelp.', 'https://www.yelp.com/search?find_desc=' + enc(n) + (c ? '&find_loc=' + enc(c) : ''), 'Opens with your search filled in.');
  }
  const NOTE = '<p class="src">This page doesn’t read these sites, so it can’t tell you what they say. BBB and the review sites don’t offer a free way for a page like this to read them, and Pennsylvania’s registries only answer people using their own search pages.</p>';
  function need(n, out) { if (n) return true; out.innerHTML = '<p class="help">Enter a name first.</p>'; return false; }
  $('homeForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const n = $('homeName').value.trim().slice(0, 80), c = $('homeCity').value.trim().slice(0, 60), out = $('homeOut');
    if (!need(n, out)) return;
    out.innerHTML = `<h2>CHECKS FOR “${esc(n)}”</h2>` +
      lookup('PA Home Improvement Contractor registration', 'Whether a home-improvement contractor is registered with the Pennsylvania Attorney General.', 'https://hicsearch.attorneygeneral.gov/', 'Type the name on that page.') +
      lookup('PA licensing (PALS)', 'For professions Pennsylvania licenses through its Department of State.', 'https://www.pals.pa.gov/', 'Search the name on that page.') +
      common(n, c) +
      `<h2>FAIR PRICE</h2><div class="lookup"><b>${na('Not available here')}</b><span>There’s no public record of what local home repairs cost, so this page won’t show a price range.</span></div>` + NOTE;
  });
  $('bizForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const n = $('bizName').value.trim().slice(0, 80), c = $('bizCity').value.trim().slice(0, 60), out = $('bizOut');
    if (!need(n, out)) return;
    out.innerHTML = `<h2>CHECKS FOR “${esc(n)}”</h2>` +
      lookup('PA business registry', 'Whether the business is registered in Pennsylvania, its status and when it was formed.', 'https://file.dos.pa.gov/search/business', 'Type the name on that page.') +
      common(n, c) +
      lookup('CFPB complaints', 'For banks, lenders, card companies and debt collectors: complaints filed with the federal Consumer Financial Protection Bureau.', 'https://www.consumerfinance.gov/data-research/consumer-complaints/search/?searchText=' + enc(n), 'Opens with your search filled in.') + NOTE;
  });
  // open the area from #food etc., else the last one used (after everything above is set up)
  let first = (location.hash || '').slice(1);
  if (AREAS.indexOf(first) < 0) { try { first = localStorage.getItem('risingcode_lookup_area') || ''; } catch (e) {} }
  show(AREAS.indexOf(first) < 0 ? 'food' : first);
})();
