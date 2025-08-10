import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockHttpClient, setHttpClient } from '@vidsrc-wrapper/data';
import { TMDBService } from './tmdb.js';

describe('TMDBService', () => {
  beforeEach(() => {
    vi.stubEnv('VITEST', 'true');
  });

  it('searchMovies returns mapped results', async () => {
    const mock = new MockHttpClient().on(
      'https://api.themoviedb.org/3/search/movie?query=test&page=1&include_adult=false',
      {
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
      }
    );
    setHttpClient(mock);

    const service = new TMDBService(mock);
    const res = await service.searchMovies('test', 1);
    expect(res.results[0].title).toBe('Movie');
  });

  it('getMovieById maps genre_ids (details response)', async () => {
    const mock = new MockHttpClient().on(
      'https://api.themoviedb.org/3/movie/42',
      {
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
      }
    );
    setHttpClient(mock);

    const service = new TMDBService(mock);
    const movie = await service.getMovieById(42);
    expect(movie.genre_ids).toEqual([5]);
  });

  it('searchShows returns mapped results', async () => {
    const mock = new MockHttpClient().on(
      'https://api.themoviedb.org/3/search/tv?query=test&page=1&include_adult=false',
      {
        page: 1,
        results: [
          {
            id: 10,
            name: 'Breaking Bad',
            original_name: 'Breaking Bad',
            overview: 'desc',
            first_air_date: '2008-01-01',
            poster_path: null,
            backdrop_path: null,
            vote_average: 9.0,
            vote_count: 100,
            popularity: 10,
            genre_ids: [18],
            original_language: 'en',
          },
        ],
        total_pages: 1,
        total_results: 1,
      }
    );
    setHttpClient(mock);

    const service = new TMDBService(mock);
    const res = await service.searchShows('test', 1);
    expect(res.results[0].name).toBe('Breaking Bad');
  });

  it('getShowById returns seasons', async () => {
    const mock = new MockHttpClient().on('https://api.themoviedb.org/3/tv/20', {
      id: 20,
      name: 'Show',
      original_name: 'Show',
      overview: '',
      first_air_date: '2010-01-01',
      poster_path: null,
      backdrop_path: null,
      vote_average: 8,
      vote_count: 1,
      popularity: 1,
      original_language: 'en',
      genres: [{ id: 1, name: 'Drama' }],
      number_of_seasons: 1,
      number_of_episodes: 2,
      seasons: [
        {
          season_number: 1,
          name: 'S1',
          episode_count: 2,
          air_date: '2010-01-01',
          poster_path: null,
        },
      ],
    });
    setHttpClient(mock);

    const service = new TMDBService(mock);
    const show = await service.getShowById(20);
    expect(show.seasons.length).toBe(1);
    expect(show.genre_ids).toEqual([1]);
  });

  it('getSeasonEpisodes maps episodes', async () => {
    const mock = new MockHttpClient().on(
      'https://api.themoviedb.org/3/tv/20/season/1',
      {
        id: 1,
        season_number: 1,
        episodes: [
          {
            id: 100,
            name: 'Pilot',
            overview: 'e1',
            air_date: '2010-01-01',
            still_path: null,
            episode_number: 1,
            season_number: 1,
            vote_average: 8,
          },
        ],
      }
    );
    setHttpClient(mock);

    const service = new TMDBService(mock);
    const eps = await service.getSeasonEpisodes(20, 1);
    expect(eps[0].episode_number).toBe(1);
  });
});
