# Rising Code

Columns of glowing code rising up the screen in blue, green and a little white, changing color at random like Christmas lights, with a Christmas tree of red code and a pulsing star on top. Made as a screensaver for an iPad; works in any modern browser.

## Use it on an iPad

1. Open `index.html` in Safari (or the GitHub Pages link, if Pages is turned on for this repo).
2. Tap **Share → Add to Home Screen**. Opened from the home screen it runs full screen, with no browser bars.
3. Tap once to go full screen when running in Safari. It asks the iPad to keep the screen awake while it's showing; if the screen still dims, set **Settings → Display & Brightness → Auto-Lock** to Never while it runs.

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

## Weather details

One more swipe left, past Winter (swipe right to go back). In `details.js`, laid out like a home weather station's indoor console: outdoor temperature with feels-like and today's high and low, a wind compass (arrowhead on the side the wind comes from) with speed and gusts, humidity and dew point, pressure with a rising/falling/steady arrow, today's rain chance, cloud cover, and sunrise and sunset, from the nearest NOAA station with a recent reading (falling back to this hour's forecast); then the next 72 hours hour by hour from the NOAA forecast grid in four strips on one time line: temperature and dew point; humidity, with the drying hours shaded (humidity under 50% and under a 20% chance of rain); chance of rain or snow; wind and gusts. Lines differ by style and brightness and are labeled. Preview with `?details-sample`.

Everything that was white on this page is amber (V60): the readings, the words, the main graph line, the rain-chance bars, the wind arrow and the weather icon.

## Kitchen (V34)

One more swipe left past Weather Details (swipe right anywhere but the text box, or tap ← Back, to go back). In `kitchen.js`: **Use my ingredients**, one box and one button. Type what you have, comma separated, and tap Find meals for up to three ideas. Each says what of yours it uses, **⚠ ASSUMES you have** the pantry staples you didn't list (salt, pepper, oil, butter, flour, sugar, water, as the recipe needs), and **STILL NEEDS** anything else it lacks. There is no AI or server behind it: the ideas come from about 25 built-in recipes in `RECIPES` (add more there), so unusual ingredients may match nothing.

## Menu

Swipe down on any scene, Kitchen included, for the menu (it opens as soon as the drag is long enough; start the swipe below the top fifth of the screen, at least 120 px down, so it never fights the iPad's own pull-down from the top edge); swipe up or tap ✕ to close (on a computer, the down and up arrows or Escape). Nothing appears on the scenes themselves. In `menu.js`: **Sound** picks what plays when the radar catches Santa (same four as tapping the Christmas display), and **My corner** picks one personal wildcard for the household (poem of the day, what can I make?), remembered on the device. The wildcard pages are still to be built.

**Around Penns Valley (V33).** The menu lists upcoming Penns Valley events from the YMCA of Centre County's calendar (its public Events API, fetched when the menu opens and kept 15 minutes), each linking to its page, with the source named. This is the only local source a browser can read from this page: StateCollege.com blocks scripts (403), the Centre County news feed was empty, the Penns Valley school district's site and the Centre County Gazette gave no readable feed (no CORS, or timed out), and pvsd.org is Perkiomen Valley, not Penns Valley. Local news would need a small proxy. If the YMCA call fails the menu says so and retries the next time it opens.

## Kitchen: TheMealDB

Under the built-in quick ideas, the Kitchen also searches TheMealDB (themealdb.com), a free recipe database (`mealdb.js`). The free key searches one ingredient at a time, so it searches each thing you typed (and the last word of phrases like "frozen peas"), ranks dishes by how many of your ingredients they use, and opens the top three: what of yours it uses, what pantry staples it assumes, what you'd still need, and the full steps under HOW TO MAKE IT, plus a video link when there is one. TheMealDB's free key is meant for personal projects.

The KITCHEN heading and the buttons (Find meals and Back) are amber, to match the weather station page (V63).

## Night clock

In `nightclock.js`. During the hours picked in the menu (Off, 9 PM–6 AM by default, 10 PM–6 AM, or 11 PM–7 AM), any scene is covered by a big, dim clock on black with the date and the moon's phase. Tap it to use the app; after 5 minutes it goes back to the clock until morning. It drifts slightly each minute so nothing burns in. Preview with `?night`.

## First-time guide

In `firstrun.js`. The first time the app opens on a device, a one-time guide shows an arrow pointing down to the settings menu, arrows for swiping between screens, and what a tap does. One tap closes it for good on that device. Preview with `?intro`.

## Verses for the week

A My Corner choice (`verses.js`). Two or three King James verses picked for where the day falls in the Church year (Advent, Christmas, Lent, Holy Week, Easter season, Ordinary Time), changing each week, with their own passages on Christmas, Epiphany, Ash Wednesday, Palm Sunday, Good Friday, Easter, Pentecost, the Assumption, All Saints, the Immaculate Conception and Thanksgiving week. Easter and Advent are worked out for each year. The words come from bible-api.com (public-domain KJV) and are kept on the device; edit the passage lists at the top of `verses.js`.

## Screensaver choice

Menu → SCREENSAVER: **Auto** (the Christmas display from November 20 through January 6, plain code rain the rest of the year), **Christmas** all year, **Code rain**: the same rising blue, green and white code with no tree, star, Santa, radar or sounds; or **Earth** (`earth.js`): the globe drawn in rising code with real continents (a built-in 2-degree land map; oceans blue, land green, ice white), the real day and night line for the current date and time, a starfield and a thin atmosphere, turning once about every 7 minutes. The Earth is flying through a dust cloud (`debris.js`): a haze of fine dust drifts past, and rocks big and small tumble across the screen in every direction, often in groups of 1 to 5, some coming straight at you and growing as they come. Most pass behind the globe; now and then a big one sweeps past in front. The night half stays readable under a deep blue glow, the blue marble at night (V61; blue instead of green since V64), with warm city lights shining where people actually live (`lights.js`, built from the GeoNames list of about 34,000 towns and cities over 15,000 people, added up in 1-degree squares). The lights fade in across the line between day and night. Ordinary cloud cover drifts over the globe (`clouds.js`, V65): made-up but cloud-like, cloudy in some places and clear in others, thicker in the stormy belts and thinner near 25 degrees, moving slowly east and changing shape, white by day and dim at night. Each rock is lit on the sun's side. Starcloud-1, the first data center in space (a 60 kg satellite carrying an NVIDIA H100, launched by SpaceX on November 2, 2025), circles the globe on its real orbit as a short white line with its name on top (`sat.js`, V62). It asks CelesTrak for the newest orbit twice a day (NORAD 66303) and falls back to the built-in orbit from November 24, 2026; checked against SGP4, it stays within about 10 km over a week. It hides when it passes behind the Earth. The rocks sit far off, and meteors streak across the sky: very quick, thin to thick, in any direction, sometimes a few at once. Remembered on the device.

## Portrait screensaver

Menu → SCREENSAVER → **Portrait** (`face.js`): an AI's face in amber code, drawn from the picture William chose (an amber circuit-and-binary face). The picture is built in as a small brightness map: it glows softly underneath, and every spot of it is a character of code, bright where the picture is bright. The picture fills the screen top to bottom in either orientation. Streams of small, very fast code rise through the face, and the head of each stream sparks white-gold as it climbs, like the nodes on the Christmas tree, with a stronger pop now and then. The eyes glow with the fastest-changing code. Behind the head, a second layer of thick code rises more slowly than the face, so the picture has depth. The face and the eyes each change pace at random (slow, steady, fast), holding each for 1 to 5 minutes. Outside the picture, dim dark-blue code moves very slowly.
