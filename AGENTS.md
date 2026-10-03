# AGENTS.md

## Overview
Flip is a static, dependency-free flip clock. Netlify publishes `public/` directly (see `netlify.toml`), and there is no build step.

## Files
- `public/index.html`: markup for the three cards (hours, minutes, seconds), separators, the date line, and the settings dock.
- `public/styles.css`: themes (CSS custom properties keyed by `body[data-theme]`), card geometry, and flip keyframes. Every size comes from `--h`, the card height, which changes with orientation and the `with-seconds` body class.
- `public/app.js`: the clock loop, split-flap card logic, settings, keyboard shortcuts, wake lock, idle hiding, and burn-in drift.

## How the flip works
Each card has static `.top` (next value) and `.bottom` (previous value) halves. On a change, two `.flap` leaves are added: the top leaf (old value) rotates 0→-90°, then the bottom leaf (new value) rotates 90→0°. On `animationend`, the static bottom half is updated and the leaves are removed. Each half's span is the full card height, and the bottom span is shifted up 50%, so each half shows the correct half of the glyph.

## Conventions
- Keep it build-free: no frameworks or bundlers.
- Settings live in `localStorage` under `flip-clock:settings`. These are per-device display preferences, not app data, so no server storage is needed.
- Respect `prefers-reduced-motion`: the leaves are hidden and values swap instantly.
- The tick is re-aligned to the wall-clock second each time, using `setTimeout`, not `setInterval`.
