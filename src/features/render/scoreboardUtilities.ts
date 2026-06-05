import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit.js';
import type { Canvas, TypefaceFontProvider } from 'canvaskit-wasm';

import type { RankedContestData } from '../contest/contestResults';

const TEXT_LAYOUT_WIDTH = 4096;
export const DEFAULT_IMAGE_SCALING_RATIO = 2.5;

export type CanvasKitModule = Awaited<ReturnType<typeof CanvasKitInit>>;

/**
 * Represents the font sizes used by the scoreboard layout.
 */
export interface ScoreboardFonts {
  contestHeaderSize: number;
  countrySize: number;
  entryDetailsSize: number;
  pointsSize: number;
  voterHeaderSize: number;
}

/**
 * Represents the resolved color palette used by the scoreboard layout.
 */
export interface ScoreboardColors {
  background: Float32Array;
  contestHeader: Float32Array;
  contestHeaderText: Float32Array;
  countryText: Float32Array;
  dividerLine: Float32Array;
  dqedPoints: Float32Array;
  dqedPointsText: Float32Array;
  entryDetails: Float32Array;
  entryDetailsBorder: Float32Array;
  entryDetailsText: Float32Array;
  receivedPoints: Float32Array;
  receivedPointsText: Float32Array;
  totalPoints: Float32Array;
  totalPointsText: Float32Array;
  voterHeader: Float32Array;
  voterHeaderText: Float32Array;
}

/**
 * Represents the measured width and height for one piece of text.
 */
export interface TextMeasurement {
  height: number;
  width: number;
}

/**
 * Represents the computed scoreboard geometry for one voter.
 */
export interface ScoreboardSizes {
  entryDetailsWidth: number;
  flagOffset: number;
  height: number;
  rectangle: number;
  scalingRatio: number;
  width: number;
}

/**
 * Converts a `#RRGGBB` hex color into a CanvasKit color array.
 */
export function hexToColor(hex: string): Float32Array {
  const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16) / 255;

  return Float32Array.of(red, green, blue, 1);
}

/**
 * Chooses readable dark or light text for one background color.
 */
export function chooseTextColor(hex: string): Float32Array {
  const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);
  const luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;

  return luminance > 0.5 ? hexToColor('#212121') : hexToColor('#FFFFFF');
}

/**
 * Builds the fixed Melbourne color palette plus user-selected accent colors.
 */
export function createScoreboardColors(
  mainColor: string,
  accentColor: string,
): ScoreboardColors {
  return {
    background: hexToColor('#EEEEEE'),
    contestHeader: hexToColor(accentColor),
    contestHeaderText: chooseTextColor(accentColor),
    countryText: hexToColor('#7E7E7E'),
    dividerLine: hexToColor('#C4C4C4'),
    dqedPoints: hexToColor('#C4C4C4'),
    dqedPointsText: hexToColor('#212121'),
    entryDetails: hexToColor('#FAFAFA'),
    entryDetailsBorder: hexToColor('#C4C4C4'),
    entryDetailsText: hexToColor('#212121'),
    receivedPoints: hexToColor(accentColor),
    receivedPointsText: chooseTextColor(accentColor),
    totalPoints: hexToColor(mainColor),
    totalPointsText: chooseTextColor(mainColor),
    voterHeader: hexToColor(mainColor),
    voterHeaderText: chooseTextColor(mainColor),
  };
}

/**
 * Builds the scoreboard font sizes using the Melbourne scaling ratio.
 */
export function createScoreboardFonts(scalingRatio: number): ScoreboardFonts {
  return {
    contestHeaderSize: 14 * scalingRatio,
    countrySize: 12 * scalingRatio,
    entryDetailsSize: 12 * scalingRatio,
    pointsSize: 14 * scalingRatio,
    voterHeaderSize: 14 * scalingRatio,
  };
}

/**
 * Creates a reusable paragraph style for one font family and size.
 */
export function createParagraphStyle(
  CanvasKit: CanvasKitModule,
  fontFamily: string,
  fontSize: number,
  color: Float32Array,
) {
  return new CanvasKit.ParagraphStyle({
    disableHinting: false,
    textStyle: {
      color,
      fontFamilies: [fontFamily],
      fontSize,
    },
  });
}

/**
 * Measures one line of text using CanvasKit paragraph layout.
 */
export function measureText(
  CanvasKit: CanvasKitModule,
  fontProvider: TypefaceFontProvider,
  fontFamily: string,
  fontSize: number,
  text: string,
): TextMeasurement {
  const paragraphStyle = createParagraphStyle(
    CanvasKit,
    fontFamily,
    fontSize,
    hexToColor('#000000'),
  );
  const paragraphBuilder = CanvasKit.ParagraphBuilder.MakeFromFontProvider(
    paragraphStyle,
    fontProvider,
  );

  paragraphBuilder.addText(text);

  const paragraph = paragraphBuilder.build();

  paragraph.layout(TEXT_LAYOUT_WIDTH);

  const measurement = {
    height: paragraph.getHeight(),
    width: paragraph.getLongestLine(),
  };

  paragraph.delete();
  paragraphBuilder.delete();

  return measurement;
}

/**
 * Draws one text label using the same midpoint positioning approach as C#.
 */
export function drawText(
  CanvasKit: CanvasKitModule,
  canvas: Canvas,
  fontProvider: TypefaceFontProvider,
  fontFamily: string,
  fontSize: number,
  color: Float32Array,
  text: string,
  x: number,
  y: number,
  alignment: 'center' | 'left' = 'left',
): void {
  const paragraphStyle = createParagraphStyle(
    CanvasKit,
    fontFamily,
    fontSize,
    color,
  );
  const paragraphBuilder = CanvasKit.ParagraphBuilder.MakeFromFontProvider(
    paragraphStyle,
    fontProvider,
  );

  paragraphBuilder.addText(text);

  const paragraph = paragraphBuilder.build();

  paragraph.layout(TEXT_LAYOUT_WIDTH);

  const textWidth = paragraph.getLongestLine();
  const textHeight = paragraph.getHeight();
  const paragraphX = alignment === 'center' ? x - textWidth / 2 : x;
  const paragraphY = y - textHeight / 2;

  canvas.drawParagraph(paragraph, paragraphX, paragraphY);

  paragraph.delete();
  paragraphBuilder.delete();
}

/**
 * Draws one filled rectangle.
 */
export function drawFilledRectangle(
  CanvasKit: CanvasKitModule,
  canvas: Canvas,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Float32Array,
): void {
  const paint = new CanvasKit.Paint();

  paint.setAntiAlias(true);
  paint.setColor(color);
  paint.setStyle(CanvasKit.PaintStyle.Fill);

  canvas.drawRect(CanvasKit.XYWHRect(x, y, width, height), paint);
  paint.delete();
}

/**
 * Draws one stroked rectangle border.
 */
export function drawStrokedRectangle(
  CanvasKit: CanvasKitModule,
  canvas: Canvas,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Float32Array,
  strokeWidth: number,
): void {
  const paint = new CanvasKit.Paint();

  paint.setAntiAlias(true);
  paint.setColor(color);
  paint.setStyle(CanvasKit.PaintStyle.Stroke);
  paint.setStrokeWidth(strokeWidth);

  canvas.drawRect(CanvasKit.XYWHRect(x, y, width, height), paint);
  paint.delete();
}

/**
 * Draws one divider line.
 */
export function drawLine(
  CanvasKit: CanvasKitModule,
  canvas: Canvas,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: Float32Array,
  strokeWidth: number,
): void {
  const paint = new CanvasKit.Paint();

  paint.setAntiAlias(true);
  paint.setColor(color);
  paint.setStyle(CanvasKit.PaintStyle.Stroke);
  paint.setStrokeWidth(strokeWidth);

  canvas.drawLine(startX, startY, endX, endY, paint);
  paint.delete();
}

/**
 * Computes the Melbourne scoreboard dimensions for one voter.
 */
export function calculateScoreboardSizes(
  CanvasKit: CanvasKitModule,
  fontProvider: TypefaceFontProvider,
  baseFontFamily: string,
  contest: RankedContestData,
  contestHeaderText: string,
  displayFlags: boolean,
  voterIndex: number,
): ScoreboardSizes {
  const scalingRatio = DEFAULT_IMAGE_SCALING_RATIO;
  const fonts = createScoreboardFonts(scalingRatio);
  const voterHeaderText = `Now Voting: ${contest.voterNames[voterIndex]} (${String(voterIndex + 1)}/${String(contest.numVoters)})`;
  const maxCountryWidth = Math.max(
    ...contest.entries.map((entry) => {
      return measureText(
        CanvasKit,
        fontProvider,
        baseFontFamily,
        fonts.countrySize,
        entry.country,
      ).width;
    }),
  );
  const maxEntryWidth = Math.max(
    ...contest.entries.map((entry) => {
      return measureText(
        CanvasKit,
        fontProvider,
        baseFontFamily,
        fonts.entryDetailsSize,
        `${entry.artist} – ${entry.song}`,
      ).width;
    }),
  );
  const voterHeaderWidth = measureText(
    CanvasKit,
    fontProvider,
    baseFontFamily,
    fonts.voterHeaderSize,
    voterHeaderText,
  ).width;
  const contestHeaderWidth = measureText(
    CanvasKit,
    fontProvider,
    baseFontFamily,
    fonts.contestHeaderSize,
    contestHeaderText,
  ).width;
  const flagOffset = displayFlags ? 24 * scalingRatio : 0;
  const rectangle =
    Math.max(maxCountryWidth, maxEntryWidth) + flagOffset + 80 * scalingRatio;
  const width = Math.ceil(
    Math.max(
      Math.max(
        30 * scalingRatio + 2 * rectangle,
        48 * scalingRatio + contestHeaderWidth,
      ),
      10 * scalingRatio + voterHeaderWidth,
    ),
  );
  const leftColumnCount =
    Math.floor(contest.numEntries / 2) + (contest.numEntries % 2);
  const height = Math.ceil(
    10 * scalingRatio + 35 * scalingRatio * leftColumnCount + 70 * scalingRatio,
  );

  return {
    entryDetailsWidth: maxEntryWidth,
    flagOffset,
    height,
    rectangle,
    scalingRatio,
    width,
  };
}
