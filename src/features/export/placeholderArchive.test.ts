import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import type { ContestData } from '../contest/contestTypes';
import { buildPlaceholderArchive } from './placeholderArchive';
import type { ScoreboardRenderConfig } from '../render/scoreboardRenderer';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const SAMPLE_CONTEST: ContestData = {
  entries: [
    {
      artist: 'Artist A',
      country: 'Alpha',
      flag: 'World/is.png',
      song: 'Song A',
      votes: ['12', '', ''],
    },
    {
      artist: 'Artist B',
      country: 'Beta',
      flag: 'World/se.png',
      song: 'Song B',
      votes: ['', '10', ''],
    },
    {
      artist: 'Artist C',
      country: 'Gamma',
      flag: 'World/no.png',
      song: 'Song C',
      votes: ['8', '12', 'dq'],
    },
  ],
  hasCountColumn: false,
  numEntries: 3,
  numVoters: 3,
  voterNames: ['Denmark', 'United Kingdom', 'Sweden'],
};
const SAMPLE_RENDER_CONFIG: ScoreboardRenderConfig = {
  accentColor: '#FCB906',
  appendResultsToTitle: true,
  displayFlagBorders: false,
  displayFlags: false,
  mainColor: '#2F292B',
  title: 'FSC 281',
};

/**
 * Returns true when the provided byte array starts with the PNG signature.
 */
function hasPngSignature(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((signatureByte, index) => {
    return bytes[index] === signatureByte;
  });
}

describe('buildPlaceholderArchive', () => {
  it('creates one scoreboard png file per voter in a zip archive', async () => {
    const progressUpdates: Array<[number, number]> = [];
    const archive = await buildPlaceholderArchive(
      SAMPLE_CONTEST,
      SAMPLE_RENDER_CONFIG,
      {
        isCancelled: () => false,
        onProgress: (completed, total) => {
          progressUpdates.push([completed, total]);
        },
      },
    );

    expect(archive.generatedCount).toBe(3);
    expect(archive.zipFileName).toBe('FSC 281.zip');
    expect(progressUpdates).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);

    const zip = await JSZip.loadAsync(archive.archiveBytes);

    expect(Object.keys(zip.files).sort()).toEqual([
      '01 - Denmark.png',
      '02 - United Kingdom.png',
      '03 - Sweden.png',
    ]);

    const firstImageBytes = await zip
      .file('01 - Denmark.png')
      ?.async('uint8array');

    expect(firstImageBytes).toBeDefined();
    expect(hasPngSignature(firstImageBytes ?? new Uint8Array())).toBe(true);
  });

  it('stops generation when cancellation is requested', async () => {
    let shouldCancel = false;

    await expect(
      buildPlaceholderArchive(SAMPLE_CONTEST, SAMPLE_RENDER_CONFIG, {
        isCancelled: () => shouldCancel,
        onProgress: (completed) => {
          if (completed === 1) {
            shouldCancel = true;
          }
        },
      }),
    ).rejects.toThrow('Generation was cancelled.');
  });
});
