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
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovieResponse[];
  total_pages: number;
  total_results: number;
}
