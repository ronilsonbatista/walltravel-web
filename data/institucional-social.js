/**
 * Social proof destinations for /institucional.
 *
 * Instagram: confirmed (footer + Instagram profile @walltravel_).
 * Google: outbound Maps search for the known Recreio listing.
 *   No Place ID, reviews API key, or embeddable feed exists in this repo,
 *   so the page uses curated PDF testimonials + this outbound link
 *   (no invented star scores / live rating widget).
 * Reclame Aqui: company page slug not found in footer/docs/site search;
 *   keep null until confirmed (UI still renders Instagram + Google + testimonials).
 */

export const INSTITUCIONAL_INSTAGRAM_URL = "https://www.instagram.com/walltravel_/";

/** @type {string | null} TODO: confirm official Reclame Aqui slug for Walltravel Agencia LTDA (CNPJ 55.743.194/0001-07) */
export const INSTITUCIONAL_RECLAME_AQUI_URL = null;

/**
 * Best-effort Google Business / reviews entry point via Maps search
 * (Av. das Américas, 19050, Recreio dos Bandeirantes, Rio de Janeiro).
 * Replace with a stable Place ID / g.page URL when available.
 */
export const INSTITUCIONAL_GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/search/?api=1&query=WallTravel%20Av.%20das%20Am%C3%A9ricas%2C%2019050%2C%20Recreio%20dos%20Bandeirantes%2C%20Rio%20de%20Janeiro";
