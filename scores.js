// SCORES (Nov 25, 2026, V135): a third button on the radio set, next to RADIO and TV, like
// flipping the radio over to the ballgame. It shows today's games for the teams you follow, in
// the radio's glowing display: the score while it's on or when it's final, the start time
// before. MY TEAMS lists every team in the NFL, MLB, NBA and NHL (ESPN's own list, loaded when
// you open it, so it stays current); tap the ones you follow, remembered on this device.
// Scores come from ESPN's public scoreboard. If it can't be reached, it says so.
// Load after radio.js (it adds its tab and panel to the radio set).
(() => {
  const set = document.querySelector('#radio .set'), radio = document.getElementById('radio');
  if (!set || !window.Radio) return;
  const KEY = 'risingcode_teams';
  const LEAGUES = [
    { id: 'nfl', name: 'NFL', path: 'football/nfl' },
    { id: 'mlb', name: 'MLB', path: 'baseball/mlb' },
    { id: 'nba', name: 'NBA', path: 'basketball/nba' },
    { id: 'nhl', name: 'NHL', path: 'hockey/nhl' },
  ];
  const API = 'https://site.api.espn.com/apis/site/v2/sports/';
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) {} };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = document.createElement('style');
  css.textContent = `
  #radio.scores .radiobody, #radio.scores .tvbody, #radio:not(.scores) .scoresbody { display: none; }
  #radio.scores .pw { visibility: hidden; }
  #radio .scoresbody .lcd { min-height: 0; }
  #radio .sgames { max-height: min(52vh, 460px); overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; }
  #radio .sgame { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 10px 4px; border-bottom: 1px solid #3a2a10; }
  #radio .sgame:last-child { border-bottom: 0; }
  #radio .sgame .t { font-size: 19px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #b98a46; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #radio .sgame .n { font-size: 19px; font-weight: 800; text-align: right; color: #b98a46; }
  #radio .sgame .lead { color: #ffcf7a; text-shadow: 0 0 8px rgba(255,184,74,0.55); }
  #radio .sgame .st { grid-column: 1 / -1; font-size: 12px; color: #b98a46; letter-spacing: 0.1em; text-transform: uppercase; }
  #radio .sgame .st.live { color: #ffcf7a; font-weight: 800; }
  #radio .smsg { padding: 10px 4px; font-size: 14px; color: #b98a46; letter-spacing: 0.06em; line-height: 1.5; }
  #radio .srow { display: flex; gap: 8px; margin-top: 12px; }
  #radio .srow button, #radio .spick .lg button, #radio .spick .tm button { border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a; font: 800 15px ui-monospace, Menlo, monospace; letter-spacing: 0.06em; cursor: pointer; }
  #radio .srow button { flex: 1; height: 48px; }
  #radio .spick .lg { display: flex; gap: 6px; margin: 10px 0 8px; }
  #radio .spick .lg button { flex: 1; height: 40px; }
  #radio .spick .lg button.on, #radio .spick .tm button.on { background: #ffb84a; color: #14110c; }
  #radio .spick .tm { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px; max-height: min(46vh, 420px); overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; }
  #radio .spick .tm button { min-height: 44px; padding: 4px 8px; font-size: 13px; text-align: left; }
  @media (max-width: 560px) {
    #radio .sgame .t, #radio .sgame .n { font-size: 16px; }
    #radio .srow button { height: 36px; font-size: 13px; }
    #radio .spick .lg button { height: 34px; font-size: 13px; }
    #radio .spick .tm { grid-template-columns: 1fr 1fr; }
    #radio .spick .tm button { min-height: 36px; font-size: 12px; }
  }`;
  document.head.appendChild(css);

  // The SCORES button, after TV; the panel, after the TV's.
  const tvTab = set.querySelector('.tab[data-mode="tv"]');
  const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'tab'; tab.dataset.scores = '1'; tab.textContent = 'SCORES';
  tvTab.after(tab);
  const body = document.createElement('div'); body.className = 'scoresbody';
  body.innerHTML = `<div class="lcd"><div class="sview"></div></div>
    <div class="srow"><button type="button" data-steams="1">MY TEAMS</button><button type="button" data-srefresh="1">⟳ REFRESH</button></div>
    <div class="hint">TODAY'S GAMES FOR YOUR TEAMS · FROM ESPN · SWIPE DOWN OR TAP THE BAR TO MINIMIZE</div>`;
  set.appendChild(body);
  const view = body.querySelector('.sview');

  let showing = false, picking = false, pickLeague = 'nfl', teams = {}, games = null, err = false, timer = null;

  function show() {
    showing = true; radio.classList.add('scores');
    set.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === tab));
    picking = !mine.length; draw(); if (picking) loadTeams(pickLeague); else load();
  }
  function hide() { showing = false; radio.classList.remove('scores'); tab.classList.remove('on'); clearTimeout(timer); }
  // RADIO and TV take back over (radio.js sets their own highlight).
  set.querySelectorAll('.tab[data-mode]').forEach(t => t.addEventListener('click', hide, true));
  const open0 = Radio.open; Radio.open = function () { if (showing) hide(); return open0.apply(this, arguments); };   // opens on the radio or TV as before
  const close0 = Radio.close; Radio.close = function () { clearTimeout(timer); return close0.apply(this, arguments); };

  async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }

  async function loadTeams(lg) {
    if (teams[lg]) return draw();
    try {
      const L = LEAGUES.find(l => l.id === lg);
      const d = await getJSON(API + L.path + '/teams');
      const list = (((d.sports || [])[0] || {}).leagues || [])[0];
      teams[lg] = ((list && list.teams) || []).map(x => x.team).filter(Boolean)
        .map(t => ({ key: lg + ':' + t.id, name: t.displayName || t.name, short: t.shortDisplayName || t.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      err = false;
    } catch (e) { teams[lg] = null; err = true; }
    draw();
  }

  async function load() {
    clearTimeout(timer);
    const lgs = LEAGUES.filter(l => mine.some(k => k.startsWith(l.id + ':')));
    if (!lgs.length) { games = []; draw(); return; }
    try {
      const out = [];
      await Promise.all(lgs.map(async (L) => {
        const d = await getJSON(API + L.path + '/scoreboard');
        for (const e of d.events || []) {
          const c = (e.competitions || [])[0] || {}, cs = c.competitors || [];
          if (!cs.some(x => x.team && mine.includes(L.id + ':' + x.team.id))) continue;
          const side = (h) => { const x = cs.find(y => y.homeAway === h) || {}; return { name: (x.team && (x.team.shortDisplayName || x.team.name)) || '', score: x.score, win: x.winner }; };
          const st = (e.status && e.status.type) || {};
          out.push({ lg: L.name, date: e.date, state: st.state || '', detail: st.shortDetail || st.detail || '', away: side('away'), home: side('home') });
        }
      }));
      out.sort((a, b) => (a.state === 'in' ? 0 : 1) - (b.state === 'in' ? 0 : 1) || Date.parse(a.date) - Date.parse(b.date));
      games = out; err = false;
    } catch (e) { err = true; }
    draw();
    if (showing && Radio.isOpen()) timer = setTimeout(load, games && games.some(g => g.state === 'in') ? 60e3 : 10 * 60e3);   // a game on: every minute
  }

  function when(iso) {
    const d = new Date(iso), today = d.toDateString() === new Date().toDateString();
    return d.toLocaleString(undefined, today ? { hour: 'numeric', minute: '2-digit' } : { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase();
  }

  function draw() {
    if (picking) {
      const lg = teams[pickLeague];
      view.innerHTML = `<div class="spick"><div class="smsg" style="padding-top:2px">MY TEAMS: TAP THE TEAMS YOU FOLLOW${mine.length ? ` · ${mine.length} PICKED` : ''}</div>
        <div class="lg">${LEAGUES.map(l => `<button type="button" data-slg="${l.id}" class="${l.id === pickLeague ? 'on' : ''}">${l.name}</button>`).join('')}</div>
        ${lg ? `<div class="tm guide">${lg.map(t => `<button type="button" data-steam="${esc(t.key)}" class="${mine.includes(t.key) ? 'on' : ''}">${mine.includes(t.key) ? '✓ ' : ''}${esc(t.name)}</button>`).join('')}</div>`
          : `<div class="smsg">${err ? 'CAN’T REACH ESPN FOR THE TEAM LIST · CHECK WI-FI' : 'LOADING TEAMS…'}</div>`}</div>`;
      body.querySelector('[data-steams]').textContent = mine.length ? 'DONE' : 'MY TEAMS';
      return;
    }
    body.querySelector('[data-steams]').textContent = 'MY TEAMS';
    if (!mine.length) { view.innerHTML = '<div class="smsg">NO TEAMS PICKED YET. TAP MY TEAMS.</div>'; return; }
    if (err && !games) { view.innerHTML = '<div class="smsg">NO SIGNAL · CAN’T REACH ESPN FOR SCORES · CHECK WI-FI</div>'; return; }
    if (!games) { view.innerHTML = '<div class="smsg">TUNING IN…</div>'; return; }
    if (!games.length) { view.innerHTML = '<div class="smsg">NO GAMES TODAY FOR YOUR TEAMS.</div>'; return; }
    view.innerHTML = `<div class="sgames guide">${games.map(g => {
      const pre = g.state === 'pre', live = g.state === 'in', fin = g.state === 'post';
      const a = +g.away.score, h = +g.home.score, aLead = !pre && (fin ? g.away.win : a > h), hLead = !pre && (fin ? g.home.win : h > a);
      return `<div class="sgame"><div class="t ${aLead ? 'lead' : ''}">${esc(g.away.name)}</div><div class="n ${aLead ? 'lead' : ''}">${pre ? '' : esc(g.away.score)}</div>
        <div class="t ${hLead ? 'lead' : ''}">@ ${esc(g.home.name)}</div><div class="n ${hLead ? 'lead' : ''}">${pre ? '' : esc(g.home.score)}</div>
        <div class="st ${live ? 'live' : ''}">${esc(g.lg)} · ${pre ? esc(when(g.date)) : esc(g.detail.toUpperCase())}</div></div>`;
    }).join('')}</div>${err ? '<div class="smsg">COULDN’T UPDATE · SHOWING THE LAST SCORES</div>' : ''}`;
  }

  tab.addEventListener('click', (e) => { e.stopPropagation(); show(); });
  body.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    e.stopPropagation();
    if (b.dataset.steams) { picking = !picking; if (picking) loadTeams(pickLeague); else { games = null; draw(); load(); } draw(); return; }
    if (b.dataset.srefresh) { if (picking) { picking = false; games = null; } draw(); load(); return; }
    if (b.dataset.slg) { pickLeague = b.dataset.slg; draw(); loadTeams(pickLeague); return; }
    if (b.dataset.steam) {
      const k = b.dataset.steam, i = mine.indexOf(k);
      if (i >= 0) mine.splice(i, 1); else mine.push(k);
      save(); const sc = body.querySelector('.tm') && body.querySelector('.tm').scrollTop; draw();
      const tm = body.querySelector('.tm'); if (tm) tm.scrollTop = sc || 0;
    }
  });
  window.Scores = { show, hide, isShowing: () => showing };
})();
