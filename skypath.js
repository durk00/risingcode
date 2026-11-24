// SUN AND MOON IN THE SKY (Nov 24, 2026, V68): where the sun and the moon really are, seen
// from this iPad's place (place.js), so the Winter scene can move them across the sky the way
// they actually go: up in the east (left), across the south, down in the west (right).
// Standard low-precision formulas (the sun to about a hundredth of a degree, the moon to
// about half a degree), plenty for a picture. Altitude and azimuth come back in degrees;
// azimuth counts from north, clockwise (east 90, south 180, west 270).
(() => {
  const D = Math.PI / 180;
  const days = (t) => t / 864e5 - 10957.5;                              // days since Jan 1, 2000, noon UTC
  function toHorizon(ra, dec, t, lat, lon) {
    const d = days(t), lst = (280.46061837 + 360.98564736629 * d + lon) * D;
    const H = lst - ra, phi = lat * D;
    const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
    const az = Math.atan2(-Math.cos(dec) * Math.sin(H), Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.cos(H) * Math.sin(phi));
    return { alt: alt / D, az: ((az / D) + 360) % 360 };
  }
  const EPS = 23.4393 * D;
  function fromEcliptic(l, b) {
    return { ra: Math.atan2(Math.sin(l) * Math.cos(EPS) - Math.tan(b) * Math.sin(EPS), Math.cos(l)),
             dec: Math.asin(Math.sin(b) * Math.cos(EPS) + Math.cos(b) * Math.sin(EPS) * Math.sin(l)) };
  }
  function sun(t, lat, lon) {
    const d = days(t), g = (357.529 + 0.98560028 * d) * D, q = 280.459 + 0.98564736 * d;
    const l = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D;
    const e = fromEcliptic(l, 0);
    return toHorizon(e.ra, e.dec, t, lat, lon);
  }
  function moon(t, lat, lon) {
    const d = days(t);
    const L = (218.316 + 13.176396 * d) * D, M = (134.963 + 13.064993 * d) * D, F = (93.272 + 13.229350 * d) * D;
    const Ms = (357.529 + 0.98560028 * d) * D, Dm = (297.850 + 12.190749 * d) * D;
    // The main wobbles of the moon's path (longitude and latitude).
    const l = L + (6.289 * Math.sin(M) + 1.274 * Math.sin(2 * Dm - M) + 0.658 * Math.sin(2 * Dm) + 0.214 * Math.sin(2 * M) - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F)) * D;
    const b = (5.128 * Math.sin(F) + 0.281 * Math.sin(M + F) + 0.278 * Math.sin(M - F)) * D;
    const e = fromEcliptic(l, b), h = toHorizon(e.ra, e.dec, t, lat, lon);
    h.alt -= 0.95 * Math.cos(h.alt * D);                                 // seen from the ground, not Earth's center
    return h;
  }
  window.SkyPath = { sun, moon };
})();
