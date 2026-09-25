/**
 * WallTravel Immersive Experience System — public barrel.
 * Named primitives for Home · Vitrine · Experience · Groups · Group detail.
 */

export {
  IMMERSIVE_TOKENS,
  prefersReducedMotion,
  isMobileViewport,
  hasPlayedSessionIntro,
  markSessionIntroPlayed,
} from "./tokens.js";

export {
  ImmersiveIntro,
  ImmersivePageIntro,
  ImmersiveHero,
  DestinationReveal,
  HeroCarousel,
  CarouselProgress,
  SectionReveal,
  MediaReveal,
  EditorialSection,
  DestinationPreview,
  StickyConversionCTA,
  TravelDetailShell,
  GroupDetailTemplate,
  renderDestinationExplorer,
  renderDetailPersonalityIntro,
  renderVitrineIntro,
  renderGroupCatalogIntro,
  renderHomeOpeningIntro,
  playPageIntro,
  playImmersiveIntro,
  initDestinationExplorer,
  PageIntro,
  HeroReveal,
  ImageReveal,
  StaggerGroup,
  DestinationTransition,
  JourneyTransition,
} from "./primitives.js";

export { INTRO_PRESETS, resolveIntroPreset } from "./tokens.js";
