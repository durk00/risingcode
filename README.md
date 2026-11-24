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

Swipe left on the Christmas display for the Winter scene; swipe right to go back (arrow keys on a computer). It's in `winter.js`: a night landscape with a house, lit windows and a smoking chimney, with snow driven by the NOAA forecast for Centre Hall, PA (api.weather.gov, refreshed hourly):

- **Snowing now:** flakes fall light, moderate or heavy by the forecast rate (under 0.1, 0.1 to 0.5, over 0.5 inches an hour) and pile up on the ground and roof toward a depth set by the forecast total.
- **Snow within 48 hours:** clouds gather across the top, thicker as it gets closer, with stray flurries in the last day.
- **No snow forecast:** a clear night with stars.

Preview any state with `?snow=light`, `?snow=moderate`, `?snow=heavy`, `?snow=coming` or `?snow=none` on the address. The thresholds are at the top of `winter.js`.
