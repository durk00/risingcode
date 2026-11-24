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
- **Tap** for a three-day forecast box to the left of the house (day, forecast, high and low, chance of precipitation); tap again to close. Taps on Winter make no sound.
- **Upcoming snow** is still previewed: if snow is due in the next two days, the top line says when and about how much, and clouds gather in its last 12 hours.

Preview any weather with `?wx=sunny`, `partly`, `cloudy`, `fog`, `rain`, `mix`, `snow-light`, `snow`, `snow-heavy` or `coming`, plus `&time=day` or `&time=night`. The thresholds are at the top of `winter.js`.
