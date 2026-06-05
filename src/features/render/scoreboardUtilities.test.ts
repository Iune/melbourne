import { describe, expect, it } from 'vitest';

import {
  createScoreboardColors,
  createScoreboardFonts,
  DEFAULT_IMAGE_SCALING_RATIO,
  hexToColor,
  chooseTextColor,
} from './scoreboardUtilities';

describe('scoreboardUtilities', () => {
  it('converts hex colors into CanvasKit-compatible float arrays', () => {
    expect(Array.from(hexToColor('#FF8000'))).toEqual([
      expect.closeTo(1),
      expect.closeTo(128 / 255),
      expect.closeTo(0),
      expect.closeTo(1),
    ]);
    expect(Array.from(hexToColor('000000'))).toEqual([0, 0, 0, 1]);
  });

  it('chooses dark text for light colors and light text for dark colors', () => {
    expect(Array.from(chooseTextColor('#FFFFFF'))).toEqual(Array.from(hexToColor('#212121')));
    expect(Array.from(chooseTextColor('#000000'))).toEqual(Array.from(hexToColor('#FFFFFF')));
  });

  it('builds scoreboard colors from the selected main and accent colors', () => {
    const colors = createScoreboardColors('#2F292B', '#FCB906');

    expect(Array.from(colors.contestHeader)).toEqual(Array.from(hexToColor('#FCB906')));
    expect(Array.from(colors.totalPoints)).toEqual(Array.from(hexToColor('#2F292B')));
    expect(Array.from(colors.entryDetailsBorder)).toEqual(Array.from(hexToColor('#C4C4C4')));
  });

  it('builds scoreboard fonts from the Melbourne scaling ratio', () => {
    const fonts = createScoreboardFonts(DEFAULT_IMAGE_SCALING_RATIO);

    expect(fonts).toEqual({
      contestHeaderSize: 14 * DEFAULT_IMAGE_SCALING_RATIO,
      countrySize: 12 * DEFAULT_IMAGE_SCALING_RATIO,
      entryDetailsSize: 12 * DEFAULT_IMAGE_SCALING_RATIO,
      pointsSize: 14 * DEFAULT_IMAGE_SCALING_RATIO,
      voterHeaderSize: 14 * DEFAULT_IMAGE_SCALING_RATIO,
    });
  });
});
