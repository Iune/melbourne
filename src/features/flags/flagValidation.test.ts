import { describe, expect, it } from 'vitest';

import type { ContestData } from '../contest/contestTypes';
import { validateBundledFlags } from './flagValidation';

/**
 * Creates a minimal contest object for flag validation tests.
 */
function createContestWithFlags(flagReferences: string[]): ContestData {
  return {
    entries: flagReferences.map((flagReference, index) => {
      return {
        artist: `Artist ${index + 1}`,
        country: `Country ${index + 1}`,
        flag: flagReference,
        song: `Song ${index + 1}`,
        votes: [],
      };
    }),
    hasCountColumn: false,
    numEntries: flagReferences.length,
    numVoters: 0,
    voterNames: [],
  };
}

describe('validateBundledFlags', () => {
  it('accepts valid bundled flag references', () => {
    const errors = validateBundledFlags(
      createContestWithFlags(['World/is.png', 'ISC/Kaledonii.png']),
    );

    expect(errors).toEqual([]);
  });

  it('reports missing bundled flags as blocking errors', () => {
    const errors = validateBundledFlags(
      createContestWithFlags(['World/not-real.png']),
    );

    expect(errors).toEqual([
      {
        message: 'Missing bundled flag for Country 1: World/not-real.png',
      },
    ]);
  });

  it('rejects escaping or otherwise unsafe flag references', () => {
    const errors = validateBundledFlags(
      createContestWithFlags([
        '../World/is.png',
        'World\\is.png',
        '/World/is.png',
      ]),
    );

    expect(errors).toEqual([
      {
        message: 'Invalid flag reference for Country 1: ../World/is.png',
      },
      {
        message: 'Invalid flag reference for Country 2: World\\is.png',
      },
      {
        message: 'Invalid flag reference for Country 3: /World/is.png',
      },
    ]);
  });
});
