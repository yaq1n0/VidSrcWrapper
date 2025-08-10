import { describe, it, expect, vi } from 'vitest';
import { createHandlers } from './handlers.js';

const createMockTmdbService = () => {
  return {
    searchMovies: vi.fn(),
    getMovieById: vi.fn(),
    searchShows: vi.fn(),
    getShowById: vi.fn(),
    getSeasonEpisodes: vi.fn(),
  };
};

describe('handlers', () => {
  it('searchMovies validates query and page', async () => {
    const tmdb = createMockTmdbService();
    const handlers = createHandlers(tmdb);
    const res1 = await handlers.searchMovies({ query: undefined, page: 1 });
    expect(res1.status).toBe(400);
    const res2 = await handlers.searchMovies({ query: 'x', page: 0 });
    expect(res2.status).toBe(400);
  });

  it('searchMovies returns movies', async () => {
    const tmdb = createMockTmdbService();
    tmdb.searchMovies.mockResolvedValue({ results: [{ id: 1 }] });
    const handlers = createHandlers(tmdb);
    const res = await handlers.searchMovies({ query: 'batman', page: 1 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('getMovieById validates id', async () => {
    const tmdb = createMockTmdbService();
    const handlers = createHandlers(tmdb);
    const res = await handlers.getMovieById({ id: -1 });
    expect(res.status).toBe(400);
  });

  it('searchShows returns shows', async () => {
    const tmdb = createMockTmdbService();
    tmdb.searchShows.mockResolvedValue({ results: [{ id: 2 }] });
    const handlers = createHandlers(tmdb);
    const res = await handlers.searchShows({ query: 'bb', page: 1 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('getSeasonEpisodes validates parameters', async () => {
    const tmdb = createMockTmdbService();
    const handlers = createHandlers(tmdb);
    const res = await handlers.getSeasonEpisodes({ id: 0, seasonNumber: -1 });
    expect(res.status).toBe(400);
  });
});
