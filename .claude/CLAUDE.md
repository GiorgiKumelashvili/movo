# Movo — AI Agent Instructions

## Project Overview
Movo is a TV/mobile-first streaming website. Amazon Prime Video-inspired dark UI. Astro 4 (static output) + Vite + TypeScript strict + vanilla TS only.

## Stack Rules
- **No frameworks**: No React, Vue, Svelte, or any component framework. Vanilla TypeScript only.
- **Astro version**: 4.x with `output: 'static'`
- **TypeScript**: `strictest` config, `noUncheckedIndexedAccess: true`. No `any`, no `@ts-ignore`.
- **CSS**: Separate `.css` file per component in `src/styles/components/`. Page CSS in `src/styles/pages/`. `global.css` = tokens + reset only (no component styles).
- **Linting**: ESLint flat config (`eslint.config.js`). Run before commits: `npm run lint && npm run format:check`

## Key Architecture

### Data
All content lives in `src/data/shows.ts` — raw hardcoded TypeScript. Content types: `'movie' | 'series'` only. No `'anime'` type.

### Window Data Bridge
`Layout.astro` injects all shows as `window.__SHOWS__` via a `<script type="application/json">` island. All client scripts read from this — no fetch calls needed.

### Routing
- `/` — home page
- `/show?type=movie|series&title=<slug>` — detail page
- `/show?type=series&title=<slug>&season=N&episode=N` — series episode
- `/show?id=<id>` — detail page by ID (takes priority over `title`)
- `/profile` — profile with saved shows
- `/404` — not found

### Navigation
**No top navbar.** `BottomBar.astro` is fixed bottom nav (Home, Search, Saved, Profile).
`OmniSearch.astro` is the global search overlay, opened by the Search button in the bottom bar.

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
| `recentlyWatched.ts` | `RecentlyWatched.astro`, `show.astro` | Watch history localStorage |
| `saved.ts` | `show.astro`, `profile.astro` | Bookmarks localStorage |
| `tvNav.ts` | `Layout.astro` (global) | Arrow-key spatial navigation |

## Generated File Naming
Code that writes files to disk must prefix the output filename with `[ai_gen_ed]-`.
Example: `writeFileSync('./[ai_gen_ed]-output.json', data)`.

## Design Tokens
Defined in `src/styles/global.css` `:root`. Always use tokens — no raw hex colors or sizes in component CSS.
Key tokens: `--ground`, `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--accent` (#00A8E1), `--accent-amber`, `--bottom-bar-height`.

## TV-Friendly Requirements
- All interactive elements: `min-height: 44px` (global rule in `global.css`)
- `:focus-visible` ring: 3px solid `--accent`
- tvNav.ts intercepts arrow keys in `.media-row`, `.bottom-bar`, `.show-page`, `.episode-list`, `.omni-overlay__results`
- Minimum font size: `--text-base` (1.125rem = 18px)
