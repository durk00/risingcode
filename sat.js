// THE DATA CENTER IN ORBIT (Nov 24, 2026, V62): Starcloud-1, the first data center in space
// (a 60 kg satellite carrying an NVIDIA H100, launched by SpaceX on November 2, 2025), tracked
// on its real orbit around the Earth screensaver: a short white line with its name on top.
//
// Where it is comes from its published orbit (NORAD 66303). The page asks CelesTrak for the
// newest orbit twice a day and keeps it on the device; if that can't be reached it uses the
// orbit built in below (from November 24, 2026). From the orbit it works out the position with
// the main effects: the orbit's slow turn from Earth's bulge (J2) and the slow drop from drag.
// That stays within a few hundred kilometers for days, which is far finer than the globe shows.
(() => {
  const NORAD = 66303, KEY = 'risingcode_sat', NAME = 'STARCLOUD-1';
  // Built-in orbit, epoch 2026 day 328.04827880 (Nov 24, 01:09 UTC).
  let el = { epoch: Date.UTC(2026, 0, 1) + (328.04827880 - 1) * 864e5, inc: 45.4015, raan: 341.1931, ecc: 0.0004937,
    argp: 224.4469, M: 135.6023, n: 15.22758611, ndot2: 0.00003720 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.epoch > el.epoch) el = s; } catch (e) {}

  async function refresh() {
    try {
      const r = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${NORAD}&FORMAT=json`);
      const j = (await r.json())[0];
      const e = { epoch: Date.parse(j.EPOCH + 'Z'), inc: +j.INCLINATION, raan: +j.RA_OF_ASC_NODE, ecc: +j.ECCENTRICITY,
        argp: +j.ARG_OF_PERICENTER, M: +j.MEAN_ANOMALY, n: +j.MEAN_MOTION, ndot2: +j.MEAN_MOTION_DOT };
      if (e.epoch > el.epoch && e.n > 10) { el = e; try { localStorage.setItem(KEY, JSON.stringify(e)); } catch (x) {} }
    } catch (e) { /* keep the orbit we have */ }
  }
  refresh(); setInterval(refresh, 12 * 3600e3);

  const D = Math.PI / 180, MU = 398600.4418, RE = 6378.137, J2 = 1.08263e-3;
  // Latitude, longitude (radians) and height (km) at a moment.
  function where(t = Date.now()) {
    const dt = (t - el.epoch) / 864e5;                                 // days since the orbit was measured
    const n = el.n + 2 * el.ndot2 * dt;                                // revolutions a day, rising as drag lowers it
    const nRad = n * 2 * Math.PI / 86400, a = Math.cbrt(MU / (nRad * nRad)), i = el.inc * D;
    const p = a * (1 - el.ecc * el.ecc), k = 1.5 * J2 * (RE / p) ** 2 * nRad * 86400;   // per day
    const raan = el.raan * D - k * Math.cos(i) * dt;
    const argp = el.argp * D + 0.5 * k * (5 * Math.cos(i) ** 2 - 1) * dt;
    const M = el.M * D + 2 * Math.PI * (el.n * dt + el.ndot2 * dt * dt);
    const E = M + el.ecc * Math.sin(M), nu = E + el.ecc * Math.sin(E);   // nearly round, so this is plenty
    const u = argp + nu, r = a * (1 - el.ecc * Math.cos(E));
    const x = r * (Math.cos(raan) * Math.cos(u) - Math.sin(raan) * Math.sin(u) * Math.cos(i));
    const y = r * (Math.sin(raan) * Math.cos(u) + Math.cos(raan) * Math.sin(u) * Math.cos(i));
    const z = r * Math.sin(u) * Math.sin(i);
    const jd = t / 864e5 + 2440587.5, gmst = ((280.46061837 + 360.98564736629 * (jd - 2451545)) % 360) * D;
    let lon = Math.atan2(y, x) - gmst; lon = Math.atan2(Math.sin(lon), Math.cos(lon));
    return { lat: Math.asin(z / r), lon, alt: r - 6371 };
  }

  // Drawn on the Earth screensaver. toView turns a latitude and longitude into the globe's view
  // (x right, y up, z toward us, on a unit globe).
  function draw(ctx, cx, cy, R, toView) {
    const now = where(), soon = where(Date.now() + 20e3), k = 1 + now.alt / 6371;
    const v = toView(now.lat, now.lon), w = toView(soon.lat, soon.lon);
    const x = v[0] * k, y = v[1] * k, z = v[2] * k;
    if (z < 0 && x * x + y * y < 1) return;                           // behind the Earth
    const sx = cx + x * R, sy = cy - y * R;
    let dx = (w[0] - v[0]) * R, dy = -(w[1] - v[1]) * R; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const half = Math.max(7, R * 0.028), fs = Math.max(10, Math.round(R * 0.04));
    ctx.save();
    ctx.globalAlpha = 0.95; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, R * 0.006); ctx.lineCap = 'round';
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(sx - dx * half, sy - dy * half); ctx.lineTo(sx + dx * half, sy + dy * half); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.font = `600 ${fs}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(NAME, sx, sy - half * 0.6 - 4);
    ctx.restore();
  }
  window.Orbiter = { where, draw, name: NAME, elements: () => el };
})();
