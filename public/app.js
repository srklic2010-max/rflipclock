(() => {
  const THEMES = ["classic", "paper", "amber", "night"];
  const THEME_LABELS = { classic: "Classic", paper: "Paper", amber: "Amber", night: "Night" };
  const STORAGE_KEY = "flip-clock:settings";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const defaults = { hour12: false, seconds: false, date: true, theme: "classic", wake: false };
  const settings = { ...defaults, ...readSettings() };

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }

  // ---------- Split-flap card ----------
  function half(cls, text) {
    const el = document.createElement("div");
    el.className = `half ${cls}`;
    const span = document.createElement("span");
    span.textContent = text;
    el.appendChild(span);
    return el;
  }

  function createCard(el) {
    let value = "";
    const upper = half("top", "");
    const lower = half("bottom", "");
    el.prepend(upper, lower);
    let flaps = [];

    function clearFlaps() {
      flaps.forEach((f) => f.remove());
      flaps = [];
    }

    return {
      set(next, animate = true) {
        if (next === value) return;
        const prev = value;
        value = next;
        clearFlaps();
        upper.firstChild.textContent = next;

        if (!animate || !prev || reducedMotion.matches || document.hidden) {
          lower.firstChild.textContent = next;
          return;
        }

        lower.firstChild.textContent = prev;
        const flapTop = half("top flap", prev);
        const flapBottom = half("bottom flap", next);
        flaps = [flapTop, flapBottom];
        el.append(flapTop, flapBottom);
        flapBottom.addEventListener(
          "animationend",
          (e) => {
            if (e.target !== flapBottom) return;
            lower.firstChild.textContent = next;
            clearFlaps();
          }
        );
      },
    };
  }

  const cards = {
    hours: createCard(document.getElementById("hours")),
    minutes: createCard(document.getElementById("minutes")),
    seconds: createCard(document.getElementById("seconds")),
  };
  const meridiemEl = document.getElementById("meridiem");
  const dateEl = document.getElementById("date");
  const spokenEl = document.getElementById("spoken");

  const pad = (n) => String(n).padStart(2, "0");

  function render(animate = true) {
    const now = new Date();
    let h = now.getHours();
    let meridiem = "";
    if (settings.hour12) {
      meridiem = h < 12 ? "AM" : "PM";
      h = h % 12 || 12;
    }
    cards.hours.set(settings.hour12 ? String(h) : pad(h), animate);
    cards.minutes.set(pad(now.getMinutes()), animate);
    if (settings.seconds) cards.seconds.set(pad(now.getSeconds()), animate);
    meridiemEl.textContent = meridiem;

    const dateText = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    if (dateEl.textContent !== dateText) dateEl.textContent = dateText;

    const spoken = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: settings.hour12 });
    if (spokenEl.textContent !== spoken) spokenEl.textContent = spoken;
  }

  let timer;
  function tick() {
    render(true);
    driftForBurnIn();
    clearTimeout(timer);
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }

  // Nudge the whole clock a few pixels each minute so static edges don't burn into the panel.
  let lastDriftMinute = -1;
  function driftForBurnIn() {
    const m = new Date().getMinutes();
    if (m === lastDriftMinute) return;
    lastDriftMinute = m;
    const stage = document.getElementById("stage");
    stage.style.setProperty("--dx", `${Math.round(Math.random() * 16 - 8)}px`);
    stage.style.setProperty("--dy", `${Math.round(Math.random() * 12 - 6)}px`);
  }

  // ---------- Screen wake lock ----------
  let wakeLock = null;
  async function applyWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      if (settings.wake && !wakeLock && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
      } else if (!settings.wake && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch {
      wakeLock = null;
    }
  }

  // ---------- Settings UI ----------
  const body = document.body;
  const labels = {
    format: document.getElementById("lbl-format"),
    theme: document.getElementById("lbl-theme"),
    fullscreen: document.getElementById("lbl-fullscreen"),
  };
  const button = (action) => document.querySelector(`[data-action="${action}"]`);

  function applySettings() {
    body.dataset.theme = settings.theme;
    body.classList.toggle("with-seconds", settings.seconds);
    body.classList.toggle("no-date", !settings.date);
    labels.format.textContent = settings.hour12 ? "12h" : "24h";
    labels.theme.textContent = THEME_LABELS[settings.theme];
    button("seconds").setAttribute("aria-pressed", settings.seconds);
    button("date").setAttribute("aria-pressed", settings.date);
    button("wake").setAttribute("aria-pressed", settings.wake);
    if (!("wakeLock" in navigator)) button("wake").hidden = true;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta.content = getComputedStyle(body).getPropertyValue("--card").trim() || "#121212";
    saveSettings();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const actions = {
    format() {
      settings.hour12 = !settings.hour12;
      applySettings();
      render(true);
    },
    seconds() {
      settings.seconds = !settings.seconds;
      applySettings();
      render(false);
    },
    date() {
      settings.date = !settings.date;
      applySettings();
    },
    theme() {
      settings.theme = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];
      applySettings();
    },
    wake() {
      settings.wake = !settings.wake;
      applySettings();
      applyWakeLock();
    },
    fullscreen: toggleFullscreen,
  };

  document.getElementById("dock").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (btn) actions[btn.dataset.action]();
  });

  const KEYS = { h: "format", s: "seconds", d: "date", t: "theme", w: "wake", f: "fullscreen" };
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const action = KEYS[e.key.toLowerCase()];
    if (action) {
      e.preventDefault();
      actions[action]();
      wake();
    }
  });

  document.getElementById("stage").addEventListener("dblclick", toggleFullscreen);

  document.addEventListener("fullscreenchange", () => {
    labels.fullscreen.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
    button("fullscreen").setAttribute("aria-pressed", !!document.fullscreenElement);
  });
  if (!document.documentElement.requestFullscreen) button("fullscreen").hidden = true;

  // Hide the dock and cursor when nobody is touching the mouse or keyboard.
  let idleTimer;
  function wake() {
    body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!document.getElementById("dock").matches(":hover")) body.classList.add("idle");
      else wake();
    }, 3000);
  }
  ["mousemove", "pointerdown", "touchstart"].forEach((ev) => document.addEventListener(ev, wake, { passive: true }));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      render(false);
      tick();
      applyWakeLock();
    }
  });

  applySettings();
  render(false);
  tick();
  applyWakeLock();
  wake();
})();
