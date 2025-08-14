import { test, expect } from '@playwright/test';

type ModeTestParams = {
  contentType: 'movies' | 'shows';
  searchQuery: string;
  expectedContentName: RegExp;
  cardSelector: string;
  detailPagePattern: RegExp;
  placeholder: string;
};

const moviesTestParams: ModeTestParams = {
  contentType: 'movies',
  searchQuery: 'minecraft',
  expectedContentName: /minecraft/i,
  cardSelector: '.movie-card',
  detailPagePattern: /\/movie\/\d+/,
  placeholder: 'Search for movies...',
};

const showsTestParams: ModeTestParams = {
  contentType: 'shows',
  searchQuery: 'adventure time',
  expectedContentName: /adventure time/i,
  cardSelector: '.show-card',
  detailPagePattern: /\/tv\/\d+/,
  placeholder: 'Search for shows...',
};

const testCases = [moviesTestParams, showsTestParams];

test.describe('Content Search and Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  testCases.forEach(params => {
    test.describe(params.contentType, () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole('tab', { name: params.contentType }).click();
        await expect(page.getByPlaceholder(params.placeholder)).toBeVisible();
      });

      test(`can search, view details, and play ${params.searchQuery}`, async ({
        page,
      }) => {
        // Search for content
        const searchInput = page.getByPlaceholder(params.placeholder);
        await searchInput.fill(params.searchQuery);
        await page.getByRole('button', { name: 'Search' }).click();

        // Wait for results
        await expect(
          page.getByText(new RegExp(`Found \\d+ ${params.contentType}`))
        ).toBeVisible({
          timeout: 10_000,
        });

        // Find and click on the expected content
        const contentCard = page
          .locator(params.cardSelector)
          .filter({ hasText: params.expectedContentName })
          .first();
        await expect(contentCard).toBeVisible({ timeout: 5_000 });

        // Verify card has essential elements (title and is clickable)
        await expect(contentCard.locator('.title')).toContainText(
          params.expectedContentName
        );
        await expect(contentCard).toHaveAttribute('role', 'button');

        await contentCard.click();

        // Verify navigation to detail page
        await expect(page).toHaveURL(params.detailPagePattern);
        await expect(page.locator('.detail')).toBeVisible({ timeout: 5_000 });

        // Verify content title on detail page
        const contentTitle = page.locator('.info h2');
        await expect(contentTitle).toContainText(params.expectedContentName);

        if (params.contentType === 'movies') {
          // For movies: verify player loads
          const iframe = page.locator('iframe.player');
          await expect(iframe).toBeVisible({ timeout: 8_000 });
          await expect(iframe).toHaveAttribute('allowfullscreen');
        } else {
          // For shows: verify seasons/episodes interface
          await expect(page.locator('.seasons')).toBeVisible({
            timeout: 5_000,
          });
          const seasonCards = page.locator('.season-card');
          await expect(seasonCards.first()).toBeVisible();

          // Select first season and episode
          await seasonCards.first().click();
          const episodeCards = page.locator('.episode-card');
          await expect(episodeCards.first()).toBeVisible({ timeout: 5_000 });
          await episodeCards.first().click();

          // Verify episode selection worked
          await expect(page.locator('.episode-selected')).toBeVisible({
            timeout: 3_000,
          });
          await expect(page).toHaveURL(/episode=\d+/);
        }
      });

      test(`handles empty and invalid searches for ${params.contentType}`, async ({
        page,
      }) => {
        const searchButton = page.getByRole('button', { name: 'Search' });
        const searchInput = page.getByPlaceholder(params.placeholder);

        // Empty search should disable button
        await expect(searchButton).toBeDisabled();

        // Whitespace-only search should disable button
        await searchInput.fill('   ');
        await expect(searchButton).toBeDisabled();

        // Valid search should enable button
        await searchInput.fill('test');
        await expect(searchButton).toBeEnabled();

        // Search for something that won't return results
        await searchInput.fill('asdfghjklqwertyuiopzxcvbnm123456789');
        await searchButton.click();

        // Should show no results message
        await expect(
          page.getByText(`No ${params.contentType} found`)
        ).toBeVisible({
          timeout: 10_000,
        });
        await expect(page.locator(params.cardSelector)).toHaveCount(0);
      });

      test(`navigation works correctly for ${params.contentType}`, async ({
        page,
      }) => {
        // Search and navigate to detail page
        await page.getByPlaceholder(params.placeholder).fill('batman');
        await page.getByRole('button', { name: 'Search' }).click();

        await expect(
          page.getByText(new RegExp(`Found \\d+ ${params.contentType}`))
        ).toBeVisible({
          timeout: 10_000,
        });

        const firstCard = page.locator(params.cardSelector).first();
        await firstCard.click();
        await expect(page).toHaveURL(params.detailPagePattern);

        // Go back and verify we're at home
        await page.goBack();
        await expect(page).toHaveURL('/');

        // Verify we can still search (app state reset)
        await page.getByRole('tab', { name: params.contentType }).click();
        await expect(page.getByPlaceholder(params.placeholder)).toHaveValue('');
      });
    });
  });

  test('mode switching clears results and maintains state', async ({
    page,
  }) => {
    // Start in shows mode and search
    await page.getByRole('tab', { name: 'Shows' }).click();
    await page.getByPlaceholder('Search for shows...').fill('breaking bad');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText(/Found \d+ shows/)).toBeVisible({
      timeout: 10_000,
    });

    // Switch to movies mode - should clear results
    await page.getByRole('tab', { name: 'Movies' }).click();
    await expect(page.getByPlaceholder('Search for movies...')).toBeVisible();
    await expect(page.locator('.show-card')).toHaveCount(0);
    await expect(page.locator('.movie-card')).toHaveCount(0);

    // Switch back to shows mode - should still be cleared
    await page.getByRole('tab', { name: 'Shows' }).click();
    await expect(page.getByPlaceholder('Search for shows...')).toBeVisible();
    await expect(page.locator('.show-card')).toHaveCount(0);
  });

  test('TV show season and episode selection works correctly', async ({
    page,
  }) => {
    // Navigate to a multi-season show
    await page.getByRole('tab', { name: 'Shows' }).click();
    await page.getByPlaceholder('Search for shows...').fill('game of thrones');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText(/Found \d+ shows/)).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('.show-card').first().click();
    await expect(page).toHaveURL(/\/tv\/\d+/);

    // Wait for seasons to load
    const seasonCards = page.locator('.season-card');
    await expect(seasonCards.first()).toBeVisible({ timeout: 5_000 });

    // Test season switching if multiple seasons available
    const seasonCount = await seasonCards.count();
    if (seasonCount > 1) {
      const secondSeason = seasonCards.nth(1);
      await secondSeason.click();

      // Verify season selection updates URL and episodes load
      await expect(page).toHaveURL(/season=\d+/);
      await expect(page.locator('.episodes')).toBeVisible();
    }

    // Test episode selection
    await seasonCards.first().click();
    const episodeCards = page.locator('.episode-card');
    await expect(episodeCards.first()).toBeVisible({ timeout: 5_000 });

    const episodeCount = await episodeCards.count();
    if (episodeCount > 1) {
      const secondEpisode = episodeCards.nth(1);
      await secondEpisode.click();

      // Verify episode selection works
      await expect(page).toHaveURL(/episode=\d+/);
      await expect(page.locator('.episode-selected')).toBeVisible();
    }
  });
});
