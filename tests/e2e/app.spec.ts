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
  await expect(
    page.getByRole('heading', { name: 'Generate Scoreboards' }),
  ).toBeVisible();
});

test('enables generation after required fields are provided', async ({
  page,
}) => {
  await page.goto('/');

  const generateButton = page.getByRole('button', { name: 'Generate' });
  await expect(generateButton).toBeDisabled();

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from([]),
  });

  await expect(generateButton).toBeEnabled();
});

test('switches from generate to cancel and then shows success', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from([]),
  });

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(page.getByText(/mock scoreboards generated/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download ZIP' })).toBeVisible({
    timeout: 7000,
  });
  await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible();
});

test('cancel stops the mocked generation flow and returns to idle', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from([]),
  });

  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click({ force: true });

  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download ZIP' })).toHaveCount(
    0,
  );
});

test('disables flag borders without clearing their value', async ({ page }) => {
  await page.goto('/');

  const includeFlags = page.getByRole('checkbox', { name: 'Include flags' });
  const drawFlagBorders = page.getByRole('checkbox', {
    name: 'Draw flag borders',
  });

  await expect(drawFlagBorders).toBeChecked();
  await includeFlags.uncheck();

  await expect(includeFlags).not.toBeChecked();
  await expect(drawFlagBorders).toBeChecked();
  await expect(drawFlagBorders).toBeDisabled();

  await includeFlags.check();

  await expect(drawFlagBorders).toBeChecked();
  await expect(drawFlagBorders).toBeEnabled();
});
