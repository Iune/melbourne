import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';
import JSZip from 'jszip';

import {
  createTooFewColumnsWorkbookBuffer,
  createValidContestWorkbookBuffer,
} from '../../src/test/workbookBuilders';

const TINY_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=',
  'base64',
);

/**
 * Uploads the contest workbook through the main contest file input.
 */
async function uploadContestWorkbook(
  page: Page,
  workbookBuffer: ArrayBuffer,
): Promise<void> {
  await page
    .getByRole('group', { name: 'Contest Details' })
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'contest.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(workbookBuffer),
    });
}

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
  await expect(
    page.getByRole('button', { name: 'Switch to dark mode' }),
  ).toBeVisible();
});

test('toggles the color scheme from the header control', async ({ page }) => {
  await page.goto('/');

  const colorSchemeToggle = page.getByRole('button', {
    name: 'Switch to dark mode',
  });

  await colorSchemeToggle.click();

  await expect(
    page.getByRole('button', { name: 'Switch to light mode' }),
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
  await uploadContestWorkbook(page, workbookBuffer);

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
  await uploadContestWorkbook(page, workbookBuffer);

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(page.getByText(/scoreboards generated/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download ZIP' })).toBeVisible({
    timeout: 15000,
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
  await uploadContestWorkbook(page, workbookBuffer);

  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click({ force: true });

  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download ZIP' })).toHaveCount(
    0,
  );
});

test('downloads a zip containing one scoreboard png per voter', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer();

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);

  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('link', { name: 'Download ZIP' })).toBeVisible({
    timeout: 15000,
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
    '01 - Voter A.png',
    '02 - Voter B.png',
  ]);
});

test('generates successfully with uploaded custom fonts', async ({ page }) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer();
  const [baseFontBuffer, pointsFontBuffer] = await Promise.all([
    readFile(
      '/Users/aditya/Development/contests/melbourne-canvas/canvas/assets/fonts/ZillaSlab-Regular.otf',
    ),
    readFile(
      '/Users/aditya/Development/contests/melbourne-canvas/canvas/assets/fonts/FiraSans-Regular.otf',
    ),
  ]);

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);
  await page
    .getByRole('group', { name: 'Fonts' })
    .locator('input[type="file"]')
    .nth(0)
    .setInputFiles({
      name: 'base.otf',
      mimeType: 'font/otf',
      buffer: baseFontBuffer,
    });
  await page
    .getByRole('group', { name: 'Fonts' })
    .locator('input[type="file"]')
    .nth(1)
    .setInputFiles({
      name: 'points.otf',
      mimeType: 'font/otf',
      buffer: pointsFontBuffer,
    });

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByRole('link', { name: 'Download ZIP' })).toBeVisible({
    timeout: 15000,
  });
});

test('generates successfully with uploaded custom flag files', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer({
    firstFlag: 'Custom/A.png',
  });

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);
  await page
    .getByRole('group', { name: 'Flags' })
    .locator('input[type="file"]')
    .setInputFiles([
      {
        name: 'A.png',
        mimeType: 'image/png',
        buffer: TINY_PNG_BYTES,
      },
    ]);

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByRole('link', { name: 'Download ZIP' })).toBeVisible({
    timeout: 15000,
  });
});

test('shows validation errors for malformed workbooks', async ({ page }) => {
  await page.goto('/');
  const workbookBuffer = await createTooFewColumnsWorkbookBuffer();

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByText('Validation failed')).toBeVisible();
  await expect(
    page.getByText('Excel sheet does not have enough columns.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
});

test('shows missing bundled flag errors as blocking validation failures', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer({
    firstFlag: 'World/not-real.png',
  });

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByText('Validation Failed')).toBeVisible();
  await expect(
    page.getByText('Missing bundled flag for Alpha: World/not-real.png'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
});

test('shows missing custom flag errors as blocking validation failures', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer({
    firstFlag: 'Custom/A.png',
  });

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByText('Validation Failed')).toBeVisible();
  await expect(
    page.getByText('Missing custom flag for Alpha: Custom/A.png'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
});

test('shows duplicate custom flag upload errors as blocking validation failures', async ({
  page,
}) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer();

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);
  await page
    .getByRole('group', { name: 'Flags' })
    .locator('input[type="file"]')
    .setInputFiles([
      {
        name: 'A.png',
        mimeType: 'image/png',
        buffer: TINY_PNG_BYTES,
      },
      {
        name: 'A.png',
        mimeType: 'image/png',
        buffer: TINY_PNG_BYTES,
      },
    ]);

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByText('Validation Failed')).toBeVisible();
  await expect(
    page.getByText('Duplicate uploaded custom flag file: Custom/A.png'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
});

test('rejects unsafe bundled flag references', async ({ page }) => {
  await page.goto('/');
  const workbookBuffer = await createValidContestWorkbookBuffer({
    firstFlag: '../World/is.png',
  });

  await page.getByLabel('Contest Title').fill('Contest 1988');
  await uploadContestWorkbook(page, workbookBuffer);

  await page.getByRole('button', { name: 'Generate' }).click();

  await expect(page.getByText('Validation Failed')).toBeVisible();
  await expect(
    page.getByText('Invalid flag reference for Alpha: ../World/is.png'),
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
