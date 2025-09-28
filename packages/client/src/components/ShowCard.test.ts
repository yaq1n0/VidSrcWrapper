import ShowCard from './ShowCard.vue';
import { describe, it, expect, vi } from 'vitest';
import { screen, render } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createShow, createTestRouter } from '../helpers/TestHelpers';

describe('ShowCard', () => {
  it('displays show information to user', () => {
    const router = createTestRouter();
    const show = createShow({
      name: 'Breaking Bad',
      vote_average: 9.5,
      first_air_date: '2008-01-20',
      overview: 'A chemistry teacher turns to manufacturing drugs',
    });

    render(ShowCard, {
      props: { show },
      global: { plugins: [router] },
    });

    // User should see the show name, rating, year, and overview
    expect(screen.getByText('Breaking Bad')).toBeVisible();
    expect(screen.getByText('⭐ 9.5')).toBeVisible();
    expect(screen.getByText('2008')).toBeVisible();
    expect(
      screen.getByText('A chemistry teacher turns to manufacturing drugs')
    ).toBeVisible();
  });

  it('shows fallback when show has no overview', () => {
    const router = createTestRouter();
    const show = createShow({ overview: '' });

    render(ShowCard, {
      props: { show },
      global: { plugins: [router] },
    });

    expect(screen.getByText('No description available')).toBeVisible();
  });

  it('truncates long overviews for readability', () => {
    const router = createTestRouter();
    const longOverview = 'A'.repeat(200);
    const show = createShow({ overview: longOverview });

    render(ShowCard, {
      props: { show },
      global: { plugins: [router] },
    });

    // User should see truncated overview with ellipsis
    expect(screen.getByText(/\.\.\./)).toBeVisible();
  });

  it('allows user to navigate to show details', async () => {
    const router = createTestRouter();
    const push = vi.fn();
    router.push = push;
    const user = userEvent.setup();

    const { container } = render(ShowCard, {
      props: { show: createShow({ id: 123, name: 'Test Show' }) },
      global: { plugins: [router] },
    });

    // User can click the card to navigate
    const showCard = container.querySelector('.show-card');
    await user.click(showCard!);
    expect(push).toHaveBeenCalledWith({
      name: 'tv-detail',
      params: { id: 123 },
    });
  });

  it('supports keyboard navigation', async () => {
    const router = createTestRouter();
    const push = vi.fn();
    router.push = push;
    const user = userEvent.setup();

    const { container } = render(ShowCard, {
      props: { show: createShow({ id: 456, name: 'Test Show' }) },
      global: { plugins: [router] },
    });

    // User can use Enter key to navigate
    const showCard = container.querySelector('.show-card') as HTMLElement;
    showCard?.focus();
    await user.keyboard('{Enter}');
    expect(push).toHaveBeenCalledWith({
      name: 'tv-detail',
      params: { id: 456 },
    });
  });

  it('shows placeholder when no poster is available', () => {
    const router = createTestRouter();
    const show = createShow({ poster_path: '' });

    render(ShowCard, {
      props: { show },
      global: { plugins: [router] },
    });

    // User should see a visual placeholder instead of broken image
    expect(screen.getByText('📺')).toBeVisible();
    expect(screen.getByText('No Image')).toBeVisible();
  });
});
