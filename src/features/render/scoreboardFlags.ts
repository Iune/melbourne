import resizeImageData from '@jsquash/resize';
import type { Canvas } from 'canvaskit-wasm';

import type { GenerationAssets } from '../assets/generationAssets';
import {
  getBundledFlagAssetUrl,
  normalizeFlagReference,
} from '../flags/flagAssets';
import {
  drawStrokedRectangle,
  type CanvasKitModule,
} from './scoreboardUtilities';

const FLAG_WIDTH = 20;
const FLAG_CENTER_X = 27;
const FLAG_CENTER_Y = 87;
const FLAG_ROW_HEIGHT = 35;

const cachedFlagBytes = new Map<string, Promise<ArrayBuffer>>();

/**
 * Loads and caches the encoded bytes for one bundled flag asset.
 *
 * @param flagReference The logical flag reference from contest data, such as `World/is.png`,
 * before any uploaded custom flags are considered.
 * @returns The encoded bytes for the bundled flag image referenced by the contest data.
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
 * Resolves flag bytes from either uploaded custom assets or the bundled flag packs.
 *
 * @param flagReference The logical flag reference from contest data, such as `ISC/Kaledonii.png`
 * or `Custom/A.png`.
 * @param generationAssets The in-memory asset bundle for the current export run, including any
 * uploaded custom flags.
 * @returns The encoded image bytes that should be decoded and rendered for the requested flag.
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
 * Decodes an encoded flag image into RGBA pixel data that can be resized before drawing.
 *
 * @param CanvasKit The initialized CanvasKit module used to read pixels from the decoded image.
 * @param image The decoded CanvasKit image created from encoded bundled or uploaded flag bytes.
 * @returns An `ImageData` instance containing unpremultiplied RGBA pixels for the decoded image.
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
 * Resizes a decoded flag image to the exact pixel dimensions needed for the current row slot.
 *
 * @param CanvasKit The initialized CanvasKit module used to reconstruct an image from resized
 * pixel data.
 * @param image The decoded CanvasKit image that should be resized.
 * @param width The exact output width, in device pixels, that the flag should occupy.
 * @param height The exact output height, in device pixels, that the flag should occupy.
 * @returns A new CanvasKit image already resized to the target slot dimensions.
 */
async function resizeFlagImage(
  CanvasKit: CanvasKitModule,
  image: ReturnType<CanvasKitModule['MakeImageFromEncoded']>,
  width: number,
  height: number,
) {
  const decodedImageData = decodeFlagImageData(CanvasKit, image);

  // Use @jsquash/resize because CanvasKit's own image scaling produced visibly pixelated flags.
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
 * Draws a single bundled or uploaded flag into an entry row.
 *
 * @param CanvasKit The initialized CanvasKit module used for image decoding, resizing, and
 * painting.
 * @param canvas The destination canvas belonging to the scoreboard surface being rendered.
 * @param entryFlagReference The logical flag reference from the contest entry, such as
 * `World/is.png` or `Custom/A.png`.
 * @param generationAssets The in-memory asset bundle for the current export run, including any
 * uploaded custom flags.
 * @param xOffset The horizontal offset for the current scoreboard column, already scaled for the
 * left or right half of the layout.
 * @param yOffset The zero-based row offset within the current column.
 * @param scalingRatio The global scoreboard scaling ratio used to convert layout constants into
 * rendered pixel sizes.
 * @param drawBorder Whether a border should be drawn around the resized flag image.
 * @param borderColor The resolved border color to use when `drawBorder` is enabled.
 */
export async function drawFlag(
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

  const targetWidth = FLAG_WIDTH * scalingRatio;
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

  const left = Math.round(
    FLAG_CENTER_X * scalingRatio - resizedWidth / 2 + xOffset,
  );
  const top = Math.round(
    FLAG_CENTER_Y * scalingRatio -
      resizedHeight / 2 +
      FLAG_ROW_HEIGHT * scalingRatio * yOffset,
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
