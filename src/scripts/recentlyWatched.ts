import type { Show, ShowType } from '../data/shows';

const RW_KEY = 'movo_rw';
const MAX_ITEMS = 20;
const EXPIRE_MS = 30 * 24 * 60 * 60 * 1000;

export type WatchEntry = {
  slug: string;
  type: ShowType;
  watchedAt: number;
  season?: number;
  episode?: number;
  progress?: number;
};

export function getWatchHistory(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(RW_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as WatchEntry[]) : [];
  } catch {
    return [];
  }
}

export function markWatched(entry: Omit<WatchEntry, 'watchedAt'>): void {
  const history = getWatchHistory();
  const filtered = history.filter(
    (h) => !(h.slug === entry.slug && h.season === entry.season && h.episode === entry.episode)
  );
  filtered.unshift({ ...entry, watchedAt: Date.now() });
  localStorage.setItem(RW_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}

export function removeFromHistory(slug: string): void {
  const history = getWatchHistory();
  localStorage.setItem(RW_KEY, JSON.stringify(history.filter((h) => h.slug !== slug)));
}

export function renderRecentlyWatchedRow(containerId: string, allShows: Show[]): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const history = getWatchHistory();
  if (history.length === 0) {
    container.remove();
    return;
  }

  const now = Date.now();

  // Filter: remove finished (progress === 100) or older than 30 days
  const valid = history.filter(
    (h) => h.progress !== 100 && now - h.watchedAt < EXPIRE_MS
  );

  // Write pruned list back if anything was removed
  if (valid.length !== history.length) {
    localStorage.setItem(RW_KEY, JSON.stringify(valid));
  }

  // Deduplicate by slug — keep most recent entry per show
  const seenSlugs = new Set<string>();
  const deduped = valid.filter((h) => {
    if (seenSlugs.has(h.slug)) return false;
    seenSlugs.add(h.slug);
    return true;
  });

  const showMap = new Map(allShows.map((s) => [s.slug, s]));
  const entries = deduped
    .map((h) => ({ entry: h, show: showMap.get(h.slug) }))
    .filter((x): x is { entry: WatchEntry; show: Show } => x.show !== undefined);

  if (entries.length === 0) {
    container.remove();
    return;
  }

  const list = entries
    .map(
      ({ entry, show: s }) => `
    <li class="media-row__item">
      <a href="/show/${s.slug}" class="media-card" data-focusable aria-label="${s.title}, ${s.type}, ${s.year}">
        <div class="media-card__poster-wrap">
          <img class="media-card__poster" src="${s.poster}" alt="${s.title} poster" loading="lazy" width="300" height="450" />
          <span class="media-card__type-badge">${s.type}</span>
          <div class="media-card__overlay">
            <div class="media-card__title">${s.title}</div>
            <div class="media-card__meta">
              <span class="media-card__rating">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" style="width:10px;height:10px;color:var(--gold)">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                ${s.rating.toFixed(1)}
              </span>
              <span class="media-card__year">${s.year}</span>
            </div>
          </div>
          ${entry.progress !== undefined && entry.progress > 0 ? `<div class="media-card__progress" style="width:${entry.progress}%"></div>` : ''}
          <button class="media-card__remove" data-slug="${s.slug}" aria-label="Remove ${s.title} from Continue Watching" tabindex="-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </a>
    </li>
  `
    )
    .join('');

  container.innerHTML = `
    <section class="media-row" aria-label="Continue Watching">
      <div class="media-row__header">
        <h2 class="media-row__title">Continue Watching</h2>
        <span class="media-row__count">${entries.length} titles</span>
      </div>
      <ul class="media-row__list">${list}</ul>
    </section>
  `;
  container.removeAttribute('data-hidden');

  // Delegate remove button clicks
  container.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('.media-card__remove');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const slug = btn.dataset['slug'];
    if (!slug) return;
    removeFromHistory(slug);
    const item = btn.closest<HTMLElement>('.media-row__item');
    if (item) item.remove();
    const list2 = container.querySelector<HTMLUListElement>('.media-row__list');
    if (list2 && list2.children.length === 0) container.remove();
  });
}
