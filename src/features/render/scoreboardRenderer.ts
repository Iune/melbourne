import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit.js';
import canvasKitWasmUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url';
import resizeImageData from '@jsquash/resize';
import baseFontUrl from '../../assets/fonts/ZillaSlab-Regular.otf?url';
import pointsFontUrl from '../../assets/fonts/FiraSans-Regular.otf?url';
import type { Canvas, TypefaceFontProvider } from 'canvaskit-wasm';

import type {
  GenerationAssets,
  GenerationFontAsset,
} from '../assets/generationAssets';
import {
  getResultsAfterVoter,
  parseVoteValue,
  type RankedContestData,
} from '../contest/contestResults';
import {
  getBundledFlagAssetUrl,
  normalizeFlagReference,
} from '../flags/flagAssets';

const DEFAULT_IMAGE_SCALING_RATIO = 2.5;
const TEXT_LAYOUT_WIDTH = 4096;
const DEFAULT_BASE_FONT_FAMILY = 'Zilla Slab';
const DEFAULT_POINTS_FONT_FAMILY = 'Fira Sans';
const CUSTOM_BASE_FONT_FAMILY = 'Melbourne Custom Base Font';
const CUSTOM_POINTS_FONT_FAMILY = 'Melbourne Custom Points Font';

type CanvasKitModule = Awaited<ReturnType<typeof CanvasKitInit>>;

/**
 * Represents the rendering configuration for one scoreboard export run.
 */
export interface ScoreboardRenderConfig {
  accentColor: string;
  appendResultsToTitle: boolean;
  displayFlagBorders: boolean;
  displayFlags: boolean;
  mainColor: string;
  title: string;
}

/**
 * Represents the font sizes used by the scoreboard layout.
 */
interface ScoreboardFonts {
  contestHeaderSize: number;
  countrySize: number;
  entryDetailsSize: number;
  pointsSize: number;
  voterHeaderSize: number;
}

/**
 * Represents the resolved color palette used by the scoreboard layout.
 */
interface ScoreboardColors {
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
interface TextMeasurement {
  height: number;
  width: number;
}

/**
 * Represents the computed scoreboard geometry for one voter.
 */
interface ScoreboardSizes {
  entryDetailsWidth: number;
  flagOffset: number;
  height: number;
  rectangle: number;
  scalingRatio: number;
  width: number;
}

/**
 * Represents the resolved font families and bytes used during one render.
 */
interface ResolvedRenderFonts {
  baseFontBytes: ArrayBuffer;
  baseFontFamily: string;
  pointsFontBytes: ArrayBuffer;
  pointsFontFamily: string;
}

let cachedCanvasKit: Promise<CanvasKitModule> | null = null;
let cachedBaseFontBytes: Promise<ArrayBuffer> | null = null;
let cachedPointsFontBytes: Promise<ArrayBuffer> | null = null;
const cachedFlagBytes = new Map<string, Promise<ArrayBuffer>>();
const canvasKitWasmLocatePath =
  typeof process !== 'undefined' &&
  canvasKitWasmUrl.startsWith('/node_modules/')
    ? `${process.cwd()}${canvasKitWasmUrl}`
    : canvasKitWasmUrl;

/**
 * Loads the CanvasKit runtime once for reuse across all renders.
 */
async function loadCanvasKit(): Promise<CanvasKitModule> {
  if (cachedCanvasKit === null) {
    cachedCanvasKit = CanvasKitInit({
      locateFile: () => canvasKitWasmLocatePath,
    });
  }

  return cachedCanvasKit;
}

/**
 * Loads bundled font bytes once and reuses them across renders.
 */
async function loadFontBytes(
  fontUrl: string,
  fileName: string,
): Promise<ArrayBuffer> {
  const response = await fetch(fontUrl);

  if (!response.ok) {
    throw new Error(`Unable to load bundled font data for ${fileName}.`);
  }

  return response.arrayBuffer();
}

/**
 * Loads the bundled base font bytes once for reuse across renders.
 */
async function loadBaseFontBytes(): Promise<ArrayBuffer> {
  if (cachedBaseFontBytes === null) {
    cachedBaseFontBytes = loadFontBytes(baseFontUrl, 'ZillaSlab-Regular.otf');
  }

  return cachedBaseFontBytes;
}

/**
 * Loads the bundled points font bytes once for reuse across renders.
 */
async function loadPointsFontBytes(): Promise<ArrayBuffer> {
  if (cachedPointsFontBytes === null) {
    cachedPointsFontBytes = loadFontBytes(
      pointsFontUrl,
      'FiraSans-Regular.otf',
    );
  }

  return cachedPointsFontBytes;
}

/**
 * Returns the correct font family name and bytes for one optional custom font.
 */
function resolveFontAsset(
  customFont: GenerationFontAsset | null,
  customFamilyName: string,
  fallbackFamilyName: string,
  fallbackBytes: ArrayBuffer,
): { bytes: ArrayBuffer; familyName: string } {
  if (customFont === null) {
    return {
      bytes: fallbackBytes,
      familyName: fallbackFamilyName,
    };
  }

  return {
    bytes: customFont.bytes,
    familyName: customFamilyName,
  };
}

/**
 * Resolves bundled or custom font assets for one render.
 */
async function resolveRenderFonts(
  generationAssets: GenerationAssets,
): Promise<ResolvedRenderFonts> {
  const [defaultBaseFontBytes, defaultPointsFontBytes] = await Promise.all([
    loadBaseFontBytes(),
    loadPointsFontBytes(),
  ]);
  const baseFont = resolveFontAsset(
    generationAssets.customBaseFont,
    CUSTOM_BASE_FONT_FAMILY,
    DEFAULT_BASE_FONT_FAMILY,
    defaultBaseFontBytes,
  );
  const pointsFont = resolveFontAsset(
    generationAssets.customPointsFont,
    CUSTOM_POINTS_FONT_FAMILY,
    DEFAULT_POINTS_FONT_FAMILY,
    defaultPointsFontBytes,
  );

  return {
    baseFontBytes: baseFont.bytes,
    baseFontFamily: baseFont.familyName,
    pointsFontBytes: pointsFont.bytes,
    pointsFontFamily: pointsFont.familyName,
  };
}

/**
 * Loads the encoded bytes for one bundled flag reference.
 */
async function loadFlagBytes(flagReference: string): Promise<ArrayBuffer> {
  const normalizedReference = normalizeFlagReference(flagReference);

  if (normalizedReference === null) {
    throw new Error(`Invalid bundled flag reference: ${flagReference}`);
  }

  const existingBytes = cachedFlagBytes.get(normalizedReference);

  if (existingBytes !== undefined) {
    return existingBytes;
  }

  const bytesPromise = (async () => {
    const assetUrl = getBundledFlagAssetUrl(normalizedReference);

    if (assetUrl === null) {
      throw new Error(`Missing bundled flag asset: ${normalizedReference}`);
    }

    const response = await fetch(assetUrl);

    if (!response.ok) {
      throw new Error(
        `Unable to load bundled flag data for ${normalizedReference}.`,
      );
    }

    return response.arrayBuffer();
  })();

  cachedFlagBytes.set(normalizedReference, bytesPromise);

  return bytesPromise;
}

/**
 * Resolves one flag image from uploaded custom assets or bundled assets.
 */
async function loadResolvedFlagBytes(
  flagReference: string,
  generationAssets: GenerationAssets,
): Promise<ArrayBuffer> {
  const normalizedReference = normalizeFlagReference(flagReference);

  if (normalizedReference === null) {
    throw new Error(`Invalid bundled flag reference: ${flagReference}`);
  }

  const customFlagBytes = generationAssets.customFlags[normalizedReference];

  if (customFlagBytes !== undefined) {
    return customFlagBytes;
  }

  return loadFlagBytes(normalizedReference);
}

/**
 * Decodes one encoded flag image into RGBA pixels that can be resized in JS.
 */
function decodeFlagImageData(
  CanvasKit: CanvasKitModule,
  image: ReturnType<CanvasKitModule['MakeImageFromEncoded']>,
): ImageData {
  if (image === null) {
    throw new Error('Unable to decode flag image bytes.');
  }

  const width = image.width();
  const height = image.height();
  const imageInfo = {
    alphaType: CanvasKit.AlphaType.Unpremul,
    colorSpace: CanvasKit.ColorSpace.SRGB,
    colorType: CanvasKit.ColorType.RGBA_8888,
    height,
    width,
  };
  const pixels = image.readPixels(0, 0, imageInfo);

  if (pixels === null) {
    throw new Error('Unable to read decoded flag pixels.');
  }

  if (typeof ImageData === 'undefined') {
    throw new Error('ImageData is not available in this environment.');
  }

  return new ImageData(new Uint8ClampedArray(pixels), width, height);
}

/**
 * Resizes one decoded flag image to the exact scoreboard slot dimensions.
 */
async function resizeFlagImage(
  CanvasKit: CanvasKitModule,
  image: ReturnType<CanvasKitModule['MakeImageFromEncoded']>,
  width: number,
  height: number,
) {
  const decodedImageData = decodeFlagImageData(CanvasKit, image);
  // Use the @jsquash/resize library for resizing the image, as CanvasKit's resizing results in pixelated images
  const resizedImageData = await resizeImageData(decodedImageData, {
    fitMethod: 'stretch',
    height,
    method: 'mitchell',
    width,
  });
  const imageInfo = {
    alphaType: CanvasKit.AlphaType.Unpremul,
    colorSpace: CanvasKit.ColorSpace.SRGB,
    colorType: CanvasKit.ColorType.RGBA_8888,
    height: resizedImageData.height,
    width: resizedImageData.width,
  };
  const resizedImage = CanvasKit.MakeImage(
    imageInfo,
    resizedImageData.data,
    resizedImageData.width * 4,
  );

  if (resizedImage === null) {
    throw new Error('Unable to create resized flag image.');
  }

  return resizedImage;
}

/**
 * Converts a `#RRGGBB` hex color into a CanvasKit color array.
 */
function hexToColor(hex: string): Float32Array {
  const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16) / 255;

  return Float32Array.of(red, green, blue, 1);
}

/**
 * Chooses readable dark or light text for one background color.
 */
function chooseTextColor(hex: string): Float32Array {
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
function createScoreboardColors(
  config: ScoreboardRenderConfig,
): ScoreboardColors {
  return {
    background: hexToColor('#EEEEEE'),
    contestHeader: hexToColor(config.accentColor),
    contestHeaderText: chooseTextColor(config.accentColor),
    countryText: hexToColor('#7E7E7E'),
    dividerLine: hexToColor('#C4C4C4'),
    dqedPoints: hexToColor('#C4C4C4'),
    dqedPointsText: hexToColor('#212121'),
    entryDetails: hexToColor('#FAFAFA'),
    entryDetailsBorder: hexToColor('#C4C4C4'),
    entryDetailsText: hexToColor('#212121'),
    receivedPoints: hexToColor(config.accentColor),
    receivedPointsText: chooseTextColor(config.accentColor),
    totalPoints: hexToColor(config.mainColor),
    totalPointsText: chooseTextColor(config.mainColor),
    voterHeader: hexToColor(config.mainColor),
    voterHeaderText: chooseTextColor(config.mainColor),
  };
}

/**
 * Builds the scoreboard font sizes using the Melbourne scaling ratio.
 */
function createScoreboardFonts(scalingRatio: number): ScoreboardFonts {
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
function createParagraphStyle(
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
function measureText(
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
function drawText(
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
function drawFilledRectangle(
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
function drawStrokedRectangle(
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
function drawLine(
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
 * Draws one bundled flag scaled to the Melbourne row slot.
 */
async function drawFlag(
  CanvasKit: CanvasKitModule,
  canvas: Canvas,
  entryFlagReference: string,
  generationAssets: GenerationAssets,
  xOffset: number,
  yOffset: number,
  scalingRatio: number,
  drawBorder: boolean,
  borderColor: Float32Array,
): Promise<void> {
  const imageBytes = await loadResolvedFlagBytes(
    entryFlagReference,
    generationAssets,
  );
  const image = CanvasKit.MakeImageFromEncoded(imageBytes);

  if (image === null) {
    throw new Error(
      `Unable to decode bundled flag image: ${entryFlagReference}`,
    );
  }

  const targetWidth = 20 * scalingRatio;
  const aspectRatio = image.height() / image.width();
  const targetHeight = targetWidth * aspectRatio;
  const resizedWidth = Math.max(1, Math.round(targetWidth));
  const resizedHeight = Math.max(1, Math.round(targetHeight));
  const resizedImage = await resizeFlagImage(
    CanvasKit,
    image,
    resizedWidth,
    resizedHeight,
  );
  const paint = new CanvasKit.Paint();

  paint.setAntiAlias(true);

  const left = Math.round(27 * scalingRatio - resizedWidth / 2 + xOffset);
  const top = Math.round(
    87 * scalingRatio - resizedHeight / 2 + 35 * scalingRatio * yOffset,
  );

  canvas.drawImage(resizedImage, left, top, paint);

  if (drawBorder) {
    drawStrokedRectangle(
      CanvasKit,
      canvas,
      left,
      top,
      resizedWidth,
      resizedHeight,
      borderColor,
      1,
    );
  }

  resizedImage.delete();
  paint.delete();
  image.delete();
}

/**
 * Returns the displayed contest header text for one render.
 */
function getContestHeaderText(config: ScoreboardRenderConfig): string {
  return config.appendResultsToTitle ? `${config.title} Results` : config.title;
}

/**
 * Normalizes displayed vote text the same way as the C# renderer.
 */
function formatReceivedVoteText(vote: string): string {
  const trimmedVote = vote.trim();

  if (trimmedVote.endsWith('.0')) {
    const parsedVote = parseVoteValue(trimmedVote);

    if (parsedVote !== null) {
      return String(parsedVote);
    }
  }

  return trimmedVote;
}

/**
 * Computes the Melbourne scoreboard dimensions for one voter.
 */
function calculateScoreboardSizes(
  CanvasKit: CanvasKitModule,
  fontProvider: TypefaceFontProvider,
  baseFontFamily: string,
  contest: RankedContestData,
  config: ScoreboardRenderConfig,
  voterIndex: number,
): ScoreboardSizes {
  const scalingRatio = DEFAULT_IMAGE_SCALING_RATIO;
  const fonts = createScoreboardFonts(scalingRatio);
  const voterHeaderText = `Now Voting: ${contest.voterNames[voterIndex]} (${String(voterIndex + 1)}/${String(contest.numVoters)})`;
  const contestHeaderText = getContestHeaderText(config);
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
  const flagOffset = config.displayFlags ? 24 * scalingRatio : 0;
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

/**
 * Renders one scoreboard PNG for the standings after one voter reveal.
 */
export async function renderScoreboardPng(
  contest: RankedContestData,
  config: ScoreboardRenderConfig,
  voterIndex: number,
  generationAssets: GenerationAssets,
): Promise<Uint8Array> {
  const [CanvasKit, renderFonts] = await Promise.all([
    loadCanvasKit(),
    resolveRenderFonts(generationAssets),
  ]);
  const fontProvider = CanvasKit.TypefaceFontProvider.Make();

  fontProvider.registerFont(
    renderFonts.baseFontBytes,
    renderFonts.baseFontFamily,
  );
  fontProvider.registerFont(
    renderFonts.pointsFontBytes,
    renderFonts.pointsFontFamily,
  );

  const colors = createScoreboardColors(config);
  const sizes = calculateScoreboardSizes(
    CanvasKit,
    fontProvider,
    renderFonts.baseFontFamily,
    contest,
    config,
    voterIndex,
  );
  const fonts = createScoreboardFonts(sizes.scalingRatio);
  const surface = CanvasKit.MakeSurface(sizes.width, sizes.height);

  if (surface === null) {
    fontProvider.delete();
    throw new Error('Unable to create CanvasKit surface.');
  }

  const canvas = surface.getCanvas();

  canvas.clear(colors.background);

  drawFilledRectangle(
    CanvasKit,
    canvas,
    0,
    0,
    sizes.width,
    30 * sizes.scalingRatio,
    colors.voterHeader,
  );
  drawText(
    CanvasKit,
    canvas,
    fontProvider,
    renderFonts.baseFontFamily,
    fonts.voterHeaderSize,
    colors.voterHeaderText,
    `Now Voting: ${contest.voterNames[voterIndex]} (${String(voterIndex + 1)}/${String(contest.numVoters)})`,
    10 * sizes.scalingRatio,
    15 * sizes.scalingRatio,
  );

  drawFilledRectangle(
    CanvasKit,
    canvas,
    0,
    30 * sizes.scalingRatio,
    sizes.width,
    30 * sizes.scalingRatio,
    colors.contestHeader,
  );
  drawText(
    CanvasKit,
    canvas,
    fontProvider,
    renderFonts.baseFontFamily,
    fonts.contestHeaderSize,
    colors.contestHeaderText,
    getContestHeaderText(config),
    10 * sizes.scalingRatio,
    45 * sizes.scalingRatio,
  );

  const numLeft = Math.floor(contest.numEntries / 2) + (contest.numEntries % 2);
  const numRight = contest.numEntries - numLeft;

  drawFilledRectangle(
    CanvasKit,
    canvas,
    10 * sizes.scalingRatio,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numLeft,
    colors.entryDetails,
  );
  drawStrokedRectangle(
    CanvasKit,
    canvas,
    10 * sizes.scalingRatio,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numLeft,
    colors.entryDetailsBorder,
    2,
  );
  drawFilledRectangle(
    CanvasKit,
    canvas,
    20 * sizes.scalingRatio + sizes.rectangle,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numRight,
    colors.entryDetails,
  );
  drawStrokedRectangle(
    CanvasKit,
    canvas,
    20 * sizes.scalingRatio + sizes.rectangle,
    70 * sizes.scalingRatio,
    sizes.rectangle,
    35 * sizes.scalingRatio * numRight,
    colors.entryDetailsBorder,
    2,
  );

  const entries = getResultsAfterVoter(contest, voterIndex);

  for (const [index, entry] of entries.entries()) {
    const xOffset =
      index < numLeft ? 0 : 10 * sizes.scalingRatio + sizes.rectangle;
    const yOffset = index < numLeft ? index : index - numLeft;
    const baseX = 20 * sizes.scalingRatio + xOffset + sizes.flagOffset;

    if (config.displayFlags) {
      await drawFlag(
        CanvasKit,
        canvas,
        entry.flag,
        generationAssets,
        xOffset,
        yOffset,
        sizes.scalingRatio,
        config.displayFlagBorders,
        colors.entryDetailsBorder,
      );
    }

    drawText(
      CanvasKit,
      canvas,
      fontProvider,
      renderFonts.baseFontFamily,
      fonts.countrySize,
      colors.countryText,
      entry.country,
      baseX,
      80 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
    );
    drawText(
      CanvasKit,
      canvas,
      fontProvider,
      renderFonts.baseFontFamily,
      fonts.entryDetailsSize,
      colors.entryDetailsText,
      `${entry.artist} – ${entry.song}`,
      baseX,
      94 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
    );

    const totalPointsColor = entry.dqStatuses[voterIndex]
      ? colors.dqedPoints
      : colors.totalPoints;
    const totalPointsTextColor = entry.dqStatuses[voterIndex]
      ? colors.dqedPointsText
      : colors.totalPointsText;

    drawFilledRectangle(
      CanvasKit,
      canvas,
      30 * sizes.scalingRatio +
        xOffset +
        sizes.flagOffset +
        sizes.entryDetailsWidth,
      77 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      29 * sizes.scalingRatio,
      20 * sizes.scalingRatio,
      totalPointsColor,
    );
    drawText(
      CanvasKit,
      canvas,
      fontProvider,
      renderFonts.pointsFontFamily,
      fonts.pointsSize,
      totalPointsTextColor,
      String(entry.displayPoints[voterIndex]),
      44.5 * sizes.scalingRatio +
        xOffset +
        sizes.flagOffset +
        sizes.entryDetailsWidth,
      87 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      'center',
    );

    const receivedVote = entry.votes[voterIndex]?.trim() ?? '';

    if (receivedVote.length > 0) {
      drawFilledRectangle(
        CanvasKit,
        canvas,
        59 * sizes.scalingRatio +
          xOffset +
          sizes.flagOffset +
          sizes.entryDetailsWidth,
        77 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
        24 * sizes.scalingRatio,
        20 * sizes.scalingRatio,
        colors.receivedPoints,
      );
      drawText(
        CanvasKit,
        canvas,
        fontProvider,
        renderFonts.pointsFontFamily,
        fonts.pointsSize,
        colors.receivedPointsText,
        formatReceivedVoteText(receivedVote),
        71 * sizes.scalingRatio +
          xOffset +
          sizes.flagOffset +
          sizes.entryDetailsWidth,
        87 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
        'center',
      );
    }

    drawLine(
      CanvasKit,
      canvas,
      10 * sizes.scalingRatio + xOffset,
      104.5 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      10 * sizes.scalingRatio + xOffset + sizes.rectangle,
      104.5 * sizes.scalingRatio + 35 * sizes.scalingRatio * yOffset,
      colors.dividerLine,
      0.5 * sizes.scalingRatio,
    );
  }

  const image = surface.makeImageSnapshot();
  const encodedBytes = image.encodeToBytes();

  image.delete();
  surface.delete();
  fontProvider.delete();

  if (encodedBytes === null) {
    throw new Error('Unable to encode PNG image.');
  }

  return encodedBytes;
}
