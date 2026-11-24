// EARTH (Nov 24, 2026): a screensaver choice. The globe drawn in rising code, after an idea
// William got from Grok, with Claude's own touches:
//   - real continents (a 2-degree land map built in), oceans blue, land green, ice white
//   - the code RISES, like the rest of Rising Code, clipped to the sphere
//   - the real day and night: the sunlit half is bright and the night half dim, with the
//     terminator where it actually is right now (from the date and time)
//   - a starfield behind, and a thin blue atmosphere rim
//   - V61: the night side kept readable under a deep blue glow (blue marble, V64), with city lights
//     glowing where the people are (lights.js, from real city populations)
//   - V62: Starcloud-1, the first data center in space, on its real orbit (sat.js)
//   - flying through a dust cloud: dust and tumbling rocks in every direction (debris.js)
(() => {
  const MW = 180, MH = 90;
  const MASK_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwAfvAAAAAAAAAAAAAAAAAAAAAAAAx37///+AAAAAGoABAAAAAAAAAAAAAIe8P///wAA8AAAAAA0AAAAAAAAAAAwADw////4AAIAAAAAAHAAAAAAAAAAALivwAf//wAAAAADAAP/wAHIAAAAAADsj38AH/+gAAAAAEAH///OAAAAgBgAAfw3/gB/+gAAAgAMHe///+/9gBAP/7/nbdrwD/+AAAH/Ag7H////////8H//////g8H/gAAAf/6//f////////Mf/////9H4D4A+AA+ev///////////AP/////4A0B4AAAD5/////////////Af1////gHgA4AAAP5///////////LwAHgD///gH0AAAAAG4/////////+AMAABAC///4D+AAAAGCx/////////4A4AAAAB////n/gAAAOCR/////////4A4AAAAAf///3/wAAAbH//////////9AgAAAAAP/////gAAADf//////////9AAAAAAAF////0YAAAB///////////8AAAAAAAD////8EAAAB///v///////5AAAAAAAD////+AAAAB/f5f///////wAAAAAAAD////gAAAAfxnwP///////jgAAAAAAD///+AAAAAPCb3///////+AAAAAAAAD///8AAAAAfCJf//////+ECAAAAAAAB///8AAAAAGDRf///////mMAAAAAAAA///8AAAAAH+Ai///////E8AAAAAAAAf//wAAAAAP/AA///////BgAAAAAAAAP//gAAAAAf/73///////gAAAAAAAAAD/AQAAAAAf//9/f/////gAAAAAAAAAF+AQAAAAB///+/n/////AAAAAAAAAAC+AAAAAAB///+fwH///+AAAAAAAAAAAeAwAAAAD////f/D///8gAAAAAAAAAAeGEAAAAD////v+B/j/AAAAAAAAAAAAPMAwAAAD////n+AfB+gAAAAAAAAAAAD8AAAAAD////34AeBfAgAAAAAAAAAAAPAAAAAH////3gAcAfAgAAAAAAAAAAADAAAAAD////6AAcAfgwAAAAAAAAAAABBwAAAD////8wAMATAIAAAAAAAAAAAAr/AAAB/////gAIASAAAAAAAAAAAAAAH/gAAA/////gACAAAIAAAAAAAAAAAAH/8AAAYH///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAUOAAAAAAAAAAAAAP/+AAAAB//8AAAAc+gAAAAAAAAAAAAP//gAAAD//4AAAAMeBgAAAAAAAAAAAP//8AAAB//wAAAAGdCuAAAAAAAAAAAf///AAAA//wAAAACAAHgAAAAAAAAAAP///gAAA//wAAAAB4AHggAAAAAAAAAH///AAAAf/wAAAAACIDQIAAAAAAAAAH//+AAAAf/wAAAAAAAAAAAAAAAAAAAD//+AAAA//wgAAAAABxAAAAAAAAAAAD//8AAAA//wgAAAAAHxgBAAAAAAAAAA//8AAAA//zgAAAAAf/gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAAf/DAAAAAD//4CAAAAAAAAAAf/wAAAAf/DAAAAAH//4AAAAAAAAAAAf/AAAAAf+DAAAAAH//8AAAAAAAAAAAf/AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAA/8AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAHwAAAAAADwf8AAAAAAAAAAA/gAAAAAAAAAAAAACAP4AAAAAAAAAAB/wAAAAAAAAAAAAAAAD4AEAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB6AAAAAAAAAAAAAAAAAwAMAAAAAAAAA8AAAAAAAAAAAAAAAAAQAYAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAACAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAA8AAf/8d/AAAAAAAAAAAAkAAAAAAACP/+H//////AAAAAAAAAAA+AAAAIf////+////////AAAAAAAOMKPAAAB///////////////gAAAH/8D//8AAAH//////////////4AAAF/////8AAAP///////////////4AAIf/////gwBwf///////////////4AAAH//////AAD////////////////wAAA///////+f//////////////////A/wH///////////////////////////////////////////////////////////////////////////////////////';
  const bits = Uint8Array.from(atob(MASK_B64), c => c.charCodeAt(0));
  const land = (lat, lon) => {
    const r = Math.min(MH - 1, Math.max(0, Math.floor((90 - lat) / 2))), c = ((Math.floor((lon + 180) / 2) % MW) + MW) % MW;
    const i = r * MW + c; return (bits[i >> 3] >> (7 - (i & 7))) & 1;
  };
  const HOME = { lat: 40.8473, lon: -77.6858 };
  const KANA = Array.from({ length: 0xFF9D - 0xFF66 + 1 }, (_, i) => String.fromCharCode(0xFF66 + i));
  const GL = KANA.concat('0123456789'.split(''));
  const pick = () => GL[(Math.random() * GL.length) | 0];
  const TILT = 23.4 * Math.PI / 180;
  let ctx, W = 0, H = 0, cell = 10, cols = 0, rows = 0, streams = [], stars = [], spin = 0, t = 0, glyph = [];

  function resize(w, h) {
    W = w; H = h; cell = Math.max(8, Math.round(Math.min(W, H) / 70));
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    streams = Array.from({ length: cols }, () => ({ head: Math.random() * rows * 1.5, speed: 0.12 + Math.random() * 0.25, len: 12 + ((Math.random() * 28) | 0) }));
    glyph = Array.from({ length: cols * (rows + 1) }, pick);
    if (window.Debris) Debris.resize(W, H);
    stars = Array.from({ length: Math.round(W * H / 4000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6.3 }));
  }

  // The sun right now, as a direction from Earth's center: its latitude from the day of the
  // year (the seasons) and its longitude from the clock (noon where it's overhead).
  function sunNow() {
    const d = new Date(), N = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
    const decl = -23.44 * Math.cos(2 * Math.PI / 365 * (N + 10)) * Math.PI / 180;
    const lon = -15 * (d.getUTCHours() + d.getUTCMinutes() / 60 - 12) * Math.PI / 180;
    return [Math.cos(decl) * Math.sin(lon), Math.sin(decl), Math.cos(decl) * Math.cos(lon)];
  }
  const vec = (lat, lon) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  // World to view: turn to the longitude facing us, then tip the north pole toward us.
  function toView(lat, lon) {
    const [x, y, z] = vec(lat, lon - spin);
    return [x, y * Math.cos(TILT) - z * Math.sin(TILT), y * Math.sin(TILT) + z * Math.cos(TILT)];
  }

  // The city lights themselves (V61): a fine dot for every lit 1-degree square on the night
  // side, brighter for bigger places, with a soft glow around the biggest. They fade in across
  // the line between day and night, the way the lights come on at dusk.
  // A deep blue glow over the dark half, the blue marble at night (V61, blue since V64): worked out on a small
  // 64 by 64 map of the globe a few times a second, then drawn smooth under the code.
  let glowMap = null, glowAge = 0;
  function nightGlow(cx, cy, R, sun) {
    const N = 64;
    if (!glowMap) { glowMap = document.createElement('canvas'); glowMap.width = glowMap.height = N; glowAge = 0; }
    if (glowAge-- <= 0) {
      glowAge = 15;
      const g = glowMap.getContext('2d'), img = g.createImageData(N, N), cT = Math.cos(TILT), sT = Math.sin(TILT);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const nx = (i + 0.5) / N * 2 - 1, ny = 1 - (j + 0.5) / N * 2, q = Math.min(1, nx * nx + ny * ny), nz = Math.sqrt(1 - q);
        const wy = ny * cT + nz * sT, wz = -ny * sT + nz * cT;
        const lat = Math.asin(Math.max(-1, Math.min(1, wy))), lon = Math.atan2(nx, wz) + spin;
        const n = vec(lat, lon), light = n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2];
        const night = 1 - Math.max(0, Math.min(1, (light + 0.08) / 0.16)), k = (j * N + i) * 4;
        img.data[k] = 10; img.data[k + 1] = 34; img.data[k + 2] = 78; img.data[k + 3] = 255 * night * (0.45 + 0.4 * nz);
      }
      g.putImageData(img, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.drawImage(glowMap, cx - R, cy - R, R * 2, R * 2);
  }
  function cityLights(cx, cy, R, sun) {
    if (!window.CityLights) return;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.clip();
    for (const s of CityLights.spots) {
      const v = toView(s.lat, s.lon); if (v[2] < 0.04) continue;
      const n = vec(s.lat, s.lon), light = n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2];
      const night = 1 - Math.max(0, Math.min(1, (light + 0.08) / 0.16)); if (night < 0.05) continue;
      const x = cx + v[0] * R, y = cy - v[1] * R, b = s.b, edge = 0.45 + 0.55 * v[2];
      ctx.globalAlpha = Math.min(1, night * edge * (0.4 + 0.8 * b)); ctx.fillStyle = b > 0.6 ? '#fffaf0' : '#ffe6bc';
      const d = (1.2 + 3.2 * b * b) * edge; ctx.fillRect(x - d / 2, y - d / 2, d, d);
      if (b > 0.6) { ctx.globalAlpha = night * edge * 0.16; ctx.fillStyle = '#ffdca0'; ctx.beginPath(); ctx.arc(x, y, d * 2.6, 0, 6.3); ctx.fill(); }
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function draw() {
    t++; spin -= 0.0005;                          // one turn in about 7 minutes, eastward like the real thing
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42, sun = sunNow();
    for (const s of stars) {
      if (Math.hypot(s.x - cx, s.y - cy) < R * 1.05) continue;
      ctx.globalAlpha = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(t / 50 + s.p)); ctx.fillStyle = '#dfe8f5';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    if (window.Debris) Debris.back(ctx);
    // A thin blue atmosphere around the globe.
    const g = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.12);
    g.addColorStop(0, 'rgba(70,150,230,0.35)'); g.addColorStop(1, 'rgba(70,150,230,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#02060b'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.fill();
    ctx.font = `${cell}px ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const cT = Math.cos(TILT), sT = Math.sin(TILT);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.clip();
    nightGlow(cx, cy, R, sun);
    for (let c = 0; c < cols; c++) {
      const x = c * cell + cell / 2, nx = (x - cx) / R; if (Math.abs(nx) > 1) continue;
      const st = streams[c], headRow = Math.floor(st.head);
      for (let r = 0; r <= rows; r++) {
        const y = r * cell + cell / 2, ny = (cy - y) / R, q = nx * nx + ny * ny; if (q > 1) continue;
        const nz = Math.sqrt(1 - q);
        // Back from the view to the globe: latitude and longitude under this spot.
        const wy = ny * cT + nz * sT, wz = -ny * sT + nz * cT;
        const lat = Math.asin(Math.max(-1, Math.min(1, wy))), lon = Math.atan2(nx, wz) + spin;
        const latD = lat * 180 / Math.PI, lonD = ((lon * 180 / Math.PI + 540) % 360) - 180;
        const isLand = land(latD, lonD), ice = (isLand && Math.abs(latD) > 62) || Math.abs(latD) > 78;
        const n = vec(lat, lon), light = n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2];
        const day = Math.max(0, Math.min(1, (light + 0.08) / 0.16));      // a soft line between day and night
        const k = r - headRow, inTrail = k >= 0 && k < st.len, fade = inTrail ? 1 - k / st.len : 0;
        // Land and ice stand out even between streams, so the continents always read.
        // Night vision (V61): the dark side stays readable in phosphor green instead of fading out,
        // and where there are cities the code lights up.
        const night = 1 - day, nv = night > 0.5;
        let a = ((isLand || ice ? 0.68 : nv ? 0.26 : 0.15) + 0.7 * fade * fade) * (0.55 + 0.45 * nz) * (0.38 + 0.62 * day);
        const city = night > 0.05 && window.CityLights ? CityLights.at(latD, lonD) * night : 0;
        if (city > 0.04) a = Math.max(a, (0.3 + 0.7 * city) * (0.6 + 0.4 * nz));
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = k === 0 ? '#ffffff' : city > 0.04 ? (city > 0.5 ? '#fff6e0' : '#ffe2b0')
          : nv ? (ice ? '#d6e6ff' : isLand ? '#46d884' : '#3a7fd8') : ice ? '#e6f2ff' : isLand ? '#46d884' : '#3f8fe0';
        ctx.fillText(glyph[r * cols + c], x, y);
      }
      st.head -= st.speed;
      if (st.head + st.len < 0) { st.head = rows + Math.random() * rows * 0.5; st.speed = 0.12 + Math.random() * 0.25; st.len = 12 + ((Math.random() * 28) | 0); }
    }
    ctx.restore();
    for (let i = 0; i < 20; i++) glyph[(Math.random() * glyph.length) | 0] = pick();
    cityLights(cx, cy, R, sun);
    if (window.Orbiter) Orbiter.draw(ctx, cx, cy, R, toView);   // V62: Starcloud-1, the data center in orbit (sat.js)
    if (window.Debris) Debris.front(ctx);
    ctx.globalAlpha = 1;
  }

  window.EarthSaver = {
    start(c) { ctx = c; },
    resize,
    draw() { if (ctx && W) draw(); },
    face(lonDeg) { spin = lonDeg * Math.PI / 180; },   // for checking: turn a given longitude toward the viewer
  };
  spin = HOME.lon * Math.PI / 180;               // starts with North America in view (V51: no hometown marker)
})();
