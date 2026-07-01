export const prerender = false;

import type { APIRoute } from 'astro';
import { searchMulti, resolveTmdbToken } from '../../lib/tmdb';

export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q') ?? '';

  if (!query.trim()) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const results = await searchMulti(query, resolveTmdbToken(locals));
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('TMDB search error:', err);
    return new Response(JSON.stringify([]), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
