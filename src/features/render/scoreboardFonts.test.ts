import { TextDecoder, TextEncoder } from 'node:util';
import { describe, expect, it } from 'vitest';

import type { GenerationAssets } from '../assets/generationAssets';
import { resolveRenderFonts } from './scoreboardFonts';

const EMPTY_GENERATION_ASSETS: GenerationAssets = {
  customBaseFont: null,
  customFlags: {},
  customPointsFont: null,
};

describe('resolveRenderFonts', () => {
  it('loads bundled default fonts when no custom fonts are provided', async () => {
    const fonts = await resolveRenderFonts(EMPTY_GENERATION_ASSETS);

    expect(fonts.baseFontFamily).toBe('Zilla Slab');
    expect(fonts.pointsFontFamily).toBe('Fira Sans');
    expect(fonts.baseFontBytes.byteLength).toBeGreaterThan(0);
    expect(fonts.pointsFontBytes.byteLength).toBeGreaterThan(0);
  });

  it('uses uploaded custom fonts when provided', async () => {
    const customBaseBytes = new TextEncoder().encode('custom-base-font').buffer;
    const customPointsBytes = new TextEncoder().encode('custom-points-font').buffer;
    const fonts = await resolveRenderFonts({
      customBaseFont: {
        bytes: customBaseBytes,
        fileName: 'base.otf',
      },
      customFlags: {},
      customPointsFont: {
        bytes: customPointsBytes,
        fileName: 'points.otf',
      },
    });

    expect(fonts.baseFontFamily).toBe('Melbourne Custom Base Font');
    expect(fonts.pointsFontFamily).toBe('Melbourne Custom Points Font');
    expect(new TextDecoder().decode(fonts.baseFontBytes)).toBe('custom-base-font');
    expect(new TextDecoder().decode(fonts.pointsFontBytes)).toBe('custom-points-font');
  });
});
