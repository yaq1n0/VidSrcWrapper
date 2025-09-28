import { mount } from '@vue/test-utils';
import ShowDetailPage from './ShowDetailPage.vue';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import type { Component } from 'vue';
import { waitForAsync, setupTestEnvironment } from '../helpers/TestHelpers';
import { createFetchMock } from '../helpers/FetchMockHelper';
import type { TvShowDetails as ShowDetails, SeasonDetails } from 'tmdb-ts';

type Episode = NonNullable<SeasonDetails['episodes']>[0];

// Show-specific test helpers and data
const createShowRouter = (component: Component) =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/tv/:id', component }],
  });

const createShowDetails = (
  overrides: Partial<ShowDetails> = {}
): ShowDetails => ({
  id: 1,
  name: 'Test Show',
  original_name: 'Test Show',
  overview: 'A great test show',
  first_air_date: '2000-01-01',
  poster_path: '/test-poster.jpg',
  backdrop_path: '/test-backdrop.jpg',
  vote_average: 8.5,
  vote_count: 100,
  popularity: 50,
  genre_ids: [18],
  original_language: 'en',
  number_of_seasons: 1,
  number_of_episodes: 2,
  seasons: [
    {
      season_number: 1,
      name: 'Season 1',
      episode_count: 2,
      air_date: '2000-01-01',
      poster_path: '/season1-poster.jpg',
    },
  ],
  ...overrides,
});

const createEpisode = (overrides: Partial<Episode> = {}): Episode => ({
  id: 10,
  name: 'Episode 1',
  overview: 'First episode description',
  air_date: '2000-01-02',
  still_path: '/ep1-still.jpg',
  episode_number: 1,
  season_number: 1,
  vote_average: 7.8,
  ...overrides,
});

const createShowWithEpisodesMock = (
  showId: number,
  showData: ShowDetails,
  seasonNumber: number,
  episodes: Episode[]
) => {
  const fetchMock = createFetchMock();
  fetchMock.mockNextJsonResponse(`/api/tv/${showId}`, showData);
  fetchMock.mockNextJsonResponse(
    `/api/tv/${showId}/season/${seasonNumber}`,
    episodes
  );
  return fetchMock;
};

// Show-specific test scenarios
const testScenarios = {
  showDetails: {
    testShow: createShowDetails({
      id: 1,
      name: 'Test Show',
      overview: 'A great test show',
      first_air_date: '2000-01-01',
      poster_path: '/test-poster.jpg',
      backdrop_path: '/test-backdrop.jpg',
      vote_average: 8.5,
    }),
    urlTestShow: createShowDetails({
      id: 1,
      name: 'URL Test Show',
      overview: 'Show loaded from URL params',
      vote_average: 8.2,
      vote_count: 150,
      popularity: 75,
    }),
  },
  episodes: {
    season1: [
      createEpisode({
        id: 10,
        name: 'Episode 1',
        overview: 'First episode description',
        episode_number: 1,
        vote_average: 7.8,
      }),
      createEpisode({
        id: 11,
        name: 'Episode 2',
        overview: 'Second episode description',
        air_date: '2000-01-03',
        still_path: '/ep2-still.jpg',
        episode_number: 2,
        vote_average: 8.1,
      }),
    ],
  },
};

describe('ShowDetailPage', () => {
  const { beforeEach: setupBeforeEach, afterEach: setupAfterEach } =
    setupTestEnvironment();
  let fetchMock: ReturnType<typeof createFetchMock> | undefined;

  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    setupAfterEach();
    if (fetchMock) {
      fetchMock.restore();
    }
  });

  it('displays show information and handles season/episode selection with URL updates', async () => {
    fetchMock = createShowWithEpisodesMock(
      1,
      testScenarios.showDetails.testShow,
      1,
      testScenarios.episodes.season1
    );

    const router = createShowRouter(ShowDetailPage);
    router.push('/tv/1');
    await router.isReady();

    const wrapper = mount(ShowDetailPage, { global: { plugins: [router] } });

    // Wait for loading to complete
    await waitForAsync();

    // Verify show information is displayed
    expect(wrapper.find('.detail')).toBeTruthy();
    expect(wrapper.text()).toContain('Test Show');
    expect(wrapper.text()).toContain('A great test show');
    expect(wrapper.text()).toContain('⭐ 8.5');
    expect(wrapper.text()).toContain('2000');

    // Verify seasons section is displayed
    expect(wrapper.find('.seasons')).toBeTruthy();
    expect(wrapper.text()).toContain('Seasons');

    const seasonCards = wrapper.findAll('.season-card');
    expect(seasonCards.length).toBe(1);
    expect(seasonCards[0].text()).toContain('Season 1');
    expect(seasonCards[0].text()).toContain('2 episodes');

    // Verify episodes are loaded and displayed
    await waitForAsync();
    const episodeCards = wrapper.findAll('.episode-card');
    expect(episodeCards.length).toBe(2);
    expect(episodeCards[0].text()).toContain('1. Episode 1');
    expect(episodeCards[1].text()).toContain('2. Episode 2');

    // Test episode selection
    await episodeCards[0].trigger('click');
    await waitForAsync();

    // Verify episode selection UI
    const selectedEpisode = wrapper.find('.episode-selected');
    expect(selectedEpisode.text()).toContain('1. Episode 1');
    expect(selectedEpisode.text()).toContain('First episode description');

    // Verify URL reflects episode selection
    expect(router.currentRoute.value.query.episode).toBe('1');
    expect(router.currentRoute.value.query.season).toBe('1');

    // Verify player is embedded (only if episode is selected)
    const playerWrapper = wrapper.find('.player-wrapper');
    if (playerWrapper.exists()) {
      const iframe = wrapper.find('iframe.player');
      expect(iframe.exists()).toBe(true);
      expect(iframe.attributes('src')).toContain('vidsrc.xyz/embed/tv/1/1-1');
    }
  });

  it('initializes state from URL query params and handles loading states', async () => {
    fetchMock = createShowWithEpisodesMock(
      1,
      testScenarios.showDetails.urlTestShow,
      1,
      testScenarios.episodes.season1
    );

    const router = createShowRouter(ShowDetailPage);
    router.push({ path: '/tv/1', query: { season: '1', episode: '2' } });
    await router.isReady();

    const wrapper = mount(ShowDetailPage, { global: { plugins: [router] } });

    // Component should mount successfully
    expect(wrapper.exists()).toBe(true);

    // Wait for content to load
    await waitForAsync();

    // Verify show loaded correctly
    expect(wrapper.text()).toContain('URL Test Show');
    expect(wrapper.text()).toContain('Show loaded from URL params');

    // Verify episode 2 is pre-selected from URL
    const selectedEpisode = wrapper.find('.episode-selected');
    expect(selectedEpisode.text()).toContain('2. Episode 2');
    expect(selectedEpisode.text()).toContain('Second episode');

    // Verify URL parameters are preserved
    expect(router.currentRoute.value.query.season).toBe('1');
    expect(router.currentRoute.value.query.episode).toBe('2');

    // Verify player URL includes correct episode
    const iframe = wrapper.find('iframe.player');
    expect(iframe.attributes('src')).toContain('vidsrc.xyz/embed/tv/1/1-2');
  });

  it('handles error states and edge cases', async () => {
    // Test with invalid ID
    const router = createShowRouter(ShowDetailPage);
    router.push('/tv/invalid');
    await router.isReady();

    const wrapper = mount(ShowDetailPage, { global: { plugins: [router] } });
    await waitForAsync();

    expect(wrapper.text()).toContain('Failed to load show');

    // Test with ID that causes fetch error
    fetchMock = createFetchMock();
    fetchMock.mockNextError('/api/tv/999', 404, 'Not Found');

    router.push('/tv/999');
    await router.isReady();

    const wrapper2 = mount(ShowDetailPage, { global: { plugins: [router] } });
    await waitForAsync();

    expect(wrapper2.text()).toContain('Failed to load show');
  });
});
