import { createRouter, createMemoryHistory } from 'vue-router';
import MovieList from './MovieList.vue';
import type { Movie } from '@vidsrc-wrapper/data';
import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/vue';

const createMovie = (overrides: Partial<Movie> = {}): Movie => ({
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

describe('MovieList', () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [] });

  it('shows loading indicator when searching', () => {
    render(MovieList, {
      props: { movies: [], loading: true },
      global: { plugins: [router] },
    });

    // User should see loading feedback
    expect(screen.getByText('Searching for movies...')).toBeVisible();
  });

  it('displays movies with correct count and information', () => {
    const movies = [
      createMovie({ id: 1, title: 'Inception', vote_average: 8.7 }),
      createMovie({ id: 2, title: 'Interstellar', vote_average: 8.6 }),
      createMovie({ id: 3, title: 'The Dark Knight', vote_average: 9.0 }),
    ];

    render(MovieList, {
      props: { movies, loading: false },
      global: { plugins: [router] },
    });

    // User should see count message and all movie information
    expect(screen.getByText('Found 3 movies')).toBeVisible();
    expect(screen.getByText('Inception')).toBeVisible();
    expect(screen.getByText('Interstellar')).toBeVisible();
    expect(screen.getByText('The Dark Knight')).toBeVisible();
    expect(screen.getByText('⭐ 8.7')).toBeVisible();
    expect(screen.getByText('⭐ 8.6')).toBeVisible();
    expect(screen.getByText('⭐ 9.0')).toBeVisible();
  });

  it('shows empty state when no movies found', () => {
    render(MovieList, {
      props: { movies: [], loading: false },
      global: { plugins: [router] },
    });

    // User should see clear empty state message
    expect(screen.getByText('No movies found')).toBeVisible();
  });
});
