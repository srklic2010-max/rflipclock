# Flip

A full-screen split-flap clock made for the monitor next to your desk. Open it, go full screen, and it quietly keeps time with a mechanical-style flip animation.

## Features

- Split-flap hours and minutes, with optional seconds
- 12- or 24-hour format, with an AM/PM tag in 12-hour mode
- Optional date line
- Four themes: Classic, Paper, Amber, and Night (a dim red for evenings)
- Full screen (button, `F`, or double-click) and a "Stay awake" option that keeps the display from sleeping (on browsers that support the Screen Wake Lock API)
- The controls and cursor hide after 3 seconds without input
- The clock moves a few pixels every minute to reduce burn-in on the panel
- Settings are saved in the browser, so the clock looks the same after a reload

Keyboard shortcuts: `H` 12/24h · `S` seconds · `D` date · `T` theme · `W` stay awake · `F` full screen.

## Tech

Plain HTML, CSS, and JavaScript with no build step, deployed on Netlify from `public/`.

## Run locally

```bash
netlify dev --port 8889
```

Or open `public/index.html` directly in a browser.
