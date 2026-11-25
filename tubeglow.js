// TUBE GLOW (Nov 25, 2026, V108): the radio's dial window lit the way old tube radios were,
// from behind, by the tubes themselves. The dial glass is a warm parchment that only shows
// where light reaches it: three tubes sit behind it at different distances, so there are
// brighter warm pools and dimmer stretches between them, darker toward the edges, with a
// faint sheen on the glass. When the radio is off, the tubes cool and the window goes dark
// (a dim ember for a moment, then just the dark glass). Drawn under the scale and the needle.
(() => {
  // Where the tubes sit behind the glass: across (0..1), how far down, how big, how strong.
  const TUBES = [{ x: 0.2, y: 0.8, r: 0.3, k: 0.95 }, { x: 0.53, y: 1.1, r: 0.36, k: 0.7 }, { x: 0.85, y: 0.75, r: 0.26, k: 0.85 }];
  let warm = 0, last = 0;                          // 0 cold .. 1 fully warmed up; tubes take a moment either way
  function paint(c, W, H, on, now = performance.now()) {
    const dt = last ? Math.min(0.2, (now - last) / 1000) : 0.2; last = now;
    warm += ((on ? 1 : 0) - warm) * Math.min(1, dt * (on ? 1.2 : 2.5));
    c.fillStyle = '#120c06'; c.fillRect(0, 0, W, H);                              // the dark glass
    c.fillStyle = `rgba(120,70,26,${0.42 * warm})`; c.fillRect(0, 0, W, H);       // a little light reaches everywhere
    const flick = 1 + Math.sin(now / 370) * 0.012 + Math.sin(now / 1130) * 0.01;  // barely there, like a filament
    for (const t of TUBES) {
      const R = t.r * W, g = c.createRadialGradient(t.x * W, t.y * H, 0, t.x * W, t.y * H, R);
      const a = t.k * warm * flick;
      g.addColorStop(0, `rgba(255,218,150,${0.95 * a})`);
      g.addColorStop(0.3, `rgba(240,168,78,${0.6 * a})`);
      g.addColorStop(0.7, `rgba(140,72,22,${0.2 * a})`);
      g.addColorStop(1, 'rgba(60,30,10,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    c.globalCompositeOperation = 'source-over';
    const v = c.createLinearGradient(0, 0, W, 0);                                 // darker toward the ends
    v.addColorStop(0, 'rgba(0,0,0,0.55)'); v.addColorStop(0.12, 'rgba(0,0,0,0)'); v.addColorStop(0.88, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    const s = c.createLinearGradient(0, 0, 0, H);                                 // a faint sheen on the glass
    s.addColorStop(0, 'rgba(255,255,255,0.10)'); s.addColorStop(0.35, 'rgba(255,255,255,0.02)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = s; c.fillRect(0, 0, W, H);
    return warm;
  }
  window.TubeGlow = { paint, warming: () => Math.abs(warm - Math.round(warm)) > 0.01 };
})();
