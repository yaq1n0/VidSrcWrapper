import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import MovieCard from './MovieCard.vue';
import type { Movie } from '@vidsrc-wrapper/data';
import { describe, it, expect } from 'vitest';

function makeMovie(overrides: Partial<Movie> = {}): Movie {
  return {
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
  };
}

describe('MovieCard', () => {
  it('renders title and rating', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] });
    const wrapper = mount(MovieCard, {
      props: { movie: makeMovie() },
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain('Inception');
    expect(wrapper.text()).toContain('⭐ 8.7');
  });
});
