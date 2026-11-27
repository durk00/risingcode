// LOOK IT UP (V146): Shield's checks rebuilt with no AI model. Two kinds of result only:
//   READ HERE      a public record this page fetches and shows as it came, with its source
//                  named and linked (NHTSA for vehicles).
//   LOOK IT UP ↗   a source that won't let a web page read it (BBB, review sites, Pennsylvania's
//                  contractor and business registries). We open it on its own site with the
//                  search filled in where its address allows, and never claim a result.
// Anything with no public source (a fair price, a car's value) says "not available here".
// V151: no separate Restaurants area. Restaurants are looked up under ANY BUSINESS (BBB, Google,
//   Yelp, PA registry), #food opens ANY BUSINESS.
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

  // ---- areas: tap one to open it; the pick is remembered, and #car etc. opens one directly
  const AREAS = ['car', 'home', 'biz'];
  function show(a) {
    if (AREAS.indexOf(a) < 0) return;
    document.querySelectorAll('.area').forEach((b) => b.classList.toggle('on', b.getAttribute('data-area') === a));
    AREAS.forEach((x) => $(x).classList.toggle('on', x === a));
    try { localStorage.setItem('risingcode_lookup_area', a); } catch (e) {}
  }
  document.querySelectorAll('.area').forEach((b) => b.addEventListener('click', () => show(b.getAttribute('data-area'))));

  // ---- VEHICLES: NHTSA's public APIs (no key, readable by a page): vPIC decodes a VIN,
  // then recalls, owner complaints and NCAP crash-test stars for that year, make and model.
  const NHTSA = 'https://api.nhtsa.gov';
  const nhtsaDate = (s) => { const m = /^(\d\d)\/(\d\d)\/(\d{4})/.exec(s || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (s || ''); };
  const stars = (v) => /^[1-5]$/.test(v || '') ? '★'.repeat(+v) + '☆'.repeat(5 - v) + ' (' + v + ' of 5)' : na('Not rated');
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
        decoded = `<div class="card"><b>${esc([year, make, model, v.Trim].filter(Boolean).join(' '))}</b><div class="meta">${esc([v.BodyClass, v.DisplacementL ? (+v.DisplacementL).toFixed(1) + ' L' : '', v.FuelTypePrimary, v.PlantCity ? 'built in ' + v.PlantCity + (v.PlantCountry ? ', ' + v.PlantCountry : '') : ''].filter(Boolean).join(' · '))}</div>
          <p class="src">Decoded by NHTSA vPIC (${ext('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/' + vin + '?format=json', 'record')}). Recalls below are for every ${esc(year + ' ' + make + ' ' + model)}; whether this exact car still has one open is a VIN check on ${ext('https://www.nhtsa.gov/recalls', 'NHTSA’s recall page')}.</p></div>`;
      } catch (e) { out.innerHTML = '<p class="help">Couldn’t reach NHTSA right now. Try again in a minute.</p>'; return; }
    }
    if (!/^(19|20)\d\d$/.test(year) || !make || !model) { out.innerHTML = '<p class="help">Enter a VIN, or the year, make and model.</p>'; return; }
    out.innerHTML = decoded + '<p class="help">Reading NHTSA records…</p>';
    const q = `make=${enc(make)}&model=${enc(model)}&modelYear=${enc(year)}`;
    const recallsUrl = `${NHTSA}/recalls/recallsByVehicle?${q}`, compUrl = `${NHTSA}/complaints/complaintsByVehicle?${q}`, ratUrl = `${NHTSA}/SafetyRatings/modelyear/${enc(year)}/make/${enc(make)}/model/${enc(model)}`;
    const [rec, comp, rat] = await Promise.all([recallsUrl, compUrl, ratUrl].map((u) => getJson(u).catch(() => null)));
    const title = esc(`${year} ${make} ${model}`);
    let html = decoded;
    // recalls
    html += `<h2>RECALLS</h2>`;
    if (!rec) html += `<p class="help">Couldn’t read recalls right now.</p>`;
    else if (!(rec.results || []).length) html += `<p class="help">NHTSA lists no recalls for the ${title}. (If the model name doesn’t match NHTSA’s spelling it finds nothing, so a VIN is surer.)</p>`;
    else html += rec.results.map((x) => `<div class="card"><b>${esc(x.Component || 'Recall')}</b><div class="meta">NHTSA campaign ${esc(x.NHTSACampaignNumber)} · reported ${esc(nhtsaDate(x.ReportReceivedDate))}${x.parkIt ? ' · PARK IT: don’t drive' : ''}${x.parkOutSide ? ' · PARK OUTSIDE' : ''}</div>
      <div class="row">${esc(x.Summary)}</div>${x.Remedy ? `<div class="row">Remedy: ${esc(x.Remedy)}</div>` : ''}</div>`).join('');
    html += `<p class="src">Source: NHTSA recalls (${ext(recallsUrl, 'record')}).</p>`;
    // complaints: counted from the records, not judged
    html += `<h2>OWNER COMPLAINTS</h2>`;
    if (!comp) html += `<p class="help">Couldn’t read complaints right now.</p>`;
    else {
      const list = comp.results || [];
      if (!list.length) html += `<p class="help">NHTSA lists no owner complaints for the ${title}.</p>`;
      else {
        const sum = (k) => list.reduce((n, c) => n + (+c[k] || 0), 0), cnt = (k) => list.filter((c) => c[k]).length;
        const parts = {};
        list.forEach((c) => String(c.components || 'UNKNOWN').split(',').forEach((p) => { p = p.trim(); if (p) parts[p] = (parts[p] || 0) + 1; }));
        const top = Object.keys(parts).sort((a, b) => parts[b] - parts[a]).slice(0, 5);
        html += `<div class="card"><b>${list.length} complaint${list.length === 1 ? '' : 's'} filed with NHTSA</b>
          <div class="row">Involving a crash: ${cnt('crash')} · a fire: ${cnt('fire')} · injuries reported: ${sum('numberOfInjuries')} · deaths reported: ${sum('numberOfDeaths')}</div>
          <div class="row">Most-named parts: ${top.map((p) => esc(p.toLowerCase()) + ' (' + parts[p] + ')').join(', ')}</div>
          <div class="meta">These are owners’ own reports, not findings. NHTSA doesn’t confirm them.</div></div>`;
      }
      html += `<p class="src">Source: NHTSA complaints (${ext(compUrl, 'record')}).</p>`;
    }
    // crash tests
    html += `<h2>CRASH-TEST STARS (NCAP)</h2>`;
    if (!rat) html += `<p class="help">Couldn’t read crash-test ratings right now.</p>`;
    else if (!(rat.Results || []).length) html += `<p class="help">NHTSA has no crash-test ratings for the ${title}.</p>`;
    else {
      const det = await Promise.all(rat.Results.slice(0, 4).map((v) => getJson(`${NHTSA}/SafetyRatings/VehicleId/${v.VehicleId}`).then((j) => ({ v, r: (j.Results || [])[0] || {} }), () => ({ v, r: null }))));
      html += det.map(({ v, r }) => `<div class="card"><b>${esc(v.VehicleDescription)}</b>${r ? `
        <div class="row">Overall: ${stars(r.OverallRating)}</div><div class="row">Front crash: ${stars(r.OverallFrontCrashRating)} · Side crash: ${stars(r.OverallSideCrashRating)} · Rollover: ${stars(r.RolloverRating)}</div>` : '<div class="row">Couldn’t read this rating.</div>'}
        <p class="src">Source: NHTSA NCAP (${ext(`${NHTSA}/SafetyRatings/VehicleId/${v.VehicleId}`, 'record')}).</p></div>`).join('');
    }
    // value: no public source
    html += `<h2>PRICE &amp; VALUE</h2><div class="lookup"><b>${na('Not available here')}</b><span>There’s no free public record of what a used car is worth, so this page won’t show a number. Check it yourself: </span><div class="links">${ext('https://www.kbb.com/', 'Kelley Blue Book')}${ext('https://www.edmunds.com/', 'Edmunds')}${ext('https://www.jdpower.com/cars', 'J.D. Power')}</div></div>`;
    out.innerHTML = html;
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
  // open the area from #car etc., else the last one used (after everything above is set up)
  let first = (location.hash || '').slice(1);
  if (AREAS.indexOf(first) < 0 && first !== 'food') { try { first = localStorage.getItem('risingcode_lookup_area') || ''; } catch (e) {} }
  if (first === 'food') first = 'biz';   // old links, or a saved pick, of the Restaurants area
  show(AREAS.indexOf(first) < 0 ? 'car' : first);
})();
