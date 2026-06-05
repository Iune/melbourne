import { describe, expect, it } from 'vitest';

import type { ContestData } from '../contest/contestTypes';
import { validateFlagReferences } from './flagValidation';

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

/**
 * Creates an uploaded custom flag file for validation tests.
 */
function createCustomFlagFile(fileName: string): File {
  return new File(['flag'], fileName, { type: 'image/png' });
}

describe('validateFlagReferences', () => {
  it('accepts valid bundled flag references', () => {
    const errors = validateFlagReferences(
      createContestWithFlags(['World/is.png', 'ISC/Kaledonii.png']),
    );

    expect(errors).toEqual([]);
  });

  it('reports missing bundled flags as blocking errors', () => {
    const errors = validateFlagReferences(
      createContestWithFlags(['World/not-real.png']),
    );

    expect(errors).toEqual([
      {
        message: 'Missing bundled flag for Country 1: World/not-real.png',
      },
    ]);
  });

  it('rejects escaping or otherwise unsafe flag references', () => {
    const errors = validateFlagReferences(
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

  it('accepts valid uploaded custom flag references', () => {
    const errors = validateFlagReferences(
      createContestWithFlags(['Custom/A.png']),
      [createCustomFlagFile('A.png')],
    );

    expect(errors).toEqual([]);
  });

  it('reports missing uploaded custom flags as blocking errors', () => {
    const errors = validateFlagReferences(
      createContestWithFlags(['Custom/A.png']),
    );

    expect(errors).toEqual([
      {
        message: 'Missing custom flag for Country 1: Custom/A.png',
      },
    ]);
  });

  it('uses only the current uploaded custom flag selection', () => {
    const errors = validateFlagReferences(
      createContestWithFlags(['Custom/A.png']),
      [createCustomFlagFile('B.png')],
    );

    expect(errors).toEqual([
      {
        message: 'Missing custom flag for Country 1: Custom/A.png',
      },
    ]);
  });

  it('reports duplicate uploaded custom flag names as blocking errors', () => {
    const errors = validateFlagReferences(createContestWithFlags([]), [
      createCustomFlagFile('A.png'),
      createCustomFlagFile('A.png'),
    ]);

    expect(errors).toEqual([
      {
        message: 'Duplicate uploaded custom flag file: Custom/A.png',
      },
    ]);
  });
});
