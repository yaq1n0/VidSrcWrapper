import type {
  APIError,
  Movie,
  Show,
  ShowDetails,
  Episode,
} from '@vidsrc-wrapper/data';
import type { TMDBService } from '../services/tmdb.js';
import { StatusCode } from 'hono/utils/http-status.js';

export interface HandlerResult<T> {
  status: StatusCode;
  body: T | APIError;
}

type TMDBServiceLike = Pick<
  TMDBService,
  | 'searchMovies'
  | 'getMovieById'
  | 'searchShows'
  | 'getShowById'
  | 'getSeasonEpisodes'
>;

export function createHandlers(tmdb: TMDBServiceLike) {
  const searchMovies = async ({
    query,
    page,
  }: {
    query?: string;
    page: number;
  }): Promise<HandlerResult<Movie[]>> => {
    if (!query) {
      const error: APIError = {
        error: 'Missing query parameter',
        message: 'Please provide a search query',
      };
      return { status: 400, body: error };
    }
    if (!Number.isFinite(page) || page < 1 || page > 1000) {
      const error: APIError = {
        error: 'Invalid page parameter',
        message: 'Page must be between 1 and 1000',
      };
      return { status: 400, body: error };
    }
    try {
      const res = await tmdb.searchMovies(query, page);
      return { status: 200, body: res.results as Movie[] };
    } catch (e) {
      const error: APIError = {
        error: 'Internal server error',
        message: e instanceof Error ? e.message : 'Unknown error occurred',
      };
      return { status: 500, body: error };
    }
  };

  const getMovieById = async ({
    id,
  }: {
    id: number;
  }): Promise<HandlerResult<Movie>> => {
    if (!Number.isFinite(id) || id <= 0) {
      const error: APIError = {
        error: 'Invalid id parameter',
        message: 'Movie id must be a positive integer',
      };
      return { status: 400, body: error };
    }
    try {
      const movie = await tmdb.getMovieById(id);
      return { status: 200, body: movie };
    } catch (e) {
      const error: APIError = {
        error: 'Internal server error',
        message: e instanceof Error ? e.message : 'Unknown error occurred',
      };
      return { status: 500, body: error };
    }
  };

  const searchShows = async ({
    query,
    page,
  }: {
    query?: string;
    page: number;
  }): Promise<HandlerResult<Show[]>> => {
    if (!query) {
      const error: APIError = {
        error: 'Missing query parameter',
        message: 'Please provide a search query',
      };
      return { status: 400, body: error };
    }
    if (!Number.isFinite(page) || page < 1 || page > 1000) {
      const error: APIError = {
        error: 'Invalid page parameter',
        message: 'Page must be between 1 and 1000',
      };
      return { status: 400, body: error };
    }
    try {
      const res = await tmdb.searchShows(query, page);
      return { status: 200, body: res.results as Show[] };
    } catch (e) {
      const error: APIError = {
        error: 'Internal server error',
        message: e instanceof Error ? e.message : 'Unknown error occurred',
      };
      return { status: 500, body: error };
    }
  };

  const getShowById = async ({
    id,
  }: {
    id: number;
  }): Promise<HandlerResult<ShowDetails>> => {
    if (!Number.isFinite(id) || id <= 0) {
      const error: APIError = {
        error: 'Invalid id parameter',
        message: 'Show id must be a positive integer',
      };
      return { status: 400, body: error };
    }
    try {
      const show = await tmdb.getShowById(id);
      return { status: 200, body: show };
    } catch (e) {
      const error: APIError = {
        error: 'Internal server error',
        message: e instanceof Error ? e.message : 'Unknown error occurred',
      };
      return { status: 500, body: error };
    }
  };

  const getSeasonEpisodes = async ({
    id,
    seasonNumber,
  }: {
    id: number;
    seasonNumber: number;
  }): Promise<HandlerResult<Episode[]>> => {
    if (
      !Number.isFinite(id) ||
      id <= 0 ||
      !Number.isFinite(seasonNumber) ||
      seasonNumber < 0
    ) {
      const error: APIError = {
        error: 'Invalid parameter',
        message:
          'Show id must be positive and season number must be non-negative',
      };
      return { status: 400, body: error };
    }
    try {
      const episodes = await tmdb.getSeasonEpisodes(id, seasonNumber);
      return { status: 200, body: episodes };
    } catch (e) {
      const error: APIError = {
        error: 'Internal server error',
        message: e instanceof Error ? e.message : 'Unknown error occurred',
      };
      return { status: 500, body: error };
    }
  };

  return {
    searchMovies,
    getMovieById,
    searchShows,
    getShowById,
    getSeasonEpisodes,
  };
}
