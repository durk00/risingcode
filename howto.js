// HOW IT WORKS (Nov 25, 2026, V89): what the app is and how to use every part of it, in plain
// English, opened from the top of the menu (Menu → HOW IT WORKS). The same words describe the
// app in the README. The app was Rising Code until V91; it's Outside In now (the name came from Maya).
(() => {
  const NAME = 'Outside In';
  const css = document.createElement('style');
  css.textContent = `
  #howto { position: fixed; inset: 0; z-index: 13; display: none; overflow-y: auto; background: #0b1016; color: #e8eef4;
    padding: calc(22px + env(safe-area-inset-top, 0px)) max(22px, env(safe-area-inset-right, 0px)) 60px max(22px, env(safe-area-inset-left, 0px));
    -webkit-overflow-scrolling: touch; }
  #howto.show { display: block; }
  #howto .wrap { max-width: 680px; margin: 0 auto; }
  #howto header { display: flex; justify-content: space-between; align-items: center; gap: 12px; position: sticky; top: -22px; padding: 10px 0; background: #0b1016; }
  #howto h1 { margin: 0; color: #ffb84a; font: 800 22px ui-monospace, Menlo, monospace; letter-spacing: 0.1em; }
  #howto .back { padding: 10px 18px; border-radius: 10px; border: 2px solid #ffb84a; background: #1e2a37; color: #ffb84a; font: 700 16px ui-monospace, Menlo, monospace; cursor: pointer; min-height: 48px; }
  #howto h2 { color: #ffb84a; font: 800 15px ui-monospace, Menlo, monospace; letter-spacing: 0.12em; margin: 34px 0 8px; }
  #howto p, #howto li { font: 400 18px/1.6 -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; color: #dfe6ec; }
  #howto p { margin: 0 0 12px; }
  #howto ul { margin: 0 0 12px; padding-left: 22px; }
  #howto li { margin-bottom: 8px; }
  #howto b { color: #ffffff; }
  #howto .lead { font-size: 20px; color: #ffffff; }
`;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.id = 'howto'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="wrap">
  <header><h1>HOW IT WORKS</h1><button type="button" class="back">← Back</button></header>

  <p class="lead">${NAME} is a window. It shows what is really happening outside your house right now: the sky, the weather, the sun and the moon where they actually are, the animals that come by when they really would. Add a radio, a TV and a kitchen, and it's a quiet corner to step back from the noise of the day.</p>
  <p>There is no news feed, no notifications, no ads and no account. Everything it shows is real. The weather comes from NOAA, the government weather service, and when a reading is old, the app says so instead of pretending. Leave it on like a window you glance out, or a radio playing in the next room.</p>

  <h2>GETTING AROUND</h2>
  <ul>
    <li><b>Swipe left or right</b> to move between the screens.</li>
    <li><b>Swipe down</b> for the menu. Start the swipe a little below the top edge, since the very top belongs to the iPad.</li>
    <li><b>Swipe up from the middle</b> for the radio and TV: a good, long swipe straight up. Not from the very bottom edge, which also belongs to the iPad. On the Kitchen, swiping up scrolls the recipes instead, so use another screen.</li>
    <li><b>Tap</b> does something different on each screen, explained below.</li>
  </ul>

  <h2>YOUR LOCATION</h2>
  <p>The first time the app opens, the iPad asks <b>"Allow location?"</b> Say <b>Allow</b>. Everything real in this app depends on knowing where you are:</p>
  <ul>
    <li>Your weather, and weather alerts for your area.</li>
    <li>Your sunrise and sunset, and where the sun and moon sit in your sky.</li>
    <li>Rain and snow on Home when it's really falling where you are.</li>
    <li>News and talk stations near you on the radio.</li>
  </ul>
  <p>Your spot is rounded to about half a mile, stays on the iPad, and is only sent to NOAA, the government weather service, to get your weather. Nothing else gets it. It works anywhere in the US.</p>
  <p>If you say no, the app still works, but it shows Happy Valley, PA instead of where you are. Missed it or changed your mind? Open the menu and tap <b>ALLOW LOCATION</b> under LOCATION. If the iPad still won't allow it, the menu tells you where to turn it on in the iPad's Settings.</p>

  <h2>THE SCREENS</h2>
  <p><b>Home.</b> Where the app opens. A house in the Pennsylvania woods under your real sky. The sun and moon rise on the left and set on the right at their real times, and the moon shows its real phase. Rain and snow fall when they are falling where you are, and snow piles up and melts. Deer come by at dawn and dusk, a bear in the warm months, geese in their seasons, a jet now and then. There's a farm that follows the real seasons: a garden out front that gets tilled, planted, grown and picked, and field corn behind the house that grows tall, dries in the fall and gets harvested in early December. And a homestead: solar panels that collect snow, a well, a paddock with animals, and someone who lives there going about the chores. <b>Tap</b> for the three-day forecast; tap again to close it. A <b>red banner</b> across the top is a real weather alert, with a short chime when it first comes in (a tornado warning sounds the emergency alert tone instead). Tap it to read the whole alert; the page stays up until you tap its <b>✕</b>. The banner stays, even when you close and reopen the app, so you can read it later. With the radio or TV up, the alert shows across the top of it; tap it to go straight to the alert. If NOAA changes the wording, the banner says <b>UPDATED</b> until you open it again. It goes away when you swipe it sideways, or on its own when NOAA's alert ends.</p>
  <p><b>The screensaver.</b> One swipe right of Home. Pick which one in the menu under SCREENSAVER: the Christmas display (from late November into January; on Christmas Eve a radar tracks Santa, and a tap turns the sound on), plain rising code, the Earth, or the portrait. The Earth turns in real time with the real line between day and night, city lights on the night side, and Starcloud-1, the first data center in space, passing over on its real orbit.</p>
  <p><b>Weather station.</b> One swipe left of Home. The details, like a weather station in your kitchen: temperature, wind, humidity, pressure, rain chances, sunrise and sunset, and the next three days hour by hour. It uses the nearest station with a fresh reading and tells you how many minutes old it is.</p>
  <p><b>Kitchen.</b> Two swipes left of Home. Type what you have on hand, separated by commas, and tap <b>Find meals</b> for ideas, each with what you'd still need and how to make it.</p>
  <p>Swipe the other way to come back to Home. On Christmas Eve the app opens on the Christmas display instead, so Santa's radar is the first thing you see.</p>

  <h2>RADIO AND TV</h2>
  <p>Swipe up from the middle of any screen. Two buttons along the top switch between <b>RADIO</b> and <b>TV</b>.</p>
  <p><b>The radio</b> plays real stations streaming on the internet.</p>
  <ul>
    <li><b>⏻</b> turns it on and off.</li>
    <li>Pick a decade: <b>70s, 80s, 90s, 00s, 10s or 20s</b>. The dial then only tunes stations playing that decade's music.</li>
    <li><b>NEWS/TALK</b> gives news and talk stations near you first, then one national station from each side.</li>
    <li><b>XMAS</b> shows up from mid-November to January 6 for Christmas music.</li>
    <li>Drag the dial, or tap <b>◀ ▶</b>, to change stations. Between stations you'll hear a soft hiss, like a real radio.</li>
    <li>If a station says <b>NO SIGNAL</b>, its stream is down. Turn the dial to the next one.</li>
    <li>Leave the radio alone for 30 seconds and it fades almost away, so you can see the scene behind it, all but the glowing dial. Touch it once to bring it back; that touch doesn't press anything, except <b>⏻</b>, which always turns it off on the first tap.</li>
    <li>Starting the radio turns the TV off, and starting a movie turns the radio off, so you never hear both.</li>
    <li>Swipe down, or tap the <b>bar</b> in the top right corner, to tuck the radio away. It keeps playing while you use the rest of the app, and when the screen goes dark. Pause it from the lock screen, or come back and tap ⏻.</li>
  </ul>
  <p><b>The TV</b> plays full-length classic movies from the Internet Archive, free.</p>
  <ul>
    <li>Pick a channel: <b>30s, 40s, 50s, 60s, 70s, CARTOONS</b> or <b>OLD TV</b> (old TV shows). Newer movies are still owned by the studios, so these are the classics that are free to show.</li>
    <li><b>☰ TV GUIDE</b> shows every movie on a channel. Pick a channel at the top, scroll with your finger, and tap a movie to watch it. <b>✕</b> closes the guide. Or use <b>◀ ▶</b> to flip to the next movie.</li>
    <li>Tap <b>▶</b> on the picture to start the movie.</li>
    <li><b>FULL SCREEN</b> fills the screen. The button with the arrows pointing in, top right, brings it back.</li>
    <li>For newer movies, <b>TUBI, PLUTO TV</b> and <b>YOUTUBE</b> open those free services (with ads) in their own app or website. Close them and you're back here.</li>
  </ul>

  <p><b>SCORES</b>, the third button on the set, shows today's games from ESPN. Pick the league along the top: NFL, MLB, NBA, NHL, COLLEGE FB or COLLEGE BB. You see the score while a game is on and when it's final, or the start time before; the team that's ahead is brighter. <b>Tap a game</b> to open it on ESPN and follow it play by play.</p>

  <h2>THE MENU</h2>
  <ul>
    <li><b>SCREENSAVER</b>: which screensaver is one swipe right of Home.</li>
    <li><b>ALERT SOUND</b>: the chime for a new weather alert, On or Off. From 10 PM to 7 AM only serious warnings make a sound, and a tornado warning always sounds the emergency tone.</li>
    <li><b>SOUND</b>: what plays when the Christmas radar catches Santa: a toot, Jingle Bells or icicles. Pick <b>SILENT</b> to turn the sound off.</li>
    <li><b>NIGHT CLOCK</b>: overnight, the screen turns into a big, dim clock with the date and the moon's phase. Pick the hours: <b>9 PM – 6 AM</b> (the usual), <b>10 PM – 6 AM</b> or <b>11 PM – 7 AM</b>, or pick <b>Off</b> to turn it off. While it's showing, tap the clock to use the app for 5 minutes.</li>
    <li><b>LOCATION</b>: whose weather to show, where this iPad is or Happy Valley, PA. See YOUR LOCATION above.</li>
    <li><b>AROUND HAPPY VALLEY</b>: upcoming local events. It only shows when the app is set to Happy Valley or the iPad is nearby.</li>
    <li><b>MY CORNER</b>: one thing just for your household, like verses for the week, picked for the season of the Church year.</li>
  </ul>
  <p>Tap <b>✕</b> to close the menu, or scroll to the bottom and give it a good swipe up.</p>

  <h2>GOOD TO KNOW</h2>
  <ul>
    <li>To put it on your home screen: open it in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>. It opens full screen from there.</li>
    <li>To keep the screen on: Settings, Display &amp; Brightness, Auto-Lock, Never.</li>
    <li><b>Sound needs one touch.</b> The iPad won't let an app make any sound until you've touched the screen once since it opened. Any tap or swipe does it. After that the alert chime, the radio and the TV all work. An alert that came in before then chimes at your first touch. Check that the iPad's volume is up.</li>
    <li>It needs the internet for the weather, the radio and the TV. Without it, the screens say so instead of guessing.</li>
    <li>You can come back to this page any time: Menu, then HOW IT WORKS at the top.</li>
  </ul>
  </div>`;
  document.body.appendChild(el);
  for (const t of ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup']) el.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
  el.addEventListener('click', (e) => { e.stopPropagation(); if (e.target.closest('.back')) close(); });
  document.addEventListener('keydown', (e) => { if (isOpen() && e.key === 'Escape') { e.stopImmediatePropagation(); close(); } }, true);
  const isOpen = () => el.classList.contains('show');
  function open() { el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); el.scrollTop = 0; }
  function close() { el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); }
  window.HowTo = { open, close, isOpen };
})();
