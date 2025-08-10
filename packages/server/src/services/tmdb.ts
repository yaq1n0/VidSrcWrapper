import type {
  Movie,
  SearchResponse,
  TMDBMovieResponse,
} from '@vidsrc-wrapper/data';
import {
  validateTMDBSearchResponse,
  validateTMDBMovieResponse,
} from '@vidsrc-wrapper/data';
import { CONFIG } from '../config.js';

export class TMDBService {
  private async fetchFromTMDB<T>(
    endpoint: string,
    params: Record<string, string> = {},
    validator?: (data: unknown) => T
  ): Promise<T> {
    const url = new URL(`${CONFIG.TMDB_BASE_URL}${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Use Bearer token authentication for read access token
    const headers: Record<string, string> = {
      Authorization: `Bearer ${CONFIG.TMDB_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TMDB API Error Details:`, {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });
      throw new Error(
        `TMDB API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
      );
    }

    const data = await response.json();

    // Validate the response if a validator is provided
    if (validator) {
      try {
        return validator(data);
      } catch (validationError) {
        console.error('TMDB API response validation failed:', validationError);
        throw new Error('Invalid response format from TMDB API');
      }
    }

    return data;
  }

  async searchMovies(query: string, page: number = 1): Promise<SearchResponse> {
    if (!query.trim()) {
      return {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }

    try {
      const data = await this.fetchFromTMDB(
        '/search/movie',
        {
          query: query.trim(),
          page: page.toString(),
          include_adult: 'false',
        },
        validateTMDBSearchResponse
      );

      return {
        page: data.page,
        results: data.results.map(
          (movie): Movie => ({
            id: movie.id,
            title: movie.title,
            overview: movie.overview || '',
            release_date: movie.release_date || '',
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            vote_average: movie.vote_average || 0,
            vote_count: movie.vote_count || 0,
            popularity: movie.popularity || 0,
            genre_ids: movie.genre_ids || [],
            adult: movie.adult || false,
            original_language: movie.original_language || '',
            original_title: movie.original_title || movie.title,
            video: movie.video || false,
          })
        ),
        total_pages: data.total_pages,
        total_results: data.total_results,
      };
    } catch (error) {
      console.error('Error searching movies:', error);
      throw new Error('Failed to search movies');
    }
  }

  async getMovieById(movieId: number): Promise<Movie> {
    try {
      const data = await this.fetchFromTMDB<TMDBMovieResponse>(
        `/movie/${movieId}`,
        {},
        validateTMDBMovieResponse
      );

      // TMDB details endpoint returns `genres` as array of objects, while search returns `genre_ids`.
      // Our shared `Movie` type expects `genre_ids: number[]`.
      const dataWithOptionalFields: {
        genre_ids?: number[];
        genres?: Array<{ id: number; name: string }>;
      } = data as unknown as {
        genre_ids?: number[];
        genres?: Array<{ id: number; name: string }>;
      };

      const genreIds: number[] = Array.isArray(dataWithOptionalFields.genre_ids)
        ? dataWithOptionalFields.genre_ids || []
        : Array.isArray(dataWithOptionalFields.genres)
          ? dataWithOptionalFields.genres.map((g: { id: number }) => g.id)
          : [];

      const movie: Movie = {
        id: data.id,
        title: data.title,
        overview: data.overview || '',
        release_date: data.release_date || '',
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        vote_average: data.vote_average || 0,
        vote_count: data.vote_count || 0,
        popularity: data.popularity || 0,
        genre_ids: genreIds,
        adult: data.adult || false,
        original_language: data.original_language || '',
        original_title: data.original_title || data.title,
        video: data.video || false,
      };

      return movie;
    } catch (error) {
      console.error(`Error fetching movie by id ${movieId}:`, error);
      throw new Error('Failed to fetch movie details');
    }
  }
}
