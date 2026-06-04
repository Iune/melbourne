import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';
import JSZip from 'jszip';

import {
  createTooFewColumnsWorkbookBuffer,
  createValidContestWorkbookBuffer,
} from '../../src/test/workbookBuilders';

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
  const workbookBuffer = await createValidContestWorkbookBuffer();

  const generateButton = page.getByRole('button', { name: 'Generate' });
  await expect(generateButton).toBeDisabled();

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(workbookBuffer),
  });

  await expect(generateButton).toBeEnabled();
});

test('switches from generate to cancel and then shows success', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer({
    numVoters: 12,
  });

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(workbookBuffer),
  });

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(page.getByText(/placeholder exports generated/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download ZIP' })).toBeVisible({
    timeout: 7000,
  });
  await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible();
});

test('cancel stops the generation flow and returns to idle', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer({
    numVoters: 12,
  });

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(workbookBuffer),
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

test('downloads a zip containing one placeholder file per voter', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer();

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(workbookBuffer),
  });

  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('link', { name: 'Download ZIP' })).toBeVisible({
    timeout: 7000,
  });

  const downloadPromise = page.waitForEvent('download');

  await page.getByRole('link', { name: 'Download ZIP' }).click();

  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(download.suggestedFilename()).toBe('Contest 1988.zip');
  expect(downloadPath).not.toBeNull();

  if (downloadPath === null) {
    throw new Error('Expected a downloaded ZIP file path.');
  }

  const zip = await JSZip.loadAsync(await readFile(downloadPath));

  expect(Object.keys(zip.files).sort()).toEqual([
    '01 - Voter A.txt',
    '02 - Voter B.txt',
  ]);
});

test('shows validation errors for malformed workbooks', async ({ page }) => {
  await page.goto('/');
  const workbookBuffer = await createTooFewColumnsWorkbookBuffer();

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'contest.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(workbookBuffer),
  });

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByText('Validation failed')).toBeVisible();
  await expect(
    page.getByText('Excel sheet does not have enough columns.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
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
