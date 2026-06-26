import type { ShowType } from '../data/shows';

const SAVED_KEY = 'movo_saved';

export interface SavedItem {
  slug: string;
  title: string;
  poster: string;
  year: number;
  type: ShowType;
}

export function getSaved(): SavedItem[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Discard old string[] format gracefully
    if (parsed.length > 0 && typeof parsed[0] === 'string') return [];
    return parsed as SavedItem[];
  } catch {
    return [];
  }
}

export function isSaved(slug: string): boolean {
  return getSaved().some((s) => s.slug === slug);
}

export function toggleSaved(item: SavedItem): boolean {
  const current = getSaved();
  const exists = current.some((s) => s.slug === item.slug);
  const updated = exists ? current.filter((s) => s.slug !== item.slug) : [...current, item];
  localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  return !exists;
}

export function initSaved(): void {
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement | null;
  if (!saveBtn) return;

  const slug = saveBtn.dataset['slug'] ?? '';
  if (!slug) return;

  const item: SavedItem = {
    slug,
    title: saveBtn.dataset['title'] ?? '',
    poster: saveBtn.dataset['poster'] ?? '',
    year: Number(saveBtn.dataset['year'] ?? 0),
    type: (saveBtn.dataset['showtype'] ?? 'movie') as ShowType,
  };

  function updateBtn(saved: boolean): void {
    if (!saveBtn) return;
    const svg = saveBtn.querySelector('svg')?.outerHTML ?? '';
    saveBtn.innerHTML = svg + (saved ? ' Saved ✓' : ' Save');
    saveBtn.classList.toggle('saved', saved);
    saveBtn.setAttribute('aria-label', saved ? 'Remove from watchlist' : 'Save to watchlist');
  }

  updateBtn(isSaved(slug));

  saveBtn.addEventListener('click', () => {
    const newState = toggleSaved(item);
    updateBtn(newState);
  });
}

export function renderSavedList(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const items = getSaved();

  if (items.length === 0) {
    container.innerHTML =
      '<p class="profile__empty">No saved shows yet. Browse and save shows to watch later.</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (s) => `
    <a href="/show/${s.slug}" class="profile-saved-card" data-focusable>
      <img class="profile-saved-card__poster" src="${s.poster}" alt="${s.title} poster" loading="lazy" />
      <div class="profile-saved-card__info">
        <div class="profile-saved-card__title">${s.title}</div>
        <div class="profile-saved-card__meta">${s.type} · ${s.year}</div>
      </div>
    </a>
  `,
    )
    .join('');
}
