import type { Show, Season, Episode } from '../data/shows';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_W1280 = 'https://image.tmdb.org/t/p/w1280';

// ── Raw TMDB shapes ────────────────────────────────────────────────────────────

interface TmdbMovieListItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

interface TmdbTvListItem {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
}

interface TmdbMovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
}

interface TmdbTvSeason {
  season_number: number;
  episode_count: number;
  name: string;
}

interface TmdbTvDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  seasons: TmdbTvSeason[];
  genres: Array<{ id: number; name: string }>;
}

interface TmdbDiscoverResponse<T> {
  results: T[];
}

interface TmdbGenreListResponse {
  genres: Array<{ id: number; name: string }>;
}

type TmdbMultiItem =
  | ({ media_type: 'movie' } & TmdbMovieListItem)
  | ({ media_type: 'tv' } & TmdbTvListItem)
  | { media_type: 'person'; id: number };

interface TmdbMultiSearchResponse {
  results: TmdbMultiItem[];
}

type GenreMap = ReadonlyMap<number, string>;

// ── Fetch wrapper (server-side only) ───────────────────────────────────────────
// On Cloudflare, on-demand (SSR) routes don't get dashboard env vars via
// import.meta.env — those are baked in at build time. Runtime vars/secrets are
// only available via Astro.locals.runtime.env, so callers on SSR routes must
// pass that token through explicitly.

interface CloudflareRuntimeLocals {
  runtime?: { env?: { TMDB_BEARER_TOKEN?: string } };
}

export function resolveTmdbToken(locals?: CloudflareRuntimeLocals): string | undefined {
  return locals?.runtime?.env?.TMDB_BEARER_TOKEN ?? import.meta.env.TMDB_BEARER_TOKEN;
}

async function tmdbFetch<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token ?? import.meta.env.TMDB_BEARER_TOKEN}` },
  });
  if (!res.ok) throw new Error(`TMDB ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRuntime(minutes: number | null): string | undefined {
  if (!minutes) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function posterUrl(path: string | null): string {
  return path ? `${IMG_W500}${path}` : '/images/placeholder-poster.jpg';
}

function backdropUrl(path: string | null): string {
  return path ? `${IMG_W1280}${path}` : '/images/placeholder-backdrop.jpg';
}

function parseYear(dateStr: string): number {
  const y = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(y) ? new Date().getFullYear() : y;
}

function buildStubSeasons(tmdbSeasons: TmdbTvSeason[]): Season[] {
  return tmdbSeasons
    .filter((s) => s.season_number > 0)
    .map((s) => ({
      season: s.season_number,
      episodes: Array.from<undefined, Episode>({ length: s.episode_count }, (_, i) => ({
        episode: i + 1,
        title: `Episode ${i + 1}`,
        duration: '',
        description: '',
        videoSrc: '',
      })),
    }));
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapMovie(item: TmdbMovieListItem, genres: GenreMap, runtime?: string): Show {
  return {
    tmdbId: item.id,
    id: item.id,
    title: item.title,
    type: 'movie',
    slug: `movie-${item.id}`,
    rating: Math.round(item.vote_average * 10) / 10,
    year: parseYear(item.release_date),
    poster: posterUrl(item.poster_path),
    backdrop: backdropUrl(item.backdrop_path),
    genre: item.genre_ids.map((id) => genres.get(id) ?? '').filter(Boolean),
    tags: [],
    description: item.overview,
    runtime,
  };
}

function mapTv(item: TmdbTvListItem, genres: GenreMap, seasons?: Season[]): Show {
  return {
    tmdbId: item.id,
    id: item.id,
    title: item.name,
    type: 'series',
    slug: `series-${item.id}`,
    rating: Math.round(item.vote_average * 10) / 10,
    year: parseYear(item.first_air_date),
    poster: posterUrl(item.poster_path),
    backdrop: backdropUrl(item.backdrop_path),
    genre: item.genre_ids.map((id) => genres.get(id) ?? '').filter(Boolean),
    tags: [],
    description: item.overview,
    seasons: seasons ?? [],
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function discoverMovies(page = 1, token?: string): Promise<Show[]> {
  const [data, genreData] = await Promise.all([
    tmdbFetch<TmdbDiscoverResponse<TmdbMovieListItem>>(
      `/discover/movie?sort_by=popularity.desc&page=${page}&language=en-US`,
      token,
    ),
    tmdbFetch<TmdbGenreListResponse>('/genre/movie/list?language=en-US', token),
  ]);
  const genres: GenreMap = new Map(genreData.genres.map((g) => [g.id, g.name]));
  return data.results.map((m) => mapMovie(m, genres));
}

export async function discoverTv(page = 1, token?: string): Promise<Show[]> {
  const [data, genreData] = await Promise.all([
    tmdbFetch<TmdbDiscoverResponse<TmdbTvListItem>>(
      `/discover/tv?sort_by=popularity.desc&page=${page}&language=en-US`,
      token,
    ),
    tmdbFetch<TmdbGenreListResponse>('/genre/tv/list?language=en-US', token),
  ]);
  const genres: GenreMap = new Map(genreData.genres.map((g) => [g.id, g.name]));
  return data.results.map((m) => mapTv(m, genres));
}

export async function getMovieDetail(tmdbId: number, token?: string): Promise<Show> {
  const detail = await tmdbFetch<TmdbMovieDetail>(`/movie/${tmdbId}?language=en-US`, token);
  const genres: GenreMap = new Map(detail.genres.map((g) => [g.id, g.name]));
  const listItem: TmdbMovieListItem = {
    id: detail.id,
    title: detail.title,
    overview: detail.overview,
    poster_path: detail.poster_path,
    backdrop_path: detail.backdrop_path,
    vote_average: detail.vote_average,
    release_date: detail.release_date,
    genre_ids: detail.genres.map((g) => g.id),
  };
  return mapMovie(listItem, genres, formatRuntime(detail.runtime));
}

export async function getTvDetail(tmdbId: number, token?: string): Promise<Show> {
  const detail = await tmdbFetch<TmdbTvDetail>(`/tv/${tmdbId}?language=en-US`, token);
  const genres: GenreMap = new Map(detail.genres.map((g) => [g.id, g.name]));
  const listItem: TmdbTvListItem = {
    id: detail.id,
    name: detail.name,
    overview: detail.overview,
    poster_path: detail.poster_path,
    backdrop_path: detail.backdrop_path,
    vote_average: detail.vote_average,
    first_air_date: detail.first_air_date,
    genre_ids: detail.genres.map((g) => g.id),
  };
  return mapTv(listItem, genres, buildStubSeasons(detail.seasons));
}

export async function searchMulti(query: string, token?: string): Promise<Show[]> {
  if (!query.trim()) return [];
  const data = await tmdbFetch<TmdbMultiSearchResponse>(
    `/search/multi?query=${encodeURIComponent(query)}&language=en-US`,
    token,
  );
  const emptyGenres: GenreMap = new Map();
  return data.results
    .filter(
      (r): r is ({ media_type: 'movie' } & TmdbMovieListItem) | ({ media_type: 'tv' } & TmdbTvListItem) =>
        r.media_type === 'movie' || r.media_type === 'tv',
    )
    .map((r) => (r.media_type === 'movie' ? mapMovie(r, emptyGenres) : mapTv(r, emptyGenres)));
}
