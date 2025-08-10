import { test, expect } from '@playwright/test';

test('search flow shows results and opens detail', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: '🎬 VidSrcWrapper' })
  ).toBeVisible();

  const input = page.getByPlaceholder('Search for movies...');
  await input.fill('batman');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText(/Found \d+ movies/)).toBeVisible({
    timeout: 20_000,
  });

  const firstCard = page.locator('.movies-grid .movie-card').first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await expect(page.locator('iframe.player')).toBeVisible();
  }
});
