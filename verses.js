// VERSES FOR THE WEEK (Nov 24, 2026): a My Corner choice. Two or three verses from the King
// James Version picked for where the day falls in the Church year: Advent, Christmas,
// Lent, Holy Week, Easter, Pentecost, or Ordinary Time, plus a few feasts and
// Thanksgiving week. Within a season the passage changes each week.
//
// The page only stores the references; the words come from bible-api.com (free, public
// domain King James text), and each week's passage is kept on the device after the first
// fetch. If it can't be reached, the reference still shows.
(() => {
  const KEY = 'risingcode_verses';
  const SEASONS = {
    advent: ['Isaiah 2:3-5', 'Isaiah 40:3-5', 'Isaiah 35:4-6', 'Luke 1:30-32'],
    christmas: ['Luke 2:10-11', 'Luke 2:13-14', 'John 1:14', 'Matthew 2:10-11'],
    lent: ['Joel 2:12-13', 'Psalm 51:10-12', 'Isaiah 58:6-7', 'John 3:16-17', 'Ezekiel 36:26-27', 'Micah 7:18-19'],
    holy: ['Isaiah 53:4-5'],
    easter: ['Matthew 28:5-6', 'Luke 24:5-6', 'John 11:25-26', 'Romans 6:4-5', '1 Peter 1:3-4', 'John 20:19-20', 'John 14:1-3'],
    ordinary: ['Psalm 23:1-3', 'Micah 6:8', 'Proverbs 3:5-6', 'Matthew 5:14-16', 'Philippians 4:6-7', 'Romans 8:28', 'Isaiah 40:30-31',
      'Psalm 46:1-2', 'Matthew 11:28-30', 'Lamentations 3:22-23', 'Psalm 121:1-2', 'John 15:12-13', 'Galatians 6:9-10', 'Joshua 1:9', 'Colossians 3:12-13'],
  };
  const NAMES = { advent: 'ADVENT', christmas: 'CHRISTMAS', lent: 'LENT', holy: 'HOLY WEEK', easter: 'EASTER SEASON', ordinary: 'ORDINARY TIME' };
  const day = (y, m, d) => new Date(y, m, d);
  const add = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
  const same = (a, b) => a.toDateString() === b.toDateString();
  function easter(y) {                            // the Gregorian Easter date
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), dd = ((h + l - 7 * m + 114) % 31) + 1;
    return day(y, month - 1, dd);
  }
  function adventStart(y) { const xmas = day(y, 11, 25), back = xmas.getDay() === 0 ? 7 : xmas.getDay(); return add(xmas, -back - 21); }
  function thanksgiving(y) { const first = day(y, 10, 1), toThu = (4 - first.getDay() + 7) % 7; return day(y, 10, 1 + toThu + 21); }
  const weeksSince = (start, dt) => Math.floor((dt - start) / (7 * 864e5));

  // Where today falls, and the passage for it.
  function today(dt = new Date()) {
    const t = day(dt.getFullYear(), dt.getMonth(), dt.getDate()), y = t.getFullYear();
    const E = easter(y), ash = add(E, -46), palm = add(E, -7), pent = add(E, 49), adv = adventStart(y), tg = thanksgiving(y);
    const feasts = [
      [day(y, 11, 25), 'CHRISTMAS DAY', 'Luke 2:10-11'], [day(y, 0, 6), 'EPIPHANY', 'Matthew 2:10-11'], [ash, 'ASH WEDNESDAY', 'Joel 2:12-13'],
      [palm, 'PALM SUNDAY', 'Zechariah 9:9'], [add(E, -2), 'GOOD FRIDAY', 'Isaiah 53:5-6'], [E, 'EASTER SUNDAY', 'Matthew 28:5-6'],
      [pent, 'PENTECOST', 'Acts 2:1-4'], [day(y, 7, 15), 'THE ASSUMPTION', 'Luke 1:46-49'], [day(y, 10, 1), 'ALL SAINTS', 'Hebrews 12:1-2'],
      [day(y, 11, 8), 'THE IMMACULATE CONCEPTION', 'Luke 1:28-30'],
    ];
    for (const [d, label, ref] of feasts) if (same(d, t)) return { label, ref };
    if (t >= add(tg, -3) && t <= add(tg, 2)) return { label: 'THANKSGIVING WEEK', ref: same(t, tg) ? 'Psalm 100:4-5' : '1 Thessalonians 5:16-18' };
    let season, start;
    if (t >= day(y, 11, 25)) { season = 'christmas'; start = day(y, 11, 25); }
    else if (t < day(y, 0, 13)) { season = 'christmas'; start = day(y - 1, 11, 25); }
    else if (t >= adv) { season = 'advent'; start = adv; }
    else if (t >= ash && t < palm) { season = 'lent'; start = ash; }
    else if (t >= palm && t < E) { season = 'holy'; start = palm; }
    else if (t >= E && t <= pent) { season = 'easter'; start = E; }
    else { season = 'ordinary'; start = day(y, 0, 1); }
    const list = SEASONS[season], w = weeksSince(start, t);
    const label = season === 'ordinary' ? NAMES.ordinary : `${NAMES[season]} · WEEK ${w + 1}`;
    return { label, ref: list[w % list.length] };
  }

  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  async function text(ref) {
    if (cache[ref]) return cache[ref];
    const r = await fetch('https://bible-api.com/' + encodeURIComponent(ref) + '?translation=kjv');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const verses = (j.verses || []).map(v => ({ n: v.verse, t: String(v.text || '').replace(/\s+/g, ' ').trim() }));
    if (!verses.length) throw new Error('empty');
    cache[ref] = verses;
    try { const keep = Object.fromEntries(Object.entries(cache).slice(-20)); localStorage.setItem(KEY, JSON.stringify(keep)); } catch (e) {}
    return verses;
  }

  window.Verses = { today, text, easter, adventStart };
})();
