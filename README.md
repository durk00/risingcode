# Rising Code

Rising Code is a window. It shows what is really happening outside your house right now: the sky, the weather, the sun and the moon where they actually are, the animals that come by when they really would. Add a radio, a TV and a kitchen, and it's a quiet corner to step back from the noise of the day. There is no news feed, no notifications, no ads and no account. Everything it shows is real, and when a reading is old, it says so. Made for an iPad; works in any modern browser.

Full plain-English instructions are in the app: Menu → **HOW IT WORKS** (`howto.js`, V89). The first-time guide points there too. The app's name is set once at the top of `howto.js` (and in the page title and icon name) so it can be changed later without touching the address.

## Use it on an iPad

1. Open `index.html` in Safari (or the GitHub Pages link, if Pages is turned on for this repo).
2. Tap **Share → Add to Home Screen**. Opened from the home screen it runs full screen, with no browser bars.
3. Tap once to go full screen when running in Safari. It asks the iPad to keep the screen awake while it's showing; if the screen still dims, set **Settings → Display & Brightness → Auto-Lock** to Never while it runs.

The home-screen icon is William's amber code face (`apple-touch-icon.png`, V73). The iPad only takes an icon when the app is added, so after a change: delete the old icon, add it again from Safari, and redo the settings (the new icon starts with fresh storage; tap MENU 5 times for the g page).

## Adjusting it

Everything is in `index.html`:

- **Colors:** the `--ice` (blue), `--leaf` (green), `--ember` (red, used only by the tree), `--frost` (white) and `--halo` (the star's glow) values at the top of the style block.
- **Tree:** `buildTree()` sets its size and position; the star pulses in `draw()`.
- **Color mix:** `colorFor()` and `nextColor()`: mostly blue and green, white now and then.
- **Speed:** the `speed:` line in `makeStream()` sets each column's base speed. `nextPhase()` drifts the whole field between slow and fast at random, with an occasional short rush.
- **Density:** the `size =` line in `resize()` (smaller characters, more columns) and the number of `makeStream` calls per column.

It honors the device's Reduce Motion setting by running slower.

## Sound credit

The toot when the radar line catches Santa is the last 0.6 seconds of "fart01" by brassoletto on Freesound (freesound.org, sound 454562).

## Winter scene

Swipe left on the Christmas display for the Winter scene; swipe right to go back (arrow keys on a computer). It's in `winter.js`: a landscape with a house, lit windows and a chimney that always smokes, matched to today's NOAA forecast for Centre Hall, PA (api.weather.gov, refreshed hourly):

- **Day or night** from the real sunrise and sunset for Centre Hall (since V46), with the sky brightening over the hour around sunrise and dimming over the hour around sunset: sun and blue sky by day, moon and stars by night.
- **Sky** from the forecast words: clear, partly cloudy, cloudy or fog.
- **Rain, snow or a mix** falling: since V44 from the nearest NOAA station's current conditions when it has a reading from the last 2 hours (so it shows what is really coming down), otherwise from the forecast; snow comes down light, moderate or heavy by the forecast rate (under 0.1, 0.1 to 0.5, over 0.5 inches an hour).
- **Ground** is white when snow is in today's forecast and piles up while it falls (depth set by today's total); otherwise it's bare, and leftover snow melts away slowly.
- **Tap** for a three-day forecast box to the left of the house (day, forecast with a weather icon, high and low, chance of precipitation); tap again to close. Taps on Winter make no sound.
- **Weather alerts** from NOAA for Centre Hall (checked every 10 minutes) show as a red banner across the top: tap it for the details, swipe it sideways to dismiss it. A dismissed alert stays away; a new one shows. Preview with `?alert`.
- **Upcoming snow** is still previewed: if snow is due in the next two days, the top line says when and about how much, and clouds gather in its last 12 hours.

Preview any weather with `?wx=sunny`, `partly`, `cloudy`, `fog`, `rain`, `mix`, `snow-light`, `snow`, `snow-heavy` or `coming`, plus `&time=day` or `&time=night`. The thresholds are at the top of `winter.js`.

## What the weather is doing right now (V58)

`wxnow.js` reads the last several readings from up to 5 nearby NOAA stations and takes the newest from the last 2 hours. When NOAA leaves a reading's words blank, it builds them from what the station measured: what is falling, and the cloud layers (clear, few, scattered, broken, overcast). Winter and Details both use it. When no station reading is available and the forecast only says a chance, Winter shows clouds but nothing falling. When the words say clear (Clear, Mostly Clear, Mostly Sunny), no clouds are drawn; only "Partly" draws a few (V59).

## Location (V66)

The weather, alerts and daylight follow wherever the iPad is in the US (`place.js`). The first time, the iPad asks "Allow location?". If allowed, the spot is rounded to about half a mile, kept on the device, and only sent to NOAA (api.weather.gov) to get that place's weather. NOAA names the nearest town, and the screens say it ("NOAA · FRESNO"). It's checked again each time the app starts. If location isn't allowed, the spot is outside the US, or it can't tell, everything stays on Centre Hall, PA. Menu → LOCATION switches between **Where this iPad is** and **Centre Hall, PA**. The clock and the Earth's day and night were already right anywhere. The Around Penns Valley events stay Penns Valley.

V66 also fixed sunrise and sunset west of about Chicago: the sunset had come out as yesterday's, which would have left the Winter scene dark all afternoon in California.

## Sun and moon on their real paths (V68)

On the Winter scene the sun and the moon move across the sky where they really are, seen from this iPad's place (`skypath.js`). The scene faces south: they come up on the left (east), arc across, and go down on the right (west), behind the hills. The sun turns warmer near the horizon. The moon keeps its real phase, and shows pale in the daytime when it's up. Both fade behind cloud. The sun is accurate to about a hundredth of a degree and the moon to about half a degree, checked against PyEphem. The previews ?time=day and ?time=night keep the old fixed spot.

## g (V69)

William's own AI, g (go-grow-gain.base44.app), as a page of this app, one swipe left past Kitchen (`gpage.js`), so he can chat with g without leaving the screensaver. It only appears on an iPad where it was turned on: open the app once with `?g=on` at the end of the address (`?g=off` removes it). An app added to the home screen keeps its own storage, separate from Safari, so from inside the app: tap the word MENU at the top of the menu 5 times quickly to turn g on or off on that iPad (V71). g's chat stays behind g's own sign-in. Base44 won't let g be shown inside another page, and iPadOS won't let a link open a web app saved to the home screen, so since V72 the page is a launcher: ← Back, a big **OPEN g** button (opens g in Safari), and a reminder that swiping sideways along the bottom edge of the screen flips between g's home-screen app and Rising Code once both are open.

## Life around the house (V77)

On the Winter scene, what really goes on outside a house in the Penns Valley woods, at the times it really happens (`wildlife.js`, following the Pennsylvania Game Commission). **Deer** cross in ones to fours, most at dawn and dusk, some at night, more in the fall rut; they stop to graze and flick a white tail. **Black bears** come by at dusk, dawn and night from April through October, stopping at the trash can; they den in mid to late November, so in late November one is rare, from late December to mid-March there are none, and a few wander in March. A **stray dog** trots by now and then in daylight. **Birds** cross by day: a few at a time, bigger flocks in migration (songbirds late April to mid-May and mid-August to October). **Canada geese** fly over in a V from late February to mid-April and September through December. A **jet** passes high overhead every half hour or so: a contrail by day if the sky is clear enough, blinking lights at night. Fewer come out in rain or snow, none in a downpour. Preview one with `?wild=deer`, `bear`, `dog`, `birds`, `geese` or `jet`.

## The homestead (V78)

The house now has a homestead around it (`homestead.js`). Left of the house, a **solar array of 16 panels** in two rows of eight on a ground rack. The scene looks south, and panels face south, so you see their backs: the gray backsheets, frames, junction boxes and legs. When it snows, snow really piles on the panels (a white cap on each one) and slides off as the sun comes out. The panels are **wired the way a ground mount really is** (V79): all 16 in one series string, each panel's + lead plugged into the next one's -, the two rows joined at the left end, so both ends of the string come out at the right end. Those two home-run wires drop down the last leg into a conduit that goes into the ground; the run is buried, and comes back up the house wall into a gray disconnect box. Beside it, a **stone well** with a roof, rope and bucket. Right of the trash can, an old split-rail **paddock** with a coop. Who is in it changes from day to day: horses, goats, hens (in by dark), and once in a while a peacock that fans its tail. They wander slowly.

**Someone lives there.** By day, every 20 to 70 minutes, a person in a red coat walks out to do one real job: clearing snow off the panels one by one with a long brush (when there's snow on them), checking the panels, drawing a bucket of water at the well and carrying it back, or bringing hay to the paddock (mostly early and late in the day). It's slow on purpose. Look away and look back, and they've moved on to the next panel or are in with the animals. Everyone goes in by dark. Preview an outing with `?homestead=work`.

## Radio (V80)

Swipe up from the middle of any scene and a radio comes up (`radio.js`); start the swipe mid-screen, not at the bottom edge, which belongs to the iPad. No genres, the way people really listen: pick a decade, **70s, 80s, 90s, 00s, 10s or 20s**, and the dial only tunes stations playing that decade's music. From November 15 to Epiphany (January 6) a seventh button, **XMAS**, tunes Christmas stations. The stations are real internet radio stations playing their own public streams, found through Radio Browser (radio-browser.info), a free community directory with no key and no bill; the station holds the license, the app just plays it. Only streams an iPad can play over https are used, most-liked first, English-speaking countries first, up to 14 per decade, and the lists are kept on the iPad for 12 hours. Drag the needle or tap ◀ ▶; between stations there's a soft, quiet hiss made on the iPad itself, and letting go settles onto the nearest station. A dead stream says NO SIGNAL; turn the dial. ⏻ turns it on and off; swipe down or tap the minimize bar (top right; V82, it was an ✕) and the radio tucks away and keeps playing over the scenes. It plays until it's turned off: on every scene, in Kitchen, under the night clock, and when the screen goes dark (V81). The station is announced to the iPad as what's playing, so its name shows on the lock screen with pause and next/previous-station buttons, which iPadOS treats as music to keep going; pause there turns the radio off. If something cuts it off (a call, another app taking the sound) it picks back up when you come back, if the radio is still on, and a stream that drops is retried a few times before NO SIGNAL. Closing the app itself stops it. The first-time guide now mentions the radio too. **NEWS/TALK** (V83; labeled NEWS/TALK since V84, because it's both: all-news stations, news/talk with local hosts and call-ins, public radio), on its own row with XMAS so the decade buttons stay full size: news and talk stations in the iPad's own state (Menu → LOCATION; Centre Hall by default), nearest first where the directory knows where a station is (within 60 miles shows LOCAL), so in Centre County the State College stations come before Pittsburgh or Philadelphia. At the end of the dial, a national pair, one from each side: Fox News and MSNBC, or Newsmax and CNN if those aren't in the directory. The pair only goes on together, never one side alone. How many local stations show up depends on which ones put their streams in the directory.

## TV (V85)

The set that comes up when you swipe up from the middle has two buttons at the top, **RADIO** and **TV** (`tv.js`). TV plays real full-length movies right in the app, from the Internet Archive (archive.org): free, no key, no bill, and it allows its films to play inside other apps. They're mostly public-domain classics, so the channels are **30s, 40s, 50s, 60s, 70s, CARTOONS and OLD TV** (the 70s channel, V87, is thin: only a few 70s films slipped into the public domain). For newer movies, three buttons under the channels, **TUBI, PLUTO TV and YOUTUBE** (V87), open those free-with-ads services in their own app if it's installed, or their site; close it and you're back in Rising Code. Most-watched first, up to 30 per channel, lists kept a day. ◀ ▶ flips to the next movie, with a moment of snow between them. Tap ▶ on the picture to start it (the iPad won't start a movie with sound by itself). **FULL SCREEN** fills the iPad or Chromebook; a shrink button (arrows pointing in, top right; V86) brings it back to the TV set. **OLD TV** is episodes of old 1950s–60s TV shows whose copyright lapsed. Picking a channel or a movie quiets the radio, so they never play over each other; ⏻ turns the TV off; minimizing the set leaves the movie going. The set remembers whether you were on RADIO or TV.

## Weather details

One more swipe left, past Winter (swipe right to go back). In `details.js`, laid out like a home weather station's indoor console: outdoor temperature with feels-like and today's high and low, a wind compass (arrowhead on the side the wind comes from) with speed and gusts, humidity and dew point, pressure with a rising/falling/steady arrow, today's rain chance, cloud cover, and sunrise and sunset, from the nearest NOAA station with a recent reading (falling back to this hour's forecast); then the next 72 hours hour by hour from the NOAA forecast grid in four strips on one time line: temperature and dew point; humidity, with the drying hours shaded (humidity under 50% and under a 20% chance of rain); chance of rain or snow; wind and gusts. Lines differ by style and brightness and are labeled. Preview with `?details-sample`.

The temperature and the weather icon never overlap: on a narrow tile (an iPad standing up) the number gets a little smaller to make room (V67). A station reading must be under 90 minutes old; the nearest of five stations with a fresh reading is used, and the reading line shows its age. If none is fresh, the page shows NOAA's forecast for this exact spot for this hour and says how old the newest station reading was (V74). Everything that was white on this page is amber (V60); at night the weather icon keeps its own colors, a silver moon in its real phase with its darker seas and the phase named under it, so a full moon doesn't read as a sun (V75): the readings, the words, the main graph line, the rain-chance bars, the wind arrow and the weather icon.

## Kitchen (V34)

One more swipe left past Weather Details (swipe right anywhere but the text box, or tap ← Back, to go back). In `kitchen.js`: **Use my ingredients**, one box and one button. Type what you have, comma separated, and tap Find meals for up to three ideas. Each says what of yours it uses, **⚠ ASSUMES you have** the pantry staples you didn't list (salt, pepper, oil, butter, flour, sugar, water, as the recipe needs), and **STILL NEEDS** anything else it lacks. There is no AI or server behind it: the ideas come from about 25 built-in recipes in `RECIPES` (add more there), so unusual ingredients may match nothing.

## Menu

Swipe down on any scene, Kitchen included, for the menu (it opens as soon as the drag is long enough; start the swipe below the top fifth of the screen, at least 120 px down, so it never fights the iPad's own pull-down from the top edge); swipe up or tap ✕ to close (on a computer, the down and up arrows or Escape). Nothing appears on the scenes themselves. In `menu.js`: **Sound** picks what plays when the radar catches Santa (same four as tapping the Christmas display), and **My corner** picks one personal wildcard for the household (poem of the day, what can I make?), remembered on the device. The wildcard pages are still to be built.

**Around Penns Valley (V33).** The menu lists upcoming Penns Valley events from the YMCA of Centre County's calendar (its public Events API, fetched when the menu opens and kept 15 minutes), each linking to its page, with the source named. This is the only local source a browser can read from this page: StateCollege.com blocks scripts (403), the Centre County news feed was empty, the Penns Valley school district's site and the Centre County Gazette gave no readable feed (no CORS, or timed out), and pvsd.org is Perkiomen Valley, not Penns Valley. Local news would need a small proxy. If the YMCA call fails the menu says so and retries the next time it opens.

## Kitchen: TheMealDB

Under the built-in quick ideas, the Kitchen also searches TheMealDB (themealdb.com), a free recipe database (`mealdb.js`). The free key searches one ingredient at a time, so it searches each thing you typed (and the last word of phrases like "frozen peas"), ranks dishes by how many of your ingredients they use, and opens the top three: what of yours it uses, what pantry staples it assumes, what you'd still need, and the full steps under HOW TO MAKE IT, plus a video link when there is one. TheMealDB's free key is meant for personal projects.

The KITCHEN heading and the buttons (Find meals and Back) are amber, to match the weather station page (V63).

## Menu scrolling (V70)

Dragging up on the menu scrolls it. A swipe up only closes the menu when it was already scrolled all the way to the bottom as the finger went down, and it has to be a good long swipe. The ✕ button always closes it. Before this, any upward swipe closed the menu, so long sections like the verses couldn't be scrolled to.

## Night clock

In `nightclock.js`. During the hours picked in the menu (Off, 9 PM–6 AM by default, 10 PM–6 AM, or 11 PM–7 AM), any scene is covered by a big, dim clock on black with the date and the moon's phase. Tap it to use the app; after 5 minutes it goes back to the clock until morning. It drifts slightly each minute so nothing burns in. Preview with `?night`.

## First-time guide

In `firstrun.js`. The first time the app opens on a device, a one-time guide shows an arrow pointing down to the settings menu, arrows for swiping between screens, and what a tap does. One tap closes it for good on that device. Preview with `?intro`.

## Verses for the week

A My Corner choice (`verses.js`). Two or three King James verses picked for where the day falls in the Church year (Advent, Christmas, Lent, Holy Week, Easter season, Ordinary Time), changing each week, with their own passages on Christmas, Epiphany, Ash Wednesday, Palm Sunday, Good Friday, Easter, Pentecost, the Assumption, All Saints, the Immaculate Conception and Thanksgiving week. Easter and Advent are worked out for each year. The words come from bible-api.com (public-domain KJV) and are kept on the device; edit the passage lists at the top of `verses.js`.

## Screensaver choice

Menu → SCREENSAVER: **Auto** (the Christmas display from November 20 through January 6, plain code rain the rest of the year), **Christmas** all year, **Code rain**: the same rising blue, green and white code with no tree, star, Santa, radar or sounds; or **Earth** (`earth.js`): the globe drawn in rising code with real continents (a built-in 2-degree land map; oceans blue, land green, ice white), the real day and night line for the current date and time, a starfield and a thin atmosphere, turning in real time, once a day, seen from a spot fixed against the sun: the middle of the globe is always where it's about 4 in the afternoon, so day fills the left and evening and night come round on the right (V76; it used to turn once every 7 minutes). The Earth is flying through a dust cloud (`debris.js`): a haze of fine dust drifts past, and rocks big and small tumble across the screen in every direction, often in groups of 1 to 5, some coming straight at you and growing as they come. Most pass behind the globe; now and then a big one sweeps past in front. The night half stays readable under a deep blue glow, the blue marble at night (V61; blue instead of green since V64), with warm city lights shining where people actually live (`lights.js`, built from the GeoNames list of about 34,000 towns and cities over 15,000 people, added up in 1-degree squares). The lights fade in across the line between day and night. Ordinary cloud cover drifts over the globe (`clouds.js`, V65): made-up but cloud-like, cloudy in some places and clear in others, thicker in the stormy belts and thinner near 25 degrees, moving slowly east and changing shape, white by day and dim at night. Each rock is lit on the sun's side. Starcloud-1, the first data center in space (a 60 kg satellite carrying an NVIDIA H100, launched by SpaceX on November 2, 2025), circles the globe on its real orbit as a short white line with its name on top (`sat.js`, V62). It asks CelesTrak for the newest orbit twice a day (NORAD 66303) and falls back to the built-in orbit from November 24, 2026; checked against SGP4, it stays within about 10 km over a week. It hides when it passes behind the Earth. The rocks sit far off, and meteors streak across the sky: very quick, thin to thick, in any direction, sometimes a few at once. Remembered on the device.

## Portrait screensaver

Menu → SCREENSAVER → **Portrait** (`face.js`): an AI's face in amber code, drawn from the picture William chose (an amber circuit-and-binary face). The picture is built in as a small brightness map: it glows softly underneath, and every spot of it is a character of code, bright where the picture is bright. The picture fills the screen top to bottom in either orientation. Streams of small, very fast code rise through the face, and the head of each stream sparks white-gold as it climbs, like the nodes on the Christmas tree, with a stronger pop now and then. The eyes glow with the fastest-changing code. Behind the head, a second layer of thick code rises more slowly than the face, so the picture has depth. The face and the eyes each change pace at random (slow, steady, fast), holding each for 1 to 5 minutes. Outside the picture, dim dark-blue code moves very slowly.
