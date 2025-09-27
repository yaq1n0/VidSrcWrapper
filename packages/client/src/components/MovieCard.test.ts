import MovieCard from './MovieCard.vue';
import { describe, it, expect, vi } from 'vitest';
import { screen, render } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createMovie, createTestRouter } from '../helpers/TestHelpers';

describe('MovieCard', () => {
  it('displays movie information to user', () => {
    const router = createTestRouter();
    const movie = createMovie({
      title: 'Inception',
      vote_average: 8.7,
      release_date: '2010-07-16',
      overview: 'A mind-bending thriller',
    });

    render(MovieCard, {
      props: { movie },
      global: { plugins: [router] },
    });

    // User should see the movie title, rating, year, and overview
    expect(screen.getByText('Inception')).toBeVisible();
    expect(screen.getByText('⭐ 8.7')).toBeVisible();
    expect(screen.getByText('2010')).toBeVisible();
    expect(screen.getByText('A mind-bending thriller')).toBeVisible();
  });

  it('shows fallback when movie has no overview', () => {
    const router = createTestRouter();
    const movie = createMovie({ overview: '' });

    render(MovieCard, {
      props: { movie },
      global: { plugins: [router] },
    });

    expect(screen.getByText('No description available')).toBeVisible();
  });

  it('truncates long overviews for readability', () => {
    const router = createTestRouter();
    const longOverview = 'A'.repeat(200);
    const movie = createMovie({ overview: longOverview });

    render(MovieCard, {
      props: { movie },
      global: { plugins: [router] },
    });

    // User should see truncated overview with ellipsis
    expect(screen.getByText(/\.\.\./)).toBeVisible();
  });

  it('allows user to navigate to movie details', async () => {
    const router = createTestRouter();
    const push = vi.fn();
    router.push = push;
    const user = userEvent.setup();

    const { container } = render(MovieCard, {
      props: { movie: createMovie({ id: 123, title: 'Test Movie' }) },
      global: { plugins: [router] },
    });

    // User can click the card to navigate
    const movieCard = container.querySelector('.movie-card');
    await user.click(movieCard!);
    expect(push).toHaveBeenCalledWith({
      name: 'movie-detail',
      params: { id: 123 },
    });
  });

  it('supports keyboard navigation', async () => {
    const router = createTestRouter();
    const push = vi.fn();
    router.push = push;
    const user = userEvent.setup();

    const { container } = render(MovieCard, {
      props: { movie: createMovie({ id: 456, title: 'Test Movie' }) },
      global: { plugins: [router] },
    });

    // User can use Enter key to navigate
    const movieCard = container.querySelector('.movie-card') as HTMLElement;
    movieCard?.focus();
    await user.keyboard('{Enter}');
    expect(push).toHaveBeenCalledWith({
      name: 'movie-detail',
      params: { id: 456 },
    });
  });
});
