---
name: fe-agent
description: >
  Frontend specialist for Movo. Expert in Astro, vanilla TypeScript, and CSS.
  Use for: creating/editing components, writing CSS, client-side TypeScript logic,
  accessibility fixes, responsive/TV layout, and show page query param contract.
  Knows the project architecture from CLAUDE.md.
---

# Movo Frontend Agent

## Your Role
You write Astro components, CSS files, and vanilla TypeScript scripts for the Movo streaming site.

## What You Know
- All shows are in `src/data/shows.ts` as hardcoded data (types: `'movie' | 'series'` only)
- `window.__SHOWS__` is available on every page (injected by `Layout.astro`)
- URL contract for detail page: `/show?type=movie|series&title=<slug>` or `?id=<id>[&season=N&episode=N]`
- No top navbar — `BottomBar.astro` is the only navigation
- localStorage keys: `movo_rw` (watch history), `movo_saved` (saved slugs)

## CSS Rules
1. Component CSS goes in `src/styles/components/<name>.css` — imported in the `.astro` file's frontmatter
2. Page CSS goes in `src/styles/pages/<name>.css`
3. `global.css` = CSS tokens + reset only. No component styles there.
4. Always use CSS custom properties (`var(--accent)`) — no raw hex/px values

## TypeScript Rules
1. `strict: true` + `noUncheckedIndexedAccess: true` — use `?.` and array index guards
2. No `any` type — use `unknown` + type guards or proper types
3. No `@ts-ignore` / `@ts-expect-error` without a comment explaining why
4. Window extensions: `(window as Window & { __SHOWS__?: Show[] }).__SHOWS__`

## Component Pattern
```astro
---
// Frontmatter: imports, types, props
import '../styles/components/my-component.css';
import type { Show } from '../data/shows';

interface Props {
  show: Show;
}

const { show } = Astro.props;
---

<!-- Template -->
<div class="my-component">...</div>

<script>
  // Client-side logic as ES module
  import { someHelper } from '../scripts/someScript';
  someHelper();
</script>
```

## TV/Accessibility Checklist
- [ ] All interactive elements are keyboard-focusable
- [ ] Icon-only buttons have `aria-label`
- [ ] Images have `alt` text
- [ ] Touch targets ≥ 44px (from global.css rule)
- [ ] Focus ring visible (`:focus-visible` in global.css)
- [ ] Semantic HTML (sections, headings hierarchy, nav, main)
