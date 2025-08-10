import { mount } from '@vue/test-utils';
import ShowDetailPage from './ShowDetailPage.vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setHttpClient, MockHttpClient } from '@vidsrc-wrapper/data';

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/tv/:id', component: ShowDetailPage }],
  });

describe('ShowDetailPage interactions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv('VITEST', 'true');
    setHttpClient(new MockHttpClient());
  });
  afterEach(() => {
    global.fetch = originalFetch as typeof global.fetch;
    vi.restoreAllMocks();
  });

  it('loads show, selects season and episode, reflects in URL', async () => {
    // First fetch: show details
    // Second fetch: season episodes
    const mock = new MockHttpClient()
      .on('/api/tv/1', {
        id: 1,
        name: 'Test Show',
        original_name: 'Test Show',
        overview: 'desc',
        first_air_date: '2000-01-01',
        poster_path: null,
        backdrop_path: null,
        vote_average: 8,
        vote_count: 1,
        popularity: 1,
        original_language: 'en',
        number_of_seasons: 1,
        seasons: [
          {
            season_number: 1,
            name: 'S1',
            episode_count: 2,
            air_date: '2000-01-01',
            poster_path: null,
          },
        ],
      })
      .on('/api/tv/1/season/1', [
        {
          id: 10,
          name: 'Episode 1',
          overview: 'E1',
          air_date: '2000-01-02',
          still_path: null,
          episode_number: 1,
          season_number: 1,
          vote_average: 7,
        },
        {
          id: 11,
          name: 'Episode 2',
          overview: 'E2',
          air_date: '2000-01-03',
          still_path: null,
          episode_number: 2,
          season_number: 1,
          vote_average: 7,
        },
      ]);
    setHttpClient(mock);

    const router = makeRouter();
    router.push('/tv/1');
    await router.isReady();

    const wrapper = mount(ShowDetailPage, { global: { plugins: [router] } });

    // wait for mounted load + subsequent episodes fetch
    await nextTick();
    await new Promise(r => setTimeout(r, 0));
    await nextTick();

    // Episodes should render
    const episodeCards = wrapper.findAll('.episode-card');
    expect(episodeCards.length).toBe(2);

    // Click first episode
    await episodeCards[0].trigger('click');
    await nextTick();
    await new Promise(r => setTimeout(r, 0));
    expect(wrapper.find('.episode-selected').text()).toContain('Episode 1');
    // URL should include episode param
    expect(router.currentRoute.value.query.episode).toBe('1');

    // Select season again (no second fetch mock here, but interaction shouldn’t throw)
    const seasonButton = wrapper.find('.season-card');
    await seasonButton.trigger('click');
    await nextTick();
    await new Promise(r => setTimeout(r, 0));
    expect(router.currentRoute.value.query.season).toBe('1');
  });

  it('initializes state from URL query params', async () => {
    const mock = new MockHttpClient()
      .on('/api/tv/1', {
        id: 1,
        name: 'Test Show',
        original_name: 'Test Show',
        overview: 'desc',
        first_air_date: '2000-01-01',
        poster_path: null,
        backdrop_path: null,
        vote_average: 8,
        vote_count: 1,
        popularity: 1,
        original_language: 'en',
        number_of_seasons: 1,
        seasons: [
          {
            season_number: 1,
            name: 'S1',
            episode_count: 2,
            air_date: '2000-01-01',
            poster_path: null,
          },
        ],
      })
      .on('/api/tv/1/season/1', [
        {
          id: 10,
          name: 'Episode 1',
          overview: 'E1',
          air_date: '2000-01-02',
          still_path: null,
          episode_number: 1,
          season_number: 1,
          vote_average: 7,
        },
        {
          id: 11,
          name: 'Episode 2',
          overview: 'E2',
          air_date: '2000-01-03',
          still_path: null,
          episode_number: 2,
          season_number: 1,
          vote_average: 7,
        },
      ]);
    setHttpClient(mock);

    const router = makeRouter();
    router.push({ path: '/tv/1', query: { season: '1', episode: '2' } });
    await router.isReady();

    const wrapper = mount(ShowDetailPage, { global: { plugins: [router] } });
    await new Promise(r => setTimeout(r, 0));
    await nextTick();

    expect(wrapper.find('.episode-selected').text()).toContain('Episode 2');
  });
});
