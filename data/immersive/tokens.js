/**
 * WallTravel Immersive Experience System — shared design tokens (JS mirror of CSS).
 * Surfaces: cream / sand / green / sage — never near-black (#111 / #151515 / #16170F as fills).
 */

/** Shared ImmersiveIntro presets — home · catalog · groupCatalog · detail */
export const INTRO_PRESETS = Object.freeze({
  home: Object.freeze({
    id: "home",
    /**
     * Reading hold — tuned by watching the opening, not a fixed timer.
     * Desktop gives the line time to be read once, calmly.
     * Mobile is shorter so the same signature does not feel like a wait.
     */
    readingMs: 4000,
    readingMobileMs: 3000,
    revealMs: 680,
    revealMobileMs: 480,
    expansionMs: 2000,
    expansionMobileMs: 1650,
    heroMs: 640,
    skipMs: 820,
    reducedReadingMs: 880,
    reducedRevealMs: 280,
    exitMs: 480,
    sessionKey: "wt_immersive_intro_played",
  }),
  catalog: Object.freeze({
    id: "catalog",
    totalMs: 1100,
    totalMobileMs: 900,
    exitMs: 280,
    sessionKey: "wt_page_intro_vitrine",
  }),
  groupCatalog: Object.freeze({
    id: "groupCatalog",
    totalMs: 3200,
    totalMobileMs: 2800,
    exitMs: 350,
    sessionKey: "wt_page_intro_grupos",
  }),
  detail: Object.freeze({
    id: "detail",
    totalMs: 3200,
    totalMobileMs: 2800,
    exitMs: 350,
    sessionKeyPrefix: "wt_page_intro_",
  }),
});

export const IMMERSIVE_TOKENS = Object.freeze({
  surfaceBase: "#F6F1E8",
  surfaceSoft: "#FFFDF7",
  surfaceSand: "#E8DDC8",
  surfaceGreen: "#5C5E2E",
  surfaceGreenSoft: "#7A7C5E",
  surfaceGreenMist: "#E8EAE0",
  surfaceOlive: "#3F4328",
  textPrimary: "#16170F",
  textSecondary: "#5C5E54",
  textInverse: "#F6F1E8",
  accentPrimary: "#5C5E2E",
  accentGold: "#B8A66A",
  durationFast: 200,
  durationMedium: 400,
  durationSlow: 850,
  /** @deprecated use INTRO_PRESETS.home.stage1Ms + expansionMs */
  introDesktopMs: 12000,
  /** @deprecated use INTRO_PRESETS.home mobile fields */
  introMobileMs: 11600,
  /** @deprecated use INTRO_PRESETS.catalog.totalMs */
  introShortMs: 1100,
  easingStandard: "cubic-bezier(0.16, 1, 0.3, 1)",
  easingEnter: "cubic-bezier(0.16, 1, 0.3, 1)",
  easingExit: "cubic-bezier(0.4, 0, 1, 1)",
  easingIntro: "cubic-bezier(0.22, 1, 0.36, 1)",
  sessionIntroKey: INTRO_PRESETS.home.sessionKey,
  sessionPageIntroPrefix: "wt_page_intro_",
  presets: INTRO_PRESETS,
});

export function resolveIntroPreset(nameOrVariant = "home") {
  const key = String(nameOrVariant || "home");
  if (key === "short" || key === "vitrine") return INTRO_PRESETS.catalog;
  if (key === "grupos" || key === "groups") return INTRO_PRESETS.groupCatalog;
  return INTRO_PRESETS[key] || INTRO_PRESETS.home;
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function isMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches
  );
}

export function hasPlayedSessionIntro(key = IMMERSIVE_TOKENS.sessionIntroKey) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function markSessionIntroPlayed(key = IMMERSIVE_TOKENS.sessionIntroKey) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
}
