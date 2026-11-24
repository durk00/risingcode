// CLOUDS (Nov 24, 2026, V65): ordinary cloud cover on the Earth screensaver, cloudy in some
// places and clear in others, at William's request. The clouds are made up (random, not
// tonight's real weather), but they behave like clouds:
//   - patches and swirls of different sizes, thicker in the stormy belts (around the equator
//     and in the middle latitudes) and thinner over the dry belts near 25 degrees
//   - they ride on the globe as it turns, drift slowly east with the winds, and change shape
//   - white in sunlight, dim gray-blue on the night side, and they dim the city lights below
// Worked out on a small map of the globe a few times a second, then drawn smooth over the code.
(() => {
  // Smooth random noise in three dimensions (value noise, several layers for detail).
  const P = new Uint8Array(512), V = new Float32Array(256);
  for (let i = 0; i < 256; i++) { P[i] = i; V[i] = Math.random(); }
  for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [P[i], P[j]] = [P[j], P[i]]; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const fade = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  function noise(x, y, z) {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = fade(x - X), fy = fade(y - Y), fz = fade(z - Z);
    const h = (i, j, k) => V[P[P[P[(X + i) & 255] + ((Y + j) & 255)] + ((Z + k) & 255)]];
    return lerp(lerp(lerp(h(0, 0, 0), h(1, 0, 0), fx), lerp(h(0, 1, 0), h(1, 1, 0), fx), fy),
                lerp(lerp(h(0, 0, 1), h(1, 0, 1), fx), lerp(h(0, 1, 1), h(1, 1, 1), fx), fy), fz);
  }
  function fbm(x, y, z) { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { s += a * noise(x * f, y * f, z * f); f *= 2.1; a *= 0.5; } return s / 0.96875; }

  const N = 144;
  let map = null, age = 0, t0 = performance.now();
  // How cloudy it is at a latitude and longitude (radians), 0 to 1, at time t (seconds).
  function cover(lat, lon, t) {
    const drift = lon - t * 0.004;                                      // the clouds move east, slowly
    const x = Math.cos(lat) * Math.cos(drift), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(drift);
    const n = fbm(x * 3.4 + 11, y * 3.4 + 5, z * 3.4 + t * 0.003);       // and slowly change shape
    const d = Math.abs(lat) * 180 / Math.PI;
    const belt = 0.06 * Math.exp(-((d - 0) ** 2) / 60) + 0.05 * Math.exp(-((d - 50) ** 2) / 200) - 0.06 * Math.exp(-((d - 25) ** 2) / 50);
    const v = n + belt;
    return Math.max(0, Math.min(1, (v - 0.53) / 0.2));
  }
  // Draws the clouds over the globe. view: the globe's turn (spin), tilt, the sun's direction,
  // and vec (latitude and longitude to a direction), the same ones Earth uses.
  function draw(ctx, cx, cy, R, view) {
    if (!map) { map = document.createElement('canvas'); map.width = map.height = N; }
    if (age-- <= 0) {
      age = 12;
      const t = (performance.now() - t0) / 1000, g = map.getContext('2d'), img = g.createImageData(N, N);
      const cT = Math.cos(view.tilt), sT = Math.sin(view.tilt), sun = view.sun;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const nx = (i + 0.5) / N * 2 - 1, ny = 1 - (j + 0.5) / N * 2, q = nx * nx + ny * ny, k = (j * N + i) * 4;
        if (q > 1.02) { img.data[k + 3] = 0; continue; }
        const nz = Math.sqrt(Math.max(0, 1 - q)), wy = ny * cT + nz * sT, wz = -ny * sT + nz * cT;
        const lat = Math.asin(Math.max(-1, Math.min(1, wy))), lon = Math.atan2(nx, wz) + view.spin;
        const c = cover(lat, lon, t); if (c <= 0) { img.data[k + 3] = 0; continue; }
        const n = view.vec(lat, lon), light = n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2];
        const day = Math.max(0, Math.min(1, (light + 0.08) / 0.16));
        // Sunlit cloud is near white; night cloud a dim blue-gray.
        img.data[k] = 70 + 180 * day; img.data[k + 1] = 82 + 172 * day; img.data[k + 2] = 110 + 145 * day;
        img.data[k + 3] = 255 * c * (0.22 + 0.3 * day) * (0.55 + 0.45 * nz);
      }
      g.putImageData(img, 0, 0);
    }
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.clip();
    ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.drawImage(map, cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
  }
  window.Clouds = { draw, cover };
})();
