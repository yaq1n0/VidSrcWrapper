import type {
  Movie,
  MovieDetails,
  Search,
  TV,
  TvShowDetails,
  Episode,
} from 'tmdb-ts';
import { TMDB } from 'tmdb-ts';
import { CONFIG } from './config';

export class TMDBService {
  private tmdb: TMDB;

  constructor() {
    this.tmdb = new TMDB(CONFIG.TMDB_API_KEY);
  }

  /**
   * Search for movies
   * @param query - The query to search for
   * @param page - The page number to search on
   * @returns The search response
   */
  async searchMovies(query: string, page: number = 1): Promise<Search<Movie>> {
    if (!query.trim()) {
      return {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }

    try {
      return await this.tmdb.search.movies({
        query: query.trim(),
        page,
        include_adult: false,
      });
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
  async getMovieById(movieId: number): Promise<MovieDetails> {
    try {
      return await this.tmdb.movies.details(movieId);
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
  async searchShows(query: string, page: number = 1): Promise<Search<TV>> {
    if (!query.trim()) {
      return {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }

    try {
      return await this.tmdb.search.tvShows({
        query: query.trim(),
        page,
        include_adult: false,
      });
    } catch (error) {
      console.error('Error searching TV shows:', error);
      throw new Error('Failed to search TV shows');
    }
  }

  /**
   * Get a TV show by its ID
   * @param showId - The ID of the TV show to get
   * @returns The TV show details
   */
  async getShowById(showId: number): Promise<TvShowDetails> {
    try {
      return await this.tmdb.tvShows.details(showId);
    } catch (error) {
      console.error(`Error fetching TV show by id ${showId}:`, error);
      throw new Error('Failed to fetch TV show details');
    }
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
    try {
      const data = await this.tmdb.tvSeasons.details({
        tvShowID: showId,
        seasonNumber,
      });
      return data.episodes || [];
    } catch (error) {
      console.error(
        `Error fetching episodes for show ${showId} season ${seasonNumber}:`,
        error
      );
      throw new Error('Failed to fetch season episodes');
    }
  }
}
