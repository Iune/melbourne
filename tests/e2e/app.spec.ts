import { expect, test } from '@playwright/test';

test('loads the scaffolded app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Melbourne' })).toHaveAttribute(
    'href',
    '/',
  );
  await expect(page.getByRole('link', { name: 'Help' })).toHaveAttribute(
    'href',
    '#',
  );
  await expect(page.getByRole('link', { name: 'Flags' })).toHaveAttribute(
    'href',
    '#',
  );
  await expect(page.getByRole('heading', { name: 'Melbourne' })).toBeVisible();
});
