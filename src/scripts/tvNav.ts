type Point = { x: number; y: number };

function centerOf(rect: DOMRect): Point {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

type Direction = 'up' | 'down' | 'left' | 'right';

function navigate(direction: Direction): void {
  const focused = document.activeElement as HTMLElement | null;
  if (!focused) return;

  // Only activate inside our navigation zones
  const inZone =
    focused.closest('.media-row') ??
    focused.closest('.bottom-bar') ??
    focused.closest('[data-focusable]') ??
    focused.closest('.show-page') ??
    focused.closest('.episode-list') ??
    focused.closest('.omni-overlay__results');

  if (!inZone) return;

  const allFocusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), .media-card, [data-focusable], .episode-item'
    )
  ).filter((el) => el !== focused && isVisible(el));

  const focusedRect = focused.getBoundingClientRect();
  const focusedCenter = centerOf(focusedRect);

  const THRESHOLD = 10;

  const candidates = allFocusable.filter((el) => {
    const c = centerOf(el.getBoundingClientRect());
    switch (direction) {
      case 'right':
        return c.x > focusedCenter.x + THRESHOLD;
      case 'left':
        return c.x < focusedCenter.x - THRESHOLD;
      case 'down':
        return c.y > focusedCenter.y + THRESHOLD;
      case 'up':
        return c.y < focusedCenter.y - THRESHOLD;
    }
  });

  if (candidates.length === 0) return;

  // Score: axis distance + 2× perpendicular drift penalty
  const scored = candidates.map((el) => {
    const c = centerOf(el.getBoundingClientRect());
    const dx = Math.abs(c.x - focusedCenter.x);
    const dy = Math.abs(c.y - focusedCenter.y);
    const axisDist = direction === 'left' || direction === 'right' ? dx : dy;
    const perpDist = direction === 'left' || direction === 'right' ? dy : dx;
    return { el, score: axisDist + perpDist * 2 };
  });

  scored.sort((a, b) => a.score - b.score);
  const target = scored[0]?.el;
  if (!target) return;

  target.focus();
  target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
}

export function initTvNav(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    // Don't intercept in text inputs or native selects (select uses arrow for options)
    if (tag === 'input' || tag === 'textarea') return;
    // Allow select to use arrow keys natively
    if (tag === 'select') return;

    const map: Record<string, Direction> = {
      ArrowRight: 'right',
      ArrowLeft: 'left',
      ArrowDown: 'down',
      ArrowUp: 'up',
    };

    const dir = map[e.key];
    if (!dir) return;

    const focused = document.activeElement as HTMLElement | null;
    if (!focused) return;

    const inZone =
      focused.closest('.media-row') ??
      focused.closest('.bottom-bar') ??
      focused.closest('[data-focusable]') ??
      focused.closest('.show-page') ??
      focused.closest('.episode-list') ??
      focused.closest('.omni-overlay__results');

    if (!inZone) return;

    // Don't intercept vertical arrows inside the player wrapper (seek/volume)
    if (focused.closest('#player-wrap')) return;

    e.preventDefault();
    navigate(dir);
  });
}
