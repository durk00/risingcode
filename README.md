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

- **Day or night** from the forecast period that's on now: sun and blue sky by day, moon and stars by night.
- **Sky** from the forecast words: clear, partly cloudy, cloudy or fog.
- **Rain, snow or a mix** falling when the forecast says so; snow comes down light, moderate or heavy by the forecast rate (under 0.1, 0.1 to 0.5, over 0.5 inches an hour).
- **Ground** is white when snow is in today's forecast and piles up while it falls (depth set by today's total); otherwise it's bare, and leftover snow melts away slowly.
- **Tap** for a three-day forecast box to the left of the house (day, forecast with a weather icon, high and low, chance of precipitation); tap again to close. Taps on Winter make no sound.
- **Weather alerts** from NOAA for Centre Hall (checked every 10 minutes) show as a red banner across the top: tap it for the details, swipe it sideways to dismiss it. A dismissed alert stays away; a new one shows. Preview with `?alert`.
- **Upcoming snow** is still previewed: if snow is due in the next two days, the top line says when and about how much, and clouds gather in its last 12 hours.

Preview any weather with `?wx=sunny`, `partly`, `cloudy`, `fog`, `rain`, `mix`, `snow-light`, `snow`, `snow-heavy` or `coming`, plus `&time=day` or `&time=night`. The thresholds are at the top of `winter.js`.

## Weather details

One more swipe left, past Winter (swipe right to go back). In `details.js`: the latest reading from the nearest NOAA weather station (temperature, conditions, humidity, dew point, wind and gusts, pressure), then the next 72 hours hour by hour from the NOAA forecast grid in four strips on one time line: temperature and dew point; humidity, with the drying hours shaded (humidity under 50% and under a 20% chance of rain); chance of rain or snow; wind and gusts. Lines differ by style and brightness and are labeled. Preview with `?details-sample`.

## Kitchen (V34)

One more swipe left past Weather Details (swipe right anywhere but the text box, or tap ← Back, to go back). In `kitchen.js`: **Use my ingredients**, one box and one button. Type what you have, comma separated, and tap Find meals for up to three ideas. Each says what of yours it uses, **⚠ ASSUMES you have** the pantry staples you didn't list (salt, pepper, oil, butter, flour, sugar, water, as the recipe needs), and **STILL NEEDS** anything else it lacks. There is no AI or server behind it: the ideas come from about 25 built-in recipes in `RECIPES` (add more there), so unusual ingredients may match nothing.

## Menu

Swipe down on any scene, Kitchen included, for the menu (it opens as soon as the drag is long enough; start the swipe below the top fifth of the screen, at least 120 px down, so it never fights the iPad's own pull-down from the top edge); swipe up or tap ✕ to close (on a computer, the down and up arrows or Escape). Nothing appears on the scenes themselves. In `menu.js`: **Sound** picks what plays when the radar catches Santa (same four as tapping the Christmas display), and **My corner** picks one personal wildcard for the household (poem of the day, what can I make?), remembered on the device. The wildcard pages are still to be built.

**Around Penns Valley (V33).** The menu lists upcoming Penns Valley events from the YMCA of Centre County's calendar (its public Events API, fetched when the menu opens and kept 15 minutes), each linking to its page, with the source named. This is the only local source a browser can read from this page: StateCollege.com blocks scripts (403), the Centre County news feed was empty, the Penns Valley school district's site and the Centre County Gazette gave no readable feed (no CORS, or timed out), and pvsd.org is Perkiomen Valley, not Penns Valley. Local news would need a small proxy. If the YMCA call fails the menu says so and retries the next time it opens.
