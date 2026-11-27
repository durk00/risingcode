# Outside In

(Called Rising Code until V91; the name Outside In came from Maya. The address is now durk00.github.io/outsidein.)

Outside In is a window. It shows what is really happening outside your house right now: the sky, the weather, the sun and the moon where they actually are, the animals that come by when they really would. Add a radio, a TV and a kitchen, and it's a quiet corner to step back from the noise of the day. There is no news feed, no notifications, no ads and no account. Everything it shows is real, and when a reading is old, it says so. Made for an iPad; works in any modern browser.

Full plain-English instructions are in the app: Menu → **HOW IT WORKS** (`howto.js`, V89). The first-time guide points there too. The app's name is set at the top of `howto.js` and in `index.html` (the page title and the home-screen name).

## Use it on an iPad

1. Open `index.html` in Safari (or the GitHub Pages link, if Pages is turned on for this repo).
2. Tap **Share → Add to Home Screen**. Opened from the home screen it runs full screen, with no browser bars.
3. Tap once to go full screen when running in Safari. It asks the iPad to keep the screen awake while it's showing; if the screen still dims, set **Settings → Display & Brightness → Auto-Lock** to Never while it runs.

The home-screen icon is William's amber code face (`apple-touch-icon.png` for the iPad, V73). Since V91 there's also `manifest.webmanifest` with 192 and 512 px versions (`icon-192.png`, `icon-512.png`, cut square from the original picture) marked as maskable, so a Chromebook or Android phone fills its round or rounded icon with the face edge to edge instead of putting a small picture on a white circle. An icon only updates when the app is installed again: remove it and add it again.

## Adjusting it

Everything is in `index.html`:

- **Colors:** the `--ice` (blue), `--leaf` (green), `--amber` (rich amber, V95: about a quarter of the streams, drawn in a heavier weight so they read thicker), `--ember` (red, used only by the tree), `--frost` (white) and `--halo` (the star's glow) values at the top of the style block.
- **Tree:** `buildTree()` sets its size and position; the star pulses in `draw()`.
- **Color mix:** `colorFor()` and `nextColor()`: mostly blue and green, white now and then.
- **Speed:** the `speed:` line in `makeStream()` sets each column's base speed. `nextPhase()` drifts the whole field between slow and fast at random, with an occasional short rush.
- **Density:** the `size =` line in `resize()` (smaller characters, more columns) and the number of `makeStream` calls per column.

It honors the device's Reduce Motion setting by running slower.

## Sound credit

The toot when the radar line catches Santa is the last 0.6 seconds of "fart01" by brassoletto on Freesound (freesound.org, sound 454562).

## Opens on Home (V94)

The app opens on **Home**, the house scene (`winter.js`; the code still calls it Winter), not the screensaver. From Home: one swipe right for the screensaver, one swipe left for the weather station, two for Kitchen, so nothing is more than two swipes away. The labels at the bottom say HOME and SCREENSAVER now instead of WINTER and CODE RAIN. The one exception is Christmas Eve, when it opens on the Christmas display so Santa's radar is up first.

## Winter scene

Swipe left on the Christmas display for the Winter scene; swipe right to go back (arrow keys on a computer). It's in `winter.js`: a landscape with a house, lit windows and a chimney that always smokes, matched to today's NOAA forecast for Happy Valley, PA (api.weather.gov, refreshed hourly):

- **Day or night** from the real sunrise and sunset for Happy Valley (since V46), with the sky brightening over the hour around sunrise and dimming over the hour around sunset: sun and blue sky by day, moon and stars by night.
- **Sky** from the forecast words: clear, partly cloudy, cloudy or fog.
- **Rain, snow or a mix** falling: since V44 from the nearest NOAA station's current conditions when it has a reading from the last 2 hours (so it shows what is really coming down), otherwise from the forecast; snow comes down light, moderate or heavy by the forecast rate (under 0.1, 0.1 to 0.5, over 0.5 inches an hour).
- **Ground** is white when snow is in today's forecast and piles up while it falls (depth set by today's total); otherwise it's bare, and leftover snow melts away slowly.
- **Tap** for a three-day forecast box to the left of the house (day, forecast with a weather icon, high and low, chance of precipitation); tap again to close. Taps on Winter make no sound.
- **Weather alerts** from NOAA for Happy Valley (checked every 10 minutes) show as a red banner across the top: tap it for the details (the page stays up, even if you swipe away and back, until you tap its ✕, V104), swipe the banner sideways to dismiss the alert. A dismissed alert stays away; a new one shows. Preview with `?alert`.
- **Upcoming snow** is still previewed: if snow is due in the next two days, the top line says when and about how much, and clouds gather in its last 12 hours.

Preview any weather with `?wx=sunny`, `partly`, `cloudy`, `fog`, `rain`, `mix`, `snow-light`, `snow`, `snow-heavy` or `coming`, plus `&time=day` or `&time=night`. The thresholds are at the top of `winter.js`.

## What the weather is doing right now (V58)

`wxnow.js` reads the last several readings from up to 5 nearby NOAA stations and takes the newest from the last 2 hours. When NOAA leaves a reading's words blank, it builds them from what the station measured: what is falling, and the cloud layers (clear, few, scattered, broken, overcast). Winter and Details both use it. When no station reading is available and the forecast only says a chance, Winter shows clouds but nothing falling. When the words say clear (Clear, Mostly Clear, Mostly Sunny), no clouds are drawn; only "Partly" draws a few (V59).

## Alert over the radio (V123)

The radio and TV set covers the scene with a dark backdrop, which hid the red alert banner (it only showed faintly through). Now, while the set is open, the alert shows on top of it across the top of the screen (`radioalert.js`), and the set moves down to make room. Tap it and the set tucks away and the alert's page opens on Home. When the set fades after 30 seconds, the strip fades with it, and the first touch brings both back.

## Alert chime (V103)

When a new NOAA alert comes in, a short, soft three-note chime plays once (`alertchime.js`), so you look over at the red banner; a severe warning chimes twice; a tornado warning, tsunami warning, extreme wind warning, flash flood or tornado emergency, or anything NOAA rates Extreme sounds the Emergency Alert System attention tone (853 and 960 Hz together) for 5 seconds instead, day or night (V104). The same alert never chimes again, even when NOAA updates it, and a dismissed one stays quiet. A reworded reissue of the same alert doesn't chime, but the banner says UPDATED until the alert page is opened again (V106). From 10 PM to 7 AM only severe or extreme warnings make a sound; advisories and watches wait silently on the banner. Menu → ALERT SOUND turns it on or off (turning it on plays a sample). The iPad only allows sound after the app has been touched once since it opened, so an alert that arrives before that chimes at the first touch.

## The farm (V112)

`farm.js` grows things on the real calendar. **A kitchen garden** in the front yard, five rows: tilled in April a few rows at a time (he's out with a hoe), planted after the last frost in mid-May, growing through July, full with red and yellow in August and September, picked and pulled by mid-October, bare in winter. In season the person goes out to the garden too: with a hoe in April, in summer to the well for water and then down the rows, in the fall with a basket. **Field corn** stands behind the place all the way across, feed corn for the stock: planted early May, taller than a man by late July with tassels and ears, tan by mid-October and left standing to dry, the way the fields around Happy Valley are. The field is a solid wall you can't see through, and from mid-October it dies back (V113; further since V114, fully dead by mid-November: shorter, darker, bent further over, about a quarter broken, leaves falling off): the stalks shrink and go gray-brown, lean and bend over at the top, some broken partway down, the leaves hanging. It's drawn once into an off-screen picture and reused, since it only changes with the day, the light and the harvest. Harvest (V119) starts December 7th (V120: he leaves the corn standing to dry first) and goes very slowly, sunup to sundown: he works the field in passes back and forth, one tractor length an hour, so you have to look away for an hour to see he's moved. Each pass thins the standing corn a little and leaves stubble behind; the whole field takes about 200 hours of working daylight, three weeks or more, into the new year. He doesn't work while it's raining or snowing or the wind is up (any wind alert, or wind, breezy or gusts in today's forecast), and that time doesn't count; hours the app wasn't open count as worked if the sun was up. He's on the tractor while it's out, so no other chores then. The tractor is an old red one with him on the seat at the wheel, pulling an open wooden wagon that fills with ears across each pass. From mid-October until harvest he also walks out now and then to feel the ears and see if they're dry enough. Stubble through winter, worked under in late April. Dates move a few days earlier per degree south. Preview any date with `?farm=2026-07-20` (add `&farmhour=11`).

The horses graze the way horses do (V112): head down nearly all the time; every half minute to a minute and a half one slowly raises its head over a couple of seconds, looks around a while, and slowly lowers it again. There's a herd of 2 to 4 horses (V117), usually including a white one, with the run of a long paddock that goes well off the right edge of the picture, so who's in view is random: none, one or two, different ones at different times, wandering in and out slowly, grazing, heads coming up now and then. When he comes out to feed them, they come over and stand together near him. The paddock fence has a top rail in front now too, three rails high (V115). The horses have manes (V116): a neat, well-groomed band along the top of the neck with fine combed lines lying back, and a short forelock; silver-gray on the white horse, near black on the others.

## Scores on the radio set (V135, the Arena Pulse way since V139)

`scores.js` adds a third button to the radio set, SCORES, next to RADIO and TV: like flipping the radio over to the ballgame. It shows today's games straight from ESPN's scoreboard, one league at a time (NFL, MLB, NBA, NHL, COLLEGE FB, COLLEGE BB; the last league picked is remembered), in the radio's glowing display: the score while it's on or when it's final (the team ahead is brighter, not a different color), or the start time before. Tap a game to open it on ESPN and follow it play by play. It refreshes every minute while a game is on. If ESPN can't be reached it says NO SIGNAL instead of guessing. (V135 to V138 had you pick your teams from ESPN's team list; that list wouldn't load in the browser, so V139 went back to the plain scoreboard, the way Arena Pulse does it.)

## Shield in the menu (V134, taken out in V137)

A SHIELD button near the top of the menu, under HOW IT WORKS, opens Shield (https://wandering-shield-guard-pro.base44.app/), William's separate consumer-protection app, in its own tab: check a contractor's license, a car by its VIN, and more. Handy on a phone at a car lot. Close the tab to come back. Taken back out in V137: Shield needs more work first.

## Radio and TV fit an iPhone (V133)

On an iPhone the radio and TV set was taller than the screen and the top of the TV was cut off. `phonefit.js` makes the buttons about half as tall and tightens the spacing on phone-width screens (under 560 pixels wide), so the whole set fits, TV picture included. The iPad and Chromebook are unchanged.

## Harder to pop up the radio by accident (V132)

On an iPhone, scrolling the kitchen's recipes kept bringing up the radio. The swipe up for the radio now has to be longer and straighter (at least 120 pixels, about a fifth of the screen), and on the Kitchen, when the recipes scroll, a swipe up only scrolls. Every other screen still brings up the radio.

## Weather station fits an iPhone browser (V131)

In Safari on an iPhone, the bottom of the weather station (the WIND AND GUSTS chart and the day names) sat under the browser's bottom bar. It now lays out in the part of the screen you can actually see. On a narrow screen the first NOON label is skipped so it doesn't print on top of NOW.

## Small alert tag on phones (V130)

On a phone, the full-width alert banner covered too much of the screen. Now a phone shows a small red tag at the top left with just the alert's name and when it ends, like WIND ADVISORY · 7 PM (the day too if it isn't today). Tap it for the whole alert, swipe it away as before. The iPad and Chromebook keep the full banner.

## Alert tag lower on iPhone, easier to swipe away (V141)

The app draws under the iPhone's status bar, so the alert tag sat up under the clock and the notch, and a swipe up there could pull down Notification Center instead. Now, on phone-width screens (under 700 pixels), the tag and the NOAA line above it start below the status bar (the screen's own safe area, read from `env(safe-area-inset-top)`), and the tag is a little taller. Its touch area reaches 12 pixels past its edges, it follows your finger when you slide it, a 40 pixel slide is enough to send it away (60 elsewhere), and a shorter one lets it ease back. In Safari's own window, where there's no status bar to clear, it moves down only a few pixels. The iPad and Chromebook are unchanged.

## Calmer location button (V128, V129)

The ALLOW LOCATION button in the menu was an amber outline that looked like a warning, and it showed even when Happy Valley was picked on purpose. Now it's a plain button. It shows whenever the app isn't using where the iPad is, Happy Valley picked included, so anyone can tap it and say yes (V128 briefly hid it on Happy Valley; V129 put it back). And if the iPad never answers, as can happen in a Safari tab, the menu no longer says CHECKING… forever: after 30 seconds it shows Happy Valley, says the iPad didn't answer, and says where in Safari to allow it.

## Wind that moves (V125, V126)

On the weather station, the WIND AND GUSTS chart along the bottom is in motion: darker amber streaks ride along the wind line (amber since V126, to match the page; darker so they show by brightness, not color) and the gust dots stream left to right, forward in time, the gusts a little faster than the wind. The lines themselves still show the real forecast; only the pattern on them moves.

## Smoke that follows a strong wind (V140)

The chimney smoke now goes the way a strong wind is really blowing, from the nearest NOAA station's latest reading. Under 15 mph it's exactly the old smoke. Between 15 and 25 mph it eases over, and from 25 mph up it drifts downwind, a little lower and a bit faster the harder it blows (no faster past 40 mph). The puffs keep the same size and fade as before, so it looks the same through the radio; only the direction changes, and it turns slowly, never with a jump. The scene looks south, so a west wind sends the smoke left and an east wind sends it right. With no recent reading (none in the last 3 hours, or no direction), it's the old smoke. Preview: add `?wind` (a 30 mph west wind), `?wind=E`, `?wind=NW,25` or `?wind=90,35` to the address.

## Trees and corn in a strong wind (V142)

The same wind reading as the smoke now moves the trees and the corn, the same way the smoke goes (a west wind to the left, an east wind to the right). From about 25 mph sustained, the tops of the pines sway gently, a little more up to 50 mph; the low branches hardly move. From about 32 mph the standing corn leans and sways a little downwind, more up to 60 mph; the stubble the harvest has left doesn't move. When the station reports gusts of 32 mph or more, a gust crosses the scene now and then (every 4 to 15 seconds, more often the stronger they are), coming in from the side the wind blows from: it bends the tree tops and the corn further, then lets them settle back over a few seconds, up to full strength at 60 mph. A north or south wind bends nothing sideways; the sway alone shows it, a little smaller. No reading in the last 3 hours, no direction, or calm, and the trees and the corn are drawn exactly as before. Preview: `?wind=W,30` (30 mph from the west), `?wind=W,30,50` (with 50 mph gusts), `?wind=E,45,60`.

## Smoke in the wind (V124, taken back in V127)

V124 made the chimney smoke lean and stream with the real wind. It's back to the way it was before, since the old smoke looked nicer, especially through the radio when it fades.

## Door, and the corn at night (V122)

The front door is planks with a heavy beam across the middle and a big round black doorknob. The field corn stays visible at night, dimly, as if by moonlight and starlight, instead of going black.

## Oil lamps in the windows (V111, V121)

At night each window is lit by its own oil lamp. Since V121 they're back to full brightness with more life: each flame wanders on its own between about 85% and full, and every 10 to 30 seconds a draft makes one flutter for a second or two; on a windy day (a wind alert, or wind in today's forecast) the drafts come more often. Noticeable if you watch for a bit, easy to miss at a glance. (Before V111 both windows flickered together, fast; V111 made them so subtle they were hard to notice.)

## Location (V66)

The weather, alerts and daylight follow wherever the iPad is in the US (`place.js`). The first time, the iPad asks "Allow location?". If allowed, the spot is rounded to about half a mile, kept on the device, and only sent to NOAA (api.weather.gov) to get that place's weather. NOAA names the nearest town, and the screens say it ("NOAA · FRESNO"). It's checked again each time the app starts. If location isn't allowed, the spot is outside the US, or it can't tell, everything stays on Happy Valley, PA. Menu → LOCATION switches between **Where this iPad is** and **Happy Valley, PA**. Since V100 there's also an **ALLOW LOCATION** button at the top of that section whenever the app doesn't know where the iPad is: it asks the iPad again, and if the iPad still says no, the menu says where in Settings to turn it on. The clock and the Earth's day and night were already right anywhere. The Around Happy Valley events stay local.

V66 also fixed sunrise and sunset west of about Chicago: the sunset had come out as yesterday's, which would have left the Winter scene dark all afternoon in California.

## Sun and moon on their real paths (V68)

On the Winter scene the sun and the moon move across the sky where they really are, seen from this iPad's place (`skypath.js`). The scene faces south: they come up on the left (east), arc across, and go down on the right (west), behind the hills. The sun turns warmer near the horizon. The moon keeps its real phase, and shows pale in the daytime when it's up. Both fade behind cloud. The sun is accurate to about a hundredth of a degree and the moon to about half a degree, checked against PyEphem. The previews ?time=day and ?time=night keep the old fixed spot.

## g (V69)

William's own AI, g (go-grow-gain.base44.app), as a page of this app, one swipe left past Kitchen (`gpage.js`), so he can chat with g without leaving the screensaver. It only appears on an iPad where it was turned on: open the app once with `?g=on` at the end of the address (`?g=off` removes it). An app added to the home screen keeps its own storage, separate from Safari, so from inside the app: tap the word MENU at the top of the menu 5 times quickly to turn g on or off on that iPad (V71). g's chat stays behind g's own sign-in. Base44 won't let g be shown inside another page, and iPadOS won't let a link open a web app saved to the home screen, so since V72 the page is a launcher: ← Back, a big **OPEN g** button (opens g in Safari), and a reminder that swiping sideways along the bottom edge of the screen flips between g's home-screen app and Outside In once both are open.

## Life around the house (V77)

On the Winter scene, what really goes on outside a house in the Happy Valley woods, at the times it really happens (`wildlife.js`, following the Pennsylvania Game Commission). **Deer** cross in ones to fours, most at dawn and dusk, some at night, more in the fall rut; they stop to graze and flick a white tail. **Black bears** come by at dusk, dawn and night from April through October, stopping at the trash can; they den in mid to late November, so in late November one is rare, from late December to mid-March there are none, and a few wander in March. A **stray dog** trots by now and then in daylight. **Birds** cross by day: a few at a time, bigger flocks in migration (songbirds late April to mid-May and mid-August to October). **Canada geese** fly over in a V from late February to mid-April and September through December. A **jet** passes high overhead every half hour or so: a contrail by day if the sky is clear enough, blinking lights at night. Fewer come out in rain or snow, none in a downpour. Preview one with `?wild=deer`, `bear`, `dog`, `birds`, `geese` or `jet`.

## The homestead (V78)

The house now has a homestead around it (`homestead.js`). Left of the house, a **solar array of 16 panels** in two rows of eight on a ground rack. The scene looks south, and panels face south, so you see their backs: the gray backsheets, frames, junction boxes and legs. When it snows, snow really piles on the panels (a white cap on each one) and slides off as the sun comes out. The panels are **wired the way a ground mount really is** (V79): all 16 in one series string, each panel's + lead plugged into the next one's -, the two rows joined at the left end, so both ends of the string come out at the right end. Those two home-run wires drop down the last leg into a conduit that goes into the ground; the run is buried, and comes back up the house wall into a gray disconnect box. Beside it, a **stone well** with a roof, rope and bucket. Right of the trash can, an old split-rail **paddock** with a coop. Who is in it changes from day to day: horses, goats, hens (in by dark), and once in a while a peacock that fans its tail. They wander slowly.

**Someone lives there.** By day, every 20 to 70 minutes, a person in a red coat walks out to do one real job: clearing snow off the panels one by one with a long brush (when there's snow on them), checking the panels, drawing a bucket of water at the well and carrying it back, or bringing hay to the paddock (mostly early and late in the day). It's slow on purpose. Look away and look back, and they've moved on to the next panel or are in with the animals. Everyone goes in by dark. Preview an outing with `?homestead=work`.

## Radio (V80)

Swipe up from the middle of any scene and a radio comes up (`radio.js`); start the swipe mid-screen, not at the bottom edge, which belongs to the iPad. No genres, the way people really listen: pick a decade, **70s, 80s, 90s, 00s, 10s or 20s**, and the dial only tunes stations playing that decade's music. From November 15 to Epiphany (January 6) a seventh button, **XMAS**, tunes Christmas stations. The stations are real internet radio stations playing their own public streams, found through Radio Browser (radio-browser.info), a free community directory with no key and no bill; the station holds the license, the app just plays it. Only streams an iPad can play over https are used, most-liked first, English-speaking countries first, up to 14 per decade, and the lists are kept on the iPad for 12 hours. Drag the needle or tap ◀ ▶; between stations there's a soft, quiet hiss made on the iPad itself, and letting go settles onto the nearest station. A dead stream says NO SIGNAL; turn the dial. ⏻ turns it on and off; swipe down or tap the minimize bar (top right; V82, it was an ✕) and the radio tucks away and keeps playing over the scenes. It plays until it's turned off: on every scene, in Kitchen, under the night clock, and when the screen goes dark (V81). The station is announced to the iPad as what's playing, so its name shows on the lock screen with pause and next/previous-station buttons, which iPadOS treats as music to keep going; pause there turns the radio off. If something cuts it off (a call, another app taking the sound) it picks back up when you come back, if the radio is still on, and a stream that drops is retried a few times before NO SIGNAL. Closing the app itself stops it. The first-time guide now mentions the radio too. The dial window is lit from behind like an old tube radio's (`tubeglow.js`, V108): warm pools of light where three tubes sit behind the glass, dimmer between them and toward the ends, a faint flicker and a sheen on the glass; the tubes take a moment to warm up when it's turned on, and the window goes dark when it's off. Left alone for 30 seconds, the radio fades almost away so the scene shows through (`radiodim.js`, V107); one touch brings it back without pressing anything, except ⏻, which works on the first tap even while faded (V110; before, coming back from a locked screen, the first tap on ⏻ only woke the radio, so it seemed not to turn off). The lit dial doesn't fade (V109): it stays glowing, a little brighter, with a soft spill of light around the window, like a tube radio left on in a dark room. The TV side never fades. Starting the radio turns the TV off (V107), just as starting a movie turns the radio off. **NEWS/TALK** (V83; labeled NEWS/TALK since V84, because it's both: all-news stations, news/talk with local hosts and call-ins, public radio), on its own row with XMAS so the decade buttons stay full size: news and talk stations in the iPad's own state (Menu → LOCATION; Happy Valley by default), nearest first where the directory knows where a station is (within 60 miles shows LOCAL), so around Happy Valley the State College stations come before Pittsburgh or Philadelphia. At the end of the dial, a national pair, one from each side: Fox News and MSNBC, or Newsmax and CNN if those aren't in the directory. The pair only goes on together, never one side alone. How many local stations show up depends on which ones put their streams in the directory.

## TV (V85)

The set that comes up when you swipe up from the middle has two buttons at the top, **RADIO** and **TV** (`tv.js`). TV plays real full-length movies right in the app, from the Internet Archive (archive.org): free, no key, no bill, and it allows its films to play inside other apps. They're mostly public-domain classics, so the channels are **30s, 40s, 50s, 60s, 70s, CARTOONS and OLD TV** (the 70s channel, V87, is thin: only a few 70s films slipped into the public domain). For newer movies, three buttons under the channels, **TUBI, PLUTO TV and YOUTUBE** (V87), open those free-with-ads services in their own app if it's installed, or their site; close it and you're back in Rising Code. Each channel takes the 60 most-watched films and deals out 30 of them in a new order every day (V102), so the guide doesn't open on the same title at number 1 each day; the order holds all day. Lineups refresh every 6 hours (they used to be kept a day), so films the Archive adds or removes show up or drop off the same day; if the Archive can't be reached, the last lineup is used instead of NO SIGNAL. ◀ ▶ flips to the next movie, with a moment of snow between them. **☰ TV GUIDE** (`tvguide.js`, V101) brings up the whole lineup over the set, styled after the old cable listings channel (navy rows, white titles, a yellow ▶ on every row): channel tabs along the top, scroll with a finger, tap a row to tune to that movie, ✕ to close. What's playing is marked ON NOW. Tap ▶ on the picture to start it (the iPad won't start a movie with sound by itself). **FULL SCREEN** fills the iPad or Chromebook; a shrink button (arrows pointing in, top right; V86) brings it back to the TV set. On the iPad, which won't let a page put one part of itself full screen, the picture instead stretches over the whole screen (V92); in the home-screen app that looks the same, with the same shrink button. **OLD TV** is episodes of old 1950s–60s TV shows whose copyright lapsed. Picking a channel or a movie quiets the radio, so they never play over each other; ⏻ turns the TV off; minimizing the set leaves the movie going. The set remembers whether you were on RADIO or TV.

## Weather details

One more swipe left, past Winter (swipe right to go back). In `details.js`, laid out like a home weather station's indoor console: outdoor temperature with feels-like and today's high and low, a wind compass (arrowhead on the side the wind comes from) with speed and gusts, humidity and dew point, pressure with a rising/falling/steady arrow, today's rain chance, cloud cover, and sunrise and sunset, from the nearest NOAA station with a recent reading (falling back to this hour's forecast); then the next 72 hours hour by hour from the NOAA forecast grid in four strips on one time line: temperature and dew point; humidity, with the drying hours shaded (humidity under 50% and under a 20% chance of rain); chance of rain or snow; wind and gusts. Lines differ by style and brightness and are labeled. Preview with `?details-sample`.

The temperature and the weather icon never overlap: on a narrow tile (an iPad standing up) the number gets a little smaller to make room (V67). A station reading must be under 90 minutes old; the nearest of five stations with a fresh reading is used, and the reading line shows its age. If none is fresh, the page shows NOAA's forecast for this exact spot for this hour and says how old the newest station reading was (V74). Everything that was white on this page is amber (V60); at night the weather icon keeps its own colors, a silver moon in its real phase with its darker seas and the phase named under it, so a full moon doesn't read as a sun (V75): the readings, the words, the main graph line, the rain-chance bars, the wind arrow and the weather icon.

## Kitchen (V34)

One more swipe left past Weather Details (swipe right anywhere but the text box, or tap ← Back, to go back). In `kitchen.js`: **Use my ingredients**, one box and one button. Type what you have, comma separated, and tap Find meals for up to three ideas. Each says what of yours it uses, **⚠ ASSUMES you have** the pantry staples you didn't list (salt, pepper, oil, butter, flour, sugar, water, as the recipe needs), and **STILL NEEDS** anything else it lacks. There is no AI or server behind it: the ideas come from about 25 built-in recipes in `RECIPES` (add more there), so unusual ingredients may match nothing.

## Menu

Swipe down on any scene, Kitchen included, for the menu (it opens as soon as the drag is long enough; start the swipe below the top fifth of the screen, at least 120 px down, so it never fights the iPad's own pull-down from the top edge); swipe up or tap ✕ to close (on a computer, the down and up arrows or Escape). Nothing appears on the scenes themselves. In `menu.js`: **Sound** picks what plays when the radar catches Santa (same four as tapping the Christmas display), and **My corner** picks one personal wildcard for the household (poem of the day, what can I make?), remembered on the device. The wildcard pages are still to be built.

**Around Happy Valley (V33).** The menu lists upcoming local events from the YMCA of Centre County's events calendar (its public Events API, fetched when the menu opens and kept 15 minutes), each linking to its page, with the source named. This is the only local source a browser can read from this page: the local news sites block scripts or have no readable feed, and the school district's and county newspaper's sites gave none either (no CORS, or timed out). Local news would need a small proxy. If the YMCA call fails the menu says so and retries the next time it opens. Since V98 the section only shows when the app is on Happy Valley or the iPad is within about 60 miles of it; anywhere else (California, say) there's no events section, since the calendar is only Happy Valley's.

## Kitchen: TheMealDB

Under the built-in quick ideas, the Kitchen also searches TheMealDB (themealdb.com), a free recipe database (`mealdb.js`). The free key searches one ingredient at a time, so it searches each thing you typed (and the last word of phrases like "frozen peas"), ranks dishes by how many of your ingredients they use, and opens the top three: what of yours it uses, what pantry staples it assumes, what you'd still need, and the full steps under HOW TO MAKE IT, plus a video link when there is one. TheMealDB's free key is meant for personal projects.

The KITCHEN heading and the buttons (Find meals and Back) are amber, to match the weather station page (V63).

## Menu scrolling (V70)

Dragging up on the menu scrolls it. A swipe up only closes the menu when it was already scrolled all the way to the bottom as the finger went down, and it has to be a good long swipe. The ✕ button always closes it. Before this, any upward swipe closed the menu, so long sections like the verses couldn't be scrolled to.

## Night clock

In `nightclock.js`. During the hours picked in the menu (Off, 9 PM–6 AM by default, 10 PM–6 AM, or 11 PM–7 AM), any scene is covered by a big, dim clock on black with the date and the moon's phase. Tap it to use the app; after 5 minutes it goes back to the clock until morning. It drifts slightly each minute so nothing burns in. Preview with `?night`.

## First-time guide

In `firstrun.js`. The first time the app opens on a device it shows one line: **swipe down from the center of the screen for settings and instructions** (V93; it used to show every gesture at once). Swiping down right there opens the menu, with HOW IT WORKS at the top; a tap just closes it. It never shows again on that device. Preview with `?intro`.

## EMERGENCIES: Respond inside Outside In (V145)

A round white button with the blue Star of Life and the word EMERGENCIES under it sits in the bottom-right corner of Home (the house). It shows on Home only, and hides while the menu, the radio and TV, the alert page, the night clock or a guide is open. Tapping it opens the full Respond app (durk00/respond) in this app's own code (`respond.js`), with no Base44, no login and no other site:

- **Terms first, every time:** Respond's terms of use, word for word, and nothing else opens until "Yes — I Understand and Accept" is tapped. "Not now" goes back to Outside In.
- **Then everything Respond does:** its home screen (EMERGENCY, "I'm not sure what's happening", Call 911, Local Health Alerts), the five categories and twenty situations, the Call 911 First screen, and the steps, read aloud, with Say "What's next?" / "Go back" / "Repeat" where the browser can listen and the same buttons on screen everywhere. ✕ Close (or Escape) goes back to the house.
- **The protocols are Respond's, not rewritten:** `respond-data.js` is copied word for word from Respond's code. The two protocols Respond marks DRAFT (Unresponsive but Breathing, and Child CPR) say "DRAFT — awaiting responder review" on screen. To change a protocol, change it in Respond first, after responder review, then copy it again.
- **Why not a red cross:** a red cross on a white background is the Red Cross emblem, which U.S. law (18 U.S.C. 706) reserves for the American Red Cross and military medical services.

(The home-screen version line is left alone here because other open pull requests change it too.)

## Verses for the week

A My Corner choice (`verses.js`). Two or three King James verses picked for where the day falls in the Church year (Advent, Christmas, Lent, Holy Week, Easter season, Ordinary Time), changing each week, with their own passages on Christmas, Epiphany, Ash Wednesday, Palm Sunday, Good Friday, Easter, Pentecost, the Assumption, All Saints, the Immaculate Conception and Thanksgiving week. Easter and Advent are worked out for each year. The words come from bible-api.com (public-domain KJV) and are kept on the device; edit the passage lists at the top of `verses.js`.

## Screensaver choice

Menu → SCREENSAVER: **Auto** (the Christmas display from November 20 through January 6, plain code rain the rest of the year), **Christmas** all year, **Code rain**: the same rising blue, green and white code with no tree, star, Santa, radar or sounds; or **Earth** (`earth.js`): the globe drawn in rising code with real continents (a built-in 2-degree land map; oceans blue, land green, ice white), the real day and night line for the current date and time, a starfield and a thin atmosphere, turning in real time, once a day, seen from a spot fixed against the sun: the middle of the globe is always where it's about 4 in the afternoon, so day fills the left and evening and night come round on the right (V76; it used to turn once every 7 minutes). The Earth is flying through a dust cloud (`debris.js`): a haze of fine dust drifts past, and rocks big and small tumble across the screen in every direction, often in groups of 1 to 5, some coming straight at you and growing as they come. Most pass behind the globe; now and then a big one sweeps past in front. The night half stays readable under a deep blue glow, the blue marble at night (V61; blue instead of green since V64), with warm city lights shining where people actually live (`lights.js`, built from the GeoNames list of about 34,000 towns and cities over 15,000 people, added up in 1-degree squares). The lights fade in across the line between day and night. Ordinary cloud cover drifts over the globe (`clouds.js`, V65): made-up but cloud-like, cloudy in some places and clear in others, thicker in the stormy belts and thinner near 25 degrees, moving slowly east and changing shape, white by day and dim at night. Each rock is lit on the sun's side. Starcloud-1, the first data center in space (a 60 kg satellite carrying an NVIDIA H100, launched by SpaceX on November 2, 2025), circles the globe on its real orbit as a short white line with its name on top (`sat.js`, V62). It asks CelesTrak for the newest orbit twice a day (NORAD 66303) and falls back to the built-in orbit from November 24, 2026; checked against SGP4, it stays within about 10 km over a week. It hides when it passes behind the Earth. The rocks sit far off, and meteors streak across the sky: very quick, thin to thick, in any direction, sometimes a few at once. Remembered on the device.

## Portrait screensaver

Menu → SCREENSAVER → **Portrait** (`face.js`): an AI's face in amber code, drawn from the picture William chose (an amber circuit-and-binary face). The picture is built in as a small brightness map: it glows softly underneath, and every spot of it is a character of code, bright where the picture is bright. The picture fills the screen top to bottom in either orientation. Streams of small, very fast code rise through the face, and the head of each stream sparks white-gold as it climbs, like the nodes on the Christmas tree, with a stronger pop now and then. The eyes glow with the fastest-changing code. Behind the head, a second layer of thick code rises more slowly than the face, so the picture has depth. The face and the eyes each change pace at random (slow, steady, fast), holding each for 1 to 5 minutes. Outside the picture, dim dark-blue code moves very slowly.

## Alert page fits an iPhone, and long alerts scroll (V143)

The page that opens when you tap the alert banner sat too high on an iPhone: its ✕ was up under the clock and the notch, partly cut off, a long alert was simply cut short, and a drag on the page pulled down the menu. Now, on a phone, the page starts below the status bar and notch, a long alert name wraps clear of the ✕, and the footer clears the home bar. A long alert's text scrolls inside the page: drag it on a phone or iPad, or use the mouse wheel, trackpad or arrow keys on a Chromebook. It fades softly at the edges where there's more, with a thin bar showing where you are. While the page is open, a drag on it only scrolls: it never opens the menu or the radio and never changes screen; tap ✕ to close it as before. A short alert looks the same as before (on a phone it just sits lower). iPad and Chromebook layouts are unchanged. Preview a long one with `?alert=long` on the address. (The home-screen version line still reads V141; it should become V143 when this is merged.)
