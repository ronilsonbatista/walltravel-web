/**
 * WallTravel Immersive Experience System — shared design tokens (JS mirror of CSS).
 * Surfaces: cream / sand / green / sage — never near-black (#111 / #151515 / #16170F as fills).
 */

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
  /** Home opening — desktop (~1.7–2.3s organic) */
  introDesktopMs: 2000,
  /** Home opening — mobile (~1.2–1.7s) */
  introMobileMs: 1450,
  /** Vitrine / secondary page intros */
  introShortMs: 480,
  easingStandard: "cubic-bezier(0.16, 1, 0.3, 1)",
  easingEnter: "cubic-bezier(0.16, 1, 0.3, 1)",
  easingExit: "cubic-bezier(0.4, 0, 1, 1)",
  sessionIntroKey: "wt_immersive_intro_played",
  sessionPageIntroPrefix: "wt_page_intro_",
});

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
