import { z } from 'zod';
import type { TMDBMovieResponse, TMDBSearchResponse } from './types.js';

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
