# Movo — Design System

TV/mobile-first streaming site. Dark purple UI. Astro 4 hybrid output + vanilla TypeScript + no component frameworks.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--ground` | `#080611` | Page background |
| `--surface` | `#100d20` | Cards, inputs, stat blocks |
| `--surface-raised` | `#1a163a` | Dropdowns, elevated layers |
| `--accent` | `#9333ea` | Purple — focus rings, icons, stat values |
| `--accent-light` | `#a855f7` | Labels, badges |
| `--accent-amber` | `#f59e0b` | Star ratings |
| `--danger` | `#e05252` | Errors |
| `--gradient-accent` | `linear-gradient(135deg, #9333ea 0%, #c026d3 100%)` | Primary buttons, brand text |
| `--text` | `#f0ede6` | Body copy |
| `--text-muted` | `#8b8aab` | Secondary text, meta |

**Rule:** Never use raw hex in component CSS. Always reference a token. Buttons use `--gradient-accent`, not flat `--accent`.

---

## Typography

| Token | Size | Font | Usage |
|---|---|---|---|
| `--text-xs` | 0.75rem | Body / Mono | Captions, timestamps |
| `--text-sm` | 0.875rem | Body | Meta, secondary labels |
| `--text-base` | 1.125rem | Body | Default body (18px — TV minimum) |
| `--text-lg` | 1.375rem | Body | Subtitles |
| `--text-xl` | 1.75rem | Display | Section titles |
| `--text-2xl` | 2.5rem | Display | Page headings |
| `--text-3xl` | 4rem | Display | Hero titles |

**Fonts:**
- `--font-display`: Barlow Condensed 600/700 — headings, titles, badges
- `--font-body`: Inter 400/500/600 — all body text
- `--font-mono`: JetBrains Mono 400/500 — timestamps, stat values, code

Minimum body font size is `--text-base` (1.125rem / 18px). Never go below this for readable content. Target: LG WebOS TV browser.

---

## Spacing & Layout

**Page horizontal padding:** `clamp(24px, 4vw, 64px)` on all page content. Use this exact expression — not hardcoded `24px` or `48px`.

**Hero section:** full bleed (no side padding on the image). Hero content inside uses the clamp padding.

**Navbar height:** `--navbar-height: 64px`. Body has `padding-top: var(--navbar-height)`. Navbar is `position: fixed`.

**Border radius:**
- `--radius-sm`: 4px — focus outlines
- `--radius`: 8px — cards, inputs, player
- `--radius-lg`: 12px — large surface blocks

**Card gap:** `--gap-card: 12px`
**Row gap:** `--gap-row: 32px`

**Max widths:**
- Home / Saved page grid: `1200px`
- Profile page: `900px`

---

## Interactive Elements

**Touch targets:** All `button`, `a`, `[role="button"]`, `select` get `min-height: 44px` globally via `global.css`. Do not override this to smaller values.

**Focus ring:** `3px solid var(--accent)`, `outline-offset: 3px`, `border-radius: var(--radius-sm)`. Applied globally via `:focus-visible`.

**Hover on cards:** `transform: scale(1.03)` + `outline: 2px solid var(--accent)`.

**Transitions:** `0.15s ease` on transform/opacity. Respect `prefers-reduced-motion` (global rule disables all).

---

## Buttons

```css
/* Primary — gradient, white text */
background: var(--gradient-accent);
color: #fff;
border-radius: var(--radius);
padding: 12px 28px;
font-family: var(--font-display);
font-weight: 700;

/* Secondary / icon buttons */
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.15);
```

Never use flat `--accent` as button background. Always `--gradient-accent` for primary actions.

---

## Components

### Navbar (`Navbar.astro`)
Fixed top, `height: 64px`. Left: `Movo` brand → `/`. Right: search icon (`id="search-toggle"`), profile dropdown.

Profile dropdown links:
- My Profile → `/profile`
- Saved → `/saved`
- Settings → `/settings`
- Sign Out (no-op)

**Critical:** keep `id="search-toggle"` on the search button — `omniSearch.ts` queries it.

---

### OmniSearch (`OmniSearch.astro` + `omniSearch.ts`)
Full-screen overlay. Triggered by `#search-toggle`. When open: body scroll is locked (`overflow: hidden`).

Search strategy:
1. Instant local filter on `window.__SHOWS__` (embedded discover results)
2. 400ms debounced fetch to `/api/search?q=` (TMDB proxy, server-side token)
3. TMDB results merged — deduped by slug

Overlay closes on: Escape, backdrop click, close button.

---

### Hero (`Hero.astro`)
Full-width backdrop image with gradient overlay. Shows featured show (first popular movie from TMDB discover). Content uses clamp padding. Links to `/show/movie-{tmdbId}`.

---

### MediaCard (`MediaCard.astro`)
Poster ratio 2:3. Type badge top-left. Rating (amber star) + year in meta row. Link → `/show/{slug}`.

---

### MediaRow (`MediaRow.astro`)
Horizontal scroll row of MediaCards. Title + count header. `tvNav.ts` handles arrow-key navigation within `.media-row`.

---

### VideoPlayer (`VideoPlayer.astro` + `videoPlayer.ts`)
VidKing iframe embed. No custom controls — VidKing renders its own player UI.

Embed URLs:
- Movie: `https://www.vidking.net/embed/movie/{tmdbId}`
- TV episode: `https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}`

Props: `tmdbId`, `showType`, `title`, `showSlug`, `season?`, `episode?`

`player-wrap` div carries `data-slug`, `data-type`, `data-tmdbid`, `data-season`, `data-episode` — read by `recentlyWatched.ts` and `videoPlayer.ts`.

Episode switching: `window.switchEpisode(season, episode)` — updates iframe `src`, calls `markWatched()`.

**Note:** subtitle language and quality cannot be set via URL params (VidKing cross-origin, no documented params for these).

---

### SeasonSelector (`SeasonSelector.astro`)
Rendered for `type === 'series'`. Season `<select>` + episode list. Episode buttons carry `data-season` and `data-episode` only (no `data-src`).

Calls `window.switchEpisode(season, episode)` on episode click and season change.

---

### RecentlyWatched (`RecentlyWatched.astro`)
Shell `<div id="rw-container">` populated client-side by `renderRecentlyWatchedRow()`. Deduplicates by slug — one card per show regardless of how many episodes were watched. Removed if history is empty.

---

## Pages

| Route | File | Rendering |
|---|---|---|
| `/` | `index.astro` | SSR (hybrid) |
| `/show/[slug]` | `show/[slug].astro` | SSR on demand (`prerender = false`) |
| `/profile` | `profile.astro` | Static |
| `/saved` | `saved.astro` | Static |
| `/settings` | `settings.astro` | Static |
| `/404` | `404.astro` | Static |

### Slug format
`movie-{tmdbId}` and `series-{tmdbId}`. Stable TMDB IDs. Show page parses with `/^movie-(\d+)$/` and `/^series-(\d+)$/`.

---

## Data Layer

### TMDB API (`src/lib/tmdb.ts`)
Server-side only. Token via `import.meta.env.TMDB_BEARER_TOKEN` (never exposed to client).

| Function | Endpoint | Usage |
|---|---|---|
| `discoverMovies(page?)` | `GET /discover/movie` | Home page movie row |
| `discoverTv(page?)` | `GET /discover/tv` | Home page series row |
| `getMovieDetail(id)` | `GET /movie/{id}` | Show detail page |
| `getTvDetail(id)` | `GET /tv/{id}` | Show detail page |
| `searchMulti(query)` | `GET /search/multi` | Search API endpoint |

Image base URLs:
- Poster (w500): `https://image.tmdb.org/t/p/w500{path}`
- Backdrop (w1280): `https://image.tmdb.org/t/p/w1280{path}`

Genre IDs are resolved to names via parallel `GET /genre/movie/list` or `/genre/tv/list` fetch alongside discover calls.

TV seasons from detail endpoint are converted to stub seasons: correct episode count, stub episode titles (`Episode N`), `videoSrc: ''`. VidKing serves actual video.

### `window.__SHOWS__`
`Layout.astro` embeds `shows` prop as `<script type="application/json" id="shows-data">`. Parsed inline via `is:inline` script into `window.__SHOWS__`. All client scripts read from this — no client-side TMDB calls.

Pages pass their fetched shows: `index.astro` passes `[...movies, ...series]`, `show/[slug].astro` passes `[show]`.

---

## localStorage

| Key | Type | Contents |
|---|---|---|
| `movo_rw` | `WatchEntry[]` | Recently watched. Max 20, most-recent-first. Fields: `slug, type, watchedAt, season?, episode?` |
| `movo_saved` | `SavedItem[]` | Saved shows. Fields: `slug, title, poster, year, type`. Full metadata stored on save so `/saved` page renders offline. |

`movo_rw` entries are deduplicated by slug when rendering the Recently Watched row.

---

## CSS File Map

```
src/styles/
  global.css                    tokens + reset + base (no component styles)
  components/
    hero.css
    media-card.css
    media-row.css
    navbar.css
    omni-search.css
    recently-watched.css
    season-selector.css
    video-player.css
  pages/
    home.css
    show.css
    profile.css
    saved.css
    settings.css
    404.css
```

Each component imports its own CSS file. Page CSS imported in page `.astro` file.

---

## TV Nav (`tvNav.ts`)

Arrow-key spatial navigation. Active on elements inside:
- `.media-row`
- `.navbar`
- `.show-page`
- `.episode-list`
- `.omni-overlay__results`

Focus rings use `--accent` at 3px. Min touch target 44px enforced globally.

---

## Environment

```
TMDB_BEARER_TOKEN=   # TMDB Read Access Token — required for all API calls
```

Copy `.env.example` to `.env` and fill in token before running `npm run dev`.

---

## Scripts Reference

| File | Loaded by | Responsibility |
|---|---|---|
| `omniSearch.ts` | `OmniSearch.astro` | Search overlay, local filter + TMDB fallback |
| `videoPlayer.ts` | `VideoPlayer.astro` | Iframe episode switching, markWatched on load |
| `recentlyWatched.ts` | `RecentlyWatched.astro`, `show/[slug].astro` | Watch history localStorage |
| `saved.ts` | `show/[slug].astro`, `saved.astro` | Saved shows localStorage |
| `tvNav.ts` | `Layout.astro` (global) | Arrow-key spatial navigation |
