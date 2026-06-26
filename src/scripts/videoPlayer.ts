import { markWatched } from './recentlyWatched';
import type { ShowType } from '../data/shows';

export function initVideoPlayer(): void {
  const wrap = document.getElementById('player-wrap') as HTMLDivElement | null;
  const iframe = document.getElementById('player-iframe') as HTMLIFrameElement | null;
  if (!wrap || !iframe) return;

  const tmdbId = Number(wrap.dataset['tmdbid'] ?? 0);
  const showType = (wrap.dataset['type'] ?? 'movie') as ShowType;

  // Mark initial episode as watched
  const slug = wrap.dataset['slug'] ?? '';
  const season = wrap.dataset['season'] ? Number(wrap.dataset['season']) : undefined;
  const episode = wrap.dataset['episode'] ? Number(wrap.dataset['episode']) : undefined;
  const entry: Parameters<typeof markWatched>[0] = { slug, type: showType };
  if (season !== undefined) entry.season = season;
  if (episode !== undefined) entry.episode = episode;
  markWatched(entry);

  // Episode switching — called by SeasonSelector
  (
    window as Window & {
      switchEpisode?: (season: number, episode: number) => void;
    }
  ).switchEpisode = (s: number, ep: number) => {
    const src =
      showType === 'series'
        ? `https://www.vidking.net/embed/tv/${tmdbId}/${s}/${ep}`
        : `https://www.vidking.net/embed/movie/${tmdbId}`;
    iframe.src = src;
    wrap.dataset['season'] = String(s);
    wrap.dataset['episode'] = String(ep);
    markWatched({ slug, type: showType, season: s, episode: ep });
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}
