import { beforeEach, describe, expect, it, vi } from 'vitest';

const { drawFilledRectangleMock, drawStrokedRectangleMock, drawLineMock, drawTextMock, drawFlagMock } = vi.hoisted(
  () => {
    return {
      drawFilledRectangleMock: vi.fn(),
      drawStrokedRectangleMock: vi.fn(),
      drawLineMock: vi.fn(),
      drawTextMock: vi.fn(),
      drawFlagMock: vi.fn(),
    };
  },
);

vi.mock('./scoreboardUtilities', async () => {
  const actual = await vi.importActual<typeof import('./scoreboardUtilities')>('./scoreboardUtilities');

  return {
    ...actual,
    drawFilledRectangle: drawFilledRectangleMock,
    drawLine: drawLineMock,
    drawStrokedRectangle: drawStrokedRectangleMock,
    drawText: drawTextMock,
  };
});

vi.mock('./scoreboardFlags', () => {
  return {
    drawFlag: drawFlagMock,
  };
});

import { ScoreboardPainter } from './scoreboardPainter';

describe('ScoreboardPainter', () => {
  const CanvasKit = { id: 'CanvasKit' } as never;
  const canvas = { id: 'canvas' } as never;
  const fontProvider = { id: 'fontProvider' } as never;
  const generationAssets = {
    customBaseFont: null,
    customFlags: {},
    customPointsFont: null,
  };
  const color = Float32Array.of(1, 1, 1, 1);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates rectangle and line drawing helpers', () => {
    const painter = new ScoreboardPainter(CanvasKit, canvas, fontProvider, generationAssets);

    painter.filledRectangle(1, 2, 3, 4, color);
    painter.strokedRectangle(5, 6, 7, 8, color, 2);
    painter.line(9, 10, 11, 12, color, 0.5);

    expect(drawFilledRectangleMock).toHaveBeenCalledWith(CanvasKit, canvas, 1, 2, 3, 4, color);
    expect(drawStrokedRectangleMock).toHaveBeenCalledWith(CanvasKit, canvas, 5, 6, 7, 8, color, 2);
    expect(drawLineMock).toHaveBeenCalledWith(CanvasKit, canvas, 9, 10, 11, 12, color, 0.5);
  });

  it('delegates text and flag drawing helpers', async () => {
    const painter = new ScoreboardPainter(CanvasKit, canvas, fontProvider, generationAssets);

    painter.text('Fira Sans', 14, color, '12', 50, 60, 'center');
    await painter.flag('World/is.png', 1, 2, 2.5, true, color);

    expect(drawTextMock).toHaveBeenCalledWith(
      CanvasKit,
      canvas,
      fontProvider,
      'Fira Sans',
      14,
      color,
      '12',
      50,
      60,
      'center',
    );
    expect(drawFlagMock).toHaveBeenCalledWith(
      CanvasKit,
      canvas,
      'World/is.png',
      generationAssets,
      1,
      2,
      2.5,
      true,
      color,
    );
  });
});
