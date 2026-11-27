// WEATHER RIGHT NOW (Nov 24, 2026, V58): one place that reads what the nearby NOAA stations
// actually see, shared by the Winter scene and the Details console.
//
// Why: NOAA station readings often come with the words blank ("textDescription": ""), and the
// "latest" reading can be an old one. When that happened, Winter fell back to the forecast
// ("Chance Rain Showers" made rain fall on a clear morning) and Details fell back to the
// forecast's cloud cover ("Cloudy" under a clear sky). Now:
//   - the last several readings of up to 5 nearby stations are checked, newest first
//   - when a reading has no words, they are built from what the station measured: what's
//     falling (presentWeather) and the cloud layers (clear, few, scattered, broken, overcast)
//   - only a reading from the last 2 hours counts
(() => {
  const SKY = { SKC: 'Clear', CLR: 'Clear', FEW: 'Clear', SCT: 'Partly Cloudy', BKN: 'Mostly Cloudy', OVC: 'Cloudy', VV: 'Cloudy' };
  const RANK = { SKC: 0, CLR: 0, FEW: 1, SCT: 2, BKN: 3, OVC: 4, VV: 4 };
  // Words for one reading: NOAA's own if it gave any, otherwise built from the measurements.
  function describe(o) {
    if (!o) return '';
    if (o.textDescription && o.textDescription.trim()) return o.textDescription.trim();
    const pw = (o.presentWeather || []).map(p => (p.rawString || p.weather || '').toString().toLowerCase()).join(' ');
    if (pw) {
      const heavy = /\+|heavy/.test(pw) ? 'Heavy ' : /-|light/.test(pw) ? 'Light ' : '';
      if (/sn|snow/.test(pw) && /ra|rain/.test(pw)) return 'Rain And Snow';
      if (/sn|snow/.test(pw)) return heavy + 'Snow';
      if (/fzra|pl|sleet|freezing/.test(pw)) return 'Freezing Rain';
      if (/dz|drizzle/.test(pw)) return 'Drizzle';
      if (/ts|thunder/.test(pw)) return 'Thunderstorm';
      if (/ra|rain/.test(pw)) return heavy + 'Rain';
      if (/fg|fog/.test(pw)) return 'Fog';
      if (/br|mist/.test(pw)) return 'Mist';         // V147: mist (BR) is its own word now, so the scene's fog shows
      if (/hz|haze/.test(pw)) return 'Haze';
    }
    let top = null;
    for (const l of o.cloudLayers || []) if (l && l.amount in RANK && (top === null || RANK[l.amount] > RANK[top])) top = l.amount;
    return top ? SKY[top] : '';
  }
  // The newest reading with words (given or built) from the nearby stations, or null.
  async function latest(stationsUrl, maxAgeHrs = 2) {
    const st = await (await fetch(stationsUrl)).json();
    let best = null;
    for (const f of (st.features || []).slice(0, 5)) {
      try {
        const id = f.properties.stationIdentifier;
        const list = ((await (await fetch(`https://api.weather.gov/stations/${id}/observations?limit=8`)).json()).features || []).map(x => x.properties);
        for (const o of list) {
          const age = Date.now() - Date.parse(o.timestamp), words = describe(o);
          if (!words || !(age <= maxAgeHrs * 3600e3)) continue;
          if (!best || Date.parse(o.timestamp) > Date.parse(best.o.timestamp) + 30 * 60e3) best = { o, words, station: f.properties.name || id };
          break;                                   // this station's newest usable reading
        }
        if (best && Date.now() - Date.parse(best.o.timestamp) < 75 * 60e3) break;   // fresh enough: stop looking
      } catch (e) { /* try the next station */ }
    }
    return best;
  }
  window.WxNow = { describe, latest };
})();
