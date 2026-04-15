/**
 * Single source of truth for the app's brand name across mobile + API.
 *
 * ─── TO RENAME THE APP ──────────────────────────────────────────────
 *
 * 1. Change the three constants below. All UI text and deep links update.
 *
 * 2. Also update these places — they can't import this file:
 *    a) apps/mobile/app.json
 *         - "name" (home-screen label)
 *         - "slug" (Expo project slug)
 *         - "scheme" (must match DEEP_LINK_SCHEME below)
 *         - "locationWhenInUsePermission" (permission prompt text)
 *    b) packages/shared/package.json — "name": "@<scope>/shared"
 *       apps/api/package.json        — "name": "@<scope>/api"
 *       apps/mobile/package.json     — "name": "@<scope>/mobile"
 *       Root package.json            — "name"
 *       (If scope changes, global find-and-replace @meeple/ → @<scope>/ across
 *        all import statements, then run `npm install`.)
 *    c) apps/api/.env
 *         - DATABASE_URL (database name — recreate DB + rerun migrations + reseed)
 *         - JWT_*_SECRET (optional, but rotating is good hygiene)
 *    d) Cloudflare tunnel config at ~/.cloudflared/meeple.yml
 *         - Subdomain names (create new CNAMEs via `cloudflared tunnel route dns`)
 *    e) Native bundle identifiers (apps/mobile/app.json android.package, ios.bundleIdentifier)
 *         — ONLY change before first store submission. After launch these are frozen.
 */
export const APP_NAME = 'Meeple';

/** Short tagline shown under the app name on the login screen */
export const APP_TAGLINE = 'Share your board game life';

/** Deep-link URL scheme. Keep in sync with apps/mobile/app.json "scheme". */
export const DEEP_LINK_SCHEME = 'meeple';
