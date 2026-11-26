// SCORES (Nov 25, 2026; V139 the Arena Pulse way): a third button on the radio set, next to
// RADIO and TV, like flipping the radio over to the ballgame. It shows today's games straight
// from ESPN's scoreboard, one league at a time (NFL, MLB, NBA, NHL, college football and
// basketball), in the radio's glowing display: the score while it's on or when it's final, the
// start time before. Tap a game to open it on ESPN, with the play-by-play as it happens. No
// teams to pick. (V135-V138 asked you to pick teams from ESPN's team list; that list didn't
// load in the browser, so it's gone.) If ESPN can't be reached, it says so. Load after radio.js.
(() => {
  const set = document.querySelector('#radio .set'), radio = document.getElementById('radio');
  if (!set || !window.Radio) return;
  const LEAGUES = [
    { id: 'nfl', name: 'NFL', path: 'football/nfl' },
    { id: 'mlb', name: 'MLB', path: 'baseball/mlb' },
    { id: 'nba', name: 'NBA', path: 'basketball/nba' },
    { id: 'nhl', name: 'NHL', path: 'hockey/nhl' },
    { id: 'cfb', name: 'COLLEGE FB', path: 'football/college-football' },
    { id: 'cbb', name: 'COLLEGE BB', path: 'basketball/mens-college-basketball' },
  ];
  const API = 'https://site.api.espn.com/apis/site/v2/sports/';
  let league = 'nfl';
  try { league = localStorage.getItem('risingcode_scores_league') || 'nfl'; } catch (e) {}
  if (!LEAGUES.some(l => l.id === league)) league = 'nfl';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = document.createElement('style');
  css.textContent = `
  #radio.scores .radiobody, #radio.scores .tvbody, #radio:not(.scores) .scoresbody { display: none; }
  #radio.scores .pw { visibility: hidden; }
  #radio .scoresbody .lcd { min-height: 0; }
  #radio .slg { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  #radio .slg button { flex: 1 0 14%; height: 40px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a; font: 800 14px ui-monospace, Menlo, monospace; letter-spacing: 0.04em; cursor: pointer; }
  #radio .slg button.on { background: #ffb84a; color: #14110c; }
  #radio .sgames { max-height: min(48vh, 440px); overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; }
  #radio .sgame { display: grid; grid-template-columns: minmax(0, max-content) auto auto; justify-content: start; align-items: center; gap: 2px 18px; padding: 10px 4px; border-bottom: 1px solid #3a2a10; color: inherit; text-decoration: none; }
  #radio .sgame:last-child { border-bottom: 0; }
  #radio .sgame .t { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #b98a46; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #radio .sgame .n { font-size: 18px; font-weight: 800; text-align: right; min-width: 2ch; color: #b98a46; }
  #radio .sgame .lead { color: #ffcf7a; text-shadow: 0 0 8px rgba(255,184,74,0.55); }
  #radio .sgame .st { grid-column: 3; grid-row: 1 / span 2; align-self: center; white-space: nowrap; font-size: 12px; color: #b98a46; letter-spacing: 0.1em; text-transform: uppercase; }
  #radio .sgame .st.live { color: #ffcf7a; font-weight: 800; }
  #radio .smsg { padding: 10px 4px; font-size: 14px; color: #b98a46; letter-spacing: 0.06em; line-height: 1.5; }
  @media (max-width: 560px) {
    #radio .slg button { flex: 1 0 28%; height: 32px; font-size: 12px; }
    #radio .sgame .t, #radio .sgame .n { font-size: 15px; }
  }`;
  document.head.appendChild(css);

  const tvTab = set.querySelector('.tab[data-mode="tv"]');
  const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'tab'; tab.dataset.scores = '1'; tab.textContent = 'SCORES';
  tvTab.after(tab);
  const body = document.createElement('div'); body.className = 'scoresbody';
  body.innerHTML = `<div class="slg"></div><div class="lcd"><div class="sview"></div></div>
    <div class="hint">TODAY'S GAMES FROM ESPN · TAP A GAME TO FOLLOW IT ON ESPN · SWIPE DOWN OR TAP THE BAR TO MINIMIZE</div>`;
  set.appendChild(body);
  const view = body.querySelector('.sview'), lgRow = body.querySelector('.slg');

  let showing = false, games = {}, err = {}, timer = null;

  function show() {
    showing = true; radio.classList.add('scores');
    set.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === tab));
    draw(); load();
  }
  function hide() { showing = false; radio.classList.remove('scores'); tab.classList.remove('on'); clearTimeout(timer); }
  set.querySelectorAll('.tab[data-mode]').forEach(t => t.addEventListener('click', hide, true));
  const open0 = Radio.open; Radio.open = function () { if (showing) hide(); return open0.apply(this, arguments); };
  const close0 = Radio.close; Radio.close = function () { clearTimeout(timer); return close0.apply(this, arguments); };

  async function load() {
    clearTimeout(timer);
    const L = LEAGUES.find(l => l.id === league), lg = league;
    try {
      const r = await fetch(API + L.path + '/scoreboard'); if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      games[lg] = (d.events || []).map(e => {
        const cs = ((e.competitions || [])[0] || {}).competitors || [], st = (e.status && e.status.type) || {};
        const side = (h) => { const x = cs.find(y => y.homeAway === h) || {}; return { name: (x.team && (x.team.shortDisplayName || x.team.displayName)) || '', score: x.score, win: x.winner }; };
        const link = (e.links || []).find(x => (x.rel || []).includes('desktop') && (x.rel || []).includes('event')) || (e.links || [])[0];
        return { date: e.date, state: st.state || '', detail: st.shortDetail || st.detail || '', away: side('away'), home: side('home'), link: link && link.href };
      }).sort((a, b) => (a.state === 'in' ? 0 : 1) - (b.state === 'in' ? 0 : 1) || Date.parse(a.date) - Date.parse(b.date));
      err[lg] = false;
    } catch (e) { err[lg] = true; }
    if (lg === league) draw();
    if (showing && Radio.isOpen()) timer = setTimeout(load, (games[league] || []).some(g => g.state === 'in') ? 60e3 : 10 * 60e3);   // a game on: every minute
  }

  function when(iso) {
    const d = new Date(iso), today = d.toDateString() === new Date().toDateString();
    return d.toLocaleString(undefined, today ? { hour: 'numeric', minute: '2-digit' } : { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase();
  }

  function draw() {
    lgRow.innerHTML = LEAGUES.map(l => `<button type="button" data-slg="${l.id}" class="${l.id === league ? 'on' : ''}">${l.name}</button>`).join('');
    const list = games[league];
    if (!list) { view.innerHTML = `<div class="smsg">${err[league] ? 'NO SIGNAL · CAN’T REACH ESPN · CHECK WI-FI' : 'TUNING IN…'}</div>`; return; }
    if (!list.length) { view.innerHTML = '<div class="smsg">NO GAMES ON THE BOARD TODAY.</div>'; return; }
    view.innerHTML = `<div class="sgames guide">${list.map(g => {
      const pre = g.state === 'pre', live = g.state === 'in', fin = g.state === 'post';
      const a = +g.away.score, h = +g.home.score, aLead = !pre && (fin ? g.away.win : a > h), hLead = !pre && (fin ? g.home.win : h > a);
      const open = g.link ? `a href="${esc(g.link)}" target="_blank" rel="noopener"` : 'div';
      return `<${open} class="sgame"><div class="t ${aLead ? 'lead' : ''}">${esc(g.away.name)}</div><div class="n ${aLead ? 'lead' : ''}">${pre ? '' : esc(g.away.score)}</div>
        <div class="t ${hLead ? 'lead' : ''}">@ ${esc(g.home.name)}</div><div class="n ${hLead ? 'lead' : ''}">${pre ? '' : esc(g.home.score)}</div>
        <div class="st ${live ? 'live' : ''}">${pre ? esc(when(g.date)) : esc(g.detail.toUpperCase())}</div></${g.link ? 'a' : 'div'}>`;
    }).join('')}</div>${err[league] ? '<div class="smsg">COULDN’T UPDATE · SHOWING THE LAST SCORES</div>' : ''}`;
  }

  tab.addEventListener('click', (e) => { e.stopPropagation(); show(); });
  body.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-slg]');
    if (b) { e.stopPropagation(); league = b.dataset.slg; try { localStorage.setItem('risingcode_scores_league', league); } catch (e2) {} draw(); load(); return; }
    if (e.target.closest('a.sgame')) e.stopPropagation();   // the link opens ESPN on its own
  });
  window.Scores = { show, hide, isShowing: () => showing };
})();
