// WHERE THIS iPAD IS (Nov 24, 2026, V66): so the weather, the alerts and the daylight are right
// for whoever is using the app anywhere in the US, not just Centre Hall.
//
// The first time, the iPad asks its own question: "Allow location?". If they allow it:
//   - the spot is rounded to about half a mile and kept on this device; it is only ever sent
//     to NOAA (api.weather.gov, the government weather service) to get that place's weather
//   - NOAA names the nearest town, and the screens say it ("NOAA · FRESNO")
//   - it's checked again each time the app starts, in case the iPad has moved
// If they say no, the spot is outside the US (NOAA only covers the US), or anything fails,
// it stays on Centre Hall, PA. Menu → LOCATION switches between "Where this iPad is" and
// "Centre Hall, PA".
(() => {
  const KEY = 'risingcode_place';
  const HOME = { lat: 40.8473, lon: -77.6858, name: 'CENTRE HALL', state: 'PA' };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  let mode = saved.mode === 'home' ? 'home' : 'here';
  let here = saved.here && isFinite(saved.here.lat) ? saved.here : null;
  let status = here ? 'ok' : 'checking';          // checking, ok, denied, outside, unavailable
  const listeners = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ mode, here })); } catch (e) {} };
  const cur = () => (mode === 'here' && here && status !== 'denied' && status !== 'outside' ? here : HOME);
  const changed = () => listeners.forEach(f => { try { f(cur()); } catch (e) {} });

  // Asks NOAA for the town nearest a spot; null if the spot isn't covered (outside the US).
  async function name(lat, lon) {
    const r = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    if (!r.ok) return null;
    const p = (await r.json()).properties || {}, rel = (p.relativeLocation && p.relativeLocation.properties) || {};
    return { city: String(rel.city || '').toUpperCase(), state: String(rel.state || '').toUpperCase() };
  }
  function locate() {
    if (mode !== 'here') return;
    if (!navigator.geolocation) { status = 'unavailable'; changed(); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = Math.round(pos.coords.latitude * 100) / 100, lon = Math.round(pos.coords.longitude * 100) / 100;
      const moved = !here || Math.abs(here.lat - lat) > 0.015 || Math.abs(here.lon - lon) > 0.015;
      if (!moved) { status = 'ok'; changed(); return; }
      try {
        const n = await name(lat, lon);
        if (!n) { status = 'outside'; changed(); return; }
        here = { lat, lon, name: n.city || 'YOUR AREA', state: n.state };
        status = 'ok'; save(); changed();
      } catch (e) { if (!here) status = 'unavailable'; changed(); }
    }, (err) => { status = err && err.code === 1 ? 'denied' : (here ? 'ok' : 'unavailable'); changed(); },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 6 * 3600e3 });
  }

  window.Place = {
    get lat() { return cur().lat; },
    get lon() { return cur().lon; },
    get name() { return cur().name; },
    get state() { return cur().state || ''; },     // V83: for the radio's local talk stations
    label() { const c = cur(); return c.state && c !== HOME ? `${c.name}, ${c.state}` : c.name; },
    mode: () => mode,
    status: () => status,
    set(m) { mode = m === 'home' ? 'home' : 'here'; save(); changed(); if (mode === 'here') locate(); },
    onChange(f) { listeners.push(f); },
    options: () => [
      { id: 'here', name: 'Where this iPad is', note: mode === 'here' ? ({ ok: here ? `NOW: ${here.name}${here.state ? ', ' + here.state : ''}` : 'CHECKING…', checking: 'CHECKING…', denied: 'LOCATION NOT ALLOWED · USING CENTRE HALL', outside: 'OUTSIDE THE US · USING CENTRE HALL', unavailable: 'CAN’T TELL · USING CENTRE HALL' }[status] || '') : 'US ONLY' },
      { id: 'home', name: 'Centre Hall, PA', note: 'ALWAYS' },
    ],
  };
  if (mode === 'here') locate();
})();
