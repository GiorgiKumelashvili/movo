import type { Show } from '../data/shows';

function getShows(): Show[] {
  const w = window as Window & { __SHOWS__?: Show[] };
  return w.__SHOWS__ ?? [];
}

function buildResultCard(show: Show): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = `/show/${show.slug}`;
  a.className = 'omni-result-card';
  a.setAttribute('role', 'listitem');
  a.innerHTML = `
    <div class="omni-result-card__poster-wrap">
      <img class="omni-result-card__poster" src="${show.poster}" alt="${show.title} poster" loading="lazy" />
      <div class="omni-result-card__overlay">
        <div class="omni-result-card__title">${show.title}</div>
        <div class="omni-result-card__meta">
          <span class="omni-result-card__star">★</span>
          ${show.rating.toFixed(1)} · ${show.year}
        </div>
      </div>
    </div>
  `;
  return a;
}

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

async function fetchTmdbResults(query: string): Promise<Show[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json() as Promise<Show[]>;
  } catch {
    return [];
  }
}

export function initOmniSearch(): void {
  const overlay = document.getElementById('omni-overlay') as HTMLDivElement | null;
  const input = document.getElementById('omni-input') as HTMLInputElement | null;
  const results = document.getElementById('omni-results') as HTMLDivElement | null;
  const sectionLabel = document.getElementById('omni-section-label') as HTMLParagraphElement | null;
  const emptyEl = document.getElementById('omni-empty') as HTMLDivElement | null;
  const emptyMsg = document.getElementById('omni-empty-msg') as HTMLParagraphElement | null;
  const closeBtn = document.getElementById('omni-close') as HTMLButtonElement | null;
  const toggleBtn = document.getElementById('search-toggle') as HTMLButtonElement | null;

  if (!overlay || !input || !results || !closeBtn || !toggleBtn) return;

  let currentQuery = '';

  function showPopular(): void {
    if (!results || !sectionLabel) return;
    const shows = getShows();
    results.innerHTML = '';
    sectionLabel.textContent = 'Popular right now';
    sectionLabel.style.display = '';
    if (emptyEl) emptyEl.hidden = true;
    const fragment = document.createDocumentFragment();
    shows.slice(0, 20).forEach((s) => fragment.appendChild(buildResultCard(s)));
    results.appendChild(fragment);
  }

  function open(): void {
    overlay!.classList.add('open');
    overlay!.setAttribute('aria-hidden', 'false');
    toggleBtn!.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    input!.value = '';
    currentQuery = '';
    showPopular();
    setTimeout(() => input!.focus(), 50);
  }

  function close(): void {
    overlay!.classList.remove('open');
    overlay!.setAttribute('aria-hidden', 'true');
    toggleBtn!.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggleBtn!.focus();
  }

  function filter(query: string): void {
    const q = query.trim().toLowerCase();
    currentQuery = q;

    if (!q) {
      showPopular();
      return;
    }

    if (!results || !sectionLabel) return;
    results.innerHTML = '';
    if (emptyEl) emptyEl.hidden = true;
    sectionLabel.textContent = `Results`;
    sectionLabel.style.display = '';

    const shows = getShows();
    const matched = shows.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.genre.some((g) => g.toLowerCase().includes(q)),
    );

    if (matched.length === 0) {
      sectionLabel.style.display = 'none';
      if (emptyEl) {
        emptyEl.hidden = false;
        if (emptyMsg) emptyMsg.textContent = `No results for "${query}"`;
      }
    } else {
      const fragment = document.createDocumentFragment();
      matched.forEach((s) => fragment.appendChild(buildResultCard(s)));
      results.appendChild(fragment);
    }
  }

  const debouncedTmdb = debounce(async (query: string) => {
    const q = query.trim().toLowerCase();
    if (q !== currentQuery || q.length < 2) return;

    const tmdbResults = await fetchTmdbResults(q);
    if (q !== currentQuery) return;

    const localShows = getShows();
    const existingSlugs = new Set(
      localShows.filter((s) => s.title.toLowerCase().includes(q)).map((s) => s.slug),
    );
    const fresh = tmdbResults.filter((s) => !existingSlugs.has(s.slug));

    if (fresh.length > 0 && results) {
      const fragment = document.createDocumentFragment();
      fresh.forEach((s) => fragment.appendChild(buildResultCard(s)));
      results.appendChild(fragment);
      if (emptyEl) emptyEl.hidden = true;
      if (sectionLabel) sectionLabel.style.display = '';
    }
  }, 400);

  toggleBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  input.addEventListener('input', () => {
    filter(input.value);
    debouncedTmdb(input.value);
  });

  overlay.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  });

  overlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === overlay) close();
  });

  // '/' shortcut
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (
      e.key === '/' &&
      !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element).tagName)
    ) {
      e.preventDefault();
      open();
    }
  });
}
