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
 * Converts a hex color string into the normalized RGBA array format expected by CanvasKit.
 *
 * @param hex A six-digit RGB color string such as `#FCB906` or `FCB906`. The alpha channel is
 * always treated as fully opaque because scoreboard colors do not currently support transparency.
 * @returns A four-element `Float32Array` containing red, green, blue, and alpha values in the
 * `0..1` range required by CanvasKit paint APIs.
 */
export function hexToColor(hex: string): Float32Array {
  const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16) / 255;

  return Float32Array.of(red, green, blue, 1);
}

/**
 * Chooses a readable foreground color for text that will be drawn on top of a background color.
 *
 * @param hex The background color that the text will sit on top of, provided as a six-digit RGB
 * string with or without a leading `#`.
 * @returns A dark gray or white CanvasKit color array, depending on the perceived luminance of
 * the supplied background color.
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
 * Builds the complete color palette used to render a scoreboard image.
 *
 * @param mainColor The user-selected primary color used for elements such as the voter header and
 * total-points badges.
 * @param accentColor The user-selected accent color used for elements such as the contest header
 * and received-points badges.
 * @returns A `ScoreboardColors` object containing every resolved fill, border, and text color
 * needed during rendering.
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
 * Computes the scoreboard's font sizes from a single image scaling ratio.
 *
 * @param scalingRatio The multiplier applied to the base layout measurements so that all text
 * sizes stay proportional to the exported image size.
 * @returns A `ScoreboardFonts` object containing the resolved font sizes for each text role in the
 * layout.
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
 * Creates a CanvasKit paragraph style for drawing or measuring a single piece of text.
 *
 * @param CanvasKit The initialized CanvasKit module that provides paragraph and text-style
 * constructors.
 * @param fontFamily The registered font family name that CanvasKit should use when laying out the
 * text.
 * @param fontSize The font size, in scoreboard pixels, to apply to the paragraph.
 * @param color The resolved text color to assign to the paragraph's text style.
 * @returns A configured CanvasKit paragraph style that can be passed to a paragraph builder.
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
 * Measures how much space a single text run will occupy when rendered with CanvasKit.
 *
 * @param CanvasKit The initialized CanvasKit module used to build and lay out paragraphs.
 * @param fontProvider The font provider containing the registered base and points fonts for the
 * current render.
 * @param fontFamily The registered font family name to use for measurement.
 * @param fontSize The font size, in scoreboard pixels, to use when laying out the text.
 * @param text The exact string whose rendered width and height should be measured.
 * @returns The measured width of the longest laid-out line and the total paragraph height.
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
 * Draws a single text label onto the scoreboard canvas.
 *
 * @param CanvasKit The initialized CanvasKit module that provides paragraph layout and painting
 * primitives.
 * @param canvas The destination canvas belonging to the scoreboard surface being rendered.
 * @param fontProvider The font provider containing the registered font families available to the
 * current render.
 * @param fontFamily The registered font family name that should be used for this label.
 * @param fontSize The font size, in scoreboard pixels, to use for the label.
 * @param color The resolved text color to apply to the label.
 * @param text The text content to draw.
 * @param x The horizontal anchor position for the label. For centered text this represents the
 * midpoint; for left-aligned text it represents the left edge.
 * @param y The vertical midpoint around which the paragraph is positioned.
 * @param alignment Whether `x` should be interpreted as a left edge or a center point.
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
 * Draws a filled rectangle on the scoreboard canvas.
 *
 * @param CanvasKit The initialized CanvasKit module that provides paint objects and rectangle
 * helpers.
 * @param canvas The destination canvas belonging to the scoreboard surface being rendered.
 * @param x The rectangle's left edge in scoreboard pixels.
 * @param y The rectangle's top edge in scoreboard pixels.
 * @param width The rectangle's width in scoreboard pixels.
 * @param height The rectangle's height in scoreboard pixels.
 * @param color The fill color to apply to the rectangle.
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
 * Draws a stroked rectangle border on the scoreboard canvas.
 *
 * @param CanvasKit The initialized CanvasKit module that provides paint objects and rectangle
 * helpers.
 * @param canvas The destination canvas belonging to the scoreboard surface being rendered.
 * @param x The border's left edge in scoreboard pixels.
 * @param y The border's top edge in scoreboard pixels.
 * @param width The border's width in scoreboard pixels.
 * @param height The border's height in scoreboard pixels.
 * @param color The stroke color to apply to the border.
 * @param strokeWidth The thickness of the rectangle outline in scoreboard pixels.
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
 * Draws a straight line segment on the scoreboard canvas.
 *
 * @param CanvasKit The initialized CanvasKit module that provides paint objects and line-drawing
 * primitives.
 * @param canvas The destination canvas belonging to the scoreboard surface being rendered.
 * @param startX The horizontal position of the line's starting point.
 * @param startY The vertical position of the line's starting point.
 * @param endX The horizontal position of the line's ending point.
 * @param endY The vertical position of the line's ending point.
 * @param color The stroke color to apply to the line.
 * @param strokeWidth The thickness of the line in scoreboard pixels.
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
 * Computes the overall geometry needed to render a scoreboard for one voter reveal.
 *
 * @param CanvasKit The initialized CanvasKit module used for text measurement.
 * @param fontProvider The font provider containing the registered fonts for the current render.
 * @param baseFontFamily The registered base font family name used for contest, country, and entry
 * text measurements.
 * @param contest The fully ranked contest data whose entry names, voter names, and counts drive
 * the scoreboard layout.
 * @param contestHeaderText The exact contest title text that will be drawn in the scoreboard
 * header.
 * @param displayFlags Whether the current render includes flag images, which affects horizontal
 * spacing.
 * @param voterIndex The zero-based voter index being rendered, used to measure the current voter
 * header text.
 * @returns A `ScoreboardSizes` object containing the computed export dimensions and key layout
 * offsets used throughout rendering.
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
