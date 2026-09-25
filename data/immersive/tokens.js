/**
 * WallTravel Immersive Experience System — shared design tokens (JS mirror of CSS).
 * Surfaces: cream / sand / green / sage — never near-black (#111 / #151515 / #16170F as fills).
 */

/**
 * Shared ImmersiveIntro presets.
 * Same easing, mask and progress. Duration and intensity change per page.
 * home · catalog · groupCatalog · groupDetail · experienceDetail
 */
export const INTRO_PRESETS = Object.freeze({
  home: Object.freeze({
    id: "home",
    /** Count window. Desktop total ~2.44s, mobile ~2.04s, including the cream fade. */
    readingMs: 2120,
    readingMobileMs: 1720,
    revealMs: 0,
    revealMobileMs: 0,
    expansionMs: 0,
    expansionMobileMs: 0,
    heroMs: 320,
    skipMs: 520,
    reducedReadingMs: 280,
    reducedRevealMs: 160,
    contentExitMs: 220,
    exitMs: 280,
    handoff: "hero",
    progress: "subtle",
    grade: "home",
    target: ".hero",
    sessionKey: "wt_immersive_intro_played",
  }),
  catalog: Object.freeze({
    id: "catalog",
    readingMs: 420,
    readingMobileMs: 340,
    revealMs: 160,
    revealMobileMs: 140,
    expansionMs: 420,
    expansionMobileMs: 340,
    heroMs: 0,
    skipMs: 280,
    reducedReadingMs: 180,
    reducedRevealMs: 160,
    contentExitMs: 200,
    exitMs: 200,
    handoff: "content",
    progress: "compact",
    grade: "soft",
    target: "",
    sessionKey: "wt_page_intro_vitrine",
  }),
  groupCatalog: Object.freeze({
    id: "groupCatalog",
    readingMs: 980,
    readingMobileMs: 800,
    revealMs: 260,
    revealMobileMs: 200,
    expansionMs: 980,
    expansionMobileMs: 880,
    heroMs: 420,
    skipMs: 420,
    reducedReadingMs: 280,
    reducedRevealMs: 180,
    contentExitMs: 200,
    exitMs: 280,
    handoff: "hero",
    progress: "subtle",
    grade: "strong",
    target: ".group-hero",
    sessionKey: "wt_page_intro_grupos",
  }),
  groupDetail: Object.freeze({
    id: "groupDetail",
    readingMs: 1000,
    readingMobileMs: 780,
    revealMs: 280,
    revealMobileMs: 220,
    expansionMs: 1100,
    expansionMobileMs: 900,
    heroMs: 420,
    skipMs: 420,
    reducedReadingMs: 280,
    reducedRevealMs: 180,
    contentExitMs: 200,
    exitMs: 280,
    handoff: "hero",
    progress: "subtle",
    grade: "strong",
    target: ".group-hero",
    sessionKeyPrefix: "wt_page_intro_",
  }),
  experienceDetail: Object.freeze({
    id: "experienceDetail",
    readingMs: 760,
    readingMobileMs: 620,
    revealMs: 240,
    revealMobileMs: 200,
    expansionMs: 880,
    expansionMobileMs: 720,
    heroMs: 380,
    skipMs: 380,
    reducedReadingMs: 220,
    reducedRevealMs: 160,
    contentExitMs: 200,
    exitMs: 240,
    handoff: "hero",
    progress: "subtle",
    grade: "strong",
    target: "[data-wt-immersive-hero]",
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
  /** @deprecated use INTRO_PRESETS.home reading + reveal + expansion */
  introDesktopMs: 3760,
  /** @deprecated use INTRO_PRESETS.home mobile fields */
  introMobileMs: 2980,
  /** @deprecated use INTRO_PRESETS.catalog */
  introShortMs: 1000,
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
  if (key === "detail" || key === "group-detail") return INTRO_PRESETS.groupDetail;
  if (key === "experience" || key === "experience-detail") return INTRO_PRESETS.experienceDetail;
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
