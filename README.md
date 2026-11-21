# Rising Code

Columns of glowing code rising up the screen in blue, green and a little white. Made as a screensaver for an iPad; works in any modern browser.

## Use it on an iPad

1. Open `index.html` in Safari (or the GitHub Pages link, if Pages is turned on for this repo).
2. Tap **Share → Add to Home Screen**. Opened from the home screen it runs full screen, with no browser bars.
3. Tap once to go full screen when running in Safari. It asks the iPad to keep the screen awake while it's showing; if the screen still dims, set **Settings → Display & Brightness → Auto-Lock** to Never while it runs.

## Adjusting it

Everything is in `index.html`:

- **Colors:** the `--ice` (blue), `--leaf` (green) and `--frost` (white) values at the top of the style block.
- **Color mix:** `colorFor()`: 10% white, the rest split between blue and green.
- **Speed:** the `speed:` line in `makeStream()`. Bigger numbers rise faster; it is set to a steady rush, like a waterfall running upward.
- **Density:** the `size =` line in `resize()` (smaller characters, more columns) and the number of `makeStream` calls per column.

It honors the device's Reduce Motion setting by running slower.
