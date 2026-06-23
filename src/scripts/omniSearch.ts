import type { Show } from '../data/shows';

function getShows(): Show[] {
  const w = window as Window & { __SHOWS__?: Show[] };
  return w.__SHOWS__ ?? [];
}

function buildResultCard(show: Show): HTMLAnchorElement {
  const params = new URLSearchParams({ type: show.type, title: show.slug });
  const a = document.createElement('a');
  a.href = `/show?${params.toString()}`;
  a.className = 'omni-result-card';
  a.setAttribute('role', 'listitem');
  a.innerHTML = `
    <img class="omni-result-card__poster" src="${show.poster}" alt="${show.title} poster" loading="lazy" />
    <div class="omni-result-card__info">
      <div class="omni-result-card__title">${show.title}</div>
      <div class="omni-result-card__meta">${show.type} · ${show.year}</div>
    </div>
  `;
  return a;
}

export function initOmniSearch(): void {
  const overlay = document.getElementById('omni-overlay') as HTMLDivElement | null;
  const input = document.getElementById('omni-input') as HTMLInputElement | null;
  const results = document.getElementById('omni-results') as HTMLDivElement | null;
  const hint = document.getElementById('omni-hint') as HTMLParagraphElement | null;
  const closeBtn = document.getElementById('omni-close') as HTMLButtonElement | null;
  const toggleBtn = document.getElementById('search-toggle') as HTMLButtonElement | null;

  if (!overlay || !input || !results || !hint || !closeBtn || !toggleBtn) return;

  function open(): void {
    overlay!.classList.add('open');
    overlay!.setAttribute('aria-hidden', 'false');
    toggleBtn!.setAttribute('aria-expanded', 'true');
    input!.value = '';
    results!.innerHTML = '';
    hint!.textContent = 'Type to search...';
    hint!.style.display = '';
    setTimeout(() => input!.focus(), 50);
  }

  function close(): void {
    overlay!.classList.remove('open');
    overlay!.setAttribute('aria-hidden', 'true');
    toggleBtn!.setAttribute('aria-expanded', 'false');
    toggleBtn!.focus();
  }

  function filter(query: string): void {
    const q = query.trim().toLowerCase();
    results!.innerHTML = '';

    if (!q) {
      hint!.textContent = 'Type to search...';
      hint!.style.display = '';
      return;
    }

    hint!.style.display = 'none';
    const shows = getShows();
    const matched = shows.filter((s) => s.title.toLowerCase().includes(q));

    if (matched.length === 0) {
      hint!.textContent = `Nothing found for "${query}"`;
      hint!.style.display = '';
      return;
    }

    const fragment = document.createDocumentFragment();
    matched.forEach((s) => fragment.appendChild(buildResultCard(s)));
    results!.appendChild(fragment);
  }

  toggleBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  input.addEventListener('input', () => filter(input.value));

  overlay.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  });

  // Close on backdrop click (the overlay itself, not its children)
  overlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === overlay) close();
  });
}
