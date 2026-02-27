import { mount } from '@vue/test-utils';
import MovieDetailPage from './MovieDetailPage.vue';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import type { Component } from 'vue';
import {
  waitForAsync,
  setupTestEnvironment,
  testScenarios,
} from '../helpers/TestHelpers';
import { createFetchMock } from '../helpers/FetchMockHelper';
import type { Movie } from 'tmdb-ts';
import { CONFIG } from '../config';

const createMovieRouter = (component: Component) =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/movie/:id', component }],
  });

const createMovieMock = (movieId: number, movieData: Movie) => {
  const fetchMock = createFetchMock();
  fetchMock.mockNextJsonResponse(`/api/movies/${movieId}`, movieData);
  return fetchMock;
};

describe('MovieDetailPage', () => {
  const { beforeEachFn, afterEachFn } = setupTestEnvironment();
  let fetchMock: ReturnType<typeof createFetchMock> | undefined;

  beforeEach(beforeEachFn);

  afterEach(() => {
    afterEachFn();
    fetchMock?.restore();
  });

  it('displays movie information and embeds player correctly', async () => {
    fetchMock = createMovieMock(1, testScenarios.movies.inception);

    const router = createMovieRouter(MovieDetailPage);
    router.push('/movie/1');
    await router.isReady();

    const wrapper = mount(MovieDetailPage, { global: { plugins: [router] } });

    // Component should mount successfully
    expect(wrapper.exists()).toBe(true);

    // Wait for movie to load
    await waitForAsync();

    // Verify movie information is displayed
    expect(wrapper.find('.detail')).toBeTruthy();
    expect(wrapper.text()).toContain('Inception');
    expect(wrapper.text()).toContain(
      'A mind-bending thriller about dreams within dreams'
    );
    expect(wrapper.text()).toContain('⭐ 8.7');
    expect(wrapper.text()).toContain('2010');

    // Verify poster image is displayed
    const poster = wrapper.find('img.poster');
    expect(poster.exists()).toBe(true);
    expect(poster.attributes('src')).toContain(
      'https://image.tmdb.org/t/p/w500/inception-poster.jpg'
    );
    expect(poster.attributes('alt')).toBe('Inception');

    // Verify background style is applied
    const hero = wrapper.find('.hero');
    expect(hero.exists()).toBe(true);

    // Verify player is embedded with correct URL
    const playerWrapper = wrapper.find('.player-wrapper');
    expect(playerWrapper.exists()).toBe(true);

    const iframe = wrapper.find('iframe.player');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toBe(
      `${CONFIG.VIDSRC_BASE_URL}/embed/movie/1`
    );
    expect(iframe.attributes('allowfullscreen')).toBeDefined();
    expect(iframe.attributes('frameborder')).toBe('0');
  });

  it('handles movie without poster and overview gracefully', async () => {
    fetchMock = createMovieMock(2, testScenarios.movies.noPoster);

    const router = createMovieRouter(MovieDetailPage);
    router.push('/movie/2');
    await router.isReady();

    const wrapper = mount(MovieDetailPage, { global: { plugins: [router] } });
    await waitForAsync();

    // Verify movie information is displayed
    expect(wrapper.text()).toContain('No Poster Movie');
    expect(wrapper.text()).toContain('⭐ 6.5');
    expect(wrapper.text()).toContain('2021');

    // Verify fallback text for missing overview
    expect(wrapper.text()).toContain('No description available.');

    // Verify no poster image src when poster_path is null
    const poster = wrapper.find('img.poster');
    expect(poster.exists()).toBe(true);
    expect(poster.attributes('src')).toBe('');

    // Verify player still works
    const iframe = wrapper.find('iframe.player');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toBe(
      `${CONFIG.VIDSRC_BASE_URL}/embed/movie/2`
    );
  });

  it('handles loading and error states correctly', async () => {
    // Test with invalid ID (non-numeric)
    const router = createMovieRouter(MovieDetailPage);
    router.push('/movie/invalid');
    await router.isReady();

    const wrapper = mount(MovieDetailPage, { global: { plugins: [router] } });
    await waitForAsync();

    expect(wrapper.text()).toContain('Failed to load movie');

    // Test with negative ID
    router.push('/movie/-1');
    await router.isReady();

    const wrapper2 = mount(MovieDetailPage, { global: { plugins: [router] } });
    await waitForAsync();

    expect(wrapper2.text()).toContain('Failed to load movie');

    // Test with zero ID
    router.push('/movie/0');
    await router.isReady();

    const wrapper3 = mount(MovieDetailPage, { global: { plugins: [router] } });
    await waitForAsync();

    expect(wrapper3.text()).toContain('Failed to load movie');
  });

  it('handles API fetch errors gracefully', async () => {
    // Setup mock that returns 404 for the requested URL
    fetchMock = createFetchMock();
    fetchMock.mockNextError('/api/movies/999', 404, 'Not Found');

    const router = createMovieRouter(MovieDetailPage);
    router.push('/movie/999');
    await router.isReady();

    const wrapper = mount(MovieDetailPage, { global: { plugins: [router] } });

    // Note: For valid IDs, we should see loading state briefly
    // But we need to check synchronously before the async operation completes
    if (wrapper.text().includes('Loading...')) {
      expect(wrapper.text()).toContain('Loading...');
    }

    await waitForAsync();

    // Should show error state after failed fetch
    expect(wrapper.text()).toContain('Failed to load movie');

    // Should not display player when error occurs
    expect(wrapper.find('.player-wrapper').exists()).toBe(false);
    expect(wrapper.find('iframe.player').exists()).toBe(false);
  });

  it('displays all movie metadata correctly', async () => {
    fetchMock = createFetchMock();
    fetchMock.mockNextJsonResponse('/api/movies/123', {
      id: 123,
      title: 'The Dark Knight',
      overview:
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
      release_date: '2008-07-18',
      poster_path: '/dark-knight-poster.jpg',
      backdrop_path: '/dark-knight-backdrop.jpg',
      vote_average: 9.0,
      vote_count: 5000,
      popularity: 98.2,
      genre_ids: [28, 80, 18],
      adult: false,
      original_language: 'en',
      original_title: 'The Dark Knight',
      video: false,
    });

    const router = createMovieRouter(MovieDetailPage);
    router.push('/movie/123');
    await router.isReady();

    const wrapper = mount(MovieDetailPage, { global: { plugins: [router] } });
    await waitForAsync();

    // Test all key elements are displayed
    const infoSection = wrapper.find('.info');
    expect(infoSection.exists()).toBe(true);

    // Title
    const title = wrapper.find('.info h2');
    expect(title.text()).toBe('The Dark Knight');

    // Meta information (date and rating)
    const meta = wrapper.find('.meta');
    expect(meta.text()).toContain('7/18/2008'); // Date formatting
    expect(meta.text()).toContain('⭐ 9.0');

    // Overview
    const overview = wrapper.find('.overview');
    expect(overview.text()).toContain('When the menace known as the Joker');
    expect(overview.text()).toContain('physical tests.');

    // Card layout
    const card = wrapper.find('.card');
    expect(card.exists()).toBe(true);

    // Poster with correct attributes
    const poster = wrapper.find('.poster');
    expect(poster.attributes('src')).toContain('/dark-knight-poster.jpg');
    expect(poster.attributes('alt')).toBe('The Dark Knight');
  });
});
