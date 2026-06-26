export const prerender = false;

import type { APIRoute } from 'astro';
import { searchMulti } from '../../lib/tmdb';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q') ?? '';

  if (!query.trim()) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const results = await searchMulti(query);
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
