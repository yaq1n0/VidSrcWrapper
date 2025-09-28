import {
  createRouter,
  createMemoryHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { nextTick } from 'vue';
import { vi } from 'vitest';
import { type Movie, type TV as Show } from 'tmdb-ts';

// ============================================================================
// Mock Data Factories
// ============================================================================
//
// Note: Single-use helpers have been moved to their respective test files:
// - MovieDetailPage.test.ts: createMovieRouter, createMovieMock
// - ShowDetailPage.test.ts: createShowRouter, createShowDetails, createEpisode,
//   createShowWithEpisodesMock, show-specific testScenarios

export const createMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: 1,
  title: 'Inception',
  overview: 'A mind-bending thriller',
  release_date: '2010-07-16',
  poster_path: null,
  backdrop_path: null,
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

export const createShow = (overrides: Partial<Show> = {}): Show => ({
  id: 1,
  name: 'Breaking Bad',
  overview: 'A chemistry teacher turns to manufacturing drugs',
  first_air_date: '2008-01-20',
  poster_path: null,
  backdrop_path: null,
  vote_average: 9.5,
  vote_count: 100,
  popularity: 100,
  genre_ids: [18],
  original_language: 'en',
  original_name: 'Breaking Bad',
  ...overrides,
});

// ============================================================================
// Router Utilities
// ============================================================================

// Used across multiple component test files (MovieCard, ShowCard, etc.)
export const createTestRouter = (routes: RouteRecordRaw[] = []) =>
  createRouter({
    history: createMemoryHistory(),
    routes,
  });

// ============================================================================
// Async Utilities
// ============================================================================

/** wait for async operations to complete
 * Used in: MovieDetailPage.test.ts, ShowDetailPage.test.ts
 * @param timeout - The timeout in milliseconds to wait for the async operations to complete.
 */
export const waitForAsync = async (timeout = 100) => {
  await new Promise(resolve => setTimeout(resolve, timeout));
  await nextTick();
};

// ============================================================================
// Test Setup Utilities
// ============================================================================

// Used in: MovieDetailPage.test.ts, ShowDetailPage.test.ts
export interface TestSetupOptions {
  stubVitest?: boolean;
  preserveFetch?: boolean;
}

// Used in: MovieDetailPage.test.ts, ShowDetailPage.test.ts
export const setupTestEnvironment = (options: TestSetupOptions = {}) => {
  const { stubVitest = true, preserveFetch = false } = options;
  const originalFetch = preserveFetch ? null : global.fetch;

  const beforeEachFn = () => {
    if (stubVitest) {
      vi.stubEnv('VITEST', 'true');
    }
    // HTTP client mocking is now handled individually by each test
  };

  const afterEachFn = () => {
    if (originalFetch) {
      global.fetch = originalFetch as typeof global.fetch;
    }
    vi.restoreAllMocks();
  };

  return { beforeEach: beforeEachFn, afterEach: afterEachFn };
};

// ============================================================================
// Common Test Scenarios
// ============================================================================

// Used across multiple test files for consistent test data
export const testScenarios = {
  // Movies - Used in: MovieDetailPage.test.ts, and potentially MovieCard/MovieList tests
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
      poster_path: null,
      backdrop_path: null,
      vote_average: 6.5,
      vote_count: 50,
      popularity: 25.0,
    }),
  },

  // Shows - Used in: ShowList.test.ts and potentially ShowCard tests
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
};
