import { markWatched } from './recentlyWatched';
import type { ShowType } from '../data/shows';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function initVideoPlayer(): void {
  const wrap = document.getElementById('player-wrap') as HTMLDivElement | null;
  const video = document.getElementById('player-video') as HTMLVideoElement | null;
  const controls = document.getElementById('player-controls') as HTMLDivElement | null;
  const playBtn = document.getElementById('player-play') as HTMLButtonElement | null;
  const muteBtn = document.getElementById('player-mute') as HTMLButtonElement | null;
  const volumeSlider = document.getElementById('player-volume') as HTMLInputElement | null;
  const progressBar = document.getElementById('player-progress') as HTMLDivElement | null;
  const progressFill = document.getElementById('player-progress-fill') as HTMLDivElement | null;
  const progressThumb = document.getElementById('player-progress-thumb') as HTMLDivElement | null;
  const timeDisplay = document.getElementById('player-time') as HTMLSpanElement | null;
  const fsBtn = document.getElementById('player-fullscreen') as HTMLButtonElement | null;
  const errorPanel = document.getElementById('player-error') as HTMLDivElement | null;
  const titleEl = document.getElementById('player-title') as HTMLDivElement | null;

  if (!wrap || !video || !controls || !playBtn || !progressBar || !progressFill || !timeDisplay) {
    return;
  }

  // ── Icons ─────────────────────────────────────────────────────────────────

  const ICON_PLAY = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  const ICON_PAUSE = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  const ICON_VOLUME = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  const ICON_MUTED = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
  const ICON_FS = `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
  const ICON_FS_EXIT = `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`;

  // ── Auto-hide controls ────────────────────────────────────────────────────

  let hideTimer: ReturnType<typeof setTimeout>;

  function showControls(): void {
    controls!.classList.remove('hidden');
    clearTimeout(hideTimer);
    if (!video!.paused) {
      hideTimer = setTimeout(() => controls!.classList.add('hidden'), 3000);
    }
  }

  wrap.addEventListener('mousemove', showControls);
  wrap.addEventListener('touchstart', showControls, { passive: true });

  // ── Play / Pause ──────────────────────────────────────────────────────────

  function updatePlayIcon(): void {
    playBtn!.innerHTML = video!.paused ? ICON_PLAY : ICON_PAUSE;
    playBtn!.setAttribute('aria-label', video!.paused ? 'Play' : 'Pause');
    if (video!.paused) {
      controls!.classList.remove('hidden');
      clearTimeout(hideTimer);
    }
  }

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  });

  video.addEventListener('play', updatePlayIcon);
  video.addEventListener('pause', updatePlayIcon);

  // ── Mark watched on first play ─────────────────────────────────────────────

  let marked = false;
  video.addEventListener('play', () => {
    if (!marked) {
      marked = true;
      const slug = wrap.dataset['slug'] ?? '';
      const type = (wrap.dataset['type'] ?? 'movie') as ShowType;
      const season = wrap.dataset['season'] ? Number(wrap.dataset['season']) : undefined;
      const episode = wrap.dataset['episode'] ? Number(wrap.dataset['episode']) : undefined;
      const entry: Parameters<typeof markWatched>[0] = { slug, type };
      if (season !== undefined) entry.season = season;
      if (episode !== undefined) entry.episode = episode;
      markWatched(entry);
    }
  });

  // ── Progress ─────────────────────────────────────────────────────────────

  video.addEventListener('timeupdate', () => {
    if (!video.duration || isNaN(video.duration)) return;
    const pct = (video.currentTime / video.duration) * 100;
    progressFill.style.width = `${pct}%`;
    if (progressThumb) progressThumb.style.left = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  function seekTo(e: MouseEvent): void {
    if (!progressBar || !video) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * (video.duration || 0);
  }

  let seeking = false;
  progressBar.addEventListener('mousedown', (e: MouseEvent) => {
    seeking = true;
    seekTo(e);
  });
  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (seeking) seekTo(e);
  });
  document.addEventListener('mouseup', () => {
    seeking = false;
  });

  // ── Volume ────────────────────────────────────────────────────────────────

  if (muteBtn && volumeSlider) {
    function updateMuteIcon(): void {
      muteBtn!.innerHTML = video!.muted || video!.volume === 0 ? ICON_MUTED : ICON_VOLUME;
      muteBtn!.setAttribute('aria-label', video!.muted ? 'Unmute' : 'Mute');
    }

    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      updateMuteIcon();
    });

    volumeSlider.addEventListener('input', () => {
      video.volume = parseFloat(volumeSlider.value);
      video.muted = video.volume === 0;
      updateMuteIcon();
    });

    video.addEventListener('volumechange', () => {
      volumeSlider.value = String(video.muted ? 0 : video.volume);
      updateMuteIcon();
    });
  }

  // ── Fullscreen ────────────────────────────────────────────────────────────

  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        void wrap.requestFullscreen();
      } else {
        void document.exitFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const inFs = !!document.fullscreenElement;
      fsBtn.innerHTML = inFs ? ICON_FS_EXIT : ICON_FS;
      fsBtn.setAttribute('aria-label', inFs ? 'Exit fullscreen' : 'Fullscreen');
    });
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  wrap.addEventListener('keydown', (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        if (video.paused) void video.play();
        else video.pause();
        break;
      case 'ArrowRight':
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        showControls();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
        showControls();
        break;
      case 'ArrowUp':
        e.preventDefault();
        video.volume = Math.min(1, video.volume + 0.1);
        if (volumeSlider) volumeSlider.value = String(video.volume);
        showControls();
        break;
      case 'ArrowDown':
        e.preventDefault();
        video.volume = Math.max(0, video.volume - 0.1);
        if (volumeSlider) volumeSlider.value = String(video.volume);
        showControls();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        fsBtn?.click();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        muteBtn?.click();
        break;
    }
  });

  // Make wrap focusable
  if (!wrap.getAttribute('tabindex')) {
    wrap.setAttribute('tabindex', '0');
  }

  // ── Error handling ────────────────────────────────────────────────────────

  video.addEventListener('error', () => {
    if (errorPanel) {
      errorPanel.style.display = 'flex';
      controls.style.display = 'none';
    }
  });

  // ── Episode switching (called externally) ─────────────────────────────────

  (
    window as Window & {
      switchEpisode?: (src: string, title: string, season: number, episode: number) => void;
    }
  ).switchEpisode = (src: string, title: string, season: number, episode: number) => {
    marked = false;
    video.src = src;
    if (titleEl) titleEl.textContent = title;
    wrap.dataset['season'] = String(season);
    wrap.dataset['episode'] = String(episode);
    if (errorPanel) errorPanel.style.display = 'none';
    if (controls) controls.style.display = '';
    void video.play();
  };
}
