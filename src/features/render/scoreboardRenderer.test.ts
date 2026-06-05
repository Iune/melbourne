import { describe, expect, it } from 'vitest';

import type { GenerationAssets } from '../assets/generationAssets';
import { buildRankedContest } from '../contest/contestResults';
import type { ContestData } from '../contest/contestTypes';
import {
  renderScoreboardPng,
  type ScoreboardRenderConfig,
} from './scoreboardRenderer';

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
  voterNames: ['Voter A', 'Voter B', 'Voter C'],
};
const SAMPLE_RENDER_CONFIG: ScoreboardRenderConfig = {
  accentColor: '#FCB906',
  appendResultsToTitle: true,
  displayFlagBorders: false,
  displayFlags: false,
  mainColor: '#2F292B',
  title: 'FSC 281',
};
const EMPTY_GENERATION_ASSETS: GenerationAssets = {
  customBaseFont: null,
  customFlags: {},
  customPointsFont: null,
};

/**
 * Reads a big-endian 32-bit integer from PNG bytes.
 */
function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

describe('renderScoreboardPng', () => {
  it('renders a non-empty scoreboard png with positive dimensions', async () => {
    const bytes = await renderScoreboardPng(
      buildRankedContest(SAMPLE_CONTEST),
      SAMPLE_RENDER_CONFIG,
      1,
      EMPTY_GENERATION_ASSETS,
    );

    expect(bytes.length).toBeGreaterThan(0);
    expect(
      PNG_SIGNATURE.every((signatureByte, index) => {
        return bytes[index] === signatureByte;
      }),
    ).toBe(true);
    expect(readUint32(bytes, 16)).toBeGreaterThan(0);
    expect(readUint32(bytes, 20)).toBeGreaterThan(0);
  });

  it('renders wider scoreboards when bundled flags are displayed', async () => {
    const rankedContest = buildRankedContest(SAMPLE_CONTEST);
    const withoutFlags = await renderScoreboardPng(
      rankedContest,
      SAMPLE_RENDER_CONFIG,
      1,
      EMPTY_GENERATION_ASSETS,
    );
    const withFlags = await renderScoreboardPng(
      rankedContest,
      {
        ...SAMPLE_RENDER_CONFIG,
        displayFlagBorders: true,
        displayFlags: true,
      },
      1,
      EMPTY_GENERATION_ASSETS,
    );

    expect(readUint32(withFlags, 16)).toBeGreaterThan(
      readUint32(withoutFlags, 16),
    );
    expect(readUint32(withFlags, 20)).toBe(readUint32(withoutFlags, 20));
  });
});
