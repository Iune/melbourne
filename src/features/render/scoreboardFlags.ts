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
 * Draws one bundled or uploaded flag into the Melbourne row slot.
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
