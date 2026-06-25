# Movo — AI Agent Instructions

## Project Overview
Movo is a TV/mobile-first streaming website. Dark purple UI (Amazon Prime-inspired). Astro 4 (static output) + Vite + TypeScript strict + vanilla TS only.

## Stack Rules
- **No frameworks**: No React, Vue, Svelte, or any component framework. Vanilla TypeScript only.
- **Astro version**: 4.x with `output: 'static'`
- **TypeScript**: `strictest` config, `noUncheckedIndexedAccess: true`. No `any`, no `@ts-ignore`.
- **CSS**: Separate `.css` file per component in `src/styles/components/`. Page CSS in `src/styles/pages/`. `global.css` = tokens + reset only (no component styles).
- **Linting**: ESLint flat config (`eslint.config.js`). Run before commits: `npm run lint && npm run format:check`

## Key Architecture

### Data
All content lives in `src/data/shows.ts` — raw hardcoded TypeScript. Content types: `'movie' | 'series'` only. No `'anime'` type.
Poster/backdrop images use `picsum.photos/seed/movo-poster-{id}/300/450` and `picsum.photos/seed/movo-backdrop-{id}/1280/720`.

### Window Data Bridge
`Layout.astro` injects all shows as `window.__SHOWS__` via a `<script type="application/json">` island. All client scripts read from this — no fetch calls needed.

### Routing
- `/` — home page
- `/show/[slug]` — detail page (file-based, pre-rendered via `getStaticPaths`)
- `/profile` — profile with saved shows
- `/404` — not found

**No query-param routing.** Astro static output cannot read `Astro.url.searchParams` at build time. All show pages are pre-rendered from `src/pages/show/[slug].astro`.

### Navigation
**No bottom bar.** `Navbar.astro` is a fixed top nav with:
- Left: `Movo` brand (links to `/`)
- Right: search icon (opens omni overlay, `id="search-toggle"`), profile dropdown
- Profile dropdown: My Profile → `/profile`, Saved → `/profile#saved`, Settings → `/profile#settings`, Sign Out (no-op)

`OmniSearch.astro` is the global search overlay, triggered by `id="search-toggle"` button (must keep this ID — `omniSearch.ts` queries it).

### Pages
Only 3 real pages: home (`/`), show detail (`/show/[slug]`), profile (`/profile`).

### localStorage Keys
| Key | Contents |
|---|---|
| `movo_rw` | Recently watched: `WatchEntry[]`, max 20, most-recent-first |
| `movo_saved` | Saved slugs: `string[]` |

### Scripts
| File | Loaded by | Purpose |
|---|---|---|
| `omniSearch.ts` | `OmniSearch.astro` | Search overlay logic |
| `videoPlayer.ts` | `VideoPlayer.astro` | Custom HTML5 player |
| `recentlyWatched.ts` | `RecentlyWatched.astro`, `show/[slug].astro` | Watch history localStorage |
| `saved.ts` | `show/[slug].astro`, `profile.astro` | Bookmarks localStorage |
| `tvNav.ts` | `Layout.astro` (global) | Arrow-key spatial navigation |

## Generated File Naming
Code that writes files to disk must prefix the output filename with `[ai_gen_ed]-`.
Example: `writeFileSync('./[ai_gen_ed]-output.json', data)`.

## Design Tokens
Defined in `src/styles/global.css` `:root`. Always use tokens — no raw hex colors or sizes in component CSS.

Key tokens:
| Token | Value | Notes |
|---|---|---|
| `--ground` | `#080611` | Page background |
| `--surface` | `#100d20` | Cards, inputs |
| `--surface-raised` | `#1a163a` | Dropdowns, elevated surfaces |
| `--accent` | `#9333ea` | Purple — primary interactive |
| `--accent-light` | `#a855f7` | Lighter purple for labels/badges |
| `--accent-amber` | `#f59e0b` | Ratings |
| `--gradient-accent` | `linear-gradient(135deg, #9333ea 0%, #c026d3 100%)` | Buttons, brand |
| `--navbar-height` | `64px` | Fixed top navbar height |
| `--text` | `#f0ede6` | |
| `--text-muted` | `#8b8aab` | |

Use `--gradient-accent` on primary buttons and brand text. No flat `--accent` background on buttons — use gradient.

## Layout Padding
All page content uses `clamp(24px, 4vw, 64px)` horizontal padding. This matches the navbar inner padding. Do not use hardcoded `24px` or `48px` — use the clamp expression.

Hero section bleeds full viewport width (no side padding on the image). Hero content inside uses the clamp padding.

## TV-Friendly Requirements
- All interactive elements: `min-height: 44px` (global rule in `global.css`)
- `:focus-visible` ring: 3px solid `--accent`
- tvNav.ts intercepts arrow keys in `.media-row`, `.navbar`, `.show-page`, `.episode-list`, `.omni-overlay__results`
- Minimum font size: `--text-base` (1.125rem = 18px)
- Target: WebOS browser on LG TVs
