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
  // V157 (Nov 27, 2026): how cloudy one reading is, 0 (clear) to 4 (overcast), or null if it can't tell.
  // Rain, snow or fog falling counts as overcast.
  function cloudRank(o, words) {
    let top = null;
    for (const l of (o && o.cloudLayers) || []) if (l && l.amount in RANK && (top === null || RANK[l.amount] > RANK[top])) top = l.amount;
    const w = (words || '').toLowerCase();
    if (/rain|snow|drizzle|shower|thunder|sleet|freezing|fog|mist/.test(w)) return 4;
    if (top !== null) return RANK[top];
    if (/mostly cloudy/.test(w)) return 3;
    if (/cloudy|overcast/.test(w)) return /partly/.test(w) ? 2 : 4;
    if (/clear|fair|sunny/.test(w)) return 0;
    return null;
  }
  const RANK_WORDS = ['Clear', 'Clear', 'Partly Cloudy', 'Mostly Cloudy', 'Cloudy'];
  // The newest reading with words (given or built) from the nearby stations, or null.
  // V157 (Nov 27, 2026, William's report: the scene showed a partly clear sky with the sun out while
  // it was overcast at the house): the State College airport's hourly readings came through blank,
  // so the one reading used was Reedsville's, over the ridge, which saw only scattered clouds while
  // State College, Clearfield, Selinsgrove and Williamsport all saw overcast or rain. One farther
  // station no longer decides the sky alone. Every nearby station's newest reading is read (at the
  // same time, so it's no slower), and the sky is the middle of what they all see (leaning cloudier
  // on a tie). The nearest station still decides the sky on its own when it has a fresh reading with
  // real cloud layers. What's falling still comes from the reading used, as before.
  async function latest(stationsUrl, maxAgeHrs = 2) {
    const st = await (await fetch(stationsUrl)).json();
    const feats = (st.features || []).slice(0, 5);
    const reads = await Promise.all(feats.map(async (f, rank) => {
      try {
        const id = f.properties.stationIdentifier;
        const list = ((await (await fetch(`https://api.weather.gov/stations/${id}/observations?limit=8`)).json()).features || []).map(x => x.properties);
        for (const o of list) {
          const age = Date.now() - Date.parse(o.timestamp), words = describe(o);
          if (!words || !(age <= maxAgeHrs * 3600e3)) continue;
          return { o, words, rank, age, station: f.properties.name || id, cloud: cloudRank(o, words) };   // this station's newest usable reading
        }
      } catch (e) { /* skip this station */ }
      return null;
    }));
    // Which reading to use, as before: the nearest one, unless a farther one is over half an hour newer.
    let best = null;
    for (const r of reads) {
      if (!r) continue;
      if (!best || Date.parse(r.o.timestamp) > Date.parse(best.o.timestamp) + 30 * 60e3) best = r;
      if (best && best.age < 75 * 60e3) break;
    }
    if (!best) return null;
    const nearest = reads[0];
    let sky = '';
    if (nearest && nearest === best && nearest.age < 75 * 60e3 && (nearest.o.cloudLayers || []).length && nearest.cloud !== null) sky = RANK_WORDS[nearest.cloud];
    else {
      const ranks = reads.filter(r => r && r.cloud !== null).map(r => r.cloud).sort((a, b) => a - b);
      if (ranks.length) sky = RANK_WORDS[ranks[Math.floor(ranks.length / 2)]];
    }
    return { o: best.o, words: best.words, station: best.station, sky, stations: reads.filter(Boolean).map(r => r.station + ': ' + r.words) };
  }
  window.WxNow = { describe, latest };
})();
