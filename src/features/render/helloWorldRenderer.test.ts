import { describe, expect, it } from 'vitest';

import { renderHelloWorldPng } from './helloWorldRenderer';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

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

describe('renderHelloWorldPng', () => {
  it('renders a non-empty png image with positive dimensions', async () => {
    const bytes = await renderHelloWorldPng();

    expect(bytes.length).toBeGreaterThan(0);
    expect(
      PNG_SIGNATURE.every((signatureByte, index) => {
        return bytes[index] === signatureByte;
      }),
    ).toBe(true);

    const width = readUint32(bytes, 16);
    const height = readUint32(bytes, 20);

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
