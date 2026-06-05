import { describe, expect, it } from 'vitest';

import { getBundledFlagAssetReferences, getBundledFlagMetadataReferences } from './flagAssets';

describe('bundled flag metadata', () => {
  it('contains one metadata entry for every bundled flag asset', () => {
    expect([...getBundledFlagMetadataReferences()].sort()).toEqual([...getBundledFlagAssetReferences()].sort());
  });
});
