import ShowList from './ShowList.vue';
import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/vue';
import { createTestRouter, testScenarios } from '../helpers/TestHelpers';

describe('ShowList', () => {
  const router = createTestRouter();

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
      testScenarios.shows.breakingBad,
      testScenarios.shows.betterCallSaul,
      testScenarios.shows.theSopranos,
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
