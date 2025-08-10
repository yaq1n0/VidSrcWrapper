import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import MovieCard from './MovieCard.vue';
import ShowCard from './ShowCard.vue';
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

describe('ShowCard', () => {
  it('renders show name and rating', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] });
    const wrapper = mount(ShowCard, {
      props: {
        show: {
          id: 1,
          name: 'Breaking Bad',
          overview: 'desc',
          first_air_date: '2008-01-20',
          poster_path: null,
          backdrop_path: null,
          vote_average: 9.5,
          vote_count: 100,
          popularity: 100,
          genre_ids: [18],
          original_language: 'en',
          original_name: 'Breaking Bad',
        },
      },
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain('Breaking Bad');
    expect(wrapper.text()).toContain('⭐ 9.5');
  });
});
