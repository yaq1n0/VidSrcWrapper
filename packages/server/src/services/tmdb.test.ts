import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TMDBService } from './tmdb.js';

const originalFetch = global.fetch;

describe('TMDBService', () => {
  beforeEach(() => {
    vi.stubEnv('VITEST', 'true');
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    vi.restoreAllMocks();
  });

  it('searchMovies returns mapped results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        page: 1,
        results: [
          {
            id: 1,
            title: 'Movie',
            original_title: 'Movie',
            overview: 'desc',
            release_date: '2020-01-01',
            poster_path: null,
            backdrop_path: null,
            vote_average: 8,
            vote_count: 100,
            popularity: 10,
            genre_ids: [1, 2],
            adult: false,
            original_language: 'en',
            video: false,
          },
        ],
        total_pages: 1,
        total_results: 1,
      }),
      headers: new Map(),
      status: 200,
      statusText: 'OK',
      text: async () => '',
    });

    const service = new TMDBService();
    const res = await service.searchMovies('test', 1);
    expect(res.results[0].title).toBe('Movie');
  });

  it('getMovieById maps genre_ids (details response)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        title: 'X',
        original_title: 'X',
        overview: '',
        release_date: '2020-01-01',
        poster_path: null,
        backdrop_path: null,
        vote_average: 7,
        vote_count: 1,
        popularity: 1,
        adult: false,
        original_language: 'en',
        video: false,
        genre_ids: [5],
      }),
      headers: new Map(),
      status: 200,
      statusText: 'OK',
      text: async () => '',
    });

    const service = new TMDBService();
    const movie = await service.getMovieById(42);
    expect(movie.genre_ids).toEqual([5]);
  });
});
