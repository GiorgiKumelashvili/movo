import type { Show } from '../data/shows';

const SAVED_KEY = 'movo_saved';

export function getSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function isSaved(slug: string): boolean {
  return getSaved().includes(slug);
}

export function toggleSaved(slug: string): boolean {
  const current = getSaved();
  const exists = current.includes(slug);
  const updated = exists ? current.filter((s) => s !== slug) : [...current, slug];
  localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  return !exists;
}

export function initSaved(): void {
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement | null;
  if (!saveBtn) return;

  const slug = saveBtn.dataset['slug'] ?? '';
  if (!slug) return;

  function updateBtn(saved: boolean): void {
    if (!saveBtn) return;
    saveBtn.classList.toggle('saved', saved);
    const label = saved ? 'Saved ✓' : 'Save';
    saveBtn.querySelector('svg')!.insertAdjacentHTML('afterend', '');
    saveBtn.lastChild!.textContent = ` ${label}`;
    // Simpler: rebuild button text
    const svg = saveBtn.querySelector('svg')?.outerHTML ?? '';
    saveBtn.innerHTML = svg + (saved ? ' Saved ✓' : ' Save');
    saveBtn.setAttribute('aria-label', saved ? 'Remove from watchlist' : 'Save to watchlist');
  }

  // Set initial state
  updateBtn(isSaved(slug));

  saveBtn.addEventListener('click', () => {
    const newState = toggleSaved(slug);
    updateBtn(newState);
  });
}

export function renderSavedList(containerId: string, allShows: Show[]): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const savedSlugs = getSaved();
  if (savedSlugs.length === 0) {
    container.innerHTML =
      '<p class="profile__empty">No saved shows yet. Browse and save shows to watch later.</p>';
    return;
  }

  const showMap = new Map(allShows.map((s) => [s.slug, s]));
  const items = savedSlugs.map((slug) => showMap.get(slug)).filter((s): s is Show => s !== undefined);

  if (items.length === 0) {
    container.innerHTML =
      '<p class="profile__empty">No saved shows yet. Browse and save shows to watch later.</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (s) => `
    <a href="/show?type=${s.type}&title=${s.slug}" class="profile-saved-card" data-focusable>
      <img class="profile-saved-card__poster" src="${s.poster}" alt="${s.title} poster" loading="lazy" />
      <div class="profile-saved-card__info">
        <div class="profile-saved-card__title">${s.title}</div>
        <div class="profile-saved-card__meta">${s.type} · ${s.year}</div>
      </div>
    </a>
  `
    )
    .join('');
}
