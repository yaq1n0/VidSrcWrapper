import { createRouter, createMemoryHistory } from 'vue-router';
import ShowList from './ShowList.vue';
import type { Show } from '@vidsrc-wrapper/data';
import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/vue';

const createShow = (overrides: Partial<Show> = {}): Show => ({
  id: 1,
  name: 'Breaking Bad',
  overview: 'A chemistry teacher turns to manufacturing drugs',
  first_air_date: '2008-01-20',
  poster_path: null,
  backdrop_path: null,
  vote_average: 9.5,
  vote_count: 100,
  popularity: 100,
  genre_ids: [18],
  original_language: 'en',
  original_name: 'Breaking Bad',
  ...overrides,
});

describe('ShowList', () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [] });

  it('shows loading indicator when searching', () => {
    render(ShowList, {
      props: { shows: [], loading: true },
      global: { plugins: [router] },
    });

    // User should see loading feedback
    expect(screen.getByText('Searching for shows...')).toBeVisible();
  });

  it('displays shows with correct count and information', () => {
    const shows = [
      createShow({ id: 1, name: 'Breaking Bad', vote_average: 9.5 }),
      createShow({ id: 2, name: 'Better Call Saul', vote_average: 8.8 }),
      createShow({ id: 3, name: 'The Sopranos', vote_average: 9.2 }),
    ];

    render(ShowList, {
      props: { shows, loading: false },
      global: { plugins: [router] },
    });

    // User should see count message and all show information
    expect(screen.getByText('Found 3 shows')).toBeVisible();
    expect(screen.getByText('Breaking Bad')).toBeVisible();
    expect(screen.getByText('Better Call Saul')).toBeVisible();
    expect(screen.getByText('The Sopranos')).toBeVisible();
    expect(screen.getByText('⭐ 9.5')).toBeVisible();
    expect(screen.getByText('⭐ 8.8')).toBeVisible();
    expect(screen.getByText('⭐ 9.2')).toBeVisible();
  });

  it('shows empty state when no shows found', () => {
    render(ShowList, {
      props: { shows: [], loading: false },
      global: { plugins: [router] },
    });

    // User should see clear empty state message
    expect(screen.getByText('No shows found')).toBeVisible();
  });
});
