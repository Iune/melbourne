import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  createTooFewColumnsWorkbookBuffer,
  createValidContestWorkbookBuffer,
} from '../../test/workbookBuilders';
import { parseContestWorkbook } from './contestParser';

/**
 * Reads a workbook fixture from disk into an ArrayBuffer.
 */
async function readWorkbookFixture(filePath: string): Promise<ArrayBuffer> {
  const fileBuffer = await readFile(filePath);

  return fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  );
}

describe('parseContestWorkbook', () => {
  it('parses the bundled Melbourne 1988 workbook', async () => {
    const workbookBuffer = await readWorkbookFixture(
      resolve(process.cwd(), '../melbourne/resources/1988.xlsx'),
    );
    const result = await parseContestWorkbook(workbookBuffer, false);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.contest.numEntries).toBe(21);
    expect(result.contest.numVoters).toBe(21);
    expect(result.contest.voterNames[0]).toBe('Iceland');
    expect(result.contest.entries[0]).toMatchObject({
      artist: 'Daniel',
      country: 'Iceland',
      flag: 'World/is.png',
      song: 'Þú og þeir (Sókrates)',
    });
  });

  it('parses a workbook when the count column is enabled', async () => {
    const workbookBuffer = await createValidContestWorkbookBuffer({
      hasCountColumn: true,
    });
    const result = await parseContestWorkbook(workbookBuffer, true);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.contest.hasCountColumn).toBe(true);
    expect(result.contest.numEntries).toBe(2);
    expect(result.contest.numVoters).toBe(2);
    expect(result.contest.voterNames).toEqual(['Voter A', 'Voter B']);
    expect(result.contest.entries[0]?.votes).toEqual(['5', '']);
    expect(result.contest.entries[0]?.flag).toBe('World/is.png');
  });

  it('returns a blocking error when the workbook has too few columns', async () => {
    const workbookBuffer = await createTooFewColumnsWorkbookBuffer();
    const result = await parseContestWorkbook(workbookBuffer, false);

    expect(result).toEqual({
      errors: [{ message: 'Excel sheet does not have enough columns.' }],
      ok: false,
    });
  });
});
