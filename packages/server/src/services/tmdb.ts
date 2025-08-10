import type {
  Movie,
  SearchResponse,
  TMDBMovieResponse,
  TMDBTVResponse,
  TMDBTVDetailsResponse,
  TMDBSeasonDetailsResponse,
  TVSearchResponse,
  Show,
  ShowDetails,
  Episode,
} from '@vidsrc-wrapper/data';
import {
  validateTMDBSearchResponse,
  validateTMDBMovieResponse,
  validateTMDBTVDetailsResponse,
  validateTMDBSeasonDetailsResponse,
} from '@vidsrc-wrapper/data';
import { CONFIG } from '../config.js';

export class TMDBService {
  /**
   * Fetch data from TMDB API
   * @param endpoint - The API endpoint to fetch from
   * @param params - The parameters to pass to the API
   * @param validator - The validator to use to validate the response
   * @returns The data from the API
   */
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

  /**
   * Search for movies
   * @param query - The query to search for
   * @param page - The page number to search on
   * @returns The search response
   */
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

  /**
   * Get a movie by its ID
   * @param movieId - The ID of the movie to get
   * @returns The movie details
   */
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

  /**
   * Search for TV shows
   * @param query - The query to search for
   * @param page - The page number to search on
   * @returns The search response
   */
  async searchShows(
    query: string,
    page: number = 1
  ): Promise<TVSearchResponse> {
    if (!query.trim()) {
      return {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }

    const urlParams = {
      query: query.trim(),
      page: page.toString(),
      include_adult: 'false',
    } as const;

    const data = await this.fetchFromTMDB<{
      page: number;
      results: TMDBTVResponse[];
      total_pages: number;
      total_results: number;
    }>('/search/tv', urlParams);

    return {
      page: data.page,
      results: (data.results || []).map(
        (show): Show => ({
          id: show.id,
          name: show.name,
          overview: show.overview || '',
          first_air_date: show.first_air_date || '',
          poster_path: show.poster_path,
          backdrop_path: show.backdrop_path,
          vote_average: show.vote_average || 0,
          vote_count: show.vote_count || 0,
          popularity: show.popularity || 0,
          genre_ids: show.genre_ids || [],
          original_language: show.original_language || '',
          original_name: show.original_name || show.name,
        })
      ),
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  }

  /**
   * Get a TV show by its ID
   * @param showId - The ID of the TV show to get
   * @returns The TV show details
   */
  async getShowById(showId: number): Promise<ShowDetails> {
    const data = await this.fetchFromTMDB<TMDBTVDetailsResponse>(
      `/tv/${showId}`,
      {},
      validateTMDBTVDetailsResponse
    );

    const dataWithOptionalFields: {
      genre_ids?: number[];
      genres?: Array<{ id: number; name: string }>;
      seasons?: Array<{
        season_number: number;
        name: string;
        episode_count: number;
        air_date?: string | null;
        poster_path: string | null;
      }>;
    } = data as TMDBTVDetailsResponse;

    const genreIds: number[] = Array.isArray(dataWithOptionalFields.genre_ids)
      ? dataWithOptionalFields.genre_ids || []
      : Array.isArray(dataWithOptionalFields.genres)
        ? dataWithOptionalFields.genres.map(g => g.id)
        : [];

    const seasons = (dataWithOptionalFields.seasons || []).map(season => ({
      season_number: season.season_number,
      name: season.name,
      episode_count: season.episode_count,
      air_date: season.air_date ?? null,
      poster_path: season.poster_path,
    }));

    return {
      id: data.id,
      name: data.name,
      overview: data.overview || '',
      first_air_date: data.first_air_date || '',
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      vote_average: data.vote_average || 0,
      vote_count: data.vote_count || 0,
      popularity: data.popularity || 0,
      genre_ids: genreIds,
      original_language: data.original_language || '',
      original_name: data.original_name || data.name,
      number_of_seasons: data.number_of_seasons || seasons.length,
      number_of_episodes:
        data.number_of_episodes ||
        seasons.reduce((acc, s) => acc + (s.episode_count || 0), 0),
      seasons,
    };
  }

  /**
   * Get the episodes for a season of a TV show
   * @param showId - The ID of the TV show
   * @param seasonNumber - The number of the season to get episodes for
   * @returns The episodes for the season
   */
  async getSeasonEpisodes(
    showId: number,
    seasonNumber: number
  ): Promise<Episode[]> {
    const data = await this.fetchFromTMDB<TMDBSeasonDetailsResponse>(
      `/tv/${showId}/season/${seasonNumber}`,
      {},
      validateTMDBSeasonDetailsResponse
    );

    return (data.episodes || []).map(ep => ({
      id: ep.id,
      name: ep.name,
      overview: ep.overview || '',
      air_date: ep.air_date ?? null,
      still_path: ep.still_path,
      episode_number: ep.episode_number,
      season_number: ep.season_number,
      vote_average: ep.vote_average || 0,
    }));
  }
}
