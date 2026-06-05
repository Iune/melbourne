import { describe, expect, it } from 'vitest';

import { buildGenerationAssets, createCustomFlagReferenceSet, validateCustomFlagUploads } from './generationAssets';

/**
 * Creates a file object for browser-style upload tests.
 */
function createUploadFile(fileName: string, contents = 'test', type = 'image/png'): File {
  return new File([contents], fileName, { type });
}

describe('generationAssets', () => {
  it('validates duplicate uploaded custom flag names as blocking errors', () => {
    expect(validateCustomFlagUploads([createUploadFile('A.png'), createUploadFile('A.png')])).toEqual([
      {
        message: 'Duplicate uploaded custom flag file: Custom/A.png',
      },
    ]);
  });

  it('builds the normalized custom flag reference set', () => {
    expect([...createCustomFlagReferenceSet([createUploadFile('A.png')])].sort()).toEqual(['Custom/A.png']);
  });

  it('loads custom fonts and custom flags into in-memory generation assets', async () => {
    const assets = await buildGenerationAssets({
      baseFontFile: createUploadFile('base.otf', 'base-font', 'font/otf'),
      customFlagFiles: [createUploadFile('A.png', 'flag-a')],
      pointsFontFile: createUploadFile('points.ttf', 'points-font', 'font/ttf'),
    });

    expect(assets.customBaseFont?.fileName).toBe('base.otf');
    expect(assets.customPointsFont?.fileName).toBe('points.ttf');
    expect(Object.keys(assets.customFlags)).toEqual(['Custom/A.png']);
    expect(new TextDecoder().decode(assets.customFlags['Custom/A.png'])).toBe('flag-a');
  });
});
