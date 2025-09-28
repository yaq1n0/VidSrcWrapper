import {
  createRouter,
  createMemoryHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { nextTick } from 'vue';
import { vi } from 'vitest';
import type { Movie, TV, TvShowDetails, Episode } from 'tmdb-ts';

export const createMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: 1,
  title: 'Inception',
  overview: 'A mind-bending thriller',
  release_date: '2010-07-16',
  poster_path: '',
  backdrop_path: '',
  vote_average: 8.7,
  vote_count: 1000,
  popularity: 99,
  genre_ids: [28, 878],
  adult: false,
  original_language: 'en',
  original_title: 'Inception',
  video: false,
  ...overrides,
});

export const createShow = (overrides: Partial<TV> = {}): TV => ({
  id: 1,
  adult: false,
  name: 'Breaking Bad',
  first_air_date: '2008-01-20',
  backdrop_path: '',
  genre_ids: [18],
  origin_country: ['US'],
  original_language: 'en',
  original_name: 'Breaking Bad',
  overview: 'A chemistry teacher turns to manufacturing drugs',
  poster_path: '',
  popularity: 100,
  vote_count: 100,
  vote_average: 9.5,
  ...overrides,
});

// Create TvShowDetails for detailed show information including seasons
export const createTvShowDetails = (
  overrides: Partial<TvShowDetails> = {}
): TvShowDetails => ({
  id: 1,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  overview: 'A chemistry teacher turns to manufacturing drugs',
  first_air_date: '2008-01-20',
  poster_path: '',
  backdrop_path: '',
  vote_average: 9.5,
  vote_count: 100,
  popularity: 100,
  genres: [{ id: 18, name: 'Drama' }],
  original_language: 'en',
  origin_country: ['US'],
  created_by: [],
  episode_run_time: [47],
  homepage: '',
  in_production: false,
  languages: ['en'],
  last_air_date: '2013-09-29',
  last_episode_to_air: {
    air_date: '2013-09-29',
    episode_number: 1,
    id: 1,
    name: 'Last Episode',
    overview: 'Last episode overview',
    production_code: '123',
    season_number: 1,
    still_path: '/last-episode-still.jpg',
    vote_average: 8.0,
    vote_count: 100,
  },
  networks: [],
  next_episode_to_air: undefined,
  number_of_episodes: 62,
  number_of_seasons: 5,
  production_companies: [],
  production_countries: [
    { iso_3166_1: 'US', name: 'United States of America' },
  ],
  seasons: [
    {
      id: 1,
      season_number: 1,
      name: 'Season 1',
      overview: 'First season overview',
      episode_count: 7,
      air_date: '2008-01-20',
      poster_path: '/season1-poster.jpg',
    },
  ],
  spoken_languages: [
    { english_name: 'English', iso_639_1: 'en', name: 'English' },
  ],
  status: 'Ended',
  tagline: '',
  type: 'Scripted',
  ...overrides,
});

export const createEpisode = (overrides: Partial<Episode> = {}): Episode => ({
  id: 1,
  name: 'Pilot',
  overview: 'Walter White, a struggling high school chemistry teacher...',
  air_date: '2008-01-20',
  still_path: '/episode-still.jpg',
  episode_number: 1,
  season_number: 1,
  vote_average: 8.0,
  vote_count: 100,
  crew: [],
  guest_stars: [],
  production_code: '',
  runtime: 47,
  show_id: 1,
  ...overrides,
});

export const createTestRouter = (routes: RouteRecordRaw[] = []) =>
  createRouter({
    history: createMemoryHistory(),
    routes,
  });

export const waitForAsync = async (timeout = 100) => {
  await new Promise(resolve => setTimeout(resolve, timeout));
  await nextTick();
};

export type TestSetupOptions = {
  stubVitest?: boolean;
  preserveFetch?: boolean;
};

// Used in: MovieDetailPage.test.ts, ShowDetailPage.test.ts
export const setupTestEnvironment = (options: TestSetupOptions = {}) => {
  const { stubVitest = true, preserveFetch = false } = options;
  const originalFetch = preserveFetch ? null : global.fetch;

  const beforeEachFn = () => {
    if (stubVitest) {
      vi.stubEnv('VITEST', 'true');
    }
  };

  const afterEachFn = () => {
    if (originalFetch) {
      global.fetch = originalFetch as typeof global.fetch;
    }
    vi.restoreAllMocks();
  };

  return { beforeEachFn, afterEachFn };
};

export const testScenarios = {
  movies: {
    inception: createMovie({
      id: 1,
      title: 'Inception',
      overview: 'A mind-bending thriller about dreams within dreams',
      release_date: '2010-07-16',
      poster_path: '/inception-poster.jpg',
      backdrop_path: '/inception-backdrop.jpg',
      vote_average: 8.7,
      vote_count: 2000,
      popularity: 95.5,
    }),
    darkKnight: createMovie({
      id: 123,
      title: 'The Dark Knight',
      overview:
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
      release_date: '2008-07-18',
      poster_path: '/dark-knight-poster.jpg',
      backdrop_path: '/dark-knight-backdrop.jpg',
      vote_average: 9.0,
      vote_count: 5000,
      popularity: 98.2,
    }),
    noPoster: createMovie({
      id: 2,
      title: 'No Poster Movie',
      overview: '',
      release_date: '2021-03-15',
      poster_path: '',
      backdrop_path: '',
      vote_average: 6.5,
      vote_count: 50,
      popularity: 25.0,
    }),
  },
  shows: {
    breakingBad: createShow({
      id: 1,
      name: 'Breaking Bad',
      overview: 'A chemistry teacher turns to manufacturing drugs',
      first_air_date: '2008-01-20',
      vote_average: 9.5,
      vote_count: 100,
      popularity: 100,
    }),
    betterCallSaul: createShow({
      id: 2,
      name: 'Better Call Saul',
      vote_average: 8.8,
    }),
    theSopranos: createShow({
      id: 3,
      name: 'The Sopranos',
      vote_average: 9.2,
    }),
  },

  showDetails: {
    testShow: createTvShowDetails({
      id: 1,
      name: 'Test Show',
      overview: 'A great test show',
      first_air_date: '2000-01-01',
      poster_path: '/test-poster.jpg',
      backdrop_path: '/test-backdrop.jpg',
      vote_average: 8.5,
      vote_count: 100,
      seasons: [
        {
          id: 1,
          season_number: 1,
          name: 'Season 1',
          overview: 'First season',
          episode_count: 2,
          air_date: '2000-01-01',
          poster_path: '/season1-poster.jpg',
        },
      ],
    }),
    urlTestShow: createTvShowDetails({
      id: 2,
      name: 'URL Test Show',
      overview: 'Show loaded from URL params',
      vote_average: 8.2,
      vote_count: 150,
      popularity: 75,
      seasons: [
        {
          id: 2,
          season_number: 1,
          name: 'Season 1',
          overview: 'First season',
          episode_count: 2,
          air_date: '2000-01-01',
          poster_path: '/season1-poster.jpg',
        },
      ],
    }),
  },
  episodes: {
    season1: [
      createEpisode({
        id: 10,
        name: 'Episode 1',
        overview: 'First episode description',
        episode_number: 1,
        season_number: 1,
        vote_average: 7.8,
        air_date: '2000-01-02',
        still_path: '/ep1-still.jpg',
      }),
      createEpisode({
        id: 11,
        name: 'Episode 2',
        overview: 'Second episode description',
        episode_number: 2,
        season_number: 1,
        vote_average: 8.1,
        air_date: '2000-01-03',
        still_path: '/ep2-still.jpg',
      }),
    ],
  },
};
