// TMDB API Movie interface
export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  video: boolean;
}

// Search API response structure
export interface SearchResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

// API Error response
export interface APIError {
  error: string;
  message?: string;
}

// Search request parameters
export interface SearchParams {
  query: string;
  page?: number;
}

// Raw TMDB API response types (what we receive from TMDB)
export interface TMDBMovieResponse {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  adult: boolean;
  original_language: string;
  video?: boolean;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovieResponse[];
  total_pages: number;
  total_results: number;
}

// ========================= TV Types =========================

export interface Show {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
  original_name: string;
}

export interface SeasonSummary {
  season_number: number;
  name: string;
  episode_count: number;
  air_date?: string | null;
  poster_path: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  air_date?: string | null;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  vote_average: number;
}

export interface ShowDetails extends Show {
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: SeasonSummary[];
}

export interface TVSearchResponse {
  page: number;
  results: Show[];
  total_pages: number;
  total_results: number;
}

// Raw TMDB TV responses
export interface TMDBTVResponse {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  original_language: string;
}

export interface TMDBTVDetailsResponse extends TMDBTVResponse {
  genres?: Array<{ id: number; name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Array<{
    season_number: number;
    name: string;
    episode_count: number;
    air_date?: string | null;
    poster_path: string | null;
  }>;
}

export interface TMDBEpisodeResponse {
  id: number;
  name: string;
  overview: string;
  air_date?: string | null;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  vote_average?: number;
}

export interface TMDBSeasonDetailsResponse {
  id: number;
  season_number: number;
  episodes: TMDBEpisodeResponse[];
}
