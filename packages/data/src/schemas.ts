import { z } from 'zod';
import type {
  TMDBMovieResponse,
  TMDBSearchResponse,
  TMDBTVResponse,
  TMDBTVDetailsResponse,
  TMDBSeasonDetailsResponse,
} from './types.js';

// Zod schema for TMDB Movie response
export const TMDBMovieResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string(),
  overview: z.string(),
  release_date: z.string().optional(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  vote_average: z.number().optional(),
  vote_count: z.number().optional(),
  popularity: z.number().optional(),
  genre_ids: z.array(z.number()).optional(),
  adult: z.boolean(),
  original_language: z.string(),
  video: z.boolean().optional(),
});

// Zod schema for TMDB Search response
export const TMDBSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(TMDBMovieResponseSchema),
  total_pages: z.number(),
  total_results: z.number(),
});

// Type guards using Zod for runtime validation
export function validateTMDBMovieResponse(data: unknown): TMDBMovieResponse {
  return TMDBMovieResponseSchema.parse(data);
}

export function validateTMDBSearchResponse(data: unknown): TMDBSearchResponse {
  return TMDBSearchResponseSchema.parse(data);
}

// Safe validation functions that return validation results
export function safeParseTMDBMovieResponse(data: unknown) {
  return TMDBMovieResponseSchema.safeParse(data);
}

export function safeParseTMDBSearchResponse(data: unknown) {
  return TMDBSearchResponseSchema.safeParse(data);
}

// ========================= TV Schemas =========================

export const TMDBTVResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string(),
  overview: z.string(),
  first_air_date: z.string().optional(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  vote_average: z.number().optional(),
  vote_count: z.number().optional(),
  popularity: z.number().optional(),
  genre_ids: z.array(z.number()).optional(),
  original_language: z.string(),
});

export const TMDBTVDetailsResponseSchema = TMDBTVResponseSchema.extend({
  genres: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  number_of_seasons: z.number().optional(),
  number_of_episodes: z.number().optional(),
  seasons: z
    .array(
      z.object({
        season_number: z.number(),
        name: z.string(),
        episode_count: z.number(),
        air_date: z.string().nullable().optional(),
        poster_path: z.string().nullable(),
      })
    )
    .optional(),
});

export const TMDBSeasonDetailsResponseSchema = z.object({
  id: z.number(),
  season_number: z.number(),
  episodes: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      overview: z.string(),
      air_date: z.string().nullable().optional(),
      still_path: z.string().nullable(),
      episode_number: z.number(),
      season_number: z.number(),
      vote_average: z.number().optional(),
    })
  ),
});

export function validateTMDBTVResponse(data: unknown): TMDBTVResponse {
  return TMDBTVResponseSchema.parse(data);
}

export function validateTMDBTVDetailsResponse(
  data: unknown
): TMDBTVDetailsResponse {
  return TMDBTVDetailsResponseSchema.parse(data);
}

export function validateTMDBSeasonDetailsResponse(
  data: unknown
): TMDBSeasonDetailsResponse {
  return TMDBSeasonDetailsResponseSchema.parse(data);
}
